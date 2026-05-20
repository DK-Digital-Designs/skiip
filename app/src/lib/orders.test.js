import {
  calculateOrderSummary,
  getAllowedOrderTransitions,
  getOrderStateSummary,
  getOrderStatusColor,
  getOrderStatusLabel,
  getVendorLaneEmptyMessage,
  getVendorOrderFilterLaneIds,
  getVendorOrderQueryFilter,
  getVendorOrderActionHint,
  getVendorOrderItemSummary,
  getVendorOrderLane,
  getVendorPrimaryTransition,
  getVendorTransitionSuccessMessage,
  groupVendorOrdersByLane,
  canCancelUnpaidOrder,
  canContinuePendingPayment,
  getBuyerOrderStatusDescription,
  getBuyerOrderStatusLabel,
  isPaymentReconciliationCandidate,
  isRefundableOrder,
  roundCurrency,
} from './orders';

describe('order utilities', () => {
  it('rounds currency values safely', () => {
    expect(roundCurrency(10.005)).toBe(10.01);
    expect(roundCurrency('2.499')).toBe(2.5);
  });

  it('calculates subtotal, tip, and total', () => {
    const summary = calculateOrderSummary(
      [
        { price: 8.5, quantity: 2 },
        { price: 3.25, quantity: 1 },
      ],
      1.75
    );

    expect(summary).toEqual({
      subtotal: 20.25,
      tip: 1.75,
      total: 22,
    });
  });

  it('returns production-safe order transitions', () => {
    expect(getAllowedOrderTransitions('paid')).toEqual(['preparing', 'cancelled']);
    expect(getAllowedOrderTransitions('pending')).toEqual(['cancelled']);
  });

  it('detects unpaid pending orders that buyers can recover or cancel', () => {
    expect(canContinuePendingPayment({ status: 'pending', payment_status: 'pending' })).toBe(true);
    expect(canCancelUnpaidOrder({ status: 'pending', payment_status: 'failed' })).toBe(true);
    expect(canCancelUnpaidOrder({ status: 'pending', payment_status: 'succeeded' })).toBe(false);
    expect(canContinuePendingPayment({ status: 'paid', payment_status: 'succeeded' })).toBe(false);
  });

  it('returns buyer-safe pending payment copy', () => {
    const pendingOrder = { status: 'pending', payment_status: 'pending' };
    const failedOrder = { status: 'pending', payment_status: 'failed' };

    expect(getBuyerOrderStatusLabel(pendingOrder)).toBe('Payment pending');
    expect(getBuyerOrderStatusDescription(pendingOrder)).toContain('waiting for payment');
    expect(getBuyerOrderStatusLabel(failedOrder)).toBe('Payment failed');
    expect(getBuyerOrderStatusDescription(failedOrder)).toContain('try again');
  });

  it('detects refundable orders', () => {
    expect(isRefundableOrder({ payment_status: 'succeeded', status: 'paid' })).toBe(true);
    expect(isRefundableOrder({ payment_status: 'pending', status: 'pending' })).toBe(false);
    expect(isRefundableOrder({ payment_status: 'succeeded', status: 'refunded' })).toBe(false);
  });

  it('labels payment/order state combinations clearly', () => {
    expect(getOrderStatusLabel({ status: 'pending', payment_status: 'pending' })).toBe('WAITING FOR PAYMENT');
    expect(getOrderStatusLabel({ status: 'pending', payment_status: 'succeeded' })).toBe('PAYMENT NEEDS RECONCILIATION');
    expect(getOrderStatusLabel({ status: 'paid', payment_status: 'succeeded' })).toBe('READY TO PROCESS');
    expect(getOrderStatusLabel({ status: 'refunded', payment_status: 'refunded' })).toBe('REFUNDED');
    expect(getOrderStateSummary({ status: 'pending', payment_status: 'succeeded' })).toBe('pending | succeeded');
  });

  it('colors stuck payment states as actionable', () => {
    expect(getOrderStatusColor({ status: 'pending', payment_status: 'succeeded' })).toBe('#f59e0b');
    expect(getOrderStatusColor({ status: 'pending', payment_status: 'failed' })).toBe('#ef4444');
    expect(getOrderStatusColor({ status: 'paid', payment_status: 'succeeded' })).toBe('#10b981');
  });

  it('detects admin payment reconciliation candidates', () => {
    expect(isPaymentReconciliationCandidate({
      status: 'pending',
      payment_status: 'pending',
      checkout_session_id: 'cs_test_123',
    })).toBe(true);
    expect(isPaymentReconciliationCandidate({
      status: 'pending',
      payment_status: 'succeeded',
      payment_intent_id: 'pi_test_123',
    })).toBe(true);
    expect(isPaymentReconciliationCandidate({
      status: 'paid',
      payment_status: 'succeeded',
      payment_intent_id: 'pi_test_123',
    })).toBe(false);
  });

  it('assigns vendor orders to operational lanes', () => {
    expect(getVendorOrderLane({ status: 'paid', payment_status: 'succeeded' })).toBe('paid');
    expect(getVendorOrderLane({ status: 'preparing', payment_status: 'succeeded' })).toBe('preparing');
    expect(getVendorOrderLane({ status: 'ready', payment_status: 'succeeded' })).toBe('ready');
    expect(getVendorOrderLane({ status: 'pending', payment_status: 'succeeded' })).toBe('attention');
    expect(getVendorOrderLane({ status: 'cancelled', payment_status: 'succeeded' })).toBe('closed');
    expect(getVendorOrderLane({ status: 'collected', payment_status: 'succeeded' })).toBe('done');
  });

  it('groups and sorts vendor orders by lane timing', () => {
    const grouped = groupVendorOrdersByLane([
      { id: 'later', status: 'paid', payment_status: 'succeeded', created_at: '2026-05-06T10:05:00Z' },
      { id: 'ready', status: 'ready', payment_status: 'succeeded', created_at: '2026-05-06T10:00:00Z' },
      { id: 'first', status: 'paid', payment_status: 'succeeded', created_at: '2026-05-06T10:01:00Z' },
      { id: 'done', status: 'collected', payment_status: 'succeeded', created_at: '2026-05-06T10:02:00Z' },
    ]);

    expect(grouped.paid.map((order) => order.id)).toEqual(['first', 'later']);
    expect(grouped.ready.map((order) => order.id)).toEqual(['ready']);
    expect(grouped.done).toBeUndefined();
  });

  it('summarizes vendor order items for compact queue cards', () => {
    expect(getVendorOrderItemSummary({
      order_items: [
        { quantity: 2 },
        { quantity: 1 },
      ],
    })).toBe('2 items / 3 units');

    expect(getVendorOrderItemSummary({ order_items: [{ quantity: 1 }] })).toBe('1 item / 1 unit');
    expect(getVendorOrderItemSummary({ order_items: [] })).toBe('No item details available');
  });

  it('returns vendor action hints for operational states', () => {
    expect(getVendorOrderActionHint({ status: 'pending', payment_status: 'succeeded' })).toBe(
      'Payment captured. Ask admin to reconcile before preparing.'
    );
    expect(getVendorOrderActionHint({ status: 'paid', payment_status: 'succeeded' })).toBe('Ready to start preparing.');
    expect(getVendorOrderActionHint({ status: 'ready', payment_status: 'succeeded' })).toBe(
      'Hand off to the buyer, then mark collected.'
    );
    expect(getVendorOrderActionHint({ status: 'paid', payment_status: 'failed' })).toBe(
      'Payment failed. Do not prepare this order.'
    );
  });

  it('keeps vendor lane and transition copy buyer-safe and non-raw', () => {
    expect(getVendorLaneEmptyMessage('paid')).toBe('No paid orders waiting to start.');
    expect(getVendorLaneEmptyMessage('missing')).toBe('No orders in this lane.');
    expect(getVendorPrimaryTransition('preparing')).toEqual({ status: 'ready', label: 'Mark ready' });
    expect(getVendorPrimaryTransition('cancelled')).toBeNull();
    expect(getVendorTransitionSuccessMessage('ready')).toBe('Order marked Ready for collection.');
    expect(getVendorTransitionSuccessMessage('unknown')).toBe('Order updated.');
  });

  it('maps vendor queue filters to focused lanes and query scopes', () => {
    expect(getVendorOrderFilterLaneIds('attention')).toEqual(['attention']);
    expect(getVendorOrderFilterLaneIds('paid')).toEqual(['paid']);
    expect(getVendorOrderFilterLaneIds('preparing')).toEqual(['preparing']);
    expect(getVendorOrderFilterLaneIds('ready')).toEqual(['ready']);
    expect(getVendorOrderFilterLaneIds('all')).toEqual(['attention', 'paid', 'preparing', 'ready', 'done', 'closed']);
    expect(getVendorOrderFilterLaneIds('unknown')).toEqual(['paid']);
    expect(getVendorOrderQueryFilter('ready')).toBe('active');
    expect(getVendorOrderQueryFilter('all')).toBe('all');
  });
});
