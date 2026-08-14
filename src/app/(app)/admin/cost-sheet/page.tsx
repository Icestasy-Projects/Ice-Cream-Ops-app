'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import { DollarSign, Upload, ChevronDown, ChevronUp, Pencil, Check, X, BarChart2 } from 'lucide-react';

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

interface RmExpenseRow {
  ingredient: string;
  total_consumed: number;
  unit: string;
  rate: number | null;
  rate_unit: string | null;
  estimated_spend: number | null;
}

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
    // Detect header rows
    if (cols.some(c => /^(type|flavour|ingredient|purpose|rate|qty|amount)$/i.test(c))) continue;
    // Expect: [blank?, Type, Flavour, Ingredient, Purpose, Rate, Qty, Amount]
    // Try to find the right columns by scanning
    let typeIdx = -1, flavourIdx = -1, ingIdx = -1, purposeIdx = -1, rateIdx = -1, qtyIdx = -1;
    if (cols.length >= 7) {
      // Assume column layout: 0=blank, 1=type, 2=flavour, 3=ingredient, 4=purpose, 5=rate, 6=qty, 7=amount
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

    rows.push({
      flavour_type: type,
      flavour_name: flavour,
      ingredient,
      purpose,
      rate,
      rate_unit: unit,
      qty_per_batch: qtyNum,
    });
  }
  return rows;
}

export default function CostSheetPage() {
  const [tab, setTab] = useState<Tab>('sheet');
  const [rows, setRows] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<number, { rate: string; qty: string }>>({});
  const [rmExpenses, setRmExpenses] = useState<RmExpenseRow[]>([]);
  const [rmLoading, setRmLoading] = useState(false);

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

  useEffect(() => { loadRows(); }, [loadRows]);

  // Group rows: type → flavour → rows
  const grouped: Record<string, Record<string, CostRow[]>> = {};
  for (const row of rows) {
    if (!grouped[row.flavour_type]) grouped[row.flavour_type] = {};
    if (!grouped[row.flavour_type][row.flavour_name]) grouped[row.flavour_type][row.flavour_name] = [];
    grouped[row.flavour_type][row.flavour_name].push(row);
  }

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

  // Compute batch cost for a flavour
  function batchCost(flavourRows: CostRow[]): number | null {
    let total = 0;
    let hasAny = false;
    for (const r of flavourRows) {
      if (r.rate != null && r.qty_per_batch != null) {
        total += r.rate * r.qty_per_batch;
        hasAny = true;
      }
    }
    return hasAny ? total : null;
  }

  // File parsing
  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      setPreview(parsed);
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
    const skippedMsg = json.skipped?.length
      ? ` (${json.skipped.length} unrecognised flavours skipped)`
      : '';
    toast.success(`Imported ${json.imported} rows${skippedMsg}`, { duration: 5000 });
    setPreview([]);
    setFileName('');
    await loadRows();
    setTab('sheet');
    setImporting(false);
  }

  // RM Expenses tab — fetch rm_ledger issue_to_prep movements, cross-ref with cost_sheet
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
                        <td className="px-3 py-1.5 text-right">
                          {r.rate != null ? `₹${r.rate}/${r.rate_unit}` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-right">{r.qty_per_batch ?? '—'}</td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr className="border-t border-gray-100">
                        <td colSpan={6} className="px-3 py-2 text-center text-gray-400 text-xs">
                          …and {preview.length - 10} more rows
                        </td>
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
            {rows.length === 0 && (
              <div className="card text-center text-gray-400 py-10">
                No data yet — import a CSV first.
              </div>
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
                    return (
                      <div key={flavour}>
                        <button
                          onClick={() => toggleFlavour(key)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div>
                            <span className="font-semibold text-gray-800">{flavour}</span>
                            <span className="text-xs text-gray-400 ml-2">{fRows.length} ingredients</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {cost != null && (
                              <span className="text-sm font-bold text-green-700">
                                ₹{formatNumber(cost)}/batch
                                <span className="text-xs font-normal text-gray-400 ml-1">
                                  (₹{formatNumber(cost / 20)}/L)
                                </span>
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
                                  <th className="px-4 py-2"></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {fRows.map(row => {
                                  const e = editing[row.id];
                                  const rowCost = row.rate != null && row.qty_per_batch != null
                                    ? row.rate * row.qty_per_batch : null;
                                  return (
                                    <tr key={row.id} className="hover:bg-orange-50/30">
                                      <td className="px-4 py-2 text-gray-800 font-medium">{row.ingredient}</td>
                                      <td className="px-4 py-2 text-gray-500 text-xs">{row.purpose}</td>
                                      <td className="px-4 py-2 text-right">
                                        {e ? (
                                          <input
                                            type="number" min="0" step="0.01"
                                            value={e.rate}
                                            onChange={ev => setEditing(prev => ({ ...prev, [row.id]: { ...prev[row.id], rate: ev.target.value } }))}
                                            className="w-24 text-right border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                                            onWheel={ev => ev.currentTarget.blur()}
                                          />
                                        ) : (
                                          <span className="text-gray-700">
                                            {row.rate != null ? `₹${row.rate}` : '—'}
                                            {row.rate_unit && <span className="text-gray-400 text-xs">/{row.rate_unit}</span>}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {e ? (
                                          <input
                                            type="number" min="0" step="0.001"
                                            value={e.qty}
                                            onChange={ev => setEditing(prev => ({ ...prev, [row.id]: { ...prev[row.id], qty: ev.target.value } }))}
                                            className="w-24 text-right border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                                            onWheel={ev => ev.currentTarget.blur()}
                                          />
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
                                            <button onClick={() => saveEdit(row)} className="text-green-600 hover:text-green-700 p-1 rounded">
                                              <Check size={14} />
                                            </button>
                                            <button onClick={() => cancelEdit(row.id)} className="text-gray-400 hover:text-gray-600 p-1 rounded">
                                              <X size={14} />
                                            </button>
                                          </div>
                                        ) : (
                                          <button onClick={() => startEdit(row)} className="text-gray-300 hover:text-orange-500 p-1 rounded transition-colors">
                                            <Pencil size={14} />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              {cost != null && (
                                <tfoot>
                                  <tr className="bg-orange-50 font-bold text-sm border-t border-orange-200">
                                    <td colSpan={4} className="px-4 py-2 text-right text-gray-600">Total per 20L batch</td>
                                    <td className="px-4 py-2 text-right text-green-700">₹{formatNumber(cost)}</td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              )}
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
              <div className="text-center text-gray-400 py-10">
                No RM consumption data yet, or cost sheet not imported.
              </div>
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
                      <td className="px-4 py-2.5 text-right text-gray-600">
                        {formatNumber(r.total_consumed)} {r.unit}
                      </td>
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
    </div>
  );
}
