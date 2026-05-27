import {
  getConfiguredEnv,
  getNotificationUserAgent,
} from "./notification-config.ts"

const DEFAULT_SUPPORT_ALERT_EMAIL = "info@skiip.co.uk"
const ADMIN_ISSUES_URL = "https://www.skiip.co.uk/#/admin/issues"

export interface SupportAlertPayload {
  id: string
  referenceCode: string
  source: string
  reporterRole: string
  contactName: string
  contactEmail: string
  contactPhone: string | null
  issueType: string
  priority: string
  orderId: string | null
  storeId: string | null
  description: string
  createdAt: string | null
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function formatLabel(value: string | null | undefined) {
  return String(value || "").replaceAll("_", " ")
}

function buildText(payload: SupportAlertPayload) {
  return [
    "New SKIIP support request",
    `Case reference: ${payload.referenceCode}`,
    `Source: ${formatLabel(payload.source)}`,
    `Reporter role: ${payload.reporterRole}`,
    `Contact: ${payload.contactName} <${payload.contactEmail}>`,
    payload.contactPhone ? `Phone: ${payload.contactPhone}` : null,
    `Issue type: ${formatLabel(payload.issueType)}`,
    `Priority: ${payload.priority}`,
    payload.orderId ? `Order ID: ${payload.orderId}` : null,
    payload.storeId ? `Store ID: ${payload.storeId}` : null,
    payload.createdAt ? `Created at: ${payload.createdAt}` : null,
    "",
    "Description:",
    payload.description,
    "",
    `Admin Issues: ${ADMIN_ISSUES_URL}`,
  ].filter((line) => line !== null).join("\n")
}

function buildHtml(payload: SupportAlertPayload) {
  const row = (label: string, value: string | null | undefined) => value
    ? `<tr><td style="padding: 8px 0; color: #6b7280;">${escapeHtml(label)}</td><td style="padding: 8px 0; color: #111827; font-weight: 700;">${escapeHtml(value)}</td></tr>`
    : ""

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #111827; background: #f3f4f6; padding: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 24px;">
        <tr>
          <td>
            <p style="margin: 0 0 8px; color: #6d28d9; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">SKIIP Support</p>
            <h1 style="margin: 0 0 18px; font-size: 24px;">New support request ${escapeHtml(payload.referenceCode)}</h1>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
              ${row("Source", formatLabel(payload.source))}
              ${row("Reporter role", payload.reporterRole)}
              ${row("Contact", `${payload.contactName} <${payload.contactEmail}>`)}
              ${row("Phone", payload.contactPhone)}
              ${row("Issue type", formatLabel(payload.issueType))}
              ${row("Priority", payload.priority)}
              ${row("Order ID", payload.orderId)}
              ${row("Store ID", payload.storeId)}
              ${row("Created at", payload.createdAt)}
            </table>
            <h2 style="margin: 22px 0 8px; font-size: 16px;">Description</h2>
            <p style="white-space: pre-wrap; line-height: 1.55; color: #374151;">${escapeHtml(payload.description)}</p>
            <a href="${ADMIN_ISSUES_URL}" style="display: inline-block; margin-top: 18px; background: #111827; color: #ffffff; padding: 12px 16px; border-radius: 10px; text-decoration: none; font-weight: 800;">Open Admin Issues</a>
          </td>
        </tr>
      </table>
    </div>
  `
}

export async function sendSupportRequestAlertEmail(payload: SupportAlertPayload) {
  const resendApiKey = getConfiguredEnv("RESEND_API_KEY")
  const fromEmail = getConfiguredEnv("NOTIFICATION_FROM_EMAIL")
  const supportAlertEmail = getConfiguredEnv("SUPPORT_ALERT_EMAIL") ||
    DEFAULT_SUPPORT_ALERT_EMAIL

  if (!resendApiKey || !fromEmail) {
    throw new Error("Resend support alert email is not fully configured")
  }

  let response: Response
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `support-alert:${payload.id}`,
        "User-Agent": getNotificationUserAgent(),
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [supportAlertEmail],
        subject: `[SKIIP Support] ${payload.referenceCode} - ${payload.issueType}`,
        html: buildHtml(payload),
        text: buildText(payload),
      }),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Resend support alert request failed: ${message}`)
  }

  const responsePayload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = responsePayload?.message || response.statusText
    throw new Error(`Resend support alert API error: ${message}`)
  }

  return {
    recipient: supportAlertEmail,
    messageId: responsePayload?.id || null,
  }
}
