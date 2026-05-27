-- Rename the buyer/vendor discovery category from Burgers to Mains.
-- Product names and descriptions are intentionally unchanged.

UPDATE public.products
SET category = 'Mains'
WHERE category = 'Burgers';

UPDATE public.stores
SET tags = ARRAY(
    SELECT DISTINCT CASE WHEN tag = 'Burgers' THEN 'Mains' ELSE tag END
    FROM unnest(tags) AS tag
    WHERE tag IS NOT NULL AND btrim(tag) <> ''
)
WHERE 'Burgers' = ANY(tags);
