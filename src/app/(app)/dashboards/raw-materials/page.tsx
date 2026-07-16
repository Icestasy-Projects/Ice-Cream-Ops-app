'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Search, Download, ChevronDown, ChevronUp, Leaf } from 'lucide-react';

interface RmItem {
  rm_item_id: number;
  ingredient_name: string;
  unit: string;
  qty_on_hand: number;
  category: string;
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

function CategorySection({
  category, items, weeklyReq,
}: {
  category: string;
  items: RmItem[];
  weeklyReq: Record<number, number>;
}) {
  const [open, setOpen] = useState(true);

  const withStatus = useMemo(() => items.map(item => ({
    ...item,
    weekly: weeklyReq[item.rm_item_id],
    threshold: weeklyReq[item.rm_item_id] ? Math.ceil(weeklyReq[item.rm_item_id] * 2.5) : undefined,
    status: computeStatus(item.qty_on_hand, weeklyReq[item.rm_item_id]),
  })).sort((a, b) => {
    const ord: Record<StatusType, number> = { critical: 0, low: 1, ok: 2, unknown: 3 };
    return ord[a.status] !== ord[b.status]
      ? ord[a.status] - ord[b.status]
      : a.ingredient_name.localeCompare(b.ingredient_name);
  }), [items, weeklyReq]);

  const crit = withStatus.filter(i => i.status === 'critical').length;
  const low = withStatus.filter(i => i.status === 'low').length;

  return (
    <div className="mb-4 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Category header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-orange-50 transition-colors text-left touch-manipulation"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-gray-800 text-sm">{category}</span>
          <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
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
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[160px]">Ingredient</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">In Hand</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Wkly Req</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">Threshold</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {withStatus.map(item => (
                <tr key={item.rm_item_id} className={`hover:bg-orange-50 transition-colors ${
                  item.status === 'critical' ? 'bg-red-50/40' :
                  item.status === 'low' ? 'bg-amber-50/40' : ''
                }`}>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-gray-900 text-xs">{item.ingredient_name}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <span className="font-bold text-gray-900 text-xs">{item.qty_on_hand}</span>
                    <span className="text-gray-400 text-xs ml-1">{item.unit}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {item.weekly ? (
                      <span className="text-indigo-600 font-semibold text-xs">{item.weekly} {item.unit}</span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {item.threshold ? (
                      <span className="text-orange-600 font-semibold text-xs">{item.threshold} {item.unit}</span>
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

export default function RawMaterialsDashboard() {
  const supabase = createClient();
  const [items, setItems] = useState<RmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyReq, setWeeklyReq] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | StatusType>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const [stockRes, itemsRes, catsRes] = await Promise.all([
      supabase.schema('production').from('v_rm_stock').select('*').order('ingredient_name'),
      supabase.schema('production').from('rm_items').select('id, category_id'),
      supabase.schema('production').from('rm_categories').select('id, name'),
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
    setItems(
      (stockRes.data || []).map((r: Record<string, unknown>) => ({
        rm_item_id: r.rm_item_id as number,
        ingredient_name: r.ingredient_name as string,
        unit: r.unit as string,
        qty_on_hand: (r.qty_on_hand as number) || 0,
        category: itemCatMap.get(r.rm_item_id as number) || 'Other',
      }))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch('/api/weekly-req')
      .then(r => r.json())
      .then(d => { if (d.rm) setWeeklyReq(d.rm); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const channel = supabase.channel('rm-dash').on('postgres_changes', {
      event: '*', schema: 'production', table: 'rm_ledger',
    }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(item => {
      if (q && !item.ingredient_name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) return false;
      if (filterStatus !== 'all') {
        const s = computeStatus(item.qty_on_hand, weeklyReq[item.rm_item_id]);
        if (s !== filterStatus) return false;
      }
      return true;
    });
  }, [items, search, filterStatus, weeklyReq]);

  const grouped = useMemo(() => {
    const g: Record<string, RmItem[]> = {};
    for (const item of filtered) {
      if (!g[item.category]) g[item.category] = [];
      g[item.category].push(item);
    }
    return Object.entries(g).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const allWithStatus = useMemo(() =>
    items.map(i => computeStatus(i.qty_on_hand, weeklyReq[i.rm_item_id])),
    [items, weeklyReq]
  );
  const critCount = allWithStatus.filter(s => s === 'critical').length;
  const lowCount = allWithStatus.filter(s => s === 'low').length;

  const filterBtns: { key: 'all' | StatusType; label: string; cls: string }[] = [
    { key: 'all', label: `All (${items.length})`, cls: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { key: 'critical', label: `Critical (${critCount})`, cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { key: 'low', label: `Low (${lowCount})`, cls: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
    { key: 'ok', label: 'OK', cls: 'bg-green-100 text-green-700 hover:bg-green-200' },
  ];

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={Leaf} iconColor="text-orange-500"
        title="Raw Materials Stock"
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
          placeholder="Search ingredient or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading stock levels..." />
      ) : grouped.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No items match your filter.</p>
      ) : (
        <div>
          {grouped.map(([category, catItems]) => (
            <CategorySection
              key={category}
              category={category}
              items={catItems}
              weeklyReq={weeklyReq}
            />
          ))}
        </div>
      )}
    </div>
  );
}
