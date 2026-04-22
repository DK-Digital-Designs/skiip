import type {
  NotificationEvent,
  NotificationPayloadSnapshot,
  OrderNotificationRecord,
} from "./notification-types.ts";

const EVENT_COPY: Record<
  NotificationEvent,
  { subject: string; headline: string; statusLabel: string }
> = {
  order_paid: {
    subject: "Your SKIIP order is confirmed",
    headline: "Your order has been confirmed and sent to the vendor.",
    statusLabel: "Confirmed",
  },
  order_preparing: {
    subject: "Your SKIIP order is being prepared",
    headline: "The vendor has started preparing your order.",
    statusLabel: "Preparing",
  },
  order_ready: {
    subject: "Your SKIIP order is ready for pickup",
    headline: "Your order is ready to collect now.",
    statusLabel: "Ready for pickup",
  },
  order_cancelled: {
    subject: "Your SKIIP order was cancelled",
    headline:
      "Your order has been cancelled. If payment was taken, support will advise on the next step.",
    statusLabel: "Cancelled",
  },
  order_refunded: {
    subject: "Your SKIIP order has been refunded",
    headline: "Your refund has been issued.",
    statusLabel: "Refunded",
  },
};

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toFixed(2);
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
  const refundLine =
    eventType === "order_refunded" && payload.refundAmount
      ? `<p><strong>Refund amount:</strong> GBP ${payload.refundAmount}</p>`
      : "";
  const pickupLine =
    eventType === "order_ready" && payload.pickupLocation
      ? `<p><strong>Pickup location:</strong> ${payload.pickupLocation}</p>`
      : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2>${copy.headline}</h2>
      <p><strong>Order:</strong> ${payload.orderNumber}</p>
      <p><strong>Vendor:</strong> ${payload.storeName || "your vendor"}</p>
      <p><strong>Status:</strong> ${copy.statusLabel}</p>
      <p><strong>Total:</strong> GBP ${payload.total}</p>
      ${refundLine}
      ${pickupLine}
      <p>You can track the latest order state in the SKIIP app.</p>
    </div>
  `;

  const lines = [
    copy.headline,
    `Order: ${payload.orderNumber}`,
    `Vendor: ${payload.storeName || "your vendor"}`,
    `Status: ${copy.statusLabel}`,
    `Total: GBP ${payload.total}`,
  ];

  if (eventType === "order_refunded" && payload.refundAmount) {
    lines.push(`Refund amount: GBP ${payload.refundAmount}`);
  }

  if (eventType === "order_ready" && payload.pickupLocation) {
    lines.push(`Pickup location: ${payload.pickupLocation}`);
  }

  lines.push("You can track the latest order state in the SKIIP app.");

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
