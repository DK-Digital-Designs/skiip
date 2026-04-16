import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"

const log = logger('whatsapp-status-webhook')
const encoder = new TextEncoder()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
}

const mapStatus = (providerStatus: string | null) => {
  switch ((providerStatus || '').toLowerCase()) {
    case 'sent':
      return 'sent'
    case 'delivered':
      return 'delivered'
    case 'read':
      return 'read'
    case 'failed':
      return 'failed'
    default:
      return null
  }
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function computeMetaSignature(rawBody: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  return `sha256=${toHex(signature)}`
}

function safeCompare(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let mismatch = 0
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }

  return mismatch === 0
}

function getMetaStatusErrorMessage(errors: any[] | undefined) {
  if (!errors?.length) {
    return 'Unknown delivery failure'
  }

  return errors.find((error) => typeof error?.message === 'string')?.message
    || errors.find((error) => typeof error?.title === 'string')?.title
    || errors.find((error) => typeof error?.error_data?.details === 'string')?.error_data?.details
    || 'Unknown delivery failure'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const verifyToken = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    const expectedVerifyToken = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')

    if (mode === 'subscribe' && verifyToken && expectedVerifyToken && verifyToken === expectedVerifyToken && challenge) {
      return new Response(challenge, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      })
    }

    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const rawBody = await req.text()
    const signatureHeader = req.headers.get('x-hub-signature-256')
    const metaAppSecret = Deno.env.get('META_APP_SECRET')

    if (metaAppSecret) {
      const expectedSignature = await computeMetaSignature(rawBody, metaAppSecret)
      if (!signatureHeader || !safeCompare(signatureHeader, expectedSignature)) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    } else {
      log.warn('META_APP_SECRET is not configured; skipping Meta webhook signature verification')
    }

    const payload = rawBody ? JSON.parse(rawBody) : {}
    const supabase = createServiceClient()
    let processedCount = 0

    for (const entry of payload?.entry || []) {
      for (const change of entry?.changes || []) {
        const statuses = change?.value?.statuses
        if (!Array.isArray(statuses)) {
          continue
        }

        for (const providerStatusRecord of statuses) {
          const messageSid = providerStatusRecord?.id || null
          const providerStatus = providerStatusRecord?.status || null

          if (!messageSid || !providerStatus) {
            continue
          }

          const status = mapStatus(providerStatus)
          if (!status) {
            log.warn('Unmapped Meta WhatsApp status received', { messageSid, providerStatus })
            continue
          }

          const { error: updateError } = await supabase
            .from('notification_logs')
            .update({
              status,
              error_message: status === 'failed'
                ? getMetaStatusErrorMessage(providerStatusRecord?.errors)
                : null,
            })
            .eq('message_sid', messageSid)
            .eq('channel', 'whatsapp')

          if (updateError) {
            throw new Error(`Failed to update log status: ${updateError.message}`)
          }

          processedCount += 1
          log.info('WhatsApp delivery status updated', { messageSid, providerStatus, status })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    log.error('Failed to process webhook', { error: error.message, stack: error.stack })

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
