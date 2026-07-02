import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: NextRequest) {
  // Verify caller is authenticated and is a super_admin
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .schema('production')
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { full_name, email, role } = await req.json();

  if (!full_name || !email || !role) {
    return NextResponse.json({ error: 'full_name, email, and role are required' }, { status: 400 });
  }

  // Use service role client to create auth user
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: 'test@123',
    email_confirm: true, // skip email confirmation
  });

  if (createError || !newUser.user) {
    return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 400 });
  }

  // Insert into user_profiles
  const { error: profileError } = await adminClient
    .schema('production')
    .from('user_profiles')
    .insert({
      user_id: newUser.user.id,
      role,
      full_name,
      email,
      must_change_password: true,
    });

  if (profileError) {
    // Clean up the auth user if profile insert fails
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, user_id: newUser.user.id });
}
