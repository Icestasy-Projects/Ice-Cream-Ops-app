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

async function checkAuth() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET — return full alignment data
export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = adminClient();

    const [orderLinesRes, salesSkusRes, fgStockRes, packFormatsRes, prepProdsRes] = await Promise.all([
      admin.schema('sales').from('order_lines').select('sku_id'),
      admin.schema('sales').from('skus').select('id, sku_code, flavour_id, pack_format_id'),
      admin.schema('production').from('v_fg_stock').select('fg_sku_id, product_name, unit, qty_on_hand'),
      admin.schema('sales').from('pack_formats').select('id, name, unit_volume_ml, units_per_pack'),
      // flavours = prep_products (flavour_id = prep_product id)
      admin.schema('production').from('prep_products').select('id, name'),
    ]);

    const allSkuIds = (Array.from(new Set(
      (orderLinesRes.data || []).map((r: any) => r.sku_id as number)
    )) as number[]).sort((a, b) => a - b);

    const salesSkus = (salesSkusRes.data || []) as Array<{
      id: number; sku_code: string | null; flavour_id: number | null; pack_format_id: number | null;
    }>;
    const salesSkuMap = new Map(salesSkus.map(s => [s.id, s]));

    const fgStock = (fgStockRes.data || []) as Array<{
      fg_sku_id: number; product_name: string; unit: string; qty_on_hand: number;
    }>;
    const fgStockMap = new Map(fgStock.map(s => [s.fg_sku_id, s]));

    const packFormats = (packFormatsRes.data || []) as Array<{
      id: number; name: string; unit_volume_ml: number; units_per_pack: number;
    }>;

    // flavours = prep_products
    const prepProds = (prepProdsRes.data || []) as Array<{ id: number; name: string }>;
    const prepProdMap = new Map(prepProds.map(p => [p.id, p.name]));

    const rows = allSkuIds.map(skuId => {
      const existing = salesSkuMap.get(skuId);
      const stock = fgStockMap.get(skuId);
      const packFmt = existing?.pack_format_id
        ? packFormats.find(p => p.id === existing.pack_format_id) : null;
      const flavourName = existing?.flavour_id
        ? (prepProdMap.get(existing.flavour_id) ?? null)
        : null;

      return {
        sku_id: skuId,
        linked: !!existing,
        name: existing?.sku_code ?? null,
        product_name: stock?.product_name ?? null,
        flavour_id: existing?.flavour_id ?? null,
        flavour_name: flavourName,
        pack_format_id: existing?.pack_format_id ?? null,
        pack_format_name: packFmt?.name ?? null,
        flavour_matches_product: flavourName && stock?.product_name
          ? stock.product_name.toLowerCase().includes(flavourName.toLowerCase()) ||
            flavourName.toLowerCase().includes(stock.product_name.toLowerCase())
          : null,
      };
    });

    return NextResponse.json({
      rows,
      fg_stock: fgStock,
      pack_formats: packFormats,
      flavours: prepProds, // prep_products exposed as flavours
      total: allSkuIds.length,
      linked: rows.filter(r => r.linked).length,
      unlinked: rows.filter(r => !r.linked).length,
      mismatched: rows.filter(r => r.flavour_matches_product === false).length,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// POST — upsert a sales.skus entry OR run auto-align
export async function POST(req: NextRequest) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json();
    const admin = adminClient();

    // ── auto_align: match each SKU's product_name to a prep_product by name ──
    if (body.action === 'auto_align') {
      const [salesSkusRes, fgStockRes, prepProdsRes] = await Promise.all([
        admin.schema('sales').from('skus').select('id, sku_code, pack_format_id'),
        admin.schema('production').from('v_fg_stock').select('fg_sku_id, product_name'),
        admin.schema('production').from('prep_products').select('id, name'),
      ]);

      const salesSkus = (salesSkusRes.data || []) as Array<{ id: number; sku_code: string | null; pack_format_id: number | null }>;
      const fgStockMap = new Map((fgStockRes.data || []).map((s: any) => [s.fg_sku_id as number, s.product_name as string]));
      const prepProds = (prepProdsRes.data || []) as Array<{ id: number; name: string }>;

      // For each SKU find the best matching prep_product by name
      const bestMatch = (productName: string): number | null => {
        const nameLower = productName.toLowerCase();
        let match = prepProds.find(p => p.name.toLowerCase() === nameLower);
        if (match) return match.id;
        match = prepProds.find(p =>
          nameLower.includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(nameLower)
        );
        return match?.id ?? null;
      };

      const updates: { id: number; flavour_id: number; old_name: string; new_flavour: string }[] = [];
      const unmatched: { id: number; product_name: string | null }[] = [];

      for (const sku of salesSkus) {
        const productName = fgStockMap.get(sku.id) as string | undefined;
        if (!productName) { unmatched.push({ id: sku.id, product_name: null }); continue; }

        const newFlavourId = bestMatch(productName);
        if (!newFlavourId) { unmatched.push({ id: sku.id, product_name: productName }); continue; }

        const prepName = prepProds.find(p => p.id === newFlavourId)?.name ?? '';
        updates.push({ id: sku.id, flavour_id: newFlavourId, old_name: productName, new_flavour: prepName });
      }

      if (body.preview) {
        return NextResponse.json({ updates, unmatched });
      }

      // Apply updates
      let applied = 0;
      for (const u of updates) {
        const { error } = await admin.schema('sales').from('skus')
          .update({ flavour_id: u.flavour_id })
          .eq('id', u.id);
        if (!error) applied++;
      }

      return NextResponse.json({ ok: true, applied, unmatched_count: unmatched.length, unmatched });
    }

    // ── single upsert ────────────────────────────────────────────────────────
    const { sku_id, flavour_id, pack_format_id, name } = body as {
      sku_id: number; flavour_id: number; pack_format_id: number; name: string;
    };

    if (!sku_id || !flavour_id || !pack_format_id) {
      return NextResponse.json({ error: 'sku_id, flavour_id, pack_format_id are required' }, { status: 400 });
    }

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
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const skuId = Number(searchParams.get('sku_id'));
    if (!skuId) return NextResponse.json({ error: 'sku_id required' }, { status: 400 });

    const admin = adminClient();
    const { error } = await admin.schema('sales').from('skus').delete().eq('id', skuId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
