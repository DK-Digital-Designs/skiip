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

function formParamsToObject(params: URLSearchParams) {
  const payload: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }

  return payload;
}

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

    const { data: existingNotification, error: lookupError } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("message_sid", messageSid)
      .eq("channel", "whatsapp")
      .maybeSingle();

    if (lookupError) {
      throw new Error(
        `Failed to look up WhatsApp notification log: ${lookupError.message}`,
      );
    }

    const deliveryId = `${messageSid}:${providerStatus.toLowerCase()}`;
    const { error: insertError } = await supabase
      .from("notification_webhook_events")
      .insert({
        provider: "twilio",
        delivery_id: deliveryId,
        event_type: providerStatus,
        notification_log_id: existingNotification?.id || null,
        payload: formParamsToObject(params),
      });

    if (insertError) {
      if (insertError.code === "23505") {
        log.info("Duplicate Twilio WhatsApp webhook delivery ignored", {
          deliveryId,
          messageSid,
          providerStatus,
        });
      } else {
        throw new Error(
          `Failed to persist WhatsApp webhook delivery: ${insertError.message}`,
        );
      }
    }

    await applyWebhookStatusToNotification({
      supabase,
      channel: "whatsapp",
      messageSid,
      status,
      provider: "twilio",
      errorMessage: status === "failed"
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    log.error("Failed to process webhook", { error: message, stack });

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
