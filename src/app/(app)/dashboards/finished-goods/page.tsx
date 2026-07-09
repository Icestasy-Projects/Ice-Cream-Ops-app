'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Search, AlertTriangle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface FgStock {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
  reorder_point: number | null;
  par_qty: number | null;
  status: string | null;
}

const CAT_PAGE_SIZE = 8;
const ALERT_PAGE_SIZE = 8;
const STATUS_ORDER: Record<string, number> = { critical: 0, low: 1 };

function statusColor(status: string | null) {
  if (status === 'critical') return 'bg-red-100 text-red-700';
  if (status === 'low') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

function statusLabel(status: string | null) {
  if (status === 'critical') return 'Critical';
  if (status === 'low') return 'Low';
  return 'OK';
}

function FormatCard({ packFormat, items }: { packFormat: string; items: FgStock[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(i => i.product_name.toLowerCase().includes(q));
  }, [items, search]);

  const totalPages = Math.ceil(filtered.length / CAT_PAGE_SIZE);
  const pageItems = filtered.slice(page * CAT_PAGE_SIZE, (page + 1) * CAT_PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };

  const critCount = items.filter(i => i.status === 'critical').length;
  const lowCount = items.filter(i => i.status === 'low').length;

  return (
    <div className="card flex flex-col gap-3">
      {/* Pack format header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{packFormat}</h3>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {critCount > 0 && <span className="text-xs font-semibold text-red-600">{critCount} critical</span>}
            {critCount > 0 && lowCount > 0 && <span className="text-xs text-gray-300">·</span>}
            {lowCount > 0 && <span className="text-xs font-semibold text-amber-600">{lowCount} low</span>}
            {critCount === 0 && lowCount === 0 && <span className="text-xs text-green-600 font-semibold">All OK</span>}
          </div>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{items.length} SKU{items.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {/* Items — fixed min-height prevents card jumping when search filters results */}
      <div className="-mx-5 -mb-5 min-h-[200px] flex flex-col">
        {pageItems.length === 0 ? (
          <p className="text-center text-gray-400 text-xs py-4">No results.</p>
        ) : pageItems.map((item, idx) => (
          <div
            key={item.fg_sku_id}
            className={`flex items-center justify-between gap-2 px-5 py-2.5 ${idx < pageItems.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-orange-50 transition-colors`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 text-xs leading-tight">{item.product_name}</p>
              <p className="text-xs text-gray-400">
                Par: {item.par_qty ? `${formatNumber(item.par_qty)} ${item.unit}` : '—'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className="font-bold text-gray-900 text-xs">{formatNumber(item.qty_on_hand)}</p>
                <p className="text-xs text-gray-400">{item.unit}</p>
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusColor(item.status)}`}>
                {statusLabel(item.status)}
              </span>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-2 border-t border-gray-50 mt-auto">
            <p className="text-xs text-gray-400">{page * CAT_PAGE_SIZE + 1}–{Math.min((page + 1) * CAT_PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 touch-manipulation">
                <ChevronLeft size={13} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 touch-manipulation">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinishedGoodsDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<FgStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertPage, setAlertPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const stockRes = await supabase.schema('production').from('v_fg_stock').select('*').order('product_name');
    setData((stockRes.data || []).map((r: Record<string, unknown>) => ({
      fg_sku_id: r.fg_sku_id as number,
      product_name: r.product_name as string,
      unit: r.unit as string,
      qty_on_hand: (r.qty_on_hand as number) || 0,
      reorder_point: r.reorder_point as number | null,
      par_qty: r.par_qty as number | null,
      status: r.status as string | null,
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

  const grouped = useMemo(() => {
    const groups: Record<string, FgStock[]> = {};
    for (const item of data) {
      const fmt = item.unit || 'Other';
      if (!groups[fmt]) groups[fmt] = [];
      groups[fmt].push(item);
    }
    for (const fmt in groups) {
      groups[fmt].sort((a, b) => {
        const ao = STATUS_ORDER[a.status ?? ''] ?? 2;
        const bo = STATUS_ORDER[b.status ?? ''] ?? 2;
        return ao !== bo ? ao - bo : a.product_name.localeCompare(b.product_name);
      });
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  // Derive alerts from stock data (same source as cards — always in sync)
  const critical = data.filter(d => d.status === 'critical').sort((a, b) => a.product_name.localeCompare(b.product_name));
  const low = data.filter(d => d.status === 'low').sort((a, b) => a.product_name.localeCompare(b.product_name));
  const lowTotalPages = Math.ceil(low.length / ALERT_PAGE_SIZE);
  const lowPageData = low.slice(alertPage * ALERT_PAGE_SIZE, (alertPage + 1) * ALERT_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="🍦"
        title="Finished Goods Stock"
        description="Ready-to-sell tubs grouped by pack format. Red = make more urgently. Amber = plan to fill more soon."
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {critical.length > 0 && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{critical.length} Critical</span>}
          {low.length > 0 && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{low.length} Low</span>}
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{data.length} SKUs</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/reports/stock-export"
            download
            className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl hover:bg-green-100 touch-manipulation"
          >
            <Download size={13} />
            Export Excel
          </a>
          <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading finished goods..." /> : (
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* 2-column pack format grid */}
          <div className="flex-1 min-w-0">
            {grouped.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No stock data found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {grouped.map(([packFormat, items]) => (
                  <FormatCard key={packFormat} packFormat={packFormat} items={items} />
                ))}
              </div>
            )}
          </div>

          {/* Alerts sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h3 className="font-bold text-gray-900 text-sm">Needs Attention</h3>
              </div>
              {critical.length === 0 && low.length === 0 ? (
                <p className="text-sm text-green-700 bg-green-50 rounded-xl p-3 text-center">✓ All stock levels OK</p>
              ) : (
                <div className="space-y-2">
                  {/* All critical items always visible */}
                  {critical.map(a => (
                    <div key={a.fg_sku_id} className="rounded-xl p-3 bg-red-50 border border-red-100">
                      <p className="font-semibold text-gray-900 text-sm">{a.product_name}</p>
                      <p className="text-xs text-gray-400">{a.unit}</p>
                      <p className="text-xs mt-0.5 text-red-700">🔴 Critical — {formatNumber(a.qty_on_hand)} on hand</p>
                    </div>
                  ))}

                  {/* Low items paginated */}
                  {low.length > 0 && (
                    <>
                      {critical.length > 0 && (
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide pt-1">Low Stock</p>
                      )}
                      {lowPageData.map(a => (
                        <div key={a.fg_sku_id} className="rounded-xl p-3 bg-amber-50 border border-amber-100">
                          <p className="font-semibold text-gray-900 text-sm">{a.product_name}</p>
                          <p className="text-xs text-gray-400">{a.unit}</p>
                          <p className="text-xs mt-0.5 text-amber-700">🟡 Low — {formatNumber(a.qty_on_hand)} on hand{a.par_qty ? ` / par ${formatNumber(a.par_qty)}` : ''}</p>
                        </div>
                      ))}
                      {lowTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-xs text-gray-400">{alertPage * ALERT_PAGE_SIZE + 1}–{Math.min((alertPage + 1) * ALERT_PAGE_SIZE, low.length)} of {low.length} low</p>
                          <div className="flex gap-1">
                            <button onClick={() => setAlertPage(p => Math.max(0, p - 1))} disabled={alertPage === 0}
                              className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 touch-manipulation">
                              <ChevronLeft size={14} />
                            </button>
                            <button onClick={() => setAlertPage(p => Math.min(lowTotalPages - 1, p + 1))} disabled={alertPage >= lowTotalPages - 1}
                              className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 touch-manipulation">
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
