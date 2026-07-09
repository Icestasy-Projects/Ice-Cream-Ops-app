-- Run in Supabase SQL Editor

-- 1. Recipe table: RM items + qty per batch for each prep_product (flavour)
CREATE TABLE IF NOT EXISTS production.prep_product_recipes (
  id                SERIAL PRIMARY KEY,
  prep_product_id   INTEGER NOT NULL REFERENCES production.prep_products(id) ON DELETE CASCADE,
  rm_item_id        INTEGER NOT NULL REFERENCES production.rm_items(id),
  qty_per_batch     NUMERIC NOT NULL CHECK (qty_per_batch > 0),
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(prep_product_id, rm_item_id)
);
ALTER TABLE production.prep_product_recipes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON production.prep_product_recipes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE production.prep_product_recipes_id_seq TO authenticated;

-- 2. Allow admin to create new prep_products (flavours)
GRANT ALL ON production.prep_products TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE production.prep_products_id_seq TO authenticated;

-- 3. Allow break bulk to create new fg_skus and fg_unit entries
GRANT ALL ON production.fg_skus TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA production TO authenticated;
