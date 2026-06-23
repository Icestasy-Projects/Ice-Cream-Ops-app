'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import FuelGauge from '@/components/FuelGauge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw } from 'lucide-react';

interface FgStock {
  fg_product_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number | null;
  weekly_usage: number | null;
  qty_to_make: number | null;
  status: string | null;
}

export default function FinishedGoodsDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<FgStock[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .schema('production')
      .from('v_production_planning_dashboard')
      .select('*')
      .order('status', { ascending: false });
    setData(rows || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase.channel('fg-stock').on('postgres_changes', {
      event: '*', schema: 'production', table: 'fg_batches',
    }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const critical = data.filter(d => d.status === 'critical');
  const low = data.filter(d => d.status === 'low');
  const ok = data.filter(d => !d.status || d.status === 'ok');

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="🍦"
        title="Finished Goods Stock"
        description="How many tubs of each flavour are ready to sell. Red means make more urgently. Amber means plan to fill more soon."
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-sm">
          {critical.length > 0 && <span className="badge-critical">{critical.length} Critical</span>}
          {low.length > 0 && <span className="badge-low">{low.length} Low</span>}
          {ok.length > 0 && <span className="badge-ok">{ok.length} OK</span>}
        </div>
        <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm touch-manipulation hover:text-brand-600">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? <LoadingSpinner text="Loading finished goods..." /> : (
        <div className="space-y-3">
          {data.map(item => (
            <FuelGauge
              key={item.fg_product_id}
              label={item.product_name}
              current={item.qty_on_hand}
              reorderPoint={item.reorder_point || 0}
              weeklyUsage={item.weekly_usage}
              unit={item.unit}
              qtyToAct={item.qty_to_make}
              actionLabel="Make"
            />
          ))}
          {data.length === 0 && <p className="text-center text-gray-400 py-8">No finished goods data yet.</p>}
        </div>
      )}
    </div>
  );
}
