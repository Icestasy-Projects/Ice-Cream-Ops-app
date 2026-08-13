'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import { Package, Upload, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';

interface RmItem { id: number; name: string; unit: string; }

interface ParsedRow {
  rawName: string;
  qty: number;
  matched: RmItem | null;
}

export default function OpeningStockPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rmItems, setRmItems] = useState<RmItem[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    supabase.schema('production').from('rm_items')
      .select('id, name, unit').order('name')
      .then(({ data }) => setRmItems((data || []) as RmItem[]));
  }, [supabase]);

  function matchItem(name: string, items: RmItem[]): RmItem | null {
    const n = name.toLowerCase().trim();
    return items.find(i => i.name.toLowerCase().trim() === n)
      || items.find(i => i.name.toLowerCase().includes(n) || n.includes(i.name.toLowerCase()))
      || null;
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setDone(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 }) as string[][];

      const parsed: ParsedRow[] = [];
      for (const row of raw) {
        if (!row || row.length < 2) continue;
        const name = String(row[0] || '').trim();
        const qty = parseFloat(String(row[1] || '0').replace(/[^0-9.]/g, ''));
        if (!name || isNaN(qty) || qty <= 0) continue;
        // Skip header rows
        if (name.toLowerCase().includes('ingredient') || name.toLowerCase().includes('raw material') || name.toLowerCase() === 'name') continue;
        parsed.push({ rawName: name, qty, matched: matchItem(name, rmItems) });
      }
      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function updateMatch(idx: number, item: RmItem | null) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, matched: item } : row));
  }

  function updateQty(idx: number, qty: number) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, qty } : row));
  }

  function removeRow(idx: number) {
    setRows(r => r.filter((_, i) => i !== idx));
  }

  const matchedRows = rows.filter(r => r.matched && r.qty > 0);
  const unmatchedRows = rows.filter(r => !r.matched);

  async function handleSubmit() {
    if (matchedRows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/opening-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: matchedRows.map(r => ({ id: r.matched!.id, qty: r.qty })) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setDone(true);
      toast.success(`Opening stock set — ${matchedRows.length} ingredients loaded`);
      setRows([]);
      setFileName('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load stock');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <ScreenHeader
        icon={Package} iconColor="text-blue-500"
        title="Opening Stock"
        description="Upload a CSV or Excel file to reset and set the current physical stock for all raw materials."
      />

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle className="text-green-600 shrink-0" size={20} />
          <p className="text-green-800 font-medium">Opening stock loaded successfully. RM dashboard is now up to date.</p>
        </div>
      )}

      {/* Upload area */}
      <div className="card">
        <h2 className="section-title mb-3">Upload Stock File</h2>
        <p className="text-sm text-gray-500 mb-4">
          File must have <strong>2 columns</strong>: <code className="bg-gray-100 px-1 rounded">Ingredient Name</code> and <code className="bg-gray-100 px-1 rounded">Quantity</code> (in the ingredient's stored unit). Supports <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-orange-50 transition-colors"
        >
          <Upload className="mx-auto text-gray-300 mb-3" size={32} />
          {fileName
            ? <p className="font-semibold text-gray-700">{fileName}</p>
            : <p className="text-gray-400">Drag & drop or click to upload</p>
          }
          <p className="text-xs text-gray-400 mt-1">.xlsx / .xls / .csv</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      </div>

      {/* Preview table */}
      {rows.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Preview — {rows.length} rows</h2>
            <span className="text-sm text-gray-500">{matchedRows.length} matched · {unmatchedRows.length} unmatched</span>
          </div>

          {unmatchedRows.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
              <p className="text-amber-800 text-sm">
                <strong>{unmatchedRows.length} ingredient{unmatchedRows.length > 1 ? 's' : ''}</strong> couldn't be matched automatically. Select the correct ingredient from the dropdown or remove the row.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">From file</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Matched to</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Qty</th>
                  <th className="py-2 px-2 text-gray-500 font-medium">Unit</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-50 ${!row.matched ? 'bg-amber-50' : ''}`}>
                    <td className="py-2 px-2 text-gray-700">{row.rawName}</td>
                    <td className="py-2 px-2">
                      <select
                        value={row.matched?.id ?? ''}
                        onChange={e => {
                          const item = rmItems.find(i => i.id === parseInt(e.target.value)) || null;
                          updateMatch(idx, item);
                        }}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 w-full max-w-[200px]"
                      >
                        <option value="">— not matched —</option>
                        {rmItems.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={row.qty}
                        min={0}
                        step="any"
                        onChange={e => updateQty(idx, parseFloat(e.target.value) || 0)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 w-24 text-right"
                      />
                    </td>
                    <td className="py-2 px-2 text-gray-400 text-xs">{row.matched?.unit ?? '—'}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-red-500 mb-3">
              ⚠ This will <strong>wipe all existing RM stock</strong> and replace it with the values above.
            </p>
            <button
              onClick={handleSubmit}
              disabled={submitting || matchedRows.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Package size={16} />}
              {submitting ? 'Loading stock...' : `Confirm — Load ${matchedRows.length} Ingredients`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
