-- ============================================================
-- Migration: Product modifiers V1
-- Purpose:
-- - persist product modifier groups/options
-- - persist modifier selections on order items
-- - extend atomic order creation for line-aware configured items
-- - add service-role RPC for atomic vendor modifier replacement
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    min_select INTEGER NOT NULL DEFAULT 0,
    max_select INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT product_modifier_groups_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT product_modifier_groups_status_check CHECK (status IN ('active', 'inactive')),
    CONSTRAINT product_modifier_groups_min_check CHECK (min_select >= 0),
    CONSTRAINT product_modifier_groups_max_check CHECK (max_select >= 1),
    CONSTRAINT product_modifier_groups_range_check CHECK (max_select >= min_select),
    CONSTRAINT product_modifier_groups_required_min_check CHECK (
        (required = false AND min_select = 0)
        OR (required = true AND min_select >= 1)
    )
);

CREATE TABLE IF NOT EXISTS public.product_modifier_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.product_modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT product_modifier_options_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT product_modifier_options_status_check CHECK (status IN ('active', 'inactive')),
    CONSTRAINT product_modifier_options_price_delta_check CHECK (price_delta >= 0)
);

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS line_note TEXT;

CREATE TABLE IF NOT EXISTS public.order_item_modifier_selections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    product_modifier_group_id UUID REFERENCES public.product_modifier_groups(id) ON DELETE SET NULL,
    product_modifier_option_id UUID REFERENCES public.product_modifier_options(id) ON DELETE SET NULL,
    group_name TEXT NOT NULL,
    option_name TEXT NOT NULL,
    price_delta NUMERIC(10, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT order_item_modifier_selections_group_name_not_blank CHECK (btrim(group_name) <> ''),
    CONSTRAINT order_item_modifier_selections_option_name_not_blank CHECK (btrim(option_name) <> ''),
    CONSTRAINT order_item_modifier_selections_price_delta_check CHECK (price_delta >= 0)
);

CREATE INDEX IF NOT EXISTS idx_product_modifier_groups_product_id
ON public.product_modifier_groups(product_id);

CREATE INDEX IF NOT EXISTS idx_product_modifier_options_group_id
ON public.product_modifier_options(group_id);

CREATE INDEX IF NOT EXISTS idx_order_item_modifier_selections_order_item_id
ON public.order_item_modifier_selections(order_item_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_modifier_groups_active_sort_order
ON public.product_modifier_groups(product_id, sort_order)
WHERE deleted_at IS NULL AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_modifier_options_active_sort_order
ON public.product_modifier_options(group_id, sort_order)
WHERE deleted_at IS NULL AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_modifier_groups_active_name
ON public.product_modifier_groups(product_id, lower(name))
WHERE deleted_at IS NULL AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_modifier_options_active_name
ON public.product_modifier_options(group_id, lower(name))
WHERE deleted_at IS NULL AND status = 'active';

ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifier_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active modifier groups are viewable by everyone" ON public.product_modifier_groups;
CREATE POLICY "Active modifier groups are viewable by everyone"
ON public.product_modifier_groups
FOR SELECT
USING (
    status = 'active'
    AND deleted_at IS NULL
    AND EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_id
          AND p.status = 'active'
          AND p.deleted_at IS NULL
          AND s.status = 'active'
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can view own modifier groups" ON public.product_modifier_groups;
CREATE POLICY "Sellers can view own modifier groups"
ON public.product_modifier_groups
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can insert own modifier groups" ON public.product_modifier_groups;
CREATE POLICY "Sellers can insert own modifier groups"
ON public.product_modifier_groups
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can update own modifier groups" ON public.product_modifier_groups;
CREATE POLICY "Sellers can update own modifier groups"
ON public.product_modifier_groups
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can delete own modifier groups" ON public.product_modifier_groups;
CREATE POLICY "Sellers can delete own modifier groups"
ON public.product_modifier_groups
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.products p
        JOIN public.stores s ON s.id = p.store_id
        WHERE p.id = product_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Admins can manage modifier groups" ON public.product_modifier_groups;
CREATE POLICY "Admins can manage modifier groups"
ON public.product_modifier_groups
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Active modifier options are viewable by everyone" ON public.product_modifier_options;
CREATE POLICY "Active modifier options are viewable by everyone"
ON public.product_modifier_options
FOR SELECT
USING (
    status = 'active'
    AND deleted_at IS NULL
    AND EXISTS (
        SELECT 1
        FROM public.product_modifier_groups g
        JOIN public.products p ON p.id = g.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE g.id = group_id
          AND g.status = 'active'
          AND g.deleted_at IS NULL
          AND p.status = 'active'
          AND p.deleted_at IS NULL
          AND s.status = 'active'
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can view own modifier options" ON public.product_modifier_options;
CREATE POLICY "Sellers can view own modifier options"
ON public.product_modifier_options
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.product_modifier_groups g
        JOIN public.products p ON p.id = g.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE g.id = group_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can insert own modifier options" ON public.product_modifier_options;
CREATE POLICY "Sellers can insert own modifier options"
ON public.product_modifier_options
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.product_modifier_groups g
        JOIN public.products p ON p.id = g.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE g.id = group_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can update own modifier options" ON public.product_modifier_options;
CREATE POLICY "Sellers can update own modifier options"
ON public.product_modifier_options
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.product_modifier_groups g
        JOIN public.products p ON p.id = g.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE g.id = group_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.product_modifier_groups g
        JOIN public.products p ON p.id = g.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE g.id = group_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can delete own modifier options" ON public.product_modifier_options;
CREATE POLICY "Sellers can delete own modifier options"
ON public.product_modifier_options
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.product_modifier_groups g
        JOIN public.products p ON p.id = g.product_id
        JOIN public.stores s ON s.id = p.store_id
        WHERE g.id = group_id
          AND s.user_id = auth.uid()
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Admins can manage modifier options" ON public.product_modifier_options;
CREATE POLICY "Admins can manage modifier options"
ON public.product_modifier_options
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own order modifier selections" ON public.order_item_modifier_selections;
CREATE POLICY "Users can view own order modifier selections"
ON public.order_item_modifier_selections
FOR SELECT
USING (
    order_item_id IN (
        SELECT oi.id
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE o.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Sellers can view store order modifier selections" ON public.order_item_modifier_selections;
CREATE POLICY "Sellers can view store order modifier selections"
ON public.order_item_modifier_selections
FOR SELECT
USING (
    order_item_id IN (
        SELECT oi.id
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        JOIN public.stores s ON s.id = o.store_id
        WHERE s.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can view order modifier selections" ON public.order_item_modifier_selections;
CREATE POLICY "Admins can view order modifier selections"
ON public.order_item_modifier_selections
FOR SELECT
USING (public.is_admin());

GRANT SELECT ON public.product_modifier_groups TO anon, authenticated;
GRANT SELECT ON public.product_modifier_options TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_modifier_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_modifier_options TO authenticated;
GRANT SELECT ON public.order_item_modifier_selections TO authenticated;
GRANT ALL ON public.product_modifier_groups TO service_role;
GRANT ALL ON public.product_modifier_options TO service_role;
GRANT ALL ON public.order_item_modifier_selections TO service_role;

DROP TRIGGER IF EXISTS update_product_modifier_groups_modtime ON public.product_modifier_groups;
CREATE TRIGGER update_product_modifier_groups_modtime
BEFORE UPDATE ON public.product_modifier_groups
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_modifier_options_modtime ON public.product_modifier_options;
CREATE TRIGGER update_product_modifier_options_modtime
BEFORE UPDATE ON public.product_modifier_options
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE FUNCTION public.replace_product_modifiers_v1(
    p_actor_user_id UUID,
    p_product_id UUID,
    p_groups JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product RECORD;
    v_actor_role TEXT;
    v_group JSONB;
    v_option JSONB;
    v_group_id UUID;
    v_required BOOLEAN;
    v_min_select INTEGER;
    v_max_select INTEGER;
    v_group_name TEXT;
    v_option_name TEXT;
    v_group_sort_order INTEGER;
    v_option_sort_order INTEGER;
    v_group_index INTEGER := 0;
    v_option_index INTEGER;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF p_actor_user_id IS NULL OR p_product_id IS NULL THEN
        RAISE EXCEPTION 'ACTOR_AND_PRODUCT_REQUIRED';
    END IF;

    IF jsonb_typeof(COALESCE(p_groups, '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'MODIFIER_GROUPS_MUST_BE_ARRAY';
    END IF;

    SELECT p.id, p.store_id, s.user_id AS seller_user_id
    INTO v_product
    FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
    WHERE p.id = p_product_id
      AND p.deleted_at IS NULL
      AND s.deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
    END IF;

    SELECT role
    INTO v_actor_role
    FROM public.user_profiles
    WHERE id = p_actor_user_id;

    IF v_actor_role IS DISTINCT FROM 'admin'
       AND v_product.seller_user_id IS DISTINCT FROM p_actor_user_id THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    DELETE FROM public.product_modifier_groups
    WHERE product_id = p_product_id;

    FOR v_group IN
        SELECT value
        FROM jsonb_array_elements(COALESCE(p_groups, '[]'::jsonb))
    LOOP
        v_group_index := v_group_index + 1;
        v_group_name := btrim(COALESCE(v_group->>'name', ''));
        v_required := COALESCE((v_group->>'required')::BOOLEAN, false);
        v_min_select := COALESCE((v_group->>'minSelect')::INTEGER, (v_group->>'min_select')::INTEGER, 0);
        v_max_select := COALESCE((v_group->>'maxSelect')::INTEGER, (v_group->>'max_select')::INTEGER, 1);
        v_group_sort_order := COALESCE((v_group->>'sortOrder')::INTEGER, (v_group->>'sort_order')::INTEGER, v_group_index);

        IF v_group_name = '' THEN
            RAISE EXCEPTION 'MODIFIER_GROUP_NAME_REQUIRED';
        END IF;

        IF NOT v_required THEN
            v_min_select := 0;
        ELSIF v_min_select < 1 THEN
            RAISE EXCEPTION 'REQUIRED_GROUP_MIN_SELECT_INVALID';
        END IF;

        IF v_max_select < 1 OR v_max_select < v_min_select THEN
            RAISE EXCEPTION 'MODIFIER_GROUP_MAX_SELECT_INVALID';
        END IF;

        INSERT INTO public.product_modifier_groups (
            product_id,
            name,
            required,
            min_select,
            max_select,
            sort_order,
            status
        )
        VALUES (
            p_product_id,
            v_group_name,
            v_required,
            v_min_select,
            v_max_select,
            v_group_sort_order,
            CASE WHEN COALESCE((v_group->>'active')::BOOLEAN, (v_group->>'status') IS DISTINCT FROM 'inactive', true)
                THEN 'active'
                ELSE 'inactive'
            END
        )
        RETURNING id INTO v_group_id;

        IF jsonb_typeof(COALESCE(v_group->'options', '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
            RAISE EXCEPTION 'MODIFIER_OPTIONS_MUST_BE_ARRAY';
        END IF;

        v_option_index := 0;
        FOR v_option IN
            SELECT value
            FROM jsonb_array_elements(COALESCE(v_group->'options', '[]'::jsonb))
        LOOP
            v_option_index := v_option_index + 1;
            v_option_name := btrim(COALESCE(v_option->>'name', ''));
            v_option_sort_order := COALESCE((v_option->>'sortOrder')::INTEGER, (v_option->>'sort_order')::INTEGER, v_option_index);

            IF v_option_name = '' THEN
                RAISE EXCEPTION 'MODIFIER_OPTION_NAME_REQUIRED';
            END IF;

            INSERT INTO public.product_modifier_options (
                group_id,
                name,
                price_delta,
                sort_order,
                status
            )
            VALUES (
                v_group_id,
                v_option_name,
                ROUND(GREATEST(COALESCE((v_option->>'priceDelta')::NUMERIC, (v_option->>'price_delta')::NUMERIC, 0), 0), 2),
                v_option_sort_order,
                CASE WHEN COALESCE((v_option->>'active')::BOOLEAN, (v_option->>'status') IS DISTINCT FROM 'inactive', true)
                    THEN 'active'
                    ELSE 'inactive'
                END
            );
        END LOOP;
    END LOOP;

    RETURN (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', g.id,
                    'product_id', g.product_id,
                    'name', g.name,
                    'required', g.required,
                    'min_select', g.min_select,
                    'max_select', g.max_select,
                    'sort_order', g.sort_order,
                    'status', g.status,
                    'options', COALESCE((
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', o.id,
                                'group_id', o.group_id,
                                'name', o.name,
                                'price_delta', o.price_delta,
                                'sort_order', o.sort_order,
                                'status', o.status
                            )
                            ORDER BY o.sort_order, o.name
                        )
                        FROM public.product_modifier_options o
                        WHERE o.group_id = g.id
                          AND o.deleted_at IS NULL
                    ), '[]'::jsonb)
                )
                ORDER BY g.sort_order, g.name
            ),
            '[]'::jsonb
        )
        FROM public.product_modifier_groups g
        WHERE g.product_id = p_product_id
          AND g.deleted_at IS NULL
    );
END;
$$;

REVOKE ALL ON FUNCTION public.replace_product_modifiers_v1(UUID, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.replace_product_modifiers_v1(UUID, UUID, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_product_modifiers_v1(UUID, UUID, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.create_order_with_items_v1(
    p_order_number TEXT,
    p_user_id UUID,
    p_store_id UUID,
    p_subtotal NUMERIC,
    p_total NUMERIC,
    p_tip_amount NUMERIC,
    p_service_fee NUMERIC,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_notes TEXT,
    p_whatsapp_opt_in BOOLEAN,
    p_items JSONB,
    p_scheduled_collection_at TIMESTAMPTZ DEFAULT NULL,
    p_scheduled_collection_timezone TEXT DEFAULT 'Europe/London'
)
RETURNS TABLE (
    id UUID,
    order_number TEXT,
    subtotal NUMERIC,
    total NUMERIC,
    tip_amount NUMERIC,
    service_fee NUMERIC,
    store_id UUID,
    status TEXT,
    scheduled_collection_at TIMESTAMPTZ,
    scheduled_collection_timezone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_expected_item_count INTEGER;
    v_inserted_item_count INTEGER := 0;
    v_tip_amount NUMERIC := ROUND(COALESCE(p_tip_amount, 0), 2);
    v_service_fee NUMERIC := ROUND(COALESCE(p_service_fee, 0), 2);
    v_expected_total NUMERIC := ROUND(COALESCE(p_subtotal, 0) + COALESCE(p_tip_amount, 0) + COALESCE(p_service_fee, 0), 2);
    v_item JSONB;
    v_selection JSONB;
    v_order_item_id UUID;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'FORBIDDEN';
    END IF;

    IF p_order_number IS NULL OR btrim(p_order_number) = '' THEN
        RAISE EXCEPTION 'ORDER_NUMBER_REQUIRED';
    END IF;

    IF p_user_id IS NULL OR p_store_id IS NULL THEN
        RAISE EXCEPTION 'ORDER_OWNER_AND_STORE_REQUIRED';
    END IF;

    IF p_customer_email IS NULL OR btrim(p_customer_email) = '' THEN
        RAISE EXCEPTION 'CUSTOMER_EMAIL_REQUIRED';
    END IF;

    IF COALESCE(p_subtotal, -1) < 0
        OR COALESCE(p_total, -1) < 0
        OR COALESCE(p_tip_amount, -1) < 0
        OR COALESCE(p_service_fee, -1) < 0 THEN
        RAISE EXCEPTION 'ORDER_TOTALS_MUST_BE_NON_NEGATIVE';
    END IF;

    IF ROUND(COALESCE(p_total, -1), 2) <> v_expected_total THEN
        RAISE EXCEPTION 'ORDER_TOTAL_MISMATCH';
    END IF;

    IF COALESCE(p_scheduled_collection_timezone, 'Europe/London') <> 'Europe/London' THEN
        RAISE EXCEPTION 'SCHEDULED_COLLECTION_TIMEZONE_INVALID';
    END IF;

    IF p_scheduled_collection_at IS NOT NULL AND p_scheduled_collection_at <= NOW() THEN
        RAISE EXCEPTION 'SCHEDULED_COLLECTION_MUST_BE_FUTURE';
    END IF;

    IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'ORDER_ITEMS_REQUIRED';
    END IF;

    v_expected_item_count := jsonb_array_length(p_items);
    IF v_expected_item_count <= 0 THEN
        RAISE EXCEPTION 'ORDER_ITEMS_REQUIRED';
    END IF;

    INSERT INTO public.orders AS created_order (
        order_number,
        user_id,
        store_id,
        status,
        subtotal,
        total,
        tip_amount,
        service_fee,
        customer_email,
        customer_phone,
        notes,
        whatsapp_opt_in,
        scheduled_collection_at,
        scheduled_collection_timezone,
        payment_status
    )
    VALUES (
        p_order_number,
        p_user_id,
        p_store_id,
        'pending',
        ROUND(p_subtotal, 2),
        v_expected_total,
        v_tip_amount,
        v_service_fee,
        p_customer_email,
        NULLIF(btrim(COALESCE(p_customer_phone, '')), ''),
        NULLIF(btrim(COALESCE(p_notes, '')), ''),
        COALESCE(p_whatsapp_opt_in, false),
        p_scheduled_collection_at,
        COALESCE(p_scheduled_collection_timezone, 'Europe/London'),
        'pending'
    )
    RETURNING created_order.id INTO v_order_id;

    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price,
            total,
            product_snapshot,
            line_note
        )
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::NUMERIC,
            (v_item->>'total')::NUMERIC,
            COALESCE(v_item->'product_snapshot', '{}'::jsonb),
            NULLIF(btrim(COALESCE(v_item->>'line_note', '')), '')
        )
        RETURNING id INTO v_order_item_id;

        v_inserted_item_count := v_inserted_item_count + 1;

        IF jsonb_typeof(COALESCE(v_item->'modifier_selections', '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
            RAISE EXCEPTION 'ORDER_ITEM_MODIFIER_SELECTIONS_MUST_BE_ARRAY';
        END IF;

        FOR v_selection IN
            SELECT value
            FROM jsonb_array_elements(COALESCE(v_item->'modifier_selections', '[]'::jsonb))
        LOOP
            INSERT INTO public.order_item_modifier_selections (
                order_item_id,
                product_modifier_group_id,
                product_modifier_option_id,
                group_name,
                option_name,
                price_delta,
                sort_order
            )
            VALUES (
                v_order_item_id,
                NULLIF(v_selection->>'product_modifier_group_id', '')::UUID,
                NULLIF(v_selection->>'product_modifier_option_id', '')::UUID,
                btrim(COALESCE(v_selection->>'group_name', 'Option')),
                btrim(COALESCE(v_selection->>'option_name', 'Selected option')),
                ROUND(GREATEST(COALESCE((v_selection->>'price_delta')::NUMERIC, 0), 0), 2),
                COALESCE((v_selection->>'sort_order')::INTEGER, 1)
            );
        END LOOP;
    END LOOP;

    IF v_inserted_item_count <> v_expected_item_count THEN
        RAISE EXCEPTION 'ORDER_ITEM_INSERT_COUNT_MISMATCH';
    END IF;

    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.subtotal,
        o.total,
        o.tip_amount,
        o.service_fee,
        o.store_id,
        o.status,
        o.scheduled_collection_at,
        o.scheduled_collection_timezone
    FROM public.orders o
    WHERE o.id = v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items_v1(
    TEXT,
    UUID,
    UUID,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB,
    TIMESTAMPTZ,
    TEXT
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.create_order_with_items_v1(
    TEXT,
    UUID,
    UUID,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB,
    TIMESTAMPTZ,
    TEXT
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_order_with_items_v1(
    TEXT,
    UUID,
    UUID,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    NUMERIC,
    TEXT,
    TEXT,
    TEXT,
    BOOLEAN,
    JSONB,
    TIMESTAMPTZ,
    TEXT
) TO service_role;
