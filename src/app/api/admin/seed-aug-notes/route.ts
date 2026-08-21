import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// ─── DATA FROM HANDWRITTEN NOTES ─────────────────────────────────────────────

// Page 1 — Prep list (in 4L bulk tubs). num_batches = (bulkTubs × 4) / batch_yield_l
const PREP_BULK: [string, number][] = [
  ['Mysore Paak', 20],
  ['Tender Coconut', 15],
  ['Coffee', 20],
  ['Gulab Jamun', 20],
  ['Reshmi Paan', 20],
  ['Kaju Katti', 20],
  ['Salted Caramel', 20],
  ['Kesar Thandai', 20],
  ['Khajoor', 10],
];

// Page 1 — Order Received
const RM_RECEIVED: [string, number][] = [
  ['13% IPPL Base', 50],
  ['Sugar', 50],
  ['Kishmish', 1],
  ['Rose Water', 0.6],
  ['Paan', 8],
  ['Milk', 8],
  ['Khoa', 0.8],
  ['Tender Coconut', 8.5],
  ['Maida', 0.5],
];

// Page 1 — Partial stock items (set to target via adjustment)
const PAGE1_STOCK: [string, number][] = [
  ['Tukda Kaju', 5],
  ['Fennel Seeds', 2.1],
  ['Orange Paste', 0.2],
  ['Orange Peel', 2],
  ['Saffron', 0.015],
  ['Almond', 10],
  ['Black Sesame', 5.7],
  ['Honey', 4],
];

// Page 2 — Thursday 20/08/26 full stock count
const STOCK_COUNT_20AUG: [string, number][] = [
  ['Sugar', 43.8],
  ['13% IPPL Base', 12],
  ['White Butter', 10],
  ['Khoa', 0.38],
  ['Elaichi Powder', 0.3],
  ['High Fat Milk', 4],
  ['Sitaphal', 85],
  ['Biscoff', 104],
  ['Coffee Powder', 9],
  ['Mango Pulp', 109],
  ['Ghee', 27.64],
  ['Besan', 5.965],
  ['Maida', 0.724],
  ['Jaggery', 36],
  ['Coconut Butter', 28],
  ['Shredded Coconut', 17],
  ['Tender Coconut', 5],
  ['CEC Vanilla', 7.5],
  ['Vanilla Powder', 0.6],
  ['Dark Chocolate Slab', 18.3],
  ['JB 800 Cocoa Powder', 6.1],
  ['Choco Chip Cookie', 8],
  ['Cream', 21],
  ['Gulkand', 0.35],
  ['Dried Rose Petal', 2.8],
  ['Cashew Butter', 35],
];

export async function POST() {
  const db = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const s = () => db.schema('production');
  const log: string[] = [];

  async function fuzzyFind(namePart: string) {
    const { data } = await s().from('rm_items')
      .select('id, name, unit')
      .ilike('name', `%${namePart}%`)
      .limit(1);
    return (data?.[0] as { id: number; name: string; unit: string } | undefined) ?? null;
  }

  // ── 1. Prep Batches ────────────────────────────────────────────────────────
  log.push('=== PREP BATCHES ===');
  const { data: products } = await s().from('prep_products')
    .select('id, name, batch_yield_l').eq('status', 'active');

  for (const [flavour, bulkTubs] of PREP_BULK) {
    const product = (products || []).find((p: { name: string }) =>
      p.name.toLowerCase().includes(flavour.toLowerCase())
    ) as { id: number; name: string; batch_yield_l: number | null } | undefined;

    if (!product) { log.push(`⚠️  NOT FOUND: ${flavour}`); continue; }

    const batchYieldL = product.batch_yield_l ?? 20;
    const totalLitres = bulkTubs * 4;
    const numBatches = (totalLitres / batchYieldL).toFixed(1);

    const { error } = await s().from('prep_units').insert({
      prep_product_id: product.id,
      qty_produced: totalLitres,
      status: 'posted',
      note: `${bulkTubs} bulk tubs (${numBatches} batches × ${batchYieldL}L) — notes`,
    });

    if (error) log.push(`❌ ${product.name}: ${error.message}`);
    else log.push(`✅ ${product.name}: ${bulkTubs} bulk × 4L = ${totalLitres}L`);
  }

  // ── 2. RM Received ────────────────────────────────────────────────────────
  log.push('=== RM RECEIVED ===');
  const { data: vendors } = await s().from('vendors').select('id').ilike('name', 'Initial entry');
  const vendorId = (vendors?.[0] as { id: number } | undefined)?.id;

  if (!vendorId) {
    log.push('❌ No "Initial entry" vendor — skipping receipts');
  } else {
    for (const [namePart, qty] of RM_RECEIVED) {
      const item = await fuzzyFind(namePart);
      if (!item) { log.push(`⚠️  RM NOT FOUND: ${namePart}`); continue; }

      const { data: order, error: oErr } = await s().from('rm_purchase_orders').insert({
        vendor_id: vendorId,
        ordered_at: new Date().toISOString(),
        status: 'received',
        note: 'Page 1 notes — order received',
      }).select('id').single();

      if (oErr || !order) { log.push(`❌ PO for ${item.name}: ${oErr?.message}`); continue; }

      const { error: lineErr } = await s().from('rm_purchase_order_lines').insert({
        order_id: (order as { id: number }).id,
        rm_item_id: item.id,
        qty_ordered: qty,
        qty_received: qty,
        unit_cost: null,
      });

      if (lineErr) log.push(`❌ ${item.name}: ${lineErr.message}`);
      else log.push(`✅ Received ${qty} ${item.unit} of ${item.name}`);
    }
  }

  // ── 3. Stock Adjustments helper ───────────────────────────────────────────
  async function adjustStock(list: [string, number][], label: string) {
    log.push(`=== STOCK ADJUSTMENT: ${label} ===`);
    const { data: currentStock } = await s().from('v_rm_stock').select('rm_item_id, qty_on_hand');
    const stockMap = new Map<number, number>(
      ((currentStock || []) as Array<{ rm_item_id: number; qty_on_hand: number }>)
        .map(r => [r.rm_item_id, r.qty_on_hand])
    );

    for (const [namePart, targetQty] of list) {
      const item = await fuzzyFind(namePart);
      if (!item) { log.push(`⚠️  NOT FOUND: ${namePart}`); continue; }

      const currentQty = stockMap.get(item.id) ?? 0;
      const delta = targetQty - currentQty;

      if (Math.abs(delta) < 0.0001) {
        log.push(`─  ${item.name}: already ${targetQty} ${item.unit}`);
        continue;
      }

      await db.rpc('set_config' as never, {
        parameter: 'icestasy.ledger_write_allowed', value: '1', is_local: true
      } as never).catch(() => null);

      const { error } = await s().from('rm_ledger').insert({
        rm_item_id: item.id,
        qty_delta: delta,
        movement: 'adjustment',
        ref_table: null,
        ref_id: null,
        owner_id: null,
      });

      const sign = delta > 0 ? '+' : '';
      if (error) log.push(`❌ ${item.name}: ${error.message}`);
      else log.push(`✅ ${item.name}: ${currentQty.toFixed(3)} → ${targetQty} ${item.unit} (${sign}${delta.toFixed(3)})`);
    }
  }

  await adjustStock(PAGE1_STOCK, 'page 1 partial stock');
  await adjustStock(STOCK_COUNT_20AUG, 'Thursday 20/08/26 full count');

  return NextResponse.json({ log });
}
