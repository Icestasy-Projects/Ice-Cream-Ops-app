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

    const [prepProdsRes, salesSkusRes, packFormatsRes, orderLineSkuIdsRes, fgStockRes] = await Promise.all([
      admin.schema('production').from('prep_products').select('id, name, batch_yield_l, status'),
      admin.schema('sales').from('skus').select('id, sku_code, flavour_id, pack_format_id'),
      admin.schema('sales').from('pack_formats').select('id, name, unit_volume_ml, units_per_pack'),
      admin.schema('sales').from('order_lines').select('sku_id'),
      admin.schema('production').from('fg_skus').select('fg_sku_id, product_name, unit'),
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

    // Find fg_sku_ids already used in sales.skus so we can mark them as taken
    const usedSkuIds = new Set(salesSkus.map((s: R) => s.id as number));
    const fgStock = ((fgStockRes.data || []) as R[])
      .filter(s => !usedSkuIds.has(s.fg_sku_id as number))
      .map(s => ({ fg_sku_id: s.fg_sku_id, product_name: s.product_name, unit: s.unit }));

    return NextResponse.json({
      flavour_rows: flavourRows,
      unlinked_preps: [],
      orphan_sales_skus: orphanSalesSkus,
      unlinked_order_line_skus: unlinkedOrderLineSkus,
      fg_stock: fgStock,
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

    // create_missing_skus: all fg_skus already exist in sales.skus (same id), but those
    // rows have NULL flavour_id. Strategy: for each unlinked flavour, find the fg_sku
    // whose name matches, then UPDATE sales.skus SET flavour_id = flavour.id WHERE id = fg_sku_id.
    if (body.action === 'create_missing_skus') {
      const [prepProdsRes3, salesSkusRes3, fgSkusRes3] = await Promise.all([
        admin.schema('production').from('prep_products').select('id, name'),
        admin.schema('sales').from('skus').select('id, flavour_id, sku_code'),
        admin.schema('production').from('fg_skus').select('fg_sku_id, product_name, unit'),
      ]);

      type R2 = Record<string, unknown>;
      const prepProds3 = (prepProdsRes3.data || []) as R2[];
      const salesSkus3 = (salesSkusRes3.data || []) as R2[];
      const fgSkus3 = (fgSkusRes3.data || []) as R2[];

      // Flavours already linked
      const linkedFlavourIds = new Set<number>(
        salesSkus3.filter((s: R2) => s.flavour_id).map((s: R2) => s.flavour_id as number)
      );
      const unlinkedFlavours = prepProds3.filter(p => !linkedFlavourIds.has(p.id as number));

      if (unlinkedFlavours.length === 0) {
        return NextResponse.json({ ok: true, updated: 0, message: 'All flavours already have sales SKUs.' });
      }

      // sales.skus with no flavour_id — keyed by id
      const unlinkedSalesSkus = salesSkus3.filter((s: R2) => !s.flavour_id);
      const salesSkuById = new Map<number, R2>(salesSkus3.map((s: R2) => [s.id as number, s]));

      // fg_skus keyed by fg_sku_id (same as sales.skus.id)
      const fgSkuById = new Map<number, R2>(fgSkus3.map((f: R2) => [f.fg_sku_id as number, f]));

      // Normalise name: lowercase, strip category words + non-alphanumeric
      const norm = (s: string) => s.toLowerCase()
        .replace(/\b(mix|ice\s*cream|gelato|sorbet|kulfi|frozen|dessert)\b/g, '')
        .replace(/[^a-z0-9]/g, '');

      // Strip volume/format suffix from fg_sku product_name to get the flavour core
      const fgFlavourCore = (productName: string): string => {
        const stripped = productName
          .replace(/\s+\d+\s*(ml|l|litre|liter|kg|g)\b.*/i, '')
          .replace(/\s+(cup|tub|stick|bar|cone|scoop|pack|bucket|jar|box|pouch|sachet|bottle|can)\b.*/i, '')
          .trim();
        return norm(stripped);
      };

      // Build map: fg core → list of sales.skus (via fg_sku name lookup) that have no flavour_id
      const unlinkedByCore = new Map<string, R2[]>();
      for (const ss of unlinkedSalesSkus) {
        const fg = fgSkuById.get(ss.id as number);
        const core = fg ? fgFlavourCore(fg.product_name as string) : norm(ss.sku_code as string || '');
        if (!unlinkedByCore.has(core)) unlinkedByCore.set(core, []);
        unlinkedByCore.get(core)!.push(ss);
      }

      // Track which sales.sku ids we've already claimed this run
      const claimedSalesSkuIds = new Set<number>();
      const toUpdate: { id: number; flavour_id: number }[] = [];
      const skipped: R2[] = [];
      const matched: { flavour: string; sku_ids: number[] }[] = [];

      for (const flavour of unlinkedFlavours) {
        const flavourCore = norm(flavour.name as string);

        // 1. Exact core match
        let ssMatches: R2[] = (unlinkedByCore.get(flavourCore) || []).filter(s => !claimedSalesSkuIds.has(s.id as number));

        // 2. Partial / trigram match
        if (ssMatches.length === 0) {
          let bestScore = 0;
          let bestCore = '';
          for (const [core] of Array.from(unlinkedByCore)) {
            let score = 0;
            if (core === flavourCore) score = 1000;
            else if (core.includes(flavourCore) || flavourCore.includes(core)) {
              score = 100 + Math.min(core.length, flavourCore.length);
            } else {
              const tgm = (s: string) => { const t = new Set<string>(); for (let i = 0; i <= s.length - 3; i++) t.add(s.slice(i, i + 3)); return t; };
              const ft = tgm(flavourCore), gt = tgm(core);
              let shared = 0; ft.forEach(t => { if (gt.has(t)) shared++; });
              score = ft.size >= 2 ? shared / ft.size : 0;
            }
            if (score > bestScore && score >= 0.5) { bestScore = score; bestCore = core; }
          }
          if (bestCore) ssMatches = (unlinkedByCore.get(bestCore) || []).filter(s => !claimedSalesSkuIds.has(s.id as number));
        }

        if (ssMatches.length === 0) {
          skipped.push({ flavour_id: flavour.id, flavour_name: flavour.name, reason: 'No matching unlinked sales.sku found' });
          continue;
        }

        const ids: number[] = [];
        for (const ss of ssMatches) {
          if (claimedSalesSkuIds.has(ss.id as number)) continue;
          toUpdate.push({ id: ss.id as number, flavour_id: flavour.id as number });
          claimedSalesSkuIds.add(ss.id as number);
          ids.push(ss.id as number);
        }
        if (ids.length > 0) matched.push({ flavour: flavour.name as string, sku_ids: ids });
      }

      if (toUpdate.length === 0) {
        // Return debug info so we can diagnose
        const debugInfo = {
          unlinked_flavours: unlinkedFlavours.map(f => ({ id: f.id, name: f.name, core: norm(f.name as string) })),
          unlinked_sales_skus: unlinkedSalesSkus.slice(0, 30).map(ss => {
            const fg = fgSkuById.get(ss.id as number);
            return { id: ss.id, sku_code: ss.sku_code, fg_name: fg?.product_name ?? null, core: fg ? fgFlavourCore(fg.product_name as string) : null };
          }),
          unlinked_sales_count: unlinkedSalesSkus.length,
        };
        return NextResponse.json({ ok: true, updated: 0, skipped, message: 'No SKUs could be linked.', debug: debugInfo });
      }

      // Update each sales.sku row with its matched flavour_id
      const errors: string[] = [];
      for (const u of toUpdate) {
        const { error: ue } = await admin.schema('sales').from('skus').update({ flavour_id: u.flavour_id }).eq('id', u.id);
        if (ue) errors.push(`sku ${u.id}: ${ue.message}`);
      }
      if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 500 });

      return NextResponse.json({ ok: true, updated: toUpdate.length, skipped, matched });
    }

    // debug_data: returns raw prep_products and fg_skus names for inspection
    if (body.action === 'debug_data') {
      const [pp, fg] = await Promise.all([
        admin.schema('production').from('prep_products').select('id, name').order('name'),
        admin.schema('production').from('fg_skus').select('fg_sku_id, product_name, unit').order('product_name'),
      ]);
      return NextResponse.json({ prep_products: pp.data, fg_skus: fg.data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
