'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Search, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface RmStock {
  rm_item_id: number;
  ingredient_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number | null;
  par_qty: number | null;
  status: string | null;
  category: string;
}

interface Alert {
  item_id: number;
  item_name: string;
  qty_on_hand: number;
  threshold_qty: number;
  threshold_type: string;
  status: string;
}

const ALERT_PAGE_SIZE = 8;
const STATUS_ORDER: Record<string, number> = { critical: 0, low: 1 };

function statusColor(status: string | null) {
  if (status === 'critical') return 'bg-red-100 text-red-700';
  if (status === 'low') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

function statusLabel(status: string | null) {
  if (status === 'critical') return '🔴 Critical';
  if (status === 'low') return '🟡 Low';
  return '🟢 OK';
}

export default function RawMaterialsDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<RmStock[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [queryError, setQueryError] = useState<string | null>(null);
  const [alertPage, setAlertPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setQueryError(null);
    const [stockRes, alertRes, itemsRes, catsRes] = await Promise.all([
      supabase.schema('production').from('v_rm_stock').select('*').order('ingredient_name'),
      supabase.schema('production').from('v_stock_alerts_rm').select('*').in('status', ['low', 'critical']),
      supabase.schema('production').from('rm_items').select('id, category_id'),
      supabase.schema('production').from('rm_categories').select('id, name'),
    ]);

    if (stockRes.error) {
      console.error('v_rm_stock error:', stockRes.error);
      setQueryError(stockRes.error.message);
    }

    const catMap = new Map<number, string>(
      (catsRes.data || []).map((c: Record<string, unknown>) => [c.id as number, c.name as string])
    );
    const itemCatMap = new Map<number, string>(
      (itemsRes.data || []).map((i: Record<string, unknown>) => [
        i.id as number,
        catMap.get(i.category_id as number) || 'Other',
      ])
    );

    setData(
      (stockRes.data || []).map((r: Record<string, unknown>) => ({
        rm_item_id: r.rm_item_id as number,
        ingredient_name: r.ingredient_name as string,
        unit: r.unit as string,
        qty_on_hand: (r.qty_on_hand as number) || 0,
        reorder_point: r.reorder_point as number | null,
        par_qty: r.par_qty as number | null,
        status: r.status as string | null,
        category: itemCatMap.get(r.rm_item_id as number) || 'Other',
      }))
    );

    const sortedAlerts = [...(alertRes.data || [])].sort((a, b) => {
      const ao = STATUS_ORDER[a.status] ?? 2;
      const bo = STATUS_ORDER[b.status] ?? 2;
      return ao !== bo ? ao - bo : a.item_name.localeCompare(b.item_name);
    });
    setAlerts(sortedAlerts);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase.channel('rm-dash').on('postgres_changes', {
      event: '*', schema: 'production', table: 'rm_ledger',
    }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const grouped = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = data.filter(d => d.ingredient_name.toLowerCase().includes(q));
    const groups: Record<string, RmStock[]> = {};
    for (const item of filtered) {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    for (const cat in groups) {
      groups[cat].sort((a, b) => {
        const ao = STATUS_ORDER[a.status ?? ''] ?? 2;
        const bo = STATUS_ORDER[b.status ?? ''] ?? 2;
        return ao !== bo ? ao - bo : a.ingredient_name.localeCompare(b.ingredient_name);
      });
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [data, search]);

  const totalItems = grouped.reduce((s, [, items]) => s + items.length, 0);
  const critical = alerts.filter(a => a.status === 'critical');
  const low = alerts.filter(a => a.status === 'low');

  const alertTotalPages = Math.ceil(alerts.length / ALERT_PAGE_SIZE);
  const alertPageData = alerts.slice(alertPage * ALERT_PAGE_SIZE, (alertPage + 1) * ALERT_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="🌿"
        title="Raw Materials Stock"
        description="Stock levels grouped by category. Red = order now. Amber = order soon."
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 text-sm flex-wrap">
          {critical.length > 0 && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{critical.length} Critical</span>}
          {low.length > 0 && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{low.length} Low</span>}
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{data.length} Total</span>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {queryError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-800">
          <strong>Query error:</strong> {queryError}
        </div>
      )}

      {loading ? <LoadingSpinner text="Loading stock levels..." /> : (
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* Main grouped table */}
          <div className="flex-1 min-w-0 card space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {grouped.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No results found.</p>
            ) : (
              <div className="space-y-4 -mx-5">
                {grouped.map(([category, items]) => (
                  <div key={category}>
                    <div className="px-5 py-1.5 bg-gray-50 border-y border-gray-100">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{category}</span>
                      <span className="ml-2 text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      {items.map(item => (
                        <div key={item.rm_item_id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-50 hover:bg-orange-50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm">{item.ingredient_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Reorder: {item.reorder_point ? `${formatNumber(item.reorder_point)} ${item.unit}` : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">{formatNumber(item.qty_on_hand)}</p>
                              <p className="text-xs text-gray-400">{item.unit}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusColor(item.status)}`}>
                              {statusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {search && (
              <p className="text-xs text-gray-400 pt-1 text-center">
                {totalItems} result{totalItems !== 1 ? 's' : ''} across {grouped.length} categor{grouped.length !== 1 ? 'ies' : 'y'}
              </p>
            )}
          </div>

          {/* Alerts sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-3">
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h3 className="font-bold text-gray-900 text-sm">Needs Attention</h3>
              </div>
              {alerts.length === 0 ? (
                <p className="text-sm text-green-700 bg-green-50 rounded-xl p-3 text-center">✓ All stock levels OK</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {alertPageData.map(a => (
                      <div key={a.item_id} className={`rounded-xl p-3 ${a.status === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                        <p className="font-semibold text-gray-900 text-sm">{a.item_name}</p>
                        <p className={`text-xs mt-0.5 ${a.status === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                          {a.status === 'critical' ? '🔴 Critical' : '🟡 Low'} — {formatNumber(a.qty_on_hand)} / {formatNumber(a.threshold_qty)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {alertTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-gray-400">{alertPage * ALERT_PAGE_SIZE + 1}–{Math.min((alertPage + 1) * ALERT_PAGE_SIZE, alerts.length)} of {alerts.length}</p>
                      <div className="flex gap-1">
                        <button onClick={() => setAlertPage(p => Math.max(0, p - 1))} disabled={alertPage === 0}
                          className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 touch-manipulation">
                          <ChevronLeft size={14} />
                        </button>
                        <button onClick={() => setAlertPage(p => Math.min(alertTotalPages - 1, p + 1))} disabled={alertPage >= alertTotalPages - 1}
                          className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 touch-manipulation">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
