'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { parseSupabaseError } from '@/lib/utils';
import { Trash2, CheckCircle } from 'lucide-react';

interface Ingredient {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
}

interface Supplier {
  supplier_id: number;
  supplier_name: string;
}

interface ReceiptLine {
  ingredient_id: number;
  ingredient_name: string;
  unit: string;
  qty_received: string;
  cost_per_unit: string;
}

export default function ReceivePage() {
  const supabase = createClient();
  const { user } = useUser();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');

  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = ingredients.filter(i =>
    i.ingredient_name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    async function load() {
      const [ing, sup] = await Promise.all([
        supabase.schema('production').from('ingredients').select('ingredient_id, ingredient_name, unit').order('ingredient_name'),
        supabase.schema('production').from('suppliers').select('supplier_id, supplier_name').order('supplier_name'),
      ]);
      setIngredients(ing.data || []);
      setSuppliers(sup.data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function addLine(ingredient: Ingredient) {
    if (lines.some(l => l.ingredient_id === ingredient.ingredient_id)) {
      toast.error(`${ingredient.ingredient_name} is already in this delivery.`);
      return;
    }
    setLines(prev => [...prev, {
      ingredient_id: ingredient.ingredient_id,
      ingredient_name: ingredient.ingredient_name,
      unit: ingredient.unit,
      qty_received: '',
      cost_per_unit: '',
    }]);
    setSearch('');
    setShowDropdown(false);
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof ReceiptLine, value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  async function handleSubmit() {
    if (!supplierId) { toast.error('Please select who delivered these ingredients.'); return; }
    if (lines.length === 0) { toast.error('Please add at least one ingredient to this delivery.'); return; }
    for (const l of lines) {
      if (!l.qty_received || parseFloat(l.qty_received) <= 0) {
        toast.error(`Please enter a quantity for ${l.ingredient_name}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data: receipt, error: rErr } = await supabase
        .schema('production')
        .from('rm_receipts')
        .insert({
          supplier_id: parseInt(supplierId),
          received_by: user?.id,
          received_at: new Date(deliveryDate).toISOString(),
          notes: notes || null,
          invoice_ref: invoiceRef || null,
        })
        .select('receipt_id')
        .single();

      if (rErr || !receipt) throw new Error(rErr?.message || 'Could not create receipt');

      const { error: lErr } = await supabase
        .schema('production')
        .from('rm_receipt_lines')
        .insert(lines.map(l => ({
          receipt_id: receipt.receipt_id,
          ingredient_id: l.ingredient_id,
          qty_received: parseFloat(l.qty_received),
          cost_per_unit: l.cost_per_unit ? parseFloat(l.cost_per_unit) : null,
        })));

      if (lErr) throw new Error(lErr.message);

      setSuccess(true);
      toast.success('Delivery recorded! Stock levels have been updated.');
      setLines([]);
      setSupplierId('');
      setNotes('');
      setInvoiceRef('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(parseSupabaseError(msg));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading ingredients list..." />;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <CheckCircle className="text-green-500" size={64} />
        <h2 className="text-2xl font-bold text-gray-900">Delivery Recorded!</h2>
        <p className="text-gray-500 text-lg">The stock levels have been updated.</p>
        <button onClick={() => setSuccess(false)} className="btn-primary mt-4" style={{ maxWidth: 320 }}>
          Record Another Delivery
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScreenHeader
        icon="📦"
        title="Receive Ingredients"
        description="Use this when a delivery arrives. Enter what came in and the stock count goes up automatically."
      />

      <div className="card space-y-4">
        <h2 className="section-title">Delivery Details</h2>

        <div>
          <label className="label-text block mb-2">Who delivered it?</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="input-field">
            <option value="">Select supplier...</option>
            {suppliers.map(s => (
              <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-text block mb-2">Delivery Date</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text block mb-2">Invoice / Ref # (optional)</label>
            <input type="text" value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)} placeholder="e.g. INV-1234" className="input-field" />
          </div>
        </div>

        <div>
          <label className="label-text block mb-2">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this delivery..." className="input-field" rows={2} />
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="section-title">Ingredients Received</h2>
        <p className="text-gray-500 text-sm">Search for each ingredient and enter the quantity that arrived.</p>

        <div className="relative">
          <input
            type="text"
            placeholder="Search for an ingredient (e.g. Mango Pulp)..."
            className="input-field"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && search && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 overflow-hidden z-20">
              {filtered.length === 0 ? (
                <p className="p-4 text-gray-500 text-sm">No ingredients found for &quot;{search}&quot;</p>
              ) : filtered.map(i => (
                <button
                  key={i.ingredient_id}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 text-left touch-manipulation border-b border-gray-50 last:border-0"
                  onClick={() => addLine(i)}
                >
                  <span className="font-medium text-gray-900">{i.ingredient_name}</span>
                  <span className="text-gray-400 text-sm ml-2">{i.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {lines.length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">No ingredients added yet — search above to add one.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={line.ingredient_id} className="bg-orange-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900">{line.ingredient_name}</p>
                  <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 p-1 touch-manipulation">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-text block mb-1">Quantity received ({line.unit})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={line.qty_received}
                      onChange={e => updateLine(idx, 'qty_received', e.target.value)}
                      placeholder={`Amount in ${line.unit}`}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text block mb-1">Cost per {line.unit} (₹, optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.cost_per_unit}
                      onChange={e => updateLine(idx, 'cost_per_unit', e.target.value)}
                      placeholder="e.g. 120.00"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {lines.length > 0 && (
          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-3 text-center">{lines.length} ingredient{lines.length > 1 ? 's' : ''} ready to record</p>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? 'Recording delivery...' : `✓ Record This Delivery`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
