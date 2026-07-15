'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Search, Download } from 'lucide-react';

interface PrepItem {
  prep_product_id: number;
  product_name: string;
  unit: string;
  qty_kitchen: number;
  qty_factory: number;
  qty_total: number;
  batch_yield_l: number;
}

type StatusType = 'critical' | 'low' | 'ok' | 'unknown';

function computeStatus(onHand: number, weekly: number | undefined): StatusType {
  if (!weekly || weekly <= 0) return 'unknown';
  const threshold = Math.ceil(weekly * 2.5);
  if (onHand < weekly) return 'critical';
  if (onHand < threshold) return 'low';
  return 'ok';
}

function StatusBadge({ status }: { status: StatusType }) {
  const map: Record<StatusType, string> = {
    critical: 'bg-red-100 text-red-700',
    low: 'bg-amber-100 text-amber-700',
    ok: 'bg-green-100 text-green-700',
    unknown: 'bg-gray-100 text-gray-400',
  };
  const label: Record<StatusType, string> = {
    critical: 'Critical', low: 'Low', ok: 'OK', unknown: '—',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function PrepDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<PrepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyReq, setWeeklyReq] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | StatusType>('all');

  useEffect(() => {
    fetch('/api/weekly-req')
      .then(r => r.json())
      .then(d => { if (d.prep) setWeeklyReq(d.prep); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [stockRes, prodRes] = await Promise.all([
      supabase.schema('production').from('v_prep_stock').select('*').order('product_name'),
      supabase.schema('production').from('prep_products').select('id, batch_yield_l'),
    ]);
    const yieldMap = new Map<number, number>(
      (prodRes.data || []).map((r: Record<string, unknown>) => [r.id as number, (r.batch_yield_l as number) || 0])
    );
    setData(
      (stockRes.data || []).map((r: Record<string, unknown>) => ({
        prep_product_id: r.prep_product_id as number,
        product_name: r.product_name as string,
        unit: r.unit as string,
        qty_kitchen: (r.qty_kitchen as number) || 0,
        qty_factory: (r.qty_factory as number) || 0,
        qty_total: (r.qty_total as number) || 0,
        batch_yield_l: yieldMap.get(r.prep_product_id as number) || 0,
      }))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase.channel('prep-dash').on('postgres_changes', {
      event: '*', schema: 'production', table: 'prep_ledger',
    }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const enriched = useMemo(() => data.map(item => {
    const weekly = weeklyReq[item.prep_product_id];
    const threshold = weekly ? Math.ceil(weekly * 2.5) : undefined;
    const status = computeStatus(item.qty_total, weekly);
    return { ...item, weekly, threshold, status };
  }), [data, weeklyReq]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(item => {
      if (q && !item.product_name.toLowerCase().includes(q)) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => {
      const ord: Record<StatusType, number> = { critical: 0, low: 1, ok: 2, unknown: 3 };
      return ord[a.status] !== ord[b.status]
        ? ord[a.status] - ord[b.status]
        : a.product_name.localeCompare(b.product_name);
    });
  }, [enriched, search, filterStatus]);

  const critCount = enriched.filter(i => i.status === 'critical').length;
  const lowCount = enriched.filter(i => i.status === 'low').length;

  const filterBtns: { key: 'all' | StatusType; label: string; cls: string }[] = [
    { key: 'all', label: `All (${data.length})`, cls: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { key: 'critical', label: `Critical (${critCount})`, cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { key: 'low', label: `Low (${lowCount})`, cls: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { key: 'ok', label: 'OK', cls: 'bg-green-100 text-green-700 hover:bg-green-200' },
  ];

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="🧪"
        title="Prep / Mix Stock"
        description="Weekly batch requirements from 42-day order history. Threshold = 2.5× weekly req."
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {filterBtns.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilterStatus(btn.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors touch-manipulation ${btn.cls} ${filterStatus === btn.key ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/reports/stock-export"
            download
            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 touch-manipulation"
          >
            <Download size={13} />
            Export
          </a>
          <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search flavour..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading mix levels..." />
      ) : (
        <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 min-w-[160px]">Flavour</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Yield / Batch</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Factory</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kitchen</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Total (batches)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Wkly Req</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Threshold</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-10 text-sm">No results found.</td>
                  </tr>
                ) : filtered.map(item => (
                  <tr key={item.prep_product_id} className={`hover:bg-orange-50 transition-colors ${
                    item.status === 'critical' ? 'bg-red-50/40' :
                    item.status === 'low' ? 'bg-amber-50/40' : ''
                  }`}>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900 text-xs">{item.product_name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span className="text-gray-500 text-xs">{item.batch_yield_l}L</span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span className="font-semibold text-green-700 text-xs">{item.qty_factory}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span className="font-semibold text-blue-600 text-xs">{item.qty_kitchen}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span className="font-bold text-gray-900 text-xs">{item.qty_total}</span>
                      <span className="text-gray-400 text-xs ml-1">batches</span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {item.weekly ? (
                        <span className="text-indigo-600 font-semibold text-xs">{item.weekly}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {item.threshold ? (
                        <span className="text-orange-600 font-semibold text-xs">{item.threshold}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
