-- ============================================================
-- Migration: WhatsApp transactional notifications
-- Adds opt-in field, logging table, and status-change trigger
-- ============================================================

-- Extension required for asynchronous HTTP from Postgres triggers.
CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    message_sid TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_logs_message_sid
    ON public.notification_logs(message_sid)
    WHERE message_sid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_logs_order_id_created_at
    ON public.notification_logs(order_id, created_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can view notification logs for store orders" ON public.notification_logs;
CREATE POLICY "Sellers can view notification logs for store orders"
ON public.notification_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.stores s ON s.id = o.store_id
        WHERE o.id = notification_logs.order_id
          AND s.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can view notification logs" ON public.notification_logs;
CREATE POLICY "Admins can view notification logs"
ON public.notification_logs
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage notification logs" ON public.notification_logs;
CREATE POLICY "Service role can manage notification logs"
ON public.notification_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.create_order_v1(
    p_store_id UUID,
    p_items JSONB,
    p_total NUMERIC,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_notes TEXT,
    p_user_id UUID DEFAULT NULL,
    p_whatsapp_opt_in BOOLEAN DEFAULT false
) RETURNS public.orders AS $$
DECLARE
    v_order public.orders;
    v_item JSONB;
    v_order_number TEXT;
BEGIN
    v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

    INSERT INTO public.orders (
        store_id,
        user_id,
        order_number,
        status,
        total,
        subtotal,
        customer_email,
        customer_phone,
        notes,
        whatsapp_opt_in
    ) VALUES (
        p_store_id,
        p_user_id,
        v_order_number,
        'pending',
        p_total,
        p_total,
        p_customer_email,
        p_customer_phone,
        p_notes,
        p_whatsapp_opt_in
    ) RETURNING * INTO v_order;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            quantity,
            price,
            total,
            product_snapshot
        ) VALUES (
            v_order.id,
            (v_item->>'id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'price')::NUMERIC,
            ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER),
            jsonb_build_object('name', v_item->>'name', 'price', v_item->>'price')
        );
    END LOOP;

    RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.notify_whatsapp_on_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_body JSONB;
BEGIN
    IF NEW.whatsapp_opt_in IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status NOT IN ('paid', 'preparing', 'ready', 'cancelled') THEN
        RETURN NEW;
    END IF;

    request_body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(NEW),
        'old_record', to_jsonb(OLD)
    );

    PERFORM net.http_post(
        url := concat(current_setting('app.settings.supabase_url'), '/functions/v1/whatsapp-notify'),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', concat('Bearer ', current_setting('app.settings.service_role_key'))
        ),
        body := request_body
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_whatsapp_notify_trigger ON public.orders;
CREATE TRIGGER orders_whatsapp_notify_trigger
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_whatsapp_on_order_status_change();

DROP TRIGGER IF EXISTS update_notification_logs_modtime ON public.notification_logs;
CREATE TRIGGER update_notification_logs_modtime
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();
