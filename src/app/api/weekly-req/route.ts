import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

export interface WeeklyReqResponse {
  fg: Record<number, number>;    // fg_sku_id → weekly qty
  prep: Record<number, number>;  // prep_product_id → weekly batches
  rm: Record<number, number>;    // rm_item_id → weekly raw material qty
  source: 'orders' | 'dispatches';
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Step 1: weekly FG demand from sales.orders (last 42 days / 6 weeks) ─
    const since = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

    // Try sales.orders first; fall back to fg_dispatches if no data
    // order_lines.sku_id, order_lines.quantity, orders.created_at, orders.status
    const { data: orderLines } = await admin
      .schema('sales')
      .from('order_lines')
      .select('sku_id, quantity, orders!inner(created_at, status)')
      .gte('orders.created_at', since)
      .in('orders.status', ['approved', 'invoiced', 'in_production', 'dispatched', 'delivered']);

    let fgWeekly: Record<number, number> = {};
    let source: 'orders' | 'dispatches' = 'orders';

    if (orderLines && orderLines.length > 0) {
      // Aggregate from sales orders
      for (const line of orderLines) {
        const id = line.sku_id as number;
        fgWeekly[id] = (fgWeekly[id] || 0) + ((line.quantity as number) || 0);
      }
      for (const id in fgWeekly) {
        fgWeekly[id] = fgWeekly[id] / 6; // 6-week average → weekly
      }
    } else {
      // Fallback: use actual dispatch history
      source = 'dispatches';
      const { data: dispatchRows } = await admin
        .schema('production')
        .from('fg_dispatches')
        .select('fg_sku_id, qty')
        .gte('dispatched_at', since);

      for (const row of dispatchRows || []) {
        const id = row.fg_sku_id as number;
        fgWeekly[id] = (fgWeekly[id] || 0) + ((row.qty as number) || 0);
      }
      for (const id in fgWeekly) {
        fgWeekly[id] = fgWeekly[id] / 4;
      }
    }

    const skuIds = Object.keys(fgWeekly).map(Number);
    if (skuIds.length === 0) {
      return NextResponse.json({ fg: {}, prep: {}, rm: {}, source } satisfies WeeklyReqResponse);
    }

    // ── Step 2: map FG SKUs → prep products via flavour_id ────────────────
    const [skusRes, prepProdsRes, recipesRes] = await Promise.all([
      admin.schema('sales').from('skus')
        .select('id, flavour_id, pack_format_id')
        .in('id', skuIds),
      admin.schema('production').from('prep_products')
        .select('id, flavour_id, batch_yield_l'),
      admin.schema('production').from('prep_recipes')
        .select('prep_product_id, rm_item_id, qty_per_unit'),
    ]);

    // Pack format volumes (litres per FG unit)
    const packFormatIds = Array.from(new Set((skusRes.data || []).map((s: Record<string, unknown>) => s.pack_format_id as number)));
    const { data: packFormats } = await admin.schema('sales').from('pack_formats')
      .select('id, unit_volume_ml, units_per_pack')
      .in('id', packFormatIds);

    const packVolMap = new Map<number, number>(
      (packFormats || []).map((p: Record<string, unknown>) => [
        p.id as number,
        ((p.unit_volume_ml as number) * (p.units_per_pack as number)) / 1000,
      ])
    );

    const flavourToPrepMap = new Map<number, { id: number; batch_yield_l: number }>();
    for (const pp of prepProdsRes.data || []) {
      const r = pp as Record<string, unknown>;
      flavourToPrepMap.set(r.flavour_id as number, {
        id: r.id as number,
        batch_yield_l: (r.batch_yield_l as number) || 1,
      });
    }

    // ── Step 3: compute prep weekly batches from FG demand ────────────────
    const prepWeekly: Record<number, number> = {};

    for (const sku of skusRes.data || []) {
      const s = sku as Record<string, unknown>;
      const skuId = s.id as number;
      const weeklyQty = fgWeekly[skuId] || 0;
      if (weeklyQty === 0) continue;

      const litresPerUnit = packVolMap.get(s.pack_format_id as number) || 0;
      const weeklyLitres = weeklyQty * litresPerUnit;

      const prep = flavourToPrepMap.get(s.flavour_id as number);
      if (!prep) continue;

      const weeklyBatches = weeklyLitres / (prep.batch_yield_l || 1);
      prepWeekly[prep.id] = (prepWeekly[prep.id] || 0) + weeklyBatches;
    }

    // ── Step 4: compute RM weekly requirement from prep batches × recipe ──
    const rmWeekly: Record<number, number> = {};

    for (const recipe of recipesRes.data || []) {
      const r = recipe as Record<string, unknown>;
      const prepId = r.prep_product_id as number;
      const rmId = r.rm_item_id as number;
      const qtyPerUnit = (r.qty_per_unit as number) || 0;

      const weeklyBatches = prepWeekly[prepId] || 0;
      if (weeklyBatches === 0) continue;

      rmWeekly[rmId] = (rmWeekly[rmId] || 0) + weeklyBatches * qtyPerUnit;
    }

    return NextResponse.json({ fg: fgWeekly, prep: prepWeekly, rm: rmWeekly, source } satisfies WeeklyReqResponse);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
