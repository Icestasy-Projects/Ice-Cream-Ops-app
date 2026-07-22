'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Plus, ChevronDown, ChevronUp, Package, Search } from 'lucide-react';

interface Category { id: number; name: string; }
interface RmItem {
  id: number;
  name: string;
  unit: string;
  category_id: number | null;
  category_name: string;
  is_stockable: boolean;
  reorder_point: number | null;
  par_qty: number | null;
  expanded: boolean;
}

const COMMON_UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'pack', 'dozen'];

export default function RmItemsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<RmItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [customUnit, setCustomUnit] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCatName, setNewCatName] = useState('');

  const load = useCallback(async () => {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.schema('production').from('rm_items')
        .select('id, name, unit, category_id, is_stockable, reorder_level, status')
        .order('name'),
      supabase.schema('production').from('rm_categories').select('id, name').order('name'),
    ]);
    const catMap = new Map<number, string>(
      (catsRes.data || []).map((c: Record<string, unknown>) => [c.id as number, c.name as string])
    );
    setCategories((catsRes.data || []).map((c: Record<string, unknown>) => ({ id: c.id as number, name: c.name as string })));
    setItems((itemsRes.data || []).map((r: Record<string, unknown>) => ({
      id: r.id as number,
      name: r.name as string,
      unit: r.unit as string,
      category_id: r.category_id as number | null,
      category_name: catMap.get(r.category_id as number) || 'Uncategorised',
      is_stockable: r.is_stockable as boolean,
      reorder_point: r.reorder_level as number | null,
      par_qty: null,
      expanded: false,
    })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, expanded: !i.expanded } : i));
  }

  async function handleSave() {
    const trimName = name.trim();
    if (!trimName) { toast.error('Enter ingredient name.'); return; }
    const finalUnit = unit === '__custom__' ? customUnit.trim() : unit;
    if (!finalUnit) { toast.error('Enter a unit.'); return; }

    setSaving(true);
    try {
      let catId: number | null = categoryId ? parseInt(categoryId) : null;

      // Create new category if needed
      if (categoryId === '__new__') {
        if (!newCatName.trim()) { toast.error('Enter new category name.'); setSaving(false); return; }
        const { data: newCat, error: catErr } = await supabase.schema('production').from('rm_categories')
          .insert({ name: newCatName.trim() }).select('id').single();
        if (catErr || !newCat) throw new Error(catErr?.message || 'Failed to create category');
        catId = newCat.id;
      }

      const { error } = await supabase.schema('production').from('rm_items').insert({
        name: trimName,
        unit: finalUnit,
        category_id: catId,
        is_stockable: true,
        reorder_level: 0,
        status: 'active',
      });
      if (error) throw new Error(error.message);

      toast.success(`${trimName} added!`);
      setName(''); setUnit('kg'); setCustomUnit(''); setCategoryId('');
      setNewCatName('');
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
      <ScreenHeader
        icon={Package} iconColor="text-orange-500"
        title="Manage Ingredients"
        description="Add raw material ingredients used in flavour recipes and purchase orders."
      />

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search ingredient or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
        />
      </div>

      <button onClick={() => setShowAdd(s => !s)} className="btn-primary flex items-center gap-2">
        <Plus size={18} />
        {showAdd ? 'Cancel' : 'Add New Ingredient'}
      </button>

      {showAdd && (
        <div className="card space-y-4">
          <h2 className="section-title">New Ingredient</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-1">Ingredient Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mango Pulp"
                className="input-field"
                autoFocus
              />
            </div>
            <div>
              <label className="label-text block mb-1">Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="input-field">
                {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                <option value="__custom__">Other (type below)</option>
              </select>
              {unit === '__custom__' && (
                <input
                  type="text"
                  value={customUnit}
                  onChange={e => setCustomUnit(e.target.value)}
                  placeholder="e.g. litre, tin..."
                  className="input-field mt-2"
                />
              )}
            </div>
          </div>

          <div>
            <label className="label-text block mb-1">Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-field">
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Create new category</option>
            </select>
            {categoryId === '__new__' && (
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="New category name..."
                className="input-field mt-2"
              />
            )}
          </div>


          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : '✓ Add Ingredient'}
          </button>
        </div>
      )}

      {/* Grouped list */}
      <div className="space-y-3">
        {groupEntries.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">🌿</p>
            <p className="font-semibold text-gray-600">No ingredients yet</p>
            <p className="text-sm mt-1">Add your first ingredient above.</p>
          </div>
        ) : groupEntries.map(([cat, catItems]) => (
          <div key={cat} className="card p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{cat}</p>
              <span className="text-xs text-gray-400">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
            </div>
            {catItems.map((item, idx) => (
              <div key={item.id}>
                <button
                  onClick={() => toggle(item.id)}
                  className={`w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left touch-manipulation hover:bg-orange-50 transition-colors ${idx < catItems.length - 1 && !item.expanded ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.unit}{item.reorder_point ? ` · Reorder at ${item.reorder_point}` : ''}</p>
                    </div>
                  </div>
                  {item.expanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>
                {item.expanded && (
                  <div className="px-5 pb-4 pt-2 border-t border-gray-50 bg-orange-50/30 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Unit</p>
                      <p className="text-sm font-semibold text-gray-900">{item.unit}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="text-sm font-semibold text-gray-900">{item.category_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Reorder Point</p>
                      <p className="text-sm font-semibold text-gray-900">{item.reorder_point != null ? `${item.reorder_point} ${item.unit}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Par Qty</p>
                      <p className="text-sm font-semibold text-gray-900">{item.par_qty != null ? `${item.par_qty} ${item.unit}` : '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
