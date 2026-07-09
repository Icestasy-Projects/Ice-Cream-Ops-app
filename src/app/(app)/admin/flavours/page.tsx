'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';

interface RmItem { id: number; name: string; unit: string; }

interface RecipeLine { rm_item_id: number; name: string; unit: string; qty_per_unit: string; }

interface Flavour {
  id: number;
  name: string;
  batch_yield_l: number | null;
  status: string;
  expanded: boolean;
  recipes: { rm_item_id: number; name: string; unit: string; qty_per_unit: number }[];
}

export default function FlavoursPage() {
  const supabase = createClient();
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [rmItems, setRmItems] = useState<RmItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYield, setNewYield] = useState('');
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [rmSearch, setRmSearch] = useState('');
  const [showRmDrop, setShowRmDrop] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredRm = rmItems
    .filter(r => r.name.toLowerCase().includes(rmSearch.toLowerCase()) && !recipeLines.some(l => l.rm_item_id === r.id))
    .slice(0, 8);

  const loadFlavours = useCallback(async () => {
    const [flavRes, recipeRes] = await Promise.all([
      supabase.schema('production').from('prep_products')
        .select('id, name, batch_yield_l, status')
        .order('name'),
      supabase.schema('production').from('prep_recipes')
        .select('prep_product_id, rm_item_id, qty_per_unit, item:rm_item_id(name, unit)'),
    ]);

    const recipes = (recipeRes.data || []) as Record<string, unknown>[];
    const recipeMap = new Map<number, { rm_item_id: number; name: string; unit: string; qty_per_unit: number }[]>();
    for (const r of recipes) {
      const pid = r.prep_product_id as number;
      const item = r.item as Record<string, unknown> | null;
      if (!recipeMap.has(pid)) recipeMap.set(pid, []);
      recipeMap.get(pid)!.push({
        rm_item_id: r.rm_item_id as number,
        name: (item?.name as string) || '',
        unit: (item?.unit as string) || '',
        qty_per_unit: r.qty_per_unit as number,
      });
    }

    setFlavours((flavRes.data || []).map((f: Record<string, unknown>) => ({
      id: f.id as number,
      name: f.name as string,
      batch_yield_l: f.batch_yield_l as number | null,
      status: f.status as string,
      expanded: false,
      recipes: recipeMap.get(f.id as number) || [],
    })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.schema('production').from('rm_items')
        .select('id, name, unit').eq('is_stockable', true).order('name');
      setRmItems((data || []).map((r: Record<string, unknown>) => ({
        id: r.id as number, name: r.name as string, unit: r.unit as string,
      })));
      await loadFlavours();
    }
    init();
  }, [supabase, loadFlavours]);

  function toggleFlavour(id: number) {
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, expanded: !f.expanded } : f));
  }

  function addRmLine(item: RmItem) {
    setRecipeLines(prev => [...prev, { rm_item_id: item.id, name: item.name, unit: item.unit, qty_per_unit: '' }]);
    setRmSearch('');
    setShowRmDrop(false);
  }

  function updateRecipeLine(idx: number, val: string) {
    setRecipeLines(prev => prev.map((l, i) => i === idx ? { ...l, qty_per_unit: val } : l));
  }

  function removeRecipeLine(idx: number) {
    setRecipeLines(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveFlavour() {
    if (!newName.trim()) { toast.error('Enter a flavour name.'); return; }
    if (!newYield || parseFloat(newYield) <= 0) { toast.error('Enter batch yield in litres.'); return; }
    for (const l of recipeLines) {
      if (!l.qty_per_unit || parseFloat(l.qty_per_unit) <= 0) {
        toast.error(`Enter quantity for ${l.name}.`);
        return;
      }
    }

    setSaving(true);
    try {
      const { data: flavour, error: flavErr } = await supabase.schema('production').from('prep_products')
        .insert({ name: newName.trim(), batch_yield_l: parseFloat(newYield), unit: 'L', status: 'active' })
        .select('id').single();

      if (flavErr || !flavour) throw new Error(flavErr?.message || 'Failed to create flavour');

      if (recipeLines.length > 0) {
        const { error: recipeErr } = await supabase.schema('production').from('prep_recipes')
          .insert(recipeLines.map(l => ({
            prep_product_id: flavour.id,
            rm_item_id: l.rm_item_id,
            qty_per_unit: parseFloat(l.qty_per_unit),
          })));
        if (recipeErr) throw new Error(recipeErr.message);
      }

      toast.success(`${newName} added!`);
      setNewName('');
      setNewYield('');
      setRecipeLines([]);
      setShowAdd(false);
      await loadFlavours();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading flavours..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon="🍨"
        title="Flavour Management"
        description="Add flavours, define their RM recipe per batch, and set the batch yield."
      />

      {/* Add flavour button */}
      <button
        onClick={() => setShowAdd(s => !s)}
        className="btn-primary flex items-center gap-2"
      >
        <Plus size={18} />
        {showAdd ? 'Cancel' : 'Add New Flavour'}
      </button>

      {/* Add flavour form */}
      {showAdd && (
        <div className="card space-y-5">
          <h2 className="section-title">New Flavour</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-1">Flavour Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Mango"
                className="input-field"
              />
            </div>
            <div>
              <label className="label-text block mb-1">Batch Yield (Litres)</label>
              <input
                type="number" min="0" step="0.5"
                value={newYield}
                onChange={e => setNewYield(e.target.value)}
                placeholder="e.g. 20"
                className="input-field"
              />
              {newYield && parseFloat(newYield) > 0 && (
                <p className="text-xs text-green-700 mt-1">
                  = {Math.floor(parseFloat(newYield) / 4)} × 4L bulk tubs per batch
                </p>
              )}
            </div>
          </div>

          {/* Recipe lines */}
          <div>
            <label className="label-text block mb-2">Raw Materials per Batch</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search RM ingredient..."
                className="input-field"
                value={rmSearch}
                onChange={e => { setRmSearch(e.target.value); setShowRmDrop(true); }}
                onFocus={() => setShowRmDrop(true)}
                onBlur={() => setTimeout(() => setShowRmDrop(false), 150)}
              />
              {showRmDrop && rmSearch && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 z-20 overflow-hidden">
                  {filteredRm.length === 0
                    ? <p className="p-4 text-sm text-gray-400">No results</p>
                    : filteredRm.map(i => (
                      <button
                        key={i.id}
                        className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 text-left touch-manipulation border-b border-gray-50 last:border-0"
                        onMouseDown={() => addRmLine(i)}
                      >
                        <span className="font-medium text-gray-900 text-sm">{i.name}</span>
                        <span className="text-gray-400 text-xs">{i.unit}</span>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>

            {recipeLines.length > 0 && (
              <div className="mt-3 space-y-2">
                {recipeLines.map((l, idx) => (
                  <div key={l.rm_item_id} className="flex items-center gap-3 bg-orange-50 rounded-xl px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{l.name}</p>
                    </div>
                    <div className="w-32">
                      <input
                        type="number" min="0" step="0.1"
                        value={l.qty_per_unit}
                        onChange={e => updateRecipeLine(idx, e.target.value)}
                        placeholder={`qty (${l.unit})`}
                        className="input-field text-sm py-2"
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{l.unit}</span>
                    <button onClick={() => removeRecipeLine(idx)} className="text-red-400 hover:text-red-600 touch-manipulation">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleSaveFlavour} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : '✓ Save Flavour'}
          </button>
        </div>
      )}

      {/* Existing flavours */}
      <div className="space-y-2">
        {flavours.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🍨</p>
            <p className="font-semibold text-gray-600">No flavours yet</p>
            <p className="text-sm mt-1">Add your first flavour above.</p>
          </div>
        ) : flavours.map(f => (
          <div key={f.id} className="card p-0 overflow-hidden">
            <button
              onClick={() => toggleFlavour(f.id)}
              className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left touch-manipulation hover:bg-orange-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <FlaskConical size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{f.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.batch_yield_l ? `${formatNumber(f.batch_yield_l)}L per batch · ${Math.floor(f.batch_yield_l / 4)} × 4L tubs` : 'No yield set'}
                    {' · '}{f.recipes.length} RM item{f.recipes.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {f.expanded ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
            </button>

            {f.expanded && (
              <div className="border-t border-gray-100 px-5 pb-4 pt-3">
                {f.recipes.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No recipe defined yet.</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Recipe per batch</p>
                    {f.recipes.map(r => (
                      <div key={r.rm_item_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-700">{r.name}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatNumber(r.qty_per_unit)} {r.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
