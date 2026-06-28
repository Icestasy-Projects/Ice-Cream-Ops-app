'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle, ChevronDown } from 'lucide-react';

interface PrepProduct {
  id: number;
  name: string;
  unit: string;
  batch_yield_l: number | null;
}

export default function MakePrepPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [products, setProducts] = useState<PrepProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrepProduct | null>(null);
  const [useCustomQty, setUseCustomQty] = useState(false);
  const [customQty, setCustomQty] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    supabase.schema('production').from('prep_products')
      .select('id, name, unit, batch_yield_l')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        setProducts((data || []).map((r: Record<string, unknown>) => ({
          id: r.id as number,
          name: r.name as string,
          unit: r.unit as string,
          batch_yield_l: r.batch_yield_l as number | null,
        })));
        setLoading(false);
      });
  }, [supabase]);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const qty = useCustomQty && customQty && parseFloat(customQty) > 0
        ? parseFloat(customQty)
        : (selected.batch_yield_l ?? 1);

      const { error } = await supabase
        .schema('production')
        .from('prep_units')
        .insert({
          prep_product_id: selected.id,
          qty_produced: qty,
          produced_by: user?.id,
          status: 'posted',
          note: note || null,
        });

      if (error) throw new Error(error.message);

      setLastResult(`Made ${formatNumber(qty)} ${selected.unit} of ${selected.name}. Kitchen stock has been updated.`);
      toast.success(`Batch recorded! ${formatNumber(qty)} ${selected.unit} of ${selected.name} added to kitchen stock.`);
      setShowConfirm(false);
      setSelected(null);
      setNote('');
      setUseCustomQty(false);
      setCustomQty('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(parseSupabaseError(msg));
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading flavours..." />;

  const effectiveQty = useCustomQty && customQty ? parseFloat(customQty) : (selected?.batch_yield_l ?? 1);

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="🧪"
        title="Make Kitchen Mix"
        description="Record a new batch of flavour mix made in the kitchen. Adds the mix to kitchen stock."
      />

      <div className="card space-y-4">
        <h2 className="section-title">Pick a Flavour</h2>
        <div className="space-y-2">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setUseCustomQty(false); setCustomQty(''); setLastResult(null); }}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all touch-manipulation ${
                selected?.id === p.id
                  ? 'border-brand-500 bg-orange-50'
                  : 'border-gray-100 bg-white hover:border-orange-200'
              }`}
            >
              <p className="font-bold text-gray-900">{p.name}</p>
              {p.batch_yield_l && (
                <p className="text-sm text-gray-400 mt-0.5">Standard batch: {p.batch_yield_l} {p.unit}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="card space-y-4">
          <h2 className="section-title">Batch Size</h2>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="font-bold text-green-800 text-lg">
              Standard batch: {selected.batch_yield_l} {selected.unit}
            </p>
            <p className="text-green-600 text-sm mt-1">This is the normal yield — tap the button below to confirm.</p>
          </div>

          <button onClick={() => setShowConfirm(true)} className="btn-primary">
            Make Standard Batch ({selected.batch_yield_l} {selected.unit})
          </button>

          <details className="border border-gray-100 rounded-2xl overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer text-gray-500 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <ChevronDown size={16} />
              Different amount? (Advanced)
            </summary>
            <div className="px-4 pb-4 space-y-3 bg-gray-50">
              <p className="text-xs text-gray-500 pt-3">Only for special circumstances.</p>
              <input
                type="number" min="0.1" step="0.1"
                value={customQty}
                onChange={e => { setCustomQty(e.target.value); setUseCustomQty(true); }}
                placeholder={`Custom quantity in ${selected.unit}`}
                className="input-field"
              />
              {customQty && parseFloat(customQty) > 0 && (
                <button onClick={() => setShowConfirm(true)} className="btn-secondary">
                  Make {customQty} {selected.unit} (Custom)
                </button>
              )}
            </div>
          </details>

          <div>
            <label className="label-text block mb-2">Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes about this batch..." className="input-field" rows={2} />
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
          title="Confirm Batch"
          message={
            <div className="space-y-2">
              <p>Recording kitchen batch:</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(effectiveQty)} {selected.unit} of {selected.name}
              </p>
              <p className="text-sm text-gray-500">Kitchen stock will increase by this amount.</p>
            </div>
          }
          confirmLabel="Yes, Record This Batch"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}
