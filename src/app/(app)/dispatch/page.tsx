'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface FgStock {
  fg_product_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

interface SalesOrder {
  order_id: number;
  order_ref: string;
  customer_name: string;
}

export default function DispatchPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [stock, setStock] = useState<FgStock[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FgStock | null>(null);
  const [qty, setQty] = useState('');
  const [orderId, setOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [stockRes, ordersRes] = await Promise.all([
      supabase.schema('production').from('v_fg_stock')
        .select('fg_product_id, product_name, unit, qty_on_hand')
        .gt('qty_on_hand', 0)
        .order('product_name'),
      supabase.schema('sales').from('sales_orders')
        .select('order_id, order_ref, customer_name')
        .order('order_id', { ascending: false })
        .limit(50),
    ]);
    setStock(stockRes.data || []);
    setOrders(ordersRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit() {
    if (!selected) return;
    if (!qty || parseFloat(qty) <= 0) { toast.error('Please enter the quantity to dispatch.'); return; }

    setSubmitting(true);
    try {
      const insertData: Record<string, unknown> = {
        fg_product_id: selected.fg_product_id,
        qty_dispatched: parseFloat(qty),
        dispatched_by: user?.id,
        notes: notes || null,
        customer_name: customerName || null,
      };
      if (orderId) insertData.order_id = parseInt(orderId);

      const { error } = await supabase
        .schema('production')
        .from('fg_dispatches')
        .insert(insertData);

      if (error) throw new Error(error.message);

      const before = selected.qty_on_hand;
      const after = before - parseFloat(qty);
      setLastResult(`Dispatched ${qty} ${selected.unit} of ${selected.product_name}. Stock: ${formatNumber(before)} → ${formatNumber(after)} ${selected.unit}.`);
      toast.success(`Dispatch recorded! ${qty} ${selected.unit} of ${selected.product_name} sent out.`);
      setShowConfirm(false);
      setSelected(null);
      setQty('');
      setOrderId('');
      setCustomerName('');
      setNotes('');
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('negative')) {
        toast.error(`Not enough ${selected.product_name} in stock (you have ${formatNumber(selected.qty_on_hand)} ${selected.unit}, trying to dispatch ${qty} ${selected.unit}).`);
      } else {
        toast.error(parseSupabaseError(msg));
      }
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading finished goods..." />;

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="🚚"
        title="Dispatch Order"
        description="Record tubs being sent out to a customer. This reduces your finished goods stock count."
      />

      {stock.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-bold text-gray-900 text-lg">No finished goods in stock right now</p>
          <p className="text-gray-500 mt-2">Fill some tubs first before dispatching.</p>
        </div>
      ) : (
        <div className="card space-y-4">
          <h2 className="section-title">What are you dispatching?</h2>
          <div className="space-y-2">
            {stock.map(s => (
              <button
                key={s.fg_product_id}
                onClick={() => { setSelected(s); setQty(''); setLastResult(null); }}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all touch-manipulation ${
                  selected?.fg_product_id === s.fg_product_id
                    ? 'border-brand-500 bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-orange-200'
                }`}
              >
                <p className="font-bold text-gray-900">{s.product_name}</p>
                <p className="text-sm text-green-600 mt-0.5">In stock: {formatNumber(s.qty_on_hand)} {s.unit}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="card space-y-4">
          <h2 className="section-title">Dispatch Details</h2>

          <div>
            <label className="label-text block mb-2">How many {selected.unit} are you sending?</label>
            <input
              type="number"
              min="1"
              step="1"
              max={selected.qty_on_hand}
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder={`Max ${formatNumber(selected.qty_on_hand)} ${selected.unit}`}
              className="input-field"
            />
          </div>

          <div>
            <label className="label-text block mb-2">Customer Name (optional)</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Hotel Taj Mumbai" className="input-field" />
          </div>

          <div>
            <label className="label-text block mb-2">Link to a Sales Order (optional)</label>
            <select value={orderId} onChange={e => setOrderId(e.target.value)} className="input-field">
              <option value="">No order — ad hoc dispatch</option>
              {orders.map(o => (
                <option key={o.order_id} value={o.order_id}>
                  {o.order_ref} — {o.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text block mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery notes, driver details, etc." className="input-field" rows={2} />
          </div>

          {qty && parseFloat(qty) > 0 && (
            <button onClick={() => setShowConfirm(true)} className="btn-primary">
              Dispatch {qty} {selected.unit} of {selected.product_name}
            </button>
          )}
        </div>
      )}

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <p className="text-green-800 font-medium">{lastResult}</p>
        </div>
      )}

      {showConfirm && selected && (
        <ConfirmModal
          title="Confirm Dispatch"
          message={
            <div className="space-y-2">
              <p>Dispatching to {customerName || 'customer'}:</p>
              <p className="text-xl font-bold text-gray-900">
                {qty} {selected.unit} of {selected.product_name}
              </p>
              <p className="text-sm text-gray-500">
                Stock after dispatch: {formatNumber(selected.qty_on_hand - parseFloat(qty))} {selected.unit}
              </p>
            </div>
          }
          confirmLabel="Yes, Dispatch Now"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}
