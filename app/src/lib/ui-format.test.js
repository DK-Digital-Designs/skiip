import {
  formatOrderCode,
  getBuyerTimelineSteps,
  getVendorActionClass,
  shouldShowVendorCancel,
} from './ui-format';

describe('ui formatting helpers', () => {
  it('styles current and legacy order codes without changing generation policy', () => {
    expect(formatOrderCode({ order_number: 'A123' })).toBe('A123');
    expect(formatOrderCode({ order_number: 'ORD-20260512-DEMO' })).toBe('ORD-20260512-DEMO');
    expect(formatOrderCode({ id: 'abc123456789' })).toBe('SK-ABC1');
  });

  it('builds buyer timeline states for active orders', () => {
    const steps = getBuyerTimelineSteps({ status: 'preparing', payment_status: 'succeeded' });

    expect(steps.map((step) => `${step.id}:${step.state}`)).toEqual([
      'received:done',
      'preparing:current',
      'ready:pending',
      'collected:pending',
    ]);
  });

  it('keeps ready orders from showing cancel actions', () => {
    expect(shouldShowVendorCancel({ status: 'ready', payment_status: 'succeeded' })).toBe(false);
    expect(shouldShowVendorCancel({ status: 'paid', payment_status: 'succeeded' })).toBe(true);
    expect(shouldShowVendorCancel({ status: 'pending', payment_status: 'succeeded' })).toBe(false);
  });

  it('maps vendor transition targets to requested action colors', () => {
    expect(getVendorActionClass('preparing')).toBe('btn-cyan');
    expect(getVendorActionClass('ready')).toBe('btn-orange');
    expect(getVendorActionClass('collected')).toBe('btn-primary');
    expect(getVendorActionClass('cancelled')).toBe('btn-danger');
  });
});
