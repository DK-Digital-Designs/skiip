import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from "../_shared/logger.ts"

const log = logger('stripe-checkout')

// Configuration
const PLATFORM_FEE_PERCENT = 0.10 // 10% platform fee

// Initialize Stripe with error handling
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutItem {
  id: string;
  name?: string;
  price: number;
  quantity: number;
  product_snapshot?: {
    name: string;
  };
}

interface CheckoutRequest {
  orderDetails: {
    order_id: string;
    items: CheckoutItem[];
    tip_amount?: number;
  };
  returnUrl: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Safe JSON parsing
    let body: CheckoutRequest;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error('Invalid JSON body');
    }

    const { orderDetails, returnUrl } = body;
    const { order_id, items, tip_amount = 0 } = orderDetails;

    if (!order_id || !items || !Array.isArray(items)) {
      throw new Error('Missing order_id or valid items array');
    }

    // 2. Validate Supabase environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch Order and Store Details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('store_id, total')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      log.error('Order not found', { order_id, error: orderError })
      throw new Error('Order not found');
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', order.store_id)
      .single()

    if (storeError || !store) {
      log.error('Store not found', { store_id: order.store_id, error: storeError })
      throw new Error('Store not found');
    }

    if (!store.stripe_account_id || !store.stripe_onboarding_complete) {
      log.error('Vendor not ready for payments', { store_id: order.store_id })
      return new Response(
        JSON.stringify({ 
          error: 'VENDOR_NOT_READY',
          message: 'The vendor has not completed their payment setup. Payouts are disabled for this account.' 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Prepare line items (UK Focus for MVP)
    const currency = 'gbp'
    const lineItems = items.map((item: CheckoutItem) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name || item.product_snapshot?.name || 'Item',
        },
        unit_amount: Math.max(1, Math.round((item.price || 0) * 100)),
      },
      quantity: item.quantity || 1,
    }))

    if (tip_amount > 0) {
      lineItems.push({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Tip',
          },
          unit_amount: Math.round(tip_amount * 100),
        },
        quantity: 1,
      })
    }

    // 5. Calculate platform fee (Excludes tip)
    const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const applicationFeeAmount = Math.round(itemsTotal * PLATFORM_FEE_PERCENT * 100)

    // 6. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${returnUrl}?success=true&order_id=${order_id}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        order_id: order_id,
        store_id: order.store_id,
      },
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: store.stripe_account_id,
        },
        metadata: {
          order_id: order_id,
        },
      },
    })

    // 7. Update order with session tracking
    await supabase
      .from('orders')
      .update({ 
        checkout_session_id: session.id,
        tip_amount: tip_amount,
        platform_fee: itemsTotal * PLATFORM_FEE_PERCENT
      })
      .eq('id', order_id)

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err: unknown) {
    const error = err as Error;
    log.error('Checkout session creation failed', { error: error.message, stack: error.stack })
    return new Response(
      JSON.stringify({ error: error.message || 'Payment initialization failed' }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
