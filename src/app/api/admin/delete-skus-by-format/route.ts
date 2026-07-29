/**
 * Admin utility: delete FG SKUs whose unit name is "B2B Add-On" or "Extras",
 * along with all related ledger / dispatch / order_line / sales.skus records.
 *
 * GET  → dry-run: shows exactly what WOULD be deleted (no changes)
 * POST?confirm=yes → actually deletes
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

const TARGET_UNITS = ['B2B Add-On', 'Extras'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gatherTargets(admin: any) {
  // 1. Find production.fg_skus with those unit names
  const { data: fgSkus, error: fgErr } = await admin
    .schema('production').from('fg_skus')
    .select('fg_sku_id, product_name, unit')
    .in('unit', TARGET_UNITS);
  if (fgErr) throw new Error(`fg_skus query: ${fgErr.message}`);

  const fgSkuIds = (fgSkus || []).map((r: Record<string, unknown>) => r.fg_sku_id as number);

  // 2. Also find matching sales.skus (sku_id mirrors fg_sku_id) for cleanup
  let salesSkus: Record<string, unknown>[] = [];
  if (fgSkuIds.length > 0) {
    const { data: ss } = await admin.schema('sales').from('skus')
      .select('id, sku_code').in('id', fgSkuIds);
    salesSkus = (ss || []) as Record<string, unknown>[];
  }

  // 3. Stock snapshot
  let stockSnapshot: Record<string, unknown>[] = [];
  if (fgSkuIds.length > 0) {
    const { data: snap } = await admin.schema('production').from('v_fg_stock')
      .select('fg_sku_id, product_name, unit, qty_on_hand').in('fg_sku_id', fgSkuIds);
    stockSnapshot = (snap || []) as Record<string, unknown>[];
  }

  return { fgSkus: fgSkus || [], fgSkuIds, salesSkus, stockSnapshot };
}

// GET — dry run
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;
    const { fgSkus, salesSkus, stockSnapshot } = await gatherTargets(admin);

    return NextResponse.json({
      dry_run: true,
      message: 'Preview only — POST to ?confirm=yes to actually delete.',
      target_unit_names: TARGET_UNITS,
      would_delete: {
        fg_skus: fgSkus,
        sales_skus: salesSkus,
        current_stock: stockSnapshot,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST?confirm=yes — actually delete
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    if (req.nextUrl.searchParams.get('confirm') !== 'yes') {
      return NextResponse.json({ error: 'Add ?confirm=yes to the URL to proceed.' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;
    const { fgSkus, fgSkuIds, salesSkus } = await gatherTargets(admin);

    if (fgSkuIds.length === 0) {
      return NextResponse.json({ message: 'Nothing to delete — no matching SKUs found.' });
    }

    const log: string[] = [];

    // 1. Delete fg_ledger entries
    const { error: e1 } = await admin.schema('production').from('fg_ledger')
      .delete().in('fg_sku_id', fgSkuIds);
    if (e1) throw new Error(`fg_ledger delete: ${e1.message}`);
    log.push(`Cleared fg_ledger for ${fgSkuIds.length} SKU(s)`);

    // 2. Delete fg_dispatches entries
    const { error: e2 } = await admin.schema('production').from('fg_dispatches')
      .delete().in('fg_sku_id', fgSkuIds);
    if (e2) throw new Error(`fg_dispatches delete: ${e2.message}`);
    log.push(`Cleared fg_dispatches for ${fgSkuIds.length} SKU(s)`);

    // 3. Delete fg_units entries
    const { error: e3 } = await admin.schema('production').from('fg_units')
      .delete().in('fg_sku_id', fgSkuIds);
    if (e3) throw new Error(`fg_units delete: ${e3.message}`);
    log.push(`Cleared fg_units for ${fgSkuIds.length} SKU(s)`);

    // 4. Delete sales.order_lines referencing these SKU IDs
    const { error: e4 } = await admin.schema('sales').from('order_lines')
      .delete().in('sku_id', fgSkuIds);
    if (e4) throw new Error(`order_lines delete: ${e4.message}`);
    log.push(`Cleared order_lines for ${fgSkuIds.length} SKU(s)`);

    // 5. Delete sales.skus
    if (salesSkus.length > 0) {
      const { error: e5 } = await admin.schema('sales').from('skus')
        .delete().in('id', fgSkuIds);
      if (e5) throw new Error(`sales.skus delete: ${e5.message}`);
      log.push(`Deleted ${salesSkus.length} sales.skus record(s)`);
    }

    // 6. Delete production.fg_skus
    const { error: e6 } = await admin.schema('production').from('fg_skus')
      .delete().in('fg_sku_id', fgSkuIds);
    if (e6) throw new Error(`fg_skus delete: ${e6.message}`);
    log.push(`Deleted ${fgSkuIds.length} production.fg_skus record(s): ${TARGET_UNITS.join(', ')}`);

    return NextResponse.json({
      success: true,
      deleted_skus: fgSkus,
      log,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
