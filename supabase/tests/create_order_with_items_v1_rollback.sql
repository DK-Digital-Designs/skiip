-- Verifies that create_order_with_items_v1 rolls back the orders row
-- when one order_items insert fails. Run against a reset local Supabase DB.

BEGIN;

DO $$
DECLARE
    v_buyer_id UUID := gen_random_uuid();
    v_seller_id UUID := gen_random_uuid();
    v_store_id UUID := gen_random_uuid();
    v_product_id UUID := gen_random_uuid();
    v_missing_product_id UUID := gen_random_uuid();
    v_order_number TEXT := 'TEST-ROLLBACK-' || replace(gen_random_uuid()::text, '-', '');
    v_persisted_orders INTEGER;
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
            'rollback-buyer@example.com',
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
            'rollback-seller@example.com',
            'not-used',
            NOW(),
            NOW(),
            NOW()
        );

    INSERT INTO public.stores (id, user_id, name, slug, status)
    VALUES (v_store_id, v_seller_id, 'Rollback Test Store', 'rollback-test-store', 'active');

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
        'Rollback Test Product',
        'rollback-test-product',
        10.00,
        10,
        'active'
    );

    BEGIN
        PERFORM *
        FROM public.create_order_with_items_v1(
            v_order_number,
            v_buyer_id,
            v_store_id,
            20.00,
            20.00,
            0.00,
            'rollback-buyer@example.com',
            NULL,
            NULL,
            false,
            jsonb_build_array(
                jsonb_build_object(
                    'product_id', v_product_id,
                    'quantity', 1,
                    'price', 10.00,
                    'total', 10.00,
                    'product_snapshot', jsonb_build_object('name', 'Rollback Test Product')
                ),
                jsonb_build_object(
                    'product_id', v_missing_product_id,
                    'quantity', 1,
                    'price', 10.00,
                    'total', 10.00,
                    'product_snapshot', jsonb_build_object('name', 'Missing Product')
                )
            )
        );

        RAISE EXCEPTION 'Expected create_order_with_items_v1 to fail';
    EXCEPTION
        WHEN foreign_key_violation THEN
            NULL;
    END;

    SELECT COUNT(*)
    INTO v_persisted_orders
    FROM public.orders
    WHERE order_number = v_order_number;

    IF v_persisted_orders <> 0 THEN
        RAISE EXCEPTION 'Rollback failed: % order rows persisted', v_persisted_orders;
    END IF;
END;
$$;

ROLLBACK;
