import { calculateOrderSummary, getAllowedOrderTransitions, isRefundableOrder, roundCurrency } from './orders';

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
});
