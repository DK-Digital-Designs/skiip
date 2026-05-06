import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Webhook } from "npm:svix@1.75.0"
import { logger } from "../_shared/logger.ts"
import { createServiceClient } from "../_shared/service.ts"
import { applyWebhookStatusToNotification } from "../_shared/notifications.ts"

const log = logger("resend-email-webhook")
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET")?.trim()

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
}

type ResendWebhookEvent = {
  type: string
  created_at?: string
  data?: {
    email_id?: string
    failed?: {
      reason?: string
    } | null
    bounce?: {
      message?: string
      type?: string
      subType?: string
    } | null
    complaint?: {
      reason?: string
    } | null
    tags?: Record<string, string> | null
  } | null
}

function mapEventTypeToStatus(eventType: string) {
  switch (eventType) {
    case "email.sent":
      return "sent"
    case "email.delivered":
      return "delivered"
    case "email.delivery_delayed":
      return "sent"
    case "email.failed":
    case "email.bounced":
    case "email.complained":
    case "email.suppressed":
      return "failed"
    default:
      return null
  }
}

function getEventErrorMessage(event: ResendWebhookEvent) {
  if (event.type === "email.failed") {
    return event.data?.failed?.reason || "Resend reported a failed send"
  }

  if (event.type === "email.bounced") {
    return event.data?.bounce?.message || "Resend reported a bounced email"
  }

  if (event.type === "email.complained") {
    return event.data?.complaint?.reason || "Recipient marked the email as spam"
  }

  if (event.type === "email.suppressed") {
    return "Recipient is currently suppressed by Resend"
  }

  return null
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    })
  }

  if (!RESEND_WEBHOOK_SECRET) {
    return new Response(
      JSON.stringify({ error: "RESEND_WEBHOOK_SECRET is not configured" }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }

  try {
    const payload = await req.text()
    const svixId = req.headers.get("svix-id")
    const svixTimestamp = req.headers.get("svix-timestamp")
    const svixSignature = req.headers.get("svix-signature")

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response(
        JSON.stringify({ error: "Missing Svix signature headers" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    let event: ResendWebhookEvent
    try {
      event = new Webhook(RESEND_WEBHOOK_SECRET).verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ResendWebhookEvent
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      log.warn("Rejected invalid Resend webhook signature", { error: message })
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const emailId = event.data?.email_id
    if (!emailId) {
      return new Response(JSON.stringify({ skipped: true, reason: "Missing email_id" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createServiceClient()
    const { data: existingNotification, error: lookupError } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("message_sid", emailId)
      .eq("channel", "email")
      .maybeSingle()

    if (lookupError) {
      throw new Error(`Failed to look up notification log: ${lookupError.message}`)
    }

    const { data: insertedEvent, error: insertError } = await supabase
      .from("notification_webhook_events")
      .insert({
        provider: "resend",
        delivery_id: svixId,
        event_type: event.type,
        notification_log_id: existingNotification?.id || null,
        payload: event,
      })
      .select("id")
      .maybeSingle()

    if (insertError) {
      if (insertError.code === "23505") {
        log.info("Duplicate Resend webhook delivery ignored", {
          deliveryId: svixId,
          eventType: event.type,
        })
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      throw new Error(`Failed to persist webhook delivery: ${insertError.message}`)
    }

    if (!insertedEvent) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const mappedStatus = mapEventTypeToStatus(event.type)
    if (mappedStatus) {
      await applyWebhookStatusToNotification({
        supabase,
        channel: "email",
        messageSid: emailId,
        status: mappedStatus,
        provider: "resend",
        occurredAt: event.created_at,
        errorMessage: getEventErrorMessage(event),
        metadata: {
          resend_event_type: event.type,
          resend_delivery_id: svixId,
          resend_tags: event.data?.tags || {},
          resend_event: event,
        },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    log.error("Failed to process Resend webhook", { error: message })
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
