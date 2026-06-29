'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, Search, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface PrepStock {
  prep_product_id: number;
  product_name: string;
  unit: string;
  qty_kitchen: number;
  qty_factory: number;
  qty_total: number;
  status: string | null;
  batch_yield_l: number;  // litres of bulk per 1 unit of prep
}

interface Alert {
  item_id: number;
  item_name: string;
  qty_on_hand: number;
  threshold_qty: number;
  status: string;
}

// FG format volumes in litres
const BULK_4L   = 4;       // 1 × 4L Bulk tub
const SQ_12_L   = 1.8;     // 1 × 12-square pack = 12 × 150ml = 1800ml
const SAMPLE_50 = 0.05;    // 1 × 50ml sample

const ALERT_PAGE_SIZE = 8;
const STATUS_ORDER: Record<string, number> = { critical: 0, low: 1 };

function statusColor(s: string | null) {
  if (s === 'critical') return 'bg-red-100 text-red-700';
  if (s === 'low') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}
function statusLabel(s: string | null) {
  if (s === 'critical') return '🔴 Critical';
  if (s === 'low') return '🟡 Low';
  return '🟢 OK';
}

function yieldChip(label: string, count: number, color: string) {
  return (
    <span key={label} className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <span className="font-bold">{count}</span>
      <span className="font-normal opacity-80">× {label}</span>
    </span>
  );
}

export default function PrepDashboard() {
  const supabase = createClient();
  const [data, setData] = useState<PrepStock[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alertPage, setAlertPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [stockRes, alertRes, prodRes] = await Promise.all([
      supabase.schema('production').from('v_prep_stock').select('*').order('product_name'),
      supabase.schema('production').from('v_stock_alerts_prep').select('*').in('status', ['low', 'critical']),
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
        status: r.status as string | null,
        batch_yield_l: yieldMap.get(r.prep_product_id as number) || 0,
      }))
    );

    const sorted = [...(alertRes.data || [])].sort((a, b) => {
      const ao = STATUS_ORDER[a.status] ?? 2;
      const bo = STATUS_ORDER[b.status] ?? 2;
      return ao !== bo ? ao - bo : (a.item_name as string).localeCompare(b.item_name as string);
    });
    setAlerts(sorted);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase.channel('prep-dash').on('postgres_changes', {
      event: '*', schema: 'production', table: 'prep_ledger',
    }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, load]);

  const filtered = useMemo(() =>
    data.filter(d => d.product_name.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  );

  const critical = alerts.filter(a => a.status === 'critical');
  const low = alerts.filter(a => a.status === 'low');
  const alertTotalPages = Math.ceil(alerts.length / ALERT_PAGE_SIZE);
  const alertPageData = alerts.slice(alertPage * ALERT_PAGE_SIZE, (alertPage + 1) * ALERT_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="🧪"
        title="Prep / Mix Stock"
        description="Factory prep converted to finished goods potential. Shows how many tubs can be made right now."
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {critical.length > 0 && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{critical.length} Critical</span>}
          {low.length > 0 && <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{low.length} Low</span>}
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{data.length} Flavours</span>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? <LoadingSpinner text="Loading mix levels..." /> : (
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* Main list */}
          <div className="flex-1 min-w-0 card space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search flavour..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            <div className="-mx-5">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No results found.</p>
              ) : filtered.map(item => {
                // Factory: qty_factory batches × batch_yield_l L/batch → litres → tubs
                const fL = item.qty_factory * item.batch_yield_l;
                const fBulk = Math.floor(fL / BULK_4L);
                const fSq   = Math.floor(fL / SQ_12_L);
                const fSmp  = Math.floor(fL / SAMPLE_50);

                // Kitchen: same calculation but from kitchen batches
                const kL = item.qty_kitchen * item.batch_yield_l;
                const kBulk = Math.floor(kL / BULK_4L);
                const kSq   = Math.floor(kL / SQ_12_L);
                const kSmp  = Math.floor(kL / SAMPLE_50);

                return (
                  <div key={item.prep_product_id} className="px-5 py-4 border-b border-gray-50 hover:bg-orange-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.product_name}</p>
                        <p className="text-xs text-gray-400">Yield: {item.batch_yield_l}L per batch</p>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusColor(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    {/* Factory row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-green-700 w-14 shrink-0">🏭 Factory</span>
                      <span className="text-xs text-gray-400">{formatNumber(item.qty_factory)} batch{item.qty_factory !== 1 ? 'es' : ''} = {formatNumber(fL)}L →</span>
                      <div className="flex flex-wrap gap-1">
                        {fBulk > 0 ? yieldChip('4L Bulk', fBulk, 'bg-orange-100 text-orange-800') : <span className="text-xs text-gray-300 italic">none</span>}
                      </div>
                    </div>

                    {/* Kitchen row — only shown if there's stock */}
                    {item.qty_kitchen > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 w-14 shrink-0">🧪 Kitchen</span>
                        <span className="text-xs text-gray-400">{formatNumber(item.qty_kitchen)} batch{item.qty_kitchen !== 1 ? 'es' : ''} = {formatNumber(kL)}L →</span>
                        <div className="flex flex-wrap gap-1">
                          {kBulk > 0 && yieldChip('4L Bulk', kBulk, 'bg-sky-100 text-sky-800')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <h3 className="font-bold text-gray-900 text-sm">Needs Attention</h3>
              </div>
              {alerts.length === 0 ? (
                <p className="text-sm text-green-700 bg-green-50 rounded-xl p-3 text-center">✓ All mix levels OK</p>
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
