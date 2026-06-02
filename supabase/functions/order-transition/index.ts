import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import { sendTransactionalNotificationsBestEffort } from "../_shared/notifications.ts"
import { createSupportReferenceCode } from "../_shared/support-requests.ts"
import {
  getAllowedOrderTransitions,
  isBuyerOwnedUnpaidCancellation,
  isIdempotentUnpaidCancellation,
  isPendingUnpaidCancellation,
} from "../_shared/order-transitions.ts"

const log = logger('order-transition')
const ORDER_CANCELLATION_CLOSED_MESSAGE = 'Orders cannot be cancelled once preparation has started.'

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
      .select('id, user_id, store_id, status, payment_status, customer_email, customer_phone, inventory_committed_at, inventory_restocked_at')
      .eq('id', body.orderId)
      .single()

    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404, origin)
    }

    const isUnpaidPendingCancellation = isPendingUnpaidCancellation(order, body.status)
    const isIdempotentCancellation = isIdempotentUnpaidCancellation(order, body.status)
    const isBuyerOwnedCancellation = isBuyerOwnedUnpaidCancellation(order, body.status, user.id)

    if (user.role !== 'admin' && !isBuyerOwnedCancellation) {
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

    if (isIdempotentCancellation) {
      return jsonResponse(
        { order: { id: order.id, status: order.status } },
        200,
        origin,
      )
    }

    if (body.status === 'cancelled' && ['preparing', 'ready', 'collected'].includes(order.status)) {
      return jsonResponse(
        {
          error: 'ORDER_CANCELLATION_CLOSED',
          message: ORDER_CANCELLATION_CLOSED_MESSAGE,
        },
        409,
        origin,
      )
    }

    const allowedNextStatuses = getAllowedOrderTransitions(order.status)
    if (!allowedNextStatuses.includes(body.status)) {
      return jsonResponse(
        { error: `Invalid status transition: ${order.status} -> ${body.status}` },
        409,
        origin,
      )
    }

    if (order.status === 'pending' && body.status === 'cancelled' && !isUnpaidPendingCancellation) {
      return jsonResponse(
        { error: 'Only unpaid pending orders can be cancelled through this path' },
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
      .eq('status', order.status)
      .eq('payment_status', order.payment_status)
      .select('id, status')
      .maybeSingle()

    if (updateError || !updatedOrder) {
      throw updateError || new Error('Order state changed before transition could be applied')
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

    if (user.role === 'seller' && body.status === 'cancelled' && order.payment_status === 'succeeded') {
      const { data: buyerProfile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', order.user_id)
        .maybeSingle()

      const contactEmail = order.customer_email || buyerProfile?.email || 'unavailable@skiip.co.uk'
      const { data: cancellationCase, error: cancellationError } = await supabase
        .from('support_requests')
        .insert({
          reference_code: createSupportReferenceCode(),
          source: 'vendor_cancellation',
          reporter_user_id: user.id,
          reporter_role: 'seller',
          order_id: order.id,
          store_id: order.store_id,
          contact_name: buyerProfile?.full_name || contactEmail,
          contact_email: contactEmail,
          contact_phone: order.customer_phone || null,
          issue_type: 'vendor_cancelled',
          description: 'A vendor cancelled an already paid order. Admin refund review is required before this case is complete.',
          status: 'open',
          priority: 'high',
        })
        .select('id')
        .maybeSingle()

      if (cancellationError && cancellationError.code !== '23505') {
        log.error('Failed to create paid cancellation refund-review case', {
          orderId: order.id,
          error: cancellationError.message,
        })
      } else if (cancellationCase) {
        await supabase.from('audit_logs').insert({
          event_type: 'support_request_created',
          entity_type: 'support_request',
          entity_id: cancellationCase.id,
          actor_user_id: user.id,
          actor_role: user.role,
          payload: {
            source: 'vendor_cancellation',
            order_id: order.id,
            priority: 'high',
          },
        })
      }
    }

    const notificationEvent = EVENT_MAP[body.status]
    if (notificationEvent) {
      await sendTransactionalNotificationsBestEffort({
        supabase,
        orderId: order.id,
        eventType: notificationEvent,
        correlationId: crypto.randomUUID(),
        functionName: 'order-transition',
        operation: 'order_status_transition',
        metadata: {
          actorUserId: user.id,
          actorRole: user.role,
          previousStatus: order.status,
          nextStatus: body.status,
        },
      })
    }

    return jsonResponse({ order: updatedOrder }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Order transition failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Order transition failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
