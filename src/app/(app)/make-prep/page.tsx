'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { CheckCircle, FlaskConical, AlertCircle } from 'lucide-react';

interface PrepProduct {
  id: number;
  name: string;
  unit: string;
  batch_yield_l: number | null;
}

interface RecipeLine {
  qty_per_unit: number;
  rm_items: { name: string; unit: string };
  rm_item_id: number;
  stock_on_hand: number;
  max_batches_from_stock: number;
}

export default function MakePrepPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<PrepProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PrepProduct | null>(null);
  const [recipe, setRecipe] = useState<RecipeLine[]>([]);
  const [batches, setBatches] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [shortfalls, setShortfalls] = useState<string[]>([]);

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

  async function handleSelectChange(id: string) {
    setBatches('');
    setNote('');
    setLastError(null);
    setShortfalls([]);
    setRecipe([]);
    if (!id) { setSelected(null); return; }
    const p = products.find(x => x.id === parseInt(id)) ?? null;
    setSelected(p);
    if (p) {
      const [recipesRes, stockRes] = await Promise.all([
        supabase.schema('production').from('prep_recipes')
          .select('rm_item_id, qty_per_unit, rm_items(name, unit)')
          .eq('prep_product_id', p.id),
        supabase.schema('production').from('v_rm_stock')
          .select('rm_item_id, qty_on_hand'),
      ]);
      const stockMap = new Map<number, number>(
        ((stockRes.data || []) as Record<string, unknown>[]).map(r => [r.rm_item_id as number, (r.qty_on_hand as number) || 0])
      );
      const lines = ((recipesRes.data || []) as Record<string, unknown>[]).map(r => {
        const rmId = r.rm_item_id as number;
        const qtyPerUnit = (r.qty_per_unit as number) || 0;
        const onHand = stockMap.get(rmId) ?? 0;
        return {
          rm_item_id: rmId,
          qty_per_unit: qtyPerUnit,
          rm_items: r.rm_items as { name: string; unit: string },
          stock_on_hand: onHand,
          max_batches_from_stock: qtyPerUnit > 0 ? Math.floor(onHand / qtyPerUnit) : Infinity,
        };
      });
      setRecipe(lines);
    }
  }

  const batchCount = parseFloat(batches) || 0;
  const totalLitres = batchCount * (selected?.batch_yield_l ?? 0);
  const bulkTubs = selected?.batch_yield_l ? Math.floor(totalLitres / 4) : 0;
  const maxPossibleBatches = recipe.length > 0
    ? Math.min(...recipe.filter(r => r.qty_per_unit > 0).map(r => r.max_batches_from_stock))
    : null;

  async function handleSubmit() {
    if (!selected || batchCount <= 0) return;
    setSubmitting(true);
    setLastError(null);
    setShortfalls([]);
    try {
      const res = await fetch('/api/make-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prep_product_id: selected.id,
          num_batches: batchCount,
          batch_yield_l: selected.batch_yield_l ?? 1,
          note: note || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.shortfalls) {
          setShortfalls(json.shortfalls);
          setLastError(json.error || 'Not enough raw materials');
          setShowConfirm(false);
          setSubmitting(false);
          return;
        }
        throw new Error(json.error || 'Failed to record batch');
      }

      setLastResult(`Recorded ${batchCount} batch${batchCount !== 1 ? 'es' : ''} of ${selected.name} (${formatNumber(totalLitres)}L). Kitchen stock updated.`);
      setLastError(null);
      toast.success(`${batchCount} batch${batchCount !== 1 ? 'es' : ''} of ${selected.name} added to kitchen stock!`);
      setShowConfirm(false);
      setSelected(null);
      setBatches('');
      setNote('');
      setRecipe([]);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      let friendly = raw;
      let sf: string[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.shortfalls) sf = parsed.shortfalls;
        if (parsed?.error) friendly = parsed.error;
      } catch { /* not JSON */ }
      if (!sf.length) friendly = parseSupabaseError(friendly);
      setLastError(friendly);
      setShortfalls(sf);
      toast.error(sf.length ? `Not enough RM stock — see details below` : friendly, { duration: 6000 });
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading flavours..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={FlaskConical} iconColor="text-purple-500"
        title="Make Kitchen Mix"
        description="Record a new batch of flavour mix made in the kitchen."
      />

      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
          <p className="text-green-800 font-medium">{lastResult}</p>
        </div>
      )}

      {lastError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="min-w-0">
            <p className="text-red-800 font-semibold text-sm">Could not record batch</p>
            {shortfalls.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {shortfalls.map((s, i) => (
                  <li key={i} className="text-red-700 text-sm flex items-start gap-1.5">
                    <span className="text-red-400 shrink-0 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-700 text-sm mt-1">{lastError}</p>
            )}
            <p className="text-red-500 text-xs mt-2">Go to <strong>Receive Ingredients</strong> to restock the items above.</p>
          </div>
        </div>
      )}

      <div className="card space-y-5">
        {/* Flavour picker */}
        <div>
          <label className="label-text block mb-1">Flavour</label>
          <select
            value={selected?.id ?? ''}
            onChange={e => handleSelectChange(e.target.value)}
            className="input-field"
          >
            <option value="">— Select a flavour —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {selected?.batch_yield_l && (
            <p className="text-xs text-gray-400 mt-1.5">
              1 batch = {selected.batch_yield_l}L → {Math.floor(selected.batch_yield_l / 4)} × 4L Bulk tubs
            </p>
          )}
        </div>

        {/* Batch count */}
        {selected && (
          <div>
            <label className="label-text block mb-1">Number of Batches</label>
            <input
              type="number"
              min="1"
              step="1"
              value={batches}
              onChange={e => setBatches(e.target.value)}
              onWheel={e => e.currentTarget.blur()}
              placeholder="e.g. 3"
              className="input-field"
              autoFocus
            />
            {batchCount > 0 && (
              <div className="mt-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-700">
                  <span className="font-bold text-gray-900">{batchCount}</span> batch{batchCount !== 1 ? 'es' : ''}
                  {' × '}{selected.batch_yield_l}L = <span className="font-bold text-orange-600">{formatNumber(totalLitres)}L</span>
                </span>
                <span className="text-gray-500">→ <span className="font-bold text-gray-800">{bulkTubs} × 4L Bulk</span></span>
              </div>
            )}
          </div>
        )}

        {/* RM breakdown */}
        {recipe.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Capacity banner */}
            {maxPossibleBatches !== null && (
              <div className={`px-4 py-2.5 flex items-center justify-between text-sm border-b ${
                maxPossibleBatches === 0
                  ? 'bg-red-50 border-red-200'
                  : batchCount > 0 && batchCount > maxPossibleBatches
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
              }`}>
                <span className={`font-medium ${
                  maxPossibleBatches === 0 ? 'text-red-700'
                    : batchCount > 0 && batchCount > maxPossibleBatches ? 'text-amber-700'
                    : 'text-green-700'
                }`}>
                  {maxPossibleBatches === 0
                    ? 'Insufficient RM stock for even 1 batch'
                    : `Stock allows up to ${maxPossibleBatches} batch${maxPossibleBatches !== 1 ? 'es' : ''}`}
                </span>
                {maxPossibleBatches > 0 && selected?.batch_yield_l && (
                  <span className="text-gray-500 text-xs">
                    = {formatNumber(maxPossibleBatches * selected.batch_yield_l)}L
                  </span>
                )}
              </div>
            )}
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide px-4 py-2 bg-gray-50 border-b border-gray-100">
              RM Ingredients{batchCount > 0 ? ` — ${batchCount} batch${batchCount !== 1 ? 'es' : ''}` : ' — per batch'}
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400">
                  <th className="text-left px-4 py-1.5 font-medium">Ingredient</th>
                  <th className="text-right px-4 py-1.5 font-medium">In Stock</th>
                  <th className="text-right px-4 py-1.5 font-medium">Per Batch</th>
                  {batchCount > 0 && <th className="text-right px-4 py-1.5 font-medium">Need</th>}
                </tr>
              </thead>
              <tbody>
                {recipe.map((line, i) => {
                  const need = line.qty_per_unit * batchCount;
                  const shortage = batchCount > 0 && need > line.stock_on_hand;
                  return (
                    <tr key={i} className={`border-b border-gray-50 last:border-0 ${shortage ? 'bg-red-50' : ''}`}>
                      <td className={`px-4 py-2 font-medium ${shortage ? 'text-red-800' : 'text-gray-800'}`}>{line.rm_items.name}</td>
                      <td className={`px-4 py-2 text-right ${shortage ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {formatNumber(line.stock_on_hand, 3)} {line.rm_items.unit}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">{formatNumber(line.qty_per_unit, 3)} {line.rm_items.unit}</td>
                      {batchCount > 0 && (
                        <td className={`px-4 py-2 text-right font-bold ${shortage ? 'text-red-700' : 'text-orange-700'}`}>
                          {formatNumber(need, 3)} {line.rm_items.unit}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Note */}
        {selected && (
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
        )}

        {/* Submit */}
        {selected && batchCount > 0 && (
          <button onClick={() => setShowConfirm(true)} className="btn-primary w-full">
            Record {batchCount} Batch{batchCount !== 1 ? 'es' : ''} of {selected.name}
          </button>
        )}
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
