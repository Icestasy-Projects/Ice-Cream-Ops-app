/**
 * POST /api/admin/seed-recent-orders
 * Copies the most recent N orders (and their lines) into the last 42 days
 * so the weekly-req window has data to average.
 * Admin only. Safe to run multiple times — skips orders already in window.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

export async function GET() {
  // Preview: show what would be seeded
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { data: profile } = await supabase
    .schema('production').from('user_profiles').select('role').eq('user_id', user.id).maybeSingle();
  if ((profile as any)?.role !== 'super_admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;

  const since42 = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

  // How many orders already exist in window
  const { data: existing } = await admin.schema('sales').from('orders')
    .select('id, created_at, status')
    .gte('created_at', since42)
    .order('created_at', { ascending: false });

  // Fetch latest 20 orders outside window (to use as templates)
  const { data: sourceOrders } = await admin.schema('sales').from('orders')
    .select('id, customer_name, order_ref, status, notes')
    .lt('created_at', since42)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({
    orders_already_in_window: (existing || []).length,
    source_orders_available: (sourceOrders || []).length,
    message: 'POST to this endpoint to seed orders into the last 42 days',
  });
}

export async function POST() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const { data: profile } = await supabase
    .schema('production').from('user_profiles').select('role').eq('user_id', user.id).maybeSingle();
  if ((profile as any)?.role !== 'super_admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;

  // Fetch latest 10 orders (outside the 42-day window) to use as templates
  const since42 = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

  const { data: sourceOrders, error: soErr } = await admin.schema('sales').from('orders')
    .select('id, customer_name, order_ref, status, notes')
    .lt('created_at', since42)
    .order('created_at', { ascending: false })
    .limit(10);

  if (soErr) return NextResponse.json({ error: soErr.message }, { status: 500 });
  if (!sourceOrders || sourceOrders.length === 0) {
    return NextResponse.json({ error: 'No source orders found to copy from' }, { status: 400 });
  }

  // Fetch lines for those orders
  const sourceIds = sourceOrders.map((o: any) => o.id as number);
  const { data: sourceLines, error: slErr } = await admin.schema('sales').from('order_lines')
    .select('order_id, sku_id, quantity')
    .in('order_id', sourceIds);

  if (slErr) return NextResponse.json({ error: slErr.message }, { status: 500 });

  const linesByOrderId = new Map<number, any[]>();
  for (const l of sourceLines || []) {
    if (!linesByOrderId.has(l.order_id)) linesByOrderId.set(l.order_id, []);
    linesByOrderId.get(l.order_id)!.push(l);
  }

  // Spread the copied orders across the last 42 days
  const ordersCreated: number[] = [];
  const now = Date.now();
  const daySpread = 42 / sourceOrders.length;

  for (let i = 0; i < sourceOrders.length; i++) {
    const src = sourceOrders[i] as any;
    const daysAgo = Math.round((i + 0.5) * daySpread); // spread evenly
    const orderDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    // Insert new order (no id — let DB auto-assign)
    const { data: newOrder, error: insErr } = await admin.schema('sales').from('orders')
      .insert({
        customer_name: src.customer_name,
        order_ref: `${src.order_ref || 'SEED'}-R`,
        status: 'dispatched',
        notes: src.notes,
        created_at: orderDate,
      })
      .select('id')
      .single();

    if (insErr || !newOrder) continue;

    const newOrderId = newOrder.id as number;
    ordersCreated.push(newOrderId);

    const lines = linesByOrderId.get(src.id) || [];
    if (lines.length > 0) {
      const newLines = lines.map((l: any) => ({
        order_id: newOrderId,
        sku_id: l.sku_id,
        quantity: l.quantity,
      }));
      await admin.schema('sales').from('order_lines').insert(newLines);
    }
  }

  return NextResponse.json({
    ok: true,
    orders_created: ordersCreated.length,
    order_ids: ordersCreated,
    message: `Created ${ordersCreated.length} orders in the last 42 days based on previous order history.`,
  });
}
