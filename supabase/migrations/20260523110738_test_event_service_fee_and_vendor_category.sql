-- ============================================================
-- Migration: Test-event service fee and vendor category hotfix
-- Purpose:
-- - add a fixed platform-retained service fee line to new orders
-- - let admins update a lightweight vendor category
-- - keep vendor revenue reporting from being inflated by service fees
-- ============================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS service_fee NUMERIC(10, 2);

UPDATE public.orders
SET service_fee = 0
WHERE service_fee IS NULL;

ALTER TABLE public.orders
ALTER COLUMN service_fee SET DEFAULT 0,
ALTER COLUMN service_fee SET NOT NULL;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE public.stores
SET category = 'Food'
WHERE category IS NULL OR btrim(category) = '';

ALTER TABLE public.stores
ALTER COLUMN category SET DEFAULT 'Food',
ALTER COLUMN category SET NOT NULL;

INSERT INTO public.app_settings (key, value)
VALUES (
    'launch_event',
    '{
        "label": "FOOD WITHOUT THE QUEUE",
        "title": "FOOD WITHOUT THE QUEUE",
        "subtitle": "Order food and drinks from your phone and collect when it''s ready.",
        "landingTitle": "FOOD WITHOUT THE QUEUE",
        "landingSubtitle": "Order food and drinks from your phone and collect when it''s ready."
    }'::JSONB
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stores_category_launch_check'
          AND conrelid = 'public.stores'::regclass
    ) THEN
        ALTER TABLE public.stores
        ADD CONSTRAINT stores_category_launch_check
        CHECK (category IN ('Food', 'Drinks', 'Dessert', 'Coffee', 'Other')) NOT VALID;
    END IF;
END;
$$;

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
    JSONB,
    TIMESTAMPTZ,
    TEXT
);

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
    v_inserted_item_count INTEGER;
    v_tip_amount NUMERIC := ROUND(COALESCE(p_tip_amount, 0), 2);
    v_service_fee NUMERIC := ROUND(COALESCE(p_service_fee, 0), 2);
    v_expected_total NUMERIC := ROUND(COALESCE(p_subtotal, 0) + COALESCE(p_tip_amount, 0) + COALESCE(p_service_fee, 0), 2);
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
        o.service_fee,
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
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB,
    TIMESTAMPTZ,
    TEXT
) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_update_store_category_v1(
    p_actor_user_id UUID,
    p_store_id UUID,
    p_category TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_store public.stores%ROWTYPE;
    previous_category TEXT;
    normalized_category TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = p_actor_user_id
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    normalized_category := NULLIF(btrim(COALESCE(p_category, '')), '');
    IF normalized_category IS NULL
        OR normalized_category NOT IN ('Food', 'Drinks', 'Dessert', 'Coffee', 'Other') THEN
        RAISE EXCEPTION 'STORE_CATEGORY_INVALID' USING ERRCODE = '22023';
    END IF;

    SELECT category
    INTO previous_category
    FROM public.stores
    WHERE id = p_store_id
      AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STORE_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    UPDATE public.stores
    SET category = normalized_category,
        updated_at = NOW()
    WHERE id = p_store_id
      AND deleted_at IS NULL
    RETURNING *
    INTO updated_store;

    IF previous_category IS DISTINCT FROM updated_store.category THEN
        INSERT INTO public.audit_logs (
            event_type,
            entity_type,
            entity_id,
            actor_user_id,
            actor_role,
            payload
        )
        VALUES (
            'store_category_changed',
            'store',
            updated_store.id,
            p_actor_user_id,
            'admin',
            jsonb_build_object(
                'store_id', updated_store.id,
                'store_name', updated_store.name,
                'old_category', previous_category,
                'new_category', updated_store.category
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'id', updated_store.id,
        'user_id', updated_store.user_id,
        'name', updated_store.name,
        'slug', updated_store.slug,
        'status', updated_store.status,
        'category', updated_store.category,
        'updated_at', updated_store.updated_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_store_category_v1(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_store_category_v1(UUID, UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_store_category_v1(UUID, UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics_v1()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    WITH order_totals AS (
        SELECT
            COUNT(*) AS total_orders,
            COUNT(*) FILTER (WHERE status IN ('pending', 'paid', 'preparing', 'ready')) AS active_orders,
            COUNT(*) FILTER (WHERE payment_status = 'failed') AS failed_payments,
            COALESCE(SUM(total) FILTER (WHERE payment_status = 'succeeded'), 0) AS paid_revenue,
            COALESCE(SUM(service_fee) FILTER (WHERE payment_status = 'succeeded'), 0) AS service_fee_revenue,
            COALESCE(SUM(refund_amount) FILTER (WHERE refund_amount > 0), 0) AS refunded_revenue
        FROM public.orders
    ),
    status_counts AS (
        SELECT COALESCE(
            jsonb_object_agg(status, order_count),
            '{}'::jsonb
        ) AS counts
        FROM (
            SELECT status, COUNT(*) AS order_count
            FROM public.orders
            GROUP BY status
        ) grouped_statuses
    ),
    vendor_performance AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'store_id', vendor_rows.id,
                    'store_name', vendor_rows.name,
                    'status', vendor_rows.status,
                    'orders', vendor_rows.order_count,
                    'revenue', vendor_rows.revenue
                )
                ORDER BY vendor_rows.revenue DESC, vendor_rows.order_count DESC
            ),
            '[]'::jsonb
        ) AS vendors
        FROM (
            SELECT
                s.id,
                s.name,
                s.status,
                COUNT(o.id) AS order_count,
                COALESCE(SUM(COALESCE(o.subtotal, 0) + COALESCE(o.tip_amount, 0)) FILTER (WHERE o.payment_status = 'succeeded'), 0) AS revenue
            FROM public.stores s
            LEFT JOIN public.orders o ON o.store_id = s.id
            GROUP BY s.id, s.name, s.status
            ORDER BY revenue DESC, order_count DESC
            LIMIT 10
        ) vendor_rows
    ),
    notification_metrics AS (
        SELECT jsonb_build_object(
            'total', COUNT(*),
            'failed', COUNT(*) FILTER (WHERE status = 'failed'),
            'whatsapp_failed', COUNT(*) FILTER (WHERE status = 'failed' AND channel = 'whatsapp'),
            'email_failed', COUNT(*) FILTER (WHERE status = 'failed' AND channel = 'email')
        ) AS stats
        FROM public.notification_logs
    )
    SELECT jsonb_build_object(
        'totalOrders', order_totals.total_orders,
        'activeOrders', order_totals.active_orders,
        'failedPayments', order_totals.failed_payments,
        'paidRevenue', order_totals.paid_revenue,
        'serviceFeeRevenue', order_totals.service_fee_revenue,
        'refundedRevenue', order_totals.refunded_revenue,
        'statusCounts', status_counts.counts,
        'vendors', vendor_performance.vendors,
        'notifications', notification_metrics.stats
    )
    INTO result
    FROM order_totals, status_counts, vendor_performance, notification_metrics;

    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;
