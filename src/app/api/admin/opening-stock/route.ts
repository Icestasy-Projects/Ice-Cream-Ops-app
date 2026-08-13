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

// Opening stock values — name must match rm_items.name (case-insensitive)
const OPENING_STOCK: { name: string; qty: number }[] = [
  { name: 'Sugar',               qty: 24 },
  { name: 'Base',                qty: 11 },
  { name: 'White Butter',        qty: 8.6 },
  { name: 'Khoa',                qty: 0.65 },
  { name: 'Elaichi Powder',      qty: 0.1 },
  { name: 'Sitaphal',            qty: 3.9 },
  { name: 'Coffee Powder',       qty: 17 },
  { name: 'Mango Pulp',          qty: 120.9 },
  { name: 'Ghee',                qty: 37 },
  { name: 'Besan',               qty: 8.1 },
  { name: 'Maida',               qty: 0.35 },
  { name: 'Jaggery',             qty: 59.5 },
  { name: 'Coconut Butter',      qty: 40 },
  { name: 'Shredded Coconut',    qty: 23 },
  { name: 'Tender Coconut',      qty: 5 },
  { name: 'CEC Vanilla',         qty: 7.5 },
  { name: 'Vanilla Powder',      qty: 0.8 },
  { name: 'Dark Chocolate Slab', qty: 21.5 },
  { name: 'JB 800 Cocoa Powder', qty: 8.5 },
  { name: 'Cream',               qty: 28 },
  { name: 'Gulkand',             qty: 51 },
  { name: 'Dried Rose Petals',   qty: 1.5 },
  { name: 'Cashew Butter',       qty: 40.45 },
  { name: 'Tukda Kaju',          qty: 11.5 },
  { name: 'Fennel Seeds',        qty: 4 },
  { name: 'Orange Paste',        qty: 0.2 },
  { name: 'Saffron',             qty: 0.025 },
  { name: 'Almonds',             qty: 13.8 },
  { name: 'Black Sesame',        qty: 5.7 },
  { name: 'Honey',               qty: 2.5 },
];

export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = adminClient();

    // ── Step 1: Wipe all RM and prep/FG stock ledgers ──────────────────────
    const wipeTables = [
      ['production', 'rm_purchase_order_lines'],
      ['production', 'rm_purchase_orders'],
      ['production', 'prep_units'],
      ['production', 'fg_units'],
    ];
    // Also try ledger tables (may not exist, errors silently ignored)
    const optionalTables = [
      ['production', 'rm_ledger'],
      ['production', 'prep_ledger'],
      ['production', 'fg_ledger'],
    ];
    for (const [schema, table] of [...wipeTables, ...optionalTables]) {
      await admin.schema(schema).from(table).delete().neq('id', 0);
    }

    // ── Step 2: Fetch all rm_items to match names → ids ───────────────────
    const { data: rmItems, error: rmErr } = await admin.schema('production')
      .from('rm_items').select('id, name');
    if (rmErr) return NextResponse.json({ error: rmErr.message }, { status: 500 });

    const nameToId = new Map<string, number>(
      (rmItems as { id: number; name: string }[]).map(r => [r.name.toLowerCase().trim(), r.id])
    );

    // ── Step 3: Find or create "Opening Stock" vendor ─────────────────────
    const vendorName = 'Opening Stock';
    let { data: vendorRow } = await admin.schema('production').from('vendors')
      .select('id').ilike('name', vendorName).single();
    if (!vendorRow) {
      const { data: newVendor } = await admin.schema('production').from('vendors')
        .insert({ name: vendorName, status: 'active' }).select('id').single();
      vendorRow = newVendor;
    }
    const vendorId = vendorRow?.id;
    if (!vendorId) return NextResponse.json({ error: 'Could not find or create Opening Stock vendor' }, { status: 500 });

    // ── Step 4: Create a single "received" purchase order ─────────────────
    const { data: poRow, error: poErr } = await admin.schema('production').from('rm_purchase_orders')
      .insert({
        vendor_id: vendorId,
        ordered_at: new Date().toISOString(),
        status: 'received',
        note: 'Opening stock — Aug 2026 physical count',
        created_by: user.id,
      }).select('id').single();
    if (poErr) return NextResponse.json({ error: poErr.message }, { status: 500 });

    const orderId = poRow.id;

    // ── Step 5: Insert lines for each item with stock > 0 ─────────────────
    const notFound: string[] = [];
    const inserted: string[] = [];

    for (const item of OPENING_STOCK) {
      const rmId = nameToId.get(item.name.toLowerCase().trim());
      if (!rmId) {
        notFound.push(item.name);
        continue;
      }
      const { error: lineErr } = await admin.schema('production').from('rm_purchase_order_lines').insert({
        order_id: orderId,
        rm_item_id: rmId,
        qty_ordered: item.qty,
        qty_received: item.qty,
        unit_cost: null,
        status: 'received',
      });
      if (lineErr) notFound.push(`${item.name}: ${lineErr.message}`);
      else inserted.push(item.name);
    }

    return NextResponse.json({ ok: true, inserted, notFound, orderId });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
