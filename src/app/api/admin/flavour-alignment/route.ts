/**
 * GET  /api/admin/flavour-alignment
 *   Returns a 3-way comparison:
 *     • production.flavours          (the shared reference table)
 *     • production.prep_products     (what the kitchen actually makes)
 *     • sales.skus                   (what the sales side can sell)
 *
 * POST /api/admin/flavour-alignment
 *   Body: { action: 'upsert_flavour', name: string }
 *     → ensures a row exists in production.flavours for this name
 *   Body: { action: 'link_prep_product', prep_product_id, flavour_id }
 *     → sets production.prep_products.flavour_id
 *   Body: { action: 'create_sales_sku', sku_id, flavour_id, pack_format_id, name }
 *     → upserts a row in sales.skus
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

function adminClient() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = adminClient();

    const [flavoursRes, prepProdsRes, salesSkusRes, packFormatsRes, orderLineSkuIdsRes] = await Promise.all([
      admin.schema('production').from('flavours').select('id, name'),
      admin.schema('production').from('prep_products').select('id, name, flavour_id, batch_yield_l, status'),
      admin.schema('sales').from('skus').select('id, sku_code, flavour_id, pack_format_id'),
      admin.schema('sales').from('pack_formats').select('id, name, unit_volume_ml, units_per_pack'),
      // distinct sku_ids used in order_lines
      admin.schema('sales').from('order_lines').select('sku_id'),
    ]);

    type R = Record<string, unknown>;
    const flavours = (flavoursRes.data || []) as R[];
    const prepProds = (prepProdsRes.data || []) as R[];
    const salesSkus = (salesSkusRes.data || []) as R[];
    const packFormats = (packFormatsRes.data || []) as R[];

    // unique order_line sku_ids
    const orderLineSkuIds = Array.from(new Set(
      (orderLineSkuIdsRes.data || []).map((r: R) => r.sku_id as number)
    )).sort((a, b) => a - b);

    // Build look-up maps
    const flavourById = new Map<number, R>(flavours.map(f => [f.id as number, f]));
    // flavour_id → list of prep_products
    const prepByFlavourId = new Map<number, R[]>();
    for (const p of prepProds) {
      const fid = p.flavour_id as number | null;
      if (fid) {
        if (!prepByFlavourId.has(fid)) prepByFlavourId.set(fid, []);
        prepByFlavourId.get(fid)!.push(p);
      }
    }
    // flavour_id → list of sales.skus
    const salesByFlavourId = new Map<number, R[]>();
    for (const s of salesSkus) {
      const fid = s.flavour_id as number | null;
      if (fid) {
        if (!salesByFlavourId.has(fid)) salesByFlavourId.set(fid, []);
        salesByFlavourId.get(fid)!.push(s);
      }
    }
    const salesSkuById = new Map<number, R>(salesSkus.map(s => [s.id as number, s]));

    // ── Category A: production.flavours rows ──────────────────────────────
    const flavourRows = flavours.map(f => {
      const fid = f.id as number;
      const preps = prepByFlavourId.get(fid) || [];
      const skus = salesByFlavourId.get(fid) || [];
      return {
        flavour_id: fid,
        flavour_name: f.name as string,
        prep_products: preps.map(p => ({
          id: p.id, name: p.name, batch_yield_l: p.batch_yield_l, status: p.status,
        })),
        sales_skus: skus.map(s => ({
          id: s.id, name: s.sku_code, pack_format_id: s.pack_format_id,
          pack_format_name: (packFormats.find(p => p.id === s.pack_format_id) as R | undefined)?.name ?? null,
          in_order_lines: orderLineSkuIds.includes(s.id as number),
        })),
        has_prep: preps.length > 0,
        has_sales_sku: skus.length > 0,
        status: preps.length > 0 && skus.length > 0 ? 'ok'
              : preps.length > 0 && skus.length === 0 ? 'no_sales_sku'
              : preps.length === 0 && skus.length > 0 ? 'no_prep'
              : 'orphan',
      };
    });

    // ── Category B: prep_products with no flavour_id (unlinked) ──────────
    const unlinkedPreps = prepProds
      .filter(p => !p.flavour_id)
      .map(p => ({ id: p.id, name: p.name, batch_yield_l: p.batch_yield_l, status: p.status }));

    // ── Category C: sales.skus with flavour_id not in production.flavours ─
    const orphanSalesSkus = salesSkus
      .filter(s => s.flavour_id && !flavourById.has(s.flavour_id as number))
      .map(s => ({
        id: s.id, name: s.sku_code, flavour_id: s.flavour_id,
        pack_format_id: s.pack_format_id,
        in_order_lines: orderLineSkuIds.includes(s.id as number),
      }));

    // ── Category D: order_line sku_ids not in sales.skus at all ──────────
    const unlinkedOrderLineSkus = orderLineSkuIds.filter(id => !salesSkuById.has(id));

    return NextResponse.json({
      flavour_rows: flavourRows,
      unlinked_preps: unlinkedPreps,
      orphan_sales_skus: orphanSalesSkus,
      unlinked_order_line_skus: unlinkedOrderLineSkus,
      pack_formats: packFormats.map(p => ({
        id: p.id, name: p.name, unit_volume_ml: p.unit_volume_ml, units_per_pack: p.units_per_pack,
      })),
      summary: {
        total_flavours: flavours.length,
        ok: flavourRows.filter(r => r.status === 'ok').length,
        no_sales_sku: flavourRows.filter(r => r.status === 'no_sales_sku').length,
        no_prep: flavourRows.filter(r => r.status === 'no_prep').length,
        orphan: flavourRows.filter(r => r.status === 'orphan').length,
        unlinked_preps: unlinkedPreps.length,
        unlinked_order_line_skus: unlinkedOrderLineSkus.length,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json();
    const admin = adminClient();

    if (body.action === 'upsert_flavour') {
      // Create a new entry in production.flavours
      const { data, error } = await admin.schema('production').from('flavours')
        .insert({ name: body.name })
        .select('id, name')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, flavour: data });
    }

    if (body.action === 'link_prep_product') {
      // Set flavour_id on a prep_product
      const { error } = await admin.schema('production').from('prep_products')
        .update({ flavour_id: body.flavour_id })
        .eq('id', body.prep_product_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'create_sales_sku') {
      // Upsert a sales.skus entry
      const { error } = await admin.schema('sales').from('skus').upsert({
        id: body.sku_id,
        sku_code: body.name,
        flavour_id: body.flavour_id,
        pack_format_id: body.pack_format_id,
      }, { onConflict: 'id' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
