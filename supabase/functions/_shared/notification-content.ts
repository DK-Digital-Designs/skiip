import type {
  NotificationEvent,
  NotificationPayloadSnapshot,
  OrderNotificationRecord,
} from "./notification-types.ts";

const EVENT_COPY: Record<
  NotificationEvent,
  { subject: string; headline: string; statusLabel: string; intro: string }
> = {
  order_paid: {
    subject: "Your SKIIP order is confirmed",
    headline: "Your order has been confirmed and sent to the vendor.",
    statusLabel: "Confirmed",
    intro: "We will let you know when it is ready to collect.",
  },
  order_preparing: {
    subject: "Your SKIIP order is being prepared",
    headline: "The vendor has started preparing your order.",
    statusLabel: "Preparing",
    intro: "Your order is moving through the kitchen now.",
  },
  order_ready: {
    subject: "Your SKIIP order is ready for pickup",
    headline: "Your order is ready to collect now.",
    statusLabel: "Ready for pickup",
    intro: "Head over to the vendor collection point when you are ready.",
  },
  order_cancelled: {
    subject: "Your SKIIP order was cancelled",
    headline:
      "Your order has been cancelled. If payment was taken, find this order in SKIIP and submit the return form. The SKIIP team will confirm your refund.",
    statusLabel: "Cancelled",
    intro: "Use the Track your order link to open this order in SKIIP.",
  },
  order_refunded: {
    subject: "Your SKIIP order has been refunded",
    headline: "Your refund has been issued.",
    statusLabel: "Refunded",
    intro: "Refunds can take a little time to appear with your card provider.",
  },
};

const TRACK_ORDER_URL = "https://www.skiip.co.uk/#/order/profile";
const LATE_COLLECTION_NOTICE = [
  "To enjoy your food at its best, we kindly ask that you collect your order within 20 minutes of being notified that it is ready.",
  "After 20 minutes, the vendor is unable to guarantee the temperature or quality of the food, and refund requests related to delayed collection cannot be accommodated. Thank you for your understanding and cooperation.",
] as const;

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2);
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildDetailRow(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return `
    <tr>
      <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">${escapeHtml(label)}</td>
      <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 700; text-align: right;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function formatScheduledCollection(
  scheduledAt: string | null | undefined,
  timeZone = "Europe/London",
) {
  if (!scheduledAt) {
    return null;
  }

  const date = new Date(scheduledAt);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return `${new Intl.DateTimeFormat("en-GB", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)} UK time`;
}

export function createNotificationPayloadSnapshot(
  order: OrderNotificationRecord,
): NotificationPayloadSnapshot {
  return {
    orderId: order.id,
    storeId: order.store_id || null,
    orderNumber: order.order_number,
    customerEmail: order.customer_email || null,
    customerPhone: order.customer_phone || null,
    total: formatMoney(order.total),
    refundAmount:
      order.refund_amount === null || order.refund_amount === undefined
        ? null
        : formatMoney(order.refund_amount),
    scheduledCollectionAt: order.scheduled_collection_at || null,
    scheduledCollectionTimezone: order.scheduled_collection_timezone || null,
    scheduledCollectionLabel: formatScheduledCollection(
      order.scheduled_collection_at,
      order.scheduled_collection_timezone || "Europe/London",
    ),
    status: order.status,
    whatsappOptIn: order.whatsapp_opt_in === true,
    storeName: order.stores?.name || null,
    pickupLocation: order.stores?.pickup_location || null,
  };
}

export function buildEmailContent(
  payload: NotificationPayloadSnapshot,
  eventType: NotificationEvent,
) {
  const copy = EVENT_COPY[eventType];
  const vendorName = payload.storeName || "your vendor";
  const cancellationNotice = eventType === "order_paid"
    ? "Please note: Orders cannot be cancelled once the vendor has started preparing the food."
    : null;
  const lateCollectionNotice = eventType === "order_ready"
    ? LATE_COLLECTION_NOTICE
    : [];
  const refundRow =
    eventType === "order_refunded" && payload.refundAmount
      ? buildDetailRow("Refund amount", `GBP ${payload.refundAmount}`)
      : "";
  const pickupRow =
    eventType === "order_ready" && payload.pickupLocation
      ? buildDetailRow("Pickup location", payload.pickupLocation)
      : "";
  const scheduledRow = payload.scheduledCollectionLabel
    ? buildDetailRow("Scheduled collection", payload.scheduledCollectionLabel)
    : "";

  const html = `
    <div style="margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #111827;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f3f4f6;">
        <tr>
          <td align="center" style="padding: 28px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; max-width: 560px; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 14px 40px rgba(17, 24, 39, 0.12);">
              <tr>
                <td style="background: #111827; padding: 26px 28px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">SKIIP</p>
                  <h1 style="margin: 8px 0 0; color: #ffffff; font-size: 24px; line-height: 1.25; font-weight: 800;">${escapeHtml(copy.headline)}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 26px 28px 8px;">
                  <span style="display: inline-block; padding: 7px 12px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;">${escapeHtml(copy.statusLabel)}</span>
                  <p style="margin: 18px 0 0; color: #374151; font-size: 16px; line-height: 1.6;">${escapeHtml(copy.intro)}</p>
                  ${cancellationNotice ? `<p style="margin: 16px 0 0; color: #111827; font-size: 14px; line-height: 1.6; font-weight: 700;">${escapeHtml(cancellationNotice)}</p>` : ""}
                  ${lateCollectionNotice.map((paragraph) => `<p style="margin: 16px 0 0; color: #111827; font-size: 14px; line-height: 1.6; font-weight: 700;">${escapeHtml(paragraph)}</p>`).join("")}
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 28px 8px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                    ${buildDetailRow("Order", payload.orderNumber)}
                    ${buildDetailRow("Vendor", vendorName)}
                    ${buildDetailRow("Status", copy.statusLabel)}
                    ${buildDetailRow("Total paid", `GBP ${payload.total}`)}
                    ${scheduledRow}
                    ${refundRow}
                    ${pickupRow}
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 18px 28px 30px;">
                  <a href="${TRACK_ORDER_URL}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 13px 18px; border-radius: 10px; font-size: 14px; font-weight: 800;">Track your order</a>
                  <p style="margin: 18px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">You can also track the latest order state in the SKIIP app.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  const lines = [
    "SKIIP",
    copy.headline,
    copy.intro,
    `Order: ${payload.orderNumber}`,
    `Vendor: ${vendorName}`,
    `Status: ${copy.statusLabel}`,
    `Total paid: GBP ${payload.total}`,
  ];

  if (payload.scheduledCollectionLabel) {
    lines.push(`Scheduled collection: ${payload.scheduledCollectionLabel}`);
  }

  if (cancellationNotice) {
    lines.push(cancellationNotice);
  }

  if (lateCollectionNotice.length > 0) {
    lines.push(...lateCollectionNotice);
  }

  if (eventType === "order_refunded" && payload.refundAmount) {
    lines.push(`Refund amount: GBP ${payload.refundAmount}`);
  }

  if (eventType === "order_ready" && payload.pickupLocation) {
    lines.push(`Pickup location: ${payload.pickupLocation}`);
  }

  lines.push(`Track your order: ${TRACK_ORDER_URL}`);

  return {
    subject: copy.subject,
    html,
    text: lines.join("\n"),
  };
}

export function getWhatsAppAmount(
  payload: NotificationPayloadSnapshot,
  eventType: NotificationEvent,
) {
  return eventType === "order_refunded"
    ? payload.refundAmount || payload.total
    : payload.total;
}
