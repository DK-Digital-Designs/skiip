export function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export const SERVICE_FEE_AMOUNT = 1.5;

export function calculateOrderSummary(items, tipAmount = 0) {
  const subtotal = roundCurrency(
    (items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  );
  const tip = roundCurrency(Math.max(Number(tipAmount || 0), 0));
  const serviceFee = SERVICE_FEE_AMOUNT;

  return {
    subtotal,
    tip,
    serviceFee,
    total: roundCurrency(subtotal + tip + serviceFee),
  };
}

export function getAllowedOrderTransitions(status) {
  const transitions = {
    pending: ['cancelled'],
    paid: ['preparing', 'cancelled'],
    preparing: ['ready'],
    ready: ['collected'],
    collected: [],
    cancelled: [],
    refunded: [],
  };

  return transitions[status] || [];
}

export function isUnpaidPendingOrder(order) {
  return (
    order?.status === 'pending'
    && ['pending', 'failed'].includes(order?.payment_status || 'pending')
  );
}

export function canContinuePendingPayment(order) {
  return isUnpaidPendingOrder(order);
}

export function canCancelUnpaidOrder(order) {
  return isUnpaidPendingOrder(order);
}

export const VENDOR_ORDER_LANE_DEFINITIONS = [
  {
    id: 'attention',
    title: 'Awaiting Customer Payments',
    description: 'Orders waiting for customer payment confirmation.',
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

export const VENDOR_ORDER_FILTERS = [
  { id: 'attention', label: 'Awaiting Customer Payments', laneIds: ['attention'], queryFilter: 'active' },
  { id: 'paid', label: 'New', laneIds: ['paid'], queryFilter: 'active' },
  { id: 'preparing', label: 'Preparing', laneIds: ['preparing'], queryFilter: 'active' },
  { id: 'ready', label: 'Ready', laneIds: ['ready'], queryFilter: 'active' },
  { id: 'all', label: 'All', laneIds: VENDOR_ALL_ORDER_LANE_IDS, queryFilter: 'all' },
];

export const VENDOR_LANE_EMPTY_MESSAGES = {
  attention: 'No orders are awaiting customer payment confirmation.',
  paid: 'No paid orders waiting to start.',
  preparing: 'No orders are currently being prepared.',
  ready: 'No orders are waiting for collection.',
  done: 'No collected orders in this view.',
  closed: 'No cancelled or refunded orders in this view.',
};

export const VENDOR_PRIMARY_TRANSITIONS = {
  paid: { status: 'preparing', label: 'Start prep' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'collected', label: 'Mark collected' },
};

export const VENDOR_TRANSITION_SUCCESS_MESSAGES = {
  preparing: 'Order moved to Preparing.',
  ready: 'Order marked Ready for collection.',
  collected: 'Order marked Collected.',
  cancelled: 'Order cancelled.',
};

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

export function getVendorOrderFilter(filterId) {
  return VENDOR_ORDER_FILTERS.find((filter) => filter.id === filterId) || VENDOR_ORDER_FILTERS[1];
}

export function getVendorOrderFilterLaneIds(filterId) {
  return getVendorOrderFilter(filterId).laneIds;
}

export function getVendorOrderQueryFilter(filterId) {
  return getVendorOrderFilter(filterId).queryFilter;
}

export function getVendorLaneEmptyMessage(laneId) {
  return VENDOR_LANE_EMPTY_MESSAGES[laneId] || 'No orders in this lane.';
}

export function getVendorPrimaryTransition(status) {
  return VENDOR_PRIMARY_TRANSITIONS[status] || null;
}

export function getVendorTransitionSuccessMessage(status) {
  return VENDOR_TRANSITION_SUCCESS_MESSAGES[status] || 'Order updated.';
}

export function getVendorOrderItemSummary(order) {
  const items = order?.order_items || [];
  if (items.length === 0) return 'No item details available';

  const units = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const itemLabel = items.length === 1 ? 'item' : 'items';
  const unitLabel = units === 1 ? 'unit' : 'units';

  return `${items.length} ${itemLabel} / ${units} ${unitLabel}`;
}

export function getVendorOrderActionHint(order) {
  const status = order?.status;
  const paymentStatus = order?.payment_status;

  if (status === 'pending' && paymentStatus === 'succeeded') {
    return 'Payment captured. Ask admin to reconcile before preparing.';
  }

  if (status === 'pending' && paymentStatus === 'pending') {
    return 'Buyer has not completed payment yet. Do not prepare.';
  }

  if (paymentStatus === 'failed') {
    return 'Payment failed. Do not prepare this order.';
  }

  if (status === 'paid') {
    return 'Ready to start preparing.';
  }

  if (status === 'preparing') {
    return 'Mark ready once packed for collection.';
  }

  if (status === 'ready') {
    return 'Hand off to the buyer, then mark collected.';
  }

  if (status === 'collected') {
    return 'Collected by the buyer.';
  }

  if (status === 'cancelled') {
    return 'Cancelled order. No prep needed.';
  }

  if (status === 'refunded' || paymentStatus === 'refunded') {
    return 'Refunded order. No prep needed.';
  }

  return 'Review order state before taking action.';
}

export function getBuyerOrderStatusLabel(order) {
  if (isUnpaidPendingOrder(order)) {
    return order?.payment_status === 'failed' ? 'Payment failed' : 'Payment pending';
  }

  return getOrderStatusLabel(order);
}

export function getBuyerOrderStatusDescription(order) {
  if (isUnpaidPendingOrder(order)) {
    return order?.payment_status === 'failed'
      ? 'Payment did not complete. You can try again or cancel this order.'
      : 'Your order is waiting for payment. The vendor will not start preparing it yet.';
  }

  if (order?.status === 'paid') {
    return 'Payment is complete. The vendor can start preparing your order.';
  }

  if (order?.status === 'cancelled' && order?.payment_status === 'succeeded') {
    return 'This paid order was cancelled. Refund review is required and SKIIP will contact you.';
  }

  if (order?.status === 'cancelled') {
    return 'This order has been cancelled.';
  }

  return null;
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
