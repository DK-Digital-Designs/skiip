-- Verifies that finalize_paid_order_inventory does not decrement inventory twice.
-- Run against a reset local Supabase DB.

BEGIN;

DO $$
DECLARE
    v_buyer_id UUID := gen_random_uuid();
    v_seller_id UUID := gen_random_uuid();
    v_store_id UUID := gen_random_uuid();
    v_product_id UUID := gen_random_uuid();
    v_order_id UUID := gen_random_uuid();
    v_remaining_inventory INTEGER;
    v_inventory_committed_at TIMESTAMPTZ;
BEGIN
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at
    )
    VALUES
        (
            v_buyer_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'inventory-idempotency-buyer@example.com',
            'not-used',
            NOW(),
            NOW(),
            NOW()
        ),
        (
            v_seller_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'inventory-idempotency-seller@example.com',
            'not-used',
            NOW(),
            NOW(),
            NOW()
        );

    INSERT INTO public.stores (id, user_id, name, slug, status)
    VALUES (v_store_id, v_seller_id, 'Inventory Idempotency Store', 'inventory-idempotency-store', 'active');

    INSERT INTO public.products (
        id,
        store_id,
        name,
        slug,
        price,
        inventory_quantity,
        status
    )
    VALUES (
        v_product_id,
        v_store_id,
        'Inventory Idempotency Product',
        'inventory-idempotency-product',
        10.00,
        5,
        'active'
    );

    INSERT INTO public.orders (
        id,
        order_number,
        user_id,
        store_id,
        status,
        subtotal,
        total,
        customer_email,
        payment_status
    )
    VALUES (
        v_order_id,
        'TEST-INVENTORY-' || replace(gen_random_uuid()::text, '-', ''),
        v_buyer_id,
        v_store_id,
        'paid',
        20.00,
        20.00,
        'inventory-idempotency-buyer@example.com',
        'succeeded'
    );

    INSERT INTO public.order_items (
        order_id,
        product_id,
        quantity,
        price,
        total,
        product_snapshot
    )
    VALUES (
        v_order_id,
        v_product_id,
        2,
        10.00,
        20.00,
        jsonb_build_object('name', 'Inventory Idempotency Product')
    );

    PERFORM public.finalize_paid_order_inventory(v_order_id);
    PERFORM public.finalize_paid_order_inventory(v_order_id);

    SELECT inventory_quantity
    INTO v_remaining_inventory
    FROM public.products
    WHERE id = v_product_id;

    IF v_remaining_inventory <> 3 THEN
        RAISE EXCEPTION 'Expected inventory 3 after one decrement, got %', v_remaining_inventory;
    END IF;

    SELECT inventory_committed_at
    INTO v_inventory_committed_at
    FROM public.orders
    WHERE id = v_order_id;

    IF v_inventory_committed_at IS NULL THEN
        RAISE EXCEPTION 'Expected inventory_committed_at to be set';
    END IF;
END;
$$;

ROLLBACK;
