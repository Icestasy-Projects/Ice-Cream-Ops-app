'use client';
import { useEffect, useState, useCallback } from 'react';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { GitMerge, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Plus, X, Wand2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface PrepProduct { id: number; name: string; batch_yield_l: number | null; status: string; }
interface SalesSku { id: number; name: string | null; pack_format_id: number | null; pack_format_name: string | null; in_order_lines: boolean; }
interface FlavourRow {
  flavour_id: number;
  flavour_name: string;
  prep_products: PrepProduct[];
  sales_skus: SalesSku[];
  has_prep: boolean;
  has_sales_sku: boolean;
  status: 'ok' | 'no_sales_sku' | 'no_prep' | 'orphan';
}
interface PackFormat { id: number; name: string; unit_volume_ml: number; units_per_pack: number; }
interface FgStockItem { fg_sku_id: number; product_name: string; unit: string; }
interface AlignData {
  flavour_rows: FlavourRow[];
  unlinked_preps: PrepProduct[];
  orphan_sales_skus: { id: number; name: string | null; flavour_id: number | null; pack_format_id: number | null; in_order_lines: boolean; }[];
  unlinked_order_line_skus: number[];
  pack_formats: PackFormat[];
  fg_stock: FgStockItem[];
  summary: {
    total_flavours: number; ok: number; no_sales_sku: number;
    no_prep: number; orphan: number; unlinked_preps: number; unlinked_order_line_skus: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: FlavourRow['status'] }) {
  const map = {
    ok: 'bg-green-100 text-green-700',
    no_sales_sku: 'bg-amber-100 text-amber-700',
    no_prep: 'bg-red-100 text-red-700',
    orphan: 'bg-gray-100 text-gray-500',
  };
  const label = { ok: 'Fully linked', no_sales_sku: 'No sales SKU', no_prep: 'No prep product', orphan: 'Orphan flavour' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${map[status]}`}>
      {label[status]}
    </span>
  );
}

// Modal for creating a sales.skus entry for a flavour
function CreateSkuModal({
  flavourId, flavourName, packFormats, fgStock,
  onSave, onClose,
}: {
  flavourId: number; flavourName: string; packFormats: PackFormat[]; fgStock: FgStockItem[];
  onSave: (skuId: number, packFormatId: number, name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedFgSkuId, setSelectedFgSkuId] = useState('');
  const [packFormatId, setPackFormatId] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function handleFgSelect(fgSkuId: string) {
    setSelectedFgSkuId(fgSkuId);
    if (fgSkuId) {
      const fg = fgStock.find(s => String(s.fg_sku_id) === fgSkuId);
      if (fg && !name) setName(fg.product_name);
      // Auto-select pack format by matching unit string
      if (fg) {
        const unit = fg.unit.toLowerCase();
        const matched = packFormats.find(p =>
          unit.includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().split(' ').some(w => unit.includes(w))
        );
        if (matched) setPackFormatId(String(matched.id));
      }
    }
  }

  async function submit() {
    if (!selectedFgSkuId || !packFormatId) { setErr('FG product and pack format are required.'); return; }
    setSaving(true);
    try {
      const fg = fgStock.find(s => String(s.fg_sku_id) === selectedFgSkuId);
      await onSave(Number(selectedFgSkuId), Number(packFormatId), name || fg?.product_name || flavourName);
      onClose();
    } catch (e) { setErr(String(e)); }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Add SKU for <span className="text-indigo-600">{flavourName}</span></h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">FG Product</label>
            <select value={selectedFgSkuId} onChange={e => handleFgSelect(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" autoFocus>
              <option value="">— select FG product —</option>
              {fgStock.slice().sort((a, b) => a.product_name.localeCompare(b.product_name)).map(s => (
                <option key={s.fg_sku_id} value={s.fg_sku_id}>
                  #{s.fg_sku_id} — {s.product_name} ({s.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Pack Format</label>
            <select value={packFormatId} onChange={e => setPackFormatId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white">
              <option value="">— select format —</option>
              {packFormats.slice().sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit_volume_ml}ml × {p.units_per_pack})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder={flavourName} />
          </div>

          {err && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
        </div>

        <div className="flex gap-2">
          <button onClick={submit} disabled={saving}
            className="flex-1 bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create SKU'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function FlavourAlignmentPage() {
  const [data, setData] = useState<AlignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'issues'>('issues');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ flavourId: number; flavourName: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [creatingSkus, setCreatingSkus] = useState(false);
  const [createSkusResult, setCreateSkusResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/admin/flavour-alignment');
      const json = await res.json();
      if (json.error) { setError(json.error); setLoading(false); return; }
      setData(json);
      // Auto-expand rows with issues
      const issueIds = new Set((json.flavour_rows as FlavourRow[])
        .filter(r => r.status !== 'ok')
        .map(r => r.flavour_id));
      setExpanded(issueIds);
    } catch (e) { setError(String(e)); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleExpand(id: number) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  async function syncAll() {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await fetch('/api/admin/flavour-alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all' }),
      });
      const json = await res.json();
      if (json.error) { setSyncResult(`Error: ${json.error}`); }
      else { setSyncResult(`Done — ${json.inserted} flavour${json.inserted !== 1 ? 's' : ''} added to production.flavours.`); }
      await load();
    } catch (e) { setSyncResult(String(e)); }
    setSyncing(false);
  }

  async function createAllMissingSkus() {
    setCreatingSkus(true); setCreateSkusResult(null);
    try {
      const res = await fetch('/api/admin/flavour-alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_missing_skus' }),
      });
      const json = await res.json();
      if (json.error) {
        setCreateSkusResult(`Error: ${json.error}`);
      } else {
        const count = json.updated ?? json.created ?? 0;
        const skipped = json.skipped?.length ? ` (${json.skipped.length} could not be matched)` : '';
        setCreateSkusResult(`Done — ${count} SKU${count !== 1 ? 's' : ''} linked${skipped}.`);
        await load();
      }
    } catch (e) { setCreateSkusResult(String(e)); }
    setCreatingSkus(false);
  }

  async function createSalesSku(flavourId: number, skuId: number, packFormatId: number, name: string) {
    const res = await fetch('/api/admin/flavour-alignment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_sales_sku', sku_id: skuId, flavour_id: flavourId, pack_format_id: packFormatId, name }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    await load();
  }

  if (loading) return <LoadingSpinner text="Loading flavour alignment..." />;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">{error}</div>;
  if (!data) return null;

  const { summary, flavour_rows, unlinked_preps, orphan_sales_skus, unlinked_order_line_skus, pack_formats, fg_stock } = data;

  const visibleRows = filter === 'issues'
    ? flavour_rows.filter(r => r.status !== 'ok')
    : flavour_rows;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={GitMerge} iconColor="text-indigo-500"
        title="Flavour Alignment"
        description="2-way check: production.prep_products (flavours) ↔ sales.skus. Ensures every prep product has a matching sales SKU."
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Flavours', value: summary.total_flavours, cls: 'bg-white border-gray-100 text-gray-900' },
          { label: 'Fully Linked', value: summary.ok, cls: 'bg-green-50 border-green-100 text-green-700' },
          { label: 'No Sales SKU', value: summary.no_sales_sku, cls: 'bg-amber-50 border-amber-100 text-amber-700' },
          { label: 'No Prep Product', value: summary.no_prep, cls: 'bg-red-50 border-red-100 text-red-700' },
        ].map(t => (
          <div key={t.label} className={`rounded-2xl border p-4 text-center shadow-sm ${t.cls}`}>
            <p className="text-2xl font-bold">{t.value}</p>
            <p className="text-xs mt-0.5 opacity-80">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Alert strips */}
      {unlinked_preps.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle size={15} /> {unlinked_preps.length} prep product{unlinked_preps.length !== 1 ? 's' : ''} have no flavour_id set
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {unlinked_preps.map(p => p.name as string).join(', ')}
          </p>
          <p className="text-xs text-amber-600 mt-1">Go to Manage Flavours to assign a flavour_id to these prep products.</p>
        </div>
      )}

      {unlinked_order_line_skus.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertCircle size={15} /> {unlinked_order_line_skus.length} order-line SKU ID{unlinked_order_line_skus.length !== 1 ? 's' : ''} not in sales.skus
          </p>
          <p className="text-xs text-red-700 mt-1">
            IDs: {unlinked_order_line_skus.slice(0, 20).join(', ')}{unlinked_order_line_skus.length > 20 ? ` …+${unlinked_order_line_skus.length - 20} more` : ''}
          </p>
          <p className="text-xs text-red-600 mt-1">Use the SKU Alignment tool to link these IDs to production flavours.</p>
        </div>
      )}

      {orphan_sales_skus.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <AlertTriangle size={15} /> {orphan_sales_skus.length} sales SKU{orphan_sales_skus.length !== 1 ? 's' : ''} reference a flavour_id not in production.flavours
          </p>
          <p className="text-xs text-gray-500 mt-1">
            SKU IDs: {orphan_sales_skus.map(s => s.id).join(', ')}
          </p>
        </div>
      )}

      {/* Sync All button */}
      {orphan_sales_skus.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={syncAll}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 w-fit touch-manipulation"
          >
            <Wand2 size={16} />
            {syncing ? 'Syncing…' : 'Create Missing Prep Products for Orphan SKUs'}
          </button>
          {syncResult && (
            <p className={`text-sm px-3 py-2 rounded-xl ${syncResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {syncResult}
            </p>
          )}
        </div>
      )}

      {/* Auto-create missing SKUs */}
      {summary.no_sales_sku > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={createAllMissingSkus}
            disabled={creatingSkus}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 w-fit touch-manipulation"
          >
            <Wand2 size={16} />
            {creatingSkus ? 'Creating SKUs…' : `Auto-Create ${summary.no_sales_sku} Missing SKU${summary.no_sales_sku !== 1 ? 's' : ''}`}
          </button>
          {createSkusResult && (
            <p className={`text-sm px-3 py-2 rounded-xl ${createSkusResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {createSkusResult}
            </p>
          )}
        </div>
      )}

      {/* Filter + Refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['issues', 'all'] as const).map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              filter === k ? 'ring-2 ring-offset-1 ring-gray-400' : ''
            } ${k === 'issues' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {k === 'issues' ? `Issues only (${summary.no_sales_sku + summary.no_prep + summary.orphan})` : `All (${summary.total_flavours})`}
          </button>
        ))}
        <button onClick={load} className="flex items-center gap-2 text-gray-500 text-sm hover:text-orange-600 touch-manipulation ml-auto">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Flavour rows */}
      <div className="space-y-2">
        {visibleRows.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 size={40} className="text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 font-semibold">All flavours fully linked!</p>
          </div>
        ) : visibleRows.map(row => {
          const isOpen = expanded.has(row.flavour_id);
          return (
            <div key={row.flavour_id} className={`rounded-2xl border overflow-hidden ${
              row.status === 'ok' ? 'border-green-200' :
              row.status === 'no_sales_sku' ? 'border-amber-200' :
              'border-red-200'
            }`}>
              {/* Header */}
              <button
                onClick={() => toggleExpand(row.flavour_id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors touch-manipulation"
              >
                <div className="shrink-0">
                  {row.status === 'ok'
                    ? <CheckCircle2 size={18} className="text-green-500" />
                    : <AlertCircle size={18} className="text-amber-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{row.flavour_name}</span>
                    <StatusChip status={row.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {row.prep_products.length} prep product{row.prep_products.length !== 1 ? 's' : ''}
                    {' · '}
                    {row.sales_skus.length} sales SKU{row.sales_skus.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-4 bg-white space-y-4">
                  {/* Production side */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Production (prep_products)</p>
                    {row.prep_products.length === 0 ? (
                      <p className="text-xs text-red-500">No prep product linked to this flavour.</p>
                    ) : row.prep_products.map(p => (
                      <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-800 font-medium flex-1">{p.name as string}</span>
                        <span className="text-xs text-gray-400">{p.batch_yield_l ? `${p.batch_yield_l}L/batch` : 'no yield'}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>{p.status as string}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sales side */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sales (sales.skus)</p>
                      <button
                        onClick={() => setModal({ flavourId: row.flavour_id, flavourName: row.flavour_name })}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 touch-manipulation"
                      >
                        <Plus size={12} /> Add SKU
                      </button>
                    </div>
                    {row.sales_skus.length === 0 ? (
                      <p className="text-xs text-amber-600">No sales.skus entry for this flavour — weekly req cannot be calculated.</p>
                    ) : row.sales_skus.map(s => (
                      <div key={s.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-xs text-gray-400 w-10">#{s.id}</span>
                        <span className="text-sm text-gray-800 flex-1">{s.name || `SKU #${s.id}`}</span>
                        <span className="text-xs text-gray-400">{s.pack_format_name || '—'}</span>
                        {s.in_order_lines
                          ? <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">In orders</span>
                          : <span className="text-xs text-gray-300">Not in orders</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create SKU Modal */}
      {modal && (
        <CreateSkuModal
          flavourId={modal.flavourId}
          flavourName={modal.flavourName}
          packFormats={pack_formats}
          fgStock={fg_stock || []}
          onSave={(skuId, packFormatId, name) => createSalesSku(modal.flavourId, skuId, packFormatId, name)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
