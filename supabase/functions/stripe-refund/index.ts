import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import { sendTransactionalNotifications } from "../_shared/notifications.ts"

const log = logger('stripe-refund')

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

interface RefundRequest {
  orderId: string
  reason?: string
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
    if (user.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    const body = (await req.json()) as RefundRequest
    if (!body.orderId) {
      return jsonResponse({ error: 'orderId is required' }, 400, origin)
    }

    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, payment_intent_id, charge_id, inventory_committed_at, inventory_restocked_at')
      .eq('id', body.orderId)
      .single()

    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404, origin)
    }

    if (order.payment_status !== 'succeeded' || order.status === 'refunded') {
      return jsonResponse({ error: 'Only succeeded payments can be refunded once' }, 409, origin)
    }

    const refund = await stripe.refunds.create(
      order.payment_intent_id
        ? {
            payment_intent: order.payment_intent_id,
            reason: 'requested_by_customer',
            metadata: { order_id: order.id },
          }
        : {
            charge: order.charge_id,
            reason: 'requested_by_customer',
            metadata: { order_id: order.id },
          },
    )

    const updates: Record<string, unknown> = {
      status: 'refunded',
      payment_status: 'refunded',
      refund_id: refund.id,
      refund_amount: Number(order.total || 0),
      refund_reason: body.reason?.trim() || 'Manual admin refund',
      refunded_at: new Date().toISOString(),
    }

    if (order.inventory_committed_at && !order.inventory_restocked_at) {
      const { error: restockError } = await supabase.rpc('restock_order_inventory', { p_order_id: order.id })
      if (restockError) {
        throw restockError
      }
      updates.inventory_restocked_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id)

    if (updateError) {
      throw updateError
    }

    await supabase.from('audit_logs').insert({
      event_type: 'order_refunded',
      entity_type: 'order',
      entity_id: order.id,
      actor_user_id: user.id,
      actor_role: user.role,
      payload: {
        refund_id: refund.id,
        amount: Number(order.total || 0),
        reason: body.reason?.trim() || 'Manual admin refund',
      },
    })

    await sendTransactionalNotifications({
      supabase,
      orderId: order.id,
      eventType: 'order_refunded',
    })

    return jsonResponse({ refundId: refund.id }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Refund failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Refund failed' }, 400, origin)
  }
})
