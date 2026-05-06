-- ============================================================
-- Migration: Scheduled orders thin v1
-- - adds optional collection timing to orders
-- - keeps launch timezone fixed to Europe/London
-- - does not change payment or order lifecycle semantics
-- ============================================================

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS scheduled_collection_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_collection_timezone TEXT DEFAULT 'Europe/London';

UPDATE public.orders
SET scheduled_collection_timezone = 'Europe/London'
WHERE scheduled_collection_timezone IS NULL;

ALTER TABLE public.orders
ALTER COLUMN scheduled_collection_timezone SET DEFAULT 'Europe/London',
ALTER COLUMN scheduled_collection_timezone SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'orders_scheduled_collection_timezone_launch'
          AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_scheduled_collection_timezone_launch
        CHECK (scheduled_collection_timezone = 'Europe/London') NOT VALID;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_collection_at
    ON public.orders (scheduled_collection_at)
    WHERE scheduled_collection_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_store_scheduled_collection_at
    ON public.orders (store_id, scheduled_collection_at)
    WHERE scheduled_collection_at IS NOT NULL;
