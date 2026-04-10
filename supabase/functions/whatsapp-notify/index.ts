import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logger } from "../_shared/logger.ts"
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts"

const log = logger('whatsapp-notify')

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') // e.g., +14155238886
const TWILIO_TEMPLATE_ORDER_CONFIRMATION = Deno.env.get('TWILIO_TEMPLATE_ORDER_CONFIRMATION')
const TWILIO_TEMPLATE_ORDER_PREPARING = Deno.env.get('TWILIO_TEMPLATE_ORDER_PREPARING')
const TWILIO_TEMPLATE_READY_FOR_COLLECTION = Deno.env.get('TWILIO_TEMPLATE_READY_FOR_COLLECTION')
const TWILIO_TEMPLATE_ORDER_CANCELLED = Deno.env.get('TWILIO_TEMPLATE_ORDER_CANCELLED')

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const templateMap: Record<string, string | undefined> = {
  paid: TWILIO_TEMPLATE_ORDER_CONFIRMATION,
  preparing: TWILIO_TEMPLATE_ORDER_PREPARING,
  ready: TWILIO_TEMPLATE_READY_FOR_COLLECTION,
  cancelled: TWILIO_TEMPLATE_ORDER_CANCELLED,
}

const normalizePhone = (customerPhone: string) => {
  const trimmed = customerPhone.trim()
  if (trimmed.startsWith('+')) return trimmed
  return `+44${trimmed.startsWith('0') ? trimmed.slice(1) : trimmed}`
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase service role environment variables')
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Missing Twilio WhatsApp environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const payload = await req.json()
    const { record, old_record, type } = payload

    if (type !== 'UPDATE' || record.status === old_record.status) {
      return jsonResponse({ skipped: true, reason: 'No status change' }, 200, origin)
    }

    if (!record.whatsapp_opt_in) {
      return jsonResponse({ skipped: true, reason: 'WhatsApp opt-in disabled' }, 200, origin)
    }

    const orderId = record.id as string

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, customer_phone, total, stores(name)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Order lookup failed: ${orderError?.message || 'missing order'}`)
    }

    if (!order.customer_phone) {
      log.warn(`No phone number for order ${order.id}`, { order_number: order.order_number })
      return jsonResponse({ skipped: true, reason: 'No phone number' }, 200, origin)
    }

    const templateSid = templateMap[order.status]
    if (!templateSid) {
      return jsonResponse({ skipped: true, reason: 'No mapped template' }, 200, origin)
    }

    const { data: queuedLog, error: queuedError } = await supabase
      .from('notification_logs')
      .insert({
        order_id: order.id,
        status: 'queued',
      })
      .select('id')
      .single()

    if (queuedError || !queuedLog) {
      throw new Error(`Failed to persist queued notification log: ${queuedError?.message || 'unknown error'}`)
    }

    const formattedPhone = normalizePhone(order.customer_phone)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    const contentVariables = {
      1: order.order_number,
      2: order.stores?.name || 'SKIIP vendor',
      3: Number(order.total || 0).toFixed(2),
    }

    const formData = new URLSearchParams()
    formData.append('To', `whatsapp:${formattedPhone}`)
    formData.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`)
    formData.append('ContentSid', templateSid)
    formData.append('ContentVariables', JSON.stringify(contentVariables))
    formData.append('StatusCallback', `${SUPABASE_URL}/functions/v1/whatsapp-status-webhook`)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const result = await response.json()

    if (!response.ok) {
      await supabase
        .from('notification_logs')
        .update({
          status: 'failed',
          error_message: result.message || response.statusText,
        })
        .eq('id', queuedLog.id)

      throw new Error(`Twilio API error: ${result.message || response.statusText}`)
    }

    await supabase
      .from('notification_logs')
      .update({
        message_sid: result.sid,
        status: 'sent',
        error_message: null,
      })
      .eq('id', queuedLog.id)

    log.info(`WhatsApp sent successfully to ${formattedPhone}`, { sid: result.sid, orderId: order.id })

    return jsonResponse({ success: true, sid: result.sid, logId: queuedLog.id }, 200, origin)
  } catch (error: any) {
    log.error('WhatsApp notification failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message }, 500, origin)
  }
})
