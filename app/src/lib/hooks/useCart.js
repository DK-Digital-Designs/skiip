import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCart = create(
    persist(
        (set, get) => ({
            items: [],
            vendorId: null, // Cart can only contain items from one vendor

            addItem: (product) => {
                const { items, vendorId } = get();

                // Check if adding item from different vendor
                if (vendorId && vendorId !== product.store_id) {
                    if (!window.confirm('Adding items from a different vendor will clear your current cart. Continue?')) {
                        return;
                    }
                    // Clear cart if switching vendors
                    set({ items: [{ ...product, quantity: 1 }], vendorId: product.store_id });
                    return;
                }

                const existingItem = items.find((item) => item.id === product.id);

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                        vendorId: product.store_id
                    });
                } else {
                    set({ items: [...items, { ...product, quantity: 1 }], vendorId: product.store_id });
                }
            },

            removeItem: (productId) => {
                const { items } = get();
                const existingItem = items.find((item) => item.id === productId);

                if (!existingItem) return;

                if (existingItem.quantity > 1) {
                    set({
                        items: items.map((item) =>
                            item.id === productId
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        ),
                    });
                } else {
                    const newItems = items.filter((item) => item.id !== productId);
                    set({
                        items: newItems,
                        vendorId: newItems.length === 0 ? null : get().vendorId
                    });
                }
            },

            clearCart: () => set({ items: [], vendorId: null }),

            getCartTotal: () => {
                const { items } = get();
                return items.reduce((total, item) => total + item.price * item.quantity, 0);
            },

            getItemCount: () => {
                const { items } = get();
                return items.reduce((count, item) => count + item.quantity, 0);
            }
        }),
        {
            name: 'skiip-cart-storage', // name of the item in the storage (must be unique)
            onRehydrateStorage: () => (state, error) => {
                if (error) {
                    console.warn('Cart hydration failed, clearing corrupted storage:', error);
                    localStorage.removeItem('skiip-cart-storage');
                }
            }
        }
    )
);
