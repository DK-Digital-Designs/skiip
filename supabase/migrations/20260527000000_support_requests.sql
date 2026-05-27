-- Private support queue for buyer/vendor issue reporting and refund review.

CREATE TABLE public.support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL CHECK (
        source IN ('buyer_submission', 'vendor_submission', 'vendor_cancellation')
    ),
    reporter_user_id UUID NOT NULL REFERENCES auth.users(id),
    reporter_role TEXT NOT NULL CHECK (reporter_role IN ('buyer', 'seller')),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    issue_type TEXT NOT NULL CHECK (
        issue_type IN (
            'refund_request',
            'wrong_order',
            'cold_food',
            'vendor_cancelled',
            'collection_issue',
            'payment_issue',
            'app_bug',
            'general_query',
            'payment_payout_concern',
            'order_operation_issue'
        )
    ),
    description TEXT NOT NULL CHECK (
        char_length(btrim(description)) BETWEEN 10 AND 2000
    ),
    acknowledged_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'open' CHECK (
        status IN ('open', 'in_review', 'resolved', 'closed')
    ),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (
        priority IN ('normal', 'high', 'urgent')
    ),
    internal_notes TEXT,
    resolved_at TIMESTAMPTZ,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_requests_queue
    ON public.support_requests(status, priority, created_at DESC);

CREATE INDEX idx_support_requests_order
    ON public.support_requests(order_id)
    WHERE order_id IS NOT NULL;

CREATE INDEX idx_support_requests_store
    ON public.support_requests(store_id)
    WHERE store_id IS NOT NULL;

CREATE INDEX idx_support_requests_created
    ON public.support_requests(created_at DESC);

CREATE UNIQUE INDEX idx_support_requests_paid_vendor_cancellation
    ON public.support_requests(order_id)
    WHERE source = 'vendor_cancellation' AND order_id IS NOT NULL;

CREATE TRIGGER update_support_requests_modtime
BEFORE UPDATE ON public.support_requests
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;

CREATE POLICY "Admins can view support requests"
ON public.support_requests
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

CREATE POLICY "Service role can manage support requests"
ON public.support_requests
FOR ALL
TO service_role
USING ((SELECT auth.role()) = 'service_role')
WITH CHECK ((SELECT auth.role()) = 'service_role');
