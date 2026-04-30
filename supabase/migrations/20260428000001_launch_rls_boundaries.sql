-- ============================================================
-- Migration: Launch RLS and role-boundary tightening
-- - buyer self-signup creates buyer profiles only
-- - vendor/store provisioning is admin/service-role controlled for launch
-- - order creation is server-authoritative through edge functions
-- - Stripe processed-event bookkeeping is not browser-readable/writable
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'buyer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Sellers can insert own store" ON public.stores;
DROP POLICY IF EXISTS "Sellers can update own store" ON public.stores;

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view stripe processed events" ON public.stripe_processed_events;
CREATE POLICY "Admins can view stripe processed events"
ON public.stripe_processed_events
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage stripe processed events" ON public.stripe_processed_events;
CREATE POLICY "Service role can manage stripe processed events"
ON public.stripe_processed_events
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
