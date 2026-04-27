-- ============================================================
-- Migration: Atomic server-authoritative order creation
-- - enforces positive order item quantities for new rows
-- - creates a service-role-only RPC that persists orders and
--   order_items in one database transaction
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'order_items_quantity_positive'
          AND conrelid = 'public.order_items'::regclass
    ) THEN
        ALTER TABLE public.order_items
        ADD CONSTRAINT order_items_quantity_positive
        CHECK (quantity > 0) NOT VALID;
    END IF;
END;
$$;

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
    p_items JSONB
)
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    subtotal NUMERIC,
    total NUMERIC,
    tip_amount NUMERIC,
    store_id UUID,
    status TEXT
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
        o.status
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
    JSONB
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
    JSONB
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
    JSONB
) TO service_role;
