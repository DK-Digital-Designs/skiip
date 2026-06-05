-- Verifies that create_order_with_items_v1 persists the fixed GBP 1.50 service fee
-- and still rejects totals that do not reconcile. Run against a reset local Supabase DB.

BEGIN;

DO $$
DECLARE
    v_buyer_id UUID := gen_random_uuid();
    v_seller_id UUID := gen_random_uuid();
    v_store_id UUID := gen_random_uuid();
    v_product_id UUID := gen_random_uuid();
    v_order_number TEXT := 'TEST-SERVICE-FEE-' || replace(gen_random_uuid()::text, '-', '');
    v_created_order RECORD;
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
            'service-fee-buyer@example.com',
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
            'service-fee-seller@example.com',
            'not-used',
            NOW(),
            NOW(),
            NOW()
        );

    INSERT INTO public.stores (id, user_id, name, slug, status)
    VALUES (v_store_id, v_seller_id, 'Service Fee Store', 'service-fee-store', 'active');

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
        'Service Fee Product',
        'service-fee-product',
        10.00,
        10,
        'active'
    );

    SELECT *
    INTO v_created_order
    FROM public.create_order_with_items_v1(
        v_order_number,
        v_buyer_id,
        v_store_id,
        20.00,
        21.50,
        0.00,
        1.50,
        'service-fee-buyer@example.com',
        '07700900123',
        NULL,
        false,
        jsonb_build_array(
            jsonb_build_object(
                'product_id', v_product_id,
                'quantity', 2,
                'price', 10.00,
                'total', 20.00,
                'product_snapshot', jsonb_build_object('name', 'Service Fee Product')
            )
        )
    );

    IF v_created_order.service_fee <> 1.50 THEN
        RAISE EXCEPTION 'Expected service_fee 1.50, got %', v_created_order.service_fee;
    END IF;

    IF v_created_order.total <> 21.50 THEN
        RAISE EXCEPTION 'Expected total 21.50, got %', v_created_order.total;
    END IF;

    IF v_created_order.customer_phone <> '07700900123' THEN
        RAISE EXCEPTION 'Expected customer_phone 07700900123, got %', v_created_order.customer_phone;
    END IF;

    BEGIN
        PERFORM *
        FROM public.create_order_with_items_v1(
            v_order_number || '-BAD',
            v_buyer_id,
            v_store_id,
            20.00,
            20.00,
            1.50,
            0.00,
            'service-fee-buyer@example.com',
            NULL,
            NULL,
            false,
            jsonb_build_array(
                jsonb_build_object(
                    'product_id', v_product_id,
                    'quantity', 2,
                    'price', 10.00,
                    'total', 20.00,
                    'product_snapshot', jsonb_build_object('name', 'Service Fee Product')
                )
            )
        );

        RAISE EXCEPTION 'Expected create_order_with_items_v1 to reject mismatched total';
    EXCEPTION
        WHEN raise_exception THEN
            IF SQLERRM <> 'ORDER_TOTAL_MISMATCH' THEN
                RAISE;
            END IF;
    END;
END;
$$;

ROLLBACK;
