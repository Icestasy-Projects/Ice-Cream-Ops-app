'use client';
import { useState, useCallback } from 'react';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RefreshCw, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FlaskConical, Box, Leaf, ClipboardList } from 'lucide-react';

type Status = 'ok' | 'low' | 'critical' | 'unknown';

interface FgRow {
  sku_id: number; sku_name: string; pack_format: string;
  unit_volume_ml: number; units_per_pack: number; litres_per_fg_unit: number;
  total_ordered_42d: number; order_line_count: number;
  weekly_req: number; threshold: number; on_hand: number; status: Status;
  warnings: string[];
  prep_product_name: string | null; weekly_litres_needed: number;
  weekly_batches_needed: number; batch_yield_l: number | null;
}
interface PrepRow {
  prep_product_id: number; prep_product_name: string; batch_yield_l: number;
  weekly_batches_raw: number; weekly_batches_ceiled: number;
  threshold: number; on_hand: number; status: Status;
  contributors: string[]; recipe_items: number; warnings: string[];
}
interface RmRow {
  rm_item_id: number; ingredient_name: string; unit: string;
  weekly_qty_raw: number; weekly_qty_ceiled: number;
  threshold: number; on_hand: number; status: Status;
  contributors: string[]; warnings: string[];
}
interface AuditData {
  generated_at: string;
  period_days: number;
  summary: {
    fg_skus_with_orders: number;
    fg_skus_without_prep_link: number;
    prep_products_with_demand: number;
    rm_items_with_demand: number;
    total_warnings: number;
  };
  warnings: string[];
  fg: FgRow[];
  prep: PrepRow[];
  rm: RmRow[];
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    critical: 'bg-red-100 text-red-700',
    low: 'bg-amber-100 text-amber-700',
    ok: 'bg-green-100 text-green-700',
    unknown: 'bg-gray-100 text-gray-400',
  };
  const label: Record<Status, string> = { critical: '● Critical', low: '◐ Low', ok: '○ OK', unknown: '—' };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${map[status]}`}>{label[status]}</span>;
}

function WarningBadge({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
      <AlertTriangle size={10} /> {warnings.length}
    </span>
  );
}

function CollapseSection({ title, icon: Icon, iconColor, count, warnings, children }: {
  title: string; icon: React.ElementType; iconColor: string;
  count: number; warnings: number; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-orange-50 transition-colors text-left touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={iconColor} />
          <span className="font-bold text-gray-800 text-sm">{title}</span>
          <span className="text-xs text-gray-400">{count} items</span>
          {warnings > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle size={10} /> {warnings} warning{warnings !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

function CalcRow({ label, value, sub, warn }: { label: string; value: React.ReactNode; sub?: string; warn?: boolean }) {
  return (
    <div className={`flex items-start justify-between py-1 border-b border-gray-50 last:border-0 ${warn ? 'text-amber-700' : ''}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold text-right max-w-xs ${warn ? 'text-amber-700' : 'text-gray-900'}`}>
        {value}
        {sub && <span className="block text-gray-400 font-normal">{sub}</span>}
      </span>
    </div>
  );
}

function FgCard({ row }: { row: FgRow }) {
  const [open, setOpen] = useState(false);
  const hasWarn = row.warnings.length > 0;
  return (
    <div className={`rounded-xl border ${hasWarn ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left touch-manipulation hover:bg-orange-50/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{row.sku_name}</p>
          <span className="text-xs text-gray-400 shrink-0">{row.pack_format}</span>
          <WarningBadge warnings={row.warnings} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">Wkly: <strong className="text-gray-900">{row.weekly_req}</strong></span>
          <span className="text-xs text-gray-500">Stock: <strong className="text-gray-900">{row.on_hand}</strong></span>
          <StatusBadge status={row.status} />
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {/* FG calc */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">FG Calculation</p>
              <CalcRow label="Orders in 42 days" value={`${row.order_line_count} line(s), ${row.total_ordered_42d} units total`} />
              <CalcRow label="÷ 6 weeks → ceil" value={`⌈${row.total_ordered_42d} ÷ 6⌉ = ${row.weekly_req}`} />
              <CalcRow label="Weekly Req" value={<strong>{row.weekly_req} units/week</strong>} />
              <CalcRow label="Threshold (×2.5)" value={`⌈${row.weekly_req} × 2.5⌉ = ${row.threshold}`} />
              <CalcRow label="In Stock Now" value={row.on_hand} />
              <CalcRow label="Status" value={<StatusBadge status={row.status} />} />
            </div>
            {/* Prep linkage */}
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">→ Prep Linkage</p>
              <CalcRow label="Pack format" value={`${row.pack_format} (${row.unit_volume_ml}ml × ${row.units_per_pack} = ${row.litres_per_fg_unit.toFixed(3)}L/unit)`} />
              <CalcRow label="Weekly litres needed" value={`${row.weekly_req} × ${row.litres_per_fg_unit.toFixed(3)}L = ${row.weekly_litres_needed.toFixed(2)}L`} />
              <CalcRow label="Prep product" value={row.prep_product_name || '—'} warn={!row.prep_product_name} />
              <CalcRow label="Batch yield" value={row.batch_yield_l ? `${row.batch_yield_l}L` : '—'} warn={!row.batch_yield_l} />
              <CalcRow
                label="Weekly batches needed"
                value={row.prep_product_name
                  ? `${row.weekly_litres_needed.toFixed(2)} ÷ ${row.batch_yield_l} = ${row.weekly_batches_needed.toFixed(3)}`
                  : '—'}
                warn={!row.prep_product_name}
              />
            </div>
          </div>
          {row.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Warnings</p>
              {row.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">• {w}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrepCard({ row }: { row: PrepRow }) {
  const [open, setOpen] = useState(false);
  const hasWarn = row.warnings.length > 0;
  return (
    <div className={`rounded-xl border ${hasWarn ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left touch-manipulation hover:bg-orange-50/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{row.prep_product_name}</p>
          <WarningBadge warnings={row.warnings} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">Wkly: <strong className="text-gray-900">{row.weekly_batches_ceiled} batch{row.weekly_batches_ceiled !== 1 ? 'es' : ''}</strong></span>
          <span className="text-xs text-gray-500">Stock: <strong className="text-gray-900">{row.on_hand}</strong></span>
          <StatusBadge status={row.status} />
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Prep Calculation</p>
              <CalcRow label="Raw demand (sum of FG)" value={`${row.weekly_batches_raw.toFixed(4)} batches`} />
              <CalcRow label="Ceiled → Weekly Req" value={`⌈${row.weekly_batches_raw.toFixed(4)}⌉ = ${row.weekly_batches_ceiled} batches/week`} />
              <CalcRow label="Batch yield" value={`${row.batch_yield_l}L per batch`} />
              <CalcRow label="Threshold (×2.5)" value={`⌈${row.weekly_batches_ceiled} × 2.5⌉ = ${row.threshold}`} />
              <CalcRow label="In Stock Now" value={`${row.on_hand} units`} />
              <CalcRow label="Status" value={<StatusBadge status={row.status} />} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Contributing FG SKUs</p>
              {row.contributors.map((c, i) => <p key={i} className="text-xs text-gray-600">• {c}</p>)}
              <div className="mt-2 pt-2 border-t border-gray-50">
                <CalcRow label="Recipe items" value={row.recipe_items} warn={row.recipe_items === 0} />
              </div>
            </div>
          </div>
          {row.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Warnings</p>
              {row.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">• {w}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RmCard({ row }: { row: RmRow }) {
  const [open, setOpen] = useState(false);
  const hasWarn = row.warnings.length > 0;
  return (
    <div className={`rounded-xl border ${hasWarn ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left touch-manipulation hover:bg-orange-50/40 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{row.ingredient_name}</p>
          <span className="text-xs text-gray-400">{row.unit}</span>
          <WarningBadge warnings={row.warnings} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-500">Wkly: <strong className="text-gray-900">{row.weekly_qty_ceiled} {row.unit}</strong></span>
          <span className="text-xs text-gray-500">Stock: <strong className="text-gray-900">{row.on_hand}</strong></span>
          <StatusBadge status={row.status} />
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">RM Calculation</p>
              <CalcRow label="Raw demand (sum)" value={`${row.weekly_qty_raw.toFixed(4)} ${row.unit}`} />
              <CalcRow label="Ceiled → Weekly Req" value={`⌈${row.weekly_qty_raw.toFixed(4)}⌉ = ${row.weekly_qty_ceiled} ${row.unit}/week`} />
              <CalcRow label="Threshold (×2.5)" value={`⌈${row.weekly_qty_ceiled} × 2.5⌉ = ${row.threshold} ${row.unit}`} />
              <CalcRow label="In Stock Now" value={`${row.on_hand} ${row.unit}`} />
              <CalcRow label="Status" value={<StatusBadge status={row.status} />} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Contributing Prep Products</p>
              {row.contributors.map((c, i) => <p key={i} className="text-xs text-gray-600">• {c}</p>)}
            </div>
          </div>
          {row.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Warnings</p>
              {row.warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">• {w}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WeeklyAuditPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/weekly-req/audit');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Audit failed');
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const fgWarnings = data?.fg.reduce((s, r) => s + r.warnings.length, 0) || 0;
  const prepWarnings = data?.prep.reduce((s, r) => s + r.warnings.length, 0) || 0;
  const rmWarnings = data?.rm.reduce((s, r) => s + r.warnings.length, 0) || 0;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={ClipboardList} iconColor="text-indigo-500"
        title="Weekly Req Audit"
        description="Step-by-step trace of every FG → Prep → RM weekly requirement and threshold calculation."
      />

      {/* Run button */}
      {!data && !loading && (
        <div className="card flex flex-col items-center py-10 gap-4">
          <p className="text-sm text-gray-500 text-center">
            Click Run Audit to fetch all order data and trace the full calculation chain.<br />
            Shows weekly req, threshold, warnings for FG → Prep → RM.
          </p>
          <button onClick={runAudit} className="btn-primary px-8">
            Run Audit Now
          </button>
        </div>
      )}

      {loading && <LoadingSpinner text="Running audit — tracing full calculation chain..." />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <>
          {/* Header bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-400">
              Generated: {new Date(data.generated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} · Last 42 days of orders
            </p>
            <button
              onClick={runAudit}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 touch-manipulation"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Re-run
            </button>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'FG SKUs with orders', value: data.summary.fg_skus_with_orders, color: 'text-blue-700 bg-blue-50 border-blue-100' },
              { label: 'Prep products with demand', value: data.summary.prep_products_with_demand, color: 'text-purple-700 bg-purple-50 border-purple-100' },
              { label: 'RM items with demand', value: data.summary.rm_items_with_demand, color: 'text-orange-700 bg-orange-50 border-orange-100' },
              { label: 'Total warnings', value: data.summary.total_warnings, color: data.summary.total_warnings > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-green-700 bg-green-50 border-green-100' },
            ].map(t => (
              <div key={t.label} className={`rounded-2xl border p-3 text-center ${t.color}`}>
                <p className="text-2xl font-bold">{t.value}</p>
                <p className="text-xs mt-0.5 font-medium">{t.label}</p>
              </div>
            ))}
          </div>

          {/* Global warnings */}
          {data.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
              <p className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                <AlertTriangle size={14} /> {data.warnings.length} Warning{data.warnings.length !== 1 ? 's' : ''} found
              </p>
              {data.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700">• {w}</p>
              ))}
            </div>
          )}

          {data.warnings.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle size={18} className="text-green-600 shrink-0" />
              <p className="text-sm font-medium text-green-800">All calculations are clean — no broken links or missing mappings found.</p>
            </div>
          )}

          {/* FG Section */}
          <CollapseSection title="Finished Goods (FG)" icon={Box} iconColor="text-pink-500" count={data.fg.length} warnings={fgWarnings}>
            <div className="p-3 space-y-2">
              {data.fg.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No FG SKUs with orders in the last 42 days.</p>
                : data.fg.map(row => <FgCard key={row.sku_id} row={row} />)
              }
            </div>
          </CollapseSection>

          {/* Prep Section */}
          <CollapseSection title="Prep / Mix Products" icon={FlaskConical} iconColor="text-purple-500" count={data.prep.length} warnings={prepWarnings}>
            <div className="p-3 space-y-2">
              {data.prep.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No prep products with demand.</p>
                : data.prep.map(row => <PrepCard key={row.prep_product_id} row={row} />)
              }
            </div>
          </CollapseSection>

          {/* RM Section */}
          <CollapseSection title="Raw Materials (RM)" icon={Leaf} iconColor="text-orange-500" count={data.rm.length} warnings={rmWarnings}>
            <div className="p-3 space-y-2">
              {data.rm.length === 0
                ? <p className="text-sm text-gray-400 text-center py-4">No RM items with demand.</p>
                : data.rm.map(row => <RmCard key={row.rm_item_id} row={row} />)
              }
            </div>
          </CollapseSection>
        </>
      )}
    </div>
  );
}
