import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"

const log = logger('admin-support-request')
const STATUSES = new Set(['open', 'in_review', 'resolved', 'closed'])
const PRIORITIES = new Set(['normal', 'high', 'urgent'])

interface AdminSupportRequest {
  action?: 'list' | 'update'
  requestId?: string
  status?: string
  priority?: string
  internalNotes?: string | null
}

function assertUuid(value: string | undefined) {
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('requestId must be a valid UUID')
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
    return jsonResponse({ error: 'Origin not allowed' }, 403, origin)
  }

  try {
    const user = await requireUser(req)
    if (user.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403, origin)
    }

    const body = (await req.json()) as AdminSupportRequest
    const supabase = createServiceClient()

    if (body.action === 'list') {
      const { data, error } = await supabase
        .from('support_requests')
        .select(`
          id, reference_code, source, reporter_role, order_id, store_id,
          contact_name, contact_email, contact_phone, issue_type, description,
          acknowledged_at, status, priority, internal_notes, resolved_at,
          created_at, updated_at,
          orders(order_number, total, status, payment_status),
          stores(name)
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) throw error
      return jsonResponse({ requests: data || [] }, 200, origin)
    }

    if (body.action === 'update') {
      assertUuid(body.requestId)
      if (!body.status || !STATUSES.has(body.status)) {
        return jsonResponse({ error: 'Invalid support request status' }, 400, origin)
      }
      if (!body.priority || !PRIORITIES.has(body.priority)) {
        return jsonResponse({ error: 'Invalid support request priority' }, 400, origin)
      }

      const internalNotes = body.internalNotes?.trim() || null
      if (internalNotes && internalNotes.length > 4000) {
        return jsonResponse({ error: 'Internal notes must be 4000 characters or fewer' }, 400, origin)
      }

      const { data: supportRequest, error } = await supabase
        .from('support_requests')
        .update({
          status: body.status,
          priority: body.priority,
          internal_notes: internalNotes,
          resolved_at: body.status === 'resolved' || body.status === 'closed'
            ? new Date().toISOString()
            : null,
          updated_by: user.id,
        })
        .eq('id', body.requestId)
        .select('id, reference_code, status, priority, internal_notes, resolved_at, updated_at')
        .single()

      if (error || !supportRequest) {
        throw error || new Error('Support request not found')
      }

      await supabase.from('audit_logs').insert({
        event_type: 'support_request_updated',
        entity_type: 'support_request',
        entity_id: supportRequest.id,
        actor_user_id: user.id,
        actor_role: user.role,
        payload: {
          status: supportRequest.status,
          priority: supportRequest.priority,
        },
      })

      return jsonResponse({ request: supportRequest }, 200, origin)
    }

    return jsonResponse({ error: 'Invalid support request action' }, 400, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Admin support request operation failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Admin support request operation failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
