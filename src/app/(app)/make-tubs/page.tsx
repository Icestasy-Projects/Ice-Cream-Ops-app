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

interface FgWithPrep {
  fg_product_id: number;
  fg_product_name: string;
  prep_product_id: number | null;
  prep_product_name: string | null;
  qty_factory: number;
  max_tubs: number | null;
  tub_unit: string;
}

export default function MakeTubsPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [products, setProducts] = useState<FgWithPrep[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FgWithPrep | null>(null);
  const [useCustomQty, setUseCustomQty] = useState(false);
  const [customQty, setCustomQty] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const loadProducts = useCallback(async () => {
    const { data: fgData } = await supabase
      .schema('production')
      .from('v_fg_stock')
      .select('fg_product_id, product_name, unit, qty_on_hand');

    const { data: planData } = await supabase
      .schema('production')
      .from('v_production_planning_dashboard')
      .select('*');

    const result: FgWithPrep[] = (fgData || []).map((fg: Record<string, unknown>) => {
      const plan = (planData || []).find((p: Record<string, unknown>) => p.fg_product_id === fg.fg_product_id);
      return {
        fg_product_id: fg.fg_product_id as number,
        fg_product_name: fg.product_name as string,
        prep_product_id: (plan?.prep_product_id as number) || null,
        prep_product_name: (plan?.prep_product_name as string) || null,
        qty_factory: (plan?.qty_factory as number) || 0,
        max_tubs: (plan?.max_tubs_possible as number) || null,
        tub_unit: (fg.unit as string) || 'tubs',
      };
    });

    setProducts(result.filter(p => p.qty_factory > 0 || p.max_tubs !== null));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function handleSubmit() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const insertData: Record<string, unknown> = {
        fg_product_id: selected.fg_product_id,
        made_by: user?.id,
        notes: notes || null,
      };
      if (useCustomQty && customQty && parseFloat(customQty) > 0) {
        insertData.qty_produced = parseFloat(customQty);
      }

      const { data, error } = await supabase
        .schema('production')
        .from('fg_batches')
        .insert(insertData)
        .select('batch_id, qty_produced')
        .single();

      if (error) throw new Error(error.message);

      const qty = (data as { batch_id: number; qty_produced: number })?.qty_produced ?? (useCustomQty ? parseFloat(customQty) : selected.max_tubs);
      setLastResult(`Made ${qty} ${selected.tub_unit} of ${selected.fg_product_name}. Finished goods stock has been updated.`);
      toast.success(`${qty} ${selected.tub_unit} of ${selected.fg_product_name} added to finished goods stock!`);
      setShowConfirm(false);
      setSelected(null);
      setNotes('');
      setUseCustomQty(false);
      setCustomQty('');
      await loadProducts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('insufficient')) {
        toast.error(`Not enough ${selected.prep_product_name || 'mix'} at the factory right now. Transfer more from the kitchen first.`);
      } else {
        toast.error(parseSupabaseError(msg));
      }
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading factory stock..." />;

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="🍦"
        title="Make Finished Tubs"
        description="Fill tubs with ice cream from factory stock. The system works out the maximum number of tubs you can make right now."
      />

      {products.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🏭</p>
          <p className="font-bold text-gray-900 text-lg">No mix at the factory right now</p>
          <p className="text-gray-500 mt-2">Transfer mix from the kitchen first, then come back here to fill tubs.</p>
        </div>
      ) : (
        <div className="card space-y-4">
          <h2 className="section-title">Pick a Flavour</h2>
          <div className="space-y-2">
            {products.map(p => (
              <button
                key={p.fg_product_id}
                onClick={() => { setSelected(p); setUseCustomQty(false); setCustomQty(''); setLastResult(null); }}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all touch-manipulation ${
                  selected?.fg_product_id === p.fg_product_id
                    ? 'border-brand-500 bg-orange-50'
                    : 'border-gray-100 bg-white hover:border-orange-200'
                }`}
              >
                <p className="font-bold text-gray-900">{p.fg_product_name}</p>
                <div className="mt-1 space-y-0.5">
                  {p.qty_factory > 0 && (
                    <p className="text-sm text-purple-600">🏭 Factory mix: {formatNumber(p.qty_factory)} L</p>
                  )}
                  {p.max_tubs !== null && (
                    <p className="text-sm text-green-600 font-semibold">✓ Can make {p.max_tubs} {p.tub_unit} right now</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="card space-y-4">
          <h2 className="section-title">How Many Tubs?</h2>

          {selected.max_tubs !== null && selected.max_tubs > 0 ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="font-bold text-green-800 text-xl">Make {selected.max_tubs} {selected.tub_unit}</p>
                <p className="text-green-600 text-sm mt-1">
                  That&apos;s the maximum whole number of tubs you can fill from the {formatNumber(selected.qty_factory)} L of {selected.prep_product_name || selected.fg_product_name} at the factory right now.
                </p>
              </div>
              <button onClick={() => setShowConfirm(true)} className="btn-primary">
                Make {selected.max_tubs} {selected.tub_unit} (Maximum Available)
              </button>
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="font-bold text-amber-800">Not enough mix to fill a full tub right now</p>
              <p className="text-amber-600 text-sm mt-1">Transfer more mix from the kitchen to the factory first.</p>
            </div>
          )}

          <details className="border border-gray-100 rounded-2xl overflow-hidden">
            <summary className="px-4 py-3 cursor-pointer text-gray-500 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
              <ChevronDown size={16} />
              Make a specific number of tubs instead (Advanced)
            </summary>
            <div className="px-4 pb-4 space-y-3 bg-gray-50">
              <p className="text-xs text-gray-500 pt-3">Only use this for special orders.</p>
              <input
                type="number"
                min="1"
                step="1"
                value={customQty}
                onChange={e => { setCustomQty(e.target.value); setUseCustomQty(true); }}
                placeholder={`Number of ${selected.tub_unit}`}
                className="input-field"
              />
              {customQty && parseInt(customQty) > 0 && (
                <button onClick={() => setShowConfirm(true)} className="btn-secondary">
                  Make {customQty} {selected.tub_unit} (Custom)
                </button>
              )}
            </div>
          </details>

          <div>
            <label className="label-text block mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this production run..." className="input-field" rows={2} />
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
          title="Confirm Production"
          message={
            <div className="space-y-2">
              <p>You&apos;re about to fill:</p>
              <p className="text-xl font-bold text-gray-900">
                {useCustomQty && customQty ? `${customQty} ${selected.tub_unit}` : `${selected.max_tubs} ${selected.tub_unit}`} of {selected.fg_product_name}
              </p>
              <p className="text-sm text-gray-500">
                Factory mix stock will decrease and finished goods stock will increase.
              </p>
            </div>
          }
          confirmLabel="Yes, Fill These Tubs"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}
