-- Verifies product modifier table security posture and required uniqueness
-- indexes. Run against a reset local Supabase DB.

BEGIN;

DO $$
DECLARE
    v_missing_indexes TEXT[];
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.product_modifier_groups'::regclass
          AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'product_modifier_groups must have RLS enabled';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.product_modifier_options'::regclass
          AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'product_modifier_options must have RLS enabled';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE oid = 'public.order_item_modifier_selections'::regclass
          AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'order_item_modifier_selections must have RLS enabled';
    END IF;

    SELECT array_agg(expected_name)
    INTO v_missing_indexes
    FROM (
        VALUES
            ('idx_product_modifier_groups_active_sort_order'),
            ('idx_product_modifier_options_active_sort_order'),
            ('idx_product_modifier_groups_active_name'),
            ('idx_product_modifier_options_active_name')
    ) expected(expected_name)
    WHERE NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = expected.expected_name
    );

    IF COALESCE(array_length(v_missing_indexes, 1), 0) > 0 THEN
        RAISE EXCEPTION 'Missing modifier uniqueness indexes: %', v_missing_indexes;
    END IF;

    IF NOT has_table_privilege('anon', 'public.product_modifier_groups', 'SELECT') THEN
        RAISE EXCEPTION 'anon needs SELECT grant on product_modifier_groups';
    END IF;

    IF NOT has_table_privilege('anon', 'public.product_modifier_options', 'SELECT') THEN
        RAISE EXCEPTION 'anon needs SELECT grant on product_modifier_options';
    END IF;

    IF NOT has_table_privilege('authenticated', 'public.product_modifier_groups', 'INSERT') THEN
        RAISE EXCEPTION 'authenticated needs DML grant on product_modifier_groups';
    END IF;

    IF NOT has_table_privilege('authenticated', 'public.product_modifier_options', 'INSERT') THEN
        RAISE EXCEPTION 'authenticated needs DML grant on product_modifier_options';
    END IF;

    IF NOT has_table_privilege('authenticated', 'public.order_item_modifier_selections', 'SELECT') THEN
        RAISE EXCEPTION 'authenticated needs SELECT grant on order_item_modifier_selections';
    END IF;
END;
$$;

ROLLBACK;
