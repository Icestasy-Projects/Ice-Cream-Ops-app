'use client';
import { useEffect, useState, useCallback } from 'react';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Link2, RefreshCw, CheckCircle2, AlertCircle, Search, X, Wand2 } from 'lucide-react';

interface AlignmentRow {
  sku_id: number;
  linked: boolean;
  name: string | null;
  product_name: string | null;
  flavour_id: number | null;
  flavour_name: string | null;
  pack_format_id: number | null;
  pack_format_name: string | null;
  flavour_matches_product: boolean | null;
}

interface FgStockItem {
  fg_sku_id: number;
  product_name: string;
  unit: string;
  qty_on_hand: number;
}

interface PackFormat {
  id: number;
  name: string;
  unit_volume_ml: number;
  units_per_pack: number;
}

interface Flavour {
  id: number;
  name: string;
}

interface AlignmentData {
  rows: AlignmentRow[];
  fg_stock: FgStockItem[];
  pack_formats: PackFormat[];
  flavours: Flavour[];
  total: number;
  linked: number;
  unlinked: number;
  mismatched: number;
}

interface EditState {
  sku_id: number;
  flavour_id: number | '';
  pack_format_id: number | '';
  name: string;
}

export default function SkuAlignmentPage() {
  const [data, setData] = useState<AlignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showOnly, setShowOnly] = useState<'all' | 'unlinked' | 'linked'>('unlinked');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoAligning, setAutoAligning] = useState(false);
  const [autoAlignResult, setAutoAlignResult] = useState<string | null>(null);
  const [view, setView] = useState<'table' | 'map'>('table');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sku-alignment');
      const json = await res.json();
      if (json.error) { setError(json.error); setLoading(false); return; }
      setData(json);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = (data?.rows || []).filter(row => {
    if (showOnly === 'unlinked' && row.linked) return false;
    if (showOnly === 'linked' && !row.linked) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !String(row.sku_id).includes(q) &&
        !(row.name?.toLowerCase().includes(q)) &&
        !(row.flavour_name?.toLowerCase().includes(q)) &&
        !(row.pack_format_name?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  function startEdit(row: AlignmentRow) {
    setEditing({
      sku_id: row.sku_id,
      flavour_id: row.flavour_id ?? '',
      pack_format_id: row.pack_format_id ?? '',
      name: row.name ?? `SKU #${row.sku_id}`,
    });
    setSaveError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.flavour_id || !editing.pack_format_id) {
      setSaveError('Please select both flavour and pack format.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/sku-alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku_id: editing.sku_id,
          flavour_id: editing.flavour_id,
          pack_format_id: editing.pack_format_id,
          name: editing.name,
        }),
      });
      const json = await res.json();
      if (json.error) { setSaveError(json.error); setSaving(false); return; }
      setEditing(null);
      await load();
    } catch (e) {
      setSaveError(String(e));
    }
    setSaving(false);
  }

  async function runAutoAlign() {
    setAutoAligning(true);
    setAutoAlignResult(null);
    try {
      const res = await fetch('/api/admin/sku-alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_align' }),
      });
      const json = await res.json();
      if (json.error) { setAutoAlignResult(`Error: ${json.error}`); }
      else {
        setAutoAlignResult(`Done — ${json.applied} SKU flavour links updated. ${json.unmatched_count} could not be matched automatically.`);
        await load();
      }
    } catch (e) { setAutoAlignResult(`Error: ${String(e)}`); }
    setAutoAligning(false);
  }

  async function deleteLink(skuId: number) {
    if (!confirm(`Remove link for SKU #${skuId}? This will break weekly req calculations for this SKU.`)) return;
    await fetch(`/api/admin/sku-alignment?sku_id=${skuId}`, { method: 'DELETE' });
    await load();
  }

  const flavours = data?.flavours || [];
  const packFormats = data?.pack_formats || [];

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={Link2} iconColor="text-indigo-500"
        title="SKU Alignment"
        description="Link sales-side SKU IDs (from order lines) to production flavours and pack formats. Required for weekly req calculations."
      />

      {loading ? (
        <LoadingSpinner text="Loading alignment data..." />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>
      ) : data && (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{data.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total SKUs</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-700">{data.linked}</p>
              <p className="text-xs text-green-600 mt-0.5">Linked</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-red-700">{data.unlinked}</p>
              <p className="text-xs text-red-600 mt-0.5">Unlinked</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-amber-700">{data.mismatched}</p>
              <p className="text-xs text-amber-600 mt-0.5">Name Mismatch</p>
            </div>
          </div>

          {/* Auto-align */}
          <div className="flex flex-col gap-2">
            <button
              onClick={runAutoAlign}
              disabled={autoAligning}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 w-fit touch-manipulation"
            >
              <Wand2 size={16} />
              {autoAligning ? 'Aligning…' : 'Auto-Align Flavours by Product Name'}
            </button>
            {autoAlignResult && (
              <p className={`text-sm px-3 py-2 rounded-xl ${autoAlignResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {autoAlignResult}
              </p>
            )}
          </div>

          {/* View toggle + Refresh */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              {(['table', 'map'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {v === 'table' ? 'SKU Table' : 'Flavour Map'}
                </button>
              ))}
            </div>
            <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation ml-auto">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {/* Controls (table view only) */}
          {view === 'table' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
              <div className="flex gap-2 flex-wrap">
                {(['unlinked', 'linked', 'all'] as const).map(key => (
                  <button key={key} onClick={() => setShowOnly(key)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${showOnly === key ? 'ring-2 ring-offset-1 ring-gray-400' : ''} ${
                      key === 'unlinked' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                      key === 'linked' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {key === 'unlinked' ? `Unlinked (${data.unlinked})` :
                     key === 'linked' ? `Linked (${data.linked})` : `All (${data.total})`}
                  </button>
                ))}
              </div>
              <div className="relative max-w-xs w-full sm:w-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search SKU, flavour, format…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
              </div>
            </div>
          )}

          {/* Edit modal overlay */}
          {editing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditing(null)}>
              <div className="absolute inset-0 bg-black/40" />
              <div
                className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">Link SKU #{editing.sku_id}</h2>
                  <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editing.name}
                      onChange={e => setEditing(s => s ? { ...s, name: e.target.value } : s)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder={`SKU #${editing.sku_id}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Flavour (Production)</label>
                    <select
                      value={editing.flavour_id}
                      onChange={e => setEditing(s => s ? { ...s, flavour_id: Number(e.target.value) || '' } : s)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    >
                      <option value="">— select flavour —</option>
                      {flavours.sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Pack Format (Sales)</label>
                    <select
                      value={editing.pack_format_id}
                      onChange={e => setEditing(s => s ? { ...s, pack_format_id: Number(e.target.value) || '' } : s)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                    >
                      <option value="">— select format —</option>
                      {packFormats.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit_volume_ml}ml × {p.units_per_pack})
                        </option>
                      ))}
                    </select>
                  </div>

                  {saveError && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex-1 bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-brand-600 disabled:opacity-50 transition-colors touch-manipulation"
                  >
                    {saving ? 'Saving...' : 'Save Link'}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TABLE VIEW ── */}
          {view === 'table' && (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">FG Product</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Mapped Flavour</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Pack Format</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No SKUs match your filter.</td></tr>
                  ) : filtered.map(row => {
                    const mismatch = row.flavour_matches_product === false;
                    return (
                      <tr key={row.sku_id} className={`hover:bg-gray-50 transition-colors ${mismatch ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">#{row.sku_id}</span>
                          {row.name && <span className="ml-2 text-xs text-gray-500">{row.name}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{row.product_name ?? <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3">
                          {row.flavour_name
                            ? <span className={`font-semibold ${mismatch ? 'text-amber-700' : 'text-indigo-700'}`}>{row.flavour_name}</span>
                            : <span className="text-red-400 text-xs">Not linked</span>}
                          {mismatch && <span className="ml-1 text-xs text-amber-500" title="Flavour name doesn't match product name">⚠</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.pack_format_name ?? <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3">
                          {!row.linked
                            ? <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><AlertCircle size={11} /> Unlinked</span>
                            : mismatch
                            ? <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">⚠ Mismatch</span>
                            : <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} /> OK</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(row)}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition-colors touch-manipulation">
                              {row.linked ? 'Edit' : 'Link'}
                            </button>
                            {row.linked && (
                              <button onClick={() => deleteLink(row.sku_id)}
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors touch-manipulation">
                                Unlink
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── FLAVOUR MAP VIEW ── */}
          {view === 'map' && (() => {
            // Group linked SKUs by flavour name
            const byFlavour = new Map<string, AlignmentRow[]>();
            for (const row of data.rows) {
              if (!row.linked) continue;
              const key = row.flavour_name ?? '(no flavour)';
              if (!byFlavour.has(key)) byFlavour.set(key, []);
              byFlavour.get(key)!.push(row);
            }
            const unlinkedRows = data.rows.filter(r => !r.linked);
            const sorted = Array.from(byFlavour.entries()).sort((a, b) => a[0].localeCompare(b[0]));
            return (
              <div className="space-y-3">
                {sorted.map(([flavourName, rows]) => {
                  const hasMismatch = rows.some(r => r.flavour_matches_product === false);
                  return (
                    <div key={flavourName} className={`rounded-2xl border overflow-hidden ${hasMismatch ? 'border-amber-200' : 'border-green-200'}`}>
                      <div className={`px-4 py-2.5 flex items-center gap-2 ${hasMismatch ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <span className={`text-sm font-bold ${hasMismatch ? 'text-amber-800' : 'text-green-800'}`}>{flavourName}</span>
                        <span className="text-xs text-gray-400">{rows.length} SKU{rows.length !== 1 ? 's' : ''}</span>
                        {hasMismatch && <span className="text-xs text-amber-600 ml-auto">⚠ name mismatch</span>}
                      </div>
                      <table className="w-full text-sm bg-white">
                        <thead className="border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">SKU ID</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">SKU Code</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">FG Product Name</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Pack Format</th>
                            <th className="px-4 py-2 text-xs font-semibold text-gray-400">Edit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {rows.map(r => (
                            <tr key={r.sku_id} className={r.flavour_matches_product === false ? 'bg-amber-50/30' : ''}>
                              <td className="px-4 py-2 font-mono text-xs text-gray-500">#{r.sku_id}</td>
                              <td className="px-4 py-2 text-gray-800 font-medium">{r.name ?? '—'}</td>
                              <td className="px-4 py-2 text-gray-700">
                                {r.product_name ?? '—'}
                                {r.flavour_matches_product === false && <span className="ml-1 text-amber-500 text-xs">⚠ mismatch</span>}
                              </td>
                              <td className="px-4 py-2 text-gray-500 text-xs">{r.pack_format_name ?? '—'}</td>
                              <td className="px-4 py-2">
                                <button onClick={() => { setView('table'); setShowOnly('all'); startEdit(r); }}
                                  className="text-xs text-indigo-600 hover:underline touch-manipulation">Edit</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
                {unlinkedRows.length > 0 && (
                  <div className="rounded-2xl border border-red-200 overflow-hidden">
                    <div className="px-4 py-2.5 bg-red-50 flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-500" />
                      <span className="text-sm font-bold text-red-700">Unlinked SKUs</span>
                      <span className="text-xs text-gray-400">{unlinkedRows.length} SKU{unlinkedRows.length !== 1 ? 's' : ''}</span>
                    </div>
                    <table className="w-full text-sm bg-white">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">SKU ID</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">FG Product Name</th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-400">Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {unlinkedRows.map(r => (
                          <tr key={r.sku_id}>
                            <td className="px-4 py-2 font-mono text-xs text-gray-500">#{r.sku_id}</td>
                            <td className="px-4 py-2 text-gray-700">{r.product_name ?? '—'}</td>
                            <td className="px-4 py-2">
                              <button onClick={() => { setView('table'); setShowOnly('unlinked'); startEdit(r); }}
                                className="text-xs text-indigo-600 hover:underline touch-manipulation">Link</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
