'use client';
import { useState } from 'react';
import ScreenHeader from '@/components/ScreenHeader';
import { Trash2, AlertTriangle, CheckCircle, Eye, RefreshCw, RotateCcw } from 'lucide-react';

interface PreviewData {
  fg_skus: { fg_sku_id: number; product_name: string; unit: string }[];
  sales_skus: { id: number; sku_code: string }[];
  current_stock: { fg_sku_id: number; product_name: string; unit: string; qty_on_hand: number }[];
}

export default function CleanupPage() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [resettingStock, setResettingStock] = useState(false);
  const [stockResetResult, setStockResetResult] = useState<string | null>(null);
  const [stockResetConfirm, setStockResetConfirm] = useState(false);

  async function handlePreview() {
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/delete-skus-by-format');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPreview(data.would_delete);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/delete-skus-by-format?confirm=yes', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDone(data.log || ['Done']);
      setPreview(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetStock() {
    setResettingStock(true);
    setStockResetResult(null);
    try {
      const res = await fetch('/api/admin/reset-stock', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setStockResetResult('All RM stock reset to 0. Ready for initial data entry.');
      setStockResetConfirm(false);
    } catch (e: unknown) {
      setStockResetResult('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setResettingStock(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch('/api/admin/seed-recent-orders', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSeedResult(data.message || 'Done');
    } catch (e: unknown) {
      setSeedResult('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <ScreenHeader
        icon={Trash2} iconColor="text-red-500"
        title="DB Cleanup"
        description="Permanently delete B2B Add-On and Extras SKUs from the database."
      />

      {/* Reset RM Stock section */}
      <div className="card space-y-3 border border-red-100 bg-red-50/40">
        <p className="text-sm font-bold text-red-800">Reset All RM Stock to Zero</p>
        <p className="text-xs text-red-600">Clears all raw material ledger entries and purchase orders. Use before entering initial stock for test launch. <strong>This cannot be undone.</strong></p>

        {!stockResetConfirm ? (
          <button
            onClick={() => setStockResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl touch-manipulation"
          >
            <RotateCcw size={15} />
            Reset All RM Stock to 0
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-700">Are you sure? All stock history will be permanently deleted.</p>
            <div className="flex gap-2">
              <button
                onClick={handleResetStock}
                disabled={resettingStock}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 touch-manipulation"
              >
                <RotateCcw size={15} className={resettingStock ? 'animate-spin' : ''} />
                {resettingStock ? 'Resetting...' : 'Yes, clear everything'}
              </button>
              <button
                onClick={() => setStockResetConfirm(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {stockResetResult && (
          <p className={`text-sm px-3 py-2 rounded-xl ${stockResetResult.startsWith('Error') ? 'bg-red-100 text-red-800' : 'bg-green-50 text-green-700'}`}>
            {stockResetResult}
          </p>
        )}
      </div>

      {/* Seed recent orders section */}
      <div className="card space-y-3 border border-blue-100 bg-blue-50/40">
        <p className="text-sm font-bold text-blue-800">Seed Recent Orders for Weekly Req</p>
        <p className="text-xs text-blue-600">Copies the latest 10 historical orders into the last 42 days so the weekly requirement calculation has data. Safe to run multiple times.</p>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 touch-manipulation"
        >
          <RefreshCw size={15} className={seeding ? 'animate-spin' : ''} />
          {seeding ? 'Seeding...' : 'Seed Last 42 Days with Orders'}
        </button>
        {seedResult && (
          <p className={`text-sm px-3 py-2 rounded-xl ${seedResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {seedResult}
          </p>
        )}
      </div>

      {done ? (
        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle size={20} className="shrink-0" />
            <p className="font-bold">Deletion complete</p>
          </div>
          <ul className="space-y-1">
            {done.map((line, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span> {line}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="card space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-bold">This permanently deletes records</p>
                <p className="text-xs mt-0.5">Targets: <strong>B2B Add-On</strong> and <strong>Extras</strong> unit types — including all ledger, dispatch, and order line history.</p>
              </div>
            </div>

            <button
              onClick={handlePreview}
              disabled={previewing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all touch-manipulation"
            >
              <Eye size={16} />
              {previewing ? 'Loading preview...' : 'Preview what will be deleted'}
            </button>

            {preview && (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Will delete {preview.fg_skus.length} FG SKU(s):</p>
                  {preview.fg_skus.length === 0 ? (
                    <p className="text-sm text-gray-400">Nothing found — already deleted or never existed.</p>
                  ) : (
                    preview.fg_skus.map(s => (
                      <div key={s.fg_sku_id} className="flex justify-between text-sm">
                        <span className="text-gray-800 font-medium">{s.product_name}</span>
                        <span className="text-gray-400">{s.unit}</span>
                      </div>
                    ))
                  )}
                </div>

                {preview.current_stock.some(s => s.qty_on_hand > 0) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-red-700 mb-1">⚠ Some SKUs have stock on hand:</p>
                    {preview.current_stock.filter(s => s.qty_on_hand > 0).map(s => (
                      <p key={s.fg_sku_id} className="text-sm text-red-700">{s.product_name}: {s.qty_on_hand} {s.unit}</p>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleDelete}
                  disabled={deleting || preview.fg_skus.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-bold transition-all touch-manipulation"
                >
                  <Trash2 size={16} />
                  {deleting ? 'Deleting...' : `Yes, delete ${preview.fg_skus.length} SKU(s) permanently`}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
