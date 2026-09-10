'use client';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface Variance {
  id: number;
  entry_date: string;
  rm_item_id: number;
  expected_qty: number;
  actual_qty: number;
  variance: number;
  variance_type: 'overuse' | 'underuse' | 'unaccounted_prep';
  status: 'open' | 'resolved';
  rm_items: { name: string; unit: string };
}

interface Entry {
  id: number;
  entry_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  daily_rm_variances: { id: number; status: string }[];
}

const TYPE_CONFIG = {
  overuse:          { label: 'Overuse',          icon: TrendingUp,   bg: 'bg-red-50',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700' },
  underuse:         { label: 'Underuse',         icon: TrendingDown, bg: 'bg-amber-50',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700' },
  unaccounted_prep: { label: 'Unaccounted Prep', icon: HelpCircle,   bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
};

export default function RmVariancesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [variances, setVariances] = useState<Variance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'open' | 'resolved' | 'all'>('open');
  const [resolving, setResolving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/daily-rm-usage');
    if (!res.ok) { setLoading(false); return; }
    const json = await res.json();
    setEntries(json.entries || []);

    // Fetch detailed variances
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    const { data } = await supabase.schema('production').from('daily_rm_variances')
      .select('id, entry_date, rm_item_id, expected_qty, actual_qty, variance, variance_type, status, rm_items(name, unit)')
      .order('entry_date', { ascending: false })
      .order('variance_type')
      .limit(200);
    setVariances((data || []) as unknown as Variance[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resolveVariance(id: number) {
    setResolving(id);
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();
    const { error } = await supabase.schema('production').from('daily_rm_variances')
      .update({ status: 'resolved' }).eq('id', id);
    if (error) { toast.error(error.message); }
    else { toast.success('Marked resolved'); setVariances(v => v.map(x => x.id === id ? { ...x, status: 'resolved' } : x)); }
    setResolving(null);
  }

  if (loading) return <LoadingSpinner text="Loading variances..." />;

  const filtered = variances.filter(v => filterStatus === 'all' || v.status === filterStatus);
  const openCount = variances.filter(v => v.status === 'open').length;

  // Group by date
  const byDate = filtered.reduce<Record<string, Variance[]>>((acc, v) => {
    if (!acc[v.entry_date]) acc[v.entry_date] = [];
    acc[v.entry_date].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={AlertTriangle} iconColor="text-red-500"
        title="RM Usage Variances"
        description="Daily mismatches between actual RM used and recipe-expected quantities."
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-red-600">{openCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Open alerts</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-gray-800">{entries.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Submissions</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-green-600">{variances.filter(v => v.status === 'resolved').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Resolved</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['open', 'resolved', 'all'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'open' ? `Open (${openCount})` : s === 'resolved' ? 'Resolved' : 'All'}
          </button>
        ))}
      </div>

      {Object.keys(byDate).length === 0 && (
        <div className="card text-center py-10 text-gray-400">
          {filterStatus === 'open' ? '🎉 No open variances' : 'No variances found'}
        </div>
      )}

      {Object.entries(byDate).map(([date, rows]) => (
        <div key={date} className="card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">
              {new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rows.some(r => r.status === 'open') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {rows.filter(r => r.status === 'open').length} open
            </span>
          </div>

          <div className="space-y-2">
            {rows.map(v => {
              const cfg = TYPE_CONFIG[v.variance_type];
              const Icon = cfg.icon;
              return (
                <div key={v.id} className={`rounded-xl p-3 flex items-center gap-3 ${v.status === 'resolved' ? 'opacity-50' : cfg.bg}`}>
                  <Icon size={16} className={cfg.text} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{v.rm_items?.name}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Expected <strong>{formatNumber(v.expected_qty, 3)}</strong> {v.rm_items?.unit}
                      {' · '}Actual <strong>{formatNumber(v.actual_qty, 3)}</strong> {v.rm_items?.unit}
                      {' · '}Variance <strong className={v.variance > 0 ? 'text-red-600' : 'text-amber-600'}>
                        {v.variance > 0 ? '+' : ''}{formatNumber(v.variance, 3)}
                      </strong>
                    </p>
                  </div>
                  {v.status === 'open' ? (
                    <button
                      onClick={() => resolveVariance(v.id)}
                      disabled={resolving === v.id}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                    >
                      {resolving === v.id ? '…' : 'Resolve'}
                    </button>
                  ) : (
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
