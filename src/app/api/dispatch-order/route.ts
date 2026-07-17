import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

// GET /api/dispatch-order — returns pending orders with lines + stock levels
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const [ordersRes, stockRes] = await Promise.all([
      admin.schema('sales').from('order_lines')
        .select('id, order_id, sku_id, quantity, orders!inner(*)')
        .in('orders.status', ['approved', 'invoiced', 'in_production'])
        .order('id'),
      admin.schema('production').from('v_fg_stock')
        .select('fg_sku_id, product_name, unit, qty_on_hand'),
    ]);

    // Log first order row to diagnose column names (only in dev)
    if (ordersRes.error) console.error('order_lines query error:', ordersRes.error.message);
    if (ordersRes.data?.length) console.log('order row sample:', JSON.stringify(ordersRes.data[0]));

    // Build stock map: fg_sku_id → {product_name, unit, qty_on_hand}
    const stockMap: Record<number, { product_name: string; unit: string; qty_on_hand: number }> = {};
    for (const s of stockRes.data || []) {
      const r = s as Record<string, unknown>;
      stockMap[r.fg_sku_id as number] = {
        product_name: r.product_name as string,
        unit: r.unit as string,
        qty_on_hand: (r.qty_on_hand as number) || 0,
      };
    }

    // Group lines by order — use * select so we pick up real column names
    const ordersMap: Record<number, {
      order_id: number;
      status: string;
      created_at: string;
      customer_name: string | null;
      order_ref: string | null;
      raw_order: Record<string, unknown>;
      lines: { line_id: number; sku_id: number; quantity: number; product_name: string; unit: string; qty_on_hand: number; has_stock: boolean }[];
    }> = {};

    for (const row of ordersRes.data || []) {
      const r = row as Record<string, unknown>;
      const ord = r.orders as Record<string, unknown>;
      const orderId = (ord.id ?? ord.order_id) as number;
      const skuId = r.sku_id as number;
      const qty = (r.quantity as number) || 0;
      const stock = stockMap[skuId];

      // Try common customer name columns
      const customerName = (
        ord.customer_name ?? ord.client_name ?? ord.account_name ??
        ord.customer ?? ord.contact_name ?? ord.billing_name
      ) as string | null ?? null;

      // Try common order reference columns
      const orderRef = (
        ord.order_ref ?? ord.order_number ?? ord.reference ?? ord.ref ??
        ord.invoice_number ?? ord.order_no ?? ord.number
      ) as string | null ?? null;

      if (!ordersMap[orderId]) {
        ordersMap[orderId] = {
          order_id: orderId,
          status: ord.status as string,
          created_at: (ord.created_at ?? ord.date ?? ord.order_date) as string,
          customer_name: customerName,
          order_ref: orderRef,
          raw_order: ord,
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
        has_stock: (stock?.qty_on_hand ?? 0) >= qty,
      });
    }

    const orders = Object.values(ordersMap).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Include first raw_order for column discovery, then strip it
    const debugSample = orders[0]?.raw_order ?? null;
    const cleanOrders = orders.map(({ raw_order: _raw, ...o }) => o);
    return NextResponse.json({ orders: cleanOrders, debug_order_columns: debugSample ? Object.keys(debugSample) : [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST /api/dispatch-order — marks an order dispatched and deducts FG stock
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { order_id, note } = await req.json();
    if (!order_id) return NextResponse.json({ error: 'order_id required' }, { status: 400 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Fetch the order and its lines
    const { data: orderData, error: orderErr } = await admin.schema('sales').from('orders')
      .select('id, status').eq('id', order_id).single();
    if (orderErr || !orderData) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const ord = orderData as Record<string, unknown>;
    if (!['approved', 'invoiced', 'in_production'].includes(ord.status as string)) {
      return NextResponse.json({ error: 'Order is not in a dispatchable state' }, { status: 400 });
    }

    const { data: lines, error: linesErr } = await admin.schema('sales').from('order_lines')
      .select('sku_id, quantity').eq('order_id', order_id);
    if (linesErr || !lines?.length) return NextResponse.json({ error: 'No order lines found' }, { status: 404 });

    // Verify stock for all lines before committing anything
    const stockRes = await admin.schema('production').from('v_fg_stock')
      .select('fg_sku_id, qty_on_hand, product_name')
      .in('fg_sku_id', lines.map(l => (l as Record<string, unknown>).sku_id as number));

    const stockMap: Record<number, { qty_on_hand: number; product_name: string }> = {};
    for (const s of stockRes.data || []) {
      const r = s as Record<string, unknown>;
      stockMap[r.fg_sku_id as number] = {
        qty_on_hand: (r.qty_on_hand as number) || 0,
        product_name: r.product_name as string,
      };
    }

    const shortfalls: string[] = [];
    for (const lineRaw of lines) {
      const line = lineRaw as Record<string, unknown>;
      const skuId = line.sku_id as number;
      const qty = (line.quantity as number) || 0;
      const onHand = stockMap[skuId]?.qty_on_hand ?? 0;
      if (onHand < qty) {
        shortfalls.push(`${stockMap[skuId]?.product_name || `SKU #${skuId}`}: need ${qty}, have ${onHand}`);
      }
    }
    if (shortfalls.length > 0) {
      return NextResponse.json({ error: `Insufficient stock:\n${shortfalls.join('\n')}` }, { status: 422 });
    }

    // Insert fg_dispatches for each line
    const dispatchInserts = lines.map(lineRaw => {
      const line = lineRaw as Record<string, unknown>;
      return {
        fg_sku_id: line.sku_id as number,
        qty: line.quantity as number,
        dispatched_by: user.id,
        note: note || `Order #${order_id}`,
        status: 'posted',
      };
    });

    const { error: dispatchErr } = await admin.schema('production').from('fg_dispatches')
      .insert(dispatchInserts);
    if (dispatchErr) return NextResponse.json({ error: `Dispatch insert failed: ${dispatchErr.message}` }, { status: 500 });

    // Update order status to dispatched
    const { error: updateErr } = await admin.schema('sales').from('orders')
      .update({ status: 'dispatched' }).eq('id', order_id);
    if (updateErr) {
      // Non-fatal: stock already deducted, just log
      console.error('Failed to update order status:', updateErr.message);
    }

    return NextResponse.json({ success: true, lines_dispatched: lines.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
