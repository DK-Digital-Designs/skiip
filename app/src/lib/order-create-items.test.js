import {
  aggregateOrderItemQuantities,
  parseAndAggregateOrderItems,
  parseOrderItemLines,
} from '../../../supabase/functions/order-create/order-items.ts';

const PRODUCT_A = '11111111-1111-4111-8111-111111111111';
const PRODUCT_B = '22222222-2222-4222-8222-222222222222';
const OPTION_A = '33333333-3333-4333-8333-333333333333';
const OPTION_B = '44444444-4444-4444-8444-444444444444';

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

  it('preserves configured lines before inventory aggregation', () => {
    const parsed = parseOrderItemLines([
      {
        product_id: PRODUCT_A,
        quantity: 1,
        selected_option_ids: [OPTION_A],
        line_note: '  no   onions  ',
        client_line_id: 'line-1',
      },
      {
        product_id: PRODUCT_A,
        quantity: 2,
        selected_option_ids: [OPTION_B],
        line_note: '',
        client_line_id: 'line-2',
      },
    ]);

    expect(parsed).toEqual([
      {
        product_id: PRODUCT_A,
        quantity: 1,
        selected_option_ids: [OPTION_A],
        line_note: 'no onions',
        client_line_id: 'line-1',
      },
      {
        product_id: PRODUCT_A,
        quantity: 2,
        selected_option_ids: [OPTION_B],
        line_note: null,
        client_line_id: 'line-2',
      },
    ]);
    expect(aggregateOrderItemQuantities(parsed)).toEqual([{ product_id: PRODUCT_A, quantity: 3 }]);
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

  it('rejects malformed and duplicate selected option IDs', () => {
    expect(() => parseOrderItemLines([{ product_id: PRODUCT_A, quantity: 1, selected_option_ids: ['cheese'] }])).toThrow(
      'Each selected option requires a valid option ID'
    );

    expect(() => parseOrderItemLines([{ product_id: PRODUCT_A, quantity: 1, selected_option_ids: [OPTION_A, OPTION_A] }])).toThrow(
      'Selected option IDs must be unique'
    );
  });

  it('rejects overlong line notes', () => {
    expect(() => parseOrderItemLines([{ product_id: PRODUCT_A, quantity: 1, line_note: 'x'.repeat(241) }])).toThrow(
      'Line note is too long'
    );
  });

  it('rejects empty item lists', () => {
    expect(() => parseAndAggregateOrderItems([])).toThrow('At least one item is required');
  });
});
