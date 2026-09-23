/**
 * GET /api/fg-capacity?sku_id=<id>
 * Returns expected FG tubs produceable from prep stock for a given FG SKU.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const skuId = req.nextUrl.searchParams.get('sku_id');
    if (!skuId) return NextResponse.json({ error: 'sku_id required' }, { status: 400 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get SKU → flavour_id + pack_format
    const { data: skuData } = await admin.schema('sales').from('skus')
      .select('id, flavour_id, pack_format_id, pack_formats(unit_volume_ml, units_per_pack)')
      .eq('id', parseInt(skuId))
      .single();

    const EMPTY = { prep_product_id: null, batch_yield_l: 0, factory_batches: 0, prep_stock_l: 0, litres_per_tub: 0, expected_tubs: 0 };
    if (!skuData) return NextResponse.json(EMPTY);

    const s = skuData as Record<string, unknown>;
    const flavourId = s.flavour_id as number | null;
    const pf = s.pack_formats as Record<string, unknown> | null;
    const unitVolMl = (pf?.unit_volume_ml as number) || 0;
    const unitsPerPack = (pf?.units_per_pack as number) || 1;
    const litresPerTub = (unitVolMl * unitsPerPack) / 1000;

    if (!flavourId) return NextResponse.json(EMPTY);

    // Get prep product for this flavour
    const { data: prepData } = await admin.schema('production').from('prep_products')
      .select('id, batch_yield_l').eq('flavour_id', flavourId).eq('status', 'active').maybeSingle();

    if (!prepData) return NextResponse.json(EMPTY);

    const prep = prepData as Record<string, unknown>;
    const prepId = prep.id as number;
    const batchYieldL = (prep.batch_yield_l as number) || 0;

    // Get prep stock (qty_total = batch count)
    const { data: stockData } = await admin.schema('production').from('v_prep_stock')
      .select('qty_factory, qty_total, unit').eq('prep_product_id', prepId).maybeSingle();

    const stock = (stockData as Record<string, unknown> | null);
    const factoryBatches = (stock?.qty_factory as number) || 0;
    const prepStockL = factoryBatches * batchYieldL;
    const expectedTubs = litresPerTub > 0 ? Math.floor(prepStockL / litresPerTub) : 0;

    return NextResponse.json({
      prep_product_id:   prepId,
      batch_yield_l:     batchYieldL,
      factory_batches:   factoryBatches,
      prep_stock_l:      prepStockL,
      litres_per_tub:    litresPerTub,
      expected_tubs:     expectedTubs,
      unit_volume_ml:    unitVolMl,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
