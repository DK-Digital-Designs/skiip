import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"

const log = logger('vendor-store-profile')

interface VendorStoreProfileRequest {
  name?: string
  description?: string
  logoUrl?: string
  pickupLocation?: string
  tags?: string[]
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || '').trim().slice(0, maxLength)
}

function cleanOptionalText(value: unknown, maxLength: number) {
  const cleaned = cleanText(value, maxLength)
  return cleaned || null
}

function cleanLogoUrl(value: unknown) {
  const cleaned = cleanText(value, 700)
  if (!cleaned) return null

  try {
    const parsed = new URL(cleaned)
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Logo image URL must start with http or https')
    }
    return parsed.toString()
  } catch {
    throw new Error('Logo image URL must be a valid public URL')
  }
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return []

  return [...new Set(value
    .map((tag) => cleanText(tag, 24))
    .filter(Boolean))]
    .slice(0, 8)
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
    if (user.role !== 'seller') {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    const body = (await req.json()) as VendorStoreProfileRequest
    const name = cleanText(body.name, 80)
    if (!name) {
      return jsonResponse({ error: 'Vendor name is required' }, 400, origin)
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('stores')
      .update({
        name,
        description: cleanOptionalText(body.description, 280),
        logo_url: cleanLogoUrl(body.logoUrl),
        pickup_location: cleanOptionalText(body.pickupLocation, 120),
        tags: cleanTags(body.tags),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (error) throw error
    return jsonResponse({ store: data }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Vendor profile update failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Vendor profile update failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
