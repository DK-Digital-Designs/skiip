import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import { sendTransactionalNotifications } from "../_shared/notifications.ts"

const log = logger('order-transition')

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: [],
  paid: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['collected', 'cancelled'],
  collected: [],
  cancelled: [],
  refunded: [],
}

const EVENT_MAP: Record<string, 'order_preparing' | 'order_ready' | 'order_cancelled' | undefined> = {
  preparing: 'order_preparing',
  ready: 'order_ready',
  cancelled: 'order_cancelled',
}

interface TransitionRequest {
  orderId: string
  status: string
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  if (!isAllowedOrigin(origin)) {
    log.warn('Rejected request from disallowed origin', { origin })
    return jsonResponse({ error: 'Origin not allowed' }, 403, origin)
  }

  try {
    const user = await requireUser(req)
    const supabase = createServiceClient()
    const body = (await req.json()) as TransitionRequest

    if (!body.orderId || !body.status) {
      return jsonResponse({ error: 'orderId and status are required' }, 400, origin)
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, store_id, status, payment_status, inventory_committed_at, inventory_restocked_at')
      .eq('id', body.orderId)
      .single()

    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404, origin)
    }

    if (user.role !== 'admin') {
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', order.store_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (storeError) {
        throw storeError
      }

      if (!store) {
        return jsonResponse({ error: 'Forbidden' }, 403, origin)
      }
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[order.status] || []
    if (!allowedNextStatuses.includes(body.status)) {
      return jsonResponse(
        { error: `Invalid status transition: ${order.status} -> ${body.status}` },
        409,
        origin,
      )
    }

    const updates: Record<string, unknown> = { status: body.status }
    if (body.status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString()
      if (order.inventory_committed_at && !order.inventory_restocked_at) {
        const { error: restockError } = await supabase.rpc('restock_order_inventory', { p_order_id: order.id })
        if (restockError) {
          throw restockError
        }
        updates.inventory_restocked_at = new Date().toISOString()
      }
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id)
      .select('id, status')
      .single()

    if (updateError || !updatedOrder) {
      throw updateError || new Error('Failed to update order')
    }

    await supabase.from('audit_logs').insert({
      event_type: 'order_status_changed',
      entity_type: 'order',
      entity_id: order.id,
      actor_user_id: user.id,
      actor_role: user.role,
      payload: {
        old_status: order.status,
        new_status: body.status,
      },
    })

    const notificationEvent = EVENT_MAP[body.status]
    if (notificationEvent) {
      await sendTransactionalNotifications({
        supabase,
        orderId: order.id,
        eventType: notificationEvent,
        correlationId: crypto.randomUUID(),
      })
    }

    return jsonResponse({ order: updatedOrder }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Order transition failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Order transition failed' }, 400, origin)
  }
})
