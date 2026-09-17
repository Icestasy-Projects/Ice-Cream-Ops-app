import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  try {
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { data: profile } = await supabase
      .schema('production')
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admins can delete users' }, { status: 403 });
    }

    const { user_id } = await req.json();
    if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 });

    if (user_id === user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    const adminClient = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    await adminClient.schema('production').from('user_profiles').delete().eq('user_id', user_id);

    const delRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY },
    });

    if (!delRes.ok && delRes.status !== 404) {
      const body = await delRes.json().catch(() => ({}));
      return NextResponse.json({ error: body.msg || body.message || 'Failed to delete auth user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
