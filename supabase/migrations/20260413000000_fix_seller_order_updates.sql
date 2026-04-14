-- Fix: Allow Sellers to update their own store's orders
-- Previously, only Admin could update orders due to missing Seller policy.

CREATE POLICY "Sellers can update store orders" ON public.orders
FOR UPDATE
USING (
    store_id IN (
        SELECT id
        FROM public.stores
        WHERE user_id = auth.uid()
    )
);
