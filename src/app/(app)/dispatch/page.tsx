'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { formatNumber } from '@/lib/utils';
import { Truck, Clock, CheckCircle, AlertTriangle, Package, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface OrderLine {
  line_id: number;
  sku_id: number;
  quantity: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
  has_stock: boolean;
}

interface PendingOrder {
  order_id: number;
  status: string;
  created_at: string;
  customer_name: string | null;
  order_ref: string | null;
  lines: OrderLine[];
}

interface DispatchRecord {
  id: number;
  fg_sku_id: number;
  product_name: string;
  qty: number;
  unit: string;
  dispatched_at: string;
  note: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'Approved',
  invoiced: 'Invoiced',
  in_production: 'In Production',
};

const STATUS_COLOR: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  invoiced: 'bg-blue-100 text-blue-800',
  in_production: 'bg-amber-100 text-amber-800',
};

export default function DispatchPage() {
  const supabase = createClient();

  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [history, setHistory] = useState<DispatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState<PendingOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const [ordersRes, histRes, stockRes] = await Promise.all([
      fetch('/api/dispatch-order').then(r => r.json()),
      supabase.schema('production').from('fg_dispatches')
        .select('id, fg_sku_id, qty, dispatched_at, note')
        .order('dispatched_at', { ascending: false })
        .limit(30),
      supabase.schema('production').from('v_fg_stock')
        .select('fg_sku_id, product_name, unit'),
    ]);

    setOrders(ordersRes.orders || []);

    const skuNames: Record<number, { name: string; unit: string }> = {};
    for (const s of stockRes.data || []) {
      const r = s as Record<string, unknown>;
      skuNames[r.fg_sku_id as number] = { name: r.product_name as string, unit: r.unit as string };
    }

    setHistory((histRes.data || []).map((r: Record<string, unknown>) => ({
      id: r.id as number,
      fg_sku_id: r.fg_sku_id as number,
      product_name: skuNames[r.fg_sku_id as number]?.name || `SKU #${r.fg_sku_id}`,
      qty: r.qty as number,
      unit: skuNames[r.fg_sku_id as number]?.unit || 'units',
      dispatched_at: r.dispatched_at as string,
      note: r.note as string | null,
    })));

    setLoading(false);
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setRefreshing(true); loadData(); };

  async function handleDispatch() {
    if (!confirmOrder) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/dispatch-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: confirmOrder.order_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dispatch failed');

      toast.success(`Order #${confirmOrder.order_id} dispatched! ${data.lines_dispatched} item${data.lines_dispatched !== 1 ? 's' : ''} deducted from stock.`);
      setConfirmOrder(null);
      await loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Dispatch failed');
      setConfirmOrder(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading pending orders..." />;

  const allHaveStock = (order: PendingOrder) => order.lines.every(l => l.has_stock);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <ScreenHeader
          icon={Truck} iconColor="text-green-600"
          title="Dispatch Order"
          description="Select a pending sales order and confirm dispatch to deduct stock."
        />
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0 mt-1 p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-600 transition-colors touch-manipulation"
          title="Refresh"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* Left: pending orders */}
        <div className="flex-1 min-w-0 space-y-3">
          {orders.length === 0 ? (
            <div className="card text-center py-10">
              <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
              <p className="font-bold text-gray-900 text-lg">No pending orders</p>
              <p className="text-gray-500 mt-2 text-sm">All approved orders have been dispatched.</p>
            </div>
          ) : (
            orders.map(order => {
              const canDispatch = allHaveStock(order);
              return (
                <div key={order.order_id} className="card space-y-3">
                  {/* Order header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">
                          {order.customer_name || `Order #${order.order_id}`}
                        </span>
                        {order.customer_name && (
                          <span className="text-xs text-gray-400">#{order.order_id}</span>
                        )}
                        {order.order_ref && (
                          <span className="text-xs text-gray-400">· Ref: {order.order_ref}</span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ordered {format(new Date(order.created_at), 'd MMM yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmOrder(order)}
                      disabled={!canDispatch}
                      className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all touch-manipulation ${
                        canDispatch
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Truck size={15} />
                      Dispatch
                    </button>
                  </div>

                  {/* Order lines table */}
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="text-left px-3 py-2 font-semibold">Product</th>
                          <th className="text-right px-3 py-2 font-semibold">Ordered</th>
                          <th className="text-right px-3 py-2 font-semibold">In Stock</th>
                          <th className="text-center px-3 py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {order.lines.map(line => (
                          <tr key={line.line_id} className={line.has_stock ? '' : 'bg-red-50'}>
                            <td className="px-3 py-2.5 font-medium text-gray-900 flex items-center gap-2">
                              <Package size={14} className="text-gray-400 shrink-0" />
                              {line.product_name}
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-700 whitespace-nowrap">
                              {formatNumber(line.quantity)} {line.unit}
                            </td>
                            <td className={`px-3 py-2.5 text-right whitespace-nowrap font-medium ${line.has_stock ? 'text-green-600' : 'text-red-600'}`}>
                              {formatNumber(line.qty_on_hand)} {line.unit}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {line.has_stock ? (
                                <CheckCircle size={16} className="mx-auto text-green-500" />
                              ) : (
                                <AlertTriangle size={16} className="mx-auto text-red-500" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!canDispatch && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <AlertTriangle size={13} />
                      Some items are out of stock. Make tubs before dispatching.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: recent dispatches */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Recent Dispatches</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">No dispatches recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(d => (
                  <div key={d.id} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{d.product_name}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                        {format(new Date(d.dispatched_at), 'd MMM')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatNumber(d.qty)} {d.unit}
                      {d.note && <span className="ml-1 text-gray-400">· {d.note}</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmOrder && (
        <ConfirmModal
          title="Confirm Dispatch"
          message={
            <div className="space-y-3">
              <p className="font-semibold text-gray-900">
                {confirmOrder.customer_name || `Order #${confirmOrder.order_id}`}
              </p>
              <div className="space-y-1">
                {confirmOrder.lines.map(line => (
                  <p key={line.line_id} className="text-sm text-gray-700">
                    · {formatNumber(line.quantity)} {line.unit} of {line.product_name}
                  </p>
                ))}
              </div>
              <p className="text-sm text-gray-500 pt-1">
                Stock will be deducted immediately and the order marked as dispatched.
              </p>
            </div>
          }
          confirmLabel="Yes, Dispatch Now"
          onConfirm={handleDispatch}
          onCancel={() => setConfirmOrder(null)}
          loading={submitting}
        />
      )}
    </div>
  );
}
