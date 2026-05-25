-- Payment controls for live launch operations.
-- PAYMENTS_ENABLED remains the environment-level master switch.
-- This app setting lets admins pause buyer checkout without changing secrets.

INSERT INTO public.app_settings (key, value)
VALUES (
    'payment_controls',
    jsonb_build_object(
        'enabled', true,
        'reason', NULL,
        'updatedAt', NULL,
        'updatedBy', NULL
    )
)
ON CONFLICT (key) DO NOTHING;
