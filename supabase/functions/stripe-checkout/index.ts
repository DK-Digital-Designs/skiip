import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts"
import { requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"

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
    const body = (await req.json()) as CheckoutRequest
    const orderId = body.orderDetails?.order_id
    const returnUrl = body.returnUrl

    if (!orderId || !validateReturnUrl(returnUrl)) {
      return jsonResponse({ error: 'Missing order_id or valid returnUrl' }, 400, origin)
    }

    const supabase = createServiceClient()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, store_id, subtotal, total, tip_amount, status, payment_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      log.error('Order not found', { orderId, error: orderError })
      return jsonResponse({ error: 'Order not found' }, 404, origin)
    }

    if (user.role !== 'admin' && order.user_id !== user.id) {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    if (order.status !== 'pending' || order.payment_status !== 'pending') {
      return jsonResponse({ error: 'Order is not in a payable state' }, 409, origin)
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', order.store_id)
      .single()

    if (storeError || !store) {
      return jsonResponse({ error: 'Store not found' }, 404, origin)
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
      .select('quantity, price, total, product_snapshot')
      .eq('order_id', orderId)

    if (itemsError || !orderItems || orderItems.length === 0) {
      return jsonResponse({ error: 'Order items not found' }, 404, origin)
    }

    const computedSubtotal = orderItems.reduce((sum, item) => sum + Number(item.total || 0), 0)
    const storedSubtotal = Number(order.subtotal || 0)
    const tipAmount = Number(order.tip_amount || 0)
    const storedTotal = Number(order.total || 0)

    if (Math.abs(computedSubtotal - storedSubtotal) > 0.01) {
      log.warn('Order subtotal mismatch detected', { orderId, storedSubtotal, computedSubtotal })
      return jsonResponse({ error: 'Order subtotal mismatch' }, 409, origin)
    }

    if (Math.abs(storedTotal - (storedSubtotal + tipAmount)) > 0.01) {
      log.warn('Order total mismatch detected', { orderId, storedTotal, computed: storedSubtotal + tipAmount })
      return jsonResponse({ error: 'Order total mismatch' }, 409, origin)
    }

    const lineItems = orderItems.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.product_snapshot?.name || 'Item',
        },
        unit_amount: Math.max(1, Math.round(Number(item.price) * 100)),
      },
      quantity: Math.max(1, Number(item.quantity) || 1),
    }))

    if (tipAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: 'Tip' },
          unit_amount: Math.round(tipAmount * 100),
        },
        quantity: 1,
      })
    }

    const applicationFeeAmount = Math.round(storedSubtotal * PLATFORM_FEE_PERCENT * 100)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl}?success=true&order_id=${orderId}`,
      cancel_url: `${returnUrl}?canceled=true&order_id=${orderId}`,
      metadata: {
        order_id: orderId,
        store_id: order.store_id,
      },
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: store.stripe_account_id,
        },
        metadata: {
          order_id: orderId,
          store_id: order.store_id,
        },
      },
    })

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        checkout_session_id: session.id,
        tip_amount: tipAmount,
        platform_fee: applicationFeeAmount / 100,
      })
      .eq('id', orderId)

    if (updateError) {
      throw updateError
    }

    return jsonResponse({ sessionId: session.id, url: session.url }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Checkout session creation failed', { error: error.message, stack: error.stack })
    const status = error.message.includes('token') ? 401 : 400
    return jsonResponse({ error: error.message || 'Payment initialization failed' }, status, origin)
  }
})
