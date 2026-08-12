'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { parseSupabaseError, formatNumber } from '@/lib/utils';
import { Trash2, CheckCircle, ChevronDown, ChevronUp, RefreshCw, Package, BarChart3, Plus, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface RmItem { rm_item_id: number; name: string; unit: string; }
interface Vendor { id: number; name: string; }
interface OrderLine { rm_item_id: number; name: string; unit: string; qty_ordered: string; unit_cost: string; }
interface PurchaseOrderLine {
  id: number; rm_item_id: number; ingredient_name: string; unit: string;
  qty_ordered: number; qty_received: number; status: string; qty_now: string; qty_spoilt: string;
}
interface PurchaseOrder {
  id: number; vendor_name: string; ordered_at: string; status: string;
  note: string | null; lines: PurchaseOrderLine[]; expanded: boolean;
}
interface HistoryOrder {
  id: number; vendor_name: string; ordered_at: string; status: string;
  note: string | null;
  lines: { ingredient_name: string; unit: string; qty_ordered: number; qty_received: number; unit_cost: number | null }[];
  expanded: boolean;
}
interface ExpenseRow {
  rm_item_id: number;
  name: string;
  unit: string;
  months: Record<string, { qty: number; cost: number }>;
  total_qty: number;
  total_cost: number;
}

type Tab = 'place' | 'confirm' | 'history' | 'expenses';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n); }
function fmtCur(n: number) {
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}
function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(+y, +m - 1).toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ReceivePage() {
  const supabase = createClient();
  const { user } = useUser();

  const [items, setItems] = useState<RmItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('place');

  // Place order
  const [vendorId, setVendorId] = useState('');
  const [otherVendorName, setOtherVendorName] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placeSuccess, setPlaceSuccess] = useState(false);

  // Confirm receipt
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [confirming, setConfirming] = useState<number | null>(null);

  // History
  const [history, setHistory] = useState<HistoryOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Expenses
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [expenseMonths, setExpenseMonths] = useState<string[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseSearch, setExpenseSearch] = useState('');

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8);

  useEffect(() => {
    async function load() {
      const [itemsRes, vendorsRes] = await Promise.all([
        supabase.schema('production').from('rm_items').select('id, name, unit').eq('is_stockable', true).order('name'),
        supabase.schema('production').from('vendors').select('id, name').eq('status', 'active').order('name'),
      ]);
      setItems((itemsRes.data || []).map((r: Record<string, unknown>) => ({
        rm_item_id: r.id as number, name: r.name as string, unit: r.unit as string,
      })));
      setVendors(vendorsRes.data || []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    const res = await supabase.schema('production').from('rm_purchase_orders')
      .select(`id, ordered_at, status, note,
        vendor:vendor_id(name),
        lines:rm_purchase_order_lines(id, rm_item_id, qty_ordered, qty_received, unit_cost, status, item:rm_item_id(name, unit))`)
      .in('status', ['pending', 'partially_received'])
      .order('ordered_at', { ascending: false });
    const raw = res.data || [];
    setOrders(raw.map((o: Record<string, unknown>) => {
      const vendor = o.vendor as Record<string, unknown> | null;
      const rawLines = (o.lines as Record<string, unknown>[]) || [];
      return {
        id: o.id as number, vendor_name: (vendor?.name as string) || 'Unknown',
        ordered_at: o.ordered_at as string, status: o.status as string, note: o.note as string | null,
        expanded: false,
        lines: rawLines.map((l: Record<string, unknown>) => {
          const item = l.item as Record<string, unknown> | null;
          const qtyOrdered = l.qty_ordered as number;
          const qtyReceived = (l.qty_received as number) || 0;
          return {
            id: l.id as number, rm_item_id: l.rm_item_id as number,
            ingredient_name: (item?.name as string) || '', unit: (item?.unit as string) || '',
            qty_ordered: qtyOrdered, qty_received: qtyReceived, status: l.status as string,
            qty_now: String(qtyOrdered - qtyReceived > 0 ? qtyOrdered - qtyReceived : qtyOrdered),
            qty_spoilt: '0',
          };
        }),
      };
    }));
    setOrdersLoading(false);
  }, [supabase]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const res = await supabase.schema('production').from('rm_purchase_orders')
      .select(`id, ordered_at, status, note,
        vendor:vendor_id(name),
        lines:rm_purchase_order_lines(id, rm_item_id, qty_ordered, qty_received, unit_cost, status, item:rm_item_id(name, unit))`)
      .in('status', ['received', 'partially_received'])
      .order('ordered_at', { ascending: false })
      .limit(50);
    setHistory((res.data || []).map((o: Record<string, unknown>) => {
      const vendor = o.vendor as Record<string, unknown> | null;
      const rawLines = (o.lines as Record<string, unknown>[]) || [];
      return {
        id: o.id as number, vendor_name: (vendor?.name as string) || 'Unknown',
        ordered_at: o.ordered_at as string, status: o.status as string, note: o.note as string | null,
        expanded: false,
        lines: rawLines.map((l: Record<string, unknown>) => {
          const item = l.item as Record<string, unknown> | null;
          return {
            ingredient_name: (item?.name as string) || '', unit: (item?.unit as string) || '',
            qty_ordered: l.qty_ordered as number, qty_received: (l.qty_received as number) || 0,
            unit_cost: l.unit_cost as number | null,
          };
        }),
      };
    }));
    setHistoryLoading(false);
  }, [supabase]);

  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true);
    const res = await supabase.schema('production').from('rm_purchase_orders')
      .select(`ordered_at, lines:rm_purchase_order_lines(rm_item_id, qty_received, unit_cost, item:rm_item_id(name, unit))`)
      .in('status', ['received', 'partially_received'])
      .order('ordered_at', { ascending: true });

    const raw = res.data || [];
    const itemMap = new Map<number, ExpenseRow>();
    const monthSet = new Set<string>();

    for (const order of raw) {
      const date = new Date(order.ordered_at as string);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(monthKey);
      const rawLines = (order.lines as Record<string, unknown>[]) || [];
      for (const l of rawLines) {
        const item = l.item as Record<string, unknown> | null;
        if (!item) continue;
        const rmId = l.rm_item_id as number;
        const qty = (l.qty_received as number) || 0;
        const unitCost = (l.unit_cost as number) || 0;
        const cost = qty * unitCost;
        if (!itemMap.has(rmId)) {
          itemMap.set(rmId, {
            rm_item_id: rmId, name: item.name as string, unit: item.unit as string,
            months: {}, total_qty: 0, total_cost: 0,
          });
        }
        const row = itemMap.get(rmId)!;
        if (!row.months[monthKey]) row.months[monthKey] = { qty: 0, cost: 0 };
        row.months[monthKey].qty += qty;
        row.months[monthKey].cost += cost;
        row.total_qty += qty;
        row.total_cost += cost;
      }
    }

    const months = Array.from(monthSet).sort();
    setExpenseMonths(months);
    setExpenseRows(Array.from(itemMap.values()).sort((a, b) => b.total_cost - a.total_cost));
    setExpensesLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (tab === 'confirm') loadOrders();
    if (tab === 'history') loadHistory();
    if (tab === 'expenses') loadExpenses();
  }, [tab, loadOrders, loadHistory, loadExpenses]);

  // ── Place order ──────────────────────────────────────────────────────────

  function addLine(item: RmItem) {
    if (lines.some(l => l.rm_item_id === item.rm_item_id)) { toast.error(`${item.name} already added.`); return; }
    setLines(prev => [...prev, { rm_item_id: item.rm_item_id, name: item.name, unit: item.unit, qty_ordered: '', unit_cost: '' }]);
    setSearch(''); setShowDropdown(false);
  }
  function removeLine(idx: number) { setLines(prev => prev.filter((_, i) => i !== idx)); }
  function updateLine(idx: number, field: 'qty_ordered' | 'unit_cost', value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  async function handlePlaceOrder() {
    if (!vendorId) { toast.error('Select a vendor.'); return; }
    if (vendorId === '__other__' && !otherVendorName.trim()) { toast.error('Enter vendor name.'); return; }
    if (lines.length === 0) { toast.error('Add at least one ingredient.'); return; }
    for (const l of lines) {
      if (!l.qty_ordered || parseFloat(l.qty_ordered) <= 0) { toast.error(`Enter quantity for ${l.name}.`); return; }
    }
    setSubmitting(true);
    try {
      let resolvedVendorId = parseInt(vendorId);
      if (vendorId === '__other__') {
        const trimmedName = otherVendorName.trim();
        const { data: existing } = await supabase.schema('production').from('vendors').select('id').ilike('name', trimmedName).maybeSingle();
        if (existing) {
          resolvedVendorId = existing.id;
        } else {
          const { data: newVendor, error: vendorErr } = await supabase.schema('production').from('vendors')
            .insert({ name: trimmedName, status: 'active' }).select('id').single();
          if (vendorErr || !newVendor) throw new Error(vendorErr?.message || 'Failed to create vendor');
          resolvedVendorId = newVendor.id;
          setVendors(prev => [...prev, { id: newVendor.id, name: trimmedName }].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
      const { data: order, error: orderErr } = await supabase.schema('production').from('rm_purchase_orders')
        .insert({ vendor_id: resolvedVendorId, ordered_by: user?.id, note: note || null, status: 'pending' })
        .select('id').single();
      if (orderErr || !order) throw new Error(orderErr?.message || 'Could not create order');
      const { error: linesErr } = await supabase.schema('production').from('rm_purchase_order_lines').insert(
        lines.map(l => ({
          order_id: order.id, rm_item_id: l.rm_item_id,
          qty_ordered: parseFloat(l.qty_ordered),
          unit_cost: l.unit_cost ? parseFloat(l.unit_cost) : null,
          status: 'pending',
        }))
      );
      if (linesErr) throw new Error(linesErr.message);
      setPlaceSuccess(true);
      toast.success('Order placed!');
      setLines([]); setVendorId(''); setOtherVendorName(''); setNote('');
    } catch (e: unknown) {
      toast.error(parseSupabaseError(e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Confirm receipt ──────────────────────────────────────────────────────

  function toggleOrder(id: number) { setOrders(prev => prev.map(o => o.id === id ? { ...o, expanded: !o.expanded } : o)); }
  function updateLineField(orderId: number, lineId: number, field: 'qty_now' | 'qty_spoilt', value: string) {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, lines: o.lines.map(l => l.id === lineId ? { ...l, [field]: value } : l) } : o
    ));
  }

  async function confirmReceipt(order: PurchaseOrder) {
    for (const l of order.lines) {
      const received = parseFloat(l.qty_now) || 0;
      const spoilt = parseFloat(l.qty_spoilt) || 0;
      if (received < 0 || spoilt < 0) { toast.error(`Enter valid quantities for ${l.ingredient_name}.`); return; }
      if (spoilt > received) { toast.error(`Spoilt qty cannot exceed received for ${l.ingredient_name}.`); return; }
    }
    const receiptLines = order.lines
      .map(l => ({ rm_item_id: l.rm_item_id, qty: (parseFloat(l.qty_now) || 0) - (parseFloat(l.qty_spoilt) || 0), unit_cost: null, lot_no: null }))
      .filter(l => l.qty > 0);
    if (receiptLines.length === 0) { toast.error('No usable stock entered.'); return; }
    setConfirming(order.id);
    try {
      const spoiltNote = order.lines.filter(l => parseFloat(l.qty_spoilt) > 0)
        .map(l => `${l.ingredient_name}: ${l.qty_spoilt} ${l.unit} spoilt`).join(', ');
      const { data, error } = await supabase.schema('production').rpc('create_rm_receipt', {
        p_source_type: 'vendor', p_vendor_id: null, p_received_by: user?.id,
        p_note: [`Confirmed receipt of PO #${order.id}`, spoiltNote].filter(Boolean).join(' | '),
        p_lines: receiptLines,
      });
      if (error) throw new Error(error.message);
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to record receipt');
      for (const l of order.lines) {
        const newQtyReceived = l.qty_received + (parseFloat(l.qty_now) || 0);
        const lineStatus = newQtyReceived >= l.qty_ordered ? 'received' : 'partial';
        await supabase.schema('production').from('rm_purchase_order_lines').update({ qty_received: newQtyReceived, status: lineStatus }).eq('id', l.id);
      }
      const allReceived = order.lines.every(l => l.qty_received + (parseFloat(l.qty_now) || 0) >= l.qty_ordered);
      await supabase.schema('production').from('rm_purchase_orders').update({ status: allReceived ? 'received' : 'partially_received' }).eq('id', order.id);
      toast.success(`PO #${order.id} confirmed. Stock updated!`);
      loadOrders();
    } catch (e: unknown) {
      toast.error(parseSupabaseError(e instanceof Error ? e.message : String(e)));
    } finally {
      setConfirming(null);
    }
  }

  if (loading) return <LoadingSpinner text="Loading..." />;

  // ── Render ───────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string }[] = [
    { key: 'place', label: 'Place Order' },
    { key: 'confirm', label: 'Confirm Receipt' },
    { key: 'history', label: 'History' },
    { key: 'expenses', label: 'Expenses' },
  ];

  const filteredExpenseRows = expenseSearch
    ? expenseRows.filter(r => r.name.toLowerCase().includes(expenseSearch.toLowerCase()))
    : expenseRows;

  const grandTotalCost = filteredExpenseRows.reduce((s, r) => s + r.total_cost, 0);
  const monthGrandTotals = expenseMonths.reduce((acc, m) => {
    acc[m] = filteredExpenseRows.reduce((s, r) => s + (r.months[m]?.cost || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <ScreenHeader icon={Package} iconColor="text-blue-500" title="Receive Ingredients"
        description="Place orders, confirm deliveries, and track RM expenses." />

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPlaceSuccess(false); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all touch-manipulation whitespace-nowrap px-3 ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PLACE ORDER ── */}
      {tab === 'place' && (
        <div className="space-y-4">
          {placeSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-green-800 font-semibold">Order placed!</p>
                <p className="text-green-700 text-sm mt-0.5">Go to "Confirm Receipt" when the delivery arrives.</p>
              </div>
            </div>
          )}

          <div className="card space-y-3">
            <h2 className="section-title">Order Details</h2>

            {/* Vendor */}
            <div>
              <label className="label-text block mb-1">Vendor</label>
              <select value={vendorId} onChange={e => { setVendorId(e.target.value); setOtherVendorName(''); }} className="input-field">
                <option value="">Select vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                <option value="__other__">Others — type below</option>
              </select>
              {vendorId === '__other__' && (
                <input type="text" value={otherVendorName} onChange={e => setOtherVendorName(e.target.value)}
                  placeholder="Vendor name..." className="input-field mt-2" autoFocus />
              )}
            </div>

            {/* Note */}
            <div>
              <label className="label-text block mb-1">Note <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder="PO #, expected delivery date..." className="input-field" />
            </div>
          </div>

          {/* Ingredients */}
          <div className="card space-y-3">
            <h2 className="section-title">Ingredients to Order</h2>

            {/* Search */}
            <div className="relative">
              <input type="text" placeholder="Search ingredient..." className="input-field"
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)} />
              {showDropdown && search && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 mt-1 overflow-hidden z-20">
                  {filtered.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">No results for &quot;{search}&quot;</p>
                  ) : filtered.map(i => (
                    <button key={i.rm_item_id} onMouseDown={() => addLine(i)}
                      className="flex items-center justify-between w-full px-4 py-3 hover:bg-orange-50 text-left touch-manipulation border-b border-gray-50 last:border-0">
                      <span className="font-medium text-gray-900 text-sm">{i.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{i.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lines */}
            {lines.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Plus size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Search above to add ingredients</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_90px_90px_32px] gap-2 px-1">
                  <p className="label-text">Ingredient</p>
                  <p className="label-text text-center">Qty</p>
                  <p className="label-text text-center">Cost/unit (₹)</p>
                  <span />
                </div>
                {lines.map((line, idx) => (
                  <div key={line.rm_item_id} className="grid grid-cols-[1fr_90px_90px_32px] gap-2 items-center bg-orange-50 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{line.name}</p>
                      <p className="text-xs text-gray-400">{line.unit}</p>
                    </div>
                    <input type="number" min="0" step="0.1" value={line.qty_ordered}
                      onChange={e => updateLine(idx, 'qty_ordered', e.target.value)}
                      placeholder="0" className="input-field text-center text-sm py-2 px-2" />
                    <input type="number" min="0" step="0.01" value={line.unit_cost}
                      onChange={e => updateLine(idx, 'unit_cost', e.target.value)}
                      placeholder="—" className="input-field text-center text-sm py-2 px-2" />
                    <button onClick={() => removeLine(idx)} className="p-1 text-red-400 hover:text-red-600 touch-manipulation">
                      <X size={16} />
                    </button>
                  </div>
                ))}

                {/* Total estimate */}
                {lines.some(l => l.unit_cost && l.qty_ordered) && (
                  <div className="flex justify-end pt-1">
                    <p className="text-sm font-semibold text-gray-700">
                      Estimated total: {fmtCur(lines.reduce((s, l) => s + (parseFloat(l.qty_ordered) || 0) * (parseFloat(l.unit_cost) || 0), 0))}
                    </p>
                  </div>
                )}

                <button onClick={handlePlaceOrder} disabled={submitting} className="btn-primary mt-2">
                  {submitting ? 'Placing order...' : '📋 Place Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONFIRM RECEIPT ── */}
      {tab === 'confirm' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Pending orders awaiting confirmation.</p>
            <button onClick={loadOrders} className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {ordersLoading ? <LoadingSpinner text="Loading orders..." /> : orders.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-semibold text-gray-600">No pending orders</p>
              <p className="text-sm mt-1">Place an order first.</p>
            </div>
          ) : orders.map(order => (
            <div key={order.id} className="card p-0 overflow-hidden">
              <button onClick={() => toggleOrder(order.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left touch-manipulation hover:bg-orange-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">PO #{order.id} — {order.vendor_name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.status === 'partially_received' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
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
              {order.expanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
                  <div className="space-y-3">
                    {order.lines.map(line => {
                      const remaining = line.qty_ordered - line.qty_received;
                      return (
                        <div key={line.id} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-900 text-sm">{line.ingredient_name}</p>
                            <span className="text-xs text-gray-500">Ordered: <strong>{formatNumber(line.qty_ordered)} {line.unit}</strong></span>
                          </div>
                          {line.qty_received > 0 && (
                            <p className="text-xs text-amber-600 mb-2">Already received: {formatNumber(line.qty_received)} {line.unit} · Remaining: {formatNumber(remaining)} {line.unit}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label-text block mb-1">Qty received ({line.unit})</label>
                              <input type="number" min="0" step="0.1" max={remaining} value={line.qty_now}
                                onChange={e => updateLineField(order.id, line.id, 'qty_now', e.target.value)}
                                placeholder={`Max ${formatNumber(remaining)}`} className="input-field" />
                            </div>
                            <div>
                              <label className="label-text block mb-1 text-red-600">Spoilt ({line.unit})</label>
                              <input type="number" min="0" step="0.1" value={line.qty_spoilt}
                                onChange={e => updateLineField(order.id, line.id, 'qty_spoilt', e.target.value)}
                                placeholder="0" className="input-field border-red-200" />
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
                  <button onClick={() => confirmReceipt(order)} disabled={confirming === order.id} className="btn-primary">
                    {confirming === order.id ? 'Confirming...' : '✅ Confirm Receipt & Update Stock'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Last 50 received orders.</p>
            <button onClick={loadHistory} className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {historyLoading ? <LoadingSpinner text="Loading..." /> : history.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="font-semibold text-gray-600">No history yet</p>
            </div>
          ) : history.map(order => (
            <div key={order.id} className="card p-0 overflow-hidden">
              <button onClick={() => setHistory(prev => prev.map(o => o.id === order.id ? { ...o, expanded: !o.expanded } : o))}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left touch-manipulation hover:bg-orange-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">PO #{order.id} — {order.vendor_name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${order.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.status === 'received' ? 'Received' : 'Partial'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.ordered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{order.lines.length} item{order.lines.length !== 1 ? 's' : ''}
                    {order.note ? ` · ${order.note}` : ''}
                  </p>
                  {/* Order total */}
                  {order.lines.some(l => l.unit_cost) && (
                    <p className="text-xs text-gray-500 mt-0.5 font-semibold">
                      Total: {fmtCur(order.lines.reduce((s, l) => s + l.qty_received * (l.unit_cost || 0), 0))}
                    </p>
                  )}
                </div>
                {order.expanded ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
              </button>
              {order.expanded && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Ingredient</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Ordered</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Received</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Rate</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.lines.map((line, i) => (
                        <tr key={i} className="hover:bg-orange-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900 text-xs">{line.ingredient_name}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-gray-500">{line.qty_ordered} {line.unit}</td>
                          <td className={`px-4 py-2.5 text-right text-xs font-semibold ${line.qty_received >= line.qty_ordered ? 'text-green-600' : 'text-amber-600'}`}>
                            {line.qty_received} {line.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                            {line.unit_cost ? `₹${line.unit_cost}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-800">
                            {line.unit_cost ? fmtCur(line.qty_received * line.unit_cost) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── EXPENSES ── */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" />
              <p className="text-sm font-semibold text-gray-700">RM Purchases — Month on Month</p>
            </div>
            <button onClick={loadExpenses} className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Search */}
          <input type="text" value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)}
            placeholder="Filter by ingredient..." className="input-field" />

          {expensesLoading ? <LoadingSpinner text="Loading expenses..." /> : expenseRows.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="font-semibold text-gray-600">No expense data yet</p>
              <p className="text-sm mt-1">Received orders with costs will appear here.</p>
            </div>
          ) : (
            <>
              {/* Summary chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="card py-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Total Spend</p>
                  <p className="text-lg font-bold text-gray-900">{fmtCur(grandTotalCost)}</p>
                </div>
                <div className="card py-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">Ingredients Tracked</p>
                  <p className="text-lg font-bold text-gray-900">{filteredExpenseRows.length}</p>
                </div>
                <div className="card py-3 text-center col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-400 mb-1">Months of Data</p>
                  <p className="text-lg font-bold text-gray-900">{expenseMonths.length}</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-xs min-w-max">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-bold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[140px]">Ingredient</th>
                      <th className="text-center px-3 py-3 font-bold text-gray-600 min-w-[50px]">Unit</th>
                      {expenseMonths.map(m => (
                        <th key={m} className="text-right px-3 py-3 font-bold text-gray-600 min-w-[100px]" colSpan={2}>
                          {monthLabel(m)}
                        </th>
                      ))}
                      <th className="text-right px-3 py-3 font-bold text-gray-900 bg-orange-50 min-w-[80px]">Total Qty</th>
                      <th className="text-right px-4 py-3 font-bold text-gray-900 bg-orange-50 min-w-[90px]">Total Cost</th>
                    </tr>
                    {/* Sub-header for months */}
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="sticky left-0 bg-gray-50 z-10" />
                      <th />
                      {expenseMonths.map(m => (
                        <>
                          <th key={m + '-qty'} className="text-right px-3 py-1 text-[10px] font-semibold text-gray-400">Qty</th>
                          <th key={m + '-cost'} className="text-right px-3 py-1 text-[10px] font-semibold text-gray-400">₹ Cost</th>
                        </>
                      ))}
                      <th className="bg-orange-50" />
                      <th className="bg-orange-50" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredExpenseRows.map((row, idx) => (
                      <tr key={row.rm_item_id} className={idx % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50/50 hover:bg-orange-50'}>
                        <td className="px-4 py-2.5 font-semibold text-gray-900 sticky left-0 bg-inherit z-10 truncate max-w-[140px]">{row.name}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{row.unit}</td>
                        {expenseMonths.map(m => (
                          <>
                            <td key={m + '-qty'} className="px-3 py-2.5 text-right text-gray-600">
                              {row.months[m] ? fmt(row.months[m].qty) : '—'}
                            </td>
                            <td key={m + '-cost'} className="px-3 py-2.5 text-right text-gray-700 font-medium">
                              {row.months[m]?.cost ? fmtCur(row.months[m].cost) : '—'}
                            </td>
                          </>
                        ))}
                        <td className="px-3 py-2.5 text-right font-bold text-gray-900 bg-orange-50/50">{fmt(row.total_qty)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-orange-700 bg-orange-50/50">{fmtCur(row.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-gray-200 font-bold">
                      <td className="px-4 py-3 text-gray-900 sticky left-0 bg-gray-100 z-10">TOTAL</td>
                      <td />
                      {expenseMonths.map(m => (
                        <>
                          <td key={m + '-qty'} className="px-3 py-3 text-right text-gray-500 text-[10px]">—</td>
                          <td key={m + '-cost'} className="px-3 py-3 text-right text-gray-800">
                            {monthGrandTotals[m] ? fmtCur(monthGrandTotals[m]) : '—'}
                          </td>
                        </>
                      ))}
                      <td className="px-3 py-3 text-right text-gray-900 bg-orange-100">—</td>
                      <td className="px-4 py-3 text-right text-orange-800 text-sm bg-orange-100">{fmtCur(grandTotalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-xs text-gray-400 text-center">Costs are based on unit_cost × qty_received from confirmed purchase orders.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
