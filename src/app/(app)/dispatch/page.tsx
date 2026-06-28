'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface FgSku {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

interface DispatchRecord {
  id: number;
  fg_sku_id: number;
  product_name: string;
  qty: number;
  unit: string;
  dispatched_at: string;
  note: string | null;
  status: string;
}

export default function DispatchPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [stock, setStock] = useState<FgSku[]>([]);
  const [history, setHistory] = useState<DispatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FgSku | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [stockRes, histRes] = await Promise.all([
      supabase.schema('production').from('v_fg_stock')
        .select('fg_sku_id, product_name, unit, qty_on_hand')
        .gt('qty_on_hand', 0)
        .order('product_name'),
      supabase.schema('production').from('fg_dispatches')
        .select('id, fg_sku_id, qty, dispatched_at, note, status')
        .order('dispatched_at', { ascending: false })
        .limit(20),
    ]);

    const stockData: FgSku[] = (stockRes.data || []).map((r: Record<string, unknown>) => ({
      fg_sku_id: r.fg_sku_id as number,
      product_name: r.product_name as string,
      unit: r.unit as string,
      qty_on_hand: (r.qty_on_hand as number) || 0,
    }));
    setStock(stockData);

    const histData = histRes.data || [];
    const allStock = stockData;
    const dispatchHistory: DispatchRecord[] = histData.map((r: Record<string, unknown>) => {
      const sku = allStock.find(s => s.fg_sku_id === (r.fg_sku_id as number));
      return {
        id: r.id as number,
        fg_sku_id: r.fg_sku_id as number,
        product_name: sku?.product_name || `SKU #${r.fg_sku_id}`,
        qty: r.qty as number,
        unit: sku?.unit || 'tubs',
        dispatched_at: r.dispatched_at as string,
        note: r.note as string | null,
        status: r.status as string,
      };
    });
    setHistory(dispatchHistory);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSubmit() {
    if (!selected) return;
    if (!qty || parseFloat(qty) <= 0) { toast.error('Enter the quantity to dispatch.'); return; }
    if (parseFloat(qty) > selected.qty_on_hand) {
      toast.error(`Only ${formatNumber(selected.qty_on_hand)} ${selected.unit} in stock.`);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .schema('production')
        .from('fg_dispatches')
        .insert({
          fg_sku_id: selected.fg_sku_id,
          qty: parseFloat(qty),
          dispatched_by: user?.id,
          note: note || null,
          status: 'posted',
        });

      if (error) throw new Error(error.message);

      const before = selected.qty_on_hand;
      const after = before - parseFloat(qty);
      setLastResult(`Dispatched ${qty} ${selected.unit} of ${selected.product_name}. Stock: ${formatNumber(before)} → ${formatNumber(after)} ${selected.unit}.`);
      toast.success(`Dispatch recorded! ${qty} ${selected.unit} of ${selected.product_name} sent out.`);
      setShowConfirm(false);
      setSelected(null);
      setQty('');
      setNote('');
      await loadData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('negative')) {
        toast.error(`Not enough ${selected.product_name} in stock.`);
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
        description="Record tubs sent out to a customer. Reduces finished goods stock."
      />

      {stock.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-bold text-gray-900 text-lg">No finished goods in stock</p>
          <p className="text-gray-500 mt-2">Fill some tubs first before dispatching.</p>
        </div>
      ) : (
        <div className="card space-y-4">
          <h2 className="section-title">What are you dispatching?</h2>
          <div className="space-y-2">
            {stock.map(s => (
              <button
                key={s.fg_sku_id}
                onClick={() => { setSelected(s); setQty(''); setLastResult(null); }}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all touch-manipulation ${
                  selected?.fg_sku_id === s.fg_sku_id
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
              type="number" min="1" step="1"
              max={selected.qty_on_hand}
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder={`Max ${formatNumber(selected.qty_on_hand)} ${selected.unit}`}
              className="input-field"
            />
          </div>

          <div>
            <label className="label-text block mb-2">Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Customer name, delivery details, etc." className="input-field" rows={2} />
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

      {/* Dispatch History */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          <h2 className="section-title">Recent Dispatches</h2>
        </div>
        {history.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">No dispatches recorded yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-2 text-gray-500 font-semibold">Flavour</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-semibold">Qty</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-semibold hidden sm:table-cell">Note</th>
                  <th className="text-right px-5 py-2 text-gray-500 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-orange-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{d.product_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">{formatNumber(d.qty)} {d.unit}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-[180px] truncate">{d.note || '—'}</td>
                    <td className="px-5 py-3 text-right text-gray-400 whitespace-nowrap">
                      {format(new Date(d.dispatched_at), 'd MMM')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showConfirm && selected && (
        <ConfirmModal
          title="Confirm Dispatch"
          message={
            <div className="space-y-2">
              <p>Dispatching:</p>
              <p className="text-xl font-bold text-gray-900">
                {qty} {selected.unit} of {selected.product_name}
              </p>
              <p className="text-sm text-gray-500">
                Stock after: {formatNumber(selected.qty_on_hand - parseFloat(qty))} {selected.unit}
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
