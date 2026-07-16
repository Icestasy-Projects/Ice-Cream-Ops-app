'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Search, Download, ChevronDown, ChevronUp, Box } from 'lucide-react';

interface FgItem {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
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

function PackSection({
  packFormat, items, weeklyReq,
}: {
  packFormat: string;
  items: FgItem[];
  weeklyReq: Record<number, number>;
}) {
  const [open, setOpen] = useState(true);

  const withStatus = useMemo(() => items.map(item => ({
    ...item,
    weekly: weeklyReq[item.fg_sku_id],
    threshold: weeklyReq[item.fg_sku_id] ? Math.ceil(weeklyReq[item.fg_sku_id] * 2.5) : undefined,
    status: computeStatus(item.qty_on_hand, weeklyReq[item.fg_sku_id]),
  })).sort((a, b) => {
    const ord: Record<StatusType, number> = { critical: 0, low: 1, ok: 2, unknown: 3 };
    return ord[a.status] !== ord[b.status]
      ? ord[a.status] - ord[b.status]
      : a.product_name.localeCompare(b.product_name);
  }), [items, weeklyReq]);

  const crit = withStatus.filter(i => i.status === 'critical').length;
  const low = withStatus.filter(i => i.status === 'low').length;

  return (
    <div className="mb-4 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-orange-50 transition-colors text-left touch-manipulation"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-gray-800 text-sm">{packFormat}</span>
          <span className="text-xs text-gray-400">{items.length} SKU{items.length !== 1 ? 's' : ''}</span>
          {crit > 0 && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{crit} critical</span>}
          {low > 0 && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{low} low</span>}
          {crit === 0 && low === 0 && <span className="text-xs font-semibold text-green-600">All OK</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[180px]">Product</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">In Hand</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Wkly Req</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Threshold</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withStatus.map(item => (
                <tr key={item.fg_sku_id} className={`hover:bg-orange-50 transition-colors ${
                  item.status === 'critical' ? 'bg-red-50/40' :
                  item.status === 'low' ? 'bg-amber-50/40' : ''
                }`}>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-gray-900 text-xs">{item.product_name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <span className="font-bold text-gray-900 text-xs">{item.qty_on_hand}</span>
                    <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
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
      )}
    </div>
  );
}

export default function FinishedGoodsDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<FgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyReq, setWeeklyReq] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | StatusType>('all');

  useEffect(() => {
    fetch('/api/weekly-req')
      .then(r => r.json())
      .then(d => { if (d.fg) setWeeklyReq(d.fg); })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const stockRes = await supabase.schema('production').from('v_fg_stock').select('*').order('product_name');
    setData((stockRes.data || []).map((r: Record<string, unknown>) => ({
      fg_sku_id: r.fg_sku_id as number,
      product_name: r.product_name as string,
      unit: r.unit as string,
      qty_on_hand: (r.qty_on_hand as number) || 0,
    })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase.channel('fg-dash').on('postgres_changes', {
      event: '*', schema: 'production', table: 'fg_ledger',
    }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const enriched = useMemo(() => data.map(item => ({
    ...item,
    status: computeStatus(item.qty_on_hand, weeklyReq[item.fg_sku_id]),
  })), [data, weeklyReq]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(item => {
      if (q && !item.product_name.toLowerCase().includes(q) && !item.unit.toLowerCase().includes(q)) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    });
  }, [enriched, search, filterStatus]);

  const grouped = useMemo(() => {
    const g: Record<string, FgItem[]> = {};
    for (const item of filtered) {
      if (!g[item.unit]) g[item.unit] = [];
      g[item.unit].push(item);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

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
        icon={Box} iconColor="text-pink-500"
        title="Finished Goods Stock"
        description="Weekly requirements from 42-day order history (6-week avg). Threshold = 2.5× weekly req."
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
          placeholder="Search product or format..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading finished goods..." />
      ) : grouped.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No items match your filter.</p>
      ) : (
        <div>
          {grouped.map(([packFormat, items]) => (
            <PackSection
              key={packFormat}
              packFormat={packFormat}
              items={items}
              weeklyReq={weeklyReq}
            />
          ))}
        </div>
      )}
    </div>
  );
}
