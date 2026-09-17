'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle, Box, Info, Printer, QrCode } from 'lucide-react';
import { makeLabelCode } from '@/lib/qr';
import QRCode from 'react-qr-code';

interface FgSku {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

interface GeneratedLabel {
  labelCode: string;
  qty: number;
}

export default function MakeTubsPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [skus, setSkus] = useState<FgSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [selectedSku, setSelectedSku] = useState<FgSku | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [capacity, setCapacity] = useState<{ prep_stock_l: number; expected_tubs: number; litres_per_tub: number } | null>(null);
  const [labels, setLabels] = useState<GeneratedLabel[]>([]);
  const [labelFlavour, setLabelFlavour] = useState('');

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
    Array.from(new Set(skus.map(s => s.product_name))).sort(),
    [skus]
  );

  const flavourSkus = useMemo(() =>
    skus.filter(s => s.product_name === selectedFlavour),
    [skus, selectedFlavour]
  );

  function handleFlavourChange(name: string) {
    setSelectedFlavour(name);
    setSelectedSku(null);
    setQty('');
    setNote('');
    setLabels([]);
    setCapacity(null);
  }

  async function handleSkuSelect(s: FgSku) {
    setSelectedSku(s);
    setQty('');
    setNote('');
    setCapacity(null);
    setLabels([]);
    try {
      const res = await fetch(`/api/fg-capacity?sku_id=${s.fg_sku_id}`);
      if (res.ok) setCapacity(await res.json());
    } catch { /* ignore */ }
  }

  async function handleSubmit() {
    if (!selectedSku || !qty || parseFloat(qty) <= 0) return;
    setSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .schema('production')
        .from('fg_units')
        .insert({
          fg_sku_id: selectedSku.fg_sku_id,
          qty_produced: parseFloat(qty),
          produced_by: user?.id,
          status: 'posted',
          note: note || null,
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      const fgUnitsId = (inserted as { id: number }).id;
      const qtyNum = parseFloat(qty);
      const labelCount = Math.min(Math.round(qtyNum), 50);
      const today = new Date();
      const generatedLabels: GeneratedLabel[] = [];
      const labelRows: { fg_units_id: number; fg_sku_id: number; label_code: string; qty: number; created_by: string | undefined }[] = [];

      for (let i = 1; i <= labelCount; i++) {
        const labelCode = makeLabelCode(fgUnitsId, i, today);
        generatedLabels.push({ labelCode, qty: 1 });
        labelRows.push({
          fg_units_id: fgUnitsId,
          fg_sku_id: selectedSku.fg_sku_id,
          label_code: labelCode,
          qty: 1,
          created_by: user?.id,
        });
      }

      // Save labels to DB (best-effort)
      await supabase.schema('production').from('fg_labels').insert(labelRows);

      setLabels(generatedLabels);
      setLabelFlavour(`${selectedSku.product_name} (${selectedSku.unit})`);
      toast.success(`${formatNumber(qtyNum)} ${selectedSku.unit} of ${selectedSku.product_name} added to stock!`);
      setShowConfirm(false);
      setSelectedFlavour('');
      setSelectedSku(null);
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

  const qtyNum = parseFloat(qty) || 0;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={Box} iconColor="text-pink-500"
        title="Make Finished Tubs"
        description="Fill tubs with ice cream from factory stock. This increases your finished goods count."
      />

      {/* QR Labels panel */}
      {labels.length > 0 && (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-green-50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-green-600" />
              <p className="font-bold text-green-800">{labels.length} label{labels.length !== 1 ? 's' : ''} for {labelFlavour}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Printer size={14} /> Print All
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3" id="label-grid">
            {labels.map(l => (
              <div key={l.labelCode} className="border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2">
                <QRCode value={l.labelCode} size={96} />
                <p className="text-xs font-mono font-bold text-gray-700 text-center leading-tight">{l.labelCode}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <button onClick={() => setLabels([])} className="text-xs text-gray-400 hover:text-gray-600 underline">Dismiss labels</button>
          </div>
        </div>
      )}

      <div className="card space-y-5">
        {/* Step 1: Flavour dropdown */}
        <div>
          <label className="label-text block mb-1">Flavour</label>
          <select
            value={selectedFlavour}
            onChange={e => handleFlavourChange(e.target.value)}
            className="input-field"
          >
            <option value="">— Select a flavour —</option>
            {flavours.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Step 2: Size variant chips */}
        {selectedFlavour && flavourSkus.length > 0 && (
          <div>
            <label className="label-text block mb-2">Size / Format</label>
            <div className="flex flex-wrap gap-2">
              {flavourSkus.map(s => (
                <button
                  key={s.fg_sku_id}
                  onClick={() => handleSkuSelect(s)}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all touch-manipulation ${
                    selectedSku?.fg_sku_id === s.fg_sku_id
                      ? 'border-brand-500 bg-orange-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <span>{s.unit}</span>
                  <span className="block text-xs font-normal text-gray-400 mt-0.5">
                    In stock: {formatNumber(s.qty_on_hand)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prep stock capacity */}
        {selectedSku && capacity && (
          <div className={`rounded-xl px-4 py-3 flex items-start gap-3 text-sm ${
            capacity.expected_tubs === 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <Info size={16} className={`shrink-0 mt-0.5 ${capacity.expected_tubs === 0 ? 'text-red-500' : 'text-blue-500'}`} />
            <div>
              <p className={`font-semibold ${capacity.expected_tubs === 0 ? 'text-red-800' : 'text-blue-800'}`}>
                {capacity.expected_tubs === 0
                  ? 'No prep mix available in factory'
                  : `~${capacity.expected_tubs} tubs possible from prep stock`}
              </p>
              <p className={`text-xs mt-0.5 ${capacity.expected_tubs === 0 ? 'text-red-600' : 'text-blue-600'}`}>
                {capacity.prep_stock_l.toFixed(1)}L prep available · {capacity.litres_per_tub.toFixed(3)}L per tub
                {capacity.expected_tubs === 0 ? ' — request a transfer from the kitchen.' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Qty + note + submit */}
        {selectedSku && (
          <>
            <div>
              <label className="label-text block mb-1">Quantity to produce ({selectedSku.unit})</label>
              <input
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={e => setQty(e.target.value)}
                onWheel={e => e.currentTarget.blur()}
                placeholder="e.g. 50"
                className="input-field"
                autoFocus
              />
              {qtyNum > 50 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <QrCode size={11} /> Labels generated for first 50 tubs only.
                </p>
              )}
            </div>

            <div>
              <label className="label-text block mb-1">Note (optional)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any notes..."
                className="input-field"
                rows={2}
              />
            </div>

            {qtyNum > 0 && (
              <button onClick={() => setShowConfirm(true)} className="btn-primary w-full">
                Make {qty} {selectedSku.unit} of {selectedSku.product_name}
              </button>
            )}
          </>
        )}
      </div>

      {showConfirm && selectedSku && (
        <ConfirmModal
          title="Confirm Production"
          message={
            <div className="space-y-2">
              <p>Recording production of:</p>
              <p className="text-xl font-bold text-gray-900">
                {qty} {selectedSku.unit} of {selectedSku.product_name}
              </p>
              <p className="text-sm text-gray-500">QR labels will be generated for each tub.</p>
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
