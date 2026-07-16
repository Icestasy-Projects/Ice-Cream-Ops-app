import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// @ts-expect-error xlsx-js-style has no types
import XLSXStyle from 'xlsx-js-style';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

// ── Colour palette ───────────────────────────────────────────────────────────
const C = {
  // Brand
  orange:     'FFF6840B',
  orangeLight:'FFFFF0D6',
  // Status fills
  critFill:   'FFFDE8E8',
  critText:   'FFB91C1C',
  lowFill:    'FFFEF9C3',
  lowText:    'FF92400E',
  okFill:     'FFF0FDF4',
  okText:     'FF166534',
  // Chrome
  headerFill: 'FF1E293B',  // dark slate
  headerText: 'FFFFFFFF',
  groupFill:  'FFF1F5F9',  // light blue-gray
  groupText:  'FF334155',
  border:     'FFD1D5DB',
  white:      'FFFFFFFF',
  titleFill:  'FF0F172A',
};

type CellStyle = {
  font?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
  border?: Record<string, unknown>;
};

function cell(value: unknown, style: CellStyle = {}) {
  return { v: value, s: style };
}

const thinBorder = {
  top:    { style: 'thin', color: { rgb: C.border } },
  bottom: { style: 'thin', color: { rgb: C.border } },
  left:   { style: 'thin', color: { rgb: C.border } },
  right:  { style: 'thin', color: { rgb: C.border } },
};

function headerCell(value: string) {
  return cell(value, {
    font:      { bold: true, color: { rgb: C.headerText }, sz: 10 },
    fill:      { fgColor: { rgb: C.headerFill } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border:    thinBorder,
  });
}

function groupHeaderCell(value: string, span = false) {
  return cell(value, {
    font:      { bold: true, color: { rgb: C.groupText }, sz: 10 },
    fill:      { fgColor: { rgb: C.groupFill } },
    alignment: { horizontal: span ? 'left' : 'center', vertical: 'center' },
    border:    thinBorder,
  });
}

function dataCell(value: unknown, status: string, align: 'left' | 'right' | 'center' = 'left', bold = false) {
  const fills: Record<string, string> = { critical: C.critFill, low: C.lowFill, ok: C.okFill };
  const fill = fills[status] || C.white;
  return cell(value, {
    font:      { bold, sz: 10, color: { rgb: status === 'critical' ? C.critText : status === 'low' ? C.lowText : '00000000' } },
    fill:      { fgColor: { rgb: fill } },
    alignment: { horizontal: align, vertical: 'center' },
    border:    thinBorder,
  });
}

function statusCell(status: string) {
  const map: Record<string, { label: string; fill: string; text: string }> = {
    critical: { label: '● Critical', fill: C.critFill, text: C.critText },
    low:      { label: '◐ Low',      fill: C.lowFill,  text: C.lowText  },
    ok:       { label: '○ OK',       fill: C.okFill,   text: C.okText   },
  };
  const s = map[status] || { label: '—', fill: C.white, text: 'FF6B7280' };
  return cell(s.label, {
    font:      { bold: true, sz: 10, color: { rgb: s.text } },
    fill:      { fgColor: { rgb: s.fill } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    thinBorder,
  });
}

function titleCell(value: string) {
  return cell(value, {
    font:      { bold: true, sz: 14, color: { rgb: C.white } },
    fill:      { fgColor: { rgb: C.titleFill } },
    alignment: { horizontal: 'left', vertical: 'center' },
  });
}

function subCell(value: string) {
  return cell(value, {
    font:      { sz: 10, color: { rgb: 'FF475569' } },
    fill:      { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'left', vertical: 'center' },
  });
}

function emptyRow(cols: number) {
  return Array(cols).fill(cell('', { fill: { fgColor: { rgb: C.white } } }));
}

function aoa_to_sheet_styled(data: unknown[][]): unknown {
  const ws: Record<string, unknown> = {};
  let maxCol = 0;
  data.forEach((row, R) => {
    (row as unknown[]).forEach((cellVal, C_) => {
      const addr = XLSXStyle.utils.encode_cell({ r: R, c: C_ });
      if (cellVal && typeof cellVal === 'object' && 'v' in (cellVal as object)) {
        ws[addr] = cellVal;
      } else {
        ws[addr] = { v: cellVal ?? '', s: {} };
      }
      if (C_ > maxCol) maxCol = C_;
    });
  });
  ws['!ref'] = XLSXStyle.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: maxCol } });
  return ws;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const since = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

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
    const catMap = new Map<number, string>((catsRes.data || []).map((c: Record<string, unknown>) => [c.id as number, c.name as string]));
    const itemCatMap = new Map<number, string>((itemsRes.data || []).map((i: Record<string, unknown>) => [i.id as number, catMap.get(i.category_id as number) || 'Other']));
    const yieldMap = new Map<number, number>((prepProdsRes.data || []).map((r: Record<string, unknown>) => [r.id as number, (r.batch_yield_l as number) || 0]));
    const packVolMap = new Map<number, number>((packFormatsRes.data || []).map((p: Record<string, unknown>) => [p.id as number, ((p.unit_volume_ml as number) * (p.units_per_pack as number)) / 1000]));
    const flavourToPrepMap = new Map<number, { id: number; batch_yield_l: number }>();
    for (const pp of prepProdsRes.data || []) {
      const r = pp as Record<string, unknown>;
      flavourToPrepMap.set(r.flavour_id as number, { id: r.id as number, batch_yield_l: (r.batch_yield_l as number) || 1 });
    }

    // ── Weekly req calculation ──────────────────────────────────────────────
    const fgWeekly: Record<number, number> = {};
    for (const line of orderLinesRes.data || []) {
      const id = line.sku_id as number;
      fgWeekly[id] = (fgWeekly[id] || 0) + ((line.quantity as number) || 0);
    }
    for (const id in fgWeekly) fgWeekly[id] = Math.ceil(fgWeekly[id] / 6);

    const prepWeekly: Record<number, number> = {};
    for (const sku of skusRes.data || []) {
      const s = sku as Record<string, unknown>;
      const weeklyQty = fgWeekly[s.id as number] || 0;
      if (!weeklyQty) continue;
      const litresPerUnit = packVolMap.get(s.pack_format_id as number) || 0;
      const prep = flavourToPrepMap.get(s.flavour_id as number);
      if (!prep) continue;
      prepWeekly[prep.id] = (prepWeekly[prep.id] || 0) + (weeklyQty * litresPerUnit) / (prep.batch_yield_l || 1);
    }
    for (const id in prepWeekly) prepWeekly[id] = Math.ceil(prepWeekly[id]);

    const rmWeekly: Record<number, number> = {};
    for (const recipe of prepRecipesRes.data || []) {
      const r = recipe as Record<string, unknown>;
      const weekly = prepWeekly[r.prep_product_id as number] || 0;
      if (!weekly) continue;
      rmWeekly[r.rm_item_id as number] = (rmWeekly[r.rm_item_id as number] || 0) + weekly * ((r.qty_per_unit as number) || 0);
    }
    for (const id in rmWeekly) rmWeekly[id] = Math.ceil(rmWeekly[id]);

    const now = new Date();
    const dateStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    function calcStatus(inHand: number, weekly: number | undefined): string {
      if (!weekly || weekly <= 0) return 'unknown';
      return inHand < weekly ? 'critical' : inHand < Math.ceil(weekly * 2.5) ? 'low' : 'ok';
    }

    // ── Sheet 1: Raw Materials (grouped by category) ─────────────────────
    const rmByCategory: Record<string, { name: string; unit: string; inHand: number; weekly: number | undefined; threshold: number | undefined; status: string }[]> = {};
    for (const r of rmRes.data || []) {
      const row = r as Record<string, unknown>;
      const id = row.rm_item_id as number;
      const cat = itemCatMap.get(id) || 'Other';
      const weekly = rmWeekly[id];
      const threshold = weekly ? Math.ceil(weekly * 2.5) : undefined;
      const inHand = (row.qty_on_hand as number) || 0;
      const status = calcStatus(inHand, weekly);
      if (!rmByCategory[cat]) rmByCategory[cat] = [];
      rmByCategory[cat].push({ name: row.ingredient_name as string, unit: row.unit as string, inHand, weekly, threshold, status });
    }
    for (const cat in rmByCategory) {
      rmByCategory[cat].sort((a, b) => {
        const ord: Record<string, number> = { critical: 0, low: 1, ok: 2, unknown: 3 };
        return (ord[a.status] ?? 3) - (ord[b.status] ?? 3) || a.name.localeCompare(b.name);
      });
    }

    const RM_COLS = ['Ingredient', 'Unit', 'In Hand', 'Weekly Req', 'Threshold (2.5×)', 'Status'];
    const RM_WIDTHS = [32, 8, 12, 12, 16, 12];
    const rmRows: unknown[][] = [];

    // Title rows
    rmRows.push([titleCell('ICESTASY OPS — RAW MATERIALS STOCK'), '', '', '', '', '']);
    rmRows.push([subCell(`Generated: ${dateStr}  |  Period: Last 42 days (6-week average)`), '', '', '', '', '']);
    rmRows.push(emptyRow(6));
    rmRows.push(RM_COLS.map(h => headerCell(h)));

    let rmCrit = 0, rmLow = 0;
    for (const cat of Object.keys(rmByCategory).sort()) {
      const items = rmByCategory[cat];
      const catCrit = items.filter(i => i.status === 'critical').length;
      const catLow  = items.filter(i => i.status === 'low').length;
      rmCrit += catCrit; rmLow += catLow;
      const label = `${cat.toUpperCase()}  (${items.length} items${catCrit ? `  •  ${catCrit} critical` : ''}${catLow ? `  •  ${catLow} low` : ''})`;
      rmRows.push([groupHeaderCell(label, true), groupHeaderCell(''), groupHeaderCell(''), groupHeaderCell(''), groupHeaderCell(''), groupHeaderCell('')]);
      for (const item of items) {
        rmRows.push([
          dataCell(item.name,                          item.status, 'left'),
          dataCell(item.unit,                          item.status, 'center'),
          dataCell(item.inHand,                        item.status, 'right', true),
          dataCell(item.weekly    ?? '—',              item.status, 'right'),
          dataCell(item.threshold ?? '—',              item.status, 'right'),
          statusCell(item.status),
        ]);
      }
      rmRows.push(emptyRow(6));
    }

    const rmWs = aoa_to_sheet_styled(rmRows) as Record<string, unknown>;
    rmWs['!cols'] = RM_WIDTHS.map(w => ({ wch: w }));
    rmWs['!rows'] = [{ hpt: 28 }, { hpt: 16 }, { hpt: 6 }];
    rmWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];
    rmWs['!freeze'] = { xSplit: 0, ySplit: 4 };

    // ── Sheet 2: Prep / Mix ──────────────────────────────────────────────
    const PREP_COLS = ['Flavour / Mix', 'Yield / Batch', 'Factory (units)', 'Kitchen (units)', 'Total (units)', 'Weekly Req', 'Threshold (2.5×)', 'Status'];
    const PREP_WIDTHS = [28, 14, 16, 16, 14, 12, 16, 12];
    const prepRows: unknown[][] = [];

    prepRows.push([titleCell('ICESTASY OPS — PREP / MIX STOCK'), '', '', '', '', '', '', '']);
    prepRows.push([subCell(`Generated: ${dateStr}  |  Period: Last 42 days (6-week average)`), '', '', '', '', '', '', '']);
    prepRows.push(emptyRow(8));
    prepRows.push(PREP_COLS.map(h => headerCell(h)));

    let prepCrit = 0, prepLow = 0;
    const prepDataRows = (prepRes.data || []).map((r: Record<string, unknown>) => {
      const pid = r.prep_product_id as number;
      const byieldL = yieldMap.get(pid) || 0;
      const qtyFactory = (r.qty_factory as number) || 0;
      const qtyKitchen = (r.qty_kitchen as number) || 0;
      const qtyTotal = (r.qty_total as number) || 0;
      const weekly = prepWeekly[pid];
      const threshold = weekly ? Math.ceil(weekly * 2.5) : undefined;
      const status = calcStatus(qtyTotal, weekly);
      return { name: r.product_name as string, byieldL, qtyFactory, qtyKitchen, qtyTotal, weekly, threshold, status };
    }).sort((a, b) => {
      const ord: Record<string, number> = { critical: 0, low: 1, ok: 2, unknown: 3 };
      return (ord[a.status] ?? 3) - (ord[b.status] ?? 3) || a.name.localeCompare(b.name);
    });

    for (const item of prepDataRows) {
      if (item.status === 'critical') prepCrit++;
      if (item.status === 'low') prepLow++;
      prepRows.push([
        dataCell(item.name,             item.status, 'left'),
        dataCell(`${item.byieldL}L`,    item.status, 'center'),
        dataCell(item.qtyFactory,       item.status, 'right'),
        dataCell(item.qtyKitchen,       item.status, 'right'),
        dataCell(item.qtyTotal,         item.status, 'right', true),
        dataCell(item.weekly    ?? '—', item.status, 'right'),
        dataCell(item.threshold ?? '—', item.status, 'right'),
        statusCell(item.status),
      ]);
    }

    const prepWs = aoa_to_sheet_styled(prepRows) as Record<string, unknown>;
    prepWs['!cols'] = PREP_WIDTHS.map(w => ({ wch: w }));
    prepWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    ];
    prepWs['!freeze'] = { xSplit: 0, ySplit: 4 };

    // ── Sheet 3: Finished Goods (grouped by pack format) ─────────────────
    const fgByFormat: Record<string, { name: string; inHand: number; weekly: number | undefined; threshold: number | undefined; status: string }[]> = {};
    for (const r of fgRes.data || []) {
      const row = r as Record<string, unknown>;
      const id = row.fg_sku_id as number;
      const fmt = (row.unit as string) || 'Other';
      const weekly = fgWeekly[id];
      const threshold = weekly ? Math.ceil(weekly * 2.5) : undefined;
      const inHand = (row.qty_on_hand as number) || 0;
      const status = calcStatus(inHand, weekly);
      if (!fgByFormat[fmt]) fgByFormat[fmt] = [];
      fgByFormat[fmt].push({ name: row.product_name as string, inHand, weekly, threshold, status });
    }
    for (const fmt in fgByFormat) {
      fgByFormat[fmt].sort((a, b) => {
        const ord: Record<string, number> = { critical: 0, low: 1, ok: 2, unknown: 3 };
        return (ord[a.status] ?? 3) - (ord[b.status] ?? 3) || a.name.localeCompare(b.name);
      });
    }

    const FG_COLS = ['Product Name', 'In Hand', 'Weekly Req', 'Threshold (2.5×)', 'Status'];
    const FG_WIDTHS = [36, 12, 12, 16, 12];
    const fgRows: unknown[][] = [];

    fgRows.push([titleCell('ICESTASY OPS — FINISHED GOODS STOCK'), '', '', '', '']);
    fgRows.push([subCell(`Generated: ${dateStr}  |  Period: Last 42 days (6-week average)`), '', '', '', '']);
    fgRows.push(emptyRow(5));
    fgRows.push(FG_COLS.map(h => headerCell(h)));

    let fgCrit = 0, fgLow = 0;
    for (const fmt of Object.keys(fgByFormat).sort()) {
      const items = fgByFormat[fmt];
      const fmtCrit = items.filter(i => i.status === 'critical').length;
      const fmtLow  = items.filter(i => i.status === 'low').length;
      fgCrit += fmtCrit; fgLow += fmtLow;
      const label = `${fmt.toUpperCase()}  (${items.length} SKUs${fmtCrit ? `  •  ${fmtCrit} critical` : ''}${fmtLow ? `  •  ${fmtLow} low` : ''})`;
      fgRows.push([groupHeaderCell(label, true), groupHeaderCell(''), groupHeaderCell(''), groupHeaderCell(''), groupHeaderCell('')]);
      for (const item of items) {
        fgRows.push([
          dataCell(item.name,             item.status, 'left'),
          dataCell(item.inHand,           item.status, 'right', true),
          dataCell(item.weekly    ?? '—', item.status, 'right'),
          dataCell(item.threshold ?? '—', item.status, 'right'),
          statusCell(item.status),
        ]);
      }
      fgRows.push(emptyRow(5));
    }

    const fgWs = aoa_to_sheet_styled(fgRows) as Record<string, unknown>;
    fgWs['!cols'] = FG_WIDTHS.map(w => ({ wch: w }));
    fgWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    ];
    fgWs['!freeze'] = { xSplit: 0, ySplit: 4 };

    // ── Sheet 0: Summary ─────────────────────────────────────────────────
    const summaryRows: unknown[][] = [
      [titleCell('ICESTASY OPS — STOCK REPORT'), '', '', ''],
      [subCell(`Generated: ${dateStr}`), '', '', ''],
      [subCell(`Data period: Last 42 days  |  Weekly Req = 6-week average (rounded up)  |  Threshold = 2.5× Weekly Req`), '', '', ''],
      emptyRow(4),
      [headerCell('Category'), headerCell('Critical'), headerCell('Low'), headerCell('Total Items')],
      [groupHeaderCell('Raw Materials', true),  cell(rmCrit,   { font: { bold: true, color: { rgb: C.critText }, sz: 11 }, fill: { fgColor: { rgb: C.critFill } }, alignment: { horizontal: 'center' }, border: thinBorder }), cell(rmLow,   { font: { bold: true, color: { rgb: C.lowText  }, sz: 11 }, fill: { fgColor: { rgb: C.lowFill  } }, alignment: { horizontal: 'center' }, border: thinBorder }), dataCell((rmRes.data || []).length,   '', 'center')],
      [groupHeaderCell('Prep / Mix',    true),  cell(prepCrit, { font: { bold: true, color: { rgb: C.critText }, sz: 11 }, fill: { fgColor: { rgb: C.critFill } }, alignment: { horizontal: 'center' }, border: thinBorder }), cell(prepLow, { font: { bold: true, color: { rgb: C.lowText  }, sz: 11 }, fill: { fgColor: { rgb: C.lowFill  } }, alignment: { horizontal: 'center' }, border: thinBorder }), dataCell((prepRes.data || []).length, '', 'center')],
      [groupHeaderCell('Finished Goods',true),  cell(fgCrit,   { font: { bold: true, color: { rgb: C.critText }, sz: 11 }, fill: { fgColor: { rgb: C.critFill } }, alignment: { horizontal: 'center' }, border: thinBorder }), cell(fgLow,   { font: { bold: true, color: { rgb: C.lowText  }, sz: 11 }, fill: { fgColor: { rgb: C.lowFill  } }, alignment: { horizontal: 'center' }, border: thinBorder }), dataCell((fgRes.data || []).length,   '', 'center')],
      emptyRow(4),
      [headerCell('STATUS LEGEND'), headerCell('MEANING'), headerCell(''), headerCell('')],
      [statusCell('critical'), subCell('In Hand is BELOW Weekly Requirement — order immediately'), subCell(''), subCell('')],
      [statusCell('low'),      subCell('In Hand is below Threshold (2.5× weekly) — order soon'),   subCell(''), subCell('')],
      [statusCell('ok'),       subCell('Stock is above threshold — no action needed'),              subCell(''), subCell('')],
      emptyRow(4),
      [headerCell('SHEETS IN THIS FILE'), headerCell('DESCRIPTION'), headerCell(''), headerCell('')],
      [groupHeaderCell('Raw Materials',  true), subCell('Ingredients grouped by category, sorted Critical → Low → OK'), subCell(''), subCell('')],
      [groupHeaderCell('Prep Mix Stock', true), subCell('Factory + kitchen batches with tub yield potential'),           subCell(''), subCell('')],
      [groupHeaderCell('Finished Goods', true), subCell('Ready-to-sell SKUs grouped by pack format'),                    subCell(''), subCell('')],
    ];

    const summaryWs = aoa_to_sheet_styled(summaryRows) as Record<string, unknown>;
    summaryWs['!cols'] = [{ wch: 22 }, { wch: 52 }, { wch: 10 }, { wch: 10 }];
    summaryWs['!rows'] = [{ hpt: 32 }, { hpt: 16 }, { hpt: 16 }];
    summaryWs['!merges'] = [
      { s: { r: 0,  c: 0 }, e: { r: 0,  c: 3 } },
      { s: { r: 1,  c: 0 }, e: { r: 1,  c: 3 } },
      { s: { r: 2,  c: 0 }, e: { r: 2,  c: 3 } },
      { s: { r: 9,  c: 1 }, e: { r: 9,  c: 3 } },
      { s: { r: 10, c: 1 }, e: { r: 10, c: 3 } },
      { s: { r: 11, c: 1 }, e: { r: 11, c: 3 } },
      { s: { r: 12, c: 1 }, e: { r: 12, c: 3 } },
      { s: { r: 14, c: 1 }, e: { r: 14, c: 3 } },
      { s: { r: 15, c: 1 }, e: { r: 15, c: 3 } },
      { s: { r: 16, c: 1 }, e: { r: 16, c: 3 } },
      { s: { r: 17, c: 1 }, e: { r: 17, c: 3 } },
    ];

    // ── Assemble workbook ────────────────────────────────────────────────
    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, summaryWs,  'Summary');
    XLSXStyle.utils.book_append_sheet(wb, rmWs,       'Raw Materials');
    XLSXStyle.utils.book_append_sheet(wb, prepWs,     'Prep Mix Stock');
    XLSXStyle.utils.book_append_sheet(wb, fgWs,       'Finished Goods');

    const buf = XLSXStyle.write(wb, { type: 'buffer', bookType: 'xlsx' });
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
