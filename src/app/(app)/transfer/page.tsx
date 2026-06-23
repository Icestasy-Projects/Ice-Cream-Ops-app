'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle, ChevronDown } from 'lucide-react';

interface PrepStock {
  prep_product_id: number;
  product_name: string;
  unit: string;
  qty_kitchen: number;
  qty_factory: number;
}

export default function TransferPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [stock, setStock] = useState<PrepStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrepStock | null>(null);
  const [useCustomQty, setUseCustomQty] = useState(false);
  const [customQty, setCustomQty] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const loadStock = useCallback(async () => {
    const { data } = await supabase
      .schema('production')
      .from('v_prep_stock')
      .select('prep_product_id, product_name, unit, qty_kitchen, qty_factory')
      .gt('qty_kitchen', 0)
      .order('product_name');
    setStock(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadStock(); }, [loadStock]);

  const effectiveQty = useCustomQty && customQty ? parseFloat(customQty) : selected?.qty_kitchen;

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const insertData: Record<string, unknown> = {
        prep_product_id: selected.prep_product_id,
        transferred_by: user?.id,
        notes: notes || null,
      };
      if (useCustomQty && customQty && parseFloat(customQty) > 0) {
        insertData.qty = parseFloat(customQty);
      }

      const { data, error } = await supabase
        .schema('production')
        .from('prep_transfers')
        .insert(insertData)
        .select('transfer_id, qty')
        .single();

      if (error) throw new Error(error.message);

      const qty = (data as { transfer_id: number; qty: number })?.qty ?? effectiveQty ?? 0;
      setLastResult(`Transferred ${formatNumber(qty)} ${selected.unit} of ${selected.product_name} from kitchen to factory. Factory stock has been updated.`);
      toast.success(`Transferred ${formatNumber(qty)} ${selected.unit} of ${selected.product_name} to the factory!`);
      setShowConfirm(false);
      setSelected(null);
      setNotes('');
      setUseCustomQty(false);
      setCustomQty('');
      await loadStock();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('insufficient')) {
        toast.error(`Not enough ${selected.product_name} in the kitchen right now (you have ${formatNumber(selected.qty_kitchen)} ${selected.unit}). Make a new batch first.`);
      } else {
        toast.error(parseSupabaseError(msg));
      }
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading kitchen stock..." />;

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="➡️"
        title="Transfer to Factory"
        description="Move flavour mix from the kitchen to the factory floor so tubs can be filled. Normally you transfer everything at once."
      />

      {stock.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🧪</p>
          <p className="font-bold text-gray-900 text-lg">No mix in the kitchen right now</p>
          <p className="text-gray-500 mt-2">Make a new kitchen batch first, then come back here to transfer it.</p>
        </div>
      ) : (
        <div className="card space-y-4">
          <h2 className="section-title">Which flavour to transfer?</h2>
          <div className="space-y-2">
            {stock.map(s => (
              <button
                key={s.prep_product_id}
                onClick={() => { setSelected(s); setUseCustomQty(false); setCustomQty(''); setLastResult(null); }}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all touch-manipulation ${
                  selected?.prep_product_id === s.prep_product_id
                    ? 'border-brand-500 bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-orange-200'
                }`}
              >
                <p className="font-bold text-gray-900">{s.product_name}</p>
                <div className="flex gap-4 mt-1">
                  <p className="text-sm text-blue-600">🧪 Kitchen: {formatNumber(s.qty_kitchen)} {s.unit}</p>
                  <p className="text-sm text-green-600">🏭 Factory: {formatNumber(s.qty_factory)} {s.unit}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="card space-y-4">
          <h2 className="section-title">Transfer Amount</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="font-bold text-blue-800 text-lg">
              Transfer all {formatNumber(selected.qty_kitchen)} {selected.unit}
            </p>
            <p className="text-blue-600 text-sm mt-1">This moves everything currently in the kitchen to the factory — the usual action.</p>
          </div>

          <button onClick={() => setShowConfirm(true)} className="btn-primary">
            Transfer All {formatNumber(selected.qty_kitchen)} {selected.unit} to Factory
          </button>

          <details className="border border-gray-100 rounded-2xl overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer text-gray-500 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <ChevronDown size={16} />
              Transfer a specific amount instead (Advanced)
            </summary>
            <div className="px-4 pb-4 space-y-3 bg-gray-50">
              <p className="text-xs text-gray-500 pt-3">Available in kitchen: {formatNumber(selected.qty_kitchen)} {selected.unit}</p>
              <input
                type="number"
                min="0.1"
                max={selected.qty_kitchen}
                step="0.1"
                value={customQty}
                onChange={e => { setCustomQty(e.target.value); setUseCustomQty(true); }}
                placeholder={`Amount in ${selected.unit}`}
                className="input-field"
              />
              {customQty && parseFloat(customQty) > 0 && (
                <button onClick={() => setShowConfirm(true)} className="btn-secondary">
                  Transfer {customQty} {selected.unit}
                </button>
              )}
            </div>
          </details>

          <div>
            <label className="label-text block mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." className="input-field" rows={2} />
          </div>
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
          title="Confirm Transfer"
          message={
            <div className="space-y-2">
              <p>Moving from <strong>Kitchen → Factory</strong>:</p>
              <p className="text-xl font-bold text-gray-900">
                {useCustomQty && customQty ? `${customQty} ${selected.unit}` : `${formatNumber(selected.qty_kitchen)} ${selected.unit}`} of {selected.product_name}
              </p>
              <p className="text-sm text-gray-500">Kitchen stock will decrease. Factory stock will increase.</p>
            </div>
          }
          confirmLabel="Yes, Transfer Now"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}
