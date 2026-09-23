/**
 * Data-layer tests — verifies the production.prep_recipes DB state directly via Supabase.
 *
 * Run these with TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY in env.
 * They call the Supabase REST API directly (no browser), so they're fast.
 */
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const EXPECTED_FLAVOUR_COUNT = 74;

// Flavours that legitimately have no cost-sheet data yet
const KNOWN_EMPTY = new Set(['Dakshin Laddoo', 'Pinni', 'Shahi Sevaiya']);

test.describe('production.prep_products', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    test.skip(!SUPABASE_URL || !SUPABASE_KEY, 'Supabase env vars not set — skipping data tests');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  });

  test(`exactly ${EXPECTED_FLAVOUR_COUNT} active prep_products exist`, async () => {
    const { data, error } = await supabase
      .schema('production')
      .from('prep_products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    expect(error).toBeNull();
    expect((data as unknown as { count: number } | null)?.count ?? 0).toBe(EXPECTED_FLAVOUR_COUNT);
  });

  test('all 74 expected flavour names are present', async () => {
    const EXPECTED_NAMES = [
      'Aale Paak', 'After Hours', 'Amrood', 'Apple Pie', 'Banana Caramel',
      'Banarasi Meetha Paan', 'Belgian Speculoos', 'Blueberry Blush (FD)', 'Boondi',
      'Cheese Melt', 'Chikkamagaluru Kaaphi', 'Chikoo', 'Chocolate Choice (FD)',
      'Cookie Dusk', 'Crumble & Dough', 'Cutting Chai Biskoot', 'Dakkhan Sitaphal',
      'Dakshin Laddoo', 'Dates and Almonds', 'French Vanilla', 'Gud & Saunf',
      'Gulab Jamun', 'Gulqand', 'Hara Pista', 'Hass Avocado', 'Japanese Matcha',
      'Kaffir Lime Coconut', 'Kaju Katli', 'Karikku', 'Kashmiri Kesar', 'Kesar Thandai',
      'Khajoor', 'Kuro Goma', 'Kyoka Kuro Goma', 'Legal Overdose', 'Madagascar Vanilla',
      'Mango Basil', 'Mango Mania (FD)', 'Midnight Mania', 'Mishti Doi', 'Miso Caramel',
      'Mysore Paak', 'Naarali Bhaat', 'New York Style Cheesecake', 'Nutty Naughty',
      'Off Season Sitaphal', 'Palaapazham', 'Pandan Purple Yam', 'Pinni', 'Puranpoli',
      'Qubaani', 'Ramphal', 'Ratnagiri Haapoos', 'Reshmi Paan', 'Salted Caramel',
      'Shahi Sevaiya', 'Sheer Qhurma', 'Signature Chocolate (Cacaoir)',
      'Signature Mango (Aurum)', 'Signature Strawberry (Rosaea)', 'Strawberry Cream',
      'Strawberry Strength (FD)', 'Sunkissed Twilight', 'Tamrind & Curry Leaf', 'Tilgul',
      'Turkish Hazelnut', 'Ukadiche Modak', 'Vanilla Vantage (FD)', 'Vegan Chocolate',
      'Vegan Mango', 'Vegan Strawberry', 'Wasabi Punch', 'White Knight',
      'Yorkshire Butterscotch',
    ];

    const { data, error } = await supabase
      .schema('production')
      .from('prep_products')
      .select('name')
      .eq('status', 'active');
    expect(error).toBeNull();
    const names = new Set((data || []).map((r: { name: string }) => r.name));
    for (const n of EXPECTED_NAMES) {
      expect(names.has(n), `Missing flavour: ${n}`).toBe(true);
    }
  });
});

test.describe('production.prep_recipes', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    test.skip(!SUPABASE_URL || !SUPABASE_KEY, 'Supabase env vars not set — skipping data tests');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  });

  test('no uppercase purpose values exist', async () => {
    const { data, error } = await supabase
      .schema('production')
      .from('prep_recipes')
      .select('purpose')
      .neq('purpose', 'mix')
      .neq('purpose', 'topping');
    expect(error).toBeNull();
    expect((data || []).length).toBe(0);
  });

  test('only "mix" and "topping" purpose values exist', async () => {
    const { data, error } = await supabase
      .schema('production')
      .from('prep_recipes')
      .select('purpose');
    expect(error).toBeNull();
    const purposes = new Set((data || []).map((r: { purpose: string }) => r.purpose));
    for (const p of purposes) {
      expect(['mix', 'topping']).toContain(p);
    }
  });

  test('all qty_per_unit values are positive', async () => {
    const { data, error } = await supabase
      .schema('production')
      .from('prep_recipes')
      .select('qty_per_unit')
      .lte('qty_per_unit', 0);
    expect(error).toBeNull();
    expect((data || []).length).toBe(0);
  });

  test('at least 71 prep_products have at least one recipe row', async () => {
    const { data, error } = await supabase
      .schema('production')
      .from('prep_recipes')
      .select('prep_product_id');
    expect(error).toBeNull();
    const ids = new Set((data || []).map((r: { prep_product_id: number }) => r.prep_product_id));
    // 74 total, 3 known-empty = at least 71 with recipes
    expect(ids.size).toBeGreaterThanOrEqual(71);
  });

  test('total recipe rows ≥ 300', async () => {
    const { count, error } = await supabase
      .schema('production')
      .from('prep_recipes')
      .select('id', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(count ?? 0).toBeGreaterThanOrEqual(300);
  });

  test('no duplicate (prep_product_id, rm_item_id, purpose) combinations', async () => {
    // Fetch all rows and check uniqueness in JS
    const { data, error } = await supabase
      .schema('production')
      .from('prep_recipes')
      .select('prep_product_id, rm_item_id, purpose');
    expect(error).toBeNull();
    const seen = new Set<string>();
    for (const r of (data || []) as { prep_product_id: number; rm_item_id: number; purpose: string }[]) {
      const key = `${r.prep_product_id}|${r.rm_item_id}|${r.purpose}`;
      expect(seen.has(key), `Duplicate recipe line: ${key}`).toBe(false);
      seen.add(key);
    }
  });
});

test.describe('production.rm_items FK integrity', () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    test.skip(!SUPABASE_URL || !SUPABASE_KEY, 'Supabase env vars not set — skipping data tests');
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  });

  test('all prep_recipes.rm_item_id reference an existing rm_item', async () => {
    // Fetch joined data — if FK is violated Supabase returns null for the join
    const { data, error } = await supabase
      .schema('production')
      .from('prep_recipes')
      .select('rm_item_id, rm_items(id)');
    expect(error).toBeNull();
    for (const r of (data || []) as { rm_item_id: number; rm_items: unknown }[]) {
      expect(r.rm_items, `rm_item_id ${r.rm_item_id} has no matching rm_items row`).not.toBeNull();
    }
  });
});
