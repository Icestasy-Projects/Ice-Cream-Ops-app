/**
 * GET /api/weekly-req/audit
 * Returns the full step-by-step calculation trace for weekly requirements
 * across FG → Prep → RM, with warnings for any broken links or zero values.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const since = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();
    const generatedAt = new Date().toISOString();

    // ── Raw data fetch (same as weekly-req route) ─────────────────────────
    const [
      orderLinesRes, skusRes, packFormatsRes,
      prepProdsRes, recipesRes, rmItemsRes,
      fgStockRes, prepStockRes, rmStockRes,
    ] = await Promise.all([
      admin.schema('sales').from('order_lines')
        .select('sku_id, quantity, orders!inner(created_at, status)')
        .gte('orders.created_at', since)
        .in('orders.status', ['approved', 'invoiced', 'in_production', 'dispatched', 'delivered']),
      admin.schema('sales').from('skus').select('id, name, flavour_id, pack_format_id'),
      admin.schema('sales').from('pack_formats').select('id, name, unit_volume_ml, units_per_pack'),
      admin.schema('production').from('prep_products').select('id, name, flavour_id, batch_yield_l, unit'),
      admin.schema('production').from('prep_recipes').select('prep_product_id, rm_item_id, qty_per_unit'),
      admin.schema('production').from('rm_items').select('id, name, unit, category_id'),
      admin.schema('production').from('v_fg_stock').select('fg_sku_id, product_name, unit, qty_on_hand'),
      admin.schema('production').from('v_prep_stock').select('prep_product_id, product_name, unit, qty_total'),
      admin.schema('production').from('v_rm_stock').select('rm_item_id, ingredient_name, unit, qty_on_hand'),
    ]);

    // ── Build lookup maps ─────────────────────────────────────────────────
    type R = Record<string, unknown>;
    const skuMap = new Map<number, R>((skusRes.data || []).map((s: R) => [s.id as number, s]));
    const packMap = new Map<number, R>((packFormatsRes.data || []).map((p: R) => [p.id as number, p]));
    const prepMap = new Map<number, R>((prepProdsRes.data || []).map((p: R) => [p.id as number, p]));
    const rmMap  = new Map<number, R>((rmItemsRes.data || []).map((r: R) => [r.id as number, r]));

    // flavour_id → prep_product
    const flavourToPrepMap = new Map<number, R>();
    for (const pp of prepProdsRes.data || []) {
      const r = pp as R;
      if (r.flavour_id) flavourToPrepMap.set(r.flavour_id as number, r);
    }

    // fg_sku_id → stock
    const fgStockMap = new Map<number, R>((fgStockRes.data || []).map((r: R) => [r.fg_sku_id as number, r]));
    // prep_product_id → stock
    const prepStockMap = new Map<number, R>((prepStockRes.data || []).map((r: R) => [r.prep_product_id as number, r]));
    // rm_item_id → stock
    const rmStockMap = new Map<number, R>((rmStockRes.data || []).map((r: R) => [r.rm_item_id as number, r]));

    // ── Step 1: FG weekly demand ──────────────────────────────────────────
    const fgRawTotals: Record<number, number> = {};
    const fgOrderCount: Record<number, number> = {};

    for (const line of orderLinesRes.data || []) {
      const l = line as R;
      const id = l.sku_id as number;
      fgRawTotals[id] = (fgRawTotals[id] || 0) + ((l.quantity as number) || 0);
      fgOrderCount[id] = (fgOrderCount[id] || 0) + 1;
    }

    type FgAuditRow = {
      sku_id: number;
      sku_name: string;
      pack_format: string;
      unit_volume_ml: number;
      units_per_pack: number;
      litres_per_fg_unit: number;
      total_ordered_42d: number;
      order_line_count: number;
      weekly_req: number;
      threshold: number;
      on_hand: number;
      status: 'ok' | 'low' | 'critical' | 'unknown';
      warnings: string[];
      // prep linkage
      flavour_id: number | null;
      prep_product_name: string | null;
      prep_product_id: number | null;
      weekly_litres_needed: number;
      weekly_batches_needed: number;
      batch_yield_l: number | null;
    };

    const fgAudit: FgAuditRow[] = [];
    const warnings: string[] = [];

    // Accumulate prep demand
    const prepDemand: Record<number, { batches: number; contributors: string[] }> = {};

    for (const [skuId, rawTotal] of Object.entries(fgRawTotals)) {
      const id = Number(skuId);
      const sku = skuMap.get(id) as R | undefined;
      const rowWarnings: string[] = [];

      if (!sku) { rowWarnings.push(`SKU #${id} not found in sales.skus`); warnings.push(`FG SKU #${id}: not found in sales.skus`); }

      const packFmtId = sku?.pack_format_id as number | undefined;
      const pack = packFmtId ? packMap.get(packFmtId) : undefined;
      if (!pack) { rowWarnings.push(`No pack_format found (pack_format_id=${packFmtId})`); warnings.push(`FG SKU #${id} (${sku?.name}): missing pack format`); }

      const unitVolMl = (pack?.unit_volume_ml as number) || 0;
      const unitsPerPack = (pack?.units_per_pack as number) || 0;
      const litresPerUnit = (unitVolMl * unitsPerPack) / 1000;
      if (litresPerUnit === 0 && pack) { rowWarnings.push(`pack_format has 0 volume (unit_volume_ml=${unitVolMl}, units_per_pack=${unitsPerPack})`); }

      const weeklyReq = Math.ceil(rawTotal / 6);
      const threshold = Math.ceil(weeklyReq * 2.5);
      const stock = fgStockMap.get(id);
      const onHand = (stock?.qty_on_hand as number) || 0;
      const status = !weeklyReq ? 'unknown'
        : onHand < weeklyReq ? 'critical'
        : onHand < threshold ? 'low' : 'ok';

      const flavourId = sku?.flavour_id as number | null ?? null;
      const prepProd = flavourId ? flavourToPrepMap.get(flavourId) : undefined;
      if (!prepProd && flavourId) {
        rowWarnings.push(`No prep_product mapped for flavour_id=${flavourId} — prep & RM reqs will be 0`);
        warnings.push(`FG SKU #${id} (${sku?.name}): flavour_id=${flavourId} has no prep_product`);
      }

      const weeklyLitres = weeklyReq * litresPerUnit;
      const batchYieldL = prepProd ? (prepProd.batch_yield_l as number) || 1 : null;
      const weeklyBatches = prepProd && batchYieldL ? weeklyLitres / batchYieldL : 0;

      if (prepProd) {
        const pid = prepProd.id as number;
        if (!prepDemand[pid]) prepDemand[pid] = { batches: 0, contributors: [] };
        prepDemand[pid].batches += weeklyBatches;
        prepDemand[pid].contributors.push(`${sku?.name || `SKU#${id}`} (${weeklyBatches.toFixed(2)} batches)`);
      }

      fgAudit.push({
        sku_id: id,
        sku_name: (sku?.name as string) || (stock?.product_name as string) || `SKU #${id}`,
        pack_format: (pack?.name as string) || '—',
        unit_volume_ml: unitVolMl,
        units_per_pack: unitsPerPack,
        litres_per_fg_unit: litresPerUnit,
        total_ordered_42d: rawTotal,
        order_line_count: fgOrderCount[id] || 0,
        weekly_req: weeklyReq,
        threshold,
        on_hand: onHand,
        status,
        warnings: rowWarnings,
        flavour_id: flavourId,
        prep_product_name: prepProd ? (prepProd.name as string) : null,
        prep_product_id: prepProd ? (prepProd.id as number) : null,
        weekly_litres_needed: weeklyLitres,
        weekly_batches_needed: weeklyBatches,
        batch_yield_l: batchYieldL,
      });
    }

    // ── Step 2: Prep audit ────────────────────────────────────────────────
    type PrepAuditRow = {
      prep_product_id: number;
      prep_product_name: string;
      batch_yield_l: number;
      weekly_batches_raw: number;
      weekly_batches_ceiled: number;
      threshold: number;
      on_hand: number;
      status: 'ok' | 'low' | 'critical' | 'unknown';
      contributors: string[];
      recipe_items: number;
      warnings: string[];
    };

    const prepAudit: PrepAuditRow[] = [];
    const rmDemand: Record<number, { qty: number; contributors: string[] }> = {};

    for (const [prepId, demand] of Object.entries(prepDemand)) {
      const pid = Number(prepId);
      const prep = prepMap.get(pid);
      const rowWarnings: string[] = [];

      const weeklyBatchesCeiled = Math.ceil(demand.batches);
      const threshold = Math.ceil(weeklyBatchesCeiled * 2.5);
      const stock = prepStockMap.get(pid);
      const onHand = (stock?.qty_total as number) || 0;
      const status = !weeklyBatchesCeiled ? 'unknown'
        : onHand < weeklyBatchesCeiled ? 'critical'
        : onHand < threshold ? 'low' : 'ok';

      // Find recipes
      const recipes = (recipesRes.data || []).filter((r: R) => (r as R).prep_product_id === pid) as R[];
      if (recipes.length === 0) {
        rowWarnings.push('No prep_recipe entries — RM requirements cannot be computed');
        warnings.push(`Prep product ${prep?.name || `#${pid}`}: has no recipe entries`);
      }

      for (const recipe of recipes) {
        const rmId = recipe.rm_item_id as number;
        const qtyPerUnit = (recipe.qty_per_unit as number) || 0;
        const rmQty = demand.batches * qtyPerUnit;
        if (!rmDemand[rmId]) rmDemand[rmId] = { qty: 0, contributors: [] };
        rmDemand[rmId].qty += rmQty;
        rmDemand[rmId].contributors.push(`${prep?.name || `#${pid}`} (${demand.batches.toFixed(2)} batches × ${qtyPerUnit})`);

        if (qtyPerUnit === 0) {
          rowWarnings.push(`Recipe for rm_item_id=${rmId} has qty_per_unit=0`);
          warnings.push(`Prep ${prep?.name}: recipe for RM #${rmId} has qty_per_unit=0`);
        }
        if (!rmMap.has(rmId)) {
          rowWarnings.push(`Recipe references rm_item_id=${rmId} which doesn't exist in rm_items`);
          warnings.push(`Prep ${prep?.name}: recipe references missing RM #${rmId}`);
        }
      }

      prepAudit.push({
        prep_product_id: pid,
        prep_product_name: (prep?.name as string) || `Prep #${pid}`,
        batch_yield_l: (prep?.batch_yield_l as number) || 0,
        weekly_batches_raw: demand.batches,
        weekly_batches_ceiled: weeklyBatchesCeiled,
        threshold,
        on_hand: onHand,
        status,
        contributors: demand.contributors,
        recipe_items: recipes.length,
        warnings: rowWarnings,
      });
    }

    // ── Step 3: RM audit ──────────────────────────────────────────────────
    type RmAuditRow = {
      rm_item_id: number;
      ingredient_name: string;
      unit: string;
      weekly_qty_raw: number;
      weekly_qty_ceiled: number;
      threshold: number;
      on_hand: number;
      status: 'ok' | 'low' | 'critical' | 'unknown';
      contributors: string[];
      warnings: string[];
    };

    const rmAudit: RmAuditRow[] = [];

    for (const [rmId, demand] of Object.entries(rmDemand)) {
      const id = Number(rmId);
      const rm = rmMap.get(id);
      const stock = rmStockMap.get(id);
      const rowWarnings: string[] = [];

      const weeklyQtyCeiled = Math.ceil(demand.qty);
      const threshold = Math.ceil(weeklyQtyCeiled * 2.5);
      const onHand = (stock?.qty_on_hand as number) || 0;
      const status = !weeklyQtyCeiled ? 'unknown'
        : onHand < weeklyQtyCeiled ? 'critical'
        : onHand < threshold ? 'low' : 'ok';

      if (!rm) rowWarnings.push(`rm_item_id=${id} not found in rm_items`);

      rmAudit.push({
        rm_item_id: id,
        ingredient_name: (rm?.name as string) || (stock?.ingredient_name as string) || `RM #${id}`,
        unit: (rm?.unit as string) || (stock?.unit as string) || '—',
        weekly_qty_raw: demand.qty,
        weekly_qty_ceiled: weeklyQtyCeiled,
        threshold,
        on_hand: onHand,
        status,
        contributors: demand.contributors,
        warnings: rowWarnings,
      });
    }

    // ── Summary ───────────────────────────────────────────────────────────
    const fgWithOrders = fgAudit.length;
    const fgWithoutPrepLink = fgAudit.filter(r => !r.prep_product_id).length;
    const totalWarnings = warnings.length;

    return NextResponse.json({
      generated_at: generatedAt,
      period_days: 42,
      source: 'sales.order_lines',
      summary: {
        fg_skus_with_orders: fgWithOrders,
        fg_skus_without_prep_link: fgWithoutPrepLink,
        prep_products_with_demand: prepAudit.length,
        rm_items_with_demand: rmAudit.length,
        total_warnings: totalWarnings,
      },
      warnings,
      fg: fgAudit.sort((a, b) => b.weekly_req - a.weekly_req),
      prep: prepAudit.sort((a, b) => b.weekly_batches_ceiled - a.weekly_batches_ceiled),
      rm: rmAudit.sort((a, b) => b.weekly_qty_ceiled - a.weekly_qty_ceiled),
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
