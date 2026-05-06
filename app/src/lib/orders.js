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

function formatStatus(status) {
  return String(status || 'unknown').replaceAll('_', ' ').toUpperCase();
}

export function getOrderStatusLabel(order) {
  const status = order?.status;
  const paymentStatus = order?.payment_status;

  if (status === 'refunded' || paymentStatus === 'refunded') {
    return 'REFUNDED';
  }

  if (status === 'pending' && paymentStatus === 'succeeded') {
    return 'PAYMENT NEEDS RECONCILIATION';
  }

  if (status === 'pending' && paymentStatus === 'failed') {
    return 'PAYMENT FAILED';
  }

  if (status === 'pending') {
    return 'WAITING FOR PAYMENT';
  }

  if (status === 'paid' && paymentStatus === 'succeeded') {
    return 'READY TO PROCESS';
  }

  return formatStatus(status);
}

export function getOrderStatusColor(order) {
  const status = order?.status;
  const paymentStatus = order?.payment_status;

  if (status === 'refunded' || paymentStatus === 'refunded') return '#f59e0b';
  if (status === 'pending' && paymentStatus === 'succeeded') return '#f59e0b';
  if (paymentStatus === 'failed') return '#ef4444';
  if (status === 'paid' && paymentStatus === 'succeeded') return '#10b981';

  const colors = {
    pending: '#9b9ba5',
    pending_payment: '#9b9ba5',
    paid: '#3b82f6',
    preparing: '#f59e0b',
    ready: '#10b981',
    collected: '#8b5cf6',
    cancelled: '#ef4444',
  };

  return colors[status] || '#9b9ba5';
}

export function getOrderStateSummary(order) {
  return `${order?.status || 'unknown'} | ${order?.payment_status || 'unknown'}`;
}

export function isPaymentReconciliationCandidate(order) {
  return (
    order?.status === 'pending'
    && order?.payment_status !== 'refunded'
    && Boolean(order?.checkout_session_id || order?.payment_intent_id || order?.charge_id)
  );
}
