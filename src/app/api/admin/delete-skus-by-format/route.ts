/**
 * One-time admin utility: find and delete SKUs whose pack format name
 * matches the supplied list, along with their ledger entries.
 *
 * GET  → dry-run: returns what WOULD be deleted (no changes)
 * POST → actually deletes (add ?confirm=yes to proceed)
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// Pack format names to remove
const TARGET_FORMATS = ['B2B Add-On', 'Extras'];

async function findTargets(admin: ReturnType<typeof createSupabaseClient>) {
  // 1. Find matching pack formats
  const { data: formats, error: fmtErr } = await admin
    .schema('sales').from('pack_formats')
    .select('id, name')
    .in('name', TARGET_FORMATS);
  if (fmtErr) throw new Error(`pack_formats query: ${fmtErr.message}`);

  const formatIds = (formats || []).map((f: Record<string, unknown>) => f.id as number);
  if (formatIds.length === 0) return { formats: [], skus: [], fg_skus: [] };

  // 2. Find sales.skus using those formats
  const { data: skus, error: skuErr } = await admin
    .schema('sales').from('skus')
    .select('id, flavour_id, pack_format_id, name')
    .in('pack_format_id', formatIds);
  if (skuErr) throw new Error(`sales.skus query: ${skuErr.message}`);

  const skuIds = (skus || []).map((s: Record<string, unknown>) => s.id as number);

  // 3. Find production fg_stock entries (fg_sku_id maps to sales.skus.id)
  let fgStock: Record<string, unknown>[] = [];
  if (skuIds.length > 0) {
    const { data: fg, error: fgErr } = await admin
      .schema('production').from('v_fg_stock')
      .select('fg_sku_id, product_name, unit, qty_on_hand')
      .in('fg_sku_id', skuIds);
    if (fgErr) throw new Error(`v_fg_stock query: ${fgErr.message}`);
    fgStock = (fg || []) as Record<string, unknown>[];
  }

  return {
    formats: (formats || []) as Record<string, unknown>[],
    skus: (skus || []) as Record<string, unknown>[],
    fg_skus: fgStock,
  };
}

// GET — dry run, show what would be deleted
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const targets = await findTargets(admin);

    return NextResponse.json({
      dry_run: true,
      message: 'This is a preview. POST to ?confirm=yes to actually delete.',
      target_format_names: TARGET_FORMATS,
      would_delete: targets,
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

    const confirm = req.nextUrl.searchParams.get('confirm');
    if (confirm !== 'yes') {
      return NextResponse.json({ error: 'Add ?confirm=yes to the URL to proceed with deletion.' }, { status: 400 });
    }

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const targets = await findTargets(admin);

    if (targets.skus.length === 0 && targets.formats.length === 0) {
      return NextResponse.json({ message: 'Nothing to delete — formats not found.', targets });
    }

    const skuIds = targets.skus.map((s) => (s as Record<string, unknown>).id as number);
    const formatIds = targets.formats.map((f) => (f as Record<string, unknown>).id as number);
    const log: string[] = [];

    // Delete in dependency order
    if (skuIds.length > 0) {
      // Remove FG ledger entries referencing these SKUs
      const { error: ledgerErr, count: ledgerCount } = await admin
        .schema('production').from('fg_ledger')
        .delete()
        .in('fg_sku_id', skuIds)
        .select('id', { count: 'exact', head: true });
      if (ledgerErr) throw new Error(`fg_ledger delete: ${ledgerErr.message}`);
      log.push(`Deleted ~${ledgerCount ?? '?'} fg_ledger rows`);

      // Remove FG dispatch entries
      const { error: dispErr } = await admin
        .schema('production').from('fg_dispatches')
        .delete()
        .in('fg_sku_id', skuIds);
      if (dispErr) throw new Error(`fg_dispatches delete: ${dispErr.message}`);
      log.push('Cleared fg_dispatches for these SKUs');

      // Remove order_lines referencing these SKUs
      const { error: olErr } = await admin
        .schema('sales').from('order_lines')
        .delete()
        .in('sku_id', skuIds);
      if (olErr) throw new Error(`order_lines delete: ${olErr.message}`);
      log.push('Cleared order_lines for these SKUs');

      // Delete the SKUs themselves
      const { error: skuDelErr } = await admin
        .schema('sales').from('skus')
        .delete()
        .in('id', skuIds);
      if (skuDelErr) throw new Error(`sales.skus delete: ${skuDelErr.message}`);
      log.push(`Deleted ${skuIds.length} SKU(s) from sales.skus`);
    }

    // Delete the pack formats
    if (formatIds.length > 0) {
      const { error: fmtDelErr } = await admin
        .schema('sales').from('pack_formats')
        .delete()
        .in('id', formatIds);
      if (fmtDelErr) throw new Error(`pack_formats delete: ${fmtDelErr.message}`);
      log.push(`Deleted ${formatIds.length} pack format(s): ${TARGET_FORMATS.join(', ')}`);
    }

    return NextResponse.json({
      success: true,
      deleted: targets,
      log,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
