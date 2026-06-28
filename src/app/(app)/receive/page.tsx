'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { parseSupabaseError } from '@/lib/utils';
import { Trash2, CheckCircle } from 'lucide-react';

interface RmItem {
  rm_item_id: number;
  name: string;
  unit: string;
}

interface Vendor {
  id: number;
  name: string;
}

interface ReceiptLine {
  rm_item_id: number;
  name: string;
  unit: string;
  qty_received: string;
  cost_per_unit: string;
}

export default function ReceivePage() {
  const supabase = createClient();
  const { user } = useUser();

  const [items, setItems] = useState<RmItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [vendorId, setVendorId] = useState('');
  const [note, setNote] = useState('');

  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    async function load() {
      const [itemsRes, vendorsRes] = await Promise.all([
        supabase.schema('production').from('rm_items')
          .select('id, name, unit')
          .eq('is_stockable', true)
          .order('name'),
        supabase.schema('production').from('vendors')
          .select('id, name')
          .eq('status', 'active')
          .order('name'),
      ]);
      setItems((itemsRes.data || []).map((r: Record<string, unknown>) => ({
        rm_item_id: r.id as number,
        name: r.name as string,
        unit: r.unit as string,
      })));
      setVendors(vendorsRes.data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  function addLine(item: RmItem) {
    if (lines.some(l => l.rm_item_id === item.rm_item_id)) {
      toast.error(`${item.name} is already in this delivery.`);
      return;
    }
    setLines(prev => [...prev, {
      rm_item_id: item.rm_item_id,
      name: item.name,
      unit: item.unit,
      qty_received: '',
      cost_per_unit: '',
    }]);
    setSearch('');
    setShowDropdown(false);
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: 'qty_received' | 'cost_per_unit', value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  async function handleSubmit() {
    if (!vendorId) { toast.error('Please select a vendor.'); return; }
    if (lines.length === 0) { toast.error('Add at least one ingredient.'); return; }
    for (const l of lines) {
      if (!l.qty_received || parseFloat(l.qty_received) <= 0) {
        toast.error(`Please enter a quantity for ${l.name}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.schema('production').rpc('create_rm_receipt', {
        p_source_type: 'vendor',
        p_vendor_id: parseInt(vendorId),
        p_received_by: user?.id,
        p_note: note || null,
        p_lines: lines.map(l => ({
          rm_item_id: l.rm_item_id,
          qty: parseFloat(l.qty_received),
          unit_cost: l.cost_per_unit ? parseFloat(l.cost_per_unit) : null,
          lot_no: null,
        })),
      });

      if (error) throw new Error(error.message);
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to record delivery');

      setSuccess(true);
      toast.success('Delivery recorded! Stock levels have been updated.');
      setLines([]);
      setVendorId('');
      setNote('');
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
        <p className="text-gray-500 text-lg">Stock levels have been updated.</p>
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
        description="Log a new delivery of raw materials. Stock count goes up automatically."
      />

      <div className="card space-y-4">
        <h2 className="section-title">Delivery Details</h2>

        <div>
          <label className="label-text block mb-2">Vendor / Supplier</label>
          <select value={vendorId} onChange={e => setVendorId(e.target.value)} className="input-field">
            <option value="">Select vendor...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-text block mb-2">Note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Invoice #1234, delivery notes..." className="input-field" rows={2} />
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="section-title">Ingredients Received</h2>
        <p className="text-gray-500 text-sm">Search for each ingredient and enter the quantity received.</p>

        <div className="relative">
          <input
            type="text"
            placeholder="Search ingredient (e.g. Mango Pulp)..."
            className="input-field"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {showDropdown && search && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 overflow-hidden z-20">
              {filtered.length === 0 ? (
                <p className="p-4 text-gray-500 text-sm">No ingredients found for &quot;{search}&quot;</p>
              ) : filtered.map(i => (
                <button
                  key={i.rm_item_id}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 text-left touch-manipulation border-b border-gray-50 last:border-0"
                  onMouseDown={() => addLine(i)}
                >
                  <span className="font-medium text-gray-900">{i.name}</span>
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
              <div key={line.rm_item_id} className="bg-orange-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-900">{line.name}</p>
                  <button onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600 p-1 touch-manipulation">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-text block mb-1">Qty received ({line.unit})</label>
                    <input
                      type="number" min="0" step="0.1"
                      value={line.qty_received}
                      onChange={e => updateLine(idx, 'qty_received', e.target.value)}
                      placeholder={`Amount in ${line.unit}`}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text block mb-1">Cost / {line.unit} (₹, optional)</label>
                    <input
                      type="number" min="0" step="0.01"
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
              {submitting ? 'Recording delivery...' : '✓ Record This Delivery'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
