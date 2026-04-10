import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from "../_shared/logger.ts"
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts"
import { requireUser } from "../_shared/auth.ts"

const log = logger('stripe-checkout')
const PLATFORM_FEE_PERCENT = 0.10

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

interface CheckoutRequest {
  orderDetails: {
    order_id: string
    tip_amount?: number
  }
  returnUrl: string
}

function validateReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  } catch {
    return false
  }
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

  try {
    const user = await requireUser(req)

    let body: CheckoutRequest
    try {
      body = await req.json()
    } catch {
      throw new Error('Invalid JSON body')
    }

    const { orderDetails, returnUrl } = body
    const { order_id, tip_amount = 0 } = orderDetails || {}

    if (!order_id || !validateReturnUrl(returnUrl)) {
      throw new Error('Missing order_id or valid returnUrl')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, store_id, total, status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      log.error('Order not found', { order_id, error: orderError })
      throw new Error('Order not found')
    }

    if (user.role !== 'admin' && order.user_id !== user.id) {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    if (order.status !== 'pending') {
      return jsonResponse({ error: 'Order is not in a payable state' }, 409, origin)
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', order.store_id)
      .single()

    if (storeError || !store) {
      throw new Error('Store not found')
    }

    if (!store.stripe_account_id || !store.stripe_onboarding_complete) {
      return jsonResponse(
        { error: 'VENDOR_NOT_READY', message: 'The vendor has not completed their payment setup.' },
        403,
        origin,
      )
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, price, product_snapshot')
      .eq('order_id', order_id)

    if (itemsError || !orderItems || orderItems.length === 0) {
      throw new Error('Order items not found')
    }

    const currency = 'gbp'
    const lineItems = orderItems.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.product_snapshot?.name || 'Item',
        },
        unit_amount: Math.max(1, Math.round(Number(item.price) * 100)),
      },
      quantity: Math.max(1, Number(item.quantity) || 1),
    }))

    if (tip_amount > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: 'Tip' },
          unit_amount: Math.round(tip_amount * 100),
        },
        quantity: 1,
      })
    }

    const itemsTotal = orderItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0)

    if (Math.abs(itemsTotal - Number(order.total)) > 0.01) {
      log.warn('Order total mismatch detected', { order_id, orderTotal: order.total, computed: itemsTotal })
      return jsonResponse({ error: 'Order total mismatch' }, 409, origin)
    }

    const applicationFeeAmount = Math.round(itemsTotal * PLATFORM_FEE_PERCENT * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl}?success=true&order_id=${order_id}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        order_id,
        store_id: order.store_id,
      },
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: store.stripe_account_id,
        },
        metadata: { order_id },
      },
    })

    await supabase
      .from('orders')
      .update({
        checkout_session_id: session.id,
        tip_amount,
        platform_fee: itemsTotal * PLATFORM_FEE_PERCENT,
      })
      .eq('id', order_id)

    return jsonResponse({ sessionId: session.id, url: session.url }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Checkout session creation failed', { error: error.message, stack: error.stack })
    const status = error.message.includes('token') ? 401 : 400
    return jsonResponse({ error: error.message || 'Payment initialization failed' }, status, origin)
  }
})
