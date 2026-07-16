'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { Trash2, CheckCircle, ChevronDown, ChevronUp, RefreshCw, Package } from 'lucide-react';

interface RmItem {
  rm_item_id: number;
  name: string;
  unit: string;
}

interface Vendor {
  id: number;
  name: string;
}

interface OrderLine {
  rm_item_id: number;
  name: string;
  unit: string;
  qty_ordered: string;
  unit_cost: string;
}

interface PurchaseOrderLine {
  id: number;
  rm_item_id: number;
  ingredient_name: string;
  unit: string;
  qty_ordered: number;
  qty_received: number;
  status: string;
  qty_now: string;
  qty_spoilt: string;
}

interface PurchaseOrder {
  id: number;
  vendor_name: string;
  ordered_at: string;
  status: string;
  note: string | null;
  lines: PurchaseOrderLine[];
  expanded: boolean;
}

type Tab = 'place' | 'confirm';

export default function ReceivePage() {
  const supabase = createClient();
  const { user } = useUser();

  const [items, setItems] = useState<RmItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('place');

  // Place order state
  const [vendorId, setVendorId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placeSuccess, setPlaceSuccess] = useState(false);

  // Confirm receipt state
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);

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

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    const ordersRes = await supabase
      .schema('production')
      .from('rm_purchase_orders')
      .select(`
        id, ordered_at, status, note,
        vendor:vendor_id(name),
        lines:rm_purchase_order_lines(id, rm_item_id, qty_ordered, qty_received, unit_cost, status, item:rm_item_id(name, unit))
      `)
      .in('status', ['pending', 'partially_received'])
      .order('ordered_at', { ascending: false });

    const raw = ordersRes.data || [];
    setOrders(raw.map((o: Record<string, unknown>) => {
      const vendor = o.vendor as Record<string, unknown> | null;
      const rawLines = (o.lines as Record<string, unknown>[]) || [];
      return {
        id: o.id as number,
        vendor_name: (vendor?.name as string) || 'Unknown',
        ordered_at: o.ordered_at as string,
        status: o.status as string,
        note: o.note as string | null,
        expanded: false,
        lines: rawLines.map((l: Record<string, unknown>) => {
          const item = l.item as Record<string, unknown> | null;
          const qtyOrdered = l.qty_ordered as number;
          const qtyReceived = (l.qty_received as number) || 0;
          return {
            id: l.id as number,
            rm_item_id: l.rm_item_id as number,
            ingredient_name: (item?.name as string) || '',
            unit: (item?.unit as string) || '',
            qty_ordered: qtyOrdered,
            qty_received: qtyReceived,
            status: l.status as string,
            qty_now: String(qtyOrdered - qtyReceived > 0 ? qtyOrdered - qtyReceived : qtyOrdered),
            qty_spoilt: '0',
          };
        }),
      };
    }));
    setOrdersLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (tab === 'confirm') loadOrders();
  }, [tab, loadOrders]);

  // --- Place order ---
  function addLine(item: RmItem) {
    if (lines.some(l => l.rm_item_id === item.rm_item_id)) {
      toast.error(`${item.name} already added.`);
      return;
    }
    setLines(prev => [...prev, { rm_item_id: item.rm_item_id, name: item.name, unit: item.unit, qty_ordered: '', unit_cost: '' }]);
    setSearch('');
    setShowDropdown(false);
  }

  function removeLine(idx: number) { setLines(prev => prev.filter((_, i) => i !== idx)); }
  function updateLine(idx: number, field: 'qty_ordered' | 'unit_cost', value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  async function handlePlaceOrder() {
    if (!vendorId) { toast.error('Please select a vendor.'); return; }
    if (lines.length === 0) { toast.error('Add at least one ingredient.'); return; }
    for (const l of lines) {
      if (!l.qty_ordered || parseFloat(l.qty_ordered) <= 0) {
        toast.error(`Please enter quantity for ${l.name}.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .schema('production')
        .from('rm_purchase_orders')
        .insert({ vendor_id: parseInt(vendorId), ordered_by: user?.id, note: note || null, status: 'pending' })
        .select('id')
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message || 'Table not found — run supabase/purchase_orders.sql in Supabase SQL Editor first');

      const { error: linesErr } = await supabase
        .schema('production')
        .from('rm_purchase_order_lines')
        .insert(lines.map(l => ({
          order_id: order.id,
          rm_item_id: l.rm_item_id,
          qty_ordered: parseFloat(l.qty_ordered),
          unit_cost: l.unit_cost ? parseFloat(l.unit_cost) : null,
          status: 'pending',
        })));

      if (linesErr) throw new Error(linesErr.message);

      setPlaceSuccess(true);
      toast.success('Order placed! Switch to Confirm Receipt when the delivery arrives.');
      setLines([]);
      setVendorId('');
      setNote('');
    } catch (e: unknown) {
      toast.error(parseSupabaseError(e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  }

  // --- Confirm receipt ---
  function toggleOrder(id: number) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, expanded: !o.expanded } : o));
  }

  function updateLineField(orderId: number, lineId: number, field: 'qty_now' | 'qty_spoilt', value: string) {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, lines: o.lines.map(l => l.id === lineId ? { ...l, [field]: value } : l) }
        : o
    ));
  }

  async function confirmReceipt(order: PurchaseOrder) {
    for (const l of order.lines) {
      const received = parseFloat(l.qty_now) || 0;
      const spoilt = parseFloat(l.qty_spoilt) || 0;
      if (received < 0 || spoilt < 0) {
        toast.error(`Enter valid quantities for ${l.ingredient_name}.`);
        return;
      }
      if (spoilt > received) {
        toast.error(`Spoilt qty cannot exceed received qty for ${l.ingredient_name}.`);
        return;
      }
    }

    // Only good stock (received - spoilt) goes to inventory
    const receiptLines = order.lines
      .map(l => {
        const received = parseFloat(l.qty_now) || 0;
        const spoilt = parseFloat(l.qty_spoilt) || 0;
        return { rm_item_id: l.rm_item_id, qty: received - spoilt, unit_cost: null, lot_no: null };
      })
      .filter(l => l.qty > 0);

    if (receiptLines.length === 0) { toast.error('No usable stock entered.'); return; }

    setConfirming(order.id);
    try {
      const spoiltNote = order.lines
        .filter(l => parseFloat(l.qty_spoilt) > 0)
        .map(l => `${l.ingredient_name}: ${l.qty_spoilt} ${l.unit} spoilt`)
        .join(', ');

      const { data, error } = await supabase.schema('production').rpc('create_rm_receipt', {
        p_source_type: 'vendor',
        p_vendor_id: order.lines[0]?.rm_item_id ? parseInt(String(order.id)) : null,
        p_received_by: user?.id,
        p_note: [`Confirmed receipt of PO #${order.id}`, spoiltNote].filter(Boolean).join(' | '),
        p_lines: receiptLines,
      });

      if (error) throw new Error(error.message);
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to record receipt');

      // Update each order line (qty_received = total received including spoilt, since that's what arrived)
      for (const l of order.lines) {
        const newQtyReceived = l.qty_received + (parseFloat(l.qty_now) || 0);
        const lineStatus = newQtyReceived >= l.qty_ordered ? 'received' : 'partial';
        await supabase.schema('production').from('rm_purchase_order_lines')
          .update({ qty_received: newQtyReceived, status: lineStatus })
          .eq('id', l.id);
      }

      const allReceived = order.lines.every(l => {
        const newQty = l.qty_received + (parseFloat(l.qty_now) || 0);
        return newQty >= l.qty_ordered;
      });
      await supabase.schema('production').from('rm_purchase_orders')
        .update({ status: allReceived ? 'received' : 'partially_received' })
        .eq('id', order.id);

      const spoiltMsg = spoiltNote ? ` (${spoiltNote})` : '';
      toast.success(`Receipt confirmed for PO #${order.id}. Stock updated!${spoiltMsg}`);
      loadOrders();
    } catch (e: unknown) {
      toast.error(parseSupabaseError(e instanceof Error ? e.message : String(e)));
    } finally {
      setConfirming(null);
    }
  }

  if (loading) return <LoadingSpinner text="Loading ingredients list..." />;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={Package} iconColor="text-blue-500"
        title="Receive Ingredients"
        description="Place a purchase order when ordering stock. Confirm receipt when the delivery arrives."
      />

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => { setTab('place'); setPlaceSuccess(false); }}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all touch-manipulation ${
            tab === 'place' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Place Order
        </button>
        <button
          onClick={() => setTab('confirm')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all touch-manipulation ${
            tab === 'confirm' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Confirm Receipt
        </button>
      </div>

      {/* PLACE ORDER TAB */}
      {tab === 'place' && (
        <>
          {placeSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-800 font-semibold">Order placed successfully!</p>
                <p className="text-green-700 text-sm mt-0.5">Switch to "Confirm Receipt" when the delivery arrives to update stock.</p>
              </div>
            </div>
          )}

          <div className="card space-y-4">
            <h2 className="section-title">Order Details</h2>
            <div>
              <label className="label-text block mb-2">Vendor / Supplier</label>
              <select value={vendorId} onChange={e => setVendorId(e.target.value)} className="input-field">
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text block mb-2">Note (optional)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. PO #1234, expected delivery date..." className="input-field" rows={2} />
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="section-title">Ingredients to Order</h2>
            <p className="text-gray-500 text-sm">Search and add each ingredient you are ordering.</p>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label-text block mb-1">Qty to order ({line.unit})</label>
                        <input
                          type="number" min="0" step="0.1"
                          value={line.qty_ordered}
                          onChange={e => updateLine(idx, 'qty_ordered', e.target.value)}
                          placeholder={`Amount in ${line.unit}`}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="label-text block mb-1">Cost / {line.unit} (₹, optional)</label>
                        <input
                          type="number" min="0" step="0.01"
                          value={line.unit_cost}
                          onChange={e => updateLine(idx, 'unit_cost', e.target.value)}
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
                <p className="text-sm text-gray-500 mb-3 text-center">{lines.length} ingredient{lines.length > 1 ? 's' : ''} ready to order</p>
                <button onClick={handlePlaceOrder} disabled={submitting} className="btn-primary">
                  {submitting ? 'Placing order...' : '📋 Place This Order'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CONFIRM RECEIPT TAB */}
      {tab === 'confirm' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending orders awaiting delivery confirmation.</p>
            <button onClick={loadOrders} className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {ordersLoading ? <LoadingSpinner text="Loading orders..." /> : orders.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold text-gray-600">No pending orders</p>
              <p className="text-sm mt-1">Place an order first using the "Place Order" tab.</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="card p-0 overflow-hidden">
              {/* Order header */}
              <button
                onClick={() => toggleOrder(order.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left touch-manipulation hover:bg-orange-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">PO #{order.id} — {order.vendor_name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      order.status === 'partially_received' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'partially_received' ? 'Partial' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.ordered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{order.lines.length} item{order.lines.length !== 1 ? 's' : ''}
                    {order.note ? ` · ${order.note}` : ''}
                  </p>
                </div>
                {order.expanded ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
              </button>

              {/* Expanded: receipt form */}
              {order.expanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
                  <p className="text-sm text-gray-500">Enter how much of each item was actually received. Leave at 0 if not delivered.</p>

                  <div className="space-y-3">
                    {order.lines.map(line => {
                      const alreadyReceived = line.qty_received > 0;
                      const remaining = line.qty_ordered - line.qty_received;
                      return (
                        <div key={line.id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900 text-sm">{line.ingredient_name}</p>
                            <span className="text-xs text-gray-500">
                              Ordered: <strong>{formatNumber(line.qty_ordered)} {line.unit}</strong>
                            </span>
                          </div>
                          {alreadyReceived && (
                            <p className="text-xs text-amber-600 mb-2">
                              Already received: {formatNumber(line.qty_received)} {line.unit} · Remaining: {formatNumber(remaining)} {line.unit}
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="label-text block mb-1">
                                Qty received ({line.unit})
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                max={remaining}
                                value={line.qty_now}
                                onChange={e => updateLineField(order.id, line.id, 'qty_now', e.target.value)}
                                placeholder={`Max ${formatNumber(remaining)}`}
                                className="input-field"
                              />
                            </div>
                            <div>
                              <label className="label-text block mb-1 text-red-600">
                                Spoilt / damaged ({line.unit})
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={line.qty_spoilt}
                                onChange={e => updateLineField(order.id, line.id, 'qty_spoilt', e.target.value)}
                                placeholder="0"
                                className="input-field border-red-200 focus:border-red-400"
                              />
                            </div>
                          </div>
                          {parseFloat(line.qty_spoilt) > 0 && parseFloat(line.qty_now) > 0 && (
                            <p className="text-xs text-green-700 mt-1">
                              ✓ {formatNumber(parseFloat(line.qty_now) - parseFloat(line.qty_spoilt))} {line.unit} will be added to stock
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => confirmReceipt(order)}
                    disabled={confirming === order.id}
                    className="btn-primary"
                  >
                    {confirming === order.id ? 'Confirming...' : '✅ Confirm Receipt & Update Stock'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
