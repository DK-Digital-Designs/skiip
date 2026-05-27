interface RefundableOrder {
  id: string
  payment_intent_id?: string | null
  charge_id?: string | null
}

export function buildFullDestinationChargeRefundParameters(order: RefundableOrder) {
  const paymentTarget = order.payment_intent_id
    ? { payment_intent: order.payment_intent_id }
    : { charge: order.charge_id }

  return {
    ...paymentTarget,
    reason: 'requested_by_customer' as const,
    reverse_transfer: true,
    refund_application_fee: true,
    metadata: { order_id: order.id },
  }
}
