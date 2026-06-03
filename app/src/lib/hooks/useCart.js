import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    buildSimpleCartLine,
    normalizeCartLine,
} from '../cart/cartLineIdentity';

function getLineKey(line) {
    return line?.lineId || line?.id;
}

function prepareCartLine(product) {
    return product?.lineId ? normalizeCartLine(product) : buildSimpleCartLine(product);
}

export const useCart = create(
    persist(
        (set, get) => ({
            items: [],
            vendorId: null, // Cart can only contain items from one vendor

            addItem: (product) => {
                const { items, vendorId } = get();
                const cartLine = prepareCartLine(product);
                const lineKey = getLineKey(cartLine);

                if (vendorId && vendorId !== product.store_id) {
                    return false;
                }

                const existingItem = items.find((item) => getLineKey(normalizeCartLine(item)) === lineKey);

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            getLineKey(normalizeCartLine(item)) === lineKey
                                ? { ...normalizeCartLine(item), quantity: item.quantity + 1 }
                                : item
                        ),
                        vendorId: product.store_id
                    });
                } else {
                    set({ items: [...items, { ...cartLine, quantity: 1 }], vendorId: product.store_id });
                }
                return true;
            },

            removeItem: (lineId) => {
                const { items } = get();
                const existingItem = items.find((item) => getLineKey(normalizeCartLine(item)) === lineId);

                if (!existingItem) return;

                if (existingItem.quantity > 1) {
                    set({
                        items: items.map((item) =>
                            getLineKey(normalizeCartLine(item)) === lineId
                                ? { ...normalizeCartLine(item), quantity: item.quantity - 1 }
                                : item
                        ),
                    });
                } else {
                    const newItems = items.filter((item) => getLineKey(normalizeCartLine(item)) !== lineId);
                    set({
                        items: newItems,
                        vendorId: newItems.length === 0 ? null : get().vendorId
                    });
                }
            },

            removeLineItem: (lineId) => {
                const { items, vendorId } = get();
                const newItems = items.filter((item) => getLineKey(normalizeCartLine(item)) !== lineId);
                set({
                    items: newItems,
                    vendorId: newItems.length === 0 ? null : vendorId
                });
            },

            clearCart: () => set({ items: [], vendorId: null }),

            getCartTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => {
                    const line = normalizeCartLine(item);
                    return total + line.price * line.quantity;
                }, 0);
            },

            getItemCount: () => {
                const { items } = get();
                return items.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'skiip-cart-storage', // name of the item in the storage (must be unique)
            version: 2,
            migrate: (persistedState) => ({
                ...persistedState,
                items: (persistedState?.items || []).map((item) => normalizeCartLine(item)),
            }),
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.warn('Cart hydration failed, clearing corrupted storage:', error);
                    localStorage.removeItem('skiip-cart-storage');
                    return;
                }

                if (state?.items?.length) {
                    state.items = state.items.map((item) => normalizeCartLine(item));
                }
            }
        }
    )
);
