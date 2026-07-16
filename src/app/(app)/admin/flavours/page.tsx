'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, FlaskConical, Calculator, Pencil, Check, X, Search, IceCream } from 'lucide-react';

interface RmItem { id: number; name: string; unit: string; }
interface RecipeLine { rm_item_id: number; name: string; unit: string; qty_per_unit: string; purpose: 'mix' | 'topping'; }

interface Flavour {
  id: number;
  name: string;
  batch_yield_l: number | null;
  status: string;
  expanded: boolean;
  editing: boolean;
  batches: string;
  recipes: { rm_item_id: number; name: string; unit: string; qty_per_unit: number; purpose: string }[];
  // edit state (only populated when editing=true)
  editName: string;
  editYield: string;
  editStatus: string;
  editRecipes: RecipeLine[];
  editSearch: string;
  editShowDrop: boolean;
}

export default function FlavoursPage() {
  const supabase = createClient();
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [rmItems, setRmItems] = useState<RmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYield, setNewYield] = useState('');
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [rmSearch, setRmSearch] = useState('');
  const [showRmDrop, setShowRmDrop] = useState(false);

  // Exclude an item only if it already exists with BOTH purposes
  const filteredRm = (search: string, lines: RecipeLine[]) => {
    const bothUsed = new Set(
      rmItems
        .filter(r => lines.some(l => l.rm_item_id === r.id && l.purpose === 'mix') &&
                     lines.some(l => l.rm_item_id === r.id && l.purpose === 'topping'))
        .map(r => r.id)
    );
    return rmItems.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) && !bothUsed.has(r.id)).slice(0, 8);
  };

  const loadFlavours = useCallback(async () => {
    const [flavRes, recipeRes] = await Promise.all([
      supabase.schema('production').from('prep_products')
        .select('id, name, batch_yield_l, status')
        .order('name'),
      supabase.schema('production').from('prep_recipes')
        .select('prep_product_id, rm_item_id, qty_per_unit, purpose, item:rm_item_id(name, unit)'),
    ]);

    const recipes = (recipeRes.data || []) as Record<string, unknown>[];
    const recipeMap = new Map<number, { rm_item_id: number; name: string; unit: string; qty_per_unit: number; purpose: string }[]>();
    for (const r of recipes) {
      const pid = r.prep_product_id as number;
      const item = r.item as Record<string, unknown> | null;
      if (!recipeMap.has(pid)) recipeMap.set(pid, []);
      recipeMap.get(pid)!.push({
        rm_item_id: r.rm_item_id as number,
        name: (item?.name as string) || '',
        unit: (item?.unit as string) || '',
        qty_per_unit: r.qty_per_unit as number,
        purpose: (r.purpose as string) || 'mix',
      });
    }

    setFlavours((flavRes.data || []).map((f: Record<string, unknown>) => ({
      id: f.id as number,
      name: f.name as string,
      batch_yield_l: f.batch_yield_l as number | null,
      status: (f.status as string) || 'active',
      expanded: false,
      editing: false,
      batches: '1',
      recipes: recipeMap.get(f.id as number) || [],
      editName: '',
      editYield: '',
      editStatus: 'active',
      editRecipes: [],
      editSearch: '',
      editShowDrop: false,
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
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, expanded: !f.expanded, editing: false } : f));
  }

  function startEdit(id: number) {
    setFlavours(prev => prev.map(f => f.id === id ? {
      ...f,
      editing: true,
      expanded: true,
      editName: f.name,
      editYield: f.batch_yield_l?.toString() || '',
      editStatus: f.status,
      editRecipes: f.recipes.map(r => ({ ...r, qty_per_unit: r.qty_per_unit.toString(), purpose: (r.purpose || 'mix') as 'mix' | 'topping' })),
      editSearch: '',
      editShowDrop: false,
    } : f));
  }

  function cancelEdit(id: number) {
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, editing: false } : f));
  }

  function setEditField(id: number, field: Partial<Flavour>) {
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, ...field } : f));
  }

  function setBatches(id: number, val: string) {
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, batches: val } : f));
  }

  function addEditRmLine(id: number, item: RmItem) {
    setFlavours(prev => prev.map(f => f.id === id ? {
      ...f,
      editRecipes: [...f.editRecipes, { rm_item_id: item.id, name: item.name, unit: item.unit, qty_per_unit: '', purpose: 'mix' as const }],
      editSearch: '',
      editShowDrop: false,
    } : f));
  }

  function updateEditRecipeLine(id: number, idx: number, val: string) {
    setFlavours(prev => prev.map(f => f.id === id ? {
      ...f,
      editRecipes: f.editRecipes.map((l, i) => i === idx ? { ...l, qty_per_unit: val } : l),
    } : f));
  }

  function updateEditRecipePurpose(id: number, idx: number, purpose: 'mix' | 'topping') {
    setFlavours(prev => prev.map(f => f.id === id ? {
      ...f,
      editRecipes: f.editRecipes.map((l, i) => i === idx ? { ...l, purpose } : l),
    } : f));
  }

  function removeEditRecipeLine(id: number, idx: number) {
    setFlavours(prev => prev.map(f => f.id === id ? {
      ...f,
      editRecipes: f.editRecipes.filter((_, i) => i !== idx),
    } : f));
  }

  async function handleSaveEdit(f: Flavour) {
    if (!f.editName.trim()) { toast.error('Enter a flavour name.'); return; }
    if (!f.editYield || parseFloat(f.editYield) <= 0) { toast.error('Enter batch yield.'); return; }
    for (const l of f.editRecipes) {
      if (!l.qty_per_unit || parseFloat(l.qty_per_unit) <= 0) {
        toast.error(`Enter quantity for ${l.name}.`); return;
      }
    }

    setSaving(true);
    try {
      const { error: updErr } = await supabase.schema('production').from('prep_products')
        .update({ name: f.editName.trim(), batch_yield_l: parseFloat(f.editYield), status: f.editStatus })
        .eq('id', f.id);
      if (updErr) throw new Error(updErr.message);

      // Replace all recipe lines
      await supabase.schema('production').from('prep_recipes').delete().eq('prep_product_id', f.id);
      if (f.editRecipes.length > 0) {
        const { error: recErr } = await supabase.schema('production').from('prep_recipes').insert(
          f.editRecipes.map(l => ({
            prep_product_id: f.id,
            rm_item_id: l.rm_item_id,
            qty_per_unit: parseFloat(l.qty_per_unit),
            purpose: l.purpose,
          }))
        );
        if (recErr) throw new Error(recErr.message);
      }

      toast.success('Flavour updated!');
      await loadFlavours();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  // Add new flavour handlers
  function addRmLine(item: RmItem) {
    setRecipeLines(prev => [...prev, { rm_item_id: item.id, name: item.name, unit: item.unit, qty_per_unit: '', purpose: 'mix' as const }]);
    setRmSearch(''); setShowRmDrop(false);
  }
  function updateRecipeLine(idx: number, val: string) {
    setRecipeLines(prev => prev.map((l, i) => i === idx ? { ...l, qty_per_unit: val } : l));
  }
  function updateRecipePurpose(idx: number, purpose: 'mix' | 'topping') {
    setRecipeLines(prev => prev.map((l, i) => i === idx ? { ...l, purpose } : l));
  }
  function removeRecipeLine(idx: number) {
    setRecipeLines(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveFlavour() {
    if (!newName.trim()) { toast.error('Enter a flavour name.'); return; }
    if (!newYield || parseFloat(newYield) <= 0) { toast.error('Enter batch yield in litres.'); return; }
    for (const l of recipeLines) {
      if (!l.qty_per_unit || parseFloat(l.qty_per_unit) <= 0) {
        toast.error(`Enter quantity for ${l.name}.`); return;
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
            purpose: l.purpose,
          })));
        if (recipeErr) throw new Error(recipeErr.message);
      }

      toast.success(`${newName} added!`);
      setNewName(''); setNewYield(''); setRecipeLines([]); setShowAdd(false);
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
        icon={IceCream} iconColor="text-brand-500"
        title="Flavour Management"
        description="Add and edit flavours, define RM recipe per batch, and toggle active status."
      />

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => setShowAdd(s => !s)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {showAdd ? 'Cancel' : 'Add New Flavour'}
        </button>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search flavours..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>
      </div>

      {showAdd && (
        <div className="card space-y-5">
          <h2 className="section-title">New Flavour</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-1">Flavour Name</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Mango" className="input-field" />
            </div>
            <div>
              <label className="label-text block mb-1">Batch Yield (Litres)</label>
              <input type="number" min="0" step="0.5" value={newYield} onChange={e => setNewYield(e.target.value)}
                placeholder="e.g. 20" className="input-field" />
              {newYield && parseFloat(newYield) > 0 && (
                <p className="text-xs text-green-700 mt-1">= {Math.floor(parseFloat(newYield) / 4)} × 4L bulk tubs per batch</p>
              )}
            </div>
          </div>

          <div>
            <label className="label-text block mb-2">Raw Materials per Batch</label>
            <div className="relative">
              <input type="text" placeholder="Search RM ingredient..." className="input-field"
                value={rmSearch}
                onChange={e => { setRmSearch(e.target.value); setShowRmDrop(true); }}
                onFocus={() => setShowRmDrop(true)}
                onBlur={() => setTimeout(() => setShowRmDrop(false), 150)}
              />
              {showRmDrop && rmSearch && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 z-20 overflow-hidden">
                  {filteredRm(rmSearch, recipeLines).length === 0
                    ? <p className="p-4 text-sm text-gray-400">No results — add the ingredient first in Manage Ingredients</p>
                    : filteredRm(rmSearch, recipeLines).map(i => (
                      <button key={i.id} className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 text-left touch-manipulation border-b border-gray-50 last:border-0"
                        onMouseDown={() => addRmLine(i)}>
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
                  <div key={`${l.rm_item_id}-${l.purpose}`} className="bg-orange-50 rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{l.name}</p></div>
                      <div className="w-32">
                        <input type="number" min="0" step="0.1" value={l.qty_per_unit}
                          onChange={e => updateRecipeLine(idx, e.target.value)}
                          placeholder={`qty (${l.unit})`} className="input-field text-sm py-2" />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{l.unit}</span>
                      <button onClick={() => removeRecipeLine(idx)} className="text-red-400 hover:text-red-600 touch-manipulation">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {(['mix', 'topping'] as const).map(p => (
                        <button key={p} onClick={() => updateRecipePurpose(idx, p)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors touch-manipulation ${
                            l.purpose === p
                              ? p === 'mix' ? 'bg-blue-600 text-white border-blue-600' : 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          }`}>
                          {p === 'mix' ? '🥣 Mix' : '🍫 Topping'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {recipeLines.length > 0 && newYield && parseFloat(newYield) > 0 && (
              <div className="mt-4 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 space-y-1">
                <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">Per Batch Preview</p>
                <p className="text-sm text-gray-700">Yield: <strong>{newYield}L</strong> → <strong>{Math.floor(parseFloat(newYield) / 4)} × 4L tubs</strong></p>
                {recipeLines.map(l => l.qty_per_unit && parseFloat(l.qty_per_unit) > 0 ? (
                  <p key={l.rm_item_id} className="text-xs text-gray-700 ml-2">• {l.name}: <strong>{l.qty_per_unit} {l.unit}</strong></p>
                ) : null)}
              </div>
            )}
          </div>

          <button onClick={handleSaveFlavour} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : '✓ Save Flavour'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {(() => {
          const filtered = search.trim()
            ? flavours.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
            : flavours;
          if (flavours.length === 0) return (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">🍨</p>
              <p className="font-semibold text-gray-600">No flavours yet</p>
              <p className="text-sm mt-1">Add your first flavour above.</p>
            </div>
          );
          if (filtered.length === 0) return (
            <div className="card text-center py-8 text-gray-400">
              <p className="text-sm">No flavours match &ldquo;{search}&rdquo;</p>
            </div>
          );
          return filtered.map(f => {
          const batchCount = parseFloat(f.batches) || 0;
          const tubsPerBatch = f.batch_yield_l ? Math.floor(f.batch_yield_l / 4) : 0;
          const totalTubs = Math.floor(batchCount * (f.batch_yield_l || 0) / 4);
          const totalLitres = batchCount * (f.batch_yield_l || 0);
          return (
            <div key={f.id} className="card p-0 overflow-hidden">
              {/* Header row */}
              <div className="w-full px-5 py-4 flex items-center justify-between gap-3">
                <button onClick={() => toggleFlavour(f.id)} className="flex items-center gap-3 flex-1 text-left touch-manipulation">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${f.status === 'active' ? 'bg-brand-50' : 'bg-gray-100'}`}>
                    <FlaskConical size={18} className={f.status === 'active' ? 'text-brand-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{f.name}</p>
                      {f.status !== 'active' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {f.batch_yield_l ? `${formatNumber(f.batch_yield_l)}L per batch · ${tubsPerBatch} × 4L tubs` : 'No yield set'}
                      {' · '}{f.recipes.length} RM item{f.recipes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {!f.editing && (
                    <button onClick={() => startEdit(f.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 touch-manipulation">
                      <Pencil size={15} />
                    </button>
                  )}
                  <button onClick={() => toggleFlavour(f.id)} className="p-1 touch-manipulation">
                    {f.expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </button>
                </div>
              </div>

              {f.expanded && !f.editing && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
                  {f.recipes.length === 0 ? (
                    <p className="text-sm text-gray-400">No recipe defined yet. Click ✏️ to add ingredients.</p>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Recipe per batch</p>
                      <div className="space-y-1">
                        {f.recipes.map((r, i) => (
                          <div key={`${r.rm_item_id}-${r.purpose}-${i}`} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{r.name}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.purpose === 'topping' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {r.purpose === 'topping' ? 'Topping' : 'Mix'}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{formatNumber(r.qty_per_unit)} {r.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {f.recipes.length > 0 && f.batch_yield_l && (
                    <div className="bg-orange-50 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calculator size={15} className="text-brand-600" />
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">Batch Calculator</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">How many batches to make?</label>
                        <input type="number" min="1" step="1" value={f.batches}
                          onChange={e => setBatches(f.id, e.target.value)}
                          className="input-field text-sm py-2 bg-white" placeholder="e.g. 5" />
                      </div>
                      {batchCount > 0 && (
                        <>
                          <div className="bg-white rounded-xl px-4 py-3 space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Output</p>
                            <p className="text-sm text-gray-700">
                              {formatNumber(batchCount)} batch{batchCount !== 1 ? 'es' : ''} × {f.batch_yield_l}L = <strong>{formatNumber(totalLitres)}L</strong>
                            </p>
                            <p className="text-base font-bold text-brand-700">→ {totalTubs} × 4L bulk tubs</p>
                          </div>
                          <div className="bg-white rounded-xl px-4 py-3 space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">RM Required</p>
                            {f.recipes.map((r, i) => (
                              <div key={`${r.rm_item_id}-${r.purpose}-${i}`} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                                <span className="text-sm text-gray-700">{r.name}</span>
                                <span className="text-sm font-bold text-gray-900">{formatNumber(r.qty_per_unit * batchCount)} {r.unit}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {f.expanded && f.editing && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
                  <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">Edit Flavour</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-text block mb-1">Flavour Name</label>
                      <input type="text" value={f.editName}
                        onChange={e => setEditField(f.id, { editName: e.target.value })}
                        className="input-field" />
                    </div>
                    <div>
                      <label className="label-text block mb-1">Batch Yield (Litres)</label>
                      <input type="number" min="0" step="0.5" value={f.editYield}
                        onChange={e => setEditField(f.id, { editYield: e.target.value })}
                        className="input-field" />
                    </div>
                  </div>

                  <div>
                    <label className="label-text block mb-1">Status</label>
                    <div className="flex gap-3">
                      {['active', 'inactive'].map(s => (
                        <button key={s}
                          onClick={() => setEditField(f.id, { editStatus: s })}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors touch-manipulation ${
                            f.editStatus === s
                              ? s === 'active' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-600 text-white border-gray-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          }`}>
                          {s === 'active' ? '✓ Active' : '✗ Inactive'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label-text block mb-2">Raw Materials per Batch</label>
                    <div className="relative">
                      <input type="text" placeholder="Search RM ingredient..."
                        className="input-field"
                        value={f.editSearch}
                        onChange={e => setEditField(f.id, { editSearch: e.target.value, editShowDrop: true })}
                        onFocus={() => setEditField(f.id, { editShowDrop: true })}
                        onBlur={() => setTimeout(() => setEditField(f.id, { editShowDrop: false }), 150)}
                      />
                      {f.editShowDrop && f.editSearch && (
                        <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 z-20 overflow-hidden">
                          {filteredRm(f.editSearch, f.editRecipes).length === 0
                            ? <p className="p-4 text-sm text-gray-400">No results</p>
                            : filteredRm(f.editSearch, f.editRecipes).map(i => (
                              <button key={i.id}
                                className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 text-left touch-manipulation border-b border-gray-50 last:border-0"
                                onMouseDown={() => addEditRmLine(f.id, i)}>
                                <span className="font-medium text-gray-900 text-sm">{i.name}</span>
                                <span className="text-gray-400 text-xs">{i.unit}</span>
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>

                    {f.editRecipes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {f.editRecipes.map((l, idx) => (
                          <div key={`${l.rm_item_id}-${l.purpose}-${idx}`} className="bg-orange-50 rounded-xl px-4 py-3 space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{l.name}</p></div>
                              <div className="w-32">
                                <input type="number" min="0" step="0.1" value={l.qty_per_unit}
                                  onChange={e => updateEditRecipeLine(f.id, idx, e.target.value)}
                                  placeholder={`qty (${l.unit})`} className="input-field text-sm py-2" />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{l.unit}</span>
                              <button onClick={() => removeEditRecipeLine(f.id, idx)}
                                className="text-red-400 hover:text-red-600 touch-manipulation">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex gap-2">
                              {(['mix', 'topping'] as const).map(p => (
                                <button key={p} onClick={() => updateEditRecipePurpose(f.id, idx, p)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors touch-manipulation ${
                                    l.purpose === p
                                      ? p === 'mix' ? 'bg-blue-600 text-white border-blue-600' : 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                  }`}>
                                  {p === 'mix' ? '🥣 Mix' : '🍫 Topping'}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => handleSaveEdit(f)} disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 touch-manipulation disabled:opacity-60">
                      <Check size={16} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => cancelEdit(f.id)}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 touch-manipulation">
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })})()}
      </div>
    </div>
  );
}
