'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import FuelGauge from '@/components/FuelGauge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw } from 'lucide-react';

interface PrepStock {
  prep_product_id: number;
  product_name: string;
  unit: string;
  qty_kitchen: number;
  qty_factory: number;
  qty_total: number;
  reorder_point: number | null;
  weekly_usage: number | null;
  qty_to_make: number | null;
  status: string | null;
}

export default function PrepDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<PrepStock[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .schema('production')
      .from('v_prep_planning_dashboard')
      .select('*')
      .order('status', { ascending: false });
    setData(rows || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase.channel('prep-stock').on('postgres_changes', {
      event: '*', schema: 'production', table: 'prep_batches',
    }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const critical = data.filter(d => d.status === 'critical');
  const low = data.filter(d => d.status === 'low');
  const ok = data.filter(d => !d.status || d.status === 'ok');

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="🧪"
        title="Prep / Mix Stock"
        description="How much flavour mix you have across the kitchen and factory combined. Shows when you need to make more batches."
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

      {loading ? <LoadingSpinner text="Loading mix levels..." /> : (
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.prep_product_id} className="space-y-1">
              <FuelGauge
                label={item.product_name}
                current={item.qty_total}
                reorderPoint={item.reorder_point || 0}
                weeklyUsage={item.weekly_usage}
                unit={item.unit}
                qtyToAct={item.qty_to_make}
                actionLabel="Make"
              />
              <div className="flex gap-4 px-2 text-xs text-gray-400">
                <span>🧪 Kitchen: {item.qty_kitchen % 1 === 0 ? item.qty_kitchen : item.qty_kitchen.toFixed(1)} {item.unit}</span>
                <span>🏭 Factory: {item.qty_factory % 1 === 0 ? item.qty_factory : item.qty_factory.toFixed(1)} {item.unit}</span>
              </div>
            </div>
          ))}
          {data.length === 0 && <p className="text-center text-gray-400 py-8">No prep data yet.</p>}
        </div>
      )}
    </div>
  );
}
