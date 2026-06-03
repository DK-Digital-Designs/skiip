-- Verifies that create_order_with_items_v1 persists configured order lines,
-- line notes, product snapshots, and modifier selections without collapsing
-- duplicate product lines. Run against a reset local Supabase DB.

BEGIN;

DO $$
DECLARE
    v_buyer_id UUID := gen_random_uuid();
    v_seller_id UUID := gen_random_uuid();
    v_store_id UUID := gen_random_uuid();
    v_product_id UUID := gen_random_uuid();
    v_group_id UUID := gen_random_uuid();
    v_option_id UUID := gen_random_uuid();
    v_order_number TEXT := 'TEST-MODIFIERS-' || replace(gen_random_uuid()::text, '-', '');
    v_created_order RECORD;
    v_order_item_count INTEGER;
    v_selection_count INTEGER;
    v_line_note TEXT;
    v_snapshot JSONB;
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
            'modifier-buyer@example.com',
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
            'modifier-seller@example.com',
            'not-used',
            NOW(),
            NOW(),
            NOW()
        );

    INSERT INTO public.stores (id, user_id, name, slug, status)
    VALUES (v_store_id, v_seller_id, 'Modifier Store', 'modifier-store', 'active');

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
        'Modifier Burger',
        'modifier-burger',
        10.00,
        10,
        'active'
    );

    INSERT INTO public.product_modifier_groups (
        id,
        product_id,
        name,
        required,
        min_select,
        max_select,
        sort_order,
        status
    )
    VALUES (
        v_group_id,
        v_product_id,
        'Extras',
        false,
        0,
        2,
        1,
        'active'
    );

    INSERT INTO public.product_modifier_options (
        id,
        group_id,
        name,
        price_delta,
        sort_order,
        status
    )
    VALUES (
        v_option_id,
        v_group_id,
        'Extra cheese',
        1.25,
        1,
        'active'
    );

    SELECT *
    INTO v_created_order
    FROM public.create_order_with_items_v1(
        v_order_number,
        v_buyer_id,
        v_store_id,
        21.25,
        22.75,
        0.00,
        1.50,
        'modifier-buyer@example.com',
        NULL,
        NULL,
        false,
        jsonb_build_array(
            jsonb_build_object(
                'product_id', v_product_id,
                'quantity', 1,
                'price', 11.25,
                'total', 11.25,
                'line_note', 'No onions',
                'client_line_id', 'line-one',
                'modifier_selections', jsonb_build_array(
                    jsonb_build_object(
                        'product_modifier_group_id', v_group_id,
                        'product_modifier_option_id', v_option_id,
                        'group_name', 'Extras',
                        'option_name', 'Extra cheese',
                        'price_delta', 1.25,
                        'sort_order', 1001
                    )
                ),
                'product_snapshot', jsonb_build_object(
                    'name', 'Modifier Burger',
                    'base_price', 10.00,
                    'final_unit_price', 11.25,
                    'modifierDisplay', jsonb_build_array(
                        jsonb_build_object(
                            'groupName', 'Extras',
                            'optionName', 'Extra cheese',
                            'priceDelta', 1.25
                        )
                    ),
                    'lineNote', 'No onions'
                )
            ),
            jsonb_build_object(
                'product_id', v_product_id,
                'quantity', 1,
                'price', 10.00,
                'total', 10.00,
                'line_note', NULL,
                'client_line_id', 'line-two',
                'modifier_selections', '[]'::jsonb,
                'product_snapshot', jsonb_build_object(
                    'name', 'Modifier Burger',
                    'base_price', 10.00,
                    'final_unit_price', 10.00,
                    'modifierDisplay', '[]'::jsonb
                )
            )
        )
    );

    SELECT COUNT(*)
    INTO v_order_item_count
    FROM public.order_items
    WHERE order_id = v_created_order.id;

    IF v_order_item_count <> 2 THEN
        RAISE EXCEPTION 'Expected 2 order item lines, got %', v_order_item_count;
    END IF;

    SELECT COUNT(*)
    INTO v_selection_count
    FROM public.order_item_modifier_selections s
    JOIN public.order_items oi ON oi.id = s.order_item_id
    WHERE oi.order_id = v_created_order.id;

    IF v_selection_count <> 1 THEN
        RAISE EXCEPTION 'Expected 1 modifier selection, got %', v_selection_count;
    END IF;

    SELECT line_note, product_snapshot
    INTO v_line_note, v_snapshot
    FROM public.order_items
    WHERE order_id = v_created_order.id
      AND line_note IS NOT NULL;

    IF v_line_note <> 'No onions' THEN
        RAISE EXCEPTION 'Expected line note to persist, got %', v_line_note;
    END IF;

    IF v_snapshot->>'lineNote' <> 'No onions' THEN
        RAISE EXCEPTION 'Expected snapshot lineNote to persist, got %', v_snapshot;
    END IF;
END;
$$;

ROLLBACK;
