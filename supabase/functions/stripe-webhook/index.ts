import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"
import { sendTransactionalNotificationsBestEffort } from "../_shared/notifications.ts"
import {
  buildPaidOrderUpdates,
  buildPaymentReconciliation,
  retrievePaymentIntentWithCharge,
} from "../_shared/stripe-reconciliation.ts"
import {
  buildStripeConnectStoreUpdate,
  deriveStripeConnectStatus,
} from "../_shared/stripe-connect-status.ts"
import {
  assertStripeLivemode,
  constructWithWebhookSecrets,
  createStripeClient,
  parseStripeWebhookSecrets,
} from "../_shared/stripe-config.ts"
import {
  getStripeConnectAccountId,
  handleStripeDisputeCreated,
} from "../_shared/stripe-webhook-events.ts"

const log = logger('stripe-webhook')

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = createStripeClient(stripeSecretKey)

const endpointSecrets = parseStripeWebhookSecrets()

interface WebhookClaim {
  should_process: boolean
  processing_status: 'processing' | 'succeeded' | 'failed'
  attempt_count: number
}

function getPaymentFailureDetails(paymentIntent: Stripe.PaymentIntent) {
  const error = paymentIntent.last_payment_error

  return {
    failureCode: error?.code || error?.decline_code || null,
    failureMessage: error?.message || null,
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

const STORE_CONNECT_STATUS_SELECT = [
  'id',
  'stripe_onboarding_complete',
  'stripe_connect_status',
  'stripe_charges_enabled',
  'stripe_payouts_enabled',
  'stripe_card_payments_status',
  'stripe_transfers_status',
  'stripe_requirements_currently_due',
  'stripe_requirements_past_due',
  'stripe_requirements_pending_verification',
  'stripe_requirements_disabled_reason',
  'stripe_connect_last_checked_at',
].join(', ')

async function claimWebhookEvent(supabase: any, event: Stripe.Event) {
  const { data, error } = await supabase
    .rpc('claim_stripe_webhook_event', {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
    })
    .single()

  if (error || !data) {
    throw error || new Error('Unable to claim Stripe webhook event')
  }

  return data as WebhookClaim
}

async function markWebhookEventSucceeded(supabase: any, eventId: string) {
  const { error } = await supabase.rpc('mark_stripe_webhook_event_succeeded', {
    p_stripe_event_id: eventId,
  })

  if (error) {
    throw error
  }
}

async function markWebhookEventFailed(supabase: any, eventId: string, error: unknown) {
  const { error: markError } = await supabase.rpc('mark_stripe_webhook_event_failed', {
    p_stripe_event_id: eventId,
    p_error: getErrorMessage(error),
  })

  if (markError) {
    log.error('Failed to mark Stripe webhook event as failed', {
      eventId,
      error: markError.message,
    })
  }
}

async function runBestEffort(label: string, task: () => Promise<unknown>) {
  try {
    await task()
  } catch (error: unknown) {
    log.error(`${label} failed`, { error: getErrorMessage(error) })
  }
}

async function checkoutSessionStillNeedsReconciliation(supabase: any, event: Stripe.Event) {
  if (event.type !== 'checkout.session.completed') {
    return false
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.order_id
  if (!orderId) {
    return false
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!order || order.status === 'refunded' || order.payment_status === 'refunded') {
    return false
  }

  return order.status === 'pending'
}

async function recordAuditLog(supabase: any, row: Record<string, unknown>) {
  const { error } = await supabase.from('audit_logs').insert(row)
  if (error) {
    throw error
  }
}

async function constructStripeEvent(body: string, signature: string): Promise<Stripe.Event> {
  return await constructWithWebhookSecrets<Stripe.Event>(
    endpointSecrets,
    (secret) => stripe.webhooks.constructEventAsync(body, signature, secret),
    getErrorMessage,
  )
}

async function handleCheckoutSessionCompleted(supabase: any, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.order_id

  if (!orderId) {
    throw new Error('Checkout session is missing order metadata')
  }

  const { data: order, error: orderLookupError } = await supabase
    .from('orders')
    .select('id, total, store_id, status, payment_status, paid_at')
    .eq('id', orderId)
    .single()

  if (orderLookupError || !order) {
    throw orderLookupError || new Error('Order not found during webhook processing')
  }

  if (order.status === 'refunded' || order.payment_status === 'refunded') {
    log.info('Checkout completion ignored for refunded order', { orderId, eventId: event.id })
    return
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id

  if (!paymentIntentId) {
    throw new Error('Checkout session is missing payment_intent')
  }

  const paymentIntent = await retrievePaymentIntentWithCharge(stripe, paymentIntentId)
  const reconciliation = buildPaymentReconciliation(paymentIntent, Number(order.total || 0))

  if (order.status === 'cancelled') {
    log.warn('Checkout completed after order was cancelled; refunding payment', {
      orderId,
      eventId: event.id,
      paymentIntentId: reconciliation.paymentIntentId,
    })

    const refund = await stripe.refunds.create(
      {
        payment_intent: reconciliation.paymentIntentId,
        reason: 'requested_by_customer',
        reverse_transfer: true,
        refund_application_fee: true,
        metadata: {
          order_id: orderId,
          auto_refund_reason: 'completed_after_order_cancelled',
        },
      },
      {
        idempotencyKey: `cancelled-order-auto-refund-${orderId}-${reconciliation.paymentIntentId}`,
      },
    )

    const { error: refundUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        payment_status: 'refunded',
        payment_intent_id: reconciliation.paymentIntentId,
        charge_id: reconciliation.chargeId,
        refund_id: refund.id,
        refund_amount: Number(order.total || 0),
        refund_reason: 'Automatic refund: payment completed after order was cancelled',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (refundUpdateError) {
      throw refundUpdateError
    }

    await runBestEffort('Cancelled-order refund audit log', () => recordAuditLog(supabase, {
      event_type: 'order_refunded',
      entity_type: 'order',
      entity_id: orderId,
      actor_role: 'system',
      payload: {
        reason: 'completed_after_order_cancelled',
        refund_id: refund.id,
        stripe_event_id: event.id,
      },
    }))

    await sendTransactionalNotificationsBestEffort({
      supabase,
      orderId,
      eventType: 'order_refunded',
      sourceEventId: event.id,
      functionName: 'stripe-webhook',
      operation: 'completed_after_order_cancelled_auto_refund',
      metadata: {
        stripeEventId: event.id,
        stripeEventType: event.type,
        refundId: refund.id,
        paymentIntentId: reconciliation.paymentIntentId,
      },
    })

    return
  }

  const paidOrderUpdates = {
    ...buildPaidOrderUpdates(reconciliation),
    paid_at: order.paid_at || reconciliation.paidAt,
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update(paidOrderUpdates)
    .eq('id', orderId)
    .neq('payment_status', 'refunded')

  if (orderError) {
    throw orderError
  }

  const { error: inventoryError } = await supabase.rpc('finalize_paid_order_inventory', {
    p_order_id: orderId,
  })

  if (inventoryError) {
    log.error('Inventory finalization failed after payment; refunding order', {
      orderId,
      error: inventoryError.message,
    })

    const refund = await stripe.refunds.create(
      {
        payment_intent: reconciliation.paymentIntentId,
        reason: 'requested_by_customer',
        reverse_transfer: true,
        refund_application_fee: true,
        metadata: { order_id: orderId, auto_refund_reason: 'inventory_unavailable' },
      },
      {
        idempotencyKey: `inventory-auto-refund-${orderId}-${reconciliation.paymentIntentId}`,
      },
    )

    const { error: refundUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        payment_status: 'refunded',
        refund_id: refund.id,
        refund_amount: Number(order.total || 0),
        refund_reason: 'Automatic refund: insufficient inventory at payment capture',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (refundUpdateError) {
      throw refundUpdateError
    }

    await runBestEffort('Refund audit log', () => recordAuditLog(supabase, {
      event_type: 'order_refunded',
      entity_type: 'order',
      entity_id: orderId,
      actor_role: 'system',
      payload: {
        reason: 'inventory_unavailable',
        refund_id: refund.id,
        stripe_event_id: event.id,
      },
    }))

    await sendTransactionalNotificationsBestEffort({
      supabase,
      orderId,
      eventType: 'order_refunded',
      sourceEventId: event.id,
      functionName: 'stripe-webhook',
      operation: 'inventory_auto_refund_after_payment',
      metadata: {
        stripeEventId: event.id,
        stripeEventType: event.type,
        refundId: refund.id,
        paymentIntentId: reconciliation.paymentIntentId,
      },
    })

    return
  }

  await runBestEffort('Payment audit log', () => recordAuditLog(supabase, {
    event_type: 'payment_captured',
    entity_type: 'order',
    entity_id: orderId,
    actor_role: 'system',
    payload: {
      checkout_session_id: session.id,
      payment_intent_id: reconciliation.paymentIntentId,
      charge_id: reconciliation.chargeId,
      stripe_event_id: event.id,
    },
  }))

  await sendTransactionalNotificationsBestEffort({
    supabase,
    orderId,
    eventType: 'order_paid',
    sourceEventId: event.id,
    functionName: 'stripe-webhook',
    operation: 'checkout_session_completed',
    metadata: {
      stripeEventId: event.id,
      stripeEventType: event.type,
      checkoutSessionId: session.id,
      paymentIntentId: reconciliation.paymentIntentId,
      chargeId: reconciliation.chargeId,
    },
  })
}

async function handlePaymentIntentFailed(supabase: any, event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const orderId = paymentIntent.metadata?.order_id
  const { failureCode, failureMessage } = getPaymentFailureDetails(paymentIntent)

  if (!orderId) {
    log.warn('Payment failed event missing order metadata', {
      paymentIntentId: paymentIntent.id,
      failureCode,
    })
    return
  }

  const { data: order, error: orderLookupError } = await supabase
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', orderId)
    .maybeSingle()

  if (orderLookupError) {
    throw orderLookupError
  }

  if (!order) {
    log.warn('Order not found for failed payment event', {
      orderId,
      paymentIntentId: paymentIntent.id,
      failureCode,
    })
    return
  }

  if (order.payment_status === 'succeeded' || order.payment_status === 'refunded') {
    log.info('Ignoring failed payment event for terminal payment state', {
      orderId,
      paymentIntentId: paymentIntent.id,
      paymentStatus: order.payment_status,
    })
    return
  }

  const { error: paymentFailureUpdateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      payment_intent_id: paymentIntent.id,
      payment_failed_at: new Date().toISOString(),
      payment_failure_code: failureCode,
      payment_failure_message: failureMessage,
    })
    .eq('id', orderId)

  if (paymentFailureUpdateError) {
    throw paymentFailureUpdateError
  }

  await runBestEffort('Payment-failure audit log', () => recordAuditLog(supabase, {
    event_type: 'payment_failed',
    entity_type: 'order',
    entity_id: orderId,
    actor_role: 'system',
    payload: {
      payment_intent_id: paymentIntent.id,
      payment_status: paymentIntent.status,
      failure_code: failureCode,
      failure_message: failureMessage,
      stripe_event_id: event.id,
    },
  }))
}

async function handleStripeEvent(supabase: any, event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    await handleCheckoutSessionCompleted(supabase, event)
  } else if (event.type === 'payment_intent.payment_failed') {
    await handlePaymentIntentFailed(supabase, event)
  } else if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const stripeAccountId = getStripeConnectAccountId(event, account)

    if (!stripeAccountId) {
      log.warn('Account update ignored because the Stripe account id is missing', {
        eventId: event.id,
      })
      return
    }

    const { data: store, error: storeLookupError } = await supabase
      .from('stores')
      .select(STORE_CONNECT_STATUS_SELECT)
      .eq('stripe_account_id', stripeAccountId)
      .maybeSingle()

    if (storeLookupError) {
      throw storeLookupError
    }

    if (!store) {
      log.warn('Account update ignored because no store has this Stripe account', {
        accountId: stripeAccountId,
        eventAccount: event.account || null,
        objectAccountId: account.id || null,
      })
      return
    }

    const derivedStatus = deriveStripeConnectStatus(account)
    const update = buildStripeConnectStoreUpdate(store, derivedStatus)
    const { error } = await supabase
      .from('stores')
      .update(update)
      .eq('id', store.id)

    if (error) {
      throw error
    }
  } else if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const orderId = charge.metadata?.order_id
    if (orderId) {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'refunded',
          payment_status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_id: charge.refunds?.data?.[0]?.id || null,
          refund_amount: Number(charge.amount_refunded || 0) / 100,
        })
        .eq('id', orderId)

      if (error) {
        throw error
      }
    }
  } else if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute
    await handleStripeDisputeCreated({
      supabase,
      dispute,
      eventId: event.id,
      log,
    })
  }
}

async function processClaimedEvent(supabase: any, event: Stripe.Event) {
  try {
    await handleStripeEvent(supabase, event)
    await markWebhookEventSucceeded(supabase, event.id)
  } catch (error: unknown) {
    await markWebhookEventFailed(supabase, event.id, error)
    throw error
  }
}

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    log.error('No stripe-signature header')
    return new Response('No signature', { status: 400 })
  }

  let eventId: string | null = null
  let eventType: string | null = null

  try {
    const body = await req.text()

    const event = await constructStripeEvent(body, signature)
    eventId = event.id
    eventType = event.type
    assertStripeLivemode(event)

    const supabase = createServiceClient()
    const claim = await claimWebhookEvent(supabase, event)

    if (!claim.should_process) {
      if (
        claim.processing_status === 'succeeded'
        && await checkoutSessionStillNeedsReconciliation(supabase, event)
      ) {
        log.warn('Reprocessing succeeded Stripe event because order still needs reconciliation', {
          eventId: event.id,
          eventType: event.type,
        })
        await processClaimedEvent(supabase, event)
        return new Response(JSON.stringify({ ok: true, reconciledDuplicate: true }), { status: 200 })
      }

      log.info('Duplicate Stripe event ignored', {
        eventId: event.id,
        eventType: event.type,
        processingStatus: claim.processing_status,
      })
      return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 })
    }

    await processClaimedEvent(supabase, event)

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)

    log.error(`Webhook processing failed: ${errorMessage}`, {
      eventId,
      eventType,
      stack: error instanceof Error ? error.stack : undefined,
    })

    try {
      await recordAuditLog(createServiceClient(), {
        event_type: 'stripe_webhook_failed',
        entity_type: 'stripe_event',
        entity_id: null,
        actor_role: 'system',
        payload: {
          stripe_event_id: eventId,
          event_type: eventType,
          error: errorMessage,
        },
      })
    } catch (auditError: unknown) {
      log.error('Failed to record webhook failure audit log', {
        eventId,
        eventType,
        error: getErrorMessage(auditError),
      })
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})
