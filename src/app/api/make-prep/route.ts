import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminClient(): any {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json() as {
      prep_product_id: number;
      batch_yield_l?: number;
      num_batches?: number;
      qty_produced?: number;
      note?: string | null;
    };

    const { prep_product_id, note } = body;

    if (!prep_product_id) {
      return NextResponse.json({ error: 'prep_product_id is required' }, { status: 400 });
    }

    const admin = adminClient();

    // Accept either new format (num_batches + batch_yield_l) or old format (qty_produced)
    let numBatches: number;
    let qty_produced: number;

    if (body.num_batches && body.batch_yield_l) {
      numBatches = body.num_batches;
      qty_produced = body.num_batches * body.batch_yield_l;
    } else if (body.qty_produced) {
      // Legacy: re-fetch batch_yield_l to derive numBatches
      const { data: ppData } = await admin.schema('production').from('prep_products')
        .select('batch_yield_l').eq('id', prep_product_id).single();
      const batchYieldL = (ppData?.batch_yield_l as number) || 1;
      qty_produced = body.qty_produced;
      numBatches = qty_produced / batchYieldL;
    } else {
      return NextResponse.json({ error: 'Provide num_batches + batch_yield_l or qty_produced' }, { status: 400 });
    }

    if (numBatches <= 0) {
      return NextResponse.json({ error: 'num_batches must be greater than 0' }, { status: 400 });
    }

    // Fetch this product's recipe lines (column is qty_per_unit = qty per batch)
    const { data: recipeData } = await admin.schema('production').from('prep_recipes')
      .select('rm_item_id, qty_per_unit, rm_items(name, unit)')
      .eq('prep_product_id', prep_product_id);

    const recipe = (recipeData || []) as Array<{
      rm_item_id: number;
      qty_per_unit: number;
      rm_items: { name: string; unit: string } | null;
    }>;

    // Fetch current stock for only the RM items in this recipe
    const recipeRmIds = recipe.map(l => l.rm_item_id);
    const shortfalls: string[] = [];

    if (recipeRmIds.length > 0) {
      const { data: stockData } = await admin.schema('production').from('v_rm_stock')
        .select('rm_item_id, qty_on_hand')
        .in('rm_item_id', recipeRmIds);

      const stockMap = new Map<number, number>(
        ((stockData || []) as Array<{ rm_item_id: number; qty_on_hand: number }>)
          .map(s => [s.rm_item_id, s.qty_on_hand])
      );

      for (const line of recipe) {
        const needed = line.qty_per_unit * numBatches;
        const have = stockMap.get(line.rm_item_id) ?? 0;
        if (have < needed) {
          const name = line.rm_items?.name ?? `RM #${line.rm_item_id}`;
          const unit = line.rm_items?.unit ?? '';
          shortfalls.push(
            `${name}: need ${needed.toFixed(2)} ${unit}, have ${have.toFixed(2)} ${unit} (short by ${(needed - have).toFixed(2)} ${unit})`
          );
        }
      }
    }

    if (shortfalls.length > 0) {
      return NextResponse.json({
        error: `Not enough raw materials for this batch.`,
        shortfalls,
      }, { status: 422 });
    }

    // All stock checks passed — insert the batch
    const { error } = await admin.schema('production').from('prep_units').insert({
      prep_product_id,
      qty_produced,
      produced_by: user.id,
      status: 'posted',
      note: note || null,
    });

    if (error) {
      // If DB trigger still rejects (race condition), humanise the rm_item_id
      const idMatch = error.message.match(/rm_item_id\s+(\d+)/i);
      if (idMatch) {
        const rmId = parseInt(idMatch[1]);
        const { data: rmRow } = await admin.schema('production').from('rm_items')
          .select('name, unit').eq('id', rmId).single();
        if (rmRow) {
          const shortMatch = error.message.match(/would go to\s+([-\d.]+)/i);
          const deficit = shortMatch ? Math.abs(parseFloat(shortMatch[1])).toFixed(2) : '?';
          return NextResponse.json({
            error: `Not enough ${rmRow.name} — short by ${deficit} ${rmRow.unit}. Receive more stock first.`,
            shortfalls: [`${rmRow.name}: short by ${deficit} ${rmRow.unit}`],
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
