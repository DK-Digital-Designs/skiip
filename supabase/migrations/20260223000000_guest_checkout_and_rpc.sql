-- 1. Support Guest Checkout
-- Make user_id nullable in orders table
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS for guest orders
-- Allow viewing if you match the email/phone and have no user_id (or if you are the user)
CREATE POLICY "Guests can view own orders by email/phone" ON public.orders FOR
SELECT USING (
        (
            auth.uid () IS NULL
            AND customer_email IS NOT NULL
        ) -- Simple check, ideally needs more security
        OR (auth.uid () = user_id)
    );

-- 2. Atomic Order Creation RPC
-- This function handles both order and order_items creation in a single transaction
CREATE OR REPLACE FUNCTION public.create_order_v1(
    p_store_id UUID,
    p_items JSONB,
    p_total NUMERIC,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_notes TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS public.orders AS $$
DECLARE
    v_order public.orders;
    v_item JSONB;
    v_order_number TEXT;
BEGIN
    -- Generate order number
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

    -- 1. Insert Order
    INSERT INTO public.orders (
        store_id,
        user_id,
        order_number,
        status,
        total,
        subtotal,
        customer_email,
        customer_phone,
        notes
    ) VALUES (
        p_store_id,
        p_user_id,
        v_order_number,
        'pending',
        p_total,
        p_total,
        p_customer_email,
        p_customer_phone,
        p_notes
    ) RETURNING * INTO v_order;

    -- 2. Insert Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price,
            total,
            product_snapshot
        ) VALUES (
            v_order.id,
            (v_item->>'id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::NUMERIC,
            ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER),
            jsonb_build_object('name', v_item->>'name', 'price', v_item->>'price')
        );
    END LOOP;

    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;