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

    // Union all known SKU IDs: from order lines, sales.skus, and v_fg_stock
    const allSkuIds = (Array.from(new Set([
      ...(orderLinesRes.data || []).map((r: any) => r.sku_id as number),
      ...(salesSkusRes.data || []).map((r: any) => r.id as number),
      ...(fgStockRes.data || []).map((r: any) => r.fg_sku_id as number),
    ])) as number[]).sort((a, b) => a - b);

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

      let salesSkus = (salesSkusRes.data || []) as Array<{ id: number; sku_code: string | null; pack_format_id: number | null }>;
      // If caller specified a subset of sku_ids, restrict to those
      if (Array.isArray(body.sku_ids) && body.sku_ids.length > 0) {
        const idSet = new Set(body.sku_ids as number[]);
        salesSkus = salesSkus.filter(s => idSet.has(s.id));
      }
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

      // Multi-pass apply: handles chain dependencies (A→B→C where each needs the next's slot)
      // Build an in-memory map of current flavour assignments so we don't need extra DB queries.
      // After each successful update, update the in-memory map so subsequent checks are accurate.
      const { data: currentSkus } = await admin.schema('sales').from('skus')
        .select('id, flavour_id, pack_format_id');

      // Map: (flavour_id, pack_format_id) → sku_id (who currently holds this slot)
      const slotHolder = new Map<string, number>();
      for (const s of currentSkus || []) {
        if (s.flavour_id && s.pack_format_id) {
          slotHolder.set(`${s.flavour_id}:${s.pack_format_id}`, s.id);
        }
      }
      // Map: sku_id → current pack_format_id and old flavour_id
      const skuPackFormat = new Map<number, number>(
        (currentSkus || []).map((s: any) => [s.id as number, s.pack_format_id as number])
      );
      const skuCurrentFlavour = new Map<number, number>(
        (currentSkus || []).map((s: any) => [s.id as number, s.flavour_id as number])
      );

      let applied = 0;
      let remaining = [...updates];

      for (let pass = 0; pass < updates.length + 1 && remaining.length > 0; pass++) {
        const stillBlocked: typeof updates = [];
        const pendingIds = new Set(remaining.map(u => u.id));

        for (const u of remaining) {
          const packFmt = skuPackFormat.get(u.id);
          const slotKey = `${u.flavour_id}:${packFmt}`;
          const holder = slotHolder.get(slotKey);

          // If the target slot is held by another SKU that is ALSO pending, wait
          if (holder && holder !== u.id && pendingIds.has(holder)) {
            stillBlocked.push(u);
            continue;
          }

          const { error } = await admin.schema('sales').from('skus')
            .update({ flavour_id: u.flavour_id })
            .eq('id', u.id);

          if (!error) {
            applied++;
            pendingIds.delete(u.id);
            // Update in-memory map: free the old slot, occupy the new one
            const oldFlavour = skuCurrentFlavour.get(u.id);
            const oldPackFmt = skuPackFormat.get(u.id);
            if (oldFlavour && oldPackFmt) slotHolder.delete(`${oldFlavour}:${oldPackFmt}`);
            skuCurrentFlavour.set(u.id, u.flavour_id);
            slotHolder.set(slotKey, u.id);
          } else {
            stillBlocked.push(u);
          }
        }

        if (stillBlocked.length === remaining.length) break;
        remaining = stillBlocked;
      }

      return NextResponse.json({ ok: true, applied, unmatched_count: unmatched.length, unmatched });
    }

    // ── delete_pack_format ───────────────────────────────────────────────────
    if (body.action === 'delete_pack_format') {
      const { pack_format_id } = body as { pack_format_id: number };
      if (!pack_format_id) return NextResponse.json({ error: 'pack_format_id required' }, { status: 400 });
      // Check if any SKUs reference this format
      const { data: refs } = await admin.schema('sales').from('skus')
        .select('id').eq('pack_format_id', pack_format_id).limit(1);
      if (refs && refs.length > 0) {
        return NextResponse.json({ error: 'Cannot delete — SKUs are still using this pack format.' }, { status: 409 });
      }
      const { error } = await admin.schema('sales').from('pack_formats').delete().eq('id', pack_format_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // ── single upsert ────────────────────────────────────────────────────────
    const { sku_id, flavour_id, pack_format_id, name } = body as {
      sku_id: number; flavour_id: number; pack_format_id: number; name: string;
    };

    if (!sku_id || !flavour_id || !pack_format_id) {
      return NextResponse.json({ error: 'sku_id, flavour_id, pack_format_id are required' }, { status: 400 });
    }

    // Check if this (flavour_id, pack_format_id) pair is already used by a DIFFERENT SKU
    const { data: conflictRow } = await admin.schema('sales').from('skus')
      .select('id')
      .eq('flavour_id', flavour_id)
      .eq('pack_format_id', pack_format_id)
      .neq('id', sku_id)
      .maybeSingle();

    if (conflictRow) {
      return NextResponse.json({
        error: `This flavour + pack format combination is already used by SKU #${conflictRow.id}. Each flavour/format pair must be unique.`,
      }, { status: 409 });
    }

    // Check if SKU exists to decide update vs insert
    const { data: existing } = await admin.schema('sales').from('skus')
      .select('id').eq('id', sku_id).maybeSingle();

    let error: { message: string } | null;
    if (existing) {
      ({ error } = await admin.schema('sales').from('skus')
        .update({ sku_code: name || `SKU-${sku_id}`, flavour_id, pack_format_id })
        .eq('id', sku_id));
    } else {
      ({ error } = await admin.schema('sales').from('skus')
        .insert({ id: sku_id, sku_code: name || `SKU-${sku_id}`, flavour_id, pack_format_id }));
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// DELETE — remove one or many sales.skus entries (unlink)
// Single: ?sku_id=26
// Bulk:   ?sku_ids=25,26,27  or body { sku_ids: [25,26,27] }
export async function DELETE(req: NextRequest) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = adminClient();
    const { searchParams } = new URL(req.url);

    // skus.flavour_id is NOT NULL and order_lines references skus.id,
    // so neither nulling fields nor deleting rows is possible.
    return NextResponse.json({
      error: 'Unlink is not supported: the database requires flavour_id to be set (NOT NULL) and order history references this SKU. Use Auto-Align to correct wrong mappings instead.',
    }, { status: 422 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// PATCH — rename a prep_product (flavour) name
export async function PATCH(req: NextRequest) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json();
    const { prep_product_id, name } = body as { prep_product_id: number; name: string };
    if (!prep_product_id || !name?.trim()) {
      return NextResponse.json({ error: 'prep_product_id and name required' }, { status: 400 });
    }

    const admin = adminClient();
    const { error } = await admin.schema('production').from('prep_products')
      .update({ name: name.trim() })
      .eq('id', prep_product_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
