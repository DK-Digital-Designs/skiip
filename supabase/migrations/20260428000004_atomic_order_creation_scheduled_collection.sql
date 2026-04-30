-- ============================================================
-- Migration: Add scheduled collection fields to atomic order RPC
-- - runs after scheduled collection columns exist
-- - keeps order + order_items persistence transactional
-- ============================================================

DROP FUNCTION IF EXISTS public.create_order_with_items_v1(
    TEXT,
    UUID,
    UUID,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB
);

CREATE OR REPLACE FUNCTION public.create_order_with_items_v1(
    p_order_number TEXT,
    p_user_id UUID,
    p_store_id UUID,
    p_subtotal NUMERIC,
    p_total NUMERIC,
    p_tip_amount NUMERIC,
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
    v_inserted_item_count INTEGER;
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
        OR COALESCE(p_tip_amount, -1) < 0 THEN
        RAISE EXCEPTION 'ORDER_TOTALS_MUST_BE_NON_NEGATIVE';
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
        p_subtotal,
        p_total,
        COALESCE(p_tip_amount, 0),
        p_customer_email,
        NULLIF(btrim(COALESCE(p_customer_phone, '')), ''),
        NULLIF(btrim(COALESCE(p_notes, '')), ''),
        COALESCE(p_whatsapp_opt_in, false),
        p_scheduled_collection_at,
        COALESCE(p_scheduled_collection_timezone, 'Europe/London'),
        'pending'
    )
    RETURNING created_order.id INTO v_order_id;

    INSERT INTO public.order_items (
        order_id,
        product_id,
        quantity,
        price,
        total,
        product_snapshot
    )
    SELECT
        v_order_id,
        (item.value->>'product_id')::UUID,
        (item.value->>'quantity')::INTEGER,
        (item.value->>'price')::NUMERIC,
        (item.value->>'total')::NUMERIC,
        COALESCE(item.value->'product_snapshot', '{}'::jsonb)
    FROM jsonb_array_elements(p_items) AS item(value);

    GET DIAGNOSTICS v_inserted_item_count = ROW_COUNT;

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
        o.store_id,
        o.status,
        o.scheduled_collection_at,
        o.scheduled_collection_timezone
    FROM public.orders o
    WHERE o.id = v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items_v1(
    TEXT,
    UUID,
    UUID,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB,
    TIMESTAMPTZ,
    TEXT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.create_order_with_items_v1(
    TEXT,
    UUID,
    UUID,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB,
    TIMESTAMPTZ,
    TEXT
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_with_items_v1(
    TEXT,
    UUID,
    UUID,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB,
    TIMESTAMPTZ,
    TEXT
) TO service_role;
