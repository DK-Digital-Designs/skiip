import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"
import { sendTransactionalNotifications } from "../_shared/notifications.ts"

const log = logger('stripe-webhook')

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

function getPaymentFailureDetails(paymentIntent: Stripe.PaymentIntent) {
  const error = paymentIntent.last_payment_error

  return {
    failureCode: error?.code || error?.decline_code || null,
    failureMessage: error?.message || null,
  }
}

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    log.error('No stripe-signature header')
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()

    if (!endpointSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret)

    const supabaseClient = createServiceClient()

    const { data: insertedEvent, error: idempotencyError } = await supabaseClient
      .from('stripe_processed_events')
      .insert({ stripe_event_id: event.id, event_type: event.type })
      .select('stripe_event_id')
      .maybeSingle()

    if (idempotencyError) {
      if (idempotencyError.code === '23505') {
        log.info('Duplicate Stripe event ignored', { eventId: event.id })
        return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 })
      }
      throw idempotencyError
    }

    if (!insertedEvent) {
      log.info('Duplicate Stripe event ignored', { eventId: event.id })
      return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const orderId = session.metadata.order_id

      const { data: order, error: orderLookupError } = await supabaseClient
        .from('orders')
        .select('id, total, store_id, inventory_committed_at, inventory_restocked_at')
        .eq('id', orderId)
        .single()

      if (orderLookupError || !order) {
        throw orderLookupError || new Error('Order not found during webhook processing')
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
        expand: ['latest_charge.balance_transaction'],
      })

      const latestCharge = paymentIntent.latest_charge as any
      const balanceTransaction = latestCharge?.balance_transaction as any
      const applicationFeeAmount = Number(paymentIntent.application_fee_amount || 0) / 100
      const stripeFee = Number(balanceTransaction?.fee || 0) / 100
      const vendorNet = Number(order.total || 0) - applicationFeeAmount - stripeFee

      const { error: orderError } = await supabaseClient
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'succeeded',
          payment_intent_id: session.payment_intent,
          charge_id: latestCharge?.id || paymentIntent.latest_charge,
          paid_at: new Date().toISOString(),
          payment_failed_at: null,
          payment_failure_code: null,
          payment_failure_message: null,
          platform_fee: applicationFeeAmount,
          stripe_fee: stripeFee,
          vendor_net: vendorNet,
        })
        .eq('id', orderId)
        .neq('payment_status', 'succeeded')

      if (orderError) {
        throw orderError
      }

      const { error: inventoryError } = await supabaseClient.rpc('finalize_paid_order_inventory', {
        p_order_id: orderId,
      })

      if (inventoryError) {
        log.error('Inventory finalization failed after payment; refunding order', { orderId, error: inventoryError })

        const refund = await stripe.refunds.create({
          payment_intent: session.payment_intent,
          reason: 'requested_by_customer',
          metadata: { order_id: orderId, auto_refund_reason: 'inventory_unavailable' },
        })

        await supabaseClient
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

        await supabaseClient.from('audit_logs').insert({
          event_type: 'order_refunded',
          entity_type: 'order',
          entity_id: orderId,
          actor_role: 'system',
          payload: {
            reason: 'inventory_unavailable',
            refund_id: refund.id,
          },
        })

        await sendTransactionalNotifications({
          supabase: supabaseClient,
          orderId,
          eventType: 'order_refunded',
        })
      } else {
        await supabaseClient
          .from('orders')
          .update({
            inventory_committed_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        await supabaseClient.from('audit_logs').insert({
          event_type: 'payment_captured',
          entity_type: 'order',
          entity_id: orderId,
          actor_role: 'system',
          payload: {
            checkout_session_id: session.id,
            payment_intent_id: session.payment_intent,
            charge_id: latestCharge?.id || paymentIntent.latest_charge,
          },
        })

        await sendTransactionalNotifications({
          supabase: supabaseClient,
          orderId,
          eventType: 'order_paid',
        })
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata?.order_id
      const { failureCode, failureMessage } = getPaymentFailureDetails(paymentIntent)

      if (!orderId) {
        log.warn('Payment failed event missing order metadata', {
          paymentIntentId: paymentIntent.id,
          failureCode,
        })
      } else {
        const { data: order, error: orderLookupError } = await supabaseClient
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
        } else if (order.payment_status === 'succeeded' || order.payment_status === 'refunded') {
          log.info('Ignoring failed payment event for terminal payment state', {
            orderId,
            paymentIntentId: paymentIntent.id,
            paymentStatus: order.payment_status,
          })
        } else {
          const { error: paymentFailureUpdateError } = await supabaseClient
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

          await supabaseClient.from('audit_logs').insert({
            event_type: 'payment_failed',
            entity_type: 'order',
            entity_id: orderId,
            actor_role: 'system',
            payload: {
              payment_intent_id: paymentIntent.id,
              payment_status: paymentIntent.status,
              failure_code: failureCode,
              failure_message: failureMessage,
            },
          })
        }
      }
    } else if (event.type === 'account.updated') {
      const account = event.data.object as any
      if (account.charges_enabled && account.details_submitted) {
        await supabaseClient
          .from('stores')
          .update({ stripe_onboarding_complete: true })
          .eq('stripe_account_id', account.id)
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as any
      const orderId = charge.metadata.order_id
      if (orderId) {
        await supabaseClient
          .from('orders')
          .update({
            status: 'refunded',
            payment_status: 'refunded',
            refunded_at: new Date().toISOString(),
            refund_id: charge.refunds?.data?.[0]?.id || null,
            refund_amount: Number(charge.amount_refunded || 0) / 100,
          })
          .eq('id', orderId)
      }
    } else if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as any
      log.warn(`Dispute created: ${dispute.id} for charge ${dispute.charge}`)
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err: unknown) {
    const error = err as Error
    log.error(`Webhook processing failed: ${error.message}`, { stack: error.stack })
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})
