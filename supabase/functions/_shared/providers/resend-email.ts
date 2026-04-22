import {
  getConfiguredEnv,
  getNotificationUserAgent,
} from "../notification-config.ts";
import { buildEmailContent } from "../notification-content.ts";
import {
  ProviderDispatchError,
  type ProviderDispatchInput,
  type ProviderDispatchResult,
} from "../notification-types.ts";

export async function sendResendEmailMessage(
  { notification, payload, eventType }: ProviderDispatchInput,
): Promise<ProviderDispatchResult> {
  const resendApiKey = getConfiguredEnv("RESEND_API_KEY");
  const fromEmail = getConfiguredEnv("NOTIFICATION_FROM_EMAIL");

  if (!resendApiKey || !fromEmail) {
    throw new ProviderDispatchError(
      "Resend email provider is not fully configured",
      {
        retryable: false,
        metadata: { reason: "missing_configuration" },
      },
    );
  }

  if (!payload.customerEmail) {
    throw new ProviderDispatchError("Missing customer email", {
      retryable: false,
      metadata: { reason: "missing_customer_email" },
    });
  }

  const content = buildEmailContent(payload, eventType);

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": notification.id,
        "User-Agent": getNotificationUserAgent(),
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.customerEmail],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ProviderDispatchError(`Resend request failed: ${message}`, {
      retryable: true,
      metadata: { reason: "network_error" },
    });
  }

  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = responsePayload?.message || response.statusText;
    throw new ProviderDispatchError(`Resend API error: ${errorMessage}`, {
      retryable: response.status >= 500 || response.status === 429,
      metadata: responsePayload || {},
      statusCode: response.status,
    });
  }

  if (!responsePayload?.id) {
    throw new ProviderDispatchError("Resend API response missing email id", {
      retryable: true,
      metadata: responsePayload || {},
    });
  }

  return {
    messageSid: responsePayload.id,
    sentAt: new Date().toISOString(),
    metadata: responsePayload || {},
  };
}
