'use client';
import { useState } from 'react';
import ScreenHeader from '@/components/ScreenHeader';
import { Trash2, RefreshCw, RotateCcw } from 'lucide-react';

export default function CleanupPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [resettingStock, setResettingStock] = useState(false);
  const [stockResetResult, setStockResetResult] = useState<string | null>(null);
  const [stockResetConfirm, setStockResetConfirm] = useState(false);

  async function handleResetStock(scope: string) {
    setResettingStock(true);
    setStockResetResult(null);
    try {
      const res = await fetch(`/api/admin/reset-stock?scope=${scope}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error((data.errors || [data.error]).join('; '));
      setStockResetResult(`Cleared: ${(data.cleared as string[]).join(', ')}`);
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
        description="Administrative tools for resetting stock and seeding data."
      />

      {/* Reset Stock section */}
      <div className="card space-y-3 border border-red-100 bg-red-50/40">
        <p className="text-sm font-bold text-red-800">Reset Stock to Zero</p>
        <p className="text-xs text-red-600">Clears ledger entries and production records for the selected stock type. Use before entering initial data for test launch. <strong>Cannot be undone.</strong></p>

        {!stockResetConfirm ? (
          <div className="flex flex-wrap gap-2">
            {[
              { scope: 'rm',   label: 'Reset RM Stock' },
              { scope: 'prep', label: 'Reset Prep Stock' },
              { scope: 'fg',   label: 'Reset FG Stock' },
              { scope: 'all',  label: 'Reset ALL Stock' },
            ].map(({ scope, label }) => (
              <button
                key={scope}
                onClick={() => { setStockResetConfirm(true); setStockResetResult(scope); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl touch-manipulation ${scope === 'all' ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'}`}
              >
                <RotateCcw size={14} />
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-700">
              Confirm: reset <strong>{stockResetResult === 'all' ? 'ALL (RM + Prep + FG)' : stockResetResult?.toUpperCase()}</strong> stock to 0? All history will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { const s = stockResetResult || 'all'; setStockResetResult(null); handleResetStock(s); }}
                disabled={resettingStock}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-xl disabled:opacity-50 touch-manipulation"
              >
                <RotateCcw size={15} className={resettingStock ? 'animate-spin' : ''} />
                {resettingStock ? 'Resetting...' : 'Yes, clear it'}
              </button>
              <button
                onClick={() => { setStockResetConfirm(false); setStockResetResult(null); }}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {stockResetResult && !stockResetConfirm && (
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
    </div>
  );
}
