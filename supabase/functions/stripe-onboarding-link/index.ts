import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from "../_shared/logger.ts"

const log = logger('stripe-onboarding-link')

// Initialize Stripe with error handling for missing key
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

interface OnboardingRequest {
  store_id: string;
  return_url: string;
  refresh_url: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Safe JSON parsing
    let body: OnboardingRequest;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { store_id, return_url, refresh_url } = body;

    if (!store_id || !return_url || !refresh_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: store_id, return_url, refresh_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Validate Supabase environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch the store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, stripe_account_id')
      .eq('id', store_id)
      .single()

    if (storeError) {
      log.error('Database error fetching store', { store_id, error: storeError });
      return new Response(
        JSON.stringify({ error: `Database error: ${storeError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!store) {
      log.error('Store not found', { store_id });
      return new Response(
        JSON.stringify({ error: 'Store not found in Skiip database' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let stripeAccountId = store.stripe_account_id

    // 4. Handle account creation
    if (!stripeAccountId) {
      log.info(`Creating new Stripe Express account for store: ${store_id}`)

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'GB',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          skiip_store_id: store_id,
          skiip_store_name: store.name,
        },
      })

      stripeAccountId = account.id

      const { error: updateError } = await supabase
        .from('stores')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', store_id)

      if (updateError) {
        log.error('Failed to save stripe_account_id', { store_id, error: updateError })
        throw updateError
      }
    }

    // 5. Generate Account Link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refresh_url,
      return_url: return_url,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ url: accountLink.url, stripe_account_id: stripeAccountId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const error = err as Error;
    log.error('Onboarding link creation failed', { error: error.message, stack: error.stack })
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
