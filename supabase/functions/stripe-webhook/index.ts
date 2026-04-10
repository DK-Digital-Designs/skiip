import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from "../_shared/logger.ts"

const log = logger('stripe-webhook')

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not configured')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

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

      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent)

      const { error: orderError } = await supabaseClient
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'succeeded',
          payment_intent_id: session.payment_intent,
          charge_id: paymentIntent.latest_charge,
        })
        .eq('id', orderId)
        .neq('payment_status', 'succeeded')

      if (orderError) {
        throw orderError
      }

      const { data: orderItems, error: itemsError } = await supabaseClient
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (itemsError) {
        log.error('Error fetching order items for stock decrement', { orderId, error: itemsError })
      } else if (orderItems) {
        for (const item of orderItems) {
          const { error: decrementError } = await supabaseClient.rpc('decrement_inventory', {
            product_id: item.product_id,
            quantity_to_decrement: item.quantity,
          })
          if (decrementError) {
            log.error('Failed to decrement inventory', { productId: item.product_id, error: decrementError })
          }
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
          .update({ status: 'refunded', payment_status: 'refunded' })
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
