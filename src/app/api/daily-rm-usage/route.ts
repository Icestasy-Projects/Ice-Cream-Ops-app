import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// GET: list entries with variance counts
export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '30');

  const { data: entries, error } = await admin
    .schema('production')
    .from('daily_rm_entries')
    .select(`
      id, entry_date, status, notes, created_at,
      entered_by,
      daily_rm_variances(id, status)
    `)
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries });
}

// POST: submit daily RM usage and calculate variances
export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const body = await req.json();
  const { entry_date, lines, notes } = body as {
    entry_date: string;
    lines: { rm_item_id: number; qty_used: number }[];
    notes?: string;
  };

  if (!entry_date || !lines?.length) {
    return NextResponse.json({ error: 'entry_date and lines are required' }, { status: 400 });
  }

  const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const s = () => admin.schema('production');

  // 1. Create entry (upsert in case they re-submit same date)
  const { data: entry, error: entryErr } = await s()
    .from('daily_rm_entries')
    .upsert({ entry_date, entered_by: user.id, status: 'submitted', notes: notes || null },
      { onConflict: 'entry_date,entered_by' })
    .select('id')
    .single();
  if (entryErr || !entry) return NextResponse.json({ error: entryErr?.message || 'Failed to create entry' }, { status: 500 });

  const entryId = (entry as { id: number }).id;

  // Delete old lines and variances (re-submission)
  await s().from('daily_rm_entry_lines').delete().eq('entry_id', entryId);
  await s().from('daily_rm_variances').delete().eq('entry_id', entryId);

  // 2. Insert lines
  const { error: linesErr } = await s().from('daily_rm_entry_lines').insert(
    lines.map(l => ({ entry_id: entryId, rm_item_id: l.rm_item_id, qty_used: l.qty_used }))
  );
  if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });

  // 3. Calculate expected RM usage from prep_units on that date
  const { data: prepUnits } = await s()
    .from('prep_units')
    .select('id, prep_product_id, qty_produced, prep_products(batch_yield_l)')
    .eq('status', 'posted')
    .gte('created_at', `${entry_date}T00:00:00`)
    .lte('created_at', `${entry_date}T23:59:59`);

  // Build expected RM map: rm_item_id → expected qty
  const expectedMap = new Map<number, number>();

  for (const pu of (prepUnits || []) as Array<{
    prep_product_id: number;
    qty_produced: number;
    prep_products: { batch_yield_l: number | null } | null;
  }>) {
    const batchYield = pu.prep_products?.batch_yield_l ?? 20;
    const numBatches = pu.qty_produced / batchYield;

    const { data: recipe } = await s()
      .from('prep_recipes')
      .select('rm_item_id, qty_per_unit')
      .eq('prep_product_id', pu.prep_product_id);

    for (const r of (recipe || []) as Array<{ rm_item_id: number; qty_per_unit: number }>) {
      const prev = expectedMap.get(r.rm_item_id) ?? 0;
      expectedMap.set(r.rm_item_id, prev + r.qty_per_unit * numBatches);
    }
  }

  // 4. Build actual RM map from submitted lines
  const actualMap = new Map<number, number>(lines.map(l => [l.rm_item_id, l.qty_used]));

  // 5. Compute variances
  const variances: Array<{
    entry_id: number;
    entry_date: string;
    rm_item_id: number;
    expected_qty: number;
    actual_qty: number;
    variance: number;
    variance_type: string;
  }> = [];

  // Items in actual (check overuse / underuse vs expected)
  for (const [rmId, actualQty] of actualMap) {
    const expectedQty = expectedMap.get(rmId) ?? 0;
    const variance = actualQty - expectedQty;
    if (Math.abs(variance) < 0.0001) continue;
    variances.push({
      entry_id: entryId,
      entry_date,
      rm_item_id: rmId,
      expected_qty: expectedQty,
      actual_qty: actualQty,
      variance,
      variance_type: variance > 0 ? 'overuse' : 'underuse',
    });
  }

  // Items expected but not in actual (unaccounted prep)
  for (const [rmId, expectedQty] of expectedMap) {
    if (actualMap.has(rmId)) continue;
    if (expectedQty < 0.0001) continue;
    variances.push({
      entry_id: entryId,
      entry_date,
      rm_item_id: rmId,
      expected_qty: expectedQty,
      actual_qty: 0,
      variance: -expectedQty,
      variance_type: 'unaccounted_prep',
    });
  }

  if (variances.length > 0) {
    await s().from('daily_rm_variances').insert(variances);
  }

  return NextResponse.json({
    entry_id: entryId,
    variance_count: variances.length,
    variances,
  });
}
