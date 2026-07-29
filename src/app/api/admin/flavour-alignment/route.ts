/**
 * GET  /api/admin/flavour-alignment
 *   Returns a 2-way comparison:
 *     • production.prep_products  (flavour = prep_product; id is the shared flavour_id)
 *     • sales.skus                (sales.skus.flavour_id → prep_products.id)
 *
 * POST /api/admin/flavour-alignment
 *   Body: { action: 'sync_all' }
 *     → for every sales.skus.flavour_id with no matching prep_product, creates
 *       a placeholder prep_product so the link is valid
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
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY) as any;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = adminClient();

    const [prepProdsRes, salesSkusRes, packFormatsRes, orderLineSkuIdsRes] = await Promise.all([
      admin.schema('production').from('prep_products').select('id, name, batch_yield_l, status'),
      admin.schema('sales').from('skus').select('id, sku_code, flavour_id, pack_format_id'),
      admin.schema('sales').from('pack_formats').select('id, name, unit_volume_ml, units_per_pack'),
      admin.schema('sales').from('order_lines').select('sku_id'),
    ]);

    type R = Record<string, unknown>;
    const prepProds = (prepProdsRes.data || []) as R[];
    const salesSkus = (salesSkusRes.data || []) as R[];
    const packFormats = (packFormatsRes.data || []) as R[];

    const orderLineSkuIds = (Array.from(new Set(
      (orderLineSkuIdsRes.data || []).map((r: R) => r.sku_id as number)
    )) as number[]).sort((a, b) => a - b);

    // prep_product id → prep_product row
    const prepById = new Map<number, R>(prepProds.map(p => [p.id as number, p]));

    // flavour_id → list of sales.skus (flavour_id = prep_product id)
    const salesByFlavourId = new Map<number, R[]>();
    for (const s of salesSkus) {
      const fid = s.flavour_id as number | null;
      if (fid) {
        if (!salesByFlavourId.has(fid)) salesByFlavourId.set(fid, []);
        salesByFlavourId.get(fid)!.push(s);
      }
    }

    const salesSkuById = new Map<number, R>(salesSkus.map(s => [s.id as number, s]));
    const packFormatById = new Map<number, R>(packFormats.map(p => [p.id as number, p]));

    // ── Category A: prep_products rows (each is a flavour) ───────────────
    const flavourRows = prepProds.map(p => {
      const pid = p.id as number;
      const skus = salesByFlavourId.get(pid) || [];
      const status = skus.length > 0 ? 'ok' : 'no_sales_sku';
      return {
        flavour_id: pid,
        flavour_name: p.name as string,
        prep_products: [{ id: pid, name: p.name, batch_yield_l: p.batch_yield_l, status: p.status }],
        sales_skus: skus.map(s => ({
          id: s.id,
          name: s.sku_code,
          pack_format_id: s.pack_format_id,
          pack_format_name: packFormatById.get(s.pack_format_id as number)?.name ?? null,
          in_order_lines: orderLineSkuIds.includes(s.id as number),
        })),
        has_prep: true,
        has_sales_sku: skus.length > 0,
        status,
      };
    });

    // ── Category B: sales.skus with flavour_id that has no prep_product ──
    const orphanSalesSkus = salesSkus
      .filter(s => s.flavour_id && !prepById.has(s.flavour_id as number))
      .map(s => ({
        id: s.id, name: s.sku_code, flavour_id: s.flavour_id,
        pack_format_id: s.pack_format_id,
        in_order_lines: orderLineSkuIds.includes(s.id as number),
      }));

    // ── Category C: order_line sku_ids not in sales.skus ─────────────────
    const unlinkedOrderLineSkus = orderLineSkuIds.filter(id => !salesSkuById.has(id));

    return NextResponse.json({
      flavour_rows: flavourRows,
      unlinked_preps: [],
      orphan_sales_skus: orphanSalesSkus,
      unlinked_order_line_skus: unlinkedOrderLineSkus,
      pack_formats: packFormats.map(p => ({
        id: p.id, name: p.name, unit_volume_ml: p.unit_volume_ml, units_per_pack: p.units_per_pack,
      })),
      summary: {
        total_flavours: prepProds.length,
        ok: flavourRows.filter(r => r.status === 'ok').length,
        no_sales_sku: flavourRows.filter(r => r.status === 'no_sales_sku').length,
        no_prep: 0,
        orphan: 0,
        unlinked_preps: 0,
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

    if (body.action === 'create_sales_sku') {
      const { error } = await admin.schema('sales').from('skus').upsert({
        id: body.sku_id,
        sku_code: body.name,
        flavour_id: body.flavour_id,
        pack_format_id: body.pack_format_id,
      }, { onConflict: 'id' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // sync_all: create placeholder prep_products for any orphan flavour_ids in sales.skus
    if (body.action === 'sync_all') {
      const [prepProdsRes2, salesSkusRes2] = await Promise.all([
        admin.schema('production').from('prep_products').select('id, name'),
        admin.schema('sales').from('skus').select('id, flavour_id'),
      ]);

      const existingPrepIds = new Set<number>((prepProdsRes2.data || []).map((r: any) => r.id as number));

      // Collect all flavour_ids in sales.skus with no matching prep_product
      const missingIds = Array.from(
        new Set<number>((salesSkusRes2.data || [])
          .filter((s: any) => s.flavour_id && !existingPrepIds.has(s.flavour_id as number))
          .map((s: any) => s.flavour_id as number))
      );

      if (missingIds.length === 0) {
        return NextResponse.json({ ok: true, inserted: 0 });
      }

      // Insert placeholder prep_products with matching IDs
      const toInsert = missingIds.map(id => ({
        id,
        name: `Flavour #${id}`,
        status: 'active',
        batch_yield_l: null,
      }));

      const { error: insertErr } = await admin.schema('production').from('prep_products').insert(toInsert);
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      return NextResponse.json({ ok: true, inserted: toInsert.length, flavours: toInsert });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
