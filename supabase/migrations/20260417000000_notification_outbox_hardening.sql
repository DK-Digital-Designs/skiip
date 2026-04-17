-- ============================================================
-- Migration: Notification outbox hardening
-- - makes notification_logs act as a durable dispatch outbox
-- - adds retry/timestamp/correlation metadata
-- - adds safe claim RPC for edge dispatchers
-- - stores processed webhook deliveries for idempotency
-- ============================================================

ALTER TABLE public.notification_logs
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS correlation_id UUID,
ADD COLUMN IF NOT EXISTS source_event_id TEXT,
ADD COLUMN IF NOT EXISTS payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dispatch_attempts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

UPDATE public.notification_logs nl
SET store_id = o.store_id
FROM public.orders o
WHERE nl.order_id = o.id
  AND nl.store_id IS NULL;

UPDATE public.notification_logs nl
SET payload_snapshot = jsonb_build_object(
    'orderId', o.id,
    'storeId', o.store_id,
    'orderNumber', o.order_number,
    'customerEmail', o.customer_email,
    'customerPhone', o.customer_phone,
    'total', to_char(COALESCE(o.total, 0), 'FM999999990.00'),
    'refundAmount', CASE
        WHEN o.refund_amount IS NULL THEN NULL
        ELSE to_char(COALESCE(o.refund_amount, 0), 'FM999999990.00')
    END,
    'status', o.status,
    'whatsappOptIn', COALESCE(o.whatsapp_opt_in, false),
    'storeName', s.name,
    'pickupLocation', s.pickup_location
)
FROM public.orders o
LEFT JOIN public.stores s ON s.id = o.store_id
WHERE nl.order_id = o.id
  AND nl.payload_snapshot = '{}'::jsonb;

UPDATE public.notification_logs
SET sent_at = COALESCE(
        sent_at,
        CASE WHEN status IN ('sent', 'delivered', 'read') THEN updated_at ELSE NULL END
    ),
    delivered_at = COALESCE(
        delivered_at,
        CASE WHEN status IN ('delivered', 'read') THEN updated_at ELSE NULL END
    ),
    failed_at = COALESCE(
        failed_at,
        CASE WHEN status = 'failed' THEN updated_at ELSE NULL END
    )
WHERE sent_at IS NULL
   OR delivered_at IS NULL
   OR failed_at IS NULL;

ALTER TABLE public.notification_logs
DROP CONSTRAINT IF EXISTS notification_logs_status_check;

ALTER TABLE public.notification_logs
ADD CONSTRAINT notification_logs_status_check
CHECK (status IN ('queued', 'processing', 'sent', 'delivered', 'read', 'failed'));

ALTER TABLE public.notification_logs
DROP CONSTRAINT IF EXISTS notification_logs_channel_check;

ALTER TABLE public.notification_logs
ADD CONSTRAINT notification_logs_channel_check
CHECK (channel IN ('email', 'whatsapp', 'sms'));

CREATE INDEX IF NOT EXISTS idx_notification_logs_dispatch_queue
    ON public.notification_logs(status, next_attempt_at, created_at)
    WHERE status IN ('queued', 'failed', 'processing');

CREATE INDEX IF NOT EXISTS idx_notification_logs_store_created_at
    ON public.notification_logs(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_correlation_created_at
    ON public.notification_logs(correlation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.notification_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    delivery_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    notification_log_id UUID REFERENCES public.notification_logs(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, delivery_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_webhook_events_notification
    ON public.notification_webhook_events(notification_log_id, created_at DESC);

ALTER TABLE public.notification_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notification webhook events" ON public.notification_webhook_events;
CREATE POLICY "Admins can view notification webhook events"
ON public.notification_webhook_events
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage notification webhook events" ON public.notification_webhook_events;
CREATE POLICY "Service role can manage notification webhook events"
ON public.notification_webhook_events
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.claim_notification_logs(
    p_limit INTEGER DEFAULT 10,
    p_processing_timeout_seconds INTEGER DEFAULT 300
) RETURNS SETOF public.notification_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit INTEGER := GREATEST(COALESCE(p_limit, 10), 1);
    v_timeout_seconds INTEGER := GREATEST(COALESCE(p_processing_timeout_seconds, 300), 30);
BEGIN
    RETURN QUERY
    WITH candidate_logs AS (
        SELECT nl.id
        FROM public.notification_logs nl
        WHERE nl.message_sid IS NULL
          AND (
            nl.status = 'queued'
            OR (
                nl.status = 'failed'
                AND nl.next_attempt_at IS NOT NULL
                AND nl.next_attempt_at <= NOW()
            )
            OR (
                nl.status = 'processing'
                AND nl.processing_started_at IS NOT NULL
                AND nl.processing_started_at <= NOW() - make_interval(secs => v_timeout_seconds)
            )
          )
        ORDER BY COALESCE(nl.next_attempt_at, nl.created_at), nl.created_at
        LIMIT v_limit
        FOR UPDATE SKIP LOCKED
    ),
    updated_logs AS (
        UPDATE public.notification_logs nl
        SET status = 'processing',
            processing_started_at = NOW(),
            last_attempt_at = NOW(),
            next_attempt_at = NULL,
            dispatch_attempts = COALESCE(nl.dispatch_attempts, 0) + 1,
            updated_at = NOW()
        WHERE nl.id IN (SELECT id FROM candidate_logs)
        RETURNING nl.*
    )
    SELECT *
    FROM updated_logs;
END;
$$;
