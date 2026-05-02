import {
  calculateOrderSummary,
  getAllowedOrderTransitions,
  getOrderStateSummary,
  getOrderStatusColor,
  getOrderStatusLabel,
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
    expect(getAllowedOrderTransitions('pending')).toEqual([]);
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
});
