'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, ChevronDown, ChevronUp, Package, Search, Pencil, Trash2, Check, X } from 'lucide-react';

interface Category { id: number; name: string; }
interface RmItem {
  id: number;
  name: string;
  unit: string;
  category_id: number | null;
  category_name: string;
  is_stockable: boolean;
  reorder_point: number | null;
  expanded: boolean;
  editing: boolean;
}

const COMMON_UNITS = ['kg', 'g', 'l', 'ml', 'pcs', 'box', 'pack', 'dozen'];

const BLANK_FORM = { name: '', unit: 'kg', customUnit: '', categoryId: '', newCatName: '' };

export default function RmItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<RmItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Add form
  const [form, setForm] = useState(BLANK_FORM);

  // Edit state per item
  const [editState, setEditState] = useState<Record<number, { name: string; unit: string; customUnit: string; categoryId: string }>>({});

  const load = useCallback(async () => {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.schema('production').from('rm_items').select('id, name, unit, category_id, is_stockable, reorder_level').order('name'),
      supabase.schema('production').from('rm_categories').select('id, name').order('name'),
    ]);
    const catMap = new Map<number, string>((catsRes.data || []).map((c: Record<string, unknown>) => [c.id as number, c.name as string]));
    setCategories((catsRes.data || []).map((c: Record<string, unknown>) => ({ id: c.id as number, name: c.name as string })));
    setItems((itemsRes.data || []).map((r: Record<string, unknown>) => ({
      id: r.id as number,
      name: r.name as string,
      unit: r.unit as string,
      category_id: r.category_id as number | null,
      category_name: catMap.get(r.category_id as number) || 'Uncategorised',
      is_stockable: r.is_stockable as boolean,
      reorder_point: r.reorder_level as number | null,
      expanded: false,
      editing: false,
    })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, expanded: !i.expanded, editing: false } : i));
  }

  function startEdit(item: RmItem) {
    setEditState(prev => ({
      ...prev,
      [item.id]: {
        name: item.name,
        unit: COMMON_UNITS.includes(item.unit) ? item.unit : '__custom__',
        customUnit: COMMON_UNITS.includes(item.unit) ? '' : item.unit,
        categoryId: item.category_id?.toString() || '',
      },
    }));
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, editing: true, expanded: true } : i));
  }

  function cancelEdit(id: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, editing: false } : i));
  }

  async function handleSaveEdit(id: number) {
    const es = editState[id];
    if (!es) return;
    const trimName = es.name.trim();
    if (!trimName) { toast.error('Enter ingredient name.'); return; }
    const finalUnit = es.unit === '__custom__' ? es.customUnit.trim() : es.unit;
    if (!finalUnit) { toast.error('Enter a unit.'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.schema('production').from('rm_items').update({
        name: trimName,
        unit: finalUnit,
        category_id: es.categoryId ? parseInt(es.categoryId) : null,
      }).eq('id', id);
      if (error) throw new Error(error.message);
      toast.success('Ingredient updated!');
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone and will remove it from any recipes.`)) return;
    setDeleting(id);
    try {
      await supabase.schema('production').from('prep_recipes').delete().eq('rm_item_id', id);
      await supabase.schema('production').from('rm_costs').delete().eq('rm_item_id', id);
      const { error } = await supabase.schema('production').from('rm_items').delete().eq('id', id);
      if (error) throw new Error(error.message);
      toast.success(`${name} deleted.`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(null);
    }
  }

  async function handleAdd() {
    const trimName = form.name.trim();
    if (!trimName) { toast.error('Enter ingredient name.'); return; }
    const finalUnit = form.unit === '__custom__' ? form.customUnit.trim() : form.unit;
    if (!finalUnit) { toast.error('Enter a unit.'); return; }

    setSaving(true);
    try {
      let catId: number | null = form.categoryId ? parseInt(form.categoryId) : null;
      if (form.categoryId === '__new__') {
        if (!form.newCatName.trim()) { toast.error('Enter new category name.'); setSaving(false); return; }
        const { data: newCat, error: catErr } = await supabase.schema('production').from('rm_categories')
          .insert({ name: form.newCatName.trim() }).select('id').single();
        if (catErr || !newCat) throw new Error(catErr?.message || 'Failed to create category');
        catId = newCat.id;
      }
      const { error } = await supabase.schema('production').from('rm_items').insert({
        name: trimName, unit: finalUnit, category_id: catId, is_stockable: true, reorder_level: 0, status: 'active',
      });
      if (error) throw new Error(error.message);
      toast.success(`${trimName} added!`);
      setForm(BLANK_FORM);
      setShowAdd(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const q = search.toLowerCase();
  const filtered = q ? items.filter(i => i.name.toLowerCase().includes(q) || i.category_name.toLowerCase().includes(q)) : items;
  const grouped: Record<string, RmItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.category_name]) grouped[item.category_name] = [];
    grouped[item.category_name].push(item);
  }
  const groupEntries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  if (loading) return <LoadingSpinner text="Loading ingredients..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader icon={Package} iconColor="text-orange-500" title="Manage Ingredients"
        description="Add raw material ingredients used in flavour recipes and purchase orders." />

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search ingredient or category..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
      </div>

      <button onClick={() => setShowAdd(s => !s)} className="btn-primary flex items-center gap-2 w-full justify-center">
        <Plus size={18} />
        {showAdd ? 'Cancel' : 'Add New Ingredient'}
      </button>

      {showAdd && (
        <div className="card space-y-4">
          <h2 className="section-title">New Ingredient</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-1">Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mango Pulp" className="input-field" autoFocus />
            </div>
            <div>
              <label className="label-text block mb-1">Unit</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="input-field">
                {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                <option value="__custom__">Other...</option>
              </select>
              {form.unit === '__custom__' && (
                <input type="text" value={form.customUnit} onChange={e => setForm(f => ({ ...f, customUnit: e.target.value }))}
                  placeholder="e.g. tin" className="input-field mt-2" />
              )}
            </div>
          </div>
          <div>
            <label className="label-text block mb-1">Category</label>
            <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="input-field">
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Create new category</option>
            </select>
            {form.categoryId === '__new__' && (
              <input type="text" value={form.newCatName} onChange={e => setForm(f => ({ ...f, newCatName: e.target.value }))}
                placeholder="New category name..." className="input-field mt-2" />
            )}
          </div>
          <button onClick={handleAdd} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : '✓ Add Ingredient'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {groupEntries.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🌿</p>
            <p className="font-semibold text-gray-600">No ingredients yet</p>
          </div>
        ) : groupEntries.map(([cat, catItems]) => (
          <div key={cat} className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{cat}</p>
              <span className="text-xs text-gray-400">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
            </div>
            {catItems.map((item, idx) => {
              const es = editState[item.id];
              return (
                <div key={item.id} className={idx < catItems.length - 1 ? 'border-b border-gray-50' : ''}>
                  {/* Row */}
                  <div className="px-5 py-3.5 flex items-center gap-3">
                    <button onClick={() => toggle(item.id)} className="flex items-center gap-3 flex-1 text-left touch-manipulation hover:opacity-80">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Package size={14} className="text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.unit}</p>
                      </div>
                    </button>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(item)}
                        className="p-2 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 touch-manipulation">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.name)} disabled={deleting === item.id}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 touch-manipulation disabled:opacity-40">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => toggle(item.id)} className="p-1 touch-manipulation">
                        {item.expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: view or edit */}
                  {item.expanded && !item.editing && (
                    <div className="px-5 pb-4 pt-2 border-t border-gray-50 bg-orange-50/30 grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-gray-400">Unit</p><p className="text-sm font-semibold text-gray-900">{item.unit}</p></div>
                      <div><p className="text-xs text-gray-400">Category</p><p className="text-sm font-semibold text-gray-900">{item.category_name}</p></div>
                      <div><p className="text-xs text-gray-400">Reorder Point</p><p className="text-sm font-semibold text-gray-900">{item.reorder_point != null ? `${item.reorder_point} ${item.unit}` : '—'}</p></div>
                    </div>
                  )}

                  {item.expanded && item.editing && es && (
                    <div className="px-5 pb-4 pt-3 border-t border-gray-100 bg-orange-50/30 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="label-text block mb-1">Name</label>
                          <input type="text" value={es.name} onChange={e => setEditState(prev => ({ ...prev, [item.id]: { ...prev[item.id], name: e.target.value } }))}
                            className="input-field" />
                        </div>
                        <div>
                          <label className="label-text block mb-1">Unit</label>
                          <select value={es.unit} onChange={e => setEditState(prev => ({ ...prev, [item.id]: { ...prev[item.id], unit: e.target.value } }))} className="input-field">
                            {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            <option value="__custom__">Other...</option>
                          </select>
                          {es.unit === '__custom__' && (
                            <input type="text" value={es.customUnit} onChange={e => setEditState(prev => ({ ...prev, [item.id]: { ...prev[item.id], customUnit: e.target.value } }))}
                              placeholder="e.g. tin" className="input-field mt-2" />
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="label-text block mb-1">Category</label>
                        <select value={es.categoryId} onChange={e => setEditState(prev => ({ ...prev, [item.id]: { ...prev[item.id], categoryId: e.target.value } }))} className="input-field">
                          <option value="">No category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(item.id)} disabled={saving}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                          <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => cancelEdit(item.id)}
                          className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
