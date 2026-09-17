'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FlaskConical, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface RecipeIngredient {
  rm_item_id: number;
  name: string;
  unit: string;
  qty_per_unit: number;
}

interface PrepFormulation {
  id: number;
  name: string;
  batch_yield_l: number | null;
  unit: string;
  flavour_name: string | null;
  ingredients: RecipeIngredient[];
  expanded: boolean;
}

export default function FormulationsPage() {
  const supabase = createClient();
  const [formulations, setFormulations] = useState<PrepFormulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const [prodsRes, recipesRes, flavoursRes] = await Promise.all([
        supabase.schema('production').from('prep_products')
          .select('id, name, unit, batch_yield_l, flavour_id')
          .eq('status', 'active')
          .order('name'),
        supabase.schema('production').from('prep_recipes')
          .select('prep_product_id, rm_item_id, qty_per_unit, rm_items(name, unit)'),
        supabase.schema('sales').from('flavours')
          .select('id, name'),
      ]);

      const flavourMap = new Map<number, string>();
      for (const f of (flavoursRes.data || []) as Record<string, unknown>[]) {
        flavourMap.set(f.id as number, f.name as string);
      }

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
        });
      }

      setFormulations((prodsRes.data || []).map((p: Record<string, unknown>) => ({
        id: p.id as number,
        name: p.name as string,
        batch_yield_l: p.batch_yield_l as number | null,
        unit: (p.unit as string) || 'L',
        flavour_name: p.flavour_id ? (flavourMap.get(p.flavour_id as number) ?? null) : null,
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
    ? formulations.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.flavour_name?.toLowerCase().includes(search.toLowerCase()))
      )
    : formulations;

  if (loading) return <LoadingSpinner text="Loading formulations..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={FlaskConical} iconColor="text-purple-500"
        title="Formulations"
        description="All active prep product recipes. Tap a card to see the full ingredient list."
      />

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or flavour..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-purple-600">{formulations.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active Products</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-blue-600">{formulations.filter(f => f.ingredients.length > 0).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">With Recipes</p>
        </div>
        <div className="card text-center py-3 col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-orange-500">{formulations.filter(f => f.ingredients.length === 0).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Missing Recipe</p>
        </div>
      </div>

      {/* Formulation cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <FlaskConical size={32} className="mx-auto mb-2 text-gray-200" />
          <p>No formulations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <div key={f.id} className="card p-0 overflow-hidden">
              {/* Header — always visible */}
              <button
                onClick={() => toggle(f.id)}
                className="w-full flex items-center gap-4 px-4 py-4 text-left touch-manipulation hover:bg-orange-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <FlaskConical size={18} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{f.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {f.flavour_name && (
                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full">
                        {f.flavour_name}
                      </span>
                    )}
                    {f.batch_yield_l && (
                      <span className="text-xs text-gray-500">{f.batch_yield_l} {f.unit}/batch</span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      f.ingredients.length === 0
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {f.ingredients.length === 0 ? 'No recipe' : `${f.ingredients.length} ingredients`}
                    </span>
                  </div>
                </div>
                {f.expanded ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
              </button>

              {/* Expanded ingredient list */}
              {f.expanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                  {f.ingredients.length === 0 ? (
                    <p className="text-sm text-red-500 italic">No ingredients configured for this product.</p>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                        Ingredients per batch {f.batch_yield_l ? `(${f.batch_yield_l} ${f.unit})` : ''}
                      </p>
                      <div className="space-y-1.5">
                        {f.ingredients.map(ing => (
                          <div key={ing.rm_item_id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                            <p className="text-sm font-medium text-gray-800">{ing.name}</p>
                            <span className="text-sm font-semibold text-blue-700 shrink-0 ml-4">
                              {ing.qty_per_unit} <span className="text-xs font-normal text-gray-400">{ing.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                      {f.batch_yield_l && f.ingredients.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 font-medium">Per litre of output:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {f.ingredients.map(ing => (
                              <span key={ing.rm_item_id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                                {ing.name}: {(ing.qty_per_unit / f.batch_yield_l!).toFixed(3)} {ing.unit}/L
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
