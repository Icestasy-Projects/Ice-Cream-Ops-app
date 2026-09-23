'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { Box, Info, AlertTriangle, FlaskConical, Sparkles } from 'lucide-react';

interface FgSku {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

interface Capacity {
  prep_product_id: number;
  batch_yield_l: number;
  factory_batches: number;
  prep_stock_l: number;
  litres_per_tub: number;
  expected_tubs: number;
}

export default function MakeTubsPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [skus, setSkus] = useState<FgSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [selectedSku, setSelectedSku] = useState<FgSku | null>(null);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [fromPrepL, setFromPrepL] = useState('');
  const [extraL, setExtraL] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const flavours = useMemo(() =>
    Array.from(new Set(skus.map(s => s.product_name))).sort(), [skus]);

  function reset() {
    setSelectedFlavour('');
    setSelectedSku(null);
    setCapacity(null);
    setFromPrepL('');
    setExtraL('');
    setNote('');
  }

  async function handleFlavourChange(name: string) {
    setSelectedFlavour(name);
    setSelectedSku(null);
    setCapacity(null);
    setFromPrepL('');
    setExtraL('');
    setNote('');
    if (!name) return;
    // Auto-select the first SKU for this flavour
    const match = skus.find(s => s.product_name === name);
    if (match) await handleSkuSelect(match);
  }

  async function handleSkuSelect(s: FgSku) {
    setSelectedSku(s);
    setCapacity(null);
    setFromPrepL('');
    setExtraL('');
    setNote('');
    try {
      const res = await fetch(`/api/fg-capacity?sku_id=${s.fg_sku_id}`);
      if (res.ok) setCapacity(await res.json());
    } catch { /* ignore */ }
  }

  // Derived calculations shown in UI
  const fromPrepNum = parseFloat(fromPrepL) || 0;
  const extraNum = parseFloat(extraL) || 0;
  const totalL = fromPrepNum + extraNum;

  const batchYield = capacity?.batch_yield_l || 0;
  const batchesNeeded = batchYield > 0 ? Math.round(fromPrepNum / batchYield) : 0;
  const notEnoughPrep = capacity != null && batchesNeeded > (capacity.factory_batches || 0);

  const canSubmit = totalL > 0 && !notEnoughPrep && (fromPrepNum === 0 || batchesNeeded >= 1);

  async function handleSubmit() {
    if (!selectedSku || !capacity || !canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/make-fg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fg_sku_id:        selectedSku.fg_sku_id,
          prep_product_id:  capacity.prep_product_id,
          from_prep_l:      fromPrepNum,
          extra_l:          extraNum,
          note:             note || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');

      const result = json as { batches_consumed: number; total_fg_l: number };
      toast.success(
        `${formatNumber(result.total_fg_l)}L of ${selectedSku.product_name} added to stock` +
        (result.batches_consumed ? ` · ${result.batches_consumed} prep batch${result.batches_consumed !== 1 ? 'es' : ''} consumed` : '')
      );
      setShowConfirm(false);
      reset();
      await loadSkus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('insufficient')) {
        toast.error('Not enough prep mix at factory. Transfer mix from kitchen first.');
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
    <div className="space-y-4">
      <ScreenHeader
        icon={Box} iconColor="text-pink-500"
        title="Make Finished Goods"
        description="Record ice cream production. Prep stock is deducted automatically."
      />

      <div className="card space-y-5">

        {/* Step 1: Flavour */}
        <div>
          <label className="label-text block mb-1">Flavour</label>
          <select value={selectedFlavour} onChange={e => handleFlavourChange(e.target.value)} className="input-field">
            <option value="">— Select a flavour —</option>
            {flavours.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Prep stock info banner */}
        {selectedSku && capacity && (
          <div className={`rounded-xl px-4 py-3 flex items-start gap-3 text-sm ${
            capacity.factory_batches === 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <Info size={16} className={`shrink-0 mt-0.5 ${capacity.factory_batches === 0 ? 'text-red-500' : 'text-blue-500'}`} />
            <div>
              <p className={`font-semibold ${capacity.factory_batches === 0 ? 'text-red-800' : 'text-blue-800'}`}>
                {capacity.factory_batches === 0
                  ? 'No prep mix at factory — transfer from kitchen first'
                  : `${capacity.factory_batches} prep batch${capacity.factory_batches !== 1 ? 'es' : ''} at factory`}
              </p>
              <p className={`text-xs mt-0.5 ${capacity.factory_batches === 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {capacity.batch_yield_l}L per batch · {formatNumber(capacity.prep_stock_l)}L total available
                {capacity.factory_batches > 0 ? ` · ~${capacity.expected_tubs} tubs possible` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Quantities */}
        {selectedSku && capacity && (
          <>
            {/* FROM PREP */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical size={16} className="text-blue-600 shrink-0" />
                <p className="text-sm font-bold text-blue-800">Created from prep batches</p>
              </div>
              <p className="text-xs text-blue-600">
                Prep will be deducted automatically. Enter the litres produced from your prep stock.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" step="0.5"
                  value={fromPrepL}
                  onChange={e => setFromPrepL(e.target.value)}
                  onWheel={e => e.currentTarget.blur()}
                  placeholder={`e.g. ${capacity.batch_yield_l}`}
                  className="input-field flex-1"
                />
                <span className="text-sm font-semibold text-blue-700 shrink-0">L</span>
              </div>
              {fromPrepNum > 0 && batchYield > 0 && (
                <div className={`rounded-xl px-3 py-2 text-sm flex items-center gap-2 ${
                  notEnoughPrep
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-white text-blue-700 border border-blue-200'
                }`}>
                  {notEnoughPrep
                    ? <AlertTriangle size={14} className="shrink-0" />
                    : <FlaskConical size={14} className="shrink-0" />}
                  <span>
                    {notEnoughPrep
                      ? `Only ${capacity.factory_batches} batch${capacity.factory_batches !== 1 ? 'es' : ''} available, need ${batchesNeeded}`
                      : `= ${batchesNeeded} prep batch${batchesNeeded !== 1 ? 'es' : ''} (${batchYield}L × ${batchesNeeded}) will be deducted`}
                  </span>
                </div>
              )}
            </div>

            {/* EXTRA */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600 shrink-0" />
                <p className="text-sm font-bold text-amber-800">Extra created <span className="font-normal">(optional)</span></p>
              </div>
              <p className="text-xs text-amber-600">
                Surplus litres beyond full prep batches. Added to FG stock only — no prep deducted.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" step="0.5"
                  value={extraL}
                  onChange={e => setExtraL(e.target.value)}
                  onWheel={e => e.currentTarget.blur()}
                  placeholder="e.g. 6"
                  className="input-field flex-1"
                />
                <span className="text-sm font-semibold text-amber-700 shrink-0">L</span>
              </div>
              {extraNum > 0 && (
                <div className="rounded-xl px-3 py-2 text-sm flex items-center gap-2 bg-white text-amber-700 border border-amber-200">
                  <Sparkles size={14} className="shrink-0" />
                  <span>+{extraNum}L added to FG, no prep deducted</span>
                </div>
              )}
            </div>

            {/* Total summary */}
            {totalL > 0 && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-gray-600">Total FG to record</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(totalL)} L</p>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="label-text block mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any notes..."
                className="input-field"
                rows={2}
              />
            </div>

            {canSubmit && (
              <button onClick={() => setShowConfirm(true)} className="btn-primary w-full">
                Record {formatNumber(totalL)}L of {selectedSku.product_name}
              </button>
            )}
          </>
        )}
      </div>

      {showConfirm && selectedSku && capacity && (
        <ConfirmModal
          title="Confirm Production"
          message={
            <div className="space-y-3">
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(totalL)}L of {selectedSku.product_name}
              </p>
              {fromPrepNum > 0 && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
                  <span className="font-semibold">{formatNumber(fromPrepNum)}L from prep</span>
                  {' — '}{batchesNeeded} prep batch{batchesNeeded !== 1 ? 'es' : ''} will be deducted
                </div>
              )}
              {extraNum > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  <span className="font-semibold">{formatNumber(extraNum)}L extra</span>
                  {' — '}added to FG only, no prep deducted
                </div>
              )}
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
