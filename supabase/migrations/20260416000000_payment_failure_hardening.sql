-- ============================================================
-- Migration: Payment failure tracking and admin reporting hardening
-- - records failed Stripe payment attempts on orders
-- - exposes failed payment counts in admin metrics
-- - adds an index for payment-status-first reporting queries
-- ============================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_failure_code TEXT,
ADD COLUMN IF NOT EXISTS payment_failure_message TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created_at
    ON public.orders (payment_status, created_at DESC);

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
        'failedPayments', order_totals.failed_payments,
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
