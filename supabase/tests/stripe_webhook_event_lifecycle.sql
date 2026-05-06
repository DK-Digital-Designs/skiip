-- Verifies retryable Stripe webhook event claiming. Run against a reset local Supabase DB.

BEGIN;

DO $$
DECLARE
    v_event_id TEXT := 'evt_test_lifecycle_' || replace(gen_random_uuid()::text, '-', '');
    v_should_process BOOLEAN;
    v_status TEXT;
    v_attempt_count INTEGER;
BEGIN
    PERFORM set_config('request.jwt.claim.role', 'service_role', true);

    SELECT should_process, processing_status, attempt_count
    INTO v_should_process, v_status, v_attempt_count
    FROM public.claim_stripe_webhook_event(v_event_id, 'checkout.session.completed');

    IF v_should_process IS DISTINCT FROM true OR v_status <> 'processing' OR v_attempt_count <> 1 THEN
        RAISE EXCEPTION 'Initial claim failed: %, %, %', v_should_process, v_status, v_attempt_count;
    END IF;

    PERFORM public.mark_stripe_webhook_event_failed(v_event_id, 'forced test failure');

    SELECT should_process, processing_status, attempt_count
    INTO v_should_process, v_status, v_attempt_count
    FROM public.claim_stripe_webhook_event(v_event_id, 'checkout.session.completed');

    IF v_should_process IS DISTINCT FROM true OR v_status <> 'processing' OR v_attempt_count <> 2 THEN
        RAISE EXCEPTION 'Failed event was not retryable: %, %, %', v_should_process, v_status, v_attempt_count;
    END IF;

    PERFORM public.mark_stripe_webhook_event_succeeded(v_event_id);

    SELECT should_process, processing_status, attempt_count
    INTO v_should_process, v_status, v_attempt_count
    FROM public.claim_stripe_webhook_event(v_event_id, 'checkout.session.completed');

    IF v_should_process IS DISTINCT FROM false OR v_status <> 'succeeded' OR v_attempt_count <> 2 THEN
        RAISE EXCEPTION 'Succeeded event was not ignored: %, %, %', v_should_process, v_status, v_attempt_count;
    END IF;
END;
$$;

ROLLBACK;
