-- ============================================================
-- Migration: Stripe Connect Phase 1
-- Adds vendor connected account tracking + order ledger columns
-- ============================================================

-- STORES: Add Stripe Connect fields
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT false;

-- Index for fast onboarding status lookups
CREATE INDEX IF NOT EXISTS idx_stores_stripe_account_id ON public.stores (stripe_account_id);

-- ORDERS: Add full payment ledger columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS charge_id TEXT,
ADD COLUMN IF NOT EXISTS tip_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS vendor_net NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Index for fast charge/session lookups (support, webhooks, reconciliation)
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id ON public.orders (checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON public.orders (payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_orders_charge_id ON public.orders (charge_id);

-- RLS: Allow vendor to read their own store's stripe fields
-- (existing policies already allow sellers to view own store — no new policy needed)
-- stripe_account_id must ONLY be written by service-role (webhooks), not by vendors directly.
-- We enforce this by not adding an UPDATE policy for stripe_account_id on the client role.