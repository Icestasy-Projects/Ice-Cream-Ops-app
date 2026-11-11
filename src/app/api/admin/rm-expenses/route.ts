import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

// GET /api/admin/rm-expenses
// Returns RM consumption (from rm_ledger issue_to_prep movements) cross-referenced with cost_sheet rates
export async function GET() {
  try {
    const admin = adminClient();

    // Sum all RM consumed in prep (negative qty_delta = consumed)
    const { data: ledger, error: ledgerErr } = await admin
      .schema('production')
      .from('rm_ledger')
      .select('rm_item_id, qty_delta')
      .eq('movement', 'issue_to_prep');

    if (ledgerErr) return NextResponse.json({ error: ledgerErr.message }, { status: 500 });

    // Aggregate by rm_item_id
    const consumed = new Map<number, number>();
    for (const row of (ledger || [])) {
      const current = consumed.get(row.rm_item_id) ?? 0;
      // qty_delta is negative for consumption
      consumed.set(row.rm_item_id, current + Math.abs(row.qty_delta));
    }

    if (consumed.size === 0) {
      return NextResponse.json({ items: [] });
    }

    // Fetch rm_items names and units
    const rmIds = Array.from(consumed.keys());
    const { data: rmItems, error: rmErr } = await admin
      .schema('production')
      .from('rm_items')
      .select('id, name, unit')
      .in('id', rmIds);

    if (rmErr) return NextResponse.json({ error: rmErr.message }, { status: 500 });

    const rmMap = new Map<number, { name: string; unit: string }>(
      (rmItems || []).map((r: { id: number; name: string; unit: string }) => [r.id, { name: r.name, unit: r.unit }])
    );

    // Fetch cost_sheet rates (use first matching ingredient name, averaged if multiple)
    const { data: costSheet } = await admin
      .schema('production')
      .from('cost_sheet')
      .select('ingredient, rate, rate_unit');

    const rateMap = new Map<string, { rate: number; unit: string }>();
    for (const cs of (costSheet || [])) {
      if (cs.rate != null && !rateMap.has(cs.ingredient)) {
        rateMap.set(cs.ingredient, { rate: cs.rate, unit: cs.rate_unit });
      }
    }

    // Fetch rm_costs as fallback (most recent effective rate per rm_item_id)
    const { data: rmCosts } = await admin
      .schema('production')
      .from('rm_costs')
      .select('rm_item_id, rate, rate_uom, effective_from')
      .in('rm_item_id', rmIds)
      .order('effective_from', { ascending: false });

    const rmCostMap = new Map<number, { rate: number; unit: string }>();
    for (const rc of (rmCosts || [])) {
      if (rc.rate != null && !rmCostMap.has(rc.rm_item_id)) {
        rmCostMap.set(rc.rm_item_id, { rate: rc.rate, unit: rc.rate_uom ?? '' });
      }
    }

    const items = rmIds.map(id => {
      const rm = rmMap.get(id);
      const totalConsumed = consumed.get(id) ?? 0;
      // Prefer cost_sheet rate; fall back to rm_costs rate
      const rateData = (rm ? rateMap.get(rm.name) : undefined) ?? rmCostMap.get(id);
      const estimatedSpend = rateData ? rateData.rate * totalConsumed : null;
      return {
        rm_item_id: id,
        ingredient: rm?.name ?? `RM #${id}`,
        total_consumed: totalConsumed,
        unit: rm?.unit ?? '',
        rate: rateData?.rate ?? null,
        rate_unit: rateData?.unit ?? null,
        estimated_spend: estimatedSpend,
      };
    });

    // Sort by estimated spend desc
    items.sort((a, b) => (b.estimated_spend ?? -1) - (a.estimated_spend ?? -1));

    return NextResponse.json({ items });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// PATCH /api/admin/rm-expenses — set a manual rate for an RM item in rm_costs
export async function PATCH(req: Request) {
  try {
    const { rm_item_id, rate, rate_uom } = await req.json();
    if (!rm_item_id || rate == null) {
      return NextResponse.json({ error: 'rm_item_id and rate are required' }, { status: 400 });
    }
    const admin = adminClient();
    // Upsert: replace any existing open-ended rate for this item
    const today = new Date().toISOString().slice(0, 10);
    // Delete any existing entry for this item on today to avoid duplicates
    await admin
      .schema('production')
      .from('rm_costs')
      .delete()
      .eq('rm_item_id', rm_item_id)
      .eq('effective_from', today);
    const { error } = await admin
      .schema('production')
      .from('rm_costs')
      .insert({ rm_item_id, rate, rate_uom: rate_uom || 'Kg', effective_from: today });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
