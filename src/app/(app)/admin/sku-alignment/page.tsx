'use client';
import { useEffect, useState, useCallback } from 'react';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Link2, RefreshCw, CheckCircle2, AlertCircle, Search, X, Wand2 } from 'lucide-react';

interface AlignmentRow {
  sku_id: number;
  linked: boolean;
  name: string | null;
  flavour_id: number | null;
  flavour_name: string | null;
  pack_format_id: number | null;
  pack_format_name: string | null;
  prep_name: string | null;
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
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{data.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">Total SKU IDs</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-green-700">{data.linked}</p>
              <p className="text-xs text-green-600 mt-0.5">Linked</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-red-700">{data.unlinked}</p>
              <p className="text-xs text-red-600 mt-0.5">Unlinked</p>
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

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(['unlinked', 'linked', 'all'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setShowOnly(key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                    showOnly === key ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                  } ${
                    key === 'unlinked' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                    key === 'linked' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {key === 'unlinked' ? `Unlinked (${data.unlinked})` :
                   key === 'linked' ? `Linked (${data.linked})` :
                   `All (${data.total})`}
                </button>
              ))}
            </div>
            <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU ID, flavour, format..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
            />
          </div>

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

          {/* SKU rows */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">No SKUs match your filter.</p>
            ) : filtered.map(row => (
              <div
                key={row.sku_id}
                className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
                  row.linked
                    ? 'border-green-200 bg-green-50/40'
                    : 'border-red-200 bg-red-50/30'
                }`}
              >
                <div className="shrink-0">
                  {row.linked
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <AlertCircle size={18} className="text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-500">SKU #{row.sku_id}</span>
                    {row.name && <span className="text-sm font-semibold text-gray-900">{row.name}</span>}
                  </div>
                  {row.linked ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-indigo-600">
                        Flavour: <span className="font-semibold">{row.flavour_name ?? '—'}</span>
                      </span>
                      <span className="text-xs text-orange-600">
                        Format: <span className="font-semibold">{row.pack_format_name ?? '—'}</span>
                      </span>
                      {row.prep_name && (
                        <span className="text-xs text-purple-600">
                          Prep: <span className="font-semibold">{row.prep_name}</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 mt-0.5">Not linked — weekly req cannot be calculated</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(row)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition-colors touch-manipulation"
                  >
                    {row.linked ? 'Edit' : 'Link'}
                  </button>
                  {row.linked && (
                    <button
                      onClick={() => deleteLink(row.sku_id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                    >
                      Unlink
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
