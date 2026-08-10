import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

function adminClient() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;
}

// POST /api/admin/reset-stock?scope=rm|fg|prep|all
// Wipes stock ledgers and source records to reset quantities to 0
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const scope = new URL(req.url).searchParams.get('scope') || 'all';
    const admin = adminClient();
    const cleared: string[] = [];
    const errors: string[] = [];

    const del = async (schema: string, table: string, label: string) => {
      const { error } = await admin.schema(schema).from(table).delete().neq('id', 0);
      if (error) errors.push(`${label}: ${error.message}`);
      else cleared.push(label);
    };

    if (scope === 'rm' || scope === 'all') {
      await del('production', 'rm_ledger', 'RM ledger');
      await del('production', 'rm_purchase_order_lines', 'RM purchase order lines');
      await del('production', 'rm_purchase_orders', 'RM purchase orders');
    }

    if (scope === 'prep' || scope === 'all') {
      await del('production', 'prep_ledger', 'Prep ledger');
      await del('production', 'prep_units', 'Prep units (make-prep records)');
    }

    if (scope === 'fg' || scope === 'all') {
      await del('production', 'fg_ledger', 'FG ledger');
      await del('production', 'fg_units', 'FG units (make-tubs records)');
    }

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, cleared, errors }, { status: 500 });
    }

    return NextResponse.json({ ok: true, cleared });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
