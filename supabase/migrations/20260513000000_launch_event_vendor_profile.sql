-- Launch polish settings for the V1 staging baseline.
-- - Lets admins change the buyer launch-event hero copy without multi-event infrastructure.
-- - Lets vendors maintain lightweight public discovery tags.

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

CREATE INDEX IF NOT EXISTS idx_stores_tags_gin
ON public.stores
USING GIN (tags);

CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_app_settings_modtime ON public.app_settings;
CREATE TRIGGER update_app_settings_modtime
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

DROP POLICY IF EXISTS "Launch event settings are public" ON public.app_settings;
CREATE POLICY "Launch event settings are public"
ON public.app_settings
FOR SELECT
USING (key = 'launch_event');

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings"
ON public.app_settings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

INSERT INTO public.app_settings (key, value)
VALUES (
    'launch_event',
    '{
        "label": "Live now",
        "title": "Summer Beats 2026",
        "subtitle": "Skip the lines, enjoy the vibes. Browse vendors and order ahead from your phone.",
        "landingTitle": "Order ahead at Summer Beats",
        "landingSubtitle": "Find the right stall, pay in seconds, and collect when your order is ready."
    }'::JSONB
)
ON CONFLICT (key) DO NOTHING;
