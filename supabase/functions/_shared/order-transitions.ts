export const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["collected", "cancelled"],
  collected: [],
  cancelled: [],
  refunded: [],
};

export interface OrderTransitionSnapshot {
  status: string;
  payment_status?: string | null;
  user_id?: string | null;
}

export function getAllowedOrderTransitions(status: string) {
  return ALLOWED_ORDER_TRANSITIONS[status] || [];
}

export function isUnpaidPaymentStatus(
  paymentStatus: string | null | undefined,
) {
  return ["pending", "failed"].includes(paymentStatus || "pending");
}

export function isPendingUnpaidCancellation(
  order: OrderTransitionSnapshot,
  nextStatus: string,
) {
  return (
    order.status === "pending" &&
    nextStatus === "cancelled" &&
    isUnpaidPaymentStatus(order.payment_status)
  );
}

export function isIdempotentUnpaidCancellation(
  order: OrderTransitionSnapshot,
  nextStatus: string,
) {
  return (
    order.status === "cancelled" &&
    nextStatus === "cancelled" &&
    isUnpaidPaymentStatus(order.payment_status)
  );
}

export function isBuyerOwnedUnpaidCancellation(
  order: OrderTransitionSnapshot,
  nextStatus: string,
  userId: string,
) {
  return (
    (isPendingUnpaidCancellation(order, nextStatus) ||
      isIdempotentUnpaidCancellation(order, nextStatus)) &&
    order.user_id === userId
  );
}
