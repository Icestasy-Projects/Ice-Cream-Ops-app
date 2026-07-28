import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// GET — return full alignment data: order_line sku_ids, sales.skus, fg_stock, pack_formats, flavours
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const [orderLinesRes, salesSkusRes, fgStockRes, packFormatsRes, flavoursRes, prepProdsRes] = await Promise.all([
      // All unique sku_ids referenced in order_lines
      admin.schema('sales').from('order_lines').select('sku_id'),
      // Existing sales.skus entries
      admin.schema('sales').from('skus').select('id, sku_code, flavour_id, pack_format_id'),
      // Production FG stock (fg_sku_id = production side identifier)
      admin.schema('production').from('v_fg_stock').select('fg_sku_id, product_name, unit, qty_on_hand'),
      // Pack formats from sales side
      admin.schema('sales').from('pack_formats').select('id, name, unit_volume_ml, units_per_pack'),
      // Flavours (shared reference)
      admin.schema('production').from('flavours').select('id, name'),
      // Prep products to show flavour→prep link
      admin.schema('production').from('prep_products').select('id, flavour_id, name'),
    ]);

    // Unique sku_ids from order_lines
    const allSkuIds = Array.from(new Set(
      (orderLinesRes.data || []).map((r: Record<string, unknown>) => r.sku_id as number)
    )).sort((a, b) => a - b);

    const salesSkus = (salesSkusRes.data || []) as Array<{
      id: number; sku_code: string | null; flavour_id: number | null; pack_format_id: number | null;
    }>;
    const salesSkuMap = new Map(salesSkus.map(s => [s.id, s]));

    const fgStock = (fgStockRes.data || []) as Array<{
      fg_sku_id: number; product_name: string; unit: string; qty_on_hand: number;
    }>;

    const packFormats = (packFormatsRes.data || []) as Array<{
      id: number; name: string; unit_volume_ml: number; units_per_pack: number;
    }>;

    const flavours = (flavoursRes.data || []) as Array<{ id: number; name: string }>;
    const prepProds = (prepProdsRes.data || []) as Array<{ id: number; flavour_id: number; name: string }>;
    const flavourToPrepName = new Map(prepProds.map(p => [p.flavour_id, p.name]));

    // Build alignment rows
    const rows = allSkuIds.map(skuId => {
      const existing = salesSkuMap.get(skuId);
      const packFmt = existing?.pack_format_id
        ? packFormats.find(p => p.id === existing.pack_format_id) : null;
      const flavour = existing?.flavour_id
        ? flavours.find(f => f.id === existing.flavour_id) : null;
      const prepName = existing?.flavour_id ? flavourToPrepName.get(existing.flavour_id) : null;

      return {
        sku_id: skuId,
        linked: !!existing,
        name: existing?.sku_code ?? null,
        flavour_id: existing?.flavour_id ?? null,
        flavour_name: flavour?.name ?? null,
        pack_format_id: existing?.pack_format_id ?? null,
        pack_format_name: packFmt?.name ?? null,
        prep_name: prepName ?? null,
      };
    });

    return NextResponse.json({
      rows,
      fg_stock: fgStock,
      pack_formats: packFormats,
      flavours,
      total: allSkuIds.length,
      linked: rows.filter(r => r.linked).length,
      unlinked: rows.filter(r => !r.linked).length,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST — upsert a sales.skus entry to link sku_id → flavour_id + pack_format_id
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json();
    const { sku_id, flavour_id, pack_format_id, name } = body as {
      sku_id: number; flavour_id: number; pack_format_id: number; name: string;
    };

    if (!sku_id || !flavour_id || !pack_format_id) {
      return NextResponse.json({ error: 'sku_id, flavour_id, pack_format_id are required' }, { status: 400 });
    }

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { error } = await admin.schema('sales').from('skus').upsert({
      id: sku_id,
      sku_code: name || `SKU-${sku_id}`,
      flavour_id,
      pack_format_id,
    }, { onConflict: 'id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE — remove a sales.skus entry (unlink)
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const skuId = Number(searchParams.get('sku_id'));
    if (!skuId) return NextResponse.json({ error: 'sku_id required' }, { status: 400 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { error } = await admin.schema('sales').from('skus').delete().eq('id', skuId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
