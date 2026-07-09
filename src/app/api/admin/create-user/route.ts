import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

function errMsg(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    const o = e as Record<string, unknown>;
    if (o.message && typeof o.message === 'string') return o.message;
    if (o.msg && typeof o.msg === 'string') return o.msg;
    const s = JSON.stringify(e);
    return s === '{}' ? 'Supabase returned an empty error — check SUPABASE_SERVICE_ROLE_KEY in Vercel env vars' : s;
  }
  return String(e);
}

export async function POST(req: NextRequest) {
  try {
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';

    // Verify caller is authenticated and is a super_admin
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .schema('production')
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admins can create users' }, { status: 403 });
    }

    const { full_name, email, role } = await req.json();

    if (!full_name || !email || !role) {
      return NextResponse.json({ error: 'full_name, email, and role are required' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email, password: 'test@123', email_confirm: true }),
    });

    const createBody = await createRes.json();

    if (!createRes.ok || !createBody.id) {
      return NextResponse.json({
        error: createBody.msg || createBody.message || createBody.error_description || JSON.stringify(createBody),
        raw: JSON.stringify(createBody),
        status_code: createRes.status,
      }, { status: 400 });
    }

    const newUserId: string = createBody.id;
    const adminClient = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { error: profileError } = await adminClient
      .schema('production')
      .from('user_profiles')
      .upsert({
        user_id: newUserId,
        role,
        full_name,
        email,
        must_change_password: true,
      }, { onConflict: 'user_id' });

    if (profileError) {
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'apikey': SERVICE_ROLE_KEY },
      });
      return NextResponse.json({ error: errMsg(profileError) }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: newUserId });
  } catch (e: unknown) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}
