import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { createServiceClient } from "../_shared/service.ts"
import { logger } from "../_shared/logger.ts"

const log = logger('admin-store')

const STORE_STATUSES = new Set(['pending', 'active', 'suspended'])
const STORE_CATEGORIES = new Set(['Food', 'Drinks', 'Dessert', 'Coffee', 'Other'])

interface AdminStoreRequest {
  action: 'create' | 'update_status' | 'update_category' | 'archive'
  userId?: string
  storeId?: string
  name?: string
  slug?: string
  status?: string
  category?: string
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function assertUuid(value: string | undefined, field: string) {
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${field} must be a valid UUID`)
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

    const body = (await req.json()) as AdminStoreRequest
    const supabase = createServiceClient()

    if (body.action === 'create') {
      assertUuid(body.userId, 'userId')

      const name = body.name?.trim()
      if (!name) {
        return jsonResponse({ error: 'Store name is required' }, 400, origin)
      }

      const slug = normalizeSlug(body.slug || name)
      if (!slug) {
        return jsonResponse({ error: 'Store slug is required' }, 400, origin)
      }

      const { data, error } = await supabase.rpc('admin_create_vendor_store_v1', {
        p_actor_user_id: user.id,
        p_user_id: body.userId,
        p_name: name,
        p_slug: slug,
      })

      if (error) throw error
      return jsonResponse({ store: data }, 200, origin)
    }

    if (body.action === 'update_status') {
      assertUuid(body.storeId, 'storeId')
      if (!body.status || !STORE_STATUSES.has(body.status)) {
        return jsonResponse({ error: 'Invalid store status' }, 400, origin)
      }

      const { data, error } = await supabase.rpc('admin_update_store_status_v1', {
        p_actor_user_id: user.id,
        p_store_id: body.storeId,
        p_status: body.status,
      })

      if (error) throw error
      return jsonResponse({ store: data }, 200, origin)
    }

    if (body.action === 'update_category') {
      assertUuid(body.storeId, 'storeId')
      const category = body.category?.trim()
      if (!category || !STORE_CATEGORIES.has(category)) {
        return jsonResponse({ error: 'Invalid store category' }, 400, origin)
      }

      const { data, error } = await supabase.rpc('admin_update_store_category_v1', {
        p_actor_user_id: user.id,
        p_store_id: body.storeId,
        p_category: category,
      })

      if (error) throw error
      return jsonResponse({ store: data }, 200, origin)
    }

    if (body.action === 'archive') {
      assertUuid(body.storeId, 'storeId')

      const { data, error } = await supabase.rpc('admin_archive_store_v1', {
        p_actor_user_id: user.id,
        p_store_id: body.storeId,
      })

      if (error) throw error
      return jsonResponse({ store: data }, 200, origin)
    }

    return jsonResponse({ error: 'Invalid admin store action' }, 400, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Admin store operation failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Admin store operation failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
