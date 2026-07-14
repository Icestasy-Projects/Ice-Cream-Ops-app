-- ================================================================
-- ICESTASY OPS — Correct Migration (mapped to existing DB flavours)
-- Run in Supabase SQL Editor
-- ================================================================

-- ── 1. RM categories ──────────────────────────────────────────────
INSERT INTO production.rm_categories (name) VALUES ('Base & Dairy') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Fruits & Pulp') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Nuts & Pastes') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Spices & Flavours') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Sweeteners') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Biscuits & Bakery') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Toppings & Garnish') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Sauces & Compotes') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Extracts & Essences') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Stabilizers & Additives') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Grains & Flour') ON CONFLICT (name) DO NOTHING;
INSERT INTO production.rm_categories (name) VALUES ('Other') ON CONFLICT (name) DO NOTHING;

-- ── 2. RM items (175 ingredients, skips existing by name) ─────────
DO $$
DECLARE cat_id INT;
BEGIN
  SELECT id INTO cat_id FROM production.rm_categories WHERE name = 'Other' LIMIT 1;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('4% Fat Milk', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Aam Panha Syrup', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Amul Butter', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Amul Cheese Cubes', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Amul Fresh Cream', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Amul Khoa', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Anjeer Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Any Oil', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Apple Halwa', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Apricot Sauce', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Ash Gourd Prep', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Banarasi Betal Leaf', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Black Dates', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Black Pepper', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Black Sesame', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Blanched Almond Butter', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Blueberry Compote', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Blueberry Essence', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Blueberry Pulp', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Brown Sugar', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cacao Miscela', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Callebaut', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Candied Orange Peel', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Canned Mango Pulp', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Caramel Sauce', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Caramelized Ginger', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cardamom Powder (Elaichi)', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cashew Butter', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cashew Chikki', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cashew Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Chaat Masala', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Charoli', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Chironji Seeds (Charoli)', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Chocolate Chip Cookies', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cinnamon Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cinnamon Rolls', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Clove Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Coconut Butter', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Coconut Crunch Biscuits', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Coconut Milk Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Coffee Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Corn Flour', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Cumin Seeds Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Curry Leaf', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Dark Chocolate Compound', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Dark Chocolate Slab', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Dark Fantasy Chocolate biscuits', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Date Syrup', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Digestive Biscuits', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Dried Apricot', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Dried Rose Petals', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Edible Camphor', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fennel Seeds', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Freeze Dried Banana', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Apple', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Ash Gourd', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Banana', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Chikoo', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Cream', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Deccan Sitaphal', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Durian', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Garlic', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Ginger', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Golden Sitaphal', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Guava', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Hass Avocado', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Jackfruit', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Jambhul', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Kokum', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Lemon', 'unit', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Pineapple', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Pumpkin', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Puran', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Ramphal', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Raspberry', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Fresh Tender Coconut', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Frozen Strawberries', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Gajar Halwa', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Galangal Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Ghee', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Ginger Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Gingerbread Cookies', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Gowardhan Ghee', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Gram Flour (Besan)', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Green Chilli', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Ground Ginger (Suntha)', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Gulab Jamun', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Gulkand', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Hazelnut Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('High Fat Milk', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Honey', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('JB 800 Cocoa Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Jaggery', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Jindal 301 Cocoa Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Kaffir Lime Leaves', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Kairi Squash', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Kasundi Sauce', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Kharik', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Khus Khus', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Lemongrass', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Liquid Glucose', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Loose Almonds', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Loose Hazelnut', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Loose Pista', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Loose Raisins', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Lotus Biscoff Biscuits', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Maida', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Mango Essence', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Maple Syrup', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Matcha Tea Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Milk Chocolate Slab', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Milkmaid', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Mint Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Miso Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Molasses', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Mysore Paak', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Nutmeg Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Oats Chikki', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Off Season Sitaphal Pulp', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Omkar Kokum Syrup', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Orange Paste Pre Gel', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Pandan Leaves', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Parle G Biscuit', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Parle Gold', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Pecans', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Pineapple Halwa', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Pistachio Butter', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Pistachio Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Popcorn Kernels', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Puranpoli', 'unit', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Purple Yam', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Red Chilli Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Red Chillies', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Red Dates', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Refined Wheat Flour', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Roasted Almond Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Rolled Oats', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Rose Water', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Saffron Spice', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Samrat Gram Flour (Besan)', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Sevaiya', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Shredded Coconut', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Stabilizer', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Strawberry Essence', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Sweet Boondi', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Sweet Soy Sauce', 'l', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Tamarind', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Tamarind Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Taste for Life Besan', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Tea Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Thai Basil', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Tukda Kaju', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Tutti Frutti', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Urad Dal', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Essence', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Extract 301P', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Flavour (CEC)', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Flavour (P)', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Oleoresin', 'ml', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Oreo Cookies', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Paste', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Paste (MD)', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Vanilla Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('Wasabi Powder', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('White Butter', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('White Chocolate Slab', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
  INSERT INTO production.rm_items (name, unit, category_id, is_stockable, status)
    VALUES ('White Sesame', 'kg', cat_id, true, 'active') ON CONFLICT (name) DO NOTHING;
END $$;

-- ── 3. Insert NEW flavours into sales.flavours ────────────────────
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Aam Kasundi (Mustard)', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Aam Panha Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('After Hours (Dark Chocolate Mint)', 'Couverture', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Anjeer (Sun-Dried Figs)', 'Nuts', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Arabica Cinnamon (Di Bella Coffee Cinnamon)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Arabica Nutmeg (Di Bella Coffee Nutmeg)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Avocado Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Bhuna Badaam (Roasted Nutty Almonds)', 'Nuts', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Blueberry Cheesecake', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Boondi Laddoo', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Caramel Cheese Popcorn', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Caramel Galangal', 'Eastern', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Caramel Latte (Di Bella Coffee Caramel)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Cashew Scotch Arabica (Di Bella Coffee Cashew)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Cashewnut Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Cheese Melt', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Chocolate Ginger', 'Eastern', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Chocolate Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Coffee Berry (Di Bella Coffee Strawberry)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Durian Banana', 'Eastern', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('French Vanilla (2025)', 'White Box', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Fruit Custard', 'Fruits', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Gingerbread', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Golden Sitaphal', 'Fruits', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Gondhoraj Malai', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Gud and Saunf', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Hazelnut Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Java Peppermint (Di Bella Coffee Mint)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Khajoor', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Kokum Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Lemongrass Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Made in Heaven (Choco Hazel Crunch)', 'Couverture', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Mango Cheesecake', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Mango Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Maple Cinnamon Roll', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Mauritian Vanilla Bean', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Mishti Doi', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Miso Caramel', 'Eastern', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Mocha Choco-chip (Di Bella Coffee DCC)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Mocha Hazelnut (Di Bella Coffee Hazelnut)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('MotiChoor', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Nutty Arabica (Di Bella Coffee Almond)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Nutty Naughty (Milk Chocolate Almond)', 'Couverture', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Off Season Sitaphal', 'White Box', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Orange Apricot', 'Fruits', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Orange Cheesecake', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Pecan Caramel Crumble', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Pineapple Chili', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Pistachio Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Princess Blonde (White Chocolate Cake)', 'Couverture', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Pumpkin Pie', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Pure Arabica Coffee (Di Bella Coffee)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Purple Pandan', 'Eastern', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Qubaani (Apricots)', 'Fruits', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Raspberry Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Red Chilli Bite', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Salted Caramel Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Signature Mango (Aurum)', 'Signature', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Signature Strawberry (Rosaea)', 'Signature', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Sol Kadhi', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Strawberry Cheesecake', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Strawberry Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Sunkissed Arabica (Di Bella Coffee Orange)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Sweet Soy', 'Eastern', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Tamarind Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Tamarind and Curry Leaf', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Tender Coconut Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Thengai Barfi', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Tilgul', 'Traditional', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Tropical Brew (Di Bella Coffee Coconut)', 'Coffee', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Turkish Hazelnut', 'Occidental', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Ultimate Luxe (Michelle & Barry Callebaut)', 'Couverture', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vanilla Sorbet', 'Sorbets', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Caramel', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Cashew', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Chocolate', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Coffee', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Coffee Caramel', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Kaju Katli', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Mango', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Matcha', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Pistachio', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Raspberry', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('Vegan Strawberry', 'Vegan', 'active') ON CONFLICT (name) DO NOTHING;
INSERT INTO sales.flavours (name, category, status)
  VALUES ('White Knight (White Chocolate Almond)', 'Couverture', 'active') ON CONFLICT (name) DO NOTHING;

-- ── 4. Create prep_products (existing + new flavours) ─────────────
DO $$
DECLARE fid INT;
BEGIN
  -- Aale Paak
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Aale Paak' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Aale Paak', 20.0, 'batch', 'active');
  END IF;
  -- Aam Kasundi (Mustard)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Aam Kasundi (Mustard)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Aam Kasundi (Mustard)', 20.0, 'batch', 'active');
  END IF;
  -- Aam Panha Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Aam Panha Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Aam Panha Sorbet', 16.0, 'batch', 'active');
  END IF;
  -- After Hours (Dark Chocolate Mint)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'After Hours (Dark Chocolate Mint)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'After Hours (Dark Chocolate Mint)', 20.0, 'batch', 'active');
  END IF;
  -- Amrood (Guava/Peru)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Amrood (Guava/Peru)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Amrood (Guava/Peru)', 20.0, 'batch', 'active');
  END IF;
  -- Pineapple
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Pineapple' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Pineapple', 20.0, 'batch', 'active');
  END IF;
  -- Anjeer (Sun-Dried Figs)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Anjeer (Sun-Dried Figs)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Anjeer (Sun-Dried Figs)', 20.0, 'batch', 'active');
  END IF;
  -- Apple Pie
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Apple Pie' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Apple Pie', 20.0, 'batch', 'active');
  END IF;
  -- Arabica Cinnamon (Di Bella Coffee Cinnamon)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Arabica Cinnamon (Di Bella Coffee Cinnamon)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Arabica Cinnamon (Di Bella Coffee Cinnamon)', 20.0, 'batch', 'active');
  END IF;
  -- Arabica Nutmeg (Di Bella Coffee Nutmeg)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Arabica Nutmeg (Di Bella Coffee Nutmeg)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Arabica Nutmeg (Di Bella Coffee Nutmeg)', 20.0, 'batch', 'active');
  END IF;
  -- Avocado Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Avocado Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Avocado Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Banana Caramel
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Banana Caramel' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Banana Caramel', 20.0, 'batch', 'active');
  END IF;
  -- Banarasi Meetha Paan
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Banarasi Meetha Paan' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Banarasi Meetha Paan', 20.0, 'batch', 'active');
  END IF;
  -- Belgian Speculoos
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Belgian Speculoos' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Belgian Speculoos', 18.5, 'batch', 'active');
  END IF;
  -- Dakshin Laddoo
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Dakshin Laddoo' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Dakshin Laddoo', 20.0, 'batch', 'active');
  END IF;
  -- Bhuna Badaam (Roasted Nutty Almonds)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Bhuna Badaam (Roasted Nutty Almonds)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Bhuna Badaam (Roasted Nutty Almonds)', 20.0, 'batch', 'active');
  END IF;
  -- Blueberry Blush (FD)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Blueberry Blush (FD)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Blueberry Blush (FD)', 40.0, 'batch', 'active');
  END IF;
  -- Blueberry Cheesecake
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Blueberry Cheesecake' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Blueberry Cheesecake', 20.0, 'batch', 'active');
  END IF;
  -- Boondi Laddoo
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Boondi Laddoo' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Boondi Laddoo', 20.0, 'batch', 'active');
  END IF;
  -- Caramel Cheese Popcorn
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Caramel Cheese Popcorn' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Caramel Cheese Popcorn', 20.0, 'batch', 'active');
  END IF;
  -- Caramel Galangal
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Caramel Galangal' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Caramel Galangal', 20.0, 'batch', 'active');
  END IF;
  -- Caramel Latte (Di Bella Coffee Caramel)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Caramel Latte (Di Bella Coffee Caramel)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Caramel Latte (Di Bella Coffee Caramel)', 20.0, 'batch', 'active');
  END IF;
  -- Cashew Scotch Arabica (Di Bella Coffee Cashew)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Cashew Scotch Arabica (Di Bella Coffee Cashew)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Cashew Scotch Arabica (Di Bella Coffee Cashew)', 20.0, 'batch', 'active');
  END IF;
  -- Cashewnut Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Cashewnut Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Cashewnut Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Cheese Melt
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Cheese Melt' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Cheese Melt', 20.0, 'batch', 'active');
  END IF;
  -- Chikkamagaluru Kaaphi
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Chikkamagaluru Kaaphi' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Chikkamagaluru Kaaphi', 20.0, 'batch', 'active');
  END IF;
  -- Chikoo
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Chikoo' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Chikoo', 20.0, 'batch', 'active');
  END IF;
  -- Chocolate Choice (FD)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Chocolate Choice (FD)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Chocolate Choice (FD)', 40.0, 'batch', 'active');
  END IF;
  -- Chocolate Ginger
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Chocolate Ginger' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Chocolate Ginger', 20.0, 'batch', 'active');
  END IF;
  -- Chocolate Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Chocolate Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Chocolate Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Coffee Berry (Di Bella Coffee Strawberry)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Coffee Berry (Di Bella Coffee Strawberry)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Coffee Berry (Di Bella Coffee Strawberry)', 20.0, 'batch', 'active');
  END IF;
  -- Cookie Dusk
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Cookie Dusk' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Cookie Dusk', 20.0, 'batch', 'active');
  END IF;
  -- Crumble & Dough
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Crumble & Dough' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Crumble & Dough', 20.0, 'batch', 'active');
  END IF;
  -- Cutting Chai Biskoot
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Cutting Chai Biskoot' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Cutting Chai Biskoot', 20.0, 'batch', 'active');
  END IF;
  -- Dakkhan Sitaphal (Custard Apple)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Dakkhan Sitaphal (Custard Apple)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Dakkhan Sitaphal (Custard Apple)', 20.0, 'batch', 'active');
  END IF;
  -- Dates and Almonds
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Dates and Almonds' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Dates and Almonds', 20.0, 'batch', 'active');
  END IF;
  -- Durian Banana
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Durian Banana' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Durian Banana', 19.0, 'batch', 'active');
  END IF;
  -- French Vanilla
  SELECT id INTO fid FROM sales.flavours WHERE name = 'French Vanilla' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'French Vanilla', 20.0, 'batch', 'active');
  END IF;
  -- French Vanilla (2025)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'French Vanilla (2025)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'French Vanilla (2025)', 20.0, 'batch', 'active');
  END IF;
  -- Fruit Custard
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Fruit Custard' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Fruit Custard', 20.0, 'batch', 'active');
  END IF;
  -- Gajar Halwa
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Gajar Halwa' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Gajar Halwa', 20.0, 'batch', 'active');
  END IF;
  -- Gingerbread
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Gingerbread' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Gingerbread', 20.0, 'batch', 'active');
  END IF;
  -- Golden Sitaphal
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Golden Sitaphal' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Golden Sitaphal', 20.0, 'batch', 'active');
  END IF;
  -- Gondhoraj Malai
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Gondhoraj Malai' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Gondhoraj Malai', 20.0, 'batch', 'active');
  END IF;
  -- Gud and Saunf
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Gud and Saunf' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Gud and Saunf', 20.0, 'batch', 'active');
  END IF;
  -- Gulab Jamun
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Gulab Jamun' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Gulab Jamun', 20.0, 'batch', 'active');
  END IF;
  -- Gulqand
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Gulqand' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Gulqand', 20.0, 'batch', 'active');
  END IF;
  -- Hara Pista
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Hara Pista' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Hara Pista', 16.0, 'batch', 'active');
  END IF;
  -- Hass Avocado
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Hass Avocado' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Hass Avocado', 18.78, 'batch', 'active');
  END IF;
  -- Hazelnut Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Hazelnut Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Hazelnut Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Jambhul
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Jambhul' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Jambhul', 20.0, 'batch', 'active');
  END IF;
  -- Japanese Matcha
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Japanese Matcha' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Japanese Matcha', 20.0, 'batch', 'active');
  END IF;
  -- Java Peppermint (Di Bella Coffee Mint)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Java Peppermint (Di Bella Coffee Mint)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Java Peppermint (Di Bella Coffee Mint)', 20.0, 'batch', 'active');
  END IF;
  -- Kaffir Lime Coconut
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Kaffir Lime Coconut' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Kaffir Lime Coconut', 20.0, 'batch', 'active');
  END IF;
  -- Kaju Katli
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Kaju Katli' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Kaju Katli', 19.0, 'batch', 'active');
  END IF;
  -- Karikku (Tender Coconut)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Karikku (Tender Coconut)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Karikku (Tender Coconut)', 20.0, 'batch', 'active');
  END IF;
  -- Kashmiri Kesar
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Kashmiri Kesar' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Kashmiri Kesar', 20.0, 'batch', 'active');
  END IF;
  -- Kesar Thandai
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Kesar Thandai' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Kesar Thandai', 20.0, 'batch', 'active');
  END IF;
  -- Khajoor
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Khajoor' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Khajoor', 20.0, 'batch', 'active');
  END IF;
  -- Kokum Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Kokum Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Kokum Sorbet', 11.0, 'batch', 'active');
  END IF;
  -- Kuro Goma
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Kuro Goma' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Kuro Goma', 20.0, 'batch', 'active');
  END IF;
  -- Kyoka Kuro Goma
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Kyoka Kuro Goma' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Kyoka Kuro Goma', 20.0, 'batch', 'active');
  END IF;
  -- Legal Overdose
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Legal Overdose' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Legal Overdose', 20.0, 'batch', 'active');
  END IF;
  -- Lemongrass Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Lemongrass Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Lemongrass Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Madagascar Vanilla
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Madagascar Vanilla' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Madagascar Vanilla', 20.0, 'batch', 'active');
  END IF;
  -- Made in Heaven (Choco Hazel Crunch)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Made in Heaven (Choco Hazel Crunch)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Made in Heaven (Choco Hazel Crunch)', 20.0, 'batch', 'active');
  END IF;
  -- Mango Basil
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mango Basil' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mango Basil', 20.0, 'batch', 'active');
  END IF;
  -- Mango Cheesecake
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mango Cheesecake' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mango Cheesecake', 20.0, 'batch', 'active');
  END IF;
  -- Mango Mania (FD)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mango Mania (FD)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mango Mania (FD)', 40.0, 'batch', 'active');
  END IF;
  -- Mango Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mango Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mango Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Maple Cinnamon Roll
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Maple Cinnamon Roll' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Maple Cinnamon Roll', 20.0, 'batch', 'active');
  END IF;
  -- Mauritian Vanilla Bean
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mauritian Vanilla Bean' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mauritian Vanilla Bean', 20.0, 'batch', 'active');
  END IF;
  -- Midnight Mania
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Midnight Mania' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Midnight Mania', 20.0, 'batch', 'active');
  END IF;
  -- Mishti Doi
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mishti Doi' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mishti Doi', 18.0, 'batch', 'active');
  END IF;
  -- Miso Caramel
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Miso Caramel' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Miso Caramel', 20.0, 'batch', 'active');
  END IF;
  -- Mocha Choco-chip (Di Bella Coffee DCC)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mocha Choco-chip (Di Bella Coffee DCC)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mocha Choco-chip (Di Bella Coffee DCC)', 20.0, 'batch', 'active');
  END IF;
  -- Mocha Hazelnut (Di Bella Coffee Hazelnut)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mocha Hazelnut (Di Bella Coffee Hazelnut)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mocha Hazelnut (Di Bella Coffee Hazelnut)', 20.0, 'batch', 'active');
  END IF;
  -- MotiChoor
  SELECT id INTO fid FROM sales.flavours WHERE name = 'MotiChoor' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'MotiChoor', 20.0, 'batch', 'active');
  END IF;
  -- Mysore Paak
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Mysore Paak' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Mysore Paak', 20.0, 'batch', 'active');
  END IF;
  -- Narali Bhaat
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Narali Bhaat' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Narali Bhaat', 20.0, 'batch', 'active');
  END IF;
  -- New York Style Cheesecake
  SELECT id INTO fid FROM sales.flavours WHERE name = 'New York Style Cheesecake' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'New York Style Cheesecake', 20.0, 'batch', 'active');
  END IF;
  -- Nutty Arabica (Di Bella Coffee Almond)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Nutty Arabica (Di Bella Coffee Almond)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Nutty Arabica (Di Bella Coffee Almond)', 20.0, 'batch', 'active');
  END IF;
  -- Nutty Naughty (Milk Chocolate Almond)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Nutty Naughty (Milk Chocolate Almond)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Nutty Naughty (Milk Chocolate Almond)', 20.0, 'batch', 'active');
  END IF;
  -- Off Season Sitaphal
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Off Season Sitaphal' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Off Season Sitaphal', 20.0, 'batch', 'active');
  END IF;
  -- Orange Apricot
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Orange Apricot' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Orange Apricot', 20.0, 'batch', 'active');
  END IF;
  -- Orange Cheesecake
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Orange Cheesecake' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Orange Cheesecake', 20.0, 'batch', 'active');
  END IF;
  -- Reshmi Paan
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Reshmi Paan' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Reshmi Paan', 20.0, 'batch', 'active');
  END IF;
  -- Palaapazham (Jackfruit)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Palaapazham (Jackfruit)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Palaapazham (Jackfruit)', 20.0, 'batch', 'active');
  END IF;
  -- Pecan Caramel Crumble
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Pecan Caramel Crumble' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Pecan Caramel Crumble', 20.0, 'batch', 'active');
  END IF;
  -- Pineapple Chili
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Pineapple Chili' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Pineapple Chili', 20.0, 'batch', 'active');
  END IF;
  -- Pistachio Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Pistachio Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Pistachio Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Prasadam Laddoo
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Prasadam Laddoo' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Prasadam Laddoo', 20.0, 'batch', 'active');
  END IF;
  -- Princess Blonde (White Chocolate Cake)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Princess Blonde (White Chocolate Cake)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Princess Blonde (White Chocolate Cake)', 20.0, 'batch', 'active');
  END IF;
  -- Pumpkin Pie
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Pumpkin Pie' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Pumpkin Pie', 20.0, 'batch', 'active');
  END IF;
  -- Puranpoli
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Puranpoli' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Puranpoli', 20.0, 'batch', 'active');
  END IF;
  -- Pure Arabica Coffee (Di Bella Coffee)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Pure Arabica Coffee (Di Bella Coffee)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Pure Arabica Coffee (Di Bella Coffee)', 20.0, 'batch', 'active');
  END IF;
  -- Purple Pandan
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Purple Pandan' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Purple Pandan', 20.0, 'batch', 'active');
  END IF;
  -- Qubaani (Apricots)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Qubaani (Apricots)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Qubaani (Apricots)', 20.0, 'batch', 'active');
  END IF;
  -- Ramphal
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Ramphal' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Ramphal', 20.0, 'batch', 'active');
  END IF;
  -- Raspberry Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Raspberry Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Raspberry Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Ratnagiri Hapoos (Mango)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Ratnagiri Hapoos (Mango)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Ratnagiri Hapoos (Mango)', 20.0, 'batch', 'active');
  END IF;
  -- Red Chilli Bite
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Red Chilli Bite' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Red Chilli Bite', 20.0, 'batch', 'active');
  END IF;
  -- Salted Caramel
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Salted Caramel' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Salted Caramel', 20.0, 'batch', 'active');
  END IF;
  -- Salted Caramel Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Salted Caramel Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Salted Caramel Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Sheer Qhurma
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Sheer Qhurma' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Sheer Qhurma', 20.0, 'batch', 'active');
  END IF;
  -- Shahi Sevaiya
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Shahi Sevaiya' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Shahi Sevaiya', 20.0, 'batch', 'active');
  END IF;
  -- Signature Chocolate (Cacaoir)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Signature Chocolate (Cacaoir)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Signature Chocolate (Cacaoir)', 11.0, 'batch', 'active');
  END IF;
  -- Signature Mango (Aurum)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Signature Mango (Aurum)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Signature Mango (Aurum)', 11.0, 'batch', 'active');
  END IF;
  -- Signature Strawberry (Rosaea)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Signature Strawberry (Rosaea)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Signature Strawberry (Rosaea)', 11.0, 'batch', 'active');
  END IF;
  -- Sol Kadhi
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Sol Kadhi' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Sol Kadhi', 16.0, 'batch', 'active');
  END IF;
  -- Strawberry Cheesecake
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Strawberry Cheesecake' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Strawberry Cheesecake', 20.0, 'batch', 'active');
  END IF;
  -- Strawberry Cream
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Strawberry Cream' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Strawberry Cream', 20.0, 'batch', 'active');
  END IF;
  -- Strawberry Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Strawberry Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Strawberry Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Strawberry Strength (FD)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Strawberry Strength (FD)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Strawberry Strength (FD)', 40.0, 'batch', 'active');
  END IF;
  -- Sunkissed Arabica (Di Bella Coffee Orange)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Sunkissed Arabica (Di Bella Coffee Orange)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Sunkissed Arabica (Di Bella Coffee Orange)', 20.0, 'batch', 'active');
  END IF;
  -- Sunkissed Twilight
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Sunkissed Twilight' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Sunkissed Twilight', 20.0, 'batch', 'active');
  END IF;
  -- Sweet Soy
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Sweet Soy' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Sweet Soy', 20.0, 'batch', 'active');
  END IF;
  -- Tamarind Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Tamarind Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Tamarind Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Tamarind and Curry Leaf
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Tamarind and Curry Leaf' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Tamarind and Curry Leaf', 20.0, 'batch', 'active');
  END IF;
  -- Tender Coconut Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Tender Coconut Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Tender Coconut Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Thengai Barfi
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Thengai Barfi' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Thengai Barfi', 20.0, 'batch', 'active');
  END IF;
  -- Tilgul
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Tilgul' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Tilgul', 20.0, 'batch', 'active');
  END IF;
  -- Tropical Brew (Di Bella Coffee Coconut)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Tropical Brew (Di Bella Coffee Coconut)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Tropical Brew (Di Bella Coffee Coconut)', 20.0, 'batch', 'active');
  END IF;
  -- Turkish Hazelnut
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Turkish Hazelnut' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Turkish Hazelnut', 16.0, 'batch', 'active');
  END IF;
  -- Ukadiche Modak
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Ukadiche Modak' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Ukadiche Modak', 20.0, 'batch', 'active');
  END IF;
  -- Ultimate Luxe (Michelle & Barry Callebaut)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Ultimate Luxe (Michelle & Barry Callebaut)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Ultimate Luxe (Michelle & Barry Callebaut)', 20.0, 'batch', 'active');
  END IF;
  -- Vanilla Sorbet
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vanilla Sorbet' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vanilla Sorbet', 20.0, 'batch', 'active');
  END IF;
  -- Vanilla Vantage (FD)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vanilla Vantage (FD)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vanilla Vantage (FD)', 40.0, 'batch', 'active');
  END IF;
  -- Vegan Caramel
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Caramel' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Caramel', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Cashew
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Cashew' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Cashew', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Chocolate
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Chocolate' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Chocolate', 9.9, 'batch', 'active');
  END IF;
  -- Vegan Coffee
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Coffee' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Coffee', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Coffee Caramel
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Coffee Caramel' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Coffee Caramel', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Kaju Katli
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Kaju Katli' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Kaju Katli', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Mango
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Mango' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Mango', 9.9, 'batch', 'active');
  END IF;
  -- Vegan Matcha
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Matcha' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Matcha', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Pistachio
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Pistachio' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Pistachio', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Raspberry
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Raspberry' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Raspberry', 20.0, 'batch', 'active');
  END IF;
  -- Vegan Strawberry
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Vegan Strawberry' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Vegan Strawberry', 9.9, 'batch', 'active');
  END IF;
  -- Wasabi Punch
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Wasabi Punch' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Wasabi Punch', 20.0, 'batch', 'active');
  END IF;
  -- White Knight (White Chocolate Almond)
  SELECT id INTO fid FROM sales.flavours WHERE name = 'White Knight (White Chocolate Almond)' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'White Knight (White Chocolate Almond)', 20.0, 'batch', 'active');
  END IF;
  -- Yorkshire Butterscotch
  SELECT id INTO fid FROM sales.flavours WHERE name = 'Yorkshire Butterscotch' LIMIT 1;
  IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production.prep_products WHERE flavour_id = fid) THEN
    INSERT INTO production.prep_products (flavour_id, name, batch_yield_l, unit, status)
      VALUES (fid, 'Yorkshire Butterscotch', 20.0, 'batch', 'active');
  END IF;
END $$;

-- ── 5. Prep recipes (upserts qty_per_unit from cost sheet) ────────
DO $$
DECLARE pp_id INT; rm_id INT;
BEGIN
  -- Aale Paak
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Aale Paak' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Ginger' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Ginger' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Aam Kasundi (Mustard)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Aam Kasundi (Mustard)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Kasundi Sauce' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0625, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Kairi Squash' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0625, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Aam Panha Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Aam Panha Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Aam Panha Syrup' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.421875, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jaggery' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000937, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cumin Seeds Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000937, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.003125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- After Hours (Dark Chocolate Mint)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'After Hours (Dark Chocolate Mint)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'JB 800 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Mint Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.014, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Amrood (Guava/Peru)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Amrood (Guava/Peru)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Guava' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1375, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Pineapple
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Pineapple' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Pineapple' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Anjeer (Sun-Dried Figs)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Anjeer (Sun-Dried Figs)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Anjeer Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Anjeer Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Apple Pie
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Apple Pie' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Apple' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.25, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ghee' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cinnamon Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0017, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Digestive Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.045, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Apple Halwa' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Arabica Cinnamon (Di Bella Coffee Cinnamon)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Arabica Cinnamon (Di Bella Coffee Cinnamon)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cinnamon Rolls' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Arabica Nutmeg (Di Bella Coffee Nutmeg)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Arabica Nutmeg (Di Bella Coffee Nutmeg)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Chironji Seeds (Charoli)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Avocado Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Avocado Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Hass Avocado' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.09, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Banana Caramel
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Banana Caramel' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Banana' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Freeze Dried Banana' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.02, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Banarasi Meetha Paan
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Banarasi Meetha Paan' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Banarasi Betal Leaf' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gulkand' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.08, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fennel Seeds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00725, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Pepper' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000725, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000725, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tukda Kaju' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fennel Seeds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Belgian Speculoos
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Belgian Speculoos' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Lotus Biscoff Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.093514, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = '4% Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.037838, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cinnamon Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 5.4e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.021622, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Lotus Biscoff Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.048649, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Dakshin Laddoo
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Dakshin Laddoo' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gram Flour (Besan)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0625, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ghee' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0315, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 1e-06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tukda Kaju' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0125, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Bhuna Badaam (Roasted Nutty Almonds)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Bhuna Badaam (Roasted Nutty Almonds)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Roasted Almond Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Blueberry Blush (FD)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Blueberry Blush (FD)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blueberry Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0375, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blueberry Essence' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000375, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Blueberry Cheesecake
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Blueberry Cheesecake' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blueberry Compote' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Cheese Cubes' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Digestive Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.045, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Boondi Laddoo
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Boondi Laddoo' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 6.3e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Sweet Boondi' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Caramel Galangal
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Caramel Galangal' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Caramel Sauce' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Galangal Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.035, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Caramel Latte (Di Bella Coffee Caramel)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Caramel Latte (Di Bella Coffee Caramel)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Caramel Sauce' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Oats Chikki' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Cashew Scotch Arabica (Di Bella Coffee Cashew)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Cashew Scotch Arabica (Di Bella Coffee Cashew)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cashew Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cashew Chikki' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Cashewnut Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Cashewnut Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cashew Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0525, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Ash Gourd' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0525, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Cheese Melt
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Cheese Melt' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Cheese Cubes' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.07, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Chikkamagaluru Kaaphi
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Chikkamagaluru Kaaphi' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coffee Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.02, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Chikoo
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Chikoo' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Chikoo' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.16, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Chocolate Choice (FD)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Chocolate Choice (FD)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = '4% Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jindal 301 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Chocolate Compound' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.035, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Chocolate Ginger
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Chocolate Ginger' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'JB 800 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ginger Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Caramelized Ginger' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Coffee Berry (Di Bella Coffee Strawberry)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Coffee Berry (Di Bella Coffee Strawberry)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Frozen Strawberries' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Cookie Dusk
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Cookie Dusk' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'JB 800 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Chocolate Chip Cookies' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0175, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Crumble & Dough
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Crumble & Dough' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Parle Gold' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0175, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Fantasy Chocolate biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.075, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Cutting Chai Biskoot
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Cutting Chai Biskoot' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tea Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Ginger' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Parle G Biscuit' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.02, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Dakkhan Sitaphal (Custard Apple)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Dakkhan Sitaphal (Custard Apple)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Deccan Sitaphal' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.3, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Dates and Almonds
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Dates and Almonds' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Date Syrup' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Dates' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0075, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Durian Banana
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Durian Banana' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Durian' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.105263, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Banana' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.052632, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- French Vanilla
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'French Vanilla' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = '4% Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Extract 301P' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0009, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Flavour (P)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00035, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- French Vanilla (2025)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'French Vanilla (2025)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = '4% Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Oleoresin' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0009, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Flavour (CEC)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00035, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Fruit Custard
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Fruit Custard' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Digestive Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tutti Frutti' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Gajar Halwa
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Gajar Halwa' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gajar Halwa' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gajar Halwa' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Gingerbread
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Gingerbread' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ground Ginger (Suntha)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 4e-06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Molasses' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gingerbread Cookies' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Nutmeg Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 1e-06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Golden Sitaphal
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Golden Sitaphal' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Golden Sitaphal' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.4, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Gondhoraj Malai
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Gondhoraj Malai' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Tender Coconut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Kaffir Lime Leaves' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Gud and Saunf
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Gud and Saunf' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Milkmaid' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.12, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = '4% Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.024, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jaggery' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.014, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fennel Seeds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Gulab Jamun
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Gulab Jamun' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Cream' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.02, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 7e-06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gulab Jamun' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Gulqand
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Gulqand' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gulkand' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.08, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dried Rose Petals' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gulkand' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Hara Pista
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Hara Pista' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Pistachio Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Pista' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0625, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Hass Avocado
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Hass Avocado' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Hass Avocado' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.212993, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Honey' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.031949, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Hazelnut Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Hazelnut Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Hazelnut Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0525, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Ash Gourd' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0525, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Jambhul
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Jambhul' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Jambhul' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.225, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Japanese Matcha
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Japanese Matcha' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Matcha Tea Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0065, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Java Peppermint (Di Bella Coffee Mint)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Java Peppermint (Di Bella Coffee Mint)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Oreo Cookies' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Kaffir Lime Coconut
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Kaffir Lime Coconut' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Tender Coconut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Kaffir Lime Leaves' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00875, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Kaju Katli
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Kaju Katli' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cashew Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.131579, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tukda Kaju' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.026316, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Karikku (Tender Coconut)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Karikku (Tender Coconut)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Tender Coconut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Kashmiri Kesar
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Kashmiri Kesar' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Kesar Thandai
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Kesar Thandai' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 6.3e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Pepper' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00175, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Khus Khus' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fennel Seeds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000875, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tukda Kaju' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Khajoor
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Khajoor' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Red Dates' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Red Dates' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.075, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0075, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Kokum Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Kokum Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Omkar Kokum Syrup' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.409091, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Chaat Masala' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.003636, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.003636, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Kuro Goma
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Kuro Goma' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Honey' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Sesame' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Sesame' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Kyoka Kuro Goma
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Kyoka Kuro Goma' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Honey' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Sesame' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0875, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Legal Overdose
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Legal Overdose' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Milk Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.08, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jindal 301 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Lemongrass Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Lemongrass Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Lemon' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 10.0, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Lemongrass' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 1.7e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.14, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Madagascar Vanilla
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Madagascar Vanilla' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Paste (MD)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Made in Heaven (Choco Hazel Crunch)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Made in Heaven (Choco Hazel Crunch)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Hazelnut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Hazelnut Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Milk Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jindal 301 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mango Basil
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mango Basil' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Canned Mango Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Thai Basil' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0275, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mango Mania (FD)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mango Mania (FD)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Canned Mango Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Mango Essence' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mango Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mango Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Canned Mango Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.08, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Maple Cinnamon Roll
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Maple Cinnamon Roll' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cinnamon Rolls' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cinnamon Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 3e-06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Maple Syrup' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mauritian Vanilla Bean
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mauritian Vanilla Bean' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Midnight Mania
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Midnight Mania' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.08, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'JB 800 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mishti Doi
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mishti Doi' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Milkmaid' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.144444, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = '4% Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.030556, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Miso Caramel
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Miso Caramel' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Miso Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Caramel Sauce' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mocha Choco-chip (Di Bella Coffee DCC)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mocha Choco-chip (Di Bella Coffee DCC)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coffee Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mocha Hazelnut (Di Bella Coffee Hazelnut)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mocha Hazelnut (Di Bella Coffee Hazelnut)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Hazelnut Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- MotiChoor
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'MotiChoor' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Sweet Boondi' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Mysore Paak
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Mysore Paak' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Samrat Gram Flour (Besan)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Maida' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gowardhan Ghee' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0665, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Khoa' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0085, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 5e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Mysore Paak' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Narali Bhaat
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Narali Bhaat' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jaggery' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coconut Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cinnamon Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Clove Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 5e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Shredded Coconut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tukda Kaju' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Raisins' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- New York Style Cheesecake
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'New York Style Cheesecake' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Cheese Cubes' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.07, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Digestive Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Nutty Arabica (Di Bella Coffee Almond)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Nutty Arabica (Di Bella Coffee Almond)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Nutty Naughty (Milk Chocolate Almond)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Nutty Naughty (Milk Chocolate Almond)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Milk Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jindal 301 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Off Season Sitaphal
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Off Season Sitaphal' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Off Season Sitaphal Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Orange Apricot
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Orange Apricot' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Candied Orange Peel' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dried Apricot' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Liquid Glucose' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Orange Cheesecake
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Orange Cheesecake' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Cheese Cubes' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Digestive Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.045, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Orange Paste Pre Gel' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Reshmi Paan
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Reshmi Paan' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Banarasi Betal Leaf' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gulkand' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0875, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fennel Seeds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00725, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Pepper' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000725, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000725, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tukda Kaju' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fennel Seeds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Palaapazham (Jackfruit)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Palaapazham (Jackfruit)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Jackfruit' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.2, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Pecan Caramel Crumble
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Pecan Caramel Crumble' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.019, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Fresh Cream' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Pecans' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Pineapple Chili
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Pineapple Chili' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Pineapple Halwa' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Red Chillies' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Pistachio Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Pistachio Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Pistachio Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0525, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Ash Gourd' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0525, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Prasadam Laddoo
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Prasadam Laddoo' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Taste for Life Besan' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0265, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gowardhan Ghee' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.043, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Edible Camphor' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 5e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Clove Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.000125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Sweet Boondi' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Pumpkin Pie
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Pumpkin Pie' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Pumpkin' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Puranpoli
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Puranpoli' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Puran' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Nutmeg Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Puranpoli' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.75, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Pure Arabica Coffee (Di Bella Coffee)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Pure Arabica Coffee (Di Bella Coffee)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coffee Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Purple Pandan
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Purple Pandan' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Pandan Leaves' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Purple Yam' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Qubaani (Apricots)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Qubaani (Apricots)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Apricot Sauce' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Apricot Sauce' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.06, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Ramphal
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Ramphal' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Ramphal' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.3, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Raspberry Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Raspberry Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Raspberry' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Ratnagiri Hapoos (Mango)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Ratnagiri Hapoos (Mango)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Canned Mango Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Red Chilli Bite
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Red Chilli Bite' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Aam Panha Syrup' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Red Chilli Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Red Chillies' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Salted Caramel
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Salted Caramel' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Fresh Cream' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.019, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Sheer Qhurma
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Sheer Qhurma' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 6.3e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dried Rose Petals' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Dates' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.02, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Shahi Sevaiya
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Shahi Sevaiya' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Saffron Spice' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 6.3e-05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dried Rose Petals' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Gowardhan Ghee' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.015, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Sevaiya' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Kharik' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.02, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Charoli' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Raisins' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tukda Kaju' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Rose Water' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Red Dates' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Signature Chocolate (Cacaoir)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Signature Chocolate (Cacaoir)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = '4% Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.181818, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.290909, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'JB 800 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.218182, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Signature Mango (Aurum)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Signature Mango (Aurum)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Canned Mango Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.363636, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Signature Strawberry (Rosaea)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Signature Strawberry (Rosaea)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Frozen Strawberries' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.363636, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Sol Kadhi
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Sol Kadhi' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coconut Milk Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0625, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Kokum' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05625, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Garlic' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Green Chilli' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001875, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cumin Seeds Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001094, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Strawberry Cheesecake
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Strawberry Cheesecake' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Cheese Cubes' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Digestive Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Frozen Strawberries' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Strawberry Cream
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Strawberry Cream' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Frozen Strawberries' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Strawberry Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Strawberry Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Frozen Strawberries' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.08, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Strawberry Strength (FD)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Strawberry Strength (FD)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Frozen Strawberries' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Strawberry Essence' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Sunkissed Arabica (Di Bella Coffee Orange)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Sunkissed Arabica (Di Bella Coffee Orange)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Candied Orange Peel' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Sunkissed Twilight
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Sunkissed Twilight' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Dark Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.04, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'JB 800 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Orange Paste Pre Gel' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.02, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Candied Orange Peel' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Sweet Soy
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Sweet Soy' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Sweet Soy Sauce' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Tamarind and Curry Leaf
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Tamarind and Curry Leaf' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Curry Leaf' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Tamarind Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Tender Coconut Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Tender Coconut Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Tender Coconut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.085, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Tilgul
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Tilgul' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.1, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Sesame' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0875, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jaggery' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Sesame' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0065, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Black Sesame' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Tropical Brew (Di Bella Coffee Coconut)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Tropical Brew (Di Bella Coffee Coconut)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coconut Milk Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coconut Crunch Biscuits' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.004, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Turkish Hazelnut
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Turkish Hazelnut' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Hazelnut Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03125, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Ukadiche Modak
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Ukadiche Modak' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jaggery' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Coconut Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Shredded Coconut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jaggery' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.03, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Khus Khus' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0001, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cardamom Powder (Elaichi)' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00025, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Ultimate Luxe (Michelle & Barry Callebaut)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Ultimate Luxe (Michelle & Barry Callebaut)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cacao Miscela' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.025, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Callebaut' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.06, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vanilla Sorbet
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vanilla Sorbet' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0275, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Paste' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.011, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vanilla Vantage (FD)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vanilla Vantage (FD)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Vanilla Essence' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Chocolate
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Chocolate' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.166667, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'JB 800 Cocoa Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.072727, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Jaggery' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.044444, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00202, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Coffee
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Coffee' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ash Gourd Prep' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.002, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Coffee Caramel
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Coffee Caramel' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ash Gourd Prep' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.002, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Kaju Katli
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Kaju Katli' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ash Gourd Prep' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Cashew Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Mango
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Mango' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.166667, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Canned Mango Pulp' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.444444, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00303, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Matcha
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Matcha' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ash Gourd Prep' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.002, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Matcha Tea Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Pistachio
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Pistachio' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ash Gourd Prep' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0015, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Pistachio Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.001, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Raspberry
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Raspberry' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Ash Gourd Prep' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0005, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Fresh Raspberry' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.002, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Vegan Strawberry
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Vegan Strawberry' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Blanched Almond Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.139394, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Frozen Strawberries' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.505051, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Stabilizer' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.00303, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Wasabi Punch
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Wasabi Punch' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Wasabi Powder' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.01, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- White Knight (White Chocolate Almond)
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'White Knight (White Chocolate Almond)' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'High Fat Milk' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.075, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Chocolate Slab' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Loose Almonds' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
  -- Yorkshire Butterscotch
  SELECT id INTO pp_id FROM production.prep_products WHERE name = 'Yorkshire Butterscotch' LIMIT 1;
  IF pp_id IS NOT NULL THEN
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Brown Sugar' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0625, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Amul Fresh Cream' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.05, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.019, 'mix')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Rolled Oats' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0225, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'White Butter' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.0095, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
    SELECT id INTO rm_id FROM production.rm_items WHERE name = 'Brown Sugar' LIMIT 1;
    IF rm_id IS NOT NULL THEN
      INSERT INTO production.prep_recipes (prep_product_id, rm_item_id, qty_per_unit, purpose)
        VALUES (pp_id, rm_id, 0.047, 'topping')
        ON CONFLICT (prep_product_id, rm_item_id, purpose) DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    END IF;
  END IF;
END $$;

-- ── 6. sales.orders + sales.order_lines ───────────────────────────
CREATE TABLE IF NOT EXISTS sales.orders (
  id            SERIAL PRIMARY KEY,
  order_ref     TEXT,
  customer_name TEXT,
  ordered_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_date DATE,
  status        TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('draft','confirmed','dispatched','cancelled')),
  note          TEXT,
  created_by    UUID REFERENCES auth.users(id)
);
CREATE TABLE IF NOT EXISTS sales.order_lines (
  id         SERIAL PRIMARY KEY,
  order_id   INT NOT NULL REFERENCES sales.orders(id) ON DELETE CASCADE,
  fg_sku_id  INT NOT NULL,
  qty        NUMERIC NOT NULL CHECK (qty > 0),
  unit       TEXT
);
ALTER TABLE sales.orders      DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales.order_lines DISABLE ROW LEVEL SECURITY;
GRANT ALL ON sales.orders, sales.order_lines TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE sales.orders_id_seq, sales.order_lines_id_seq TO authenticated;
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON sales.orders (ordered_at);
CREATE INDEX IF NOT EXISTS idx_order_lines_sku   ON sales.order_lines (fg_sku_id);
