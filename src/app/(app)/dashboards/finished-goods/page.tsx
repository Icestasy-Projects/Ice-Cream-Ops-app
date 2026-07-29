'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useRole } from '@/hooks/useRole';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Search, Download, ChevronDown, ChevronUp, Box, ChevronsUpDown, X, Calculator, Info, Package } from 'lucide-react';
import { format } from 'date-fns';

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

type SortCol = 'name' | 'onhand' | 'weekly' | 'threshold' | 'status';

function SortTh({ col, label, sort, onSort, align = 'right' }: {
  col: SortCol; label: string; sort: { col: SortCol; asc: boolean };
  onSort: (c: SortCol) => void; align?: 'left' | 'right' | 'center';
}) {
  const active = sort.col === col;
  return (
    <th onClick={() => onSort(col)} className={`px-4 py-2 text-xs font-semibold text-gray-500 cursor-pointer select-none hover:text-gray-800 whitespace-nowrap text-${align}`}>
      <span className="inline-flex items-center gap-1">
        {align === 'right' && (active ? (sort.asc ? '▲' : '▼') : <ChevronsUpDown size={10} className="text-gray-300" />)}
        {label}
        {align !== 'right' && (active ? (sort.asc ? ' ▲' : ' ▼') : <ChevronsUpDown size={10} className="text-gray-300 ml-1" />)}
      </span>
    </th>
  );
}

// ── Calc Breakdown Modal ─────────────────────────────────────────────────────

interface OrderContribution {
  order_id: number;
  customer_name: string | null;
  order_ref: string | null;
  order_date: string;
  status: string;
  qty: number;
}

interface FgCalcBreakdown {
  sku_id: number;
  product_name: string;
  unit: string;
  orders: OrderContribution[];
  total_qty: number;
  weekly_req: number;
  window_weeks: number;
  threshold: number;
  qty_on_hand: number;
  sku_code: string | null;
  flavour_name: string | null;
  pack_format_name: string | null;
  litres_per_pack: number | null;
}

const STATUS_PILL: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  invoiced: 'bg-blue-100 text-blue-700',
  in_production: 'bg-amber-100 text-amber-700',
  dispatched: 'bg-gray-100 text-gray-600',
  delivered: 'bg-purple-100 text-purple-700',
};

function CalcModal({ skuId, productName, onClose }: {
  skuId: number;
  productName: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<FgCalcBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/fg-calc-breakdown?sku_id=${skuId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [skuId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3 rounded-t-3xl sm:rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Calculator size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Calc Breakdown</p>
              <p className="font-bold text-gray-900 text-sm leading-tight">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 touch-manipulation shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 text-center py-6">{error}</p>
          )}

          {data && (
            <>
              {/* SKU link info */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">SKU Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-gray-500">SKU Code</span>
                  <span className="font-semibold text-gray-900">{data.sku_code || <span className="text-red-500">Not linked</span>}</span>
                  <span className="text-gray-500">Flavour</span>
                  <span className="font-semibold text-gray-900">{data.flavour_name || <span className="text-red-500">Not linked</span>}</span>
                  <span className="text-gray-500">Pack Format</span>
                  <span className="font-semibold text-gray-900">{data.pack_format_name || <span className="text-red-500">Not linked</span>}</span>
                  {data.litres_per_pack !== null && (
                    <>
                      <span className="text-gray-500">Litres / Pack</span>
                      <span className="font-semibold text-gray-900">{data.litres_per_pack}L</span>
                    </>
                  )}
                </div>
              </div>

              {/* Formula */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Info size={14} className="text-indigo-500" />
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">How it's calculated</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Source</span>
                    <span className="font-semibold text-gray-900">Last 90 days of orders</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Statuses included</span>
                    <span className="font-semibold text-gray-900 text-right">All (incl. dispatched)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Window</span>
                    <span className="font-semibold text-gray-900">{data.window_weeks} weeks</span>
                  </div>
                  <div className="border-t border-indigo-100 pt-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total qty in window</span>
                      <span className="font-semibold text-gray-700">{data.total_qty} {data.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Weekly avg <span className="text-gray-400 text-xs">(÷{data.window_weeks} wks, rounded up)</span></span>
                      <span className="font-bold text-indigo-700 text-base">{data.weekly_req} {data.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Threshold
                        <span className="text-gray-400 text-xs ml-1">(2.5× req)</span>
                      </span>
                      <span className="font-bold text-orange-600 text-base">{data.threshold} {data.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Currently in stock</span>
                      <span className={`font-bold text-base ${data.qty_on_hand < data.weekly_req ? 'text-red-600' : data.qty_on_hand < data.threshold ? 'text-amber-600' : 'text-green-600'}`}>
                        {data.qty_on_hand} {data.unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order list */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Package size={14} className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Orders in last 90 days for this SKU
                    <span className="ml-2 normal-case font-normal text-gray-400">({data.orders.length} records)</span>
                  </p>
                </div>

                {data.orders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No orders in the last 90 days for this SKU — requirement is 0.</p>
                ) : (
                  <div className="space-y-2">
                    {data.orders.map((o, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {o.order_id > 0 && (
                              <span className="text-xs font-bold text-gray-700">#{o.order_id}</span>
                            )}
                            <span className="text-xs text-gray-600 truncate">{o.customer_name || 'Unknown'}</span>
                            {o.order_ref && (
                              <span className="text-xs text-gray-400">· {o.order_ref}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{format(new Date(o.order_date), 'd MMM yyyy')}</span>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${STATUS_PILL[o.status] || 'bg-gray-100 text-gray-500'}`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap shrink-0">
                          +{o.qty} <span className="font-normal text-gray-400 text-xs">{data.unit}</span>
                        </span>
                      </div>
                    ))}

                    {/* Total row */}
                    <div className="flex justify-between items-center bg-indigo-50 rounded-xl px-3 py-2.5 border border-indigo-100">
                      <span className="text-sm font-bold text-indigo-700">Total</span>
                      <span className="text-sm font-bold text-indigo-700">{data.total_qty} {data.unit}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PackSection ──────────────────────────────────────────────────────────────

function PackSection({
  packFormat, items, weeklyReq, isAdmin, onCalcClick,
}: {
  packFormat: string;
  items: FgItem[];
  weeklyReq: Record<number, number>;
  isAdmin: boolean;
  onCalcClick: (item: FgItem) => void;
}) {
  const [open, setOpen] = useState(true);
  const [sort, setSort] = useState<{ col: SortCol; asc: boolean }>({ col: 'status', asc: true });

  function toggleSort(col: SortCol) {
    setSort(s => s.col === col ? { col, asc: !s.asc } : { col, asc: true });
  }

  const withStatus = useMemo(() => {
    const rows = items.map(item => ({
      ...item,
      weekly: weeklyReq[item.fg_sku_id],
      threshold: weeklyReq[item.fg_sku_id] ? Math.ceil(weeklyReq[item.fg_sku_id] * 2.5) : undefined,
      status: computeStatus(item.qty_on_hand, weeklyReq[item.fg_sku_id]),
    }));
    const ord: Record<StatusType, number> = { critical: 0, low: 1, ok: 2, unknown: 3 };
    return rows.sort((a, b) => {
      let cmp = 0;
      if (sort.col === 'name') cmp = a.product_name.localeCompare(b.product_name);
      else if (sort.col === 'onhand') cmp = a.qty_on_hand - b.qty_on_hand;
      else if (sort.col === 'weekly') cmp = (a.weekly ?? 0) - (b.weekly ?? 0);
      else if (sort.col === 'threshold') cmp = (a.threshold ?? 0) - (b.threshold ?? 0);
      else cmp = ord[a.status] - ord[b.status] || a.product_name.localeCompare(b.product_name);
      return sort.asc ? cmp : -cmp;
    });
  }, [items, weeklyReq, sort]);

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
                <SortTh col="name" label="Product" sort={sort} onSort={toggleSort} align="left" />
                <SortTh col="onhand" label="In Hand" sort={sort} onSort={toggleSort} />
                <SortTh col="weekly" label="Wkly Req" sort={sort} onSort={toggleSort} />
                <SortTh col="threshold" label="Threshold" sort={sort} onSort={toggleSort} />
                <SortTh col="status" label="Status" sort={sort} onSort={toggleSort} align="center" />
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
                      isAdmin ? (
                        <button
                          onClick={() => onCalcClick(item)}
                          className="group inline-flex items-center gap-1 text-indigo-600 font-semibold text-xs hover:text-indigo-800 hover:underline touch-manipulation"
                          title="View calculation breakdown"
                        >
                          {item.weekly}
                          <Calculator size={11} className="text-indigo-400 group-hover:text-indigo-600 shrink-0" />
                        </button>
                      ) : (
                        <span className="text-indigo-600 font-semibold text-xs">{item.weekly}</span>
                      )
                    ) : (
                      isAdmin ? (
                        <button
                          onClick={() => onCalcClick(item)}
                          className="text-gray-300 text-xs hover:text-indigo-400 touch-manipulation"
                          title="View why this is 0"
                        >
                          — <Calculator size={10} className="inline ml-0.5" />
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )
                    )}
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

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FinishedGoodsDashboard() {
  const supabase = createClient();
  const { role } = useRole();
  const isAdmin = role === 'super_admin';

  const [data, setData] = useState<FgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyReq, setWeeklyReq] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | StatusType>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [calcItem, setCalcItem] = useState<FgItem | null>(null);

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
    setLastUpdated(new Date());
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

  const EXCLUDED_UNITS = new Set(['B2B Add-On', 'Extras']);

  const grouped = useMemo(() => {
    const g: Record<string, FgItem[]> = {};
    for (const item of filtered) {
      if (EXCLUDED_UNITS.has(item.unit)) continue;
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
        description={`Requirements based on all open sales orders (Approved / Invoiced / In Production). Threshold = 2.5× req.${isAdmin ? ' Tap any Wkly Req number to see the breakdown.' : ''}`}
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
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
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

      {isAdmin && (
        <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
          <Calculator size={13} className="shrink-0" />
          <span>Admin: tap any <strong>Wkly Req</strong> number to see its full calculation breakdown.</span>
        </div>
      )}

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
              isAdmin={isAdmin}
              onCalcClick={setCalcItem}
            />
          ))}
        </div>
      )}

      {calcItem && (
        <CalcModal
          skuId={calcItem.fg_sku_id}
          productName={calcItem.product_name}
          onClose={() => setCalcItem(null)}
        />
      )}
    </div>
  );
}
