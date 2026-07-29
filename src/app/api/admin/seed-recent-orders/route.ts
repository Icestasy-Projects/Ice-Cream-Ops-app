/**
 * POST /api/admin/seed-recent-orders
 * Copies the most recent 10 orders into the last 42 days for weekly-req data.
 * Uses * select to discover real column names at runtime.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

async function auth() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .schema('production').from('user_profiles').select('role').eq('user_id', user.id).maybeSingle();
  if ((profile as any)?.role !== 'super_admin') return null;
  return user;
}

export async function GET() {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;
  const since42 = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await admin.schema('sales').from('orders')
    .select('id').gte('created_at', since42);

  const { data: sourceOrders } = await admin.schema('sales').from('orders')
    .select('*').lt('created_at', since42)
    .order('created_at', { ascending: false }).limit(3);

  return NextResponse.json({
    orders_in_last_42_days: (existing || []).length,
    source_orders_available: (sourceOrders || []).length,
    sample_columns: sourceOrders?.[0] ? Object.keys(sourceOrders[0]) : [],
  });
}

export async function POST() {
  if (!await auth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;
  const since42 = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent orders using * to discover real column names
  const { data: sourceOrders, error: soErr } = await admin.schema('sales').from('orders')
    .select('*')
    .lt('created_at', since42)
    .order('created_at', { ascending: false })
    .limit(10);

  if (soErr) return NextResponse.json({ error: soErr.message }, { status: 500 });
  if (!sourceOrders || sourceOrders.length === 0) {
    return NextResponse.json({ error: 'No source orders found to copy from' }, { status: 400 });
  }

  // Detect the id column name and created_at column
  const sample = sourceOrders[0] as Record<string, unknown>;
  const cols = Object.keys(sample);

  // Find the primary key column (id, order_id, etc.)
  const idCol = cols.find(c => c === 'id') || cols.find(c => c.endsWith('_id') && sample[c] !== null) || 'id';
  // Find a date column
  const dateCol = cols.find(c => c === 'created_at') || cols.find(c => c.includes('date') || c.includes('at')) || 'created_at';
  // Find status column
  const statusCol = cols.find(c => c === 'status') || null;

  const sourceIds = sourceOrders.map((o: any) => o[idCol] as number);

  const { data: sourceLines, error: slErr } = await admin.schema('sales').from('order_lines')
    .select('*')
    .in('order_id', sourceIds);

  if (slErr) return NextResponse.json({ error: slErr.message }, { status: 500 });

  const linesByOrderId = new Map<number, any[]>();
  for (const l of sourceLines || []) {
    const oid = l.order_id as number;
    if (!linesByOrderId.has(oid)) linesByOrderId.set(oid, []);
    linesByOrderId.get(oid)!.push(l);
  }

  const ordersCreated: number[] = [];
  const now = Date.now();
  const daySpread = 42 / sourceOrders.length;

  for (let i = 0; i < sourceOrders.length; i++) {
    const src = sourceOrders[i] as Record<string, unknown>;
    const daysAgo = Math.round((i + 0.5) * daySpread);
    const orderDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    // Build insert row: copy all columns except id and date, then override date + status
    const insertRow: Record<string, unknown> = {};
    for (const col of cols) {
      if (col === idCol) continue; // skip PK — let DB assign
      insertRow[col] = src[col];
    }
    insertRow[dateCol] = orderDate;
    if (statusCol) insertRow[statusCol] = 'dispatched';

    const { data: newOrder, error: insErr } = await admin.schema('sales').from('orders')
      .insert(insertRow)
      .select(idCol)
      .single();

    if (insErr || !newOrder) {
      return NextResponse.json({
        error: insErr?.message || 'Insert returned no row',
        insert_row: insertRow,
        id_col: idCol,
        date_col: dateCol,
        status_col: statusCol,
        all_cols: cols,
      }, { status: 500 });
    }

    const newOrderId = newOrder[idCol] as number;
    ordersCreated.push(newOrderId);

    const lines = linesByOrderId.get(src[idCol] as number) || [];
    if (lines.length > 0) {
      const lineCols = Object.keys(lines[0]);
      const lineIdCol = lineCols.find(c => c === 'id') || 'id';
      const newLines = lines.map((l: any) => {
        const nl: Record<string, unknown> = {};
        for (const lc of lineCols) {
          if (lc === lineIdCol) continue; // skip line PK
          nl[lc] = l[lc];
        }
        nl.order_id = newOrderId;
        return nl;
      });
      const { error: lineErr } = await admin.schema('sales').from('order_lines').insert(newLines);
      if (lineErr) console.error('line insert error:', lineErr.message);
    }
  }

  return NextResponse.json({
    ok: true,
    orders_created: ordersCreated.length,
    order_ids: ordersCreated,
    message: `Created ${ordersCreated.length} orders in the last 42 days based on previous order history.`,
  });
}
