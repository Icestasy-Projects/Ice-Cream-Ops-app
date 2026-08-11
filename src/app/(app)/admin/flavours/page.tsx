'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { Plus, Trash2, Pencil, Check, X, Search, IceCream, ChevronDown, ChevronUp } from 'lucide-react';

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

// Blank mix sheet state for the "new flavour" form
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

  function filteredRm(q: string, lines: RecipeLine[]) {
    const both = new Set(
      rmItems.filter(r =>
        lines.some(l => l.rm_item_id === r.id && l.purpose === 'mix') &&
        lines.some(l => l.rm_item_id === r.id && l.purpose === 'topping')
      ).map(r => r.id)
    );
    return rmItems.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) && !both.has(r.id)).slice(0, 8);
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

  // ── New sheet handlers ──────────────────────────────────────────────────
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

      // Create sales.skus entry so it's immediately linked in SKU alignment
      await supabase.schema('sales').from('skus')
        .upsert({ sku_code: newSheet.name.trim(), flavour_id: sf.id }, { onConflict: 'sku_code' });

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

  // ── Edit handlers ───────────────────────────────────────────────────────
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

  const filtered = search.trim() ? flavours.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : flavours;

  return (
    <div className="space-y-4">
      <ScreenHeader icon={IceCream} iconColor="text-brand-500" title="Mix Sheets" description="Each flavour's batch yield and raw material requirements." />

      <div className="flex gap-3 flex-wrap">
        <button onClick={() => { setShowAdd(s => !s); setNewSheet(BLANK); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          {showAdd ? 'Cancel' : 'New Mix Sheet'}
        </button>
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search flavours..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
        </div>
      </div>

      {/* ── New Mix Sheet Form ── */}
      {showAdd && (
        <MixSheetForm
          title="New Mix Sheet"
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
      )}

      {/* ── Existing Mix Sheets ── */}
      <div className="space-y-2">
        {flavours.length === 0 && (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🍨</p>
            <p className="font-semibold text-gray-600">No mix sheets yet</p>
            <p className="text-sm mt-1">Create your first one above.</p>
          </div>
        )}
        {filtered.length === 0 && flavours.length > 0 && (
          <div className="card text-center py-8 text-gray-400">
            <p className="text-sm">No flavours match &ldquo;{search}&rdquo;</p>
          </div>
        )}
        {filtered.map(f => {
          const tubs = f.batch_yield_l ? Math.floor(f.batch_yield_l / 4) : 0;
          return (
            <div key={f.id} className="card p-0 overflow-hidden">
              {/* Sheet header */}
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <button onClick={() => setFlavours(prev => prev.map(x => x.id === f.id ? { ...x, expanded: !x.expanded, editing: false } : x))}
                  className="flex-1 text-left touch-manipulation">
                  <p className="font-bold text-gray-900 text-base">{f.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.batch_yield_l ? `${formatNumber(f.batch_yield_l)}L → ${tubs} × 4L tubs` : 'No yield set'}
                    {' · '}{f.recipes.filter(r => r.purpose === 'mix').length} mix ingredient{f.recipes.filter(r => r.purpose === 'mix').length !== 1 ? 's' : ''}
                    {f.recipes.some(r => r.purpose === 'topping') ? ` · ${f.recipes.filter(r => r.purpose === 'topping').length} topping${f.recipes.filter(r => r.purpose === 'topping').length !== 1 ? 's' : ''}` : ''}
                    {f.status !== 'active' ? ' · Inactive' : ''}
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {!f.editing && (
                    <button onClick={() => startEdit(f.id)} className="p-2 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 touch-manipulation">
                      <Pencil size={15} />
                    </button>
                  )}
                  <button onClick={() => setFlavours(prev => prev.map(x => x.id === f.id ? { ...x, expanded: !x.expanded } : x))} className="p-1 touch-manipulation">
                    {f.expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* View mode */}
              {f.expanded && !f.editing && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  {f.recipes.length === 0 ? (
                    <p className="text-sm text-gray-400">No ingredients defined — click ✏️ to add.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                          <th className="text-left py-2 pr-3">Ingredient</th>
                          <th className="text-left py-2 pr-3">Purpose</th>
                          <th className="text-right py-2">Per batch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {f.recipes.map((r, i) => (
                          <tr key={`${r.rm_item_id}-${r.purpose}-${i}`} className="border-b border-gray-50 last:border-0">
                            <td className="py-2.5 pr-3 text-gray-800 font-medium">{r.name}</td>
                            <td className="py-2.5 pr-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.purpose === 'topping' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {r.purpose === 'topping' ? 'Topping' : 'Mix'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-bold text-gray-900">{formatNumber(r.qty_per_unit)} {r.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Edit mode */}
              {f.expanded && f.editing && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  <MixSheetForm
                    title="Edit Mix Sheet"
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
                      <div className="flex gap-3">
                        {['active', 'inactive'].map(s => (
                          <button key={s} onClick={() => setF(f.id, { editStatus: s })}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors touch-manipulation ${
                              f.editStatus === s
                                ? s === 'active' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-600 text-white border-gray-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}>
                            {s === 'active' ? '✓ Active' : '✗ Inactive'}
                          </button>
                        ))}
                      </div>
                    }
                    cancelEl={
                      <button onClick={() => cancelEdit(f.id)}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 touch-manipulation">
                        <X size={16} /> Cancel
                      </button>
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared mix-sheet form component ────────────────────────────────────────
interface MixSheetFormProps {
  title: string;
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

function MixSheetForm({ title, name, onName, yieldVal, onYield, lines, rmSearch, onRmSearch, showDrop, onRmFocus, onRmBlur, dropItems, onAddLine, onUpdateLine, onRemoveLine, onSave, saving, statusEl, cancelEl }: MixSheetFormProps) {
  const yieldNum = parseFloat(yieldVal) || 0;
  return (
    <div className="space-y-5">
      {title && <p className="text-xs font-bold text-brand-600 uppercase tracking-wide">{title}</p>}

      {/* Name + Yield */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label-text block mb-1">Flavour Name</label>
          <input type="text" value={name} onChange={e => onName(e.target.value)} placeholder="e.g. Mango" className="input-field" />
        </div>
        <div>
          <label className="label-text block mb-1">Batch Yield (Litres)</label>
          <input type="number" min="0" step="0.5" value={yieldVal} onChange={e => onYield(e.target.value)} placeholder="e.g. 20" className="input-field" />
          {yieldNum > 0 && <p className="text-xs text-green-700 mt-1">= {Math.floor(yieldNum / 4)} × 4L bulk tubs per batch</p>}
        </div>
      </div>

      {statusEl && <div><label className="label-text block mb-1">Status</label>{statusEl}</div>}

      {/* Ingredient table */}
      <div>
        <label className="label-text block mb-2">Raw Materials per Batch</label>

        {lines.length > 0 && (
          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left py-2 pr-2">Ingredient</th>
                <th className="text-left py-2 pr-2">Purpose</th>
                <th className="text-right py-2 pr-2 w-28">Qty per batch</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={`${l.rm_item_id}-${l.purpose}-${idx}`} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-2 font-medium text-gray-800">{l.name}</td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-1">
                      {(['mix', 'topping'] as const).map(p => (
                        <button key={p} onClick={() => onUpdateLine(idx, { purpose: p })}
                          className={`px-2 py-0.5 rounded-md text-xs font-semibold border transition-colors touch-manipulation ${
                            l.purpose === p
                              ? p === 'mix' ? 'bg-blue-600 text-white border-blue-600' : 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}>
                          {p === 'mix' ? 'Mix' : 'Topping'}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-1 justify-end">
                      <input type="number" min="0" step="0.1" value={l.qty_per_unit}
                        onChange={e => onUpdateLine(idx, { qty_per_unit: e.target.value })}
                        placeholder="0" className="input-field text-sm py-1.5 text-right w-20" />
                      <span className="text-xs text-gray-400 w-6 shrink-0">{l.unit}</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <button onClick={() => onRemoveLine(idx)} className="text-red-400 hover:text-red-600 touch-manipulation p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add ingredient search */}
        <div className="relative">
          <input type="text" placeholder="+ Add ingredient..." className="input-field text-sm"
            value={rmSearch} onChange={e => onRmSearch(e.target.value)}
            onFocus={onRmFocus} onBlur={onRmBlur} />
          {showDrop && rmSearch && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 z-20 overflow-hidden">
              {dropItems.length === 0
                ? <p className="p-4 text-sm text-gray-400">No results — add the ingredient in Manage Ingredients first</p>
                : dropItems.map(i => (
                  <button key={i.id} className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 text-left touch-manipulation border-b border-gray-50 last:border-0"
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
      <div className="flex gap-3">
        <button onClick={onSave} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 touch-manipulation disabled:opacity-60">
          <Check size={16} />
          {saving ? 'Saving...' : 'Save Mix Sheet'}
        </button>
        {cancelEl}
      </div>
    </div>
  );
}
