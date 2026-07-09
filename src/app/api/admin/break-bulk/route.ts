import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

// pack_type: '12sq' = 12×150ml = 1800ml per pack; 'sample' = 50ml per unit
const PACK_MATCHER: Record<string, { unit_volume_ml: number; units_per_pack: number; is_sample: boolean }> = {
  '12sq':   { unit_volume_ml: 150, units_per_pack: 12, is_sample: false },
  'sample': { unit_volume_ml: 50,  units_per_pack: 1,  is_sample: true  },
};

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

    const { source_fg_sku_id, tubs_to_break, pack_type } = await req.json();
    if (!source_fg_sku_id || !tubs_to_break || !pack_type || !PACK_MATCHER[pack_type]) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tubsNum = parseFloat(tubs_to_break);
    if (tubsNum <= 0) return NextResponse.json({ error: 'tubs_to_break must be > 0' }, { status: 400 });

    const matcher = PACK_MATCHER[pack_type];
    const mlPerPack = matcher.unit_volume_ml * matcher.units_per_pack;
    const outputQty = Math.floor((tubsNum * 4000) / mlPerPack);
    if (outputQty === 0) return NextResponse.json({ error: 'Not enough volume for even 1 output pack' }, { status: 400 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get the source SKU's flavour_id
    const { data: sourceSku, error: sourceErr } = await admin.schema('sales').from('skus')
      .select('id, flavour_id, sku_code').eq('id', source_fg_sku_id).single();
    if (sourceErr || !sourceSku) {
      return NextResponse.json({ error: 'Source SKU not found' }, { status: 404 });
    }

    // Find the matching pack_format
    const { data: packFormat, error: pfErr } = await admin.schema('sales').from('pack_formats')
      .select('id, name')
      .eq('unit_volume_ml', matcher.unit_volume_ml)
      .eq('units_per_pack', matcher.units_per_pack)
      .eq('is_sample', matcher.is_sample)
      .eq('status', 'active')
      .maybeSingle();
    if (pfErr || !packFormat) {
      return NextResponse.json({
        error: `Pack format not found. Run supabase/flavours_and_break_bulk.sql first.`,
      }, { status: 404 });
    }

    // Find or create the target SKU (same flavour, different pack format)
    const { data: existingTarget } = await admin.schema('sales').from('skus')
      .select('id')
      .eq('flavour_id', sourceSku.flavour_id)
      .eq('pack_format_id', packFormat.id)
      .maybeSingle();

    let targetSkuId: number;
    if (existingTarget?.id) {
      targetSkuId = existingTarget.id;
    } else {
      const skuCode = `${sourceSku.sku_code?.split('-')[0] || sourceSku.flavour_id}-${packFormat.name.replace(/\s+/g, '').toUpperCase()}`;
      const { data: newSku, error: skuErr } = await admin.schema('sales').from('skus')
        .insert({ flavour_id: sourceSku.flavour_id, pack_format_id: packFormat.id, sku_code: skuCode, status: 'active' })
        .select('id').single();
      if (skuErr || !newSku?.id) {
        return NextResponse.json({ error: `Could not create target SKU: ${skuErr?.message}` }, { status: 500 });
      }
      targetSkuId = newSku.id;
    }

    // Deduct from source
    const { error: deductErr } = await admin.schema('production').from('fg_units').insert({
      fg_sku_id: source_fg_sku_id,
      qty_produced: -tubsNum,
      produced_by: user.id,
      status: 'posted',
      note: `Break bulk → ${outputQty} × ${packFormat.name}`,
    });
    if (deductErr) return NextResponse.json({ error: `Deduct failed: ${deductErr.message}` }, { status: 500 });

    // Add to target
    const { error: addErr } = await admin.schema('production').from('fg_units').insert({
      fg_sku_id: targetSkuId,
      qty_produced: outputQty,
      produced_by: user.id,
      status: 'posted',
      note: `From ${tubsNum} × 4L bulk (break bulk)`,
    });
    if (addErr) {
      // Rollback
      await admin.schema('production').from('fg_units').insert({
        fg_sku_id: source_fg_sku_id,
        qty_produced: tubsNum,
        produced_by: user.id,
        status: 'posted',
        note: 'Rollback: break bulk add failed',
      });
      return NextResponse.json({ error: `Add to target failed: ${addErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, output_qty: outputQty, pack_name: packFormat.name });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
