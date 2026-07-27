import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSXStyle = require('xlsx-js-style');

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  orange:      'FFF6840B',
  orangeLight: 'FFFFF0D6',
  green:       'FF166534',
  greenFill:   'FFF0FDF4',
  greenLight:  'FFD1FAE5',
  blue:        'FF1E3A5F',
  blueFill:    'FFEFF6FF',
  blueLight:   'FFDBEAFE',
  amber:       'FF92400E',
  amberFill:   'FFFEF9C3',
  red:         'FFB91C1C',
  redFill:     'FFFDE8E8',
  headerFill:  'FF1E293B',
  headerText:  'FFFFFFFF',
  groupFill:   'FFF1F5F9',
  groupFill2:  'FFE2E8F0',
  groupText:   'FF334155',
  border:      'FFD1D5DB',
  borderDark:  'FF94A3B8',
  white:       'FFFFFFFF',
  titleFill:   'FF0F172A',
  mutedText:   'FF6B7280',
};

type CellStyle = {
  font?: Record<string, unknown>;
  fill?: Record<string, unknown>;
  alignment?: Record<string, unknown>;
  border?: Record<string, unknown>;
  numFmt?: string;
};

function cell(value: unknown, style: CellStyle = {}) {
  return { v: value, s: style };
}

const thinBorder = {
  top:    { style: 'thin',   color: { rgb: C.border } },
  bottom: { style: 'thin',   color: { rgb: C.border } },
  left:   { style: 'thin',   color: { rgb: C.border } },
  right:  { style: 'thin',   color: { rgb: C.border } },
};

const medBorder = {
  top:    { style: 'medium', color: { rgb: C.borderDark } },
  bottom: { style: 'medium', color: { rgb: C.borderDark } },
  left:   { style: 'medium', color: { rgb: C.borderDark } },
  right:  { style: 'medium', color: { rgb: C.borderDark } },
};

function headerCell(value: string, align: 'left' | 'center' | 'right' = 'center') {
  return cell(value, {
    font:      { bold: true, color: { rgb: C.headerText }, sz: 10 },
    fill:      { fgColor: { rgb: C.headerFill } },
    alignment: { horizontal: align, vertical: 'center', wrapText: true },
    border:    thinBorder,
  });
}

function titleCell(value: string) {
  return cell(value, {
    font:      { bold: true, sz: 16, color: { rgb: C.white } },
    fill:      { fgColor: { rgb: C.titleFill } },
    alignment: { horizontal: 'left', vertical: 'center' },
  });
}

function subCell(value: string) {
  return cell(value, {
    font:      { sz: 10, color: { rgb: C.mutedText } },
    fill:      { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'left', vertical: 'center' },
  });
}

function emptyRow(cols: number, fill = C.white) {
  return Array(cols).fill(cell('', { fill: { fgColor: { rgb: fill } } }));
}

// Date group header (e.g. "MONDAY, 27 JAN 2026")
function dateGroupCell(value: string, cols: number) {
  return Array(cols).fill(null).map((_, i) =>
    cell(i === 0 ? value : '', {
      font:      { bold: true, sz: 11, color: { rgb: C.blue } },
      fill:      { fgColor: { rgb: C.blueLight } },
      alignment: { horizontal: i === 0 ? 'left' : 'center', vertical: 'center' },
      border:    medBorder,
    })
  );
}

// Order sub-header row
function orderHeaderCell(value: string, cols: number) {
  return Array(cols).fill(null).map((_, i) =>
    cell(i === 0 ? value : '', {
      font:      { bold: true, sz: 10, color: { rgb: C.groupText } },
      fill:      { fgColor: { rgb: C.groupFill } },
      alignment: { horizontal: i === 0 ? 'left' : 'center', vertical: 'center' },
      border:    thinBorder,
    })
  );
}

function lineCell(value: unknown, align: 'left' | 'center' | 'right' = 'left', bold = false, fill = C.white, textColor = '00000000') {
  return cell(value, {
    font:      { sz: 10, bold, color: { rgb: textColor } },
    fill:      { fgColor: { rgb: fill } },
    alignment: { horizontal: align, vertical: 'center' },
    border:    thinBorder,
  });
}

function statusPill(status: string) {
  const map: Record<string, { label: string; fill: string; text: string }> = {
    dispatched:    { label: '✓ Dispatched',    fill: C.greenFill,  text: C.green  },
    approved:      { label: '● Approved',       fill: C.blueFill,   text: C.blue   },
    invoiced:      { label: '◑ Invoiced',       fill: C.amberFill,  text: C.amber  },
    in_production: { label: '⚙ In Production', fill: C.orangeLight, text: 'FFB45309' },
  };
  const s = map[status] || { label: status, fill: C.white, text: C.mutedText };
  return cell(s.label, {
    font:      { bold: true, sz: 9, color: { rgb: s.text } },
    fill:      { fgColor: { rgb: s.fill } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    thinBorder,
  });
}

function summaryStatCell(value: unknown, fill: string, textColor: string) {
  return cell(value, {
    font:      { bold: true, sz: 14, color: { rgb: textColor } },
    fill:      { fgColor: { rgb: fill } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border:    medBorder,
  });
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

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function dayGroupKey(iso: string | null | undefined): string {
  if (!iso) return 'Unknown Date';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    }).toUpperCase();
  } catch { return iso; }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch all orders (all statuses) with their lines and FG stock
    const [ordersRes, stockRes] = await Promise.all([
      admin.schema('sales').from('order_lines')
        .select('id, order_id, sku_id, quantity, orders!inner(*)')
        .order('order_id'),
      admin.schema('production').from('v_fg_stock')
        .select('fg_sku_id, product_name, unit, qty_on_hand'),
    ]);

    // Build stock map
    const stockMap: Record<number, { product_name: string; unit: string; qty_on_hand: number }> = {};
    for (const s of stockRes.data || []) {
      const r = s as Record<string, unknown>;
      stockMap[r.fg_sku_id as number] = {
        product_name: r.product_name as string,
        unit: r.unit as string,
        qty_on_hand: (r.qty_on_hand as number) || 0,
      };
    }

    // Group lines by order
    interface OrderEntry {
      order_id: number;
      status: string;
      created_at: string | null;
      order_ref: string | null;
      customer_name: string | null;
      lines: {
        line_id: number;
        sku_id: number;
        quantity: number;
        product_name: string;
        unit: string;
        qty_on_hand: number;
      }[];
    }

    const ordersMap: Record<number, OrderEntry> = {};

    for (const row of ordersRes.data || []) {
      const r = row as Record<string, unknown>;
      const ord = r.orders as Record<string, unknown>;
      const orderId = (ord.id ?? ord.order_id) as number;
      const skuId = r.sku_id as number;
      const qty = (r.quantity as number) || 0;
      const stock = stockMap[skuId];

      const customerName = (
        ord.customer_name ?? ord.client_name ?? ord.account_name ??
        ord.customer ?? ord.contact_name ?? ord.billing_name
      ) as string | null ?? null;

      const orderRef = (
        ord.order_ref ?? ord.order_number ?? ord.reference ?? ord.ref ??
        ord.invoice_number ?? ord.order_no ?? ord.number
      ) as string | null ?? null;

      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          order_id: orderId,
          status: ord.status as string,
          created_at: (ord.created_at ?? ord.date ?? ord.order_date) as string | null,
          order_ref: orderRef,
          customer_name: customerName,
          lines: [],
        };
      }

      ordersMap[orderId].lines.push({
        line_id: r.id as number,
        sku_id: skuId,
        quantity: qty,
        product_name: stock?.product_name || `SKU #${skuId}`,
        unit: stock?.unit || 'units',
        qty_on_hand: stock?.qty_on_hand ?? 0,
      });
    }

    const allOrders = Object.values(ordersMap).sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return ta - tb;
    });

    const dispatched = allOrders.filter(o => o.status === 'dispatched');
    const pending    = allOrders.filter(o => ['approved', 'invoiced', 'in_production'].includes(o.status));

    const now = new Date();
    const dateStr = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // ── Total units dispatched per product ───────────────────────────────────
    const productTotals: Record<string, { product_name: string; unit: string; total_qty: number; order_count: number }> = {};
    for (const ord of dispatched) {
      for (const line of ord.lines) {
        if (!productTotals[line.product_name]) {
          productTotals[line.product_name] = { product_name: line.product_name, unit: line.unit, total_qty: 0, order_count: 0 };
        }
        productTotals[line.product_name].total_qty += line.quantity;
        productTotals[line.product_name].order_count += 1;
      }
    }
    const productRows = Object.values(productTotals).sort((a, b) => b.total_qty - a.total_qty);

    const totalDispatchedOrders = dispatched.length;
    const totalPendingOrders = pending.length;
    const totalUnitsDispatched = dispatched.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.quantity, 0), 0);
    const totalLineItems = dispatched.reduce((s, o) => s + o.lines.length, 0);
    const NCOLS = 7; // columns used across sheets

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 1 — SUMMARY
    // ════════════════════════════════════════════════════════════════════════
    const summaryRows: unknown[][] = [];

    summaryRows.push([titleCell('ICESTASY OPS — DISPATCH REPORT'), '', '', '', '', '', '']);
    summaryRows.push([subCell(`Generated: ${dateStr}`), '', '', '', '', '', '']);
    summaryRows.push([subCell('All dispatch activity across sales orders. Grouped by date and order.'), '', '', '', '', '', '']);
    summaryRows.push(emptyRow(NCOLS));

    // KPI tiles
    summaryRows.push([
      headerCell('TOTAL ORDERS DISPATCHED'),
      headerCell('TOTAL UNITS DISPATCHED'),
      headerCell('TOTAL LINE ITEMS'),
      headerCell('PENDING ORDERS'),
      '', '', '',
    ]);
    summaryRows.push([
      summaryStatCell(totalDispatchedOrders,  C.greenFill,  C.green),
      summaryStatCell(totalUnitsDispatched,    C.blueFill,   C.blue),
      summaryStatCell(totalLineItems,          C.amberFill,  C.amber),
      summaryStatCell(totalPendingOrders,      C.orangeLight, 'FFB45309'),
      '', '', '',
    ]);
    summaryRows.push(emptyRow(NCOLS));

    // Top products table
    summaryRows.push([headerCell('TOP PRODUCTS DISPATCHED', 'left'), headerCell('Unit'), headerCell('Total Qty'), headerCell('# Orders'), '', '', '']);
    for (const p of productRows) {
      summaryRows.push([
        lineCell(p.product_name, 'left', true),
        lineCell(p.unit, 'center'),
        lineCell(p.total_qty, 'right', true, C.greenFill, C.green),
        lineCell(p.order_count, 'center'),
        '', '', '',
      ]);
    }
    if (productRows.length === 0) {
      summaryRows.push([lineCell('No dispatched orders yet.', 'left', false, C.white, C.mutedText), '', '', '', '', '', '']);
    }

    summaryRows.push(emptyRow(NCOLS));

    // Pending orders mini-table
    summaryRows.push([headerCell('PENDING ORDERS (awaiting dispatch)', 'left'), headerCell('Order Ref'), headerCell('Status'), headerCell('Customer'), headerCell('Date'), headerCell('# Lines'), '']);
    if (pending.length === 0) {
      summaryRows.push([lineCell('No pending orders.', 'left', false, C.white, C.mutedText), '', '', '', '', '', '']);
    } else {
      for (const ord of pending) {
        summaryRows.push([
          lineCell(`Order #${ord.order_id}`, 'left', true),
          lineCell(ord.order_ref ?? '—', 'center'),
          statusPill(ord.status),
          lineCell(ord.customer_name ?? '—', 'left'),
          lineCell(fmtDate(ord.created_at), 'center'),
          lineCell(ord.lines.length, 'center', true, C.amberFill, C.amber),
          '',
        ]);
      }
    }

    const summaryWs = aoa_to_sheet_styled(summaryRows) as Record<string, unknown>;
    summaryWs['!cols'] = [{ wch: 36 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 18 }, { wch: 10 }, { wch: 4 }];
    summaryWs['!rows'] = [{ hpt: 32 }, { hpt: 16 }, { hpt: 16 }, { hpt: 6 }];
    const sumMerges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
    ];
    summaryWs['!merges'] = sumMerges;

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 2 — DISPATCHED ORDERS (grouped by date → order → lines)
    // ════════════════════════════════════════════════════════════════════════
    const DCOLS = 7;
    const dispatchRows: unknown[][] = [];
    const dispatchMerges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

    dispatchRows.push([titleCell('ICESTASY OPS — DISPATCHED ORDERS (DETAIL)'), '', '', '', '', '', '']);
    dispatchRows.push([subCell(`Generated: ${dateStr}  |  All orders with status: Dispatched`), '', '', '', '', '', '']);
    dispatchRows.push(emptyRow(DCOLS));

    // Column headers (repeated logically — freeze will keep visible)
    const dispColHeaders = [
      headerCell('#', 'center'),
      headerCell('Product Name', 'left'),
      headerCell('Unit'),
      headerCell('Qty Ordered', 'right'),
      headerCell('In Stock Now', 'right'),
      headerCell('Order Date'),
      headerCell('Status'),
    ];

    // Group dispatched orders by date
    const byDate: Record<string, OrderEntry[]> = {};
    for (const ord of dispatched) {
      const key = dayGroupKey(ord.created_at);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(ord);
    }

    if (dispatched.length === 0) {
      dispatchRows.push([subCell('No dispatched orders found.'), '', '', '', '', '', '']);
    } else {
      let lineNo = 1;
      for (const [dateKey, dateOrders] of Object.entries(byDate)) {
        // DATE GROUP HEADER
        const dateR = dispatchRows.length;
        const dateUnits = dateOrders.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.quantity, 0), 0);
        dispatchRows.push(dateGroupCell(
          `${dateKey}   ·   ${dateOrders.length} order${dateOrders.length !== 1 ? 's' : ''}   ·   ${dateUnits} total units dispatched`,
          DCOLS
        ));
        dispatchMerges.push({ s: { r: dateR, c: 0 }, e: { r: dateR, c: DCOLS - 1 } });

        // Column headers for this date group
        dispatchRows.push(dispColHeaders);

        for (const ord of dateOrders) {
          // ORDER SUB-HEADER
          const ordR = dispatchRows.length;
          const ordUnits = ord.lines.reduce((s, l) => s + l.quantity, 0);
          const ordLabel = `  Order #${ord.order_id}  ${ord.order_ref ? `· Ref: ${ord.order_ref}` : ''}  ${ord.customer_name ? `· ${ord.customer_name}` : ''}  —  ${ord.lines.length} item${ord.lines.length !== 1 ? 's' : ''},  ${ordUnits} units`;
          dispatchRows.push(orderHeaderCell(ordLabel, DCOLS));
          dispatchMerges.push({ s: { r: ordR, c: 0 }, e: { r: ordR, c: DCOLS - 1 } });

          // LINE ITEMS
          for (const line of ord.lines) {
            const sufficient = line.qty_on_hand >= line.quantity;
            dispatchRows.push([
              lineCell(lineNo++, 'center', false, C.white, C.mutedText),
              lineCell(line.product_name, 'left', true),
              lineCell(line.unit, 'center'),
              lineCell(line.quantity, 'right', true),
              lineCell(line.qty_on_hand, 'right', false, sufficient ? C.greenFill : C.redFill, sufficient ? C.green : C.red),
              lineCell(fmtDate(ord.created_at), 'center'),
              statusPill(ord.status),
            ]);
          }

          // Order sub-total
          dispatchRows.push([
            lineCell('', 'center'),
            lineCell(`Sub-total — Order #${ord.order_id}`, 'right', true, C.groupFill2, C.groupText),
            lineCell('', 'center', false, C.groupFill2),
            lineCell(ordUnits, 'right', true, C.groupFill2, C.groupText),
            lineCell('', 'center', false, C.groupFill2),
            lineCell('', 'center', false, C.groupFill2),
            lineCell('', 'center', false, C.groupFill2),
          ]);
        }

        // Date group total
        const dateTotalR = dispatchRows.length;
        dispatchRows.push([
          lineCell('TOTAL', 'center', true, C.blueLight, C.blue),
          lineCell(`${dateKey} — ${dateOrders.length} orders`, 'left', true, C.blueLight, C.blue),
          lineCell('', 'center', false, C.blueLight),
          lineCell(dateUnits, 'right', true, C.blueLight, C.blue),
          lineCell('', 'center', false, C.blueLight),
          lineCell('', 'center', false, C.blueLight),
          lineCell('', 'center', false, C.blueLight),
        ]);
        dispatchMerges.push({ s: { r: dateTotalR, c: 1 }, e: { r: dateTotalR, c: 2 } });

        dispatchRows.push(emptyRow(DCOLS));
      }

      // Grand total
      const gtR = dispatchRows.length;
      dispatchRows.push([
        lineCell('GRAND TOTAL', 'center', true, C.greenLight, C.green),
        lineCell(`${dispatched.length} orders   ·   ${totalLineItems} line items`, 'left', true, C.greenLight, C.green),
        lineCell('', 'center', false, C.greenLight),
        lineCell(totalUnitsDispatched, 'right', true, C.greenLight, C.green),
        lineCell('', 'center', false, C.greenLight),
        lineCell('', 'center', false, C.greenLight),
        lineCell('', 'center', false, C.greenLight),
      ]);
      dispatchMerges.push({ s: { r: gtR, c: 1 }, e: { r: gtR, c: 2 } });
    }

    const dispatchWs = aoa_to_sheet_styled(dispatchRows) as Record<string, unknown>;
    dispatchWs['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];
    dispatchWs['!rows'] = [{ hpt: 30 }, { hpt: 16 }, { hpt: 6 }];
    dispatchWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: DCOLS - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: DCOLS - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: DCOLS - 1 } },
      ...dispatchMerges,
    ];
    dispatchWs['!freeze'] = { xSplit: 0, ySplit: 3 };

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 3 — PENDING ORDERS DETAIL
    // ════════════════════════════════════════════════════════════════════════
    const PCOLS = 7;
    const pendingRows: unknown[][] = [];
    const pendingMerges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];

    pendingRows.push([titleCell('ICESTASY OPS — PENDING ORDERS (AWAITING DISPATCH)'), '', '', '', '', '', '']);
    pendingRows.push([subCell(`Generated: ${dateStr}  |  Statuses: Approved, Invoiced, In Production`), '', '', '', '', '', '']);
    pendingRows.push(emptyRow(PCOLS));

    const pendColHeaders = [
      headerCell('#', 'center'),
      headerCell('Product Name', 'left'),
      headerCell('Unit'),
      headerCell('Qty Ordered', 'right'),
      headerCell('In Stock Now', 'right'),
      headerCell('Shortfall', 'right'),
      headerCell('Can Dispatch?'),
    ];

    if (pending.length === 0) {
      pendingRows.push([subCell('No pending orders. All orders dispatched!'), '', '', '', '', '', '']);
    } else {
      let pLineNo = 1;
      for (const ord of pending) {
        const ordR = pendingRows.length;
        const ordUnits = ord.lines.reduce((s, l) => s + l.quantity, 0);
        const canDispatch = ord.lines.every(l => l.qty_on_hand >= l.quantity);
        const shortItems = ord.lines.filter(l => l.qty_on_hand < l.quantity).length;
        const ordLabel = `  Order #${ord.order_id}  ${ord.order_ref ? `· Ref: ${ord.order_ref}` : ''}  ${ord.customer_name ? `· ${ord.customer_name}` : ''}  —  ${ord.lines.length} item${ord.lines.length !== 1 ? 's' : ''},  ${ordUnits} units ordered  ${canDispatch ? '✓ Ready' : `⚠ ${shortItems} item${shortItems !== 1 ? 's' : ''} short`}`;
        pendingRows.push([
          ...Array(PCOLS).fill(null).map((_, i) =>
            cell(i === 0 ? ordLabel : '', {
              font:      { bold: true, sz: 10, color: { rgb: canDispatch ? C.green : C.amber } },
              fill:      { fgColor: { rgb: canDispatch ? C.greenFill : C.amberFill } },
              alignment: { horizontal: 'left', vertical: 'center' },
              border:    thinBorder,
            })
          ),
        ]);
        pendingMerges.push({ s: { r: ordR, c: 0 }, e: { r: ordR, c: PCOLS - 1 } });

        pendingRows.push(pendColHeaders);

        for (const line of ord.lines) {
          const shortfall = Math.max(0, line.quantity - line.qty_on_hand);
          const ok = shortfall === 0;
          pendingRows.push([
            lineCell(pLineNo++, 'center', false, C.white, C.mutedText),
            lineCell(line.product_name, 'left', true, ok ? C.white : C.amberFill),
            lineCell(line.unit, 'center', false, ok ? C.white : C.amberFill),
            lineCell(line.quantity, 'right', true, ok ? C.white : C.amberFill),
            lineCell(line.qty_on_hand, 'right', false, ok ? C.greenFill : C.redFill, ok ? C.green : C.red),
            lineCell(shortfall > 0 ? shortfall : '—', 'right', shortfall > 0, ok ? C.white : C.redFill, shortfall > 0 ? C.red : C.mutedText),
            cell(canDispatch ? '✓ Yes' : (ok ? '(other lines)' : '✗ No'), {
              font:      { bold: true, sz: 9, color: { rgb: ok ? (canDispatch ? C.green : C.amber) : C.red } },
              fill:      { fgColor: { rgb: ok ? (canDispatch ? C.greenFill : C.amberFill) : C.redFill } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border:    thinBorder,
            }),
          ]);
        }

        // Order sub-total
        const totalShortfall = ord.lines.reduce((s, l) => s + Math.max(0, l.quantity - l.qty_on_hand), 0);
        pendingRows.push([
          lineCell('', 'center'),
          lineCell(`Sub-total — Order #${ord.order_id}`, 'right', true, C.groupFill2, C.groupText),
          lineCell('', 'center', false, C.groupFill2),
          lineCell(ordUnits, 'right', true, C.groupFill2, C.groupText),
          lineCell('', 'center', false, C.groupFill2),
          lineCell(totalShortfall > 0 ? totalShortfall : '—', 'right', true, C.groupFill2, totalShortfall > 0 ? C.red : C.groupText),
          lineCell(canDispatch ? '✓ Ready' : `⚠ ${shortItems} short`, 'center', true, canDispatch ? C.greenFill : C.amberFill, canDispatch ? C.green : C.amber),
        ]);

        pendingRows.push(emptyRow(PCOLS));
      }
    }

    const pendingWs = aoa_to_sheet_styled(pendingRows) as Record<string, unknown>;
    pendingWs['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
    pendingWs['!rows'] = [{ hpt: 30 }, { hpt: 16 }, { hpt: 6 }];
    pendingWs['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: PCOLS - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: PCOLS - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: PCOLS - 1 } },
      ...pendingMerges,
    ];
    pendingWs['!freeze'] = { xSplit: 0, ySplit: 3 };

    // ════════════════════════════════════════════════════════════════════════
    // ASSEMBLE WORKBOOK
    // ════════════════════════════════════════════════════════════════════════
    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, summaryWs,  'Summary');
    XLSXStyle.utils.book_append_sheet(wb, dispatchWs, 'Dispatched Orders');
    XLSXStyle.utils.book_append_sheet(wb, pendingWs,  'Pending Orders');

    const buf = XLSXStyle.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `icestasy-dispatch-${now.toISOString().slice(0, 10)}.xlsx`;

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
