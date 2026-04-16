import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.10.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from "../_shared/logger.ts"
import { buildCorsHeaders, isAllowedOrigin, isAllowedRedirectUrl, jsonResponse } from "../_shared/http.ts"
import { requireUser } from "../_shared/auth.ts"

const log = logger('stripe-onboarding-link')

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
})

interface OnboardingRequest {
  store_id: string
  return_url: string
  refresh_url: string
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

    let body: OnboardingRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin)
    }

    const { store_id, return_url, refresh_url } = body
    if (!store_id || !return_url || !refresh_url) {
      return jsonResponse({ error: 'Missing required fields: store_id, return_url, refresh_url' }, 400, origin)
    }

    if (!isAllowedRedirectUrl(return_url) || !isAllowedRedirectUrl(refresh_url)) {
      return jsonResponse({ error: 'Invalid redirect URL' }, 400, origin)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, user_id, name, stripe_account_id')
      .eq('id', store_id)
      .single()

    if (storeError || !store) {
      log.error('Store fetch failed', { store_id, error: storeError })
      return jsonResponse({ error: 'Store not found in Skiip database' }, 404, origin)
    }

    if (user.role !== 'admin' && store.user_id !== user.id) {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    let stripeAccountId = store.stripe_account_id

    if (!stripeAccountId) {
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
        log.error('Failed to persist stripe account', { store_id, error: updateError })
        throw updateError
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url,
      return_url,
      type: 'account_onboarding',
    })

    return jsonResponse({ url: accountLink.url, stripe_account_id: stripeAccountId }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Onboarding link creation failed', { error: error.message, stack: error.stack })
    const status = error.message.includes('token') ? 401 : 500
    return jsonResponse({ error: error.message || 'Internal Server Error' }, status, origin)
  }
})
