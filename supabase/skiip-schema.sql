-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (Managed by Supabase Auth, but we use a public profiles table for extra data)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users (id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (
        role IN ('buyer', 'seller', 'admin')
    ) DEFAULT 'buyer',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles FOR
SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT
WITH
    CHECK (auth.uid () = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE
    USING (auth.uid () = id);

-- STORES
CREATE TABLE public.stores (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    user_id UUID REFERENCES auth.users (id) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    pickup_location TEXT,
    status TEXT CHECK (
        status IN (
            'pending',
            'active',
            'suspended'
        )
    ) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS for stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active stores are viewable by everyone" ON public.stores FOR
SELECT USING (
        status = 'active'
        AND deleted_at IS NULL
    );

CREATE POLICY "Sellers can view own store" ON public.stores FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Sellers can update own store" ON public.stores
FOR UPDATE
    USING (auth.uid () = user_id);

CREATE POLICY "Sellers can insert own store" ON public.stores FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- PRODUCTS
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    store_id UUID REFERENCES public.stores (id) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(10, 2),
    inventory_quantity INTEGER NOT NULL DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    tags TEXT [],
    status TEXT CHECK (
        status IN ('draft', 'active', 'archived')
    ) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for products
CREATE INDEX idx_products_store_id ON public.products (store_id);

CREATE INDEX idx_products_status ON public.products (status);

CREATE INDEX idx_products_category ON public.products (category);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone" ON public.products FOR
SELECT USING (
        status = 'active'
        AND deleted_at IS NULL
    );

CREATE POLICY "Sellers can view own products" ON public.products FOR
SELECT USING (
        store_id IN (
            SELECT id
            FROM public.stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Sellers can insert own products" ON public.products FOR INSERT
WITH
    CHECK (
        store_id IN (
            SELECT id
            FROM public.stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Sellers can update own products" ON public.products
FOR UPDATE
    USING (
        store_id IN (
            SELECT id
            FROM public.stores
            WHERE
                user_id = auth.uid ()
        )
    );

-- CARTS
CREATE TABLE public.carts (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    user_id UUID REFERENCES auth.users (id), -- Nullable for guest carts
    session_id TEXT, -- For guest sessions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '7 days')
);

-- Enable RLS for carts
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart" ON public.carts FOR
SELECT USING (
        (auth.uid () = user_id)
        OR (session_id IS NOT NULL)
    );

CREATE POLICY "Users can create cart" ON public.carts FOR INSERT
WITH
    CHECK (true);

CREATE POLICY "Users can update own cart" ON public.carts
FOR UPDATE
    USING (
        (auth.uid () = user_id)
        OR (session_id IS NOT NULL)
    );

-- CART ITEMS
CREATE TABLE public.cart_items (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    cart_id UUID REFERENCES public.carts (id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products (id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cart items
CREATE INDEX idx_cart_items_cart_id ON public.cart_items (cart_id);

-- Enable RLS for cart items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart items" ON public.cart_items FOR
SELECT USING (
        cart_id IN (
            SELECT id
            FROM public.carts
            WHERE
                user_id = auth.uid ()
                OR session_id IS NOT NULL
        )
    );

CREATE POLICY "Users can insert cart items" ON public.cart_items FOR INSERT
WITH
    CHECK (
        cart_id IN (
            SELECT id
            FROM public.carts
            WHERE
                user_id = auth.uid ()
                OR session_id IS NOT NULL
        )
    );

CREATE POLICY "Users can update own cart items" ON public.cart_items
FOR UPDATE
    USING (
        cart_id IN (
            SELECT id
            FROM public.carts
            WHERE
                user_id = auth.uid ()
                OR session_id IS NOT NULL
        )
    );

CREATE POLICY "Users can delete own cart items" ON public.cart_items FOR DELETE USING (
    cart_id IN (
        SELECT id
        FROM public.carts
        WHERE
            user_id = auth.uid ()
            OR session_id IS NOT NULL
    )
);

-- ORDERS
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users (id),
    store_id UUID REFERENCES public.stores (id) NOT NULL,
    status TEXT CHECK (
        status IN (
            'pending',
            'paid',
            'preparing',
            'ready',
            'collected',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'refunded'
        )
    ) DEFAULT 'pending',
    subtotal NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) DEFAULT 0,
    shipping NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    payment_intent_id TEXT,
    payment_status TEXT CHECK (
        payment_status IN (
            'pending',
            'succeeded',
            'failed',
            'refunded'
        )
    ) DEFAULT 'pending',
    shipping_address JSONB,
    billing_address JSONB,
    customer_email TEXT,
    customer_phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX idx_orders_user_id ON public.orders (user_id);

CREATE INDEX idx_orders_store_id ON public.orders (store_id);

CREATE INDEX idx_orders_status ON public.orders (status);

CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders FOR
SELECT USING (
        auth.uid () = user_id
        OR user_id IS NULL
    );
-- Allow guest checkout viewing for now

CREATE POLICY "Sellers can view store orders" ON public.orders FOR
SELECT USING (
        store_id IN (
            SELECT id
            FROM public.stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Sellers can update store orders" ON public.orders
FOR UPDATE
    USING (
        store_id IN (
            SELECT id
            FROM public.stores
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can create orders" ON public.orders FOR INSERT
WITH
    CHECK (
        auth.uid () = user_id
        OR user_id IS NULL
    );

-- ORDER ITEMS
CREATE TABLE public.order_items (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    order_id UUID REFERENCES public.orders (id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products (id),
    product_snapshot JSONB, -- Stores name, price, image at time of purchase
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.order_items FOR
SELECT USING (
        order_id IN (
            SELECT id
            FROM public.orders
            WHERE
                user_id = auth.uid ()
                OR user_id IS NULL
        )
    );

CREATE POLICY "Sellers can view store order items" ON public.order_items FOR
SELECT USING (
        order_id IN (
            SELECT id
            FROM public.orders
            WHERE
                store_id IN (
                    SELECT id
                    FROM public.stores
                    WHERE
                        user_id = auth.uid ()
                )
        )
    );

-- RPC for atomic order creation
CREATE OR REPLACE FUNCTION create_order_v1(
  p_store_id UUID,
  p_items JSONB,
  p_total NUMERIC,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_notes TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
BEGIN
  -- Generate simple order number
  v_order_number := 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));

  -- Insert Order
  INSERT INTO public.orders (
    order_number, store_id, total, subtotal, customer_email, customer_phone, notes, user_id
  ) VALUES (
    v_order_number, p_store_id, p_total, p_total, p_customer_email, p_customer_phone, p_notes, p_user_id
  ) RETURNING id INTO v_order_id;

  -- Insert Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, quantity, price, total, product_snapshot
    ) VALUES (
      v_order_id, 
      (v_item->>'id')::UUID, 
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'price')::NUMERIC, 
      ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER),
      jsonb_build_object('name', v_item->>'name', 'image', v_item->>'image')
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_modtime BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_stores_modtime BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_carts_modtime BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();