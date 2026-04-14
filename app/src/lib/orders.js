export function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function calculateOrderSummary(items, tipAmount = 0) {
  const subtotal = roundCurrency(
    (items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
  const tip = roundCurrency(Math.max(Number(tipAmount || 0), 0));

  return {
    subtotal,
    tip,
    total: roundCurrency(subtotal + tip),
  };
}

export function getAllowedOrderTransitions(status) {
  const transitions = {
    pending: [],
    paid: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['collected', 'cancelled'],
    collected: [],
    cancelled: [],
    refunded: [],
  };

  return transitions[status] || [];
}

export function isRefundableOrder(order) {
  return order?.payment_status === 'succeeded' && order?.status !== 'refunded';
}
