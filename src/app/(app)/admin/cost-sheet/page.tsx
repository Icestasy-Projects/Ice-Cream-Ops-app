'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { DollarSign, Upload, ChevronDown, ChevronUp, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';

type Tab = 'import' | 'sheet' | 'rm-expenses';

interface CostRow {
  id: number;
  flavour_type: string;
  flavour_name: string;
  ingredient: string;
  purpose: string;
  rate: number | null;
  rate_unit: string | null;
  qty_per_batch: number | null;
}

interface PrepProduct {
  id: number;
  name: string;
}

interface RmExpenseRow {
  ingredient: string;
  total_consumed: number;
  unit: string;
  rate: number | null;
  rate_unit: string | null;
  estimated_spend: number | null;
}

const FLAVOUR_TYPES = ['Fruits', 'Nuts', 'Traditional', 'Eastern', 'Couverture', 'Occidental', 'Other'];

const BLANK_NEW_ROW = { ingredient: '', purpose: 'Mix', rate: '', rate_unit: 'Kg', qty_per_batch: '' };

// Parse "₹ 175.00/Ltr" → { rate: 175, unit: "Ltr" }
function parseRate(raw: string): { rate: number | null; unit: string | null } {
  if (!raw) return { rate: null, unit: null };
  const m = raw.match(/[\d,]+\.?\d*/);
  const u = raw.match(/\/(.+)$/);
  return {
    rate: m ? parseFloat(m[0].replace(/,/g, '')) : null,
    unit: u ? u[1].trim() : null,
  };
}

// Parse CSV text into cost rows
function parseCsv(text: string): Omit<CostRow, 'id'>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const rows: Omit<CostRow, 'id'>[] = [];

  for (const line of lines) {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.some(c => /^(type|flavour|ingredient|purpose|rate|qty|amount)$/i.test(c))) continue;
    let typeIdx = -1, flavourIdx = -1, ingIdx = -1, purposeIdx = -1, rateIdx = -1, qtyIdx = -1;
    if (cols.length >= 7) {
      typeIdx = 1; flavourIdx = 2; ingIdx = 3; purposeIdx = 4; rateIdx = 5; qtyIdx = 6;
    } else if (cols.length >= 6) {
      typeIdx = 0; flavourIdx = 1; ingIdx = 2; purposeIdx = 3; rateIdx = 4; qtyIdx = 5;
    } else continue;

    const type = cols[typeIdx] || '';
    const flavour = cols[flavourIdx] || '';
    const ingredient = cols[ingIdx] || '';
    const purpose = cols[purposeIdx] || '';
    const rateRaw = cols[rateIdx] || '';
    const qtyRaw = cols[qtyIdx] || '';

    if (!ingredient || !flavour) continue;

    const { rate, unit } = parseRate(rateRaw);
    const qtyNum = parseFloat(qtyRaw.replace(/,/g, '')) || null;

    rows.push({ flavour_type: type, flavour_name: flavour, ingredient, purpose, rate, rate_unit: unit, qty_per_batch: qtyNum });
  }
  return rows;
}

export default function CostSheetPage() {
  const [tab, setTab] = useState<Tab>('sheet');
  const [rows, setRows] = useState<CostRow[]>([]);
  const [prepProducts, setPrepProducts] = useState<PrepProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<number, { rate: string; qty: string }>>({});
  const [rmExpenses, setRmExpenses] = useState<RmExpenseRow[]>([]);
  const [rmLoading, setRmLoading] = useState(false);

  // Add-row state per flavour key
  const [addingRow, setAddingRow] = useState<Record<string, typeof BLANK_NEW_ROW>>({});
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});

  // Add-flavour modal
  const [showAddFlavour, setShowAddFlavour] = useState(false);
  const [newFlavourName, setNewFlavourName] = useState('');
  const [newFlavourType, setNewFlavourType] = useState('Fruits');

  // Import state
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Omit<CostRow, 'id'>[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/cost-sheet');
    const json = await res.json();
    setRows(json.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRows();
    fetch('/api/admin/prep-products')
      .then(r => r.json())
      .then(j => setPrepProducts(j.items || []));
  }, [loadRows]);

  // Group rows: type → flavour → rows
  const grouped: Record<string, Record<string, CostRow[]>> = {};
  for (const row of rows) {
    if (!grouped[row.flavour_type]) grouped[row.flavour_type] = {};
    if (!grouped[row.flavour_type][row.flavour_name]) grouped[row.flavour_type][row.flavour_name] = [];
    grouped[row.flavour_type][row.flavour_name].push(row);
  }

  // Flavours in prep_products that have NO cost sheet data yet
  const flavoursInSheet = new Set(rows.map(r => r.flavour_name.toLowerCase()));
  const missingFlavours = prepProducts.filter(p => !flavoursInSheet.has(p.name.toLowerCase()));

  function toggleFlavour(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function startEdit(row: CostRow) {
    setEditing(prev => ({
      ...prev,
      [row.id]: { rate: row.rate?.toString() ?? '', qty: row.qty_per_batch?.toString() ?? '' },
    }));
  }

  function cancelEdit(id: number) {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function saveEdit(row: CostRow) {
    const e = editing[row.id];
    if (!e) return;
    const rate = e.rate !== '' ? parseFloat(e.rate) : null;
    const qty_per_batch = e.qty !== '' ? parseFloat(e.qty) : null;
    const res = await fetch('/api/admin/cost-sheet', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, rate, qty_per_batch }),
    });
    if (!res.ok) { toast.error('Save failed'); return; }
    toast.success('Saved');
    cancelEdit(row.id);
    await loadRows();
  }

  async function deleteRow(id: number) {
    const res = await fetch('/api/admin/cost-sheet', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error('Delete failed'); return; }
    toast.success('Removed');
    await loadRows();
  }

  // Add a new ingredient row to an existing flavour
  function startAddRow(key: string) {
    setAddingRow(prev => ({ ...prev, [key]: { ...BLANK_NEW_ROW } }));
  }

  function cancelAddRow(key: string) {
    setAddingRow(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function saveNewRow(key: string, flavourType: string, flavourName: string) {
    const r = addingRow[key];
    if (!r?.ingredient.trim()) { toast.error('Ingredient name required'); return; }
    setSavingRow(prev => ({ ...prev, [key]: true }));
    const res = await fetch('/api/admin/cost-sheet', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flavour_type: flavourType,
        flavour_name: flavourName,
        ingredient: r.ingredient.trim(),
        purpose: r.purpose,
        rate: r.rate !== '' ? parseFloat(r.rate) : null,
        rate_unit: r.rate_unit || null,
        qty_per_batch: r.qty_per_batch !== '' ? parseFloat(r.qty_per_batch) : null,
      }),
    });
    setSavingRow(prev => { const n = { ...prev }; delete n[key]; return n; });
    if (!res.ok) { toast.error('Failed to add ingredient'); return; }
    toast.success('Ingredient added');
    cancelAddRow(key);
    await loadRows();
  }

  // Add a new flavour (no rows yet)
  async function addNewFlavour() {
    if (!newFlavourName.trim()) { toast.error('Select a flavour'); return; }
    // Just add a placeholder row with empty rate/qty so the flavour appears
    const res = await fetch('/api/admin/cost-sheet', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flavour_type: newFlavourType,
        flavour_name: newFlavourName,
        ingredient: '(add ingredients below)',
        purpose: 'Mix',
        rate: null,
        rate_unit: null,
        qty_per_batch: null,
      }),
    });
    if (!res.ok) { toast.error('Failed'); return; }
    toast.success(`${newFlavourName} added to cost sheet`);
    setShowAddFlavour(false);
    setNewFlavourName('');
    const key = `${newFlavourType}::${newFlavourName}`;
    setExpanded(prev => ({ ...prev, [key]: true }));
    await loadRows();
  }

  function batchCost(flavourRows: CostRow[]): number | null {
    let total = 0;
    let hasAny = false;
    for (const r of flavourRows) {
      if (r.rate != null && r.qty_per_batch != null) { total += r.rate * r.qty_per_batch; hasAny = true; }
    }
    return hasAny ? total : null;
  }

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreview(parseCsv(text));
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview.length) return;
    setImporting(true);
    const res = await fetch('/api/admin/cost-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: preview }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || 'Import failed'); setImporting(false); return; }
    const skippedMsg = json.skipped?.length ? ` (${json.skipped.length} unrecognised flavours skipped)` : '';
    toast.success(`Imported ${json.imported} rows${skippedMsg}`, { duration: 5000 });
    setPreview([]);
    setFileName('');
    await loadRows();
    setTab('sheet');
    setImporting(false);
  }

  async function loadRmExpenses() {
    setRmLoading(true);
    try {
      const res = await fetch('/api/admin/rm-expenses');
      if (!res.ok) { setRmLoading(false); return; }
      const json = await res.json();
      setRmExpenses(json.items || []);
    } finally {
      setRmLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'rm-expenses' && rmExpenses.length === 0) loadRmExpenses();
  }, [tab]);

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={DollarSign} iconColor="text-green-600"
        title="Cost Sheet"
        description="Track production cost per flavour. Edit rates and batch quantities, import from CSV, and see RM consumption spend."
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['sheet', 'import', 'rm-expenses'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'sheet' ? 'Cost Sheet' : t === 'import' ? 'Import CSV' : 'RM Expenses'}
          </button>
        ))}
      </div>

      {/* IMPORT TAB */}
      {tab === 'import' && (
        <div className="card space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600 font-medium">{fileName || 'Drop CSV here or click to browse'}</p>
            <p className="text-xs text-gray-400 mt-1">Expected columns: Type, Flavour, Ingredient, Purpose, Rate, Qty</p>
            <p className="text-xs text-orange-500 mt-1">Only flavours already in your system will be imported</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {preview.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 font-medium">{preview.length} rows parsed — preview (first 10):</p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Flavour</th>
                      <th className="text-left px-3 py-2">Ingredient</th>
                      <th className="text-left px-3 py-2">Purpose</th>
                      <th className="text-right px-3 py-2">Rate</th>
                      <th className="text-right px-3 py-2">Qty/Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 text-gray-500">{r.flavour_type}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-800">{r.flavour_name}</td>
                        <td className="px-3 py-1.5 text-gray-700">{r.ingredient}</td>
                        <td className="px-3 py-1.5 text-gray-500">{r.purpose}</td>
                        <td className="px-3 py-1.5 text-right">{r.rate != null ? `₹${r.rate}/${r.rate_unit}` : '—'}</td>
                        <td className="px-3 py-1.5 text-right">{r.qty_per_batch ?? '—'}</td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr className="border-t border-gray-100">
                        <td colSpan={6} className="px-3 py-2 text-center text-gray-400 text-xs">…and {preview.length - 10} more rows</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={handleImport} disabled={importing} className="btn-primary w-full">
                {importing ? 'Importing…' : `Import All ${preview.length} Rows (replaces existing data)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* COST SHEET TAB */}
      {tab === 'sheet' && (
        loading ? <LoadingSpinner text="Loading cost sheet…" /> : (
          <div className="space-y-3">
            {/* Flavours with no cost data yet */}
            {missingFlavours.length > 0 && (
              <div className="card border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">{missingFlavours.length} flavour{missingFlavours.length !== 1 ? 's' : ''} with no cost data</p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {missingFlavours.map(p => p.name).join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddFlavour(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors shrink-0"
                  >
                    <Plus size={14} /> Add Flavour
                  </button>
                </div>
              </div>
            )}

            {rows.length === 0 && missingFlavours.length === 0 && (
              <div className="card text-center text-gray-400 py-10">No data yet — import a CSV or add a flavour.</div>
            )}

            {Object.entries(grouped).map(([type, flavours]) => (
              <div key={type} className="card overflow-hidden p-0">
                <div className="px-4 py-2 bg-orange-50 border-b border-orange-100">
                  <h3 className="font-bold text-orange-700 text-sm uppercase tracking-wide">{type}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {Object.entries(flavours).map(([flavour, fRows]) => {
                    const key = `${type}::${flavour}`;
                    const isOpen = expanded[key];
                    const cost = batchCost(fRows);
                    const addRow = addingRow[key];
                    return (
                      <div key={flavour}>
                        <button
                          onClick={() => toggleFlavour(key)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div>
                            <span className="font-semibold text-gray-800">{flavour}</span>
                            <span className="text-xs text-gray-400 ml-2">{fRows.length} ingredient{fRows.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {cost != null && (
                              <span className="text-sm font-bold text-green-700">
                                ₹{formatNumber(cost)}/batch
                                <span className="text-xs font-normal text-gray-400 ml-1">(₹{formatNumber(cost / 20)}/L)</span>
                              </span>
                            )}
                            {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 text-xs text-gray-400">
                                <tr>
                                  <th className="text-left px-4 py-2">Ingredient</th>
                                  <th className="text-left px-4 py-2">Purpose</th>
                                  <th className="text-right px-4 py-2">Rate</th>
                                  <th className="text-right px-4 py-2">Qty/Batch</th>
                                  <th className="text-right px-4 py-2">Cost</th>
                                  <th className="px-4 py-2 w-16"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {fRows.map(row => {
                                  const e = editing[row.id];
                                  const rowCost = row.rate != null && row.qty_per_batch != null ? row.rate * row.qty_per_batch : null;
                                  return (
                                    <tr key={row.id} className="hover:bg-orange-50/30">
                                      <td className="px-4 py-2 text-gray-800 font-medium">{row.ingredient}</td>
                                      <td className="px-4 py-2 text-gray-500 text-xs">{row.purpose}</td>
                                      <td className="px-4 py-2 text-right">
                                        {e ? (
                                          <input type="number" min="0" step="0.01" value={e.rate}
                                            onChange={ev => setEditing(prev => ({ ...prev, [row.id]: { ...prev[row.id], rate: ev.target.value } }))}
                                            className="w-24 text-right border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                                            onWheel={ev => ev.currentTarget.blur()} />
                                        ) : (
                                          <span className="text-gray-700">
                                            {row.rate != null ? `₹${row.rate}` : '—'}
                                            {row.rate_unit && <span className="text-gray-400 text-xs">/{row.rate_unit}</span>}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {e ? (
                                          <input type="number" min="0" step="0.001" value={e.qty}
                                            onChange={ev => setEditing(prev => ({ ...prev, [row.id]: { ...prev[row.id], qty: ev.target.value } }))}
                                            className="w-24 text-right border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                                            onWheel={ev => ev.currentTarget.blur()} />
                                        ) : (
                                          <span className="text-gray-700">{row.qty_per_batch ?? '—'}</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right text-green-700 font-semibold">
                                        {rowCost != null ? `₹${formatNumber(rowCost)}` : '—'}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {e ? (
                                          <div className="flex items-center gap-1 justify-end">
                                            <button onClick={() => saveEdit(row)} className="text-green-600 hover:text-green-700 p-1 rounded"><Check size={14} /></button>
                                            <button onClick={() => cancelEdit(row.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded"><X size={14} /></button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 justify-end">
                                            <button onClick={() => startEdit(row)} className="text-gray-300 hover:text-orange-500 p-1 rounded transition-colors"><Pencil size={14} /></button>
                                            <button onClick={() => deleteRow(row.id)} className="text-gray-300 hover:text-red-500 p-1 rounded transition-colors"><Trash2 size={13} /></button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}

                                {/* Add new row inline */}
                                {addRow && (
                                  <tr className="bg-orange-50/60">
                                    <td className="px-4 py-2">
                                      <input
                                        autoFocus
                                        type="text" placeholder="Ingredient name"
                                        value={addRow.ingredient}
                                        onChange={e => setAddingRow(prev => ({ ...prev, [key]: { ...prev[key], ingredient: e.target.value } }))}
                                        className="w-full border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                                      />
                                    </td>
                                    <td className="px-4 py-2">
                                      <select value={addRow.purpose}
                                        onChange={e => setAddingRow(prev => ({ ...prev, [key]: { ...prev[key], purpose: e.target.value } }))}
                                        className="border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white">
                                        {['Mix', 'Topping', 'Packaging', 'Other'].map(p => <option key={p}>{p}</option>)}
                                      </select>
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex items-center gap-1 justify-end">
                                        <span className="text-gray-400 text-xs">₹</span>
                                        <input type="number" min="0" step="0.01" placeholder="Rate" value={addRow.rate}
                                          onChange={e => setAddingRow(prev => ({ ...prev, [key]: { ...prev[key], rate: e.target.value } }))}
                                          className="w-20 text-right border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                                          onWheel={e => e.currentTarget.blur()} />
                                        <span className="text-gray-400 text-xs">/</span>
                                        <input type="text" placeholder="Kg" value={addRow.rate_unit}
                                          onChange={e => setAddingRow(prev => ({ ...prev, [key]: { ...prev[key], rate_unit: e.target.value } }))}
                                          className="w-12 border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
                                      </div>
                                    </td>
                                    <td className="px-4 py-2">
                                      <input type="number" min="0" step="0.001" placeholder="Qty" value={addRow.qty_per_batch}
                                        onChange={e => setAddingRow(prev => ({ ...prev, [key]: { ...prev[key], qty_per_batch: e.target.value } }))}
                                        className="w-24 text-right border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 ml-auto block"
                                        onWheel={e => e.currentTarget.blur()} />
                                    </td>
                                    <td className="px-4 py-2 text-gray-400 text-right text-sm">—</td>
                                    <td className="px-4 py-2">
                                      <div className="flex items-center gap-1 justify-end">
                                        <button onClick={() => saveNewRow(key, type, flavour)} disabled={savingRow[key]} className="text-green-600 hover:text-green-700 p-1 rounded"><Check size={14} /></button>
                                        <button onClick={() => cancelAddRow(key)} className="text-gray-400 hover:text-gray-600 p-1 rounded"><X size={14} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                              <tfoot>
                                {cost != null && (
                                  <tr className="bg-orange-50 font-bold text-sm border-t border-orange-200">
                                    <td colSpan={4} className="px-4 py-2 text-right text-gray-600">Total per 20L batch</td>
                                    <td className="px-4 py-2 text-right text-green-700">₹{formatNumber(cost)}</td>
                                    <td></td>
                                  </tr>
                                )}
                                <tr className="border-t border-gray-100">
                                  <td colSpan={6} className="px-4 py-2">
                                    {!addRow ? (
                                      <button onClick={() => startAddRow(key)} className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium py-1">
                                        <Plus size={13} /> Add ingredient
                                      </button>
                                    ) : null}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* RM EXPENSES TAB */}
      {tab === 'rm-expenses' && (
        rmLoading ? <LoadingSpinner text="Loading RM expenses…" /> : (
          <div className="card overflow-hidden p-0">
            {rmExpenses.length === 0 ? (
              <div className="text-center text-gray-400 py-10">No RM consumption data yet, or cost sheet not imported.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-400 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3">Ingredient</th>
                    <th className="text-right px-4 py-3">Total Consumed</th>
                    <th className="text-right px-4 py-3">Rate</th>
                    <th className="text-right px-4 py-3">Est. Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rmExpenses.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{r.ingredient}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatNumber(r.total_consumed)} {r.unit}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 text-xs">
                        {r.rate != null ? `₹${r.rate}/${r.rate_unit}` : <span className="text-gray-300">no rate</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-700">
                        {r.estimated_spend != null ? `₹${formatNumber(r.estimated_spend)}` : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                  {rmExpenses.some(r => r.estimated_spend != null) && (
                    <tr className="bg-green-50 border-t border-green-200 font-bold">
                      <td colSpan={3} className="px-4 py-3 text-right text-gray-600">Total RM Spend</td>
                      <td className="px-4 py-3 text-right text-green-700">
                        ₹{formatNumber(rmExpenses.reduce((s, r) => s + (r.estimated_spend ?? 0), 0))}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {/* ADD FLAVOUR MODAL */}
      {showAddFlavour && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Add Flavour to Cost Sheet</h3>
            <div>
              <label className="label-text block mb-1">Flavour</label>
              <select value={newFlavourName} onChange={e => setNewFlavourName(e.target.value)} className="input-field">
                <option value="">— Select a flavour —</option>
                {missingFlavours.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text block mb-1">Type / Category</label>
              <select value={newFlavourType} onChange={e => setNewFlavourType(e.target.value)} className="input-field">
                {FLAVOUR_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddFlavour(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={addNewFlavour} className="btn-primary flex-1">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
