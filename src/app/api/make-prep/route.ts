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

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { prep_product_id, qty_produced, note } = await req.json() as {
      prep_product_id: number; qty_produced: number; note?: string | null;
    };

    if (!prep_product_id || !qty_produced || qty_produced <= 0) {
      return NextResponse.json({ error: 'prep_product_id and qty_produced are required' }, { status: 400 });
    }

    const admin = adminClient();

    // Pre-check: fetch recipe for this prep_product and verify RM stock is sufficient
    const [recipeRes, stockRes] = await Promise.all([
      admin.schema('production').from('prep_recipes')
        .select('rm_item_id, qty_per_batch, rm_items(name, unit)')
        .eq('prep_product_id', prep_product_id),
      admin.schema('production').from('v_rm_stock')
        .select('rm_item_id, qty_on_hand'),
    ]);

    const recipe = (recipeRes.data || []) as Array<{
      rm_item_id: number; qty_per_batch: number;
      rm_items: { name: string; unit: string } | null;
    }>;
    const stockMap = new Map<number, number>(
      ((stockRes.data || []) as Array<{ rm_item_id: number; qty_on_hand: number }>)
        .map(s => [s.rm_item_id, s.qty_on_hand])
    );

    // Calculate how many batches we can make
    const batchesNeeded = qty_produced; // qty_produced is already total litres, not batches
    // Actually qty_produced = batches × batch_yield — check each RM
    const shortfalls: string[] = [];
    for (const line of recipe) {
      const needed = line.qty_per_batch * (qty_produced / (qty_produced)); // per-recipe line × batches
      // qty_produced is total yield; batch_yield_l comes from prep_products
      // We need to derive batches: get batch_yield_l
      break; // will re-derive below after fetching batch_yield_l
    }

    // Fetch batch_yield_l to convert qty_produced → batch count
    const { data: ppData } = await admin.schema('production').from('prep_products')
      .select('batch_yield_l').eq('id', prep_product_id).single();
    const batchYield = (ppData?.batch_yield_l as number) || 1;
    const numBatches = qty_produced / batchYield;

    for (const line of recipe) {
      const needed = line.qty_per_batch * numBatches;
      const have = stockMap.get(line.rm_item_id) ?? 0;
      if (have < needed) {
        const name = line.rm_items?.name ?? `RM #${line.rm_item_id}`;
        const unit = line.rm_items?.unit ?? '';
        shortfalls.push(
          `${name}: need ${needed.toFixed(2)} ${unit}, have ${have.toFixed(2)} ${unit} (short by ${(needed - have).toFixed(2)} ${unit})`
        );
      }
    }

    if (shortfalls.length > 0) {
      return NextResponse.json({
        error: `Not enough raw materials for this batch:\n• ${shortfalls.join('\n• ')}`,
        shortfalls,
      }, { status: 422 });
    }

    const { error } = await admin.schema('production').from('prep_units').insert({
      prep_product_id,
      qty_produced,
      produced_by: user.id,
      status: 'posted',
      note: note || null,
    });

    if (error) {
      // If DB still rejects (race condition or trigger), try to humanise the rm_item_id
      const idMatch = error.message.match(/rm_item_id\s+(\d+)/i);
      if (idMatch) {
        const rmId = parseInt(idMatch[1]);
        const { data: rmRow } = await admin.schema('production').from('rm_items').select('name, unit').eq('id', rmId).single();
        if (rmRow) {
          const shortMatch = error.message.match(/would go to\s+([-\d.]+)/i);
          const deficit = shortMatch ? Math.abs(parseFloat(shortMatch[1])).toFixed(2) : '?';
          return NextResponse.json({
            error: `Not enough ${rmRow.name} — short by ${deficit} ${rmRow.unit}. Receive more stock first.`,
          }, { status: 422 });
        }
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
