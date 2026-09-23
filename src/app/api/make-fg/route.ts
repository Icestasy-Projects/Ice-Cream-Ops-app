/**
 * POST /api/make-fg
 * Records finished-goods production with explicit prep-batch consumption.
 *
 * Body: { fg_sku_id, prep_product_id, from_prep_l, extra_l, note? }
 *
 * from_prep_l  — litres produced from prep batches (prep stock deducted)
 * extra_l      — additional litres, no prep deducted
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co'
).trim();

export async function POST(req: NextRequest) {
  try {
    // Verify session
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json() as {
      fg_sku_id: number;
      prep_product_id: number;
      from_prep_l: number;
      extra_l: number;
      note?: string;
    };

    const { fg_sku_id, prep_product_id, from_prep_l, extra_l, note } = body;

    if (!fg_sku_id || !prep_product_id) {
      return NextResponse.json({ error: 'fg_sku_id and prep_product_id are required' }, { status: 400 });
    }
    if ((from_prep_l ?? 0) < 0 || (extra_l ?? 0) < 0) {
      return NextResponse.json({ error: 'Quantities must be non-negative' }, { status: 400 });
    }
    if ((from_prep_l ?? 0) === 0 && (extra_l ?? 0) === 0) {
      return NextResponse.json({ error: 'At least one quantity must be > 0' }, { status: 400 });
    }

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await admin
      .schema('production')
      .rpc('record_fg_production', {
        p_fg_sku_id:       fg_sku_id,
        p_prep_product_id: prep_product_id,
        p_from_prep_l:     from_prep_l ?? 0,
        p_extra_l:         extra_l ?? 0,
        p_user_id:         user.id,
        p_note:            note ?? null,
      });

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
