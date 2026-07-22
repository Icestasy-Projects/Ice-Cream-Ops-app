'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle, Box, Search } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FgSku | null>(null);
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

  const filtered = useMemo(() => {
    if (!search.trim()) return skus;
    const q = search.toLowerCase();
    return skus.filter(s => s.product_name.toLowerCase().includes(q));
  }, [skus, search]);

  function selectSku(s: FgSku) {
    setSelected(prev => prev?.fg_sku_id === s.fg_sku_id ? null : s);
    setQty('');
    setNote('');
    setLastResult(null);
  }

  async function handleSubmit() {
    if (!selected || !qty || parseFloat(qty) <= 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .schema('production')
        .from('fg_units')
        .insert({
          fg_sku_id: selected.fg_sku_id,
          qty_produced: parseFloat(qty),
          produced_by: user?.id,
          status: 'posted',
          note: note || null,
        });

      if (error) throw new Error(error.message);

      const qtyNum = parseFloat(qty);
      setLastResult(`Produced ${formatNumber(qtyNum)} ${selected.unit} of ${selected.product_name}. Finished goods stock updated.`);
      toast.success(`${formatNumber(qtyNum)} ${selected.unit} of ${selected.product_name} added to stock!`);
      setShowConfirm(false);
      setSelected(null);
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

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search flavour..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      <div className="card space-y-2">
        <h2 className="section-title mb-3">Pick a Flavour</h2>
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-6">
            {skus.length === 0 ? 'No products found.' : 'No results match your search.'}
          </p>
        ) : (
          filtered.map(s => {
            const isSelected = selected?.fg_sku_id === s.fg_sku_id;
            return (
              <div key={s.fg_sku_id}>
                <button
                  onClick={() => selectSku(s)}
                  className={`w-full text-left px-5 py-4 transition-all touch-manipulation ${
                    isSelected
                      ? 'rounded-t-2xl border-2 border-b-0 border-brand-500 bg-orange-50'
                      : 'rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-200'
                  }`}
                >
                  <p className="font-bold text-gray-900">{s.product_name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Currently in stock: {formatNumber(s.qty_on_hand)} {s.unit}</p>
                </button>

                {isSelected && (
                  <div className="border-2 border-t-0 border-brand-500 bg-orange-50 rounded-b-2xl px-5 pb-5 pt-4 space-y-4">
                    <div>
                      <label className="label-text block mb-2">Quantity to produce ({s.unit})</label>
                      <input
                        type="number" min="1" step="1"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        placeholder="e.g. 50"
                        className="input-field"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="label-text block mb-2">Note (optional)</label>
                      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Any notes..." className="input-field" rows={2} />
                    </div>

                    {qtyNum > 0 && (
                      <button onClick={() => setShowConfirm(true)} className="btn-primary">
                        Make {qty} {s.unit} of {s.product_name}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showConfirm && selected && (
        <ConfirmModal
          title="Confirm Production"
          message={
            <div className="space-y-2">
              <p>Recording production of:</p>
              <p className="text-xl font-bold text-gray-900">
                {qty} {selected.unit} of {selected.product_name}
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
