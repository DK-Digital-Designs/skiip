import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import { sendTransactionalNotificationsBestEffort } from "../_shared/notifications.ts"
import {
  buildPaidOrderUpdates,
  buildPaymentReconciliation,
  retrievePaymentIntentWithCharge,
} from "../_shared/stripe-reconciliation.ts"

const log = logger('stripe-reconcile-order')

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

interface ReconcileOrderRequest {
  orderId?: string
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

async function runBestEffort(label: string, task: () => Promise<unknown>) {
  try {
    await task()
  } catch (error: unknown) {
    log.error(`${label} failed`, { error: getErrorMessage(error) })
  }
}

function paymentIntentFromCheckoutSession(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === 'string'
    ? null
    : session.payment_intent as Stripe.PaymentIntent | null
}

async function loadPaymentIntentForOrder(order: any) {
  if (order.checkout_session_id) {
    const session = await stripe.checkout.sessions.retrieve(order.checkout_session_id, {
      expand: ['payment_intent.latest_charge.balance_transaction'],
    })

    if (session.metadata?.order_id && session.metadata.order_id !== order.id) {
      throw new Error('Checkout session belongs to a different order')
    }

    const expandedPaymentIntent = paymentIntentFromCheckoutSession(session)
    if (expandedPaymentIntent) {
      return expandedPaymentIntent
    }

    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
    if (!paymentIntentId) {
      throw new Error('Checkout session has no payment intent')
    }

    return await retrievePaymentIntentWithCharge(stripe, paymentIntentId)
  }

  if (order.payment_intent_id) {
    return await retrievePaymentIntentWithCharge(stripe, order.payment_intent_id)
  }

  if (order.charge_id) {
    const charge = await stripe.charges.retrieve(order.charge_id, {
      expand: ['payment_intent.latest_charge.balance_transaction'],
    })
    const paymentIntent = typeof charge.payment_intent === 'string'
      ? await retrievePaymentIntentWithCharge(stripe, charge.payment_intent)
      : charge.payment_intent as Stripe.PaymentIntent | null

    if (!paymentIntent) {
      throw new Error('Charge has no payment intent')
    }

    return paymentIntent
  }

  throw new Error('Order has no Stripe checkout session, payment intent, or charge reference')
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

    const body = (await req.json()) as ReconcileOrderRequest
    if (!body.orderId) {
      return jsonResponse({ error: 'orderId is required' }, 400, origin)
    }

    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, checkout_session_id, payment_intent_id, charge_id, paid_at')
      .eq('id', body.orderId)
      .single()

    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404, origin)
    }

    if (order.status === 'refunded' || order.payment_status === 'refunded') {
      return jsonResponse({ error: 'Refunded orders cannot be reconciled to paid' }, 409, origin)
    }

    const wasAlreadyPaid = order.payment_status === 'succeeded' && order.status !== 'pending'
    const paymentIntent = await loadPaymentIntentForOrder(order)
    const reconciliation = buildPaymentReconciliation(paymentIntent, Number(order.total || 0))

    const { error: inventoryError } = await supabase.rpc('finalize_paid_order_inventory', {
      p_order_id: order.id,
    })

    if (inventoryError) {
      return jsonResponse(
        { error: `Inventory finalization failed: ${inventoryError.message}` },
        409,
        origin,
      )
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        ...buildPaidOrderUpdates(reconciliation),
        paid_at: order.paid_at || reconciliation.paidAt,
      })
      .eq('id', order.id)
      .neq('payment_status', 'refunded')
      .select('id, order_number, status, payment_status, payment_intent_id, charge_id, paid_at, platform_fee, stripe_fee, vendor_net')
      .single()

    if (updateError || !updatedOrder) {
      throw updateError || new Error('Failed to update reconciled order')
    }

    await runBestEffort('Payment reconciliation audit log', async () => {
      const { error } = await supabase.from('audit_logs').insert({
        event_type: 'payment_reconciled',
        entity_type: 'order',
        entity_id: order.id,
        actor_user_id: user.id,
        actor_role: user.role,
        payload: {
          checkout_session_id: order.checkout_session_id,
          payment_intent_id: reconciliation.paymentIntentId,
          charge_id: reconciliation.chargeId,
          source: 'admin_reconcile_order',
        },
      })

      if (error) {
        throw error
      }
    })

    if (!wasAlreadyPaid) {
      await sendTransactionalNotificationsBestEffort({
        supabase,
        orderId: order.id,
        eventType: 'order_paid',
        correlationId: crypto.randomUUID(),
        functionName: 'stripe-reconcile-order',
        operation: 'admin_reconcile_order',
        metadata: {
          actorUserId: user.id,
          actorRole: user.role,
          checkoutSessionId: order.checkout_session_id,
          paymentIntentId: reconciliation.paymentIntentId,
          chargeId: reconciliation.chargeId,
        },
      })
    }

    return jsonResponse({
      order: updatedOrder,
      reconciliation: {
        paymentIntentId: reconciliation.paymentIntentId,
        chargeId: reconciliation.chargeId,
        platformFee: reconciliation.platformFee,
        stripeFee: reconciliation.stripeFee,
        vendorNet: reconciliation.vendorNet,
      },
    }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Order reconciliation failed', { error: error.message, stack: error.stack })
    return jsonResponse(
      { error: error.message || 'Order reconciliation failed' },
      getAuthErrorStatus(err) || 400,
      origin,
    )
  }
})
