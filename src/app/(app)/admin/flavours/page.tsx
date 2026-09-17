'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Plus, Trash2, Pencil, Check, X, Search, IceCream, ChevronDown, ChevronUp, Beaker, Layers } from 'lucide-react';

interface RmItem { id: number; name: string; unit: string; }
interface RecipeLine { rm_item_id: number; name: string; unit: string; qty_per_unit: string; purpose: 'mix' | 'topping'; }

interface Flavour {
  id: number;
  name: string;
  batch_yield_l: number | null;
  status: string;
  expanded: boolean;
  editing: boolean;
  recipes: { rm_item_id: number; name: string; unit: string; qty_per_unit: number; purpose: string }[];
  editName: string;
  editYield: string;
  editStatus: string;
  editRecipes: RecipeLine[];
  editSearch: string;
  editShowDrop: boolean;
}

const BLANK = { name: '', yield: '', lines: [] as RecipeLine[], rmSearch: '', showDrop: false };

export default function FlavoursPage() {
  const supabase = createClient();
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [rmItems, setRmItems] = useState<RmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newSheet, setNewSheet] = useState(BLANK);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  function filteredRm(q: string, lines: RecipeLine[]) {
    const usedIds = new Set(lines.map(l => l.rm_item_id));
    return rmItems.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) && !usedIds.has(r.id)).slice(0, 8);
  }

  const loadFlavours = useCallback(async () => {
    const [flavRes, recipeRes] = await Promise.all([
      supabase.schema('production').from('prep_products').select('id, name, batch_yield_l, status').order('name'),
      supabase.schema('production').from('prep_recipes').select('prep_product_id, rm_item_id, qty_per_unit, purpose, item:rm_item_id(name, unit)'),
    ]);
    const recipes = (recipeRes.data || []) as Record<string, unknown>[];
    const map = new Map<number, Flavour['recipes']>();
    for (const r of recipes) {
      const pid = r.prep_product_id as number;
      const item = r.item as Record<string, unknown> | null;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push({ rm_item_id: r.rm_item_id as number, name: (item?.name as string) || '', unit: (item?.unit as string) || '', qty_per_unit: r.qty_per_unit as number, purpose: (r.purpose as string) || 'mix' });
    }
    setFlavours((flavRes.data || []).map((f: Record<string, unknown>) => ({
      id: f.id as number, name: f.name as string, batch_yield_l: f.batch_yield_l as number | null,
      status: (f.status as string) || 'active', expanded: false, editing: false,
      recipes: map.get(f.id as number) || [],
      editName: '', editYield: '', editStatus: 'active', editRecipes: [], editSearch: '', editShowDrop: false,
    })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.schema('production').from('rm_items').select('id, name, unit').eq('is_stockable', true).order('name');
      setRmItems((data || []).map((r: Record<string, unknown>) => ({ id: r.id as number, name: r.name as string, unit: r.unit as string })));
      await loadFlavours();
    }
    init();
  }, [supabase, loadFlavours]);

  function addNewLine(item: RmItem) {
    setNewSheet(s => ({ ...s, lines: [...s.lines, { rm_item_id: item.id, name: item.name, unit: item.unit, qty_per_unit: '', purpose: 'mix' }], rmSearch: '', showDrop: false }));
  }
  function updateNewLine(idx: number, field: Partial<RecipeLine>) {
    setNewSheet(s => ({ ...s, lines: s.lines.map((l, i) => i === idx ? { ...l, ...field } : l) }));
  }
  function removeNewLine(idx: number) {
    setNewSheet(s => ({ ...s, lines: s.lines.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!newSheet.name.trim()) { toast.error('Enter a flavour name.'); return; }
    if (!newSheet.yield || parseFloat(newSheet.yield) <= 0) { toast.error('Enter batch yield.'); return; }
    for (const l of newSheet.lines) {
      if (!l.qty_per_unit || parseFloat(l.qty_per_unit) <= 0) { toast.error(`Enter qty for ${l.name}.`); return; }
    }
    setSaving(true);
    try {
      const { data: sf, error: sfErr } = await supabase.schema('sales').from('flavours').insert({ name: newSheet.name.trim() }).select('id').single();
      if (sfErr || !sf) throw new Error(sfErr?.message || 'Failed to create sales flavour');
      const { data: pp, error: ppErr } = await supabase.schema('production').from('prep_products')
        .insert({ name: newSheet.name.trim(), batch_yield_l: parseFloat(newSheet.yield), unit: 'l', status: 'active', flavour_id: sf.id })
        .select('id').single();
      if (ppErr || !pp) throw new Error(ppErr?.message || 'Failed to create prep product');
      if (newSheet.lines.length > 0) {
        const { error: rErr } = await supabase.schema('production').from('prep_recipes').insert(
          newSheet.lines.map(l => ({ prep_product_id: pp.id, rm_item_id: l.rm_item_id, qty_per_unit: parseFloat(l.qty_per_unit), purpose: l.purpose }))
        );
        if (rErr) throw new Error(rErr.message);
      }
      await supabase.schema('sales').from('skus').upsert({ sku_code: newSheet.name.trim(), flavour_id: sf.id }, { onConflict: 'sku_code' });
      toast.success(`${newSheet.name} mix sheet saved!`);
      setNewSheet(BLANK);
      setShowAdd(false);
      await loadFlavours();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(id: number) {
    setFlavours(prev => prev.map(f => f.id === id ? {
      ...f, editing: true, expanded: true,
      editName: f.name, editYield: f.batch_yield_l?.toString() || '', editStatus: f.status,
      editRecipes: f.recipes.map(r => ({ ...r, qty_per_unit: r.qty_per_unit.toString(), purpose: (r.purpose || 'mix') as 'mix' | 'topping' })),
      editSearch: '', editShowDrop: false,
    } : f));
  }
  function cancelEdit(id: number) { setFlavours(prev => prev.map(f => f.id === id ? { ...f, editing: false } : f)); }
  function setF(id: number, patch: Partial<Flavour>) { setFlavours(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f)); }
  function addEditLine(id: number, item: RmItem) {
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, editRecipes: [...f.editRecipes, { rm_item_id: item.id, name: item.name, unit: item.unit, qty_per_unit: '', purpose: 'mix' as const }], editSearch: '', editShowDrop: false } : f));
  }
  function updateEditLine(id: number, idx: number, patch: Partial<RecipeLine>) {
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, editRecipes: f.editRecipes.map((l, i) => i === idx ? { ...l, ...patch } : l) } : f));
  }
  function removeEditLine(id: number, idx: number) {
    setFlavours(prev => prev.map(f => f.id === id ? { ...f, editRecipes: f.editRecipes.filter((_, i) => i !== idx) } : f));
  }

  async function handleSaveEdit(f: Flavour) {
    if (!f.editName.trim()) { toast.error('Enter a flavour name.'); return; }
    if (!f.editYield || parseFloat(f.editYield) <= 0) { toast.error('Enter batch yield.'); return; }
    for (const l of f.editRecipes) {
      if (!l.qty_per_unit || parseFloat(l.qty_per_unit) <= 0) { toast.error(`Enter qty for ${l.name}.`); return; }
    }
    setSaving(true);
    try {
      const { error: uErr } = await supabase.schema('production').from('prep_products')
        .update({ name: f.editName.trim(), batch_yield_l: parseFloat(f.editYield), status: f.editStatus }).eq('id', f.id);
      if (uErr) throw new Error(uErr.message);
      await supabase.schema('production').from('prep_recipes').delete().eq('prep_product_id', f.id);
      if (f.editRecipes.length > 0) {
        const { error: rErr } = await supabase.schema('production').from('prep_recipes').insert(
          f.editRecipes.map(l => ({ prep_product_id: f.id, rm_item_id: l.rm_item_id, qty_per_unit: parseFloat(l.qty_per_unit), purpose: l.purpose }))
        );
        if (rErr) throw new Error(rErr.message);
      }
      toast.success('Mix sheet updated!');
      await loadFlavours();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading mix sheets..." />;

  const filtered = flavours
    .filter(f => statusFilter === 'all' ? true : f.status === statusFilter)
    .filter(f => !search.trim() || f.name.toLowerCase().includes(search.toLowerCase()));

  const activeCount = flavours.filter(f => f.status === 'active').length;
  const inactiveCount = flavours.filter(f => f.status === 'inactive').length;

  return (
    <div className="space-y-5">
      <ScreenHeader icon={IceCream} iconColor="text-brand-500" title="Mix Sheets"
        description="Manage flavour formulations — set batch yield and raw material quantities." />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{flavours.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total</p>
        </div>
        <div className="bg-green-50 rounded-2xl px-4 py-3 border border-green-100 text-center">
          <p className="text-2xl font-bold text-green-700">{activeCount}</p>
          <p className="text-xs text-green-600 mt-0.5">Active</p>
        </div>
        <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 text-center">
          <p className="text-2xl font-bold text-gray-500">{inactiveCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Inactive</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => { setShowAdd(s => !s); setNewSheet(BLANK); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-manipulation ${
            showAdd
              ? 'bg-gray-100 text-gray-700'
              : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
          }`}
        >
          {showAdd ? <X size={16} /> : <Plus size={16} />}
          {showAdd ? 'Cancel' : 'New Mix Sheet'}
        </button>

        {/* Status filter pills */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['active', 'all', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-manipulation capitalize ${
                statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              {s === 'all' ? 'All' : s === 'active' ? '● Active' : '○ Inactive'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search flavours..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
        </div>
      </div>

      {/* New Mix Sheet form */}
      {showAdd && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <p className="font-bold text-blue-900">New Mix Sheet</p>
          </div>
          <MixSheetForm
            name={newSheet.name} onName={v => setNewSheet(s => ({ ...s, name: v }))}
            yieldVal={newSheet.yield} onYield={v => setNewSheet(s => ({ ...s, yield: v }))}
            lines={newSheet.lines}
            rmSearch={newSheet.rmSearch} onRmSearch={v => setNewSheet(s => ({ ...s, rmSearch: v, showDrop: true }))}
            showDrop={newSheet.showDrop}
            onRmFocus={() => setNewSheet(s => ({ ...s, showDrop: true }))}
            onRmBlur={() => setTimeout(() => setNewSheet(s => ({ ...s, showDrop: false })), 150)}
            dropItems={filteredRm(newSheet.rmSearch, newSheet.lines)}
            onAddLine={addNewLine}
            onUpdateLine={(i, p) => updateNewLine(i, p)}
            onRemoveLine={removeNewLine}
            onSave={handleSave}
            saving={saving}
            statusEl={null}
          />
        </div>
      )}

      {/* Flavour list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-14 text-gray-400">
          <IceCream size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="font-semibold text-gray-500">
            {flavours.length === 0 ? 'No mix sheets yet' : `No ${statusFilter !== 'all' ? statusFilter : ''} flavours match "${search}"`}
          </p>
          {flavours.length === 0 && <p className="text-sm mt-1">Click "New Mix Sheet" to create the first one.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => {
            const tubs = f.batch_yield_l ? Math.floor(f.batch_yield_l / 4) : 0;
            const mixCount = f.recipes.filter(r => r.purpose === 'mix').length;
            const toppingCount = f.recipes.filter(r => r.purpose === 'topping').length;
            return (
              <div key={f.id} className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${f.expanded ? 'shadow-md border-blue-200' : 'border-gray-100 shadow-sm'}`}>
                {/* Card header */}
                <div className="px-5 py-4 flex items-center gap-3">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${f.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />

                  {/* Main info — clickable to expand */}
                  <button
                    onClick={() => setFlavours(prev => prev.map(x => x.id === f.id ? { ...x, expanded: !x.expanded, editing: false } : x))}
                    className="flex-1 text-left touch-manipulation min-w-0"
                  >
                    <p className="font-bold text-gray-900">{f.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {f.batch_yield_l ? (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                          {formatNumber(f.batch_yield_l)}L → {tubs} × 4L
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-md">No yield set</span>
                      )}
                      {mixCount > 0 && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Beaker size={10} /> {mixCount} mix
                        </span>
                      )}
                      {toppingCount > 0 && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers size={10} /> {toppingCount} topping{toppingCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {f.recipes.length === 0 && (
                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">No recipe</span>
                      )}
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!f.editing && (
                      <button onClick={() => startEdit(f.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors touch-manipulation">
                        <Pencil size={13} /> Edit
                      </button>
                    )}
                    <button onClick={() => setFlavours(prev => prev.map(x => x.id === f.id ? { ...x, expanded: !x.expanded } : x))}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation">
                      {f.expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* View mode */}
                {f.expanded && !f.editing && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    {f.recipes.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No ingredients — click Edit to add ingredients.</p>
                    ) : (
                      <div className="space-y-3">
                        {/* Mix ingredients */}
                        {f.recipes.filter(r => r.purpose === 'mix').length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <Beaker size={11} /> Mix Ingredients
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {f.recipes.filter(r => r.purpose === 'mix').map((r, i) => (
                                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-blue-100">
                                  <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                                  <span className="text-sm font-bold text-blue-800 ml-3 shrink-0">{formatNumber(r.qty_per_unit)} <span className="text-xs font-normal text-gray-400">{r.unit}</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Toppings */}
                        {f.recipes.filter(r => r.purpose === 'topping').length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <Layers size={11} /> Toppings
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {f.recipes.filter(r => r.purpose === 'topping').map((r, i) => (
                                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-amber-100">
                                  <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                                  <span className="text-sm font-bold text-amber-800 ml-3 shrink-0">{formatNumber(r.qty_per_unit)} <span className="text-xs font-normal text-gray-400">{r.unit}</span></span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit mode */}
                {f.expanded && f.editing && (
                  <div className="border-t border-blue-200 bg-blue-50 px-5 py-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                        <Pencil size={12} className="text-white" />
                      </div>
                      <p className="text-sm font-bold text-blue-900">Editing: {f.name}</p>
                    </div>
                    <MixSheetForm
                      name={f.editName} onName={v => setF(f.id, { editName: v })}
                      yieldVal={f.editYield} onYield={v => setF(f.id, { editYield: v })}
                      lines={f.editRecipes}
                      rmSearch={f.editSearch} onRmSearch={v => setF(f.id, { editSearch: v, editShowDrop: true })}
                      showDrop={f.editShowDrop}
                      onRmFocus={() => setF(f.id, { editShowDrop: true })}
                      onRmBlur={() => setTimeout(() => setF(f.id, { editShowDrop: false }), 150)}
                      dropItems={filteredRm(f.editSearch, f.editRecipes)}
                      onAddLine={item => addEditLine(f.id, item)}
                      onUpdateLine={(i, p) => updateEditLine(f.id, i, p)}
                      onRemoveLine={i => removeEditLine(f.id, i)}
                      onSave={() => handleSaveEdit(f)}
                      saving={saving}
                      statusEl={
                        <div className="flex gap-2">
                          {(['active', 'inactive'] as const).map(s => (
                            <button key={s} onClick={() => setF(f.id, { editStatus: s })}
                              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors touch-manipulation ${
                                f.editStatus === s
                                  ? s === 'active' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-500 text-white border-gray-500'
                                  : 'bg-white text-gray-500 border-gray-200'
                              }`}>
                              {s === 'active' ? '● Active' : '○ Inactive'}
                            </button>
                          ))}
                        </div>
                      }
                      cancelEl={
                        <button onClick={() => cancelEdit(f.id)}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-white touch-manipulation">
                          <X size={14} /> Cancel
                        </button>
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shared form ──────────────────────────────────────────────────────────────
interface MixSheetFormProps {
  name: string; onName: (v: string) => void;
  yieldVal: string; onYield: (v: string) => void;
  lines: RecipeLine[];
  rmSearch: string; onRmSearch: (v: string) => void;
  showDrop: boolean; onRmFocus: () => void; onRmBlur: () => void;
  dropItems: RmItem[];
  onAddLine: (item: RmItem) => void;
  onUpdateLine: (idx: number, patch: Partial<RecipeLine>) => void;
  onRemoveLine: (idx: number) => void;
  onSave: () => void;
  saving: boolean;
  statusEl: React.ReactNode;
  cancelEl?: React.ReactNode;
}

function MixSheetForm({ name, onName, yieldVal, onYield, lines, rmSearch, onRmSearch, showDrop, onRmFocus, onRmBlur, dropItems, onAddLine, onUpdateLine, onRemoveLine, onSave, saving, statusEl, cancelEl }: MixSheetFormProps) {
  const yieldNum = parseFloat(yieldVal) || 0;
  return (
    <div className="space-y-4">
      {/* Name + Yield */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label-text block mb-1">Flavour Name</label>
          <input type="text" value={name} onChange={e => onName(e.target.value)} placeholder="e.g. Mango" className="input-field bg-white" />
        </div>
        <div>
          <label className="label-text block mb-1">Batch Yield (Litres)</label>
          <input type="number" min="0" step="0.5" value={yieldVal} onChange={e => onYield(e.target.value)} placeholder="e.g. 20" className="input-field bg-white" />
          {yieldNum > 0 && (
            <p className="text-xs text-green-700 mt-1 font-medium">= {Math.floor(yieldNum / 4)} × 4L bulk tubs per batch</p>
          )}
        </div>
      </div>

      {statusEl && <div><label className="label-text block mb-1">Status</label>{statusEl}</div>}

      {/* Ingredient rows */}
      <div>
        <label className="label-text block mb-2">Raw Materials per Batch</label>
        {lines.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {lines.map((l, idx) => (
              <div key={`${l.rm_item_id}-${idx}`} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{l.name}</p>
                </div>
                {/* Purpose toggle */}
                <div className="flex gap-1 shrink-0">
                  {(['mix', 'topping'] as const).map(p => (
                    <button key={p} onClick={() => onUpdateLine(idx, { purpose: p })}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all touch-manipulation ${
                        l.purpose === p
                          ? p === 'mix' ? 'bg-blue-600 text-white border-blue-600' : 'bg-amber-500 text-white border-amber-500'
                          : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                      {p === 'mix' ? 'Mix' : 'Top'}
                    </button>
                  ))}
                </div>
                {/* Qty */}
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" min="0" step="0.1" value={l.qty_per_unit}
                    onChange={e => onUpdateLine(idx, { qty_per_unit: e.target.value })}
                    placeholder="0" className="input-field text-sm py-1.5 text-right w-20 bg-white" />
                  <span className="text-xs text-gray-400 w-8 shrink-0">{l.unit}</span>
                </div>
                <button onClick={() => onRemoveLine(idx)} className="text-red-400 hover:text-red-600 touch-manipulation p-1 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {lines.length === 0 && (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl px-4 py-5 text-center mb-2">
            <p className="text-sm text-gray-400">No ingredients yet — search below to add</p>
          </div>
        )}

        {/* Search to add */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search ingredient to add..." className="input-field pl-9 text-sm bg-white"
            value={rmSearch} onChange={e => onRmSearch(e.target.value)}
            onFocus={onRmFocus} onBlur={onRmBlur} />
          {showDrop && rmSearch && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 z-20 overflow-hidden">
              {dropItems.length === 0
                ? <p className="p-4 text-sm text-gray-400">No results — add the ingredient in Manage Ingredients first</p>
                : dropItems.map(i => (
                  <button key={i.id} className="flex items-center justify-between w-full px-4 py-3 hover:bg-blue-50 text-left touch-manipulation border-b border-gray-50 last:border-0"
                    onMouseDown={() => onAddLine(i)}>
                    <span className="font-medium text-gray-900 text-sm">{i.name}</span>
                    <span className="text-gray-400 text-xs">{i.unit}</span>
                  </button>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Save row */}
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 touch-manipulation disabled:opacity-60 shadow-sm">
          <Check size={15} />
          {saving ? 'Saving...' : 'Save Mix Sheet'}
        </button>
        {cancelEl}
      </div>
    </div>
  );
}
