-- ============================================================
-- Migration: Payment-state recovery and webhook idempotency
-- - tracks Stripe webhook processing as processing/succeeded/failed
-- - allows failed/stale webhook attempts to be retried safely
-- - makes inventory finalization idempotent for webhook retries
-- ============================================================

ALTER TABLE public.stripe_processed_events
ADD COLUMN IF NOT EXISTS processing_status TEXT,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_attempted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_error TEXT;

UPDATE public.stripe_processed_events
SET processing_status = COALESCE(processing_status, 'succeeded'),
    attempt_count = GREATEST(COALESCE(attempt_count, 0), 1),
    first_attempted_at = COALESCE(first_attempted_at, processed_at),
    last_attempted_at = COALESCE(last_attempted_at, processed_at),
    completed_at = COALESCE(completed_at, processed_at)
WHERE processing_status IS NULL;

ALTER TABLE public.stripe_processed_events
ALTER COLUMN processing_status SET DEFAULT 'processing';

ALTER TABLE public.stripe_processed_events
ALTER COLUMN processing_status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stripe_processed_events_processing_status_check'
          AND conrelid = 'public.stripe_processed_events'::regclass
    ) THEN
        ALTER TABLE public.stripe_processed_events
        ADD CONSTRAINT stripe_processed_events_processing_status_check
        CHECK (processing_status IN ('processing', 'succeeded', 'failed'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_status_attempted_at
    ON public.stripe_processed_events (processing_status, last_attempted_at DESC);

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
    p_stripe_event_id TEXT,
    p_event_type TEXT,
    p_processing_timeout_seconds INTEGER DEFAULT 300
) RETURNS TABLE (
    should_process BOOLEAN,
    processing_status TEXT,
    attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_timeout_seconds INTEGER := GREATEST(COALESCE(p_processing_timeout_seconds, 300), 30);
    v_event public.stripe_processed_events%ROWTYPE;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF p_stripe_event_id IS NULL OR btrim(p_stripe_event_id) = '' THEN
        RAISE EXCEPTION 'STRIPE_EVENT_ID_REQUIRED';
    END IF;

    INSERT INTO public.stripe_processed_events (
        stripe_event_id,
        event_type,
        processing_status,
        attempt_count,
        first_attempted_at,
        last_attempted_at
    )
    VALUES (
        p_stripe_event_id,
        p_event_type,
        'processing',
        1,
        v_now,
        v_now
    )
    ON CONFLICT (stripe_event_id) DO NOTHING
    RETURNING * INTO v_event;

    IF FOUND THEN
        RETURN QUERY
        SELECT true, v_event.processing_status, v_event.attempt_count;
        RETURN;
    END IF;

    SELECT *
    INTO v_event
    FROM public.stripe_processed_events
    WHERE stripe_event_id = p_stripe_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STRIPE_EVENT_CLAIM_RACE';
    END IF;

    IF v_event.processing_status = 'succeeded' THEN
        RETURN QUERY
        SELECT false, v_event.processing_status, v_event.attempt_count;
        RETURN;
    END IF;

    IF v_event.processing_status = 'processing'
        AND v_event.last_attempted_at IS NOT NULL
        AND v_event.last_attempted_at > v_now - make_interval(secs => v_timeout_seconds) THEN
        RETURN QUERY
        SELECT false, v_event.processing_status, v_event.attempt_count;
        RETURN;
    END IF;

    UPDATE public.stripe_processed_events AS spe
    SET event_type = p_event_type,
        processing_status = 'processing',
        attempt_count = COALESCE(spe.attempt_count, 0) + 1,
        first_attempted_at = COALESCE(spe.first_attempted_at, v_now),
        last_attempted_at = v_now,
        completed_at = NULL,
        last_error = NULL
    WHERE spe.stripe_event_id = p_stripe_event_id
    RETURNING * INTO v_event;

    RETURN QUERY
    SELECT true, v_event.processing_status, v_event.attempt_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event_succeeded(
    p_stripe_event_id TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    UPDATE public.stripe_processed_events
    SET processing_status = 'succeeded',
        processed_at = NOW(),
        completed_at = NOW(),
        last_error = NULL
    WHERE stripe_event_id = p_stripe_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STRIPE_EVENT_NOT_FOUND';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_stripe_webhook_event_failed(
    p_stripe_event_id TEXT,
    p_error TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    UPDATE public.stripe_processed_events
    SET processing_status = 'failed',
        completed_at = NULL,
        last_error = LEFT(COALESCE(p_error, 'Unknown webhook processing error'), 4000)
    WHERE stripe_event_id = p_stripe_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STRIPE_EVENT_NOT_FOUND';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_paid_order_inventory(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    SELECT id, inventory_committed_at
    INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND';
    END IF;

    IF v_order.inventory_committed_at IS NOT NULL THEN
        RETURN;
    END IF;

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

    UPDATE public.orders
    SET inventory_committed_at = NOW()
    WHERE id = p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_stripe_webhook_event_succeeded(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_stripe_webhook_event_failed(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_paid_order_inventory(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_stripe_webhook_event_succeeded(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_stripe_webhook_event_failed(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order_inventory(UUID) TO service_role;
