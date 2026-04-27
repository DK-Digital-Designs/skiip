import { parseAndAggregateOrderItems } from '../../../supabase/functions/order-create/order-items.ts';

const PRODUCT_A = '11111111-1111-4111-8111-111111111111';
const PRODUCT_B = '22222222-2222-4222-8222-222222222222';

describe('order-create item parsing', () => {
  it('keeps valid integer quantities', () => {
    expect(parseAndAggregateOrderItems([{ product_id: PRODUCT_A, quantity: 2 }])).toEqual([
      { product_id: PRODUCT_A, quantity: 2 },
    ]);
  });

  it('aggregates duplicate product IDs before validation output is used', () => {
    expect(
      parseAndAggregateOrderItems([
        { product_id: PRODUCT_A, quantity: 2 },
        { product_id: PRODUCT_B, quantity: 1 },
        { product_id: PRODUCT_A, quantity: 3 },
      ])
    ).toEqual([
      { product_id: PRODUCT_A, quantity: 5 },
      { product_id: PRODUCT_B, quantity: 1 },
    ]);
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['decimal', 1.5],
    ['missing', undefined],
    ['non-numeric', '2'],
    ['NaN', Number.NaN],
  ])('rejects %s quantities', (_name, quantity) => {
    expect(() => parseAndAggregateOrderItems([{ product_id: PRODUCT_A, quantity }])).toThrow(
      'Each item quantity must be a positive integer'
    );
  });

  it('rejects malformed product IDs', () => {
    expect(() => parseAndAggregateOrderItems([{ product_id: 'not-a-uuid', quantity: 1 }])).toThrow(
      'Each item requires a valid product_id'
    );
  });

  it('rejects empty item lists', () => {
    expect(() => parseAndAggregateOrderItems([])).toThrow('At least one item is required');
  });
});
