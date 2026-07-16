import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

const STATUS_SORT: Record<string, number> = { critical: 0, low: 1, ok: 2, '': 3 };

function statusLabel(s: string | null | undefined) {
  if (s === 'critical') return '🔴 Critical';
  if (s === 'low') return '🟡 Low';
  if (s === 'ok' || s === 'OK') return '🟢 OK';
  return '—';
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const since = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all data in parallel
    const [
      rmRes, prepRes, fgRes,
      prepProdsRes, catsRes, itemsRes,
      orderLinesRes, skusRes, packFormatsRes, prepRecipesRes,
    ] = await Promise.all([
      admin.schema('production').from('v_rm_stock').select('*').order('ingredient_name'),
      admin.schema('production').from('v_prep_stock').select('*').order('product_name'),
      admin.schema('production').from('v_fg_stock').select('*').order('product_name'),
      admin.schema('production').from('prep_products').select('id, flavour_id, batch_yield_l'),
      admin.schema('production').from('rm_categories').select('id, name'),
      admin.schema('production').from('rm_items').select('id, category_id'),
      admin.schema('sales').from('order_lines')
        .select('sku_id, quantity, orders!inner(created_at, status)')
        .gte('orders.created_at', since)
        .in('orders.status', ['approved', 'invoiced', 'in_production', 'dispatched', 'delivered']),
      admin.schema('sales').from('skus').select('id, flavour_id, pack_format_id'),
      admin.schema('sales').from('pack_formats').select('id, unit_volume_ml, units_per_pack'),
      admin.schema('production').from('prep_recipes').select('prep_product_id, rm_item_id, qty_per_unit'),
    ]);

    // Lookup maps
    const catMap = new Map<number, string>(
      (catsRes.data || []).map((c: Record<string, unknown>) => [c.id as number, c.name as string])
    );
    const itemCatMap = new Map<number, string>(
      (itemsRes.data || []).map((i: Record<string, unknown>) => [
        i.id as number, catMap.get(i.category_id as number) || 'Other',
      ])
    );
    const yieldMap = new Map<number, number>(
      (prepProdsRes.data || []).map((r: Record<string, unknown>) => [r.id as number, (r.batch_yield_l as number) || 0])
    );
    const packVolMap = new Map<number, number>(
      (packFormatsRes.data || []).map((p: Record<string, unknown>) => [
        p.id as number,
        ((p.unit_volume_ml as number) * (p.units_per_pack as number)) / 1000,
      ])
    );
    const flavourToPrepMap = new Map<number, { id: number; batch_yield_l: number }>();
    for (const pp of prepProdsRes.data || []) {
      const r = pp as Record<string, unknown>;
      flavourToPrepMap.set(r.flavour_id as number, { id: r.id as number, batch_yield_l: (r.batch_yield_l as number) || 1 });
    }

    // ── Replicate weekly-req calculation ──────────────────────────────────
    const fgWeekly: Record<number, number> = {};
    for (const line of orderLinesRes.data || []) {
      const id = line.sku_id as number;
      fgWeekly[id] = (fgWeekly[id] || 0) + ((line.quantity as number) || 0);
    }
    for (const id in fgWeekly) fgWeekly[id] = Math.ceil(fgWeekly[id] / 6);

    const prepWeekly: Record<number, number> = {};
    for (const sku of skusRes.data || []) {
      const s = sku as Record<string, unknown>;
      const skuId = s.id as number;
      const weeklyQty = fgWeekly[skuId] || 0;
      if (!weeklyQty) continue;
      const litresPerUnit = packVolMap.get(s.pack_format_id as number) || 0;
      const prep = flavourToPrepMap.get(s.flavour_id as number);
      if (!prep) continue;
      const batches = (weeklyQty * litresPerUnit) / (prep.batch_yield_l || 1);
      prepWeekly[prep.id] = (prepWeekly[prep.id] || 0) + batches;
    }
    for (const id in prepWeekly) prepWeekly[id] = Math.ceil(prepWeekly[id]);

    const rmWeekly: Record<number, number> = {};
    for (const recipe of prepRecipesRes.data || []) {
      const r = recipe as Record<string, unknown>;
      const prepId = r.prep_product_id as number;
      const rmId = r.rm_item_id as number;
      const weekly = prepWeekly[prepId] || 0;
      if (!weekly) continue;
      rmWeekly[rmId] = (rmWeekly[rmId] || 0) + weekly * ((r.qty_per_unit as number) || 0);
    }
    for (const id in rmWeekly) rmWeekly[id] = Math.ceil(rmWeekly[id]);

    const now = new Date();
    const dateStr = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    // ── Sheet: Raw Materials ──────────────────────────────────────────────
    const rmData = (rmRes.data || []).map((r: Record<string, unknown>) => {
      const id = r.rm_item_id as number;
      const weekly = rmWeekly[id];
      const threshold = weekly ? Math.ceil(weekly * 2.5) : undefined;
      const inHand = (r.qty_on_hand as number) || 0;
      let status = '—';
      if (weekly) {
        status = inHand < weekly ? 'Critical' : inHand < (threshold ?? 0) ? 'Low' : 'OK';
      }
      return {
        Category: itemCatMap.get(id) || 'Other',
        Ingredient: r.ingredient_name as string,
        Unit: r.unit as string,
        'In Hand': inHand,
        'Weekly Req': weekly ?? '—',
        'Threshold (2.5×)': threshold ?? '—',
        Status: statusLabel(status.toLowerCase()),
      };
    }).sort((a, b) => {
      const aStatus = a.Status.includes('Critical') ? 0 : a.Status.includes('Low') ? 1 : 2;
      const bStatus = b.Status.includes('Critical') ? 0 : b.Status.includes('Low') ? 1 : 2;
      return aStatus !== bStatus ? aStatus - bStatus : a.Category.localeCompare(b.Category) || a.Ingredient.localeCompare(b.Ingredient);
    });

    // ── Sheet: Prep Mix Stock ────────────────────────────────────────────
    const prepData = (prepRes.data || []).map((r: Record<string, unknown>) => {
      const pid = r.prep_product_id as number;
      const byieldL = yieldMap.get(pid) || 0;
      const qtyFactory = (r.qty_factory as number) || 0;
      const qtyKitchen = (r.qty_kitchen as number) || 0;
      const qtyTotal = (r.qty_total as number) || 0;
      const weekly = prepWeekly[pid];
      const threshold = weekly ? Math.ceil(weekly * 2.5) : undefined;
      let status = '—';
      if (weekly) {
        status = qtyTotal < weekly ? 'Critical' : qtyTotal < (threshold ?? 0) ? 'Low' : 'OK';
      }
      return {
        'Flavour / Mix': r.product_name as string,
        'Batch Yield (L)': byieldL || '—',
        'Factory (units)': qtyFactory,
        'Kitchen (units)': qtyKitchen,
        'Total (units)': qtyTotal,
        'Total Litres': parseFloat(((qtyTotal) * byieldL).toFixed(1)),
        '4L Bulk Tubs': Math.floor((qtyTotal * byieldL) / 4),
        'Weekly Req (units)': weekly ?? '—',
        'Threshold (units)': threshold ?? '—',
        Status: statusLabel(status.toLowerCase()),
      };
    }).sort((a, b) => {
      const aStatus = a.Status.includes('Critical') ? 0 : a.Status.includes('Low') ? 1 : 2;
      const bStatus = b.Status.includes('Critical') ? 0 : b.Status.includes('Low') ? 1 : 2;
      return aStatus !== bStatus ? aStatus - bStatus : (a['Flavour / Mix'] as string).localeCompare(b['Flavour / Mix'] as string);
    });

    // ── Sheet: Finished Goods ────────────────────────────────────────────
    const fgData = (fgRes.data || []).map((r: Record<string, unknown>) => {
      const id = r.fg_sku_id as number;
      const weekly = fgWeekly[id];
      const threshold = weekly ? Math.ceil(weekly * 2.5) : undefined;
      const inHand = (r.qty_on_hand as number) || 0;
      let status = '—';
      if (weekly) {
        status = inHand < weekly ? 'Critical' : inHand < (threshold ?? 0) ? 'Low' : 'OK';
      }
      return {
        'Product Name': r.product_name as string,
        'Pack Format': r.unit as string,
        'In Hand': inHand,
        'Weekly Req': weekly ?? '—',
        'Threshold (2.5×)': threshold ?? '—',
        Status: statusLabel(status.toLowerCase()),
      };
    }).sort((a, b) => {
      const aStatus = a.Status.includes('Critical') ? 0 : a.Status.includes('Low') ? 1 : 2;
      const bStatus = b.Status.includes('Critical') ? 0 : b.Status.includes('Low') ? 1 : 2;
      return aStatus !== bStatus ? aStatus - bStatus : (a['Pack Format'] as string).localeCompare(b['Pack Format'] as string) || (a['Product Name'] as string).localeCompare(b['Product Name'] as string);
    });

    // ── Build Workbook ───────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const rmCrit = rmData.filter(r => r.Status.includes('Critical')).length;
    const rmLow  = rmData.filter(r => r.Status.includes('Low')).length;
    const prepCrit = prepData.filter(r => r.Status.includes('Critical')).length;
    const prepLow  = prepData.filter(r => r.Status.includes('Low')).length;
    const fgCrit = fgData.filter(r => r.Status.includes('Critical')).length;
    const fgLow  = fgData.filter(r => r.Status.includes('Low')).length;

    const summaryAoa = [
      ['ICESTASY OPS — STOCK REPORT'],
      [`Generated: ${dateStr}  |  Period: Last 42 days (6-week average)`],
      [''],
      ['STOCK SNAPSHOT', '', 'Critical', 'Low', 'Total Items'],
      ['Raw Materials', '', rmCrit, rmLow, rmData.length],
      ['Prep / Mix', '', prepCrit, prepLow, prepData.length],
      ['Finished Goods', '', fgCrit, fgLow, fgData.length],
      [''],
      ['HOW TO READ THIS REPORT'],
      ['Weekly Req', 'Average units sold per week over the last 6 weeks (rounded up)'],
      ['Threshold', '2.5× the weekly requirement — minimum safe stock level'],
      ['🔴 Critical', 'In Hand is below Weekly Req — order immediately'],
      ['🟡 Low', 'In Hand is below Threshold — order soon'],
      ['🟢 OK', 'Stock is above threshold — no action needed'],
      [''],
      ['SHEETS IN THIS FILE'],
      ['Raw Materials', 'All ingredients sorted by status (Critical first)'],
      ['Prep Mix Stock', 'Flavour mixes with factory + kitchen breakdown'],
      ['Finished Goods', 'Ready-to-sell tubs sorted by status'],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryAoa);
    summaryWs['!cols'] = [{ wch: 24 }, { wch: 55 }, { wch: 12 }, { wch: 8 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    const addSheet = (name: string, rows: Record<string, unknown>[]) => {
      if (rows.length === 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[`No data for ${name}`]]), name);
        return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length + 2, 16) }));
      // Freeze header row
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet('Raw Materials', rmData as Record<string, unknown>[]);
    addSheet('Prep Mix Stock', prepData as Record<string, unknown>[]);
    addSheet('Finished Goods', fgData as Record<string, unknown>[]);

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `icestasy-stock-${now.toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
