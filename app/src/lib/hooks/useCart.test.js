import { beforeEach, describe, expect, it } from 'vitest';
import { useCart } from './useCart';
import { buildConfiguredCartLine } from '../cart/cartLineIdentity';

const burger = {
    id: 'burger',
    name: 'Classic Burger',
    price: 8.5,
    store_id: 'vendor-1',
};

describe('useCart removal behavior', () => {
    beforeEach(() => {
        window.localStorage.clear();
        useCart.setState({ items: [], vendorId: null });
    });

    it('removes a line and clears the vendor when decrementing its final quantity', () => {
        useCart.getState().addItem(burger);
        useCart.getState().removeItem(burger.id);

        expect(useCart.getState().items).toEqual([]);
        expect(useCart.getState().vendorId).toBeNull();
        expect(useCart.getState().getCartTotal()).toBe(0);
    });

    it('removes an entire selected line without submitting its remaining quantity', () => {
        useCart.getState().addItem(burger);
        useCart.getState().addItem(burger);
        useCart.getState().removeLineItem(burger.id);

        expect(useCart.getState().items).toEqual([]);
        expect(useCart.getState().vendorId).toBeNull();
        expect(useCart.getState().getItemCount()).toBe(0);
    });

    it('merges the same configured product line', () => {
        const configured = buildConfiguredCartLine(
            burger,
            [{ id: 'cheese', name: 'Extra cheese', groupName: 'Extras', priceDelta: 0.5 }],
            'No onions'
        );

        useCart.getState().addItem(configured);
        useCart.getState().addItem(configured);

        expect(useCart.getState().items).toHaveLength(1);
        expect(useCart.getState().items[0]).toEqual(expect.objectContaining({
            lineId: configured.lineId,
            quantity: 2,
            price: 9,
        }));
    });

    it('keeps configured variants as separate cart lines', () => {
        const cheese = buildConfiguredCartLine(
            burger,
            [{ id: 'cheese', name: 'Extra cheese', groupName: 'Extras', priceDelta: 0.5 }],
            ''
        );
        const sauce = buildConfiguredCartLine(
            burger,
            [{ id: 'sauce', name: 'Extra sauce', groupName: 'Extras', priceDelta: 0.3 }],
            ''
        );

        useCart.getState().addItem(cheese);
        useCart.getState().addItem(sauce);

        expect(useCart.getState().items.map((item) => item.lineId)).toEqual([cheese.lineId, sauce.lineId]);
        expect(useCart.getState().getCartTotal()).toBe(17.8);
    });
});
