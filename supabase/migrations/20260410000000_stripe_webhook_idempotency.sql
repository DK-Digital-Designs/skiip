-- Stripe webhook idempotency tracking
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_processed_events_processed_at
  ON public.stripe_processed_events (processed_at DESC);
