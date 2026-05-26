import { beforeEach, describe, expect, it } from 'vitest';
import { useCart } from './useCart';

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
});
