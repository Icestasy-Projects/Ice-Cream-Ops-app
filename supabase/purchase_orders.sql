-- Run this in the Supabase SQL Editor (production schema)
-- Safe to re-run: uses IF NOT EXISTS / IF EXISTS guards

CREATE TABLE IF NOT EXISTS production.rm_purchase_orders (
  id            SERIAL PRIMARY KEY,
  vendor_id     INTEGER REFERENCES production.vendors(id),
  ordered_by    UUID   REFERENCES auth.users(id),
  ordered_at    TIMESTAMPTZ DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending | partially_received | received | cancelled
  note          TEXT
);

CREATE TABLE IF NOT EXISTS production.rm_purchase_order_lines (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES production.rm_purchase_orders(id) ON DELETE CASCADE,
  rm_item_id    INTEGER NOT NULL REFERENCES production.rm_items(id),
  qty_ordered   NUMERIC NOT NULL CHECK (qty_ordered > 0),
  qty_received  NUMERIC NOT NULL DEFAULT 0,
  unit_cost     NUMERIC,
  status        TEXT NOT NULL DEFAULT 'pending'  -- pending | partial | received
);

-- Disable RLS (also handles case where it was previously enabled)
ALTER TABLE production.rm_purchase_orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE production.rm_purchase_order_lines DISABLE ROW LEVEL SECURITY;

-- Drop any policies that may have been created before
DROP POLICY IF EXISTS "auth_read_orders"   ON production.rm_purchase_orders;
DROP POLICY IF EXISTS "auth_insert_orders" ON production.rm_purchase_orders;
DROP POLICY IF EXISTS "auth_update_orders" ON production.rm_purchase_orders;
DROP POLICY IF EXISTS "auth_read_lines"    ON production.rm_purchase_order_lines;
DROP POLICY IF EXISTS "auth_insert_lines"  ON production.rm_purchase_order_lines;
DROP POLICY IF EXISTS "auth_update_lines"  ON production.rm_purchase_order_lines;
