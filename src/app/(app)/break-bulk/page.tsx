'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Package, PackageOpen, Search, CheckCircle } from 'lucide-react';

interface FgSku {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

type PackType = '12sq' | 'sample';

const PACK_CONFIG: Record<PackType, { label: string; ml: number; unit: string }> = {
  '12sq':   { label: '12 Squares (150ml each)', ml: 1800, unit: 'pack' },
  'sample': { label: 'Sample (50ml)',            ml: 50,   unit: 'unit' },
};

function calcOutput(tubs: number, packMl: number) {
  return tubs > 0 ? Math.floor((tubs * 4000) / packMl) : 0;
}

export default function BreakBulkPage() {
  const supabase = createClient();
  const [skus, setSkus] = useState<FgSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    const all = (data || []).map((r: Record<string, unknown>) => ({
      fg_sku_id: r.fg_sku_id as number,
      product_name: r.product_name as string,
      unit: r.unit as string,
      qty_on_hand: (r.qty_on_hand as number) || 0,
    }));
    setSkus(all.filter(s =>
      s.unit.toLowerCase().includes('bulk') || s.product_name.toLowerCase().includes('bulk')
    ));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadSkus(); }, [loadSkus]);

  const filtered = useMemo(() => {
    if (!search.trim()) return skus;
    const q = search.toLowerCase();
    return skus.filter(s => s.product_name.toLowerCase().includes(q));
  }, [skus, search]);

  function selectSku(s: FgSku) {
    setSelected(prev => prev?.fg_sku_id === s.fg_sku_id ? null : s);
    setTubsToBreak('');
    setLastResult(null);
  }

  const tubsNum = parseFloat(tubsToBreak) || 0;
  const sq12Out = calcOutput(tubsNum, PACK_CONFIG['12sq'].ml);
  const sampleOut = calcOutput(tubsNum, PACK_CONFIG['sample'].ml);

  async function handleSubmit() {
    if (!selected) { toast.error('Select a bulk SKU to break.'); return; }
    if (tubsNum <= 0) { toast.error('Enter number of tubs to break.'); return; }
    if (tubsNum > selected.qty_on_hand) {
      toast.error(`Only ${formatNumber(selected.qty_on_hand)} ${selected.unit} in stock.`);
      return;
    }
    const pack = PACK_CONFIG[packType];
    const outputQty = calcOutput(tubsNum, pack.ml);
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

      setLastResult(`${tubsNum} × ${selected.unit} broken into ${body.output_qty} × ${pack.label}`);
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
        icon={PackageOpen} iconColor="text-blue-500"
        title="Break Bulk"
        description="Open 4L bulk tubs to produce 12-square packs or 50ml samples."
      />

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-green-800 font-medium">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          {lastResult}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search bulk flavour..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      {/* SKU list with inline expansion */}
      <div className="card space-y-2">
        <h2 className="section-title mb-3">Select Bulk SKU to Break</h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {skus.length === 0 ? 'No bulk stock available. Make tubs first.' : 'No results match your search.'}
          </p>
        ) : (
          filtered.map(s => {
            const isSelected = selected?.fg_sku_id === s.fg_sku_id;
            return (
              <div key={s.fg_sku_id}>
                <button
                  onClick={() => selectSku(s)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-2 transition-all touch-manipulation text-left ${
                    isSelected
                      ? 'rounded-t-2xl border-b-0 border-brand-500 bg-orange-50'
                      : 'rounded-2xl border-gray-200 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-brand-600" />
                    </div>
                    <p className={`font-semibold text-sm ${isSelected ? 'text-brand-700' : 'text-gray-900'}`}>
                      {s.product_name}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-gray-700 shrink-0">
                    {formatNumber(s.qty_on_hand)} {s.unit}
                  </span>
                </button>

                {isSelected && (
                  <div className="border-2 border-t-0 border-brand-500 bg-orange-50 rounded-b-2xl px-4 pb-4 pt-3 space-y-4">
                    <div>
                      <label className="label-text block mb-1">
                        Number of {s.unit} to open (max {formatNumber(s.qty_on_hand)})
                      </label>
                      <input
                        type="number" min="0.5" step="0.5"
                        max={s.qty_on_hand}
                        value={tubsToBreak}
                        onChange={e => { setTubsToBreak(e.target.value); setLastResult(null); }}
                        placeholder="e.g. 2"
                        className="input-field"
                        autoFocus
                      />
                    </div>

                    {tubsNum > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        <div
                          className={`rounded-2xl border-2 p-4 space-y-1 cursor-pointer transition-all touch-manipulation ${
                            packType === '12sq' ? 'border-brand-500 bg-white' : 'border-gray-200 bg-white hover:border-orange-200'
                          }`}
                          onClick={() => setPackType('12sq')}
                        >
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">12 Squares</p>
                          <p className="text-2xl font-bold text-gray-900">{sq12Out}</p>
                          <p className="text-xs text-gray-500">packs × 150ml each</p>
                          {(tubsNum * 4000) % PACK_CONFIG['12sq'].ml !== 0 && (
                            <p className="text-xs text-amber-500">{formatNumber(((tubsNum * 4000) % PACK_CONFIG['12sq'].ml) / 1000)}L waste</p>
                          )}
                        </div>
                        <div
                          className={`rounded-2xl border-2 p-4 space-y-1 cursor-pointer transition-all touch-manipulation ${
                            packType === 'sample' ? 'border-brand-500 bg-white' : 'border-gray-200 bg-white hover:border-orange-200'
                          }`}
                          onClick={() => setPackType('sample')}
                        >
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Samples</p>
                          <p className="text-2xl font-bold text-gray-900">{sampleOut}</p>
                          <p className="text-xs text-gray-500">units × 50ml each</p>
                          {(tubsNum * 4000) % PACK_CONFIG['sample'].ml !== 0 && (
                            <p className="text-xs text-amber-500">{formatNumber(((tubsNum * 4000) % PACK_CONFIG['sample'].ml) / 1000)}L waste</p>
                          )}
                        </div>
                      </div>
                    )}

                    {tubsNum > 0 && (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || tubsNum <= 0}
                        className="btn-primary"
                      >
                        {submitting
                          ? 'Processing...'
                          : `Break ${tubsNum} Tub${tubsNum !== 1 ? 's' : ''} → ${packType === '12sq' ? `${sq12Out} × 12-Square Packs` : `${sampleOut} × Samples`}`
                        }
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
