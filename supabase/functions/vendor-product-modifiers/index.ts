import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"

const log = logger('vendor-product-modifiers')

interface ModifierOptionRequest {
  id?: string
  name?: string
  priceDelta?: number
  price_delta?: number
  sortOrder?: number
  sort_order?: number
  active?: boolean
  status?: string
}

interface ModifierGroupRequest {
  id?: string
  name?: string
  required?: boolean
  minSelect?: number
  min_select?: number
  maxSelect?: number
  max_select?: number
  sortOrder?: number
  sort_order?: number
  active?: boolean
  status?: string
  options?: ModifierOptionRequest[]
}

interface VendorProductModifiersRequest {
  productId?: string
  product_id?: string
  groups?: ModifierGroupRequest[]
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength)
}

function cleanStatus(value: unknown) {
  return value === 'inactive' ? 'inactive' : 'active'
}

function cleanNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function cleanInteger(value: unknown, fallback: number) {
  return Math.trunc(cleanNumber(value, fallback))
}

function cleanPriceDelta(value: unknown) {
  return Math.round(Math.max(cleanNumber(value, 0), 0) * 100) / 100
}

function cleanGroups(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('Modifier groups must be an array')
  }

  return value.map((group, groupIndex) => {
    const source = group || {}
    const name = cleanText((source as ModifierGroupRequest).name, 80)
    if (!name) {
      throw new Error('Modifier group name is required')
    }

    const required = (source as ModifierGroupRequest).required === true
    const minSelect = required
      ? Math.max(cleanInteger((source as ModifierGroupRequest).minSelect ?? (source as ModifierGroupRequest).min_select, 1), 1)
      : 0
    const maxSelect = Math.max(cleanInteger((source as ModifierGroupRequest).maxSelect ?? (source as ModifierGroupRequest).max_select, 1), 1)

    if (maxSelect < minSelect) {
      throw new Error('Modifier group max must be greater than or equal to min')
    }

    const optionsSource = Array.isArray((source as ModifierGroupRequest).options)
      ? (source as ModifierGroupRequest).options!
      : []

    const options = optionsSource.map((option, optionIndex) => {
      const optionName = cleanText(option.name, 80)
      if (!optionName) {
        throw new Error('Modifier option name is required')
      }

      return {
        name: optionName,
        priceDelta: cleanPriceDelta(option.priceDelta ?? option.price_delta),
        sortOrder: cleanInteger(option.sortOrder ?? option.sort_order, optionIndex + 1),
        status: option.active === false ? 'inactive' : cleanStatus(option.status),
        active: option.active !== false && option.status !== 'inactive',
      }
    })

    if (required && options.length === 0) {
      throw new Error('Required modifier groups need at least one option')
    }

    return {
      name,
      required,
      minSelect,
      maxSelect,
      sortOrder: cleanInteger((source as ModifierGroupRequest).sortOrder ?? (source as ModifierGroupRequest).sort_order, groupIndex + 1),
      status: (source as ModifierGroupRequest).active === false ? 'inactive' : cleanStatus((source as ModifierGroupRequest).status),
      active: (source as ModifierGroupRequest).active !== false && (source as ModifierGroupRequest).status !== 'inactive',
      options,
    }
  })
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
    if (!['seller', 'admin'].includes(user.role)) {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    const body = (await req.json()) as VendorProductModifiersRequest
    const productId = cleanText(body.productId || body.product_id, 80)
    if (!productId) {
      return jsonResponse({ error: 'Product ID is required' }, 400, origin)
    }

    const groups = cleanGroups(body.groups || [])
    const supabase = createServiceClient()
    const { data, error } = await supabase.rpc('replace_product_modifiers_v1', {
      p_actor_user_id: user.id,
      p_product_id: productId,
      p_groups: groups,
    })

    if (error) throw error
    return jsonResponse({ groups: data || [] }, 200, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Vendor modifier save failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Vendor modifier save failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
