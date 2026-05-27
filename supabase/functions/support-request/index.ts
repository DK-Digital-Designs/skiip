import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAuthErrorStatus, requireUser } from "../_shared/auth.ts"
import { buildCorsHeaders, isAllowedOrigin, jsonResponse } from "../_shared/http.ts"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"
import { sendSupportRequestAlertEmail } from "../_shared/support-alerts.ts"
import {
  BUYER_ISSUE_TYPES,
  BUYER_ORDER_REQUIRED_ISSUE_TYPES,
  createSupportReferenceCode,
  VENDOR_ISSUE_TYPES,
} from "../_shared/support-requests.ts"

const log = logger('support-request')

interface SubmissionRequest {
  issueType?: string
  orderId?: string | null
  contactPhone?: string | null
  description?: string
  acknowledged?: boolean
}

function assertUuidOrNull(value: string | null | undefined) {
  if (!value) return
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('orderId must be a valid UUID')
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
    if (user.role !== 'buyer' && user.role !== 'seller') {
      return jsonResponse({ error: 'Only buyers and vendors can report issues' }, 403, origin)
    }

    const body = (await req.json()) as SubmissionRequest
    const issueType = body.issueType?.trim() || ''
    const description = body.description?.trim() || ''
    const contactPhone = body.contactPhone?.trim() || null
    assertUuidOrNull(body.orderId)

    if (description.length < 10 || description.length > 2000) {
      return jsonResponse({ error: 'Description must be between 10 and 2000 characters' }, 400, origin)
    }

    if (body.acknowledged !== true) {
      return jsonResponse({ error: 'You must acknowledge that SKIIP will review this request' }, 400, origin)
    }

    const supabase = createServiceClient()
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw profileError || new Error('Unable to read reporter profile')
    }

    const contactEmail = profile.email || user.email
    if (!contactEmail) {
      return jsonResponse({ error: 'Your account requires an email address before an issue can be submitted' }, 400, origin)
    }

    let orderId: string | null = null
    let storeId: string | null = null
    let source = 'buyer_submission'
    let priority = 'normal'

    if (user.role === 'buyer') {
      if (!BUYER_ISSUE_TYPES.has(issueType)) {
        return jsonResponse({ error: 'Invalid buyer issue type' }, 400, origin)
      }

      if (BUYER_ORDER_REQUIRED_ISSUE_TYPES.has(issueType) && !body.orderId) {
        return jsonResponse({ error: 'Select an order for this issue type' }, 400, origin)
      }

      if (body.orderId) {
        const { data: order, error } = await supabase
          .from('orders')
          .select('id, store_id')
          .eq('id', body.orderId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        if (!order) {
          return jsonResponse({ error: 'Order not found for this account' }, 404, origin)
        }

        orderId = order.id
        storeId = order.store_id
      }

      priority = issueType === 'refund_request' ? 'high' : 'normal'
    } else {
      source = 'vendor_submission'
      if (!VENDOR_ISSUE_TYPES.has(issueType)) {
        return jsonResponse({ error: 'Invalid vendor issue type' }, 400, origin)
      }

      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

      if (storeError) throw storeError
      if (!store) {
        return jsonResponse({ error: 'No active store was found for this vendor account' }, 404, origin)
      }

      storeId = store.id
      if (body.orderId) {
        const { data: order, error } = await supabase
          .from('orders')
          .select('id')
          .eq('id', body.orderId)
          .eq('store_id', store.id)
          .maybeSingle()

        if (error) throw error
        if (!order) {
          return jsonResponse({ error: 'Order not found for this store' }, 404, origin)
        }
        orderId = order.id
      }
    }

    const referenceCode = createSupportReferenceCode()
    const { data: supportRequest, error: insertError } = await supabase
      .from('support_requests')
      .insert({
        reference_code: referenceCode,
        source,
        reporter_user_id: user.id,
        reporter_role: user.role,
        order_id: orderId,
        store_id: storeId,
        contact_name: profile.full_name?.trim() || contactEmail,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        issue_type: issueType,
        description,
        acknowledged_at: new Date().toISOString(),
        status: 'open',
        priority,
      })
      .select('id, reference_code, status, priority, created_at')
      .single()

    if (insertError || !supportRequest) {
      throw insertError || new Error('Unable to submit support request')
    }

    await supabase.from('audit_logs').insert({
      event_type: 'support_request_created',
      entity_type: 'support_request',
      entity_id: supportRequest.id,
      actor_user_id: user.id,
      actor_role: user.role,
      payload: {
        source,
        issue_type: issueType,
        order_id: orderId,
        store_id: storeId,
        priority,
      },
    })

    try {
      const alert = await sendSupportRequestAlertEmail({
        id: supportRequest.id,
        referenceCode: supportRequest.reference_code,
        source,
        reporterRole: user.role,
        contactName: profile.full_name?.trim() || contactEmail,
        contactEmail,
        contactPhone,
        issueType,
        priority,
        orderId,
        storeId,
        description,
        createdAt: supportRequest.created_at || null,
      })

      log.info('Support request alert email sent', {
        supportRequestId: supportRequest.id,
        referenceCode: supportRequest.reference_code,
        recipient: alert.recipient,
        messageId: alert.messageId,
      })
    } catch (alertError: unknown) {
      const message = alertError instanceof Error ? alertError.message : String(alertError)
      log.error('Support request alert email failed', {
        supportRequestId: supportRequest.id,
        referenceCode: supportRequest.reference_code,
        error: message,
      })

      await supabase.from('audit_logs').insert({
        event_type: 'support_request_email_failed',
        entity_type: 'support_request',
        entity_id: supportRequest.id,
        actor_user_id: user.id,
        actor_role: user.role,
        payload: {
          reference_code: supportRequest.reference_code,
          error: message,
        },
      })
    }

    return jsonResponse({ request: supportRequest }, 201, origin)
  } catch (err: unknown) {
    const error = err as Error
    log.error('Support request submission failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message || 'Support request submission failed' }, getAuthErrorStatus(err) || 400, origin)
  }
})
