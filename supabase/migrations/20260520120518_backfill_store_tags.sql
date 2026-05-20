-- Backfill and harden vendor discovery tags for existing stores.
-- Missing tags broke the vendor profile page and left buyer discovery without a stable category source.

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS tags TEXT[];

UPDATE public.stores
SET tags = ARRAY(
    SELECT DISTINCT LEFT(TRIM(tag), 24)
    FROM unnest(COALESCE(tags, '{}'::TEXT[])) AS tag
    WHERE TRIM(COALESCE(tag, '')) <> ''
);

WITH classified AS (
    SELECT
        id,
        LOWER(CONCAT_WS(' ', name, slug, description, pickup_location)) AS search_text
    FROM public.stores
    WHERE tags IS NULL OR CARDINALITY(tags) = 0
)
UPDATE public.stores AS stores
SET tags = COALESCE(
        NULLIF(ARRAY_REMOVE(ARRAY[
            CASE WHEN classified.search_text ~ '(bar|beer|cocktail|mocktail|drink|wine|pour)' THEN 'Bar' END,
            CASE WHEN classified.search_text ~ '(burger|fries|grill|kitchen)' THEN 'Burgers' END,
            CASE WHEN classified.search_text ~ '(chicken|wing|peri)' THEN 'Chicken' END,
            CASE WHEN classified.search_text ~ '(taco|nacho|salsa)' THEN 'Tacos' END,
            CASE WHEN classified.search_text ~ '(sweet|dessert|ice|waffle)' THEN 'Sweet' END
        ], NULL), '{}'::TEXT[]),
        ARRAY['Food']::TEXT[]
    ),
    updated_at = NOW()
FROM classified
WHERE stores.id = classified.id;

UPDATE public.stores
SET tags = ARRAY['Food'], updated_at = NOW()
WHERE tags IS NULL OR CARDINALITY(tags) = 0;

ALTER TABLE public.stores
ALTER COLUMN tags SET DEFAULT ARRAY['Food']::TEXT[];

ALTER TABLE public.stores
ALTER COLUMN tags SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stores_tags_gin
ON public.stores
USING GIN (tags);

INSERT INTO public.app_settings (key, value)
VALUES (
    'launch_event',
    '{
        "label": "Live now",
        "title": "SAWFT",
        "subtitle": "Official event ordering. Your food doesn''t need a queue anymore.",
        "landingTitle": "SAWFT",
        "landingSubtitle": "Official event ordering. Your food doesn''t need a queue anymore."
    }'::JSONB
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
