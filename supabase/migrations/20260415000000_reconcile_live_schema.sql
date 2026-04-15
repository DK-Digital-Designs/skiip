-- ============================================================
-- Migration: Reconcile live-working production schema
-- Purpose:
-- - encode manual SQL fixes into repo truth
-- - keep the current live-working payment/order flow intact
-- - use only additive or idempotent changes
-- ============================================================

-- Stripe webhook idempotency tracking used by stripe-webhook.
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_processed_at
    ON public.stripe_processed_events (processed_at DESC);

-- Payment/refund/inventory columns expected by the current order lifecycle.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_id TEXT,
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS inventory_committed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS inventory_restocked_at TIMESTAMPTZ;

-- Notification metadata used by the shared notification helpers and admin reporting.
ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('email', 'whatsapp')) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS recipient TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.notification_logs
SET channel = COALESCE(channel, 'whatsapp'),
    provider = COALESCE(provider, 'twilio'),
    metadata = COALESCE(metadata, '{}'::jsonb)
WHERE channel IS NULL
   OR provider IS NULL
   OR metadata IS NULL;

ALTER TABLE public.notification_logs
ALTER COLUMN channel SET NOT NULL,
ALTER COLUMN metadata SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_logs_channel_event_status
    ON public.notification_logs(channel, event_type, status);

-- Audit/event log used by webhook, transitions, refunds, and admin reporting.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    actor_user_id UUID REFERENCES auth.users(id),
    actor_role TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON public.audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event
    ON public.audit_logs(event_type, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;
CREATE POLICY "Service role can manage audit logs"
ON public.audit_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Store status auditing used by admin/vendor operations.
CREATE OR REPLACE FUNCTION public.audit_store_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    actor_role_value TEXT;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    SELECT role
    INTO actor_role_value
    FROM public.user_profiles
    WHERE id = auth.uid();

    INSERT INTO public.audit_logs (
        event_type,
        entity_type,
        entity_id,
        actor_user_id,
        actor_role,
        payload
    )
    VALUES (
        'store_status_changed',
        'store',
        NEW.id,
        auth.uid(),
        actor_role_value,
        jsonb_build_object(
            'store_id', NEW.id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'store_name', NEW.name
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_audit_status_change ON public.stores;
CREATE TRIGGER stores_audit_status_change
AFTER UPDATE OF status ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.audit_store_status_change();

-- Inventory finalization/restock helpers required by payment capture and cancellation.
CREATE OR REPLACE FUNCTION public.finalize_paid_order_inventory(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item RECORD;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.quantity
        FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
        ORDER BY oi.product_id
        FOR UPDATE OF p
    LOOP
        UPDATE public.products
        SET inventory_quantity = inventory_quantity - v_item.quantity
        WHERE id = v_item.product_id
          AND inventory_quantity >= v_item.quantity;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INSUFFICIENT_INVENTORY for product %', v_item.product_id;
        END IF;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.restock_order_inventory(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item RECORD;
BEGIN
    FOR v_item IN
        SELECT oi.product_id, oi.quantity
        FROM public.order_items oi
        JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
        ORDER BY oi.product_id
        FOR UPDATE OF p
    LOOP
        UPDATE public.products
        SET inventory_quantity = inventory_quantity + v_item.quantity
        WHERE id = v_item.product_id;
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_inventory(product_id UUID, quantity_to_decrement INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET inventory_quantity = inventory_quantity - quantity_to_decrement
    WHERE id = product_id
      AND inventory_quantity >= quantity_to_decrement;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'INSUFFICIENT_INVENTORY for product %', product_id;
    END IF;
END;
$$;

-- Admin metrics RPC used by the current admin dashboard.
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
            COALESCE(SUM(total) FILTER (WHERE payment_status = 'succeeded'), 0) AS paid_revenue,
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
                COALESCE(SUM(o.total) FILTER (WHERE o.payment_status = 'succeeded'), 0) AS revenue
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
        'paidRevenue', order_totals.paid_revenue,
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
