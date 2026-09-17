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

    if (!skuData) return NextResponse.json({ prep_stock_l: 0, expected_tubs: 0, unit_volume_ml: 0 });

    const s = skuData as Record<string, unknown>;
    const flavourId = s.flavour_id as number | null;
    const pf = s.pack_formats as Record<string, unknown> | null;
    const unitVolMl = (pf?.unit_volume_ml as number) || 0;
    const unitsPerPack = (pf?.units_per_pack as number) || 1;
    const litresPerTub = (unitVolMl * unitsPerPack) / 1000;

    if (!flavourId || litresPerTub === 0) {
      return NextResponse.json({ prep_stock_l: 0, expected_tubs: 0, unit_volume_ml: unitVolMl });
    }

    // Get prep product for this flavour
    const { data: prepData } = await admin.schema('production').from('prep_products')
      .select('id').eq('flavour_id', flavourId).eq('status', 'active').maybeSingle();

    if (!prepData) {
      return NextResponse.json({ prep_stock_l: 0, expected_tubs: 0, unit_volume_ml: unitVolMl });
    }

    const prepId = (prepData as Record<string, unknown>).id as number;

    // Get prep stock
    const { data: stockData } = await admin.schema('production').from('v_prep_stock')
      .select('qty_total, unit').eq('prep_product_id', prepId).maybeSingle();

    const prepStockL = (stockData as Record<string, unknown> | null)?.qty_total as number || 0;
    const expectedTubs = litresPerTub > 0 ? Math.floor(prepStockL / litresPerTub) : 0;

    return NextResponse.json({
      prep_stock_l: prepStockL,
      prep_stock_unit: (stockData as Record<string, unknown> | null)?.unit as string || 'L',
      litres_per_tub: litresPerTub,
      expected_tubs: expectedTubs,
      unit_volume_ml: unitVolMl,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
