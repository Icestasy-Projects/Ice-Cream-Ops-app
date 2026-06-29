'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

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
  const [batches, setBatches] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

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

  function selectProduct(p: PrepProduct) {
    if (selected?.id === p.id) {
      setSelected(null);
    } else {
      setSelected(p);
      setBatches('');
      setNote('');
      setLastResult(null);
    }
  }

  const batchCount = parseFloat(batches) || 0;
  const totalLitres = batchCount * (selected?.batch_yield_l ?? 0);
  const bulkTubs = selected?.batch_yield_l ? Math.floor(totalLitres / 4) : 0;

  async function handleSubmit() {
    if (!selected || batchCount <= 0) return;
    setSubmitting(true);
    try {
      const qtyToInsert = batchCount * (selected.batch_yield_l ?? 1);

      const { error } = await supabase
        .schema('production')
        .from('prep_units')
        .insert({
          prep_product_id: selected.id,
          qty_produced: qtyToInsert,
          produced_by: user?.id,
          status: 'posted',
          note: note || null,
        });

      if (error) throw new Error(error.message);

      setLastResult(`Recorded ${batchCount} batch${batchCount !== 1 ? 'es' : ''} of ${selected.name} (${formatNumber(totalLitres)}L). Kitchen stock updated.`);
      toast.success(`${batchCount} batch${batchCount !== 1 ? 'es' : ''} of ${selected.name} added to kitchen stock!`);
      setShowConfirm(false);
      setSelected(null);
      setBatches('');
      setNote('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(parseSupabaseError(msg));
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading flavours..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="🧪"
        title="Make Kitchen Mix"
        description="Record a new batch of flavour mix made in the kitchen. Adds the mix to kitchen stock."
      />

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <p className="text-green-800 font-medium">{lastResult}</p>
        </div>
      )}

      <div className="card space-y-2">
        <h2 className="section-title mb-3">Pick a Flavour</h2>

        {products.map(p => (
          <div key={p.id}>
            <button
              onClick={() => selectProduct(p)}
              className={`w-full text-left px-5 py-4 transition-all touch-manipulation ${
                selected?.id === p.id
                  ? 'rounded-t-2xl border-2 border-b-0 border-brand-500 bg-orange-50'
                  : 'rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-200'
              }`}
            >
              <p className="font-bold text-gray-900">{p.name}</p>
              {p.batch_yield_l && (
                <p className="text-sm text-gray-400 mt-0.5">
                  1 batch = {p.batch_yield_l}L → {Math.floor(p.batch_yield_l / 4)} × 4L Bulk
                </p>
              )}
            </button>

            {selected?.id === p.id && (
              <div className="border-2 border-t-0 border-brand-500 bg-orange-50 rounded-b-2xl px-5 pb-5 pt-4 space-y-4">
                <div>
                  <label className="label-text block mb-1">How many batches?</label>
                  <p className="text-xs text-gray-400 mb-2">
                    1 batch = {p.batch_yield_l}L of mix = {Math.floor((p.batch_yield_l ?? 0) / 4)} × 4L Bulk tubs
                  </p>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={batches}
                    onChange={e => setBatches(e.target.value)}
                    placeholder="e.g. 3"
                    className="input-field"
                    autoFocus
                  />
                  {batchCount > 0 && (
                    <div className="mt-2 bg-white border border-orange-200 rounded-xl px-4 py-2 flex flex-wrap gap-4 text-sm">
                      <span className="text-gray-600">
                        <span className="font-bold text-gray-900">{batchCount}</span> batch{batchCount !== 1 ? 'es' : ''}
                        {' × '}{p.batch_yield_l}L = <span className="font-bold text-orange-600">{formatNumber(totalLitres)}L</span>
                      </span>
                      <span className="text-gray-500">→ <span className="font-bold text-gray-800">{bulkTubs} × 4L Bulk</span> possible</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label-text block mb-1">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Any notes about this batch..."
                    className="input-field"
                    rows={2}
                  />
                </div>

                {batchCount > 0 && (
                  <button onClick={() => setShowConfirm(true)} className="btn-primary">
                    Record {batchCount} Batch{batchCount !== 1 ? 'es' : ''} of {p.name}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showConfirm && selected && (
        <ConfirmModal
          title="Confirm Batch"
          message={
            <div className="space-y-2">
              <p>Recording kitchen batch:</p>
              <p className="text-xl font-bold text-gray-900">
                {batchCount} batch{batchCount !== 1 ? 'es' : ''} of {selected.name}
              </p>
              <p className="text-gray-600">{formatNumber(totalLitres)}L total → {bulkTubs} × 4L Bulk possible</p>
              <p className="text-sm text-gray-500">Kitchen stock will increase by {formatNumber(totalLitres)}L.</p>
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
