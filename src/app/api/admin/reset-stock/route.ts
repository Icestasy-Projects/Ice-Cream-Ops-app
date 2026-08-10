import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

function adminClient() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;
}

// POST /api/admin/reset-stock
// Wipes all RM ledger entries and purchase order records → resets all stock to 0
export async function POST() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = adminClient();

    // Delete in dependency order
    const steps = [
      admin.schema('production').from('rm_ledger').delete().neq('id', 0),
      admin.schema('production').from('rm_purchase_order_lines').delete().neq('id', 0),
      admin.schema('production').from('rm_purchase_orders').delete().neq('id', 0),
    ];

    const errors: string[] = [];
    for (const step of steps) {
      const { error } = await step;
      if (error) errors.push(error.message);
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'All RM stock reset to 0' });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
