-- ============================================================
-- Migration: Fix modifier order item insert and lock modifier writes
-- Purpose:
-- - repair create_order_with_items_v1 after the modifier migration was applied
-- - keep modifier writes on the service-role edge-function/RPC path only
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order_with_items_v1(
    p_order_number TEXT,
    p_user_id UUID,
    p_store_id UUID,
    p_subtotal NUMERIC,
    p_total NUMERIC,
    p_tip_amount NUMERIC,
    p_service_fee NUMERIC,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_notes TEXT,
    p_whatsapp_opt_in BOOLEAN,
    p_items JSONB,
    p_scheduled_collection_at TIMESTAMPTZ DEFAULT NULL,
    p_scheduled_collection_timezone TEXT DEFAULT 'Europe/London'
)
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    subtotal NUMERIC,
    total NUMERIC,
    tip_amount NUMERIC,
    service_fee NUMERIC,
    store_id UUID,
    status TEXT,
    scheduled_collection_at TIMESTAMPTZ,
    scheduled_collection_timezone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_expected_item_count INTEGER;
    v_inserted_item_count INTEGER := 0;
    v_tip_amount NUMERIC := ROUND(COALESCE(p_tip_amount, 0), 2);
    v_service_fee NUMERIC := ROUND(COALESCE(p_service_fee, 0), 2);
    v_expected_total NUMERIC := ROUND(COALESCE(p_subtotal, 0) + COALESCE(p_tip_amount, 0) + COALESCE(p_service_fee, 0), 2);
    v_item JSONB;
    v_selection JSONB;
    v_order_item_id UUID;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF p_order_number IS NULL OR btrim(p_order_number) = '' THEN
        RAISE EXCEPTION 'ORDER_NUMBER_REQUIRED';
    END IF;

    IF p_user_id IS NULL OR p_store_id IS NULL THEN
        RAISE EXCEPTION 'ORDER_OWNER_AND_STORE_REQUIRED';
    END IF;

    IF p_customer_email IS NULL OR btrim(p_customer_email) = '' THEN
        RAISE EXCEPTION 'CUSTOMER_EMAIL_REQUIRED';
    END IF;

    IF COALESCE(p_subtotal, -1) < 0
        OR COALESCE(p_total, -1) < 0
        OR COALESCE(p_tip_amount, -1) < 0
        OR COALESCE(p_service_fee, -1) < 0 THEN
        RAISE EXCEPTION 'ORDER_TOTALS_MUST_BE_NON_NEGATIVE';
    END IF;

    IF ROUND(COALESCE(p_total, -1), 2) <> v_expected_total THEN
        RAISE EXCEPTION 'ORDER_TOTAL_MISMATCH';
    END IF;

    IF COALESCE(p_scheduled_collection_timezone, 'Europe/London') <> 'Europe/London' THEN
        RAISE EXCEPTION 'SCHEDULED_COLLECTION_TIMEZONE_INVALID';
    END IF;

    IF p_scheduled_collection_at IS NOT NULL AND p_scheduled_collection_at <= NOW() THEN
        RAISE EXCEPTION 'SCHEDULED_COLLECTION_MUST_BE_FUTURE';
    END IF;

    IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'ORDER_ITEMS_REQUIRED';
    END IF;

    v_expected_item_count := jsonb_array_length(p_items);
    IF v_expected_item_count <= 0 THEN
        RAISE EXCEPTION 'ORDER_ITEMS_REQUIRED';
    END IF;

    INSERT INTO public.orders AS created_order (
        order_number,
        user_id,
        store_id,
        status,
        subtotal,
        total,
        tip_amount,
        service_fee,
        customer_email,
        customer_phone,
        notes,
        whatsapp_opt_in,
        scheduled_collection_at,
        scheduled_collection_timezone,
        payment_status
    )
    VALUES (
        p_order_number,
        p_user_id,
        p_store_id,
        'pending',
        ROUND(p_subtotal, 2),
        v_expected_total,
        v_tip_amount,
        v_service_fee,
        p_customer_email,
        NULLIF(btrim(COALESCE(p_customer_phone, '')), ''),
        NULLIF(btrim(COALESCE(p_notes, '')), ''),
        COALESCE(p_whatsapp_opt_in, false),
        p_scheduled_collection_at,
        COALESCE(p_scheduled_collection_timezone, 'Europe/London'),
        'pending'
    )
    RETURNING created_order.id INTO v_order_id;

    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items AS oi (
            order_id,
            product_id,
            quantity,
            price,
            total,
            product_snapshot,
            line_note
        )
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::NUMERIC,
            (v_item->>'total')::NUMERIC,
            COALESCE(v_item->'product_snapshot', '{}'::jsonb),
            NULLIF(btrim(COALESCE(v_item->>'line_note', '')), '')
        )
        RETURNING oi.id INTO v_order_item_id;

        v_inserted_item_count := v_inserted_item_count + 1;

        IF jsonb_typeof(COALESCE(v_item->'modifier_selections', '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
            RAISE EXCEPTION 'ORDER_ITEM_MODIFIER_SELECTIONS_MUST_BE_ARRAY';
        END IF;

        FOR v_selection IN
            SELECT value
            FROM jsonb_array_elements(COALESCE(v_item->'modifier_selections', '[]'::jsonb))
        LOOP
            INSERT INTO public.order_item_modifier_selections (
                order_item_id,
                product_modifier_group_id,
                product_modifier_option_id,
                group_name,
                option_name,
                price_delta,
                sort_order
            )
            VALUES (
                v_order_item_id,
                NULLIF(v_selection->>'product_modifier_group_id', '')::UUID,
                NULLIF(v_selection->>'product_modifier_option_id', '')::UUID,
                btrim(COALESCE(v_selection->>'group_name', 'Option')),
                btrim(COALESCE(v_selection->>'option_name', 'Selected option')),
                ROUND(GREATEST(COALESCE((v_selection->>'price_delta')::NUMERIC, 0), 0), 2),
                COALESCE((v_selection->>'sort_order')::INTEGER, 1)
            );
        END LOOP;
    END LOOP;

    IF v_inserted_item_count <> v_expected_item_count THEN
        RAISE EXCEPTION 'ORDER_ITEM_INSERT_COUNT_MISMATCH';
    END IF;

    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.subtotal,
        o.total,
        o.tip_amount,
        o.service_fee,
        o.store_id,
        o.status,
        o.scheduled_collection_at,
        o.scheduled_collection_timezone
    FROM public.orders o
    WHERE o.id = v_order_id;
END;
$$;

DROP POLICY IF EXISTS "Sellers can insert own modifier groups" ON public.product_modifier_groups;
DROP POLICY IF EXISTS "Sellers can update own modifier groups" ON public.product_modifier_groups;
DROP POLICY IF EXISTS "Sellers can delete own modifier groups" ON public.product_modifier_groups;
DROP POLICY IF EXISTS "Admins can manage modifier groups" ON public.product_modifier_groups;

DROP POLICY IF EXISTS "Sellers can insert own modifier options" ON public.product_modifier_options;
DROP POLICY IF EXISTS "Sellers can update own modifier options" ON public.product_modifier_options;
DROP POLICY IF EXISTS "Sellers can delete own modifier options" ON public.product_modifier_options;
DROP POLICY IF EXISTS "Admins can manage modifier options" ON public.product_modifier_options;

REVOKE INSERT, UPDATE, DELETE ON public.product_modifier_groups FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.product_modifier_options FROM authenticated;
