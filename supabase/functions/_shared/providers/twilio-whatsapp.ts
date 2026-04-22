import { logger } from "../logger.ts";
import { getConfiguredEnv } from "../notification-config.ts";
import { getWhatsAppAmount } from "../notification-content.ts";
import {
  ProviderDispatchError,
  type NotificationEvent,
  type ProviderDispatchInput,
  type ProviderDispatchResult,
} from "../notification-types.ts";

const log = logger("twilio-whatsapp-provider");

const TEMPLATE_ENV_KEYS: Record<NotificationEvent, string[]> = {
  order_paid: [
    "TWILIO_TEMPLATE_ORDER_PAID",
    "TWILIO_TEMPLATE_ORDER_CONFIRMATION",
  ],
  order_preparing: ["TWILIO_TEMPLATE_ORDER_PREPARING"],
  order_ready: [
    "TWILIO_TEMPLATE_ORDER_READY",
    "TWILIO_TEMPLATE_READY_FOR_COLLECTION",
  ],
  order_cancelled: ["TWILIO_TEMPLATE_ORDER_CANCELLED"],
  order_refunded: ["TWILIO_TEMPLATE_ORDER_REFUNDED"],
};

function getTemplateSid(eventType: NotificationEvent) {
  return getConfiguredEnv(...TEMPLATE_ENV_KEYS[eventType]);
}

function getDefaultCountryCode() {
  const configuredCountryCode = (
    getConfiguredEnv("WHATSAPP_DEFAULT_COUNTRY_CODE") || "44"
  )
    .trim()
    .replace(/^\+/, "");

  if (!/^\d{1,3}$/.test(configuredCountryCode)) {
    log.error("Invalid WhatsApp default country code", {
      configuredCountryCode,
      reason: "invalid_default_country_code",
    });
    return null;
  }

  return configuredCountryCode;
}

function normalizePhone(customerPhone: string) {
  const stripped = customerPhone.trim().replace(/[\s\-()]/g, "");
  const hasExplicitCountryCode =
    stripped.startsWith("+") || stripped.startsWith("00");
  const defaultCountryCode = getDefaultCountryCode();

  if (!defaultCountryCode) {
    return null;
  }

  let normalized = stripped;

  if (stripped.startsWith("+")) {
    normalized = stripped.slice(1);
  } else if (stripped.startsWith("00")) {
    normalized = stripped.slice(2);
  }

  if (!normalized) {
    return null;
  }

  if (!hasExplicitCountryCode) {
    if (normalized.startsWith("0")) {
      normalized = `${defaultCountryCode}${normalized.slice(1)}`;
    } else if (!normalized.startsWith(defaultCountryCode)) {
      return null;
    }
  }

  if (/\D/.test(normalized) || normalized.length < 8 || normalized.length > 15) {
    return null;
  }

  return `+${normalized}`;
}

function formatTwilioWhatsappAddress(sender: string) {
  return sender.startsWith("whatsapp:") ? sender : `whatsapp:${sender}`;
}

function buildTwilioStatusCallbackUrl(
  supabaseUrl?: string,
  webhookToken?: string,
) {
  if (!supabaseUrl) {
    return null;
  }

  const callbackBase = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/whatsapp-status-webhook`;
  return webhookToken
    ? `${callbackBase}?token=${encodeURIComponent(webhookToken)}`
    : callbackBase;
}

export async function sendTwilioWhatsAppMessage(
  { payload, eventType }: ProviderDispatchInput,
): Promise<ProviderDispatchResult> {
  const twilioAccountSid = getConfiguredEnv("TWILIO_ACCOUNT_SID");
  const twilioAuthToken = getConfiguredEnv("TWILIO_AUTH_TOKEN");
  const twilioWhatsappFrom = getConfiguredEnv(
    "TWILIO_WHATSAPP_FROM",
    "TWILIO_WHATSAPP_NUMBER",
  );
  const twilioWebhookToken = getConfiguredEnv("TWILIO_WEBHOOK_TOKEN");
  const supabaseUrl = getConfiguredEnv("SUPABASE_URL");
  const templateSid = getTemplateSid(eventType);

  if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsappFrom || !templateSid) {
    throw new ProviderDispatchError(
      "Twilio WhatsApp provider is not fully configured",
      {
        retryable: false,
        metadata: { reason: "missing_configuration" },
      },
    );
  }

  if (!payload.whatsappOptIn) {
    throw new ProviderDispatchError("WhatsApp opt-in is disabled for this order", {
      retryable: false,
      metadata: { reason: "whatsapp_not_opted_in" },
    });
  }

  if (!payload.customerPhone) {
    throw new ProviderDispatchError("Missing customer WhatsApp number", {
      retryable: false,
      metadata: { reason: "missing_customer_phone" },
    });
  }

  const normalizedPhone = normalizePhone(payload.customerPhone);
  if (!normalizedPhone) {
    throw new ProviderDispatchError("Invalid WhatsApp phone number", {
      retryable: false,
      metadata: { reason: "invalid_phone_number" },
    });
  }

  const formData = new URLSearchParams();
  formData.append("To", `whatsapp:${normalizedPhone}`);
  formData.append("From", formatTwilioWhatsappAddress(twilioWhatsappFrom));
  formData.append("ContentSid", templateSid);
  formData.append(
    "ContentVariables",
    JSON.stringify({
      1: payload.orderNumber,
      2: payload.storeName || "SKIIP vendor",
      3: getWhatsAppAmount(payload, eventType),
    }),
  );

  const statusCallbackUrl = buildTwilioStatusCallbackUrl(
    supabaseUrl,
    twilioWebhookToken,
  );
  if (statusCallbackUrl) {
    formData.append("StatusCallback", statusCallbackUrl);
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ProviderDispatchError(`Twilio request failed: ${message}`, {
      retryable: true,
      metadata: { reason: "network_error" },
    });
  }

  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = responsePayload?.message || response.statusText;
    throw new ProviderDispatchError(`Twilio API error: ${errorMessage}`, {
      retryable: response.status >= 500 || response.status === 429,
      metadata: responsePayload || {},
      statusCode: response.status,
    });
  }

  if (!responsePayload?.sid) {
    throw new ProviderDispatchError("Twilio API response missing sid", {
      retryable: true,
      metadata: responsePayload || {},
    });
  }

  return {
    messageSid: responsePayload.sid,
    sentAt: new Date().toISOString(),
    metadata: responsePayload || {},
  };
}
