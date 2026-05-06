-- ============================================================
-- Migration: Reconcile auth.users and public.user_profiles
-- Purpose:
-- - make profile creation idempotent
-- - backfill missing user_profiles rows
-- - normalize empty/null profile fields safely
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
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'buyer')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(public.user_profiles.full_name, ''), EXCLUDED.full_name),
      role = COALESCE(public.user_profiles.role, EXCLUDED.role);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill any auth users that are missing public profiles.
INSERT INTO
    public.user_profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(
        NULLIF(
            u.raw_user_meta_data ->> 'full_name', ''
        ), split_part(COALESCE(u.email, ''), '@', 1)
    ), COALESCE(
        NULLIF(
            u.raw_user_meta_data ->> 'role', ''
        ), 'buyer'
    )
FROM auth.users u
WHERE
    NOT EXISTS (
        SELECT 1
        FROM public.user_profiles p
        WHERE
            p.id = u.id
    );

-- Normalize incomplete existing profiles without overwriting intentional values.
UPDATE public.user_profiles p
SET
    email = COALESCE(NULLIF(p.email, ''), u.email),
    full_name = COALESCE(
        NULLIF(p.full_name, ''),
        NULLIF(
            u.raw_user_meta_data ->> 'full_name',
            ''
        ),
        split_part(COALESCE(u.email, ''), '@', 1)
    ),
    role = COALESCE(
        p.role,
        NULLIF(
            u.raw_user_meta_data ->> 'role',
            ''
        ),
        'buyer'
    )
FROM auth.users u
WHERE
    p.id = u.id
    AND (
        p.email IS NULL
        OR p.email = ''
        OR p.full_name IS NULL
        OR p.full_name = ''
        OR p.role IS NULL
    );