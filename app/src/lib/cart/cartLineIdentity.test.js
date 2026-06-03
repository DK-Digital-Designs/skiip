import { describe, expect, it } from 'vitest';
import {
  buildCartLineId,
  buildConfiguredCartLine,
  buildSimpleCartLine,
  hasConfiguredCartLines,
  normalizeCartLine,
  normalizeLineNote,
} from './cartLineIdentity';

const burger = {
  id: 'burger',
  name: 'Classic Burger',
  price: 8.5,
  store_id: 'vendor-1',
};

describe('cart line identity helpers', () => {
  it('normalizes line notes for stable identity', () => {
    expect(normalizeLineNote('  no   onions  ')).toBe('no onions');
    expect(buildCartLineId('burger', ['b', 'a'], ' No onions ')).toBe('burger::a,b::no onions');
  });

  it('keeps simple products compatible with legacy product IDs', () => {
    expect(buildSimpleCartLine(burger)).toEqual(expect.objectContaining({
      id: 'burger',
      lineId: 'burger',
      productId: 'burger',
      name: 'Classic Burger',
      price: 8.5,
    }));
  });

  it('normalizes old persisted cart lines without crashing', () => {
    expect(normalizeCartLine({ id: 'water', name: 'Water', price: 1.5, quantity: 2 })).toEqual(expect.objectContaining({
      id: 'water',
      lineId: 'water',
      productId: 'water',
      quantity: 2,
      price: 1.5,
    }));
  });

  it('detects configured lines and separates option variants', () => {
    const cheeseLine = buildConfiguredCartLine(
      burger,
      [{ id: 'cheese', name: 'Extra cheese', groupName: 'Extras', priceDelta: 0.5 }],
      'No onions',
    );
    const sauceLine = buildConfiguredCartLine(
      burger,
      [{ id: 'sauce', name: 'Extra sauce', groupName: 'Extras', priceDelta: 0.3 }],
      'No onions',
    );

    expect(cheeseLine.lineId).not.toBe(sauceLine.lineId);
    expect(cheeseLine.price).toBe(9);
    expect(hasConfiguredCartLines([cheeseLine])).toBe(true);
    expect(hasConfiguredCartLines([buildSimpleCartLine(burger)])).toBe(false);
  });
});
