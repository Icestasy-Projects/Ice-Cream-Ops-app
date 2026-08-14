import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

async function getUser() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/admin/cost-sheet — return all rows
export async function GET() {
  try {
    const admin = adminClient();
    const { data, error } = await admin.schema('production').from('cost_sheet')
      .select('*')
      .order('flavour_type').order('flavour_name').order('purpose').order('ingredient');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST /api/admin/cost-sheet — bulk import (replaces all data)
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { items } = await req.json() as {
      items: Array<{
        flavour_type: string;
        flavour_name: string;
        ingredient: string;
        purpose: string;
        rate: number | null;
        rate_unit: string | null;
        qty_per_batch: number | null;
      }>;
    };

    if (!items?.length) return NextResponse.json({ error: 'No items provided' }, { status: 400 });

    const admin = adminClient();
    // Delete all existing and re-insert
    await admin.schema('production').from('cost_sheet').delete().neq('id', 0);

    const rows = items.map(item => ({
      ...item,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await admin.schema('production').from('cost_sheet').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, imported: rows.length });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// PATCH /api/admin/cost-sheet — update a single row's rate or qty
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { id, rate, qty_per_batch } = await req.json() as {
      id: number;
      rate?: number;
      qty_per_batch?: number;
    };

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const admin = adminClient();
    const update: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() };
    if (rate !== undefined) update.rate = rate;
    if (qty_per_batch !== undefined) update.qty_per_batch = qty_per_batch;

    const { error } = await admin.schema('production').from('cost_sheet').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
