import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

// Opening stock values keyed by rm_item_id (matched from DB)
const OPENING_STOCK: { id: number; qty: number }[] = [
  { id: 1,  qty: 24 },       // Sugar (kg)
  { id: 2,  qty: 11 },       // Base (l)
  { id: 3,  qty: 8.6 },      // White Butter (kg)
  { id: 4,  qty: 0.65 },     // Khoa (kg)
  { id: 5,  qty: 100 },      // Elaichi Powder (g)
  { id: 7,  qty: 3.9 },      // Sitaphal (kg)
  { id: 11, qty: 17 },       // Coffee Powder (kg)
  { id: 12, qty: 120.9 },    // Mango Pulp (kg)
  { id: 13, qty: 37 },       // Ghee (l)
  { id: 14, qty: 8.1 },      // Besan (kg)
  { id: 15, qty: 0.35 },     // Maida (kg)
  { id: 16, qty: 59.5 },     // Jaggery (kg)
  { id: 17, qty: 40 },       // Coconut Butter (kg)
  { id: 18, qty: 23 },       // Shredded Coconut (kg)
  { id: 19, qty: 5 },        // Tender Coconut (kg)
  { id: 21, qty: 7500 },     // CEC Vanilla (g)
  { id: 22, qty: 800 },      // Vanilla Powder (g)
  { id: 24, qty: 21.5 },     // Dark Chocolate Slab (kg)
  { id: 25, qty: 8.5 },      // JB 800 Cocoa Powder (kg)
  { id: 28, qty: 28 },       // Cream (l)
  { id: 29, qty: 51 },       // Gulqand (kg)
  { id: 30, qty: 1.5 },      // Dried Rose Petals (kg)
  { id: 31, qty: 40.45 },    // Cashew Butter (kg)
  { id: 32, qty: 11.5 },     // Tukda Kaju (kg)
  { id: 34, qty: 4000 },     // Fennel Seeds (g)
  { id: 36, qty: 0.2 },      // Orange Paste (kg)
  { id: 38, qty: 25 },       // Saffron (g)
  { id: 39, qty: 13.8 },     // Almonds (kg)
  { id: 40, qty: 5.7 },      // Black Sesame (kg)
  { id: 41, qty: 2.5 },      // Honey (kg)
];

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = adminClient();

    // ── Step 1: Wipe ALL stock tables including ledgers ────────────────────
    const tables = [
      'rm_purchase_order_lines',
      'rm_purchase_orders',
      'rm_ledger',
      'prep_units',
      'prep_ledger',
      'fg_units',
      'fg_ledger',
    ];
    for (const table of tables) {
      await admin.schema('production').from(table).delete().neq('id', 0);
    }

    // ── Step 2: Find or create "Opening Stock" vendor ─────────────────────
    let { data: vendorRow } = await admin.schema('production').from('vendors')
      .select('id').ilike('name', 'Opening Stock').single();
    if (!vendorRow) {
      const { data: newVendor } = await admin.schema('production').from('vendors')
        .insert({ name: 'Opening Stock', is_registered: false, status: 'active' })
        .select('id').single();
      vendorRow = newVendor;
    }
    const vendorId = vendorRow?.id;
    if (!vendorId) return NextResponse.json({ error: 'Could not find or create Opening Stock vendor' }, { status: 500 });

    // ── Step 3: Create opening stock purchase order ────────────────────────
    const { data: poRow, error: poErr } = await admin.schema('production').from('rm_purchase_orders')
      .insert({
        vendor_id: vendorId,
        ordered_at: new Date().toISOString(),
        status: 'received',
        note: 'Opening stock — Aug 2026 physical count',
      }).select('id').single();
    if (poErr) return NextResponse.json({ error: poErr.message }, { status: 500 });

    const orderId = poRow.id;

    // ── Step 4: Insert lines (triggers will populate rm_ledger) ───────────
    const lines = OPENING_STOCK.map(item => ({
      order_id: orderId,
      rm_item_id: item.id,
      qty_ordered: item.qty,
      qty_received: item.qty,
      unit_cost: null,
      status: 'received',
    }));

    const { error: linesErr } = await admin.schema('production')
      .from('rm_purchase_order_lines').insert(lines);
    if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, itemsLoaded: lines.length, orderId });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
