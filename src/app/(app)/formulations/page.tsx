'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FlaskConical, Search, Beaker, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface RecipeIngredient {
  rm_item_id: number;
  name: string;
  unit: string;
  qty_per_unit: number;
  purpose: string;
}

interface PrepFormulation {
  id: number;
  name: string;
  batch_yield_l: number | null;
  unit: string;
  ingredients: RecipeIngredient[];
  expanded: boolean;
}

function fmt(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(n < 1 ? 3 : 2).replace(/\.?0+$/, '');
}

export default function FormulationsPage() {
  const supabase = createClient();
  const [formulations, setFormulations] = useState<PrepFormulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const [prodsRes, recipesRes] = await Promise.all([
        supabase.schema('production').from('prep_products')
          .select('id, name, unit, batch_yield_l')
          .eq('status', 'active')
          .order('name'),
        supabase.schema('production').from('prep_recipes')
          .select('prep_product_id, rm_item_id, qty_per_unit, purpose, rm_items(name, unit)'),
      ]);

      const recipeMap = new Map<number, RecipeIngredient[]>();
      for (const r of (recipesRes.data || []) as Record<string, unknown>[]) {
        const pid = r.prep_product_id as number;
        const item = r.rm_items as Record<string, unknown> | null;
        if (!recipeMap.has(pid)) recipeMap.set(pid, []);
        recipeMap.get(pid)!.push({
          rm_item_id: r.rm_item_id as number,
          name: (item?.name as string) || `RM #${r.rm_item_id}`,
          unit: (item?.unit as string) || '',
          qty_per_unit: (r.qty_per_unit as number) || 0,
          purpose: (r.purpose as string) || 'mix',
        });
      }

      setFormulations((prodsRes.data || []).map((p: Record<string, unknown>) => ({
        id: p.id as number,
        name: p.name as string,
        batch_yield_l: p.batch_yield_l as number | null,
        unit: (p.unit as string) || 'L',
        ingredients: recipeMap.get(p.id as number) || [],
        expanded: false,
      })));
      setLoading(false);
    }
    load();
  }, [supabase]);

  function toggle(id: number) {
    setFormulations(prev => prev.map(f => f.id === id ? { ...f, expanded: !f.expanded } : f));
  }

  const filtered = search
    ? formulations.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : formulations;

  if (loading) return <LoadingSpinner text="Loading formulations..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={FlaskConical} iconColor="text-purple-500"
        title="Formulations"
        description="Quick reference for all active kitchen mixes — tap any card to see the full recipe."
      />

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search flavour..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400 font-medium px-1">{filtered.length} of {formulations.length} flavours</p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-14 text-gray-400">
          <FlaskConical size={32} className="mx-auto mb-2 text-gray-200" />
          <p>No formulations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => {
            const mixItems = f.ingredients.filter(i => i.purpose === 'mix');
            const toppingItems = f.ingredients.filter(i => i.purpose === 'topping');
            const tubs = f.batch_yield_l ? Math.floor(f.batch_yield_l / 4) : 0;

            return (
              <div key={f.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${f.expanded ? 'border-purple-200 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                {/* Header */}
                <button
                  onClick={() => toggle(f.id)}
                  className="w-full flex items-center gap-4 px-4 py-4 text-left touch-manipulation"
                >
                  {/* Colour dot for expanded state */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${f.expanded ? 'bg-purple-600' : 'bg-purple-100'}`}>
                    <FlaskConical size={16} className={f.expanded ? 'text-white' : 'text-purple-600'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-[15px]">{f.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {f.batch_yield_l && (
                        <span className="text-xs text-gray-500">
                          {f.batch_yield_l}{f.unit} → {tubs} × 4L
                        </span>
                      )}
                      {mixItems.length > 0 && (
                        <span className="text-xs font-medium text-blue-600 flex items-center gap-0.5">
                          <Beaker size={10} /> {mixItems.length} mix
                        </span>
                      )}
                      {toppingItems.length > 0 && (
                        <span className="text-xs font-medium text-amber-600 flex items-center gap-0.5">
                          <Layers size={10} /> {toppingItems.length} topping{toppingItems.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {f.ingredients.length === 0 && (
                        <span className="text-xs text-red-400">No recipe</span>
                      )}
                    </div>
                  </div>

                  {f.expanded
                    ? <ChevronUp size={16} className="text-purple-400 shrink-0" />
                    : <ChevronDown size={16} className="text-gray-300 shrink-0" />}
                </button>

                {/* Expanded recipe */}
                {f.expanded && (
                  <div className="border-t border-purple-100 bg-purple-50 px-4 py-4 space-y-4">
                    {f.ingredients.length === 0 ? (
                      <p className="text-sm text-gray-400 italic text-center py-2">No ingredients configured yet.</p>
                    ) : (
                      <>
                        {/* Mix section */}
                        {mixItems.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Beaker size={11} /> Mix — per batch
                            </p>
                            <div className="space-y-1">
                              {mixItems.map(ing => (
                                <div key={ing.rm_item_id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-blue-100">
                                  <p className="text-sm font-semibold text-gray-800">{ing.name}</p>
                                  <div className="text-right shrink-0 ml-4">
                                    <span className="text-base font-bold text-blue-700">{fmt(ing.qty_per_unit)}</span>
                                    <span className="text-xs text-gray-400 ml-1">{ing.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Toppings section */}
                        {toppingItems.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Layers size={11} /> Toppings — per batch
                            </p>
                            <div className="space-y-1">
                              {toppingItems.map(ing => (
                                <div key={ing.rm_item_id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-amber-100">
                                  <p className="text-sm font-semibold text-gray-800">{ing.name}</p>
                                  <div className="text-right shrink-0 ml-4">
                                    <span className="text-base font-bold text-amber-700">{fmt(ing.qty_per_unit)}</span>
                                    <span className="text-xs text-gray-400 ml-1">{ing.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
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
