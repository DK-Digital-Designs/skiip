import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"
import { isPaymentsEnabled } from "../_shared/stripe-config.ts"
import {
  buildPaymentControlsUpdate,
  getPaymentControls,
  PAYMENT_CONTROLS_KEY,
} from "../_shared/payment-control.ts"

const log = logger('payment-control')

interface PaymentControlRequest {
  action?: 'get' | 'set'
  enabled?: boolean
  reason?: string | null
}

function buildResponse(controls: Awaited<ReturnType<typeof getPaymentControls>>) {
  const masterEnabled = isPaymentsEnabled()
  return {
    controls,
    masterEnabled,
    checkoutEnabled: masterEnabled && controls.enabled,
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

  if (!isAllowedOrigin(origin)) {
    log.warn('Rejected request from disallowed origin', { origin })
    return jsonResponse({ error: 'Origin not allowed' }, 403, origin)
  }

  try {
    const user = await requireUser(req)
    if (user.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    const body = (await req.json().catch(() => ({}))) as PaymentControlRequest
    const action = body.action || 'get'
    const supabase = createServiceClient()

    if (action === 'get') {
      const controls = await getPaymentControls(supabase)
      return jsonResponse(buildResponse(controls), 200, origin)
    }

    if (action !== 'set') {
      return jsonResponse({ error: 'Invalid payment control action' }, 400, origin)
    }

    if (typeof body.enabled !== 'boolean') {
      return jsonResponse({ error: 'enabled must be a boolean' }, 400, origin)
    }

    const controls = buildPaymentControlsUpdate({
      enabled: body.enabled,
      reason: body.reason,
      updatedBy: user.id,
    })

    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ key: PAYMENT_CONTROLS_KEY, value: controls }, { onConflict: 'key' })
      .select('value')
      .single()

    if (error) {
      throw error
    }

    await supabase.from('audit_logs').insert({
      event_type: 'payment_controls_updated',
      entity_type: 'app_setting',
      entity_id: null,
      actor_user_id: user.id,
      actor_role: user.role,
      payload: {
        key: PAYMENT_CONTROLS_KEY,
        enabled: controls.enabled,
        reason: controls.reason,
      },
    })

    return jsonResponse(buildResponse(data?.value || controls), 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Payment control operation failed', {
      error: error.message,
      stack: error.stack,
    })
    return jsonResponse(
      { error: error.message || 'Payment control operation failed' },
      getAuthErrorStatus(err) || 400,
      origin,
    )
  }
})
