'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Package } from 'lucide-react';

interface FgSku {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

type PackType = '12sq' | 'sample';

const PACK_CONFIG: Record<PackType, { label: string; ml: number; unit: string; emoji: string }> = {
  '12sq': { label: '12 Squares (150ml each)', ml: 1800, unit: 'pack', emoji: '🟫' },
  'sample': { label: 'Sample (50ml)', ml: 50, unit: 'unit', emoji: '🧁' },
};

export default function BreakBulkPage() {
  const supabase = createClient();
  const [skus, setSkus] = useState<FgSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FgSku | null>(null);
  const [packType, setPackType] = useState<PackType>('12sq');
  const [tubsToBreak, setTubsToBreak] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const loadSkus = useCallback(async () => {
    const { data } = await supabase.schema('production').from('v_fg_stock')
      .select('fg_sku_id, product_name, unit, qty_on_hand')
      .gt('qty_on_hand', 0)
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

  function selectSku(s: FgSku) {
    setSelected(prev => prev?.fg_sku_id === s.fg_sku_id ? null : s);
    setTubsToBreak('');
    setLastResult(null);
  }

  const tubsNum = parseFloat(tubsToBreak) || 0;
  const pack = PACK_CONFIG[packType];
  const outputQty = tubsNum > 0 ? Math.floor((tubsNum * 4000) / pack.ml) : 0;

  async function handleSubmit() {
    if (!selected) { toast.error('Select a bulk SKU to break.'); return; }
    if (tubsNum <= 0) { toast.error('Enter number of tubs to break.'); return; }
    if (tubsNum > selected.qty_on_hand) {
      toast.error(`Only ${formatNumber(selected.qty_on_hand)} ${selected.unit} in stock.`);
      return;
    }
    if (outputQty === 0) { toast.error('Too few tubs for even 1 output pack.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/break-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_fg_sku_id: selected.fg_sku_id,
          source_product_name: selected.product_name,
          tubs_to_break: tubsNum,
          pack_type: packType,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed');

      const msg = `${tubsNum} × ${selected.unit} broken into ${body.output_qty} × ${pack.label}`;
      setLastResult(msg);
      toast.success('Stock updated!');
      setSelected(null);
      setTubsToBreak('');
      await loadSkus();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading bulk stock..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="📦"
        title="Break Bulk"
        description="Open 4L bulk tubs to produce 12-square packs or 50ml samples. Deducts from bulk FG stock and adds to smaller SKU stock."
      />

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 font-medium">
          ✓ {lastResult}
        </div>
      )}

      {/* Pack type selector */}
      <div className="card space-y-3">
        <h2 className="section-title">Output Pack Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(PACK_CONFIG) as [PackType, typeof PACK_CONFIG[PackType]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setPackType(key); setLastResult(null); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all touch-manipulation ${
                packType === key
                  ? 'border-brand-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-200'
              }`}
            >
              <span className="text-2xl">{cfg.emoji}</span>
              <p className={`font-semibold text-sm text-center ${packType === key ? 'text-brand-600' : 'text-gray-700'}`}>
                {cfg.label}
              </p>
              <p className="text-xs text-gray-400">{cfg.ml}ml per {cfg.unit}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Select source SKU */}
      <div className="card space-y-3">
        <h2 className="section-title">Select Bulk SKU to Break</h2>
        {skus.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No bulk stock available. Make tubs first.</p>
        ) : (
          <div className="space-y-2">
            {skus.map(s => (
              <button
                key={s.fg_sku_id}
                onClick={() => selectSku(s)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all touch-manipulation text-left ${
                  selected?.fg_sku_id === s.fg_sku_id
                    ? 'border-brand-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Package size={16} className="text-brand-600" />
                  </div>
                  <p className={`font-semibold text-sm ${selected?.fg_sku_id === s.fg_sku_id ? 'text-brand-700' : 'text-gray-900'}`}>
                    {s.product_name}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {formatNumber(s.qty_on_hand)} {s.unit}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quantity + preview */}
      {selected && (
        <div className="card space-y-4">
          <h2 className="section-title">How Many Tubs to Break?</h2>
          <div>
            <label className="label-text block mb-1">
              Number of {selected.unit} to open (max {formatNumber(selected.qty_on_hand)})
            </label>
            <input
              type="number" min="0.5" step="0.5"
              max={selected.qty_on_hand}
              value={tubsToBreak}
              onChange={e => { setTubsToBreak(e.target.value); setLastResult(null); }}
              placeholder="e.g. 2"
              className="input-field"
            />
          </div>

          {tubsNum > 0 && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl px-5 py-4 space-y-1">
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">Preview</p>
              <p className="text-sm text-gray-700">
                <strong>{formatNumber(tubsNum)}</strong> × {selected.unit} ({formatNumber(tubsNum * 4)}L total)
              </p>
              <p className="text-sm text-gray-700">
                ÷ {pack.ml}ml per {pack.unit} = <strong className="text-brand-700">{outputQty} × {pack.label}</strong>
              </p>
              {(tubsNum * 4000) % pack.ml !== 0 && (
                <p className="text-xs text-amber-600">
                  {formatNumber(((tubsNum * 4000) % pack.ml) / 1000)}L remainder (waste)
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || tubsNum <= 0 || outputQty === 0}
            className="btn-primary"
          >
            {submitting ? 'Processing...' : `✓ Break ${tubsNum || ''} Tub${tubsNum !== 1 ? 's' : ''} → ${outputQty} ${pack.label}`}
          </button>
        </div>
      )}
    </div>
  );
}
