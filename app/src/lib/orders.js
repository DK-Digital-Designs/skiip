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

export const VENDOR_ORDER_LANE_DEFINITIONS = [
  {
    id: 'attention',
    title: 'Needs review',
    description: 'Payment or order states that need a quick check before prep.',
  },
  {
    id: 'paid',
    title: 'New',
    description: 'Paid orders waiting to be started.',
  },
  {
    id: 'preparing',
    title: 'Preparing',
    description: 'Orders currently being made.',
  },
  {
    id: 'ready',
    title: 'Ready',
    description: 'Orders waiting for buyer collection.',
  },
  {
    id: 'done',
    title: 'Done',
    description: 'Collected orders.',
  },
  {
    id: 'closed',
    title: 'Closed',
    description: 'Cancelled or refunded orders.',
  },
];

export const VENDOR_ACTIVE_ORDER_LANE_IDS = ['attention', 'paid', 'preparing', 'ready'];
export const VENDOR_ALL_ORDER_LANE_IDS = ['attention', 'paid', 'preparing', 'ready', 'done', 'closed'];

export function getVendorOrderLane(order) {
  const status = order?.status;
  const paymentStatus = order?.payment_status;

  if (status === 'paid' && paymentStatus !== 'failed') return 'paid';
  if (status === 'preparing') return 'preparing';
  if (status === 'ready') return 'ready';
  if (status === 'collected') return 'done';
  if (status === 'cancelled' || status === 'refunded' || paymentStatus === 'refunded' || paymentStatus === 'failed') {
    return 'closed';
  }

  return 'attention';
}

function getQueueTimestamp(order) {
  const value = order?.scheduled_collection_at || order?.created_at;
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function groupVendorOrdersByLane(orders, laneIds = VENDOR_ACTIVE_ORDER_LANE_IDS) {
  const laneSet = new Set(laneIds);
  const grouped = Object.fromEntries(laneIds.map((laneId) => [laneId, []]));

  for (const order of orders || []) {
    const laneId = getVendorOrderLane(order);
    if (!laneSet.has(laneId)) continue;
    grouped[laneId].push(order);
  }

  for (const laneId of laneIds) {
    grouped[laneId].sort((a, b) => getQueueTimestamp(a) - getQueueTimestamp(b));
  }

  return grouped;
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
