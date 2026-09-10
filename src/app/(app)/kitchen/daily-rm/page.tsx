'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ScreenHeader from '@/components/ScreenHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface RmItem {
  id: number;
  name: string;
  unit: string;
  category: string;
}

interface PrepSummary {
  name: string;
  qty_produced: number;
  unit: string;
}

interface VarianceRow {
  rm_item_id: number;
  expected_qty: number;
  actual_qty: number;
  variance: number;
  variance_type: string;
}

export default function DailyRmUsagePage() {
  const supabase = createClient();
  const [items, setItems] = useState<RmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [qty, setQty] = useState<Record<number, string>>({});
  const [prepSummary, setPrepSummary] = useState<PrepSummary[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ variance_count: number; variances: VarianceRow[] } | null>(null);

  useEffect(() => {
    supabase.schema('production').from('rm_items')
      .select('id, name, unit, category_id, rm_categories(name)')
      .eq('is_stockable', true)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        setItems((data || []).map((r: Record<string, unknown>) => ({
          id: r.id as number,
          name: r.name as string,
          unit: r.unit as string,
          category: (r.rm_categories as { name: string } | null)?.name || 'Other',
        })));
        setLoading(false);
      });
  }, [supabase]);

  const loadPrepForDate = useCallback(async (d: string) => {
    const { data } = await supabase.schema('production').from('prep_units')
      .select('qty_produced, prep_products(name, unit)')
      .eq('status', 'posted')
      .gte('produced_at', `${d}T00:00:00`)
      .lte('produced_at', `${d}T23:59:59`);
    setPrepSummary((data || []).map((r: Record<string, unknown>) => ({
      name: (r.prep_products as { name: string } | null)?.name || '?',
      qty_produced: r.qty_produced as number,
      unit: (r.prep_products as { unit: string } | null)?.unit || 'L',
    })));
  }, [supabase]);

  useEffect(() => { loadPrepForDate(date); }, [date, loadPrepForDate]);

  async function handleSubmit() {
    const lines = items
      .filter(i => qty[i.id] !== undefined && qty[i.id] !== '')
      .map(i => ({ rm_item_id: i.id, qty_used: parseFloat(qty[i.id]) || 0 }))
      .filter(l => l.qty_used > 0);

    if (!lines.length) { toast.error('Enter at least one RM quantity'); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/daily-rm-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_date: date, lines, notes: notes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit');
      setResult(json);
      if (json.variance_count === 0) {
        toast.success('Submitted — no variances detected!');
      } else {
        toast.error(`Submitted — ${json.variance_count} variance${json.variance_count !== 1 ? 's' : ''} flagged`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading ingredients..." />;

  const filledCount = Object.values(qty).filter(v => v !== '').length;

  return (
    <div className="space-y-4">
      <ScreenHeader
        icon={ClipboardList} iconColor="text-blue-500"
        title="Daily RM Usage"
        description="Enter how much of each raw material was used today in the kitchen."
      />

      {/* Date + prep context */}
      <div className="card space-y-4">
        <div>
          <label className="label-text block mb-1">Date</label>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setResult(null); }}
            className="input-field" max={new Date().toISOString().split('T')[0]} />
        </div>

        {prepSummary.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1.5">Prep recorded this day</p>
            <div className="flex flex-wrap gap-2">
              {prepSummary.map((p, i) => (
                <span key={i} className="bg-white border border-orange-200 text-orange-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {p.name} — {formatNumber(p.qty_produced)}L
                </span>
              ))}
            </div>
          </div>
        )}
        {prepSummary.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-700 text-sm">
            ⚠️ No prep batches recorded for this date. Any RM entered will flag as overuse.
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl p-4 border flex items-start gap-3 ${result.variance_count === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.variance_count === 0
            ? <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
            : <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          }
          <div className="min-w-0">
            {result.variance_count === 0
              ? <p className="text-green-800 font-semibold text-sm">All good — RM usage matches recipe expectations.</p>
              : <>
                  <p className="text-red-800 font-semibold text-sm">{result.variance_count} variance{result.variance_count !== 1 ? 's' : ''} flagged — admin has been notified.</p>
                  <ul className="mt-2 space-y-1">
                    {result.variances.map((v, i) => {
                      const item = items.find(x => x.id === v.rm_item_id);
                      const typeLabel = v.variance_type === 'overuse' ? '↑ Overuse' : v.variance_type === 'underuse' ? '↓ Underuse' : '⚠ Unaccounted';
                      return (
                        <li key={i} className="text-red-700 text-xs flex gap-2">
                          <span className="font-bold shrink-0">{typeLabel}</span>
                          <span>{item?.name}: expected {formatNumber(v.expected_qty, 3)} {item?.unit}, got {formatNumber(v.actual_qty, 3)} {item?.unit} (Δ {v.variance > 0 ? '+' : ''}{formatNumber(v.variance, 3)})</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
            }
          </div>
        </div>
      )}

      {/* RM entry table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">Enter quantities used</p>
          <span className="text-xs text-gray-400">{filledCount} of {items.length} filled</span>
        </div>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{item.unit}</p>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={qty[item.id] ?? ''}
                onChange={e => setQty(q => ({ ...q, [item.id]: e.target.value }))}
                onWheel={e => e.currentTarget.blur()}
                className="w-28 text-right input-field py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Notes + submit */}
      <div className="card space-y-3">
        <div>
          <label className="label-text block mb-1">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any notes about today's usage..." className="input-field" rows={2} />
        </div>
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Submitting…' : `Submit Daily RM Usage${filledCount > 0 ? ` (${filledCount} items)` : ''}`}
        </button>
      </div>
    </div>
  );
}
