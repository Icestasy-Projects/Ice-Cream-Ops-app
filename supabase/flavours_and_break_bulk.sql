-- Run in Supabase SQL Editor

-- 1. Grants for admin to manage prep_products and prep_recipes
GRANT ALL ON production.prep_products TO authenticated;
GRANT ALL ON production.prep_recipes TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA production TO authenticated;

-- 2. Grants for break bulk to read/create sales.skus and sales.pack_formats
GRANT ALL ON sales.skus TO authenticated;
GRANT SELECT ON sales.flavours TO authenticated;
GRANT SELECT ON sales.pack_formats TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sales TO authenticated;

-- 3. Ensure 12-squares and sample pack formats exist
INSERT INTO sales.pack_formats (name, unit_volume_ml, units_per_pack, is_sample, status)
SELECT '12 Squares', 150, 12, false, 'active'
WHERE NOT EXISTS (SELECT 1 FROM sales.pack_formats WHERE unit_volume_ml = 150 AND units_per_pack = 12);

INSERT INTO sales.pack_formats (name, unit_volume_ml, units_per_pack, is_sample, status)
SELECT 'Sample 50ml', 50, 1, true, 'active'
WHERE NOT EXISTS (SELECT 1 FROM sales.pack_formats WHERE is_sample = true AND unit_volume_ml = 50);
