'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle, Box } from 'lucide-react';

interface FgSku {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

export default function MakeTubsPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [skus, setSkus] = useState<FgSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FgSku | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const loadSkus = useCallback(async () => {
    const { data } = await supabase
      .schema('production')
      .from('v_fg_stock')
      .select('fg_sku_id, product_name, unit, qty_on_hand')
      .order('product_name');
    setSkus((data || []).map((r: Record<string, unknown>) => ({
      fg_sku_id: r.fg_sku_id as number,
      product_name: r.product_name as string,
      unit: r.unit as string,
      qty_on_hand: (r.qty_on_hand as number) || 0,
    })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadSkus(); }, [loadSkus]);

  async function handleSubmit() {
    if (!selected || !qty || parseFloat(qty) <= 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .schema('production')
        .from('fg_units')
        .insert({
          fg_sku_id: selected.fg_sku_id,
          qty_produced: parseFloat(qty),
          produced_by: user?.id,
          status: 'posted',
          note: note || null,
        });

      if (error) throw new Error(error.message);

      const qtyNum = parseFloat(qty);
      setLastResult(`Produced ${formatNumber(qtyNum)} ${selected.unit} of ${selected.product_name}. Finished goods stock updated.`);
      toast.success(`${formatNumber(qtyNum)} ${selected.unit} of ${selected.product_name} added to stock!`);
      setShowConfirm(false);
      setSelected(null);
      setQty('');
      setNote('');
      await loadSkus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('insufficient') || msg.toLowerCase().includes('not enough')) {
        toast.error(`Not enough prep mix at the factory. Transfer mix from the kitchen first.`);
      } else {
        toast.error(parseSupabaseError(msg));
      }
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading products..." />;

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon={Box} iconColor="text-pink-500"
        title="Make Finished Tubs"
        description="Fill tubs with ice cream from factory stock. This increases your finished goods count."
      />

      <div className="card space-y-4">
        <h2 className="section-title">Pick a Flavour</h2>
        <div className="space-y-2">
          {skus.map(s => (
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
              <p className="text-sm text-gray-500 mt-0.5">Currently in stock: {formatNumber(s.qty_on_hand)} {s.unit}</p>
            </button>
          ))}
          {skus.length === 0 && (
            <p className="text-center text-gray-400 py-6">No products found.</p>
          )}
        </div>
      </div>

      {selected && (
        <div className="card space-y-4">
          <h2 className="section-title">How Many Tubs?</h2>
          <p className="text-gray-500 text-sm">
            Currently in stock: <strong>{formatNumber(selected.qty_on_hand)} {selected.unit}</strong>
          </p>

          <div>
            <label className="label-text block mb-2">Quantity to produce ({selected.unit})</label>
            <input
              type="number" min="1" step="1"
              value={qty}
              onChange={e => setQty(e.target.value)}
              placeholder={`e.g. 50`}
              className="input-field"
            />
          </div>

          <div>
            <label className="label-text block mb-2">Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes..." className="input-field" rows={2} />
          </div>

          {qty && parseFloat(qty) > 0 && (
            <button onClick={() => setShowConfirm(true)} className="btn-primary">
              Make {qty} {selected.unit} of {selected.product_name}
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
          title="Confirm Production"
          message={
            <div className="space-y-2">
              <p>Recording production of:</p>
              <p className="text-xl font-bold text-gray-900">
                {qty} {selected.unit} of {selected.product_name}
              </p>
              <p className="text-sm text-gray-500">Finished goods stock will increase by this amount.</p>
            </div>
          }
          confirmLabel="Yes, Record Production"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}
