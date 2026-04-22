import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logger } from "../_shared/logger.ts";
import { createServiceClient } from "../_shared/service.ts";
import { applyWebhookStatusToNotification } from "../_shared/notifications.ts";

const log = logger("whatsapp-status-webhook");
const TWILIO_WEBHOOK_TOKEN = Deno.env.get("TWILIO_WEBHOOK_TOKEN")?.trim();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const mapStatus = (providerStatus: string | null) => {
  switch ((providerStatus || "").toLowerCase()) {
    case "queued":
    case "accepted":
      return "queued";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
    case "undelivered":
      return "failed";
    default:
      return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token");
    const headerMatches = authHeader === `Bearer ${TWILIO_WEBHOOK_TOKEN}`;
    const queryMatches = queryToken === TWILIO_WEBHOOK_TOKEN;

    if (TWILIO_WEBHOOK_TOKEN && !headerMatches && !queryMatches) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const params = new URLSearchParams(body);

    const messageSid = params.get("MessageSid");
    const providerStatus = params.get("MessageStatus");
    const errorMessage = params.get("ErrorMessage");

    if (!messageSid || !providerStatus) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "Missing MessageSid or MessageStatus",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const status = mapStatus(providerStatus);
    if (!status) {
      log.warn("Unmapped Twilio WhatsApp status received", {
        messageSid,
        providerStatus,
      });
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: `Unmapped status: ${providerStatus}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createServiceClient();

    await applyWebhookStatusToNotification({
      supabase,
      channel: "whatsapp",
      messageSid,
      status,
      provider: "twilio",
      errorMessage:
        status === "failed"
          ? errorMessage || "Unknown delivery failure"
          : null,
      metadata: {
        twilio_status: providerStatus,
        twilio_error_message: errorMessage,
      },
    });

    log.info("WhatsApp delivery status updated", {
      messageSid,
      providerStatus,
      status,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    log.error("Failed to process webhook", {
      error: error.message,
      stack: error.stack,
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
