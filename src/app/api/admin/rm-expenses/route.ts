import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

// GET /api/admin/rm-expenses
// Returns RM consumption cross-referenced with average PO receipt rates.
// Rate priority: (1) average unit_cost from received PO lines, (2) cost_sheet rate, (3) rm_costs manual rate.
export async function GET() {
  try {
    const admin = adminClient();

    // Sum all RM consumed in prep
    const { data: ledger, error: ledgerErr } = await admin
      .schema('production')
      .from('rm_ledger')
      .select('rm_item_id, qty_delta')
      .eq('movement', 'issue_to_prep');

    if (ledgerErr) return NextResponse.json({ error: ledgerErr.message }, { status: 500 });

    const consumed = new Map<number, number>();
    for (const row of (ledger || [])) {
      consumed.set(row.rm_item_id, (consumed.get(row.rm_item_id) ?? 0) + Math.abs(row.qty_delta));
    }

    if (consumed.size === 0) return NextResponse.json({ items: [] });

    const rmIds = Array.from(consumed.keys());

    // Fetch rm_items names and units
    const { data: rmItems, error: rmErr } = await admin
      .schema('production')
      .from('rm_items')
      .select('id, name, unit')
      .in('id', rmIds);

    if (rmErr) return NextResponse.json({ error: rmErr.message }, { status: 500 });

    const rmMap = new Map<number, { name: string; unit: string }>(
      (rmItems || []).map((r: { id: number; name: string; unit: string }) => [r.id, { name: r.name, unit: r.unit }])
    );

    // (1) Average unit_cost from all received PO lines per item
    const { data: poLines } = await admin
      .schema('production')
      .from('rm_purchase_order_lines')
      .select('rm_item_id, unit_cost')
      .in('rm_item_id', rmIds)
      .not('unit_cost', 'is', null);

    const poTotals = new Map<number, { sum: number; count: number }>();
    for (const l of (poLines || [])) {
      const cur = poTotals.get(l.rm_item_id) ?? { sum: 0, count: 0 };
      poTotals.set(l.rm_item_id, { sum: cur.sum + (l.unit_cost as number), count: cur.count + 1 });
    }
    const poAvgMap = new Map<number, number>();
    for (const [id, { sum, count }] of poTotals) {
      poAvgMap.set(id, sum / count);
    }

    // (2) cost_sheet rates as fallback (keyed by ingredient name)
    const { data: costSheet } = await admin
      .schema('production')
      .from('cost_sheet')
      .select('ingredient, rate, rate_unit');

    const csRateMap = new Map<string, { rate: number; unit: string }>();
    for (const cs of (costSheet || [])) {
      if (cs.rate != null && !csRateMap.has(cs.ingredient)) {
        csRateMap.set(cs.ingredient, { rate: cs.rate, unit: cs.rate_unit });
      }
    }

    // (3) rm_costs manual rates as last fallback
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
      const unit = rm?.unit ?? '';

      // Pick rate by priority
      let rate: number | null = null;
      let rateUnit: string | null = null;
      let rateSource: string | null = null;

      const poAvg = poAvgMap.get(id);
      if (poAvg != null) {
        rate = Math.round(poAvg * 100) / 100;
        rateUnit = unit;
        rateSource = 'avg_po';
      } else {
        const cs = rm ? csRateMap.get(rm.name) : undefined;
        if (cs) {
          rate = cs.rate; rateUnit = cs.unit; rateSource = 'cost_sheet';
        } else {
          const rc = rmCostMap.get(id);
          if (rc) { rate = rc.rate; rateUnit = rc.unit; rateSource = 'manual'; }
        }
      }

      const estimatedSpend = rate != null ? Math.round(rate * totalConsumed * 100) / 100 : null;
      return {
        rm_item_id: id,
        ingredient: rm?.name ?? `RM #${id}`,
        total_consumed: totalConsumed,
        unit,
        rate,
        rate_unit: rateUnit,
        rate_source: rateSource,
        estimated_spend: estimatedSpend,
      };
    });

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
