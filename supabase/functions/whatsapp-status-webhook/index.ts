import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"

const log = logger('whatsapp-status-webhook')

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const TWILIO_WEBHOOK_TOKEN = Deno.env.get('TWILIO_WEBHOOK_TOKEN')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const mapStatus = (providerStatus: string | null) => {
  switch ((providerStatus || '').toLowerCase()) {
    case 'queued':
    case 'accepted':
      return 'queued'
    case 'sent':
      return 'sent'
    case 'delivered':
      return 'delivered'
    case 'read':
      return 'read'
    case 'failed':
    case 'undelivered':
      return 'failed'
    default:
      return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase service role environment variables')
    }

    const authHeader = req.headers.get('authorization')
    const url = new URL(req.url)
    const queryToken = url.searchParams.get('token')
    const headerMatches = authHeader === `Bearer ${TWILIO_WEBHOOK_TOKEN}`
    const queryMatches = queryToken === TWILIO_WEBHOOK_TOKEN
    if (TWILIO_WEBHOOK_TOKEN && !headerMatches && !queryMatches) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)

    const messageSid = params.get('MessageSid')
    const providerStatus = params.get('MessageStatus')
    const errorMessage = params.get('ErrorMessage')

    if (!messageSid || !providerStatus) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Missing MessageSid or MessageStatus' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const status = mapStatus(providerStatus)
    if (!status) {
      return new Response(JSON.stringify({ skipped: true, reason: `Unmapped status: ${providerStatus}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createServiceClient()

    const { error: updateError } = await supabase
      .from('notification_logs')
      .update({
        status,
        error_message: status === 'failed' ? errorMessage || 'Unknown delivery failure' : null,
      })
      .eq('message_sid', messageSid)
      .eq('channel', 'whatsapp')

    if (updateError) {
      throw new Error(`Failed to update log status: ${updateError.message}`)
    }

    log.info('WhatsApp delivery status updated', { messageSid, providerStatus, status })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    log.error('Failed to process webhook', { error: error.message, stack: error.stack })

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
