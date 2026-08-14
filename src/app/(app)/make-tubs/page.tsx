'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
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
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [selectedSku, setSelectedSku] = useState<FgSku | null>(null);
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

  // Unique sorted flavour names
  const flavours = useMemo(() =>
    Array.from(new Set(skus.map(s => s.product_name))).sort(),
    [skus]
  );

  // SKUs for the selected flavour
  const flavourSkus = useMemo(() =>
    skus.filter(s => s.product_name === selectedFlavour),
    [skus, selectedFlavour]
  );

  function handleFlavourChange(name: string) {
    setSelectedFlavour(name);
    setSelectedSku(null);
    setQty('');
    setNote('');
    setLastResult(null);
  }

  function handleSkuSelect(s: FgSku) {
    setSelectedSku(s);
    setQty('');
    setNote('');
  }

  async function handleSubmit() {
    if (!selectedSku || !qty || parseFloat(qty) <= 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .schema('production')
        .from('fg_units')
        .insert({
          fg_sku_id: selectedSku.fg_sku_id,
          qty_produced: parseFloat(qty),
          produced_by: user?.id,
          status: 'posted',
          note: note || null,
        });

      if (error) throw new Error(error.message);

      const qtyNum = parseFloat(qty);
      setLastResult(`Produced ${formatNumber(qtyNum)} ${selectedSku.unit} of ${selectedSku.product_name}. Finished goods stock updated.`);
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

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <p className="text-green-800 font-medium">{lastResult}</p>
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
