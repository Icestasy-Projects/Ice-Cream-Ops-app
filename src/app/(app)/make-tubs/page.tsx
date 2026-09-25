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

  const PRODUCTION_FORMATS = ['4L Bulk', '12 Square'];

  const flavours = useMemo(() =>
    Array.from(new Set(skus.map(s => s.product_name))).sort(), [skus]);

  const flavourSkus = useMemo(() =>
    skus.filter(s => s.product_name === selectedFlavour && PRODUCTION_FORMATS.includes(s.unit)),
    [skus, selectedFlavour] // eslint-disable-line react-hooks/exhaustive-deps
  );

  function reset() {
    setSelectedFlavour('');
    setSelectedSku(null);
    setCapacity(null);
    setFromPrepL('');
    setExtraL('');
    setNote('');
  }

  function handleFlavourChange(name: string) {
    setSelectedFlavour(name);
    setSelectedSku(null);
    setCapacity(null);
    setFromPrepL('');
    setExtraL('');
    setNote('');
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

  // Unit label for the selected SKU
  const unitLabel = selectedSku?.unit === '4L Bulk' ? 'Bulk' : selectedSku?.unit === '12 Square' ? 'Square pack' : 'unit';

  // Litres per individual SKU unit (from capacity API)
  const litresPerUnit = capacity?.litres_per_tub || 0;

  // Inputs are in UNIT COUNT (bulks / square packs), not litres
  const fromPrepUnits = parseFloat(fromPrepL) || 0;
  const extraUnits    = parseFloat(extraL)    || 0;
  const totalUnits    = fromPrepUnits + extraUnits;

  // Convert to litres for the API call
  const fromPrepLitres = fromPrepUnits * litresPerUnit;
  const extraLitres    = extraUnits    * litresPerUnit;
  const totalLitres    = fromPrepLitres + extraLitres;

  const batchYield = capacity?.batch_yield_l || 0;
  const batchesNeeded = batchYield > 0 ? Math.round(fromPrepLitres / batchYield) : 0;
  const notEnoughPrep = capacity != null && batchesNeeded > (capacity.factory_batches || 0);

  const canSubmit = totalUnits > 0 && !notEnoughPrep && (fromPrepUnits === 0 || batchesNeeded >= 1);

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
          from_prep_l:      fromPrepLitres,
          extra_l:          extraLitres,
          note:             note || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');

      const result = json as { batches_consumed: number; total_fg_l: number };
      toast.success(
        `${totalUnits} ${unitLabel}${totalUnits !== 1 ? 's' : ''} of ${selectedSku.product_name} added to stock` +
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

        {/* Step 2: Format chips — 4L Bulk or 12 Square */}
        {selectedFlavour && flavourSkus.length > 0 && (
          <div>
            <label className="label-text block mb-2">Format</label>
            <div className="flex flex-wrap gap-2">
              {flavourSkus.map(s => (
                <button
                  key={s.fg_sku_id}
                  onClick={() => handleSkuSelect(s)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all touch-manipulation ${
                    selectedSku?.fg_sku_id === s.fg_sku_id
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
                  }`}
                >
                  <span>{s.unit}</span>
                  <span className="block text-xs font-normal text-gray-400 mt-0.5">
                    In stock: {formatNumber(s.qty_on_hand)} L
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current FG stock */}
        {selectedSku && (
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-gray-500">Current FG stock — {selectedSku.unit}</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(selectedSku.qty_on_hand)} L</p>
          </div>
        )}

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
                {capacity.factory_batches > 0 ? ` · ~${capacity.expected_tubs} ${unitLabel}s possible` : ''}
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
                Prep will be deducted automatically. Enter the number of {unitLabel}s produced from your prep stock.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" step="1"
                  value={fromPrepL}
                  onChange={e => setFromPrepL(e.target.value)}
                  onWheel={e => e.currentTarget.blur()}
                  placeholder={litresPerUnit > 0 ? `e.g. ${Math.floor(batchYield / litresPerUnit)}` : '0'}
                  className="input-field flex-1"
                />
                <span className="text-sm font-semibold text-blue-700 shrink-0">{unitLabel}s</span>
              </div>
              {fromPrepUnits > 0 && batchYield > 0 && (
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
                      : `= ${batchesNeeded} prep batch${batchesNeeded !== 1 ? 'es' : ''} (${formatNumber(fromPrepLitres)}L total) will be deducted`}
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
                Surplus {unitLabel}s beyond full prep batches. Added to FG stock only — no prep deducted.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" step="1"
                  value={extraL}
                  onChange={e => setExtraL(e.target.value)}
                  onWheel={e => e.currentTarget.blur()}
                  placeholder="e.g. 1"
                  className="input-field flex-1"
                />
                <span className="text-sm font-semibold text-amber-700 shrink-0">{unitLabel}s</span>
              </div>
              {extraUnits > 0 && (
                <div className="rounded-xl px-3 py-2 text-sm flex items-center gap-2 bg-white text-amber-700 border border-amber-200">
                  <Sparkles size={14} className="shrink-0" />
                  <span>+{extraUnits} {unitLabel}{extraUnits !== 1 ? 's' : ''} ({formatNumber(extraLitres)}L) added to FG, no prep deducted</span>
                </div>
              )}
            </div>

            {/* Total summary */}
            {totalUnits > 0 && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-gray-600">Total FG to record</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalUnits} {unitLabel}{totalUnits !== 1 ? 's' : ''}
                  <span className="text-sm font-normal text-gray-500 ml-2">({formatNumber(totalLitres)}L)</span>
                </p>
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
                Record {totalUnits} {unitLabel}{totalUnits !== 1 ? 's' : ''} of {selectedSku.product_name}
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
                {totalUnits} {unitLabel}{totalUnits !== 1 ? 's' : ''} of {selectedSku.product_name}
              </p>
              {fromPrepUnits > 0 && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
                  <span className="font-semibold">{fromPrepUnits} {unitLabel}{fromPrepUnits !== 1 ? 's' : ''} from prep</span>
                  {' — '}{batchesNeeded} prep batch{batchesNeeded !== 1 ? 'es' : ''} ({formatNumber(fromPrepLitres)}L) will be deducted
                </div>
              )}
              {extraUnits > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  <span className="font-semibold">{extraUnits} {unitLabel}{extraUnits !== 1 ? 's' : ''} extra</span>
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
