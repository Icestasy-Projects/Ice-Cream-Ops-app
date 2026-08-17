import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbmdkcGNweGJ1cmt6cXhqcGJmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5ODgyNywiZXhwIjoyMDk3Mzc0ODI3fQ.dZHfewnIMa8GV4aPMYXKdOPGSWz00g33u3_QDCjAC2g';
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://acngdpcpxburkzqxjpbf.supabase.co').trim();

export async function POST() {
  const db = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const s = () => db.schema('production');
  const log: string[] = [];

  // 1. Update Belgian Speculoos → 18.5L
  {
    const { data, error } = await s().from('prep_products')
      .update({ batch_yield_l: 18.5 })
      .ilike('name', '%Belgian Speculoos%')
      .select('name');
    if (error) log.push(`❌ Belgian Speculoos: ${error.message}`);
    else log.push(`✅ Belgian Speculoos → 18.5L (${data?.map((r: {name: string}) => r.name).join(', ')})`);
  }

  // 2. Update Vanilla Vantage (FD) → 40L
  {
    const { data, error } = await s().from('prep_products')
      .update({ batch_yield_l: 40 })
      .ilike('name', '%Vanilla Vantage%')
      .select('name');
    if (error) log.push(`❌ Vanilla Vantage: ${error.message}`);
    else log.push(`✅ Vanilla Vantage (FD) → 40L (${data?.map((r: {name: string}) => r.name).join(', ')})`);
  }

  // 3. Update Kaju Katli → 19L
  {
    const { data, error } = await s().from('prep_products')
      .update({ batch_yield_l: 19 })
      .ilike('name', '%Kaju Katli%')
      .select('name');
    if (error) log.push(`❌ Kaju Katli: ${error.message}`);
    else log.push(`✅ Kaju Katli → 19L (${data?.map((r: {name: string}) => r.name).join(', ')})`);
  }

  // 4. Delete FD Chocolate (set inactive)
  {
    const { data, error } = await s().from('prep_products')
      .update({ status: 'inactive' })
      .ilike('name', '%FD Chocolate%')
      .select('name');
    if (error) log.push(`❌ FD Chocolate delete: ${error.message}`);
    else log.push(`✅ FD Chocolate → inactive (${data?.map((r: {name: string}) => r.name).join(', ')})`);
  }

  // 5. Delete Gud & Sauf (set inactive)
  {
    const { data, error } = await s().from('prep_products')
      .update({ status: 'inactive' })
      .ilike('name', '%Gud%Sauf%')
      .select('name');
    if (error) log.push(`❌ Gud & Sauf delete: ${error.message}`);
    else log.push(`✅ Gud & Sauf → inactive (${data?.map((r: {name: string}) => r.name).join(', ')})`);
  }

  return NextResponse.json({ log });
}
