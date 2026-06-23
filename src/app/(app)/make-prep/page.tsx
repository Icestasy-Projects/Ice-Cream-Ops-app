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

interface PrepProduct {
  prep_product_id: number;
  product_name: string;
  unit: string;
  default_batch_size: number | null;
}

interface BomLine {
  ingredient_name: string;
  unit: string;
  qty_required: number;
  qty_on_hand: number;
  sufficient: boolean;
}

export default function MakePrepPage() {
  const supabase = createClient();
  const { user } = useUser();

  const [products, setProducts] = useState<PrepProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PrepProduct | null>(null);
  const [useCustomQty, setUseCustomQty] = useState(false);
  const [customQty, setCustomQty] = useState('');
  const [bom, setBom] = useState<BomLine[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supabase.schema('production').from('prep_products')
      .select('prep_product_id, product_name, unit, default_batch_size')
      .order('product_name')
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, [supabase]);

  const fetchBom = useCallback(async (product: PrepProduct, qty?: number) => {
    setBomLoading(true);
    setBom([]);
    try {
      const { data, error } = await supabase
        .schema('production')
        .from('v_prep_bom')
        .select('*')
        .eq('prep_product_id', product.prep_product_id);

      if (data && !error) {
        const effectiveQty = qty || product.default_batch_size || 1;
        setBom(data.map((row: Record<string, unknown>) => ({
          ingredient_name: row.ingredient_name as string,
          unit: row.unit as string,
          qty_required: (row.qty_per_batch as number) * (effectiveQty / (product.default_batch_size || effectiveQty)),
          qty_on_hand: (row.qty_on_hand as number) || 0,
          sufficient: ((row.qty_on_hand as number) || 0) >= (row.qty_per_batch as number) * (effectiveQty / (product.default_batch_size || effectiveQty)),
        })));
      }
    } catch {
      // BOM view may not exist yet — silently skip
    }
    setBomLoading(false);
  }, [supabase]);

  async function handleProductSelect(product: PrepProduct) {
    setSelectedProduct(product);
    setUseCustomQty(false);
    setCustomQty('');
    setLastResult(null);
    await fetchBom(product);
  }

  async function handleSubmit() {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      const insertData: Record<string, unknown> = {
        prep_product_id: selectedProduct.prep_product_id,
        made_by: user?.id,
        notes: notes || null,
      };
      if (useCustomQty && customQty && parseFloat(customQty) > 0) {
        insertData.qty_produced = parseFloat(customQty);
      }

      const { data, error } = await supabase
        .schema('production')
        .from('prep_batches')
        .insert(insertData)
        .select('batch_id, qty_produced')
        .single();

      if (error) throw new Error(error.message);

      const qty = (data as { batch_id: number; qty_produced: number })?.qty_produced;
      const unit = selectedProduct.unit;
      setLastResult(`Made ${formatNumber(qty)} ${unit} of ${selectedProduct.product_name}. Kitchen stock has been updated.`);
      toast.success(`Batch recorded! ${formatNumber(qty)} ${unit} of ${selectedProduct.product_name} added to kitchen stock.`);
      setShowConfirm(false);
      setSelectedProduct(null);
      setNotes('');
      setUseCustomQty(false);
      setCustomQty('');
      setBom([]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(parseSupabaseError(msg));
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading flavours..." />;

  const hasInsufficientStock = bom.some(b => !b.sufficient);

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="🧪"
        title="Make Kitchen Mix"
        description="Record a new batch of flavour mix made in the kitchen. This uses raw ingredients and adds the mix to kitchen stock."
      />

      <div className="card space-y-4">
        <h2 className="section-title">Pick a Flavour</h2>
        <div className="space-y-2">
          {products.map(p => (
            <button
              key={p.prep_product_id}
              onClick={() => handleProductSelect(p)}
              className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all touch-manipulation ${
                selectedProduct?.prep_product_id === p.prep_product_id
                  ? 'border-brand-500 bg-orange-50'
                  : 'border-gray-100 bg-white hover:border-orange-200'
              }`}
            >
              <p className="font-bold text-gray-900">{p.product_name}</p>
              {p.default_batch_size && (
                <p className="text-sm text-gray-400 mt-0.5">Standard batch: {p.default_batch_size} {p.unit}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedProduct && (
        <>
          {(bom.length > 0 || bomLoading) && (
            <div className="card space-y-3">
              <h2 className="section-title">Ingredients This Will Use</h2>
              <p className="text-gray-500 text-sm">Check that you have enough before confirming.</p>
              {bomLoading ? <LoadingSpinner text="Checking ingredients..." /> : (
                <>
                  {hasInsufficientStock && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-sm font-medium">
                      ⚠️ Some ingredients are running low — you may not have enough to complete this batch.
                    </div>
                  )}
                  <div className="space-y-2">
                    {bom.map((b, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${b.sufficient ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{b.ingredient_name}</p>
                          <p className={`text-xs mt-0.5 ${b.sufficient ? 'text-green-700' : 'text-red-700'}`}>
                            {b.sufficient ? `✓ You have ${formatNumber(b.qty_on_hand)} ${b.unit}` : `✗ Only ${formatNumber(b.qty_on_hand)} ${b.unit} available`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 text-sm">{formatNumber(b.qty_required)} {b.unit}</p>
                          <p className="text-xs text-gray-400">needed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="card space-y-4">
            <h2 className="section-title">Batch Size</h2>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="font-bold text-green-800 text-lg">
                Standard batch: {selectedProduct.default_batch_size} {selectedProduct.unit}
              </p>
              <p className="text-green-600 text-sm mt-1">This is the normal amount — tap &quot;Make Standard Batch&quot; to proceed.</p>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={hasInsufficientStock}
              className="btn-primary"
            >
              Make Standard Batch ({selectedProduct.default_batch_size} {selectedProduct.unit})
            </button>

            {hasInsufficientStock && (
              <p className="text-center text-red-600 text-sm">Not enough ingredients in stock. Check the Raw Materials dashboard.</p>
            )}

            <details className="border border-gray-100 rounded-2xl overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer text-gray-500 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                <ChevronDown size={16} />
                Need a different amount? (Advanced)
              </summary>
              <div className="px-4 pb-4 space-y-3 bg-gray-50">
                <p className="text-xs text-gray-500 pt-3">Only use this for special circumstances. The standard batch is usually correct.</p>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={customQty}
                  onChange={e => { setCustomQty(e.target.value); setUseCustomQty(true); }}
                  placeholder={`Custom quantity in ${selectedProduct.unit}`}
                  className="input-field"
                />
                {customQty && parseFloat(customQty) > 0 && (
                  <button onClick={() => setShowConfirm(true)} className="btn-secondary">
                    Make {customQty} {selectedProduct.unit} (Custom)
                  </button>
                )}
              </div>
            </details>

            <div>
              <label className="label-text block mb-2">Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this batch..." className="input-field" rows={2} />
            </div>
          </div>
        </>
      )}

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <p className="text-green-800 font-medium">{lastResult}</p>
        </div>
      )}

      {showConfirm && selectedProduct && (
        <ConfirmModal
          title="Confirm Batch"
          message={
            <div className="space-y-2">
              <p>You&apos;re about to record making:</p>
              <p className="text-xl font-bold text-gray-900">
                {useCustomQty && customQty ? `${customQty} ${selectedProduct.unit}` : `${selectedProduct.default_batch_size} ${selectedProduct.unit}`} of {selectedProduct.product_name}
              </p>
              <p className="text-sm text-gray-500">This will reduce ingredient stock in the kitchen and add mix to kitchen stock.</p>
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
