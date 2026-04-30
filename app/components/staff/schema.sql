-- BEGINNER NOTES
-- File: app/components/staff/schema.sql
-- Purpose: Reusable UI component used by pages.
-- Data sources: Search for `supabase.from(...)` (database), `fetch(...)` (HTTP), or props passed from a `page.jsx`.
-- Why this exists: Keeps related logic/UI in one place so the app stays maintainable.

-- ============================================================
-- EMPLOYEE PORTAL - SUPABASE SCHEMA
-- Run these in the Supabase SQL Editor (in order)
-- ============================================================

-- 1. Products table (if not already exists)
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  sku         TEXT UNIQUE,
  category    TEXT,
  price       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  quantity    INTEGER NOT NULL DEFAULT 0,
  unit        TEXT DEFAULT 'pcs',         -- e.g. pcs, kg, litre
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stock Logs table – tracks every stock addition
CREATE TABLE IF NOT EXISTS stock_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity_added  INTEGER NOT NULL,
  note            TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bills table
CREATE TABLE IF NOT EXISTS bills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name     TEXT DEFAULT 'Walk-in',
  customer_phone    TEXT,
  subtotal          NUMERIC(10, 2) NOT NULL,
  discount_percent  NUMERIC(5, 2) DEFAULT 0,
  discount_amount   NUMERIC(10, 2) DEFAULT 0,
  gst_amount        NUMERIC(10, 2) DEFAULT 0,
  total_amount      NUMERIC(10, 2) NOT NULL,
  payment_method    TEXT DEFAULT 'cash',   -- cash | upi | card | credit
  status            TEXT DEFAULT 'paid',   -- paid | pending | cancelled
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bill Items table
CREATE TABLE IF NOT EXISTS bill_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id       UUID REFERENCES bills(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,             -- snapshot at time of sale
  quantity      INTEGER NOT NULL,
  unit_price    NUMERIC(10, 2) NOT NULL,
  total_price   NUMERIC(10, 2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Increment stock (used by stock update page)
CREATE OR REPLACE FUNCTION increment_stock(product_id UUID, add_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET quantity   = quantity + add_qty,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement stock (used by billing page)
CREATE OR REPLACE FUNCTION decrement_stock(product_id UUID, remove_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET quantity   = GREATEST(quantity - remove_qty, 0),
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (optional, enable if using auth)
-- ============================================================

-- Enable RLS
ALTER TABLE products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (employees) full access
CREATE POLICY "Employees can read products"    ON products   FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employees can update products"  ON products   FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Employees can insert stock log" ON stock_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Employees can read stock logs"  ON stock_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employees can insert bills"     ON bills      FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Employees can read bills"       ON bills      FOR SELECT TO authenticated USING (true);
CREATE POLICY "Employees can insert bill items" ON bill_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Employees can read bill items"  ON bill_items FOR SELECT TO authenticated USING (true);

-- ============================================================
-- SEED SAMPLE PRODUCTS (optional, for testing)
-- ============================================================

INSERT INTO products (name, sku, category, price, quantity, unit) VALUES
  ('Basmati Rice 1kg',    'RICE-001', 'Grains',    85.00,  150, 'kg'),
  ('Sunflower Oil 1L',    'OIL-001',  'Oils',      135.00,  80, 'litre'),
  ('Toor Dal 500g',       'DAL-001',  'Pulses',    65.00,   60, 'pcs'),
  ('Amul Butter 100g',    'BUTR-001', 'Dairy',     55.00,   40, 'pcs'),
  ('Sugar 1kg',           'SUG-001',  'Grains',    42.00,  200, 'kg'),
  ('Whole Wheat Flour',   'ATTA-001', 'Grains',    48.00,  120, 'kg'),
  ('Turmeric Powder 100g','SPICE-001','Spices',    28.00,   90, 'pcs'),
  ('Red Chilli Powder',   'SPICE-002','Spices',    35.00,   70, 'pcs')
ON CONFLICT DO NOTHING;
