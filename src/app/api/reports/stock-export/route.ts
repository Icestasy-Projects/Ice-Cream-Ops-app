import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const [rmRes, prepRes, fgRes, prepProdsRes, catsRes, itemsRes] = await Promise.all([
      admin.schema('production').from('v_rm_stock').select('*').order('ingredient_name'),
      admin.schema('production').from('v_prep_stock').select('*').order('product_name'),
      admin.schema('production').from('v_fg_stock').select('*').order('product_name'),
      admin.schema('production').from('prep_products').select('id, batch_yield_l'),
      admin.schema('production').from('rm_categories').select('id, name'),
      admin.schema('production').from('rm_items').select('id, category_id'),
    ]);

    const catMap = new Map<number, string>(
      (catsRes.data || []).map((c: Record<string, unknown>) => [c.id as number, c.name as string])
    );
    const itemCatMap = new Map<number, string>(
      (itemsRes.data || []).map((i: Record<string, unknown>) => [
        i.id as number,
        catMap.get(i.category_id as number) || 'Other',
      ])
    );
    const yieldMap = new Map<number, number>(
      (prepProdsRes.data || []).map((r: Record<string, unknown>) => [r.id as number, (r.batch_yield_l as number) || 0])
    );

    const now = new Date();
    const dateStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // --- Sheet 1: Raw Materials ---
    const rmRows = (rmRes.data || []).map((r: Record<string, unknown>) => ({
      'Category': itemCatMap.get(r.rm_item_id as number) || 'Other',
      'Ingredient': r.ingredient_name as string,
      'Unit': r.unit as string,
      'Qty On Hand': (r.qty_on_hand as number) || 0,
      'Reorder Point': (r.reorder_point as number) ?? '',
      'Par Qty': (r.par_qty as number) ?? '',
      'Status': r.status as string || 'ok',
    }));

    // --- Sheet 2: Prep / Mix Stock ---
    const BULK_4L = 4;
    const prepRows = (prepRes.data || []).map((r: Record<string, unknown>) => {
      const pid = r.prep_product_id as number;
      const byieldL = yieldMap.get(pid) || 0;
      const qtyFactory = (r.qty_factory as number) || 0;
      const qtyKitchen = (r.qty_kitchen as number) || 0;
      const qtyTotal = (r.qty_total as number) || 0;
      const fBulk = Math.floor((qtyFactory * byieldL) / BULK_4L);
      const kBulk = Math.floor((qtyKitchen * byieldL) / BULK_4L);
      return {
        'Flavour / Mix': r.product_name as string,
        'Unit': r.unit as string,
        'Batch Yield (L)': byieldL || '',
        'Qty (Factory)': qtyFactory,
        'Qty (Kitchen)': qtyKitchen,
        'Total Batches': qtyTotal,
        'Total Litres': parseFloat(((qtyTotal) * byieldL).toFixed(1)),
        '4L Tubs (Factory)': fBulk,
        '4L Tubs (Kitchen)': kBulk,
        '4L Tubs (Total)': fBulk + kBulk,
        'Status': r.status as string || 'ok',
      };
    });

    // --- Sheet 3: Finished Goods ---
    const fgRows = (fgRes.data || []).map((r: Record<string, unknown>) => ({
      'Product Name': r.product_name as string,
      'Pack Format': r.unit as string,
      'Qty On Hand': (r.qty_on_hand as number) || 0,
      'Reorder Point': (r.reorder_point as number) ?? '',
      'Par Qty': (r.par_qty as number) ?? '',
      'Status': r.status as string || 'ok',
    }));

    // Build workbook
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, rows: Record<string, unknown>[]) => {
      if (rows.length === 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[`No data for ${name}`]]), name);
        return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length, 14) }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    // Summary sheet
    const summaryRows = [
      ['Icestasy Ops — Stock Report'],
      [`Generated: ${dateStr}`],
      [],
      ['Sheet', 'Description'],
      ['Raw Materials', 'RM ingredient stock with reorder alerts'],
      ['Prep Mix Stock', 'Kitchen/Factory mix batches + tub yield potential'],
      ['Finished Goods', 'Ready-to-sell SKU stock by pack format'],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    addSheet('Raw Materials', rmRows as Record<string, unknown>[]);
    addSheet('Prep Mix Stock', prepRows as Record<string, unknown>[]);
    addSheet('Finished Goods', fgRows as Record<string, unknown>[]);

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `icestasy-stock-${now.toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
