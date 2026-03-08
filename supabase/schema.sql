-- Skiip MVP Database Schema
-- Run this in your Supabase SQL Editor

-- Create tables
CREATE TABLE events (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    name text NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE vendors (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    event_id uuid REFERENCES events (id),
    name text NOT NULL,
    description text,
    email text UNIQUE,
    logo_url text,
    pickup_location text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE menu_items (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    vendor_id uuid REFERENCES vendors (id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price decimal(10, 2) NOT NULL,
    category text,
    image_url text,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE orders (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    vendor_id uuid REFERENCES vendors (id),
    customer_phone text NOT NULL,
    items jsonb NOT NULL,
    total_amount decimal(10, 2) NOT NULL,
    status text DEFAULT 'pending_payment',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_orders_vendor_id ON orders (vendor_id);

CREATE INDEX idx_orders_status ON orders (status);

CREATE INDEX idx_orders_created_at ON orders (created_at DESC);

CREATE INDEX idx_menu_items_vendor_id ON menu_items (vendor_id);

CREATE INDEX idx_vendors_event_id ON vendors (event_id);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public read for active data, authenticated write)
CREATE POLICY "Public can view active events" ON events FOR
SELECT USING (is_active = true);

CREATE POLICY "Public can view active vendors" ON vendors FOR
SELECT USING (is_active = true);

CREATE POLICY "Public can view available menu items" ON menu_items FOR
SELECT USING (is_available = true);

CREATE POLICY "Public can create orders" ON orders FOR INSERT
WITH
    CHECK (true);

CREATE POLICY "Public can view their orders" ON orders FOR
SELECT USING (true);

CREATE POLICY "Authenticated users can update orders" ON orders
FOR UPDATE
    USING (
        auth.role () = 'authenticated'
    );

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Insert sample data for testing
INSERT INTO
    events (
        name,
        start_date,
        end_date,
        is_active
    )
VALUES (
        'Summer Music Fest 2026',
        '2026-02-15',
        '2026-02-16',
        true
    );

-- Get the event ID for sample vendors
DO $$
DECLARE
  event_uuid uuid;
BEGIN
  SELECT id INTO event_uuid FROM events WHERE name = 'Summer Music Fest 2026' LIMIT 1;
  
  INSERT INTO vendors (event_id, name, description, email, pickup_location, is_active) VALUES
    (event_uuid, 'Burger Bliss', 'Gourmet burgers and loaded fries', 'burgerbliss@example.com', 'Food Court A, Stall 3', true),
    (event_uuid, 'Pizza Paradise', 'Wood-fired artisan pizzas', 'pizzaparadise@example.com', 'Food Court B, Stall 1', true),
    (event_uuid, 'Drinks & Co', 'Craft cocktails and refreshments', 'drinks@example.com', 'Bar Area 2', true);
END $$;

-- Sample menu items
INSERT INTO
    menu_items (
        vendor_id,
        name,
        description,
        price,
        category,
        is_available
    )
SELECT v.id, item.name, item.description, item.price, item.category, true
FROM vendors v
    CROSS JOIN (
        VALUES (
                'Classic Burger', 'Beef patty, lettuce, tomato, cheese', 85.00, 'Burgers'
            ), (
                'BBQ Bacon Burger', 'Beef patty, bacon, BBQ sauce, onion rings', 95.00, 'Burgers'
            ), (
                'Loaded Fries', 'Fries with cheese, bacon, sour cream', 55.00, 'Sides'
            ), (
                'Cola', 'Ice-cold soft drink', 25.00, 'Drinks'
            )
    ) AS item (
        name, description, price, category
    )
WHERE
    v.name = 'Burger Bliss';

INSERT INTO
    menu_items (
        vendor_id,
        name,
        description,
        price,
        category,
        is_available
    )
SELECT v.id, item.name, item.description, item.price, item.category, true
FROM vendors v
    CROSS JOIN (
        VALUES (
                'Margherita Pizza', 'Tomato, mozzarella, basil', 110.00, 'Pizza'
            ), (
                'Pepperoni Pizza', 'Pepperoni, cheese, tomato sauce', 125.00, 'Pizza'
            ), (
                'Veggie Supreme', 'Mixed vegetables, cheese, olives', 120.00, 'Pizza'
            )
    ) AS item (
        name, description, price, category
    )
WHERE
    v.name = 'Pizza Paradise';