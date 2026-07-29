import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

const WINDOW_WEEKS = 13;

export interface OrderContribution {
  order_id: number;
  customer_name: string | null;
  order_ref: string | null;
  order_date: string;
  status: string;
  qty: number;
}

export interface FgCalcBreakdown {
  sku_id: number;
  product_name: string;
  unit: string;
  orders: OrderContribution[];
  total_qty: number;
  weekly_req: number;
  window_weeks: number;
  threshold: number;
  qty_on_hand: number;
  sku_code: string | null;
  flavour_name: string | null;
  pack_format_name: string | null;
  litres_per_pack: number | null;
}

export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { data: profile } = await supabase
    .schema('production').from('user_profiles').select('role').eq('user_id', user.id).maybeSingle();
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const skuId = parseInt(searchParams.get('sku_id') || '0', 10);
  if (!skuId) return NextResponse.json({ error: 'sku_id required' }, { status: 400 });

  const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;

  // FG stock info
  const { data: stockRows } = await admin.schema('production').from('v_fg_stock')
    .select('fg_sku_id, product_name, unit, qty_on_hand')
    .eq('fg_sku_id', skuId)
    .maybeSingle();
  const stock = stockRows as Record<string, unknown> | null;

  // Sales SKU info
  const { data: skuRow } = await admin.schema('sales').from('skus')
    .select('id, sku_code, flavour_id, pack_format_id')
    .eq('id', skuId)
    .maybeSingle();
  const sku = skuRow as Record<string, unknown> | null;

  let flavourName: string | null = null;
  let packFormatName: string | null = null;
  let litresPerPack: number | null = null;

  // Flavour name comes from prep_products (flavour_id = prep_product id)
  if (sku?.flavour_id) {
    const { data: pp } = await admin.schema('production').from('prep_products')
      .select('name').eq('id', sku.flavour_id as number).maybeSingle();
    flavourName = (pp as Record<string, unknown> | null)?.name as string || null;
  }
  if (sku?.pack_format_id) {
    const { data: pf } = await admin.schema('sales').from('pack_formats')
      .select('name, unit_volume_ml, units_per_pack').eq('id', sku.pack_format_id as number).maybeSingle();
    const pfRow = pf as Record<string, unknown> | null;
    if (pfRow) {
      packFormatName = pfRow.name as string || null;
      litresPerPack = ((pfRow.unit_volume_ml as number) * (pfRow.units_per_pack as number)) / 1000;
    }
  }

  // Same 90-day / 13-week window as /api/weekly-req
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentOrders } = await admin.schema('sales').from('orders')
    .select('id, customer_name, order_ref, created_at, status')
    .gte('created_at', since)
    .in('status', ['approved', 'invoiced', 'in_production', 'dispatched', 'delivered']);

  const recentOrderIds = (recentOrders || []).map((o: Record<string, unknown>) => o.id as number);
  const orderMap = new Map<number, Record<string, unknown>>(
    (recentOrders || []).map((o: Record<string, unknown>) => [o.id as number, o])
  );

  let orderLines: Record<string, unknown>[] = [];
  if (recentOrderIds.length > 0) {
    const { data: lines } = await admin.schema('sales').from('order_lines')
      .select('quantity, order_id')
      .eq('sku_id', skuId)
      .in('order_id', recentOrderIds);
    orderLines = (lines || []) as Record<string, unknown>[];
  }

  const contributions: OrderContribution[] = [];
  let totalQty = 0;

  for (const line of orderLines) {
    const ordId = line.order_id as number;
    const order = orderMap.get(ordId);
    const qty = (line.quantity as number) || 0;
    contributions.push({
      order_id: ordId,
      customer_name: (order?.customer_name as string) || null,
      order_ref: (order?.order_ref as string) || null,
      order_date: (order?.created_at as string) || '',
      status: (order?.status as string) || '',
      qty,
    });
    totalQty += qty;
  }

  const weeklyReq = Math.ceil(totalQty / WINDOW_WEEKS);
  const threshold = Math.ceil(weeklyReq * 2.5);
  const qtyOnHand = (stock?.qty_on_hand as number) || 0;

  const breakdown: FgCalcBreakdown = {
    sku_id: skuId,
    product_name: (stock?.product_name as string) || `SKU #${skuId}`,
    unit: (stock?.unit as string) || 'unit',
    orders: contributions,
    total_qty: totalQty,
    weekly_req: weeklyReq,
    window_weeks: WINDOW_WEEKS,
    threshold,
    qty_on_hand: qtyOnHand,
    sku_code: (sku?.sku_code as string) || null,
    flavour_name: flavourName,
    pack_format_name: packFormatName,
    litres_per_pack: litresPerPack,
  };

  return NextResponse.json(breakdown);
}
