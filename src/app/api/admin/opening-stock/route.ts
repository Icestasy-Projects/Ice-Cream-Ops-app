import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { items } = await req.json() as { items: { id: number; qty: number }[] };
    if (!items?.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

    const admin = adminClient();

    // ── Step 1: Wipe all RM ledger entries (via rm_receipts cascade) ──────
    // Delete rm_receipts — cascade deletes rm_receipt_lines → triggers reverse ledger entries
    await admin.schema('production').from('rm_receipt_lines').delete().neq('id', 0);
    await admin.schema('production').from('rm_receipts').delete().neq('id', 0);
    // Also wipe prep and FG history so nothing carries forward
    await admin.schema('production').from('prep_units').delete().neq('id', 0);
    await admin.schema('production').from('fg_units').delete().neq('id', 0);

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

    // ── Step 3: Create receipt record ─────────────────────────────────────
    const { data: receiptRow, error: receiptErr } = await admin.schema('production').from('rm_receipts')
      .insert({
        source_type: 'vendor',
        vendor_id: vendorId,
        received_by: user.id,
        received_at: new Date().toISOString(),
        status: 'posted',
        note: `Opening stock — ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      }).select('id').single();
    if (receiptErr) return NextResponse.json({ error: receiptErr.message }, { status: 500 });

    const receiptId = receiptRow.id;

    // ── Step 4: Insert lines — triggers auto-populate rm_ledger ──────────
    const lines = items.map(item => ({
      receipt_id: receiptId,
      rm_item_id: item.id,
      qty: item.qty,
      unit_cost: null,
    }));

    const { error: linesErr } = await admin.schema('production')
      .from('rm_receipt_lines').insert(lines);
    if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, itemsLoaded: lines.length, receiptId });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
