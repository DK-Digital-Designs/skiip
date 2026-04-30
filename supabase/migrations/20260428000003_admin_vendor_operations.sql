-- ============================================================
-- Migration: Admin vendor/store operations boundary
-- Purpose:
-- - move launch vendor/store mutations behind audited admin RPCs
-- - avoid browser-side hard deletes for stores
-- - keep admin browser access read-oriented for profiles and stores
-- ============================================================

CREATE OR REPLACE FUNCTION public.audit_store_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    actor_user_id_value UUID;
    actor_role_value TEXT;
    configured_actor TEXT;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    configured_actor := current_setting('app.admin_actor_user_id', true);
    IF configured_actor IS NOT NULL AND configured_actor <> '' THEN
        actor_user_id_value := configured_actor::UUID;
    ELSE
        actor_user_id_value := auth.uid();
    END IF;

    SELECT role
    INTO actor_role_value
    FROM public.user_profiles
    WHERE id = actor_user_id_value;

    INSERT INTO public.audit_logs (
        event_type,
        entity_type,
        entity_id,
        actor_user_id,
        actor_role,
        payload
    )
    VALUES (
        'store_status_changed',
        'store',
        NEW.id,
        actor_user_id_value,
        actor_role_value,
        jsonb_build_object(
            'store_id', NEW.id,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'store_name', NEW.name
        )
    );

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_create_vendor_store_v1(
    p_actor_user_id UUID,
    p_user_id UUID,
    p_name TEXT,
    p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    owner_profile public.user_profiles%ROWTYPE;
    created_store public.stores%ROWTYPE;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = p_actor_user_id
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    IF NULLIF(trim(p_name), '') IS NULL THEN
        RAISE EXCEPTION 'STORE_NAME_REQUIRED' USING ERRCODE = '22023';
    END IF;

    IF p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
        RAISE EXCEPTION 'STORE_SLUG_INVALID' USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO owner_profile
    FROM public.user_profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_PROFILE_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    IF owner_profile.role = 'admin' THEN
        RAISE EXCEPTION 'ADMIN_USERS_CANNOT_BE_VENDOR_OWNERS' USING ERRCODE = '22023';
    END IF;

    UPDATE public.user_profiles
    SET role = 'seller',
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO public.stores (
        user_id,
        name,
        slug,
        status
    )
    VALUES (
        p_user_id,
        trim(p_name),
        p_slug,
        'active'
    )
    RETURNING *
    INTO created_store;

    INSERT INTO public.audit_logs (
        event_type,
        entity_type,
        entity_id,
        actor_user_id,
        actor_role,
        payload
    )
    VALUES (
        'admin_vendor_store_created',
        'store',
        created_store.id,
        p_actor_user_id,
        'admin',
        jsonb_build_object(
            'store_id', created_store.id,
            'store_name', created_store.name,
            'store_slug', created_store.slug,
            'owner_user_id', p_user_id,
            'previous_owner_role', owner_profile.role
        )
    );

    RETURN jsonb_build_object(
        'id', created_store.id,
        'user_id', created_store.user_id,
        'name', created_store.name,
        'slug', created_store.slug,
        'status', created_store.status,
        'created_at', created_store.created_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_store_status_v1(
    p_actor_user_id UUID,
    p_store_id UUID,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_store public.stores%ROWTYPE;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = p_actor_user_id
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    IF p_status NOT IN ('pending', 'active', 'suspended') THEN
        RAISE EXCEPTION 'STORE_STATUS_INVALID' USING ERRCODE = '22023';
    END IF;

    PERFORM set_config('app.admin_actor_user_id', p_actor_user_id::TEXT, true);

    UPDATE public.stores
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_store_id
      AND deleted_at IS NULL
    RETURNING *
    INTO updated_store;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STORE_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    RETURN jsonb_build_object(
        'id', updated_store.id,
        'user_id', updated_store.user_id,
        'name', updated_store.name,
        'slug', updated_store.slug,
        'status', updated_store.status,
        'updated_at', updated_store.updated_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_archive_store_v1(
    p_actor_user_id UUID,
    p_store_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    archived_store public.stores%ROWTYPE;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = p_actor_user_id
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;

    PERFORM set_config('app.admin_actor_user_id', p_actor_user_id::TEXT, true);

    UPDATE public.stores
    SET status = 'suspended',
        deleted_at = COALESCE(deleted_at, NOW()),
        updated_at = NOW()
    WHERE id = p_store_id
      AND deleted_at IS NULL
    RETURNING *
    INTO archived_store;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STORE_NOT_FOUND' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.audit_logs (
        event_type,
        entity_type,
        entity_id,
        actor_user_id,
        actor_role,
        payload
    )
    VALUES (
        'admin_vendor_store_archived',
        'store',
        archived_store.id,
        p_actor_user_id,
        'admin',
        jsonb_build_object(
            'store_id', archived_store.id,
            'store_name', archived_store.name,
            'store_slug', archived_store.slug,
            'owner_user_id', archived_store.user_id,
            'archived_at', archived_store.deleted_at
        )
    );

    RETURN jsonb_build_object(
        'id', archived_store.id,
        'user_id', archived_store.user_id,
        'name', archived_store.name,
        'slug', archived_store.slug,
        'status', archived_store.status,
        'deleted_at', archived_store.deleted_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_vendor_store_v1(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_store_status_v1(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_archive_store_v1(UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_create_vendor_store_v1(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_store_status_v1(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_archive_store_v1(UUID, UUID) TO service_role;

DROP POLICY IF EXISTS "Admins can view and edit all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view profiles" ON public.user_profiles;
CREATE POLICY "Admins can view profiles"
ON public.user_profiles
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view and edit all stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can view stores" ON public.stores;
CREATE POLICY "Admins can view stores"
ON public.stores
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Sellers can view own store" ON public.stores;
CREATE POLICY "Sellers can view own store"
ON public.stores
FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by everyone"
ON public.products
FOR SELECT
USING (
    status = 'active'
    AND deleted_at IS NULL
    AND EXISTS (
        SELECT 1
        FROM public.stores s
        WHERE s.id = store_id
          AND s.status = 'active'
          AND s.deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can view own products" ON public.products;
CREATE POLICY "Sellers can view own products"
ON public.products
FOR SELECT
USING (
    store_id IN (
        SELECT id
        FROM public.stores
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
CREATE POLICY "Sellers can insert own products"
ON public.products
FOR INSERT
WITH CHECK (
    store_id IN (
        SELECT id
        FROM public.stores
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
    )
);

DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
CREATE POLICY "Sellers can update own products"
ON public.products
FOR UPDATE
USING (
    store_id IN (
        SELECT id
        FROM public.stores
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
    )
)
WITH CHECK (
    store_id IN (
        SELECT id
        FROM public.stores
        WHERE user_id = auth.uid()
          AND deleted_at IS NULL
    )
);
