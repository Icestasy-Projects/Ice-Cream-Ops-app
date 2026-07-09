import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { data: profile } = await supabase.schema('production').from('user_profiles')
      .select('role').eq('user_id', user.id).maybeSingle();
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data, error } = await admin.schema('production').from('user_profiles')
      .select('user_id, full_name, email, role, must_change_password')
      .order('full_name');

    if (error) {
      // Fallback if must_change_password column doesn't exist yet
      const { data: fallback } = await admin.schema('production').from('user_profiles')
        .select('user_id, full_name, email, role')
        .order('full_name');
      return NextResponse.json(fallback || []);
    }

    return NextResponse.json(data || []);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
