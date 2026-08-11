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

async function checkAuth() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// PATCH — update an rm_item
export async function PATCH(req: NextRequest) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { id, name, unit, category_id } = await req.json() as {
      id: number; name: string; unit: string; category_id: number | null;
    };
    if (!id || !name?.trim() || !unit?.trim()) {
      return NextResponse.json({ error: 'id, name and unit are required' }, { status: 400 });
    }

    const admin = adminClient();
    const { error } = await admin.schema('production').from('rm_items')
      .update({ name: name.trim(), unit: unit.trim(), category_id: category_id ?? null })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE — remove an rm_item and its dependents
export async function DELETE(req: NextRequest) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const admin = adminClient();
    await admin.schema('production').from('prep_recipes').delete().eq('rm_item_id', id);
    await admin.schema('production').from('rm_costs').delete().eq('rm_item_id', id);

    const { error } = await admin.schema('production').from('rm_items').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
