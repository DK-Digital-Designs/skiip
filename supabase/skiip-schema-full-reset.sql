-- ==========================================
-- SKIIP DATABASE FULL RESET SCRIPT
-- WARNING: THIS WILL DROP ALL YOUR DATA!
-- ==========================================

-- 1. DROP EXISTING SCHEMA
-- We drop tables in reverse order of their foreign keys to prevent dependency errors.
DROP TABLE IF EXISTS public.order_items CASCADE;

DROP TABLE IF EXISTS public.orders CASCADE;

DROP TABLE IF EXISTS public.cart_items CASCADE;

DROP TABLE IF EXISTS public.carts CASCADE;

DROP TABLE IF EXISTS public.products CASCADE;

DROP TABLE IF EXISTS public.stores CASCADE;

DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- WARNING: The auth.users table is managed by Supabase. We shouldn't drop the table entirely,
-- but we CAN delete the users we created so it's a clean slate.
-- We use CASCADE to ensure any lingering dependencies are cleared.
DELETE FROM auth.users
WHERE
    email IN (
        'admin@example.com',
        'vendor@example.com',
        'buyer@example.com',
        'guest@example.com'
    );

-- Re-enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. RECREATE TABLES & POLICIES
-- ==========================================

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

CREATE INDEX idx_products_store_id ON public.products (store_id);

CREATE INDEX idx_products_status ON public.products (status);

CREATE INDEX idx_products_category ON public.products (category);

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
    user_id UUID REFERENCES auth.users (id),
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '7 days')
);

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

CREATE INDEX idx_cart_items_cart_id ON public.cart_items (cart_id);

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

CREATE INDEX idx_orders_user_id ON public.orders (user_id);

CREATE INDEX idx_orders_store_id ON public.orders (store_id);

CREATE INDEX idx_orders_status ON public.orders (status);

CREATE INDEX idx_orders_created_at ON public.orders (created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders FOR
SELECT USING (
        auth.uid () = user_id
        OR user_id IS NULL
    );

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
    product_snapshot JSONB,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  v_order_number := 'ORD-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  INSERT INTO public.orders (
    order_number, store_id, total, subtotal, customer_email, customer_phone, notes, user_id
  ) VALUES (
    v_order_number, p_store_id, p_total, p_total, p_customer_email, p_customer_phone, p_notes, p_user_id
  ) RETURNING id INTO v_order_id;

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

-- ==========================================
-- 3. SEED DUMMY DATA
-- ==========================================

-- A. AUTH.USERS
-- Using strict requirements for Supabase GoTrue Auth to recognize the users
INSERT INTO
    auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
VALUES (
        '00000000-0000-0000-0000-000000000000',
        '11111111-1111-1111-1111-111111111111',
        'authenticated',
        'authenticated',
        'admin@example.com',
        crypt (
            'password123',
            gen_salt ('bf')
        ),
        now(),
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}',
        '{"full_name": "Admin User"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        '22222222-2222-2222-2222-222222222222',
        'authenticated',
        'authenticated',
        'vendor@example.com',
        crypt (
            'password123',
            gen_salt ('bf')
        ),
        now(),
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}',
        '{"full_name": "Burger Bliss Vendor"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        '33333333-3333-3333-3333-333333333333',
        'authenticated',
        'authenticated',
        'buyer@example.com',
        crypt (
            'password123',
            gen_salt ('bf')
        ),
        now(),
        NULL,
        NULL,
        '{"provider":"email","providers":["email"]}',
        '{"full_name": "John Buyer"}',
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

-- B. USER_PROFILES
INSERT INTO
    public.user_profiles (id, email, full_name, role)
VALUES (
        '11111111-1111-1111-1111-111111111111',
        'admin@example.com',
        'Admin User',
        'admin'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'vendor@example.com',
        'Burger Bliss Vendor',
        'seller'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'buyer@example.com',
        'John Buyer',
        'buyer'
    );

-- C. STORES
INSERT INTO
    public.stores (
        id,
        user_id,
        name,
        slug,
        description,
        status,
        pickup_location
    )
VALUES (
        '10000000-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222',
        'Burger Bliss',
        'burger-bliss',
        'The absolute best burgers and fries in the stadium.',
        'active',
        'Food Court A, Stall 3'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '22222222-2222-2222-2222-222222222222',
        'Pizza Paradise',
        'pizza-paradise',
        'Wood-fired artisan pizzas made fresh.',
        'active',
        'Food Court B, Stall 1'
    );

-- D. PRODUCTS
INSERT INTO
    public.products (
        id,
        store_id,
        name,
        slug,
        description,
        price,
        inventory_quantity,
        category,
        status,
        tags
    )
VALUES
    -- Burger Bliss Products
    (
        '20000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001',
        'Classic Burger',
        'classic-burger',
        'Beef patty, lettuce, tomato, cheese.',
        85.00,
        100,
        'Burgers',
        'active',
        ARRAY['beef', 'cheese']
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000001',
        'Loaded Fries',
        'loaded-fries',
        'Fries covered with cheese and bacon.',
        55.00,
        200,
        'Sides',
        'active',
        ARRAY['fries', 'bacon']
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000001',
        'Ice Cold Cola',
        'cola',
        'Refreshing soda.',
        25.00,
        500,
        'Drinks',
        'active',
        ARRAY['soda', 'cold']
    ),

-- Pizza Paradise Products
(
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Margherita Pizza',
    'margherita',
    'Tomato, mozzarella, fresh basil.',
    110.00,
    50,
    'Pizza',
    'active',
    ARRAY['vegetarian', 'classic']
),
(
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Pepperoni Pizza',
    'pepperoni',
    'Loaded with crispy pepperoni.',
    125.00,
    50,
    'Pizza',
    'active',
    ARRAY['meat', 'spicy']
);

-- E. ORDERS (Create some demo orders for VendorDashboard)
INSERT INTO
    public.orders (
        id,
        order_number,
        store_id,
        user_id,
        status,
        subtotal,
        total,
        customer_email,
        payment_status,
        created_at
    )
VALUES (
        '40000000-0000-0000-0000-000000000001',
        'ORD-DEMO-001',
        '10000000-0000-0000-0000-000000000001',
        '33333333-3333-3333-3333-333333333333',
        'pending',
        140.00,
        140.00,
        'buyer@example.com',
        'succeeded',
        NOW() - INTERVAL '10 minutes'
    ),
    (
        '40000000-0000-0000-0000-000000000002',
        'ORD-DEMO-002',
        '10000000-0000-0000-0000-000000000001',
        NULL,
        'preparing',
        85.00,
        85.00,
        'guestwalkup@example.com',
        'succeeded',
        NOW() - INTERVAL '5 minutes'
    ),
    (
        '40000000-0000-0000-0000-000000000003',
        'ORD-DEMO-003',
        '10000000-0000-0000-0000-000000000002',
        NULL,
        'ready',
        110.00,
        110.00,
        'pizzafan@example.com',
        'succeeded',
        NOW() - INTERVAL '2 minutes'
    );

-- F. ORDER ITEMS
INSERT INTO
    public.order_items (
        order_id,
        product_id,
        quantity,
        price,
        total,
        product_snapshot
    )
VALUES
    -- Order 1: Burger and Fries
    (
        '40000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001',
        1,
        85.00,
        85.00,
        '{"name": "Classic Burger"}'
    ),
    (
        '40000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000002',
        1,
        55.00,
        55.00,
        '{"name": "Loaded Fries"}'
    ),

-- Order 2: Just a Burger
(
    '40000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    1,
    85.00,
    85.00,
    '{"name": "Classic Burger"}'
),

-- Order 3: Just Pizza
(
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000001',
    1,
    110.00,
    110.00,
    '{"name": "Margherita Pizza"}'
);