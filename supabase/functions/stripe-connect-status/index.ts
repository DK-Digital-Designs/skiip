import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import {
  buildStripeConnectStoreUpdate,
  canReconcileStripeConnectStore,
  deriveStripeConnectStatus,
} from "../_shared/stripe-connect-status.ts"
import { createStripeClient } from "../_shared/stripe-config.ts"

const log = logger('stripe-connect-status')

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const stripe = createStripeClient(stripeSecretKey)

interface ConnectStatusRequest {
  store_id?: string
}

const STORE_STATUS_SELECT = [
  'id',
  'user_id',
  'stripe_account_id',
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

    let body: ConnectStatusRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, origin)
    }

    if (!body.store_id) {
      return jsonResponse({ error: 'store_id is required' }, 400, origin)
    }

    const supabase = createServiceClient()
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select(STORE_STATUS_SELECT)
      .eq('id', body.store_id)
      .is('deleted_at', null)
      .single()

    if (storeError || !store) {
      return jsonResponse({ error: 'Store not found' }, 404, origin)
    }

    const storeRecord = store as any

    if (!canReconcileStripeConnectStore(user, storeRecord)) {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    const account = storeRecord.stripe_account_id
      ? await stripe.accounts.retrieve(storeRecord.stripe_account_id)
      : null
    const derivedStatus = deriveStripeConnectStatus(account)
    const update = buildStripeConnectStoreUpdate(storeRecord, derivedStatus)

    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .update(update)
      .eq('id', storeRecord.id)
      .select(STORE_STATUS_SELECT)
      .single()

    if (updateError || !updatedStore) {
      throw updateError || new Error('Failed to update Stripe Connect status')
    }

    return jsonResponse({ store: updatedStore }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Stripe Connect status reconciliation failed', {
      error: error.message,
      stack: error.stack,
    })

    return jsonResponse(
      { error: error.message || 'Stripe Connect status reconciliation failed' },
      getAuthErrorStatus(err) || 400,
      origin,
    )
  }
})
