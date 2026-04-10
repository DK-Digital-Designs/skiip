import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logger } from "../_shared/logger.ts"
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts"

const log = logger('whatsapp-notify')

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') // e.g., +14155238886

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
    const payload = await req.json()
    const { record, old_record, type } = payload

    // Only process updates to the 'status' column
    if (type !== 'UPDATE' || record.status === old_record.status) {
      return new Response(JSON.stringify({ skipped: true, reason: 'No status change' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { status, customer_phone, order_number, id } = record
    
    if (!customer_phone) {
      log.warn(`No phone number for order ${id}`, { order_number })
      return new Response(JSON.stringify({ skipped: true, reason: 'No phone number' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Define message templates
    let message = ''
    switch (status) {
      case 'paid':
        message = `✅ SKIIP: Order ${order_number} confirmed! We'll notify you when it's being prepared.`
        break
      case 'preparing':
        message = `👨‍🍳 SKIIP: Your order ${order_number} is now being prepared!`
        break
      case 'ready':
        message = `⚡ SKIIP: Your order ${order_number} is READY for pickup! Please head to the vendor area.`
        break
      case 'cancelled':
        message = `❌ SKIIP: Order ${order_number} has been cancelled. Please check the app for details.`
        break
      default:
        return new Response(JSON.stringify({ skipped: true, reason: 'Unmapped status' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    log.info(`Sending WhatsApp to ${customer_phone} for status: ${status}`)

    // Format phone number for WhatsApp (must start with + and include country code)
    let formattedPhone = customer_phone.trim()
    if (!formattedPhone.startsWith('+')) {
      // Default to UK if missing + (simple heuristic for pilot)
      formattedPhone = `+44${formattedPhone.startsWith('0') ? formattedPhone.slice(1) : formattedPhone}`
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)

    const formData = new URLSearchParams()
    formData.append('To', `whatsapp:${formattedPhone}`)
    formData.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`)
    formData.append('Body', message)

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
      throw new Error(`Twilio API error: ${result.message || response.statusText}`)
    }

    log.info(`WhatsApp sent successfully to ${customer_phone}`, { sid: result.sid })

    return jsonResponse({ success: true, sid: result.sid }, 200, origin)
  } catch (error) {
    log.error('WhatsApp notification failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message }, 500, origin)
  }
})
