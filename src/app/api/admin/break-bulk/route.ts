import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

// pack_type: '12sq' = 12 squares × 150ml = 1800ml per pack; 'sample' = 50ml per unit
const PACK_ML: Record<string, number> = { '12sq': 1800, 'sample': 50 };
const PACK_LABEL: Record<string, string> = { '12sq': '12 Squares', 'sample': 'Sample 50ml' };
const PACK_UNIT: Record<string, string> = { '12sq': 'pack', 'sample': 'unit' };

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { data: profile } = await supabase.schema('production').from('user_profiles')
      .select('role').eq('user_id', user.id).maybeSingle();
    if (profile?.role !== 'super_admin' && profile?.role !== 'factory') {
      return NextResponse.json({ error: 'Not authorised' }, { status: 403 });
    }

    const { source_fg_sku_id, source_product_name, tubs_to_break, pack_type } = await req.json();

    if (!source_fg_sku_id || !tubs_to_break || !pack_type || !PACK_ML[pack_type]) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tubsNum = parseFloat(tubs_to_break);
    if (tubsNum <= 0) return NextResponse.json({ error: 'tubs_to_break must be > 0' }, { status: 400 });

    const mlPerTub = 4000;
    const outputPacks = Math.floor((tubsNum * mlPerTub) / PACK_ML[pack_type]);
    if (outputPacks === 0) return NextResponse.json({ error: 'Not enough volume for even 1 output pack' }, { status: 400 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find or create the target fg_sku
    const targetName = `${source_product_name} - ${PACK_LABEL[pack_type]}`;
    const { data: existingSku } = await admin.schema('production').from('fg_skus')
      .select('id').eq('name', targetName).maybeSingle();

    let targetSkuId: number;
    if (existingSku?.id) {
      targetSkuId = existingSku.id;
    } else {
      const { data: newSku, error: skuErr } = await admin.schema('production').from('fg_skus')
        .insert({ name: targetName, unit: PACK_UNIT[pack_type], status: 'active' })
        .select('id').single();
      if (skuErr || !newSku?.id) {
        return NextResponse.json({ error: `Could not create target SKU: ${skuErr?.message}` }, { status: 500 });
      }
      targetSkuId = newSku.id;
    }

    // Deduct from source (negative qty_produced)
    const { error: deductErr } = await admin.schema('production').from('fg_units').insert({
      fg_sku_id: source_fg_sku_id,
      qty_produced: -tubsNum,
      produced_by: user.id,
      status: 'posted',
      note: `Break bulk → ${outputPacks} × ${PACK_LABEL[pack_type]}`,
    });
    if (deductErr) return NextResponse.json({ error: `Deduct failed: ${deductErr.message}` }, { status: 500 });

    // Add to target
    const { error: addErr } = await admin.schema('production').from('fg_units').insert({
      fg_sku_id: targetSkuId,
      qty_produced: outputPacks,
      produced_by: user.id,
      status: 'posted',
      note: `From ${tubsNum} × 4L bulk of ${source_product_name}`,
    });
    if (addErr) {
      // Rollback the deduction
      await admin.schema('production').from('fg_units').insert({
        fg_sku_id: source_fg_sku_id,
        qty_produced: tubsNum,
        produced_by: user.id,
        status: 'posted',
        note: 'Rollback: break bulk add failed',
      });
      return NextResponse.json({ error: `Add to target failed: ${addErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, output_qty: outputPacks, target_sku_id: targetSkuId });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
