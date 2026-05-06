-- ============================================================
-- Migration: Stripe Connect canonical status reconciliation
-- Purpose:
-- - persist one derived vendor Connect status for UI/checkout/ops
-- - keep raw Stripe account observability fields for diagnostics
-- - preserve the legacy stripe_onboarding_complete boolean as a
--   compatibility mirror of stripe_connect_status = 'ready'
-- ============================================================

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS stripe_connect_status TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_card_payments_status TEXT,
ADD COLUMN IF NOT EXISTS stripe_transfers_status TEXT,
ADD COLUMN IF NOT EXISTS stripe_requirements_currently_due JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stripe_requirements_past_due JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stripe_requirements_pending_verification JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stripe_requirements_disabled_reason TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_last_checked_at TIMESTAMPTZ;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stores_stripe_connect_status_check'
          AND conrelid = 'public.stores'::regclass
    ) THEN
        ALTER TABLE public.stores
        ADD CONSTRAINT stores_stripe_connect_status_check
        CHECK (
            stripe_connect_status IN (
                'not_started',
                'onboarding',
                'restricted',
                'pending_verification',
                'ready'
            )
        );
    END IF;
END;
$$;

UPDATE public.stores
SET stripe_connect_status = CASE
        WHEN stripe_account_id IS NULL THEN 'not_started'
        WHEN stripe_onboarding_complete IS TRUE THEN 'ready'
        ELSE 'onboarding'
    END,
    stripe_charges_enabled = CASE
        WHEN stripe_onboarding_complete IS TRUE THEN true
        ELSE stripe_charges_enabled
    END,
    stripe_payouts_enabled = CASE
        WHEN stripe_onboarding_complete IS TRUE THEN true
        ELSE stripe_payouts_enabled
    END
WHERE stripe_connect_status = 'not_started'
  AND (
      stripe_account_id IS NOT NULL
      OR stripe_onboarding_complete IS TRUE
  );

UPDATE public.stores
SET stripe_onboarding_complete = (stripe_connect_status = 'ready')
WHERE stripe_onboarding_complete IS DISTINCT FROM (stripe_connect_status = 'ready');

CREATE INDEX IF NOT EXISTS idx_stores_stripe_connect_status
    ON public.stores (stripe_connect_status);
