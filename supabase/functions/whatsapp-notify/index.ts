import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logger } from "../_shared/logger.ts"
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts"
import { createServiceClient } from "../_shared/service.ts"
import { sendTransactionalNotifications } from "../_shared/notifications.ts"

// This bridge remains because the repo still contains deployment and database-trigger
// dependencies for the route, and SQL cleanup is intentionally out of scope here.
const log = logger('whatsapp-notify')

const EVENT_MAP: Record<string, 'order_paid' | 'order_preparing' | 'order_ready' | 'order_cancelled' | 'order_refunded'> = {
  paid: 'order_paid',
  preparing: 'order_preparing',
  ready: 'order_ready',
  cancelled: 'order_cancelled',
  refunded: 'order_refunded',
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
    const supabase = createServiceClient()
    const payload = await req.json()
    const { record, old_record, type, eventType, orderId } = payload

    const derivedEventType =
      eventType ||
      (type === 'UPDATE' && record?.status !== old_record?.status ? EVENT_MAP[record.status] : undefined)
    const resolvedOrderId = orderId || record?.id

    if (!resolvedOrderId || !derivedEventType) {
      return jsonResponse({ skipped: true, reason: 'No supported notification event' }, 200, origin)
    }

    await sendTransactionalNotifications({
      supabase,
      orderId: resolvedOrderId,
      eventType: derivedEventType,
      channels: ['whatsapp'],
      correlationId: crypto.randomUUID(),
    })

    return jsonResponse({ success: true }, 200, origin)
  } catch (error: any) {
    log.error('WhatsApp notification failed', { error: error.message, stack: error.stack })
    return jsonResponse({ error: error.message }, 500, origin)
  }
})
