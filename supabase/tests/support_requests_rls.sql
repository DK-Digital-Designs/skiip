-- Verifies private support queue visibility. Run against a reset local Supabase DB.

BEGIN;

DO $$
DECLARE
    v_buyer_id UUID := gen_random_uuid();
    v_admin_id UUID := gen_random_uuid();
BEGIN
    PERFORM set_config('test.support_buyer_id', v_buyer_id::text, true);
    PERFORM set_config('test.support_admin_id', v_admin_id::text, true);

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at
    )
    VALUES
        (
            v_buyer_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'support-buyer@example.com',
            'not-used',
            NOW(),
            NOW(),
            NOW()
        ),
        (
            v_admin_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'support-admin@example.com',
            'not-used',
            NOW(),
            NOW(),
            NOW()
        );

    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES
        (v_buyer_id, 'support-buyer@example.com', 'Support Buyer', 'buyer'),
        (v_admin_id, 'support-admin@example.com', 'Support Admin', 'admin');
END;
$$;

SET LOCAL ROLE service_role;

INSERT INTO public.support_requests (
    reference_code,
    source,
    reporter_user_id,
    reporter_role,
    contact_name,
    contact_email,
    issue_type,
    description,
    acknowledged_at
)
VALUES (
    'SUP-RLS-BUYER',
    'buyer_submission',
    current_setting('test.support_buyer_id')::uuid,
    'buyer',
    'Support Buyer',
    'support-buyer@example.com',
    'app_bug',
    'The app displayed an unexpected issue during ordering.',
    NOW()
);

RESET ROLE;
SET LOCAL ROLE authenticated;

SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', current_setting('test.support_buyer_id'), true);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.support_requests WHERE reference_code = 'SUP-RLS-BUYER') THEN
        RAISE EXCEPTION 'Buyer must not read submitted support request rows directly';
    END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', current_setting('test.support_admin_id'), true);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.support_requests WHERE reference_code = 'SUP-RLS-BUYER') THEN
        RAISE EXCEPTION 'Admin should be able to read support request rows';
    END IF;
END;
$$;

ROLLBACK;
