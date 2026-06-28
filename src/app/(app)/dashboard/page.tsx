'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { AlertTriangle, Package, Beaker, Box } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';

const actions = [
  { href: '/receive', icon: '📦', label: 'Receive Ingredients', desc: 'Log a new delivery of raw materials', color: 'bg-blue-50 border-blue-100' },
  { href: '/make-prep', icon: '🧪', label: 'Make Kitchen Mix', desc: 'Make a batch of flavour mix in the kitchen', color: 'bg-purple-50 border-purple-100' },
  { href: '/transfer', icon: '➡️', label: 'Transfer to Factory', desc: 'Move mix from kitchen to the factory', color: 'bg-yellow-50 border-yellow-100' },
  { href: '/make-tubs', icon: '🍦', label: 'Make Tubs', desc: 'Fill tubs from factory stock', color: 'bg-pink-50 border-pink-100' },
  { href: '/dispatch', icon: '🚚', label: 'Dispatch Order', desc: 'Send finished tubs to a customer', color: 'bg-green-50 border-green-100' },
];

const dashboards = [
  { href: '/dashboards/raw-materials', label: 'RM Dashboard', emoji: '🌿' },
  { href: '/dashboards/prep', label: 'Prep Dashboard', emoji: '🧪' },
  { href: '/dashboards/finished-goods', label: 'FG Dashboard', emoji: '🍦' },
];

interface StockSummary {
  rmCritical: number;
  rmLow: number;
  prepCritical: number;
  prepLow: number;
  fgCritical: number;
  fgLow: number;
  fgTotal: number;
  fgOnHand: number;
}

export default function DashboardPage() {
  const { displayName, loading: userLoading } = useUser();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadSummary = useCallback(async () => {
    const [rmAlerts, prepAlerts, fgAlerts, fgStock] = await Promise.all([
      supabase.schema('production').from('v_stock_alerts_rm').select('status'),
      supabase.schema('production').from('v_stock_alerts_prep').select('status'),
      supabase.schema('production').from('v_stock_alerts_fg').select('status'),
      supabase.schema('production').from('v_fg_stock').select('qty_on_hand'),
    ]);
    const rm = rmAlerts.data || [];
    const prep = prepAlerts.data || [];
    const fg = fgAlerts.data || [];
    const fgData = fgStock.data || [];
    setSummary({
      rmCritical: rm.filter(r => r.status === 'critical').length,
      rmLow: rm.filter(r => r.status === 'low').length,
      prepCritical: prep.filter(r => r.status === 'critical').length,
      prepLow: prep.filter(r => r.status === 'low').length,
      fgCritical: fg.filter(r => r.status === 'critical').length,
      fgLow: fg.filter(r => r.status === 'low').length,
      fgTotal: fgData.length,
      fgOnHand: fgData.reduce((sum, r) => sum + ((r.qty_on_hand as number) || 0), 0),
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const totalAlerts = summary ? summary.rmCritical + summary.rmLow + summary.prepCritical + summary.prepLow + summary.fgCritical + summary.fgLow : 0;

  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {displayName}! 👋</h1>
        <p className="text-gray-500 mt-1">What would you like to do today?</p>
      </div>

      {totalAlerts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" size={22} />
          <div>
            <p className="font-semibold text-amber-800">{totalAlerts} item{totalAlerts > 1 ? 's' : ''} need attention</p>
            <p className="text-amber-600 text-sm">Check the dashboards below for details.</p>
          </div>
        </div>
      )}

      {/* Stock overview cards */}
      {!loading && summary && (
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3">Stock Overview</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/dashboards/raw-materials"
              className="card hover:shadow-md transition-all touch-manipulation text-center space-y-1 p-4">
              <Package size={22} className="mx-auto text-orange-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Raw Materials</p>
              {summary.rmCritical > 0 ? (
                <p className="text-sm font-bold text-red-600">{summary.rmCritical} Critical</p>
              ) : summary.rmLow > 0 ? (
                <p className="text-sm font-bold text-amber-600">{summary.rmLow} Low</p>
              ) : (
                <p className="text-sm font-bold text-green-600">All OK</p>
              )}
            </Link>

            <Link href="/dashboards/prep"
              className="card hover:shadow-md transition-all touch-manipulation text-center space-y-1 p-4">
              <Beaker size={22} className="mx-auto text-purple-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Prep / Mix</p>
              {summary.prepCritical > 0 ? (
                <p className="text-sm font-bold text-red-600">{summary.prepCritical} Critical</p>
              ) : summary.prepLow > 0 ? (
                <p className="text-sm font-bold text-amber-600">{summary.prepLow} Low</p>
              ) : (
                <p className="text-sm font-bold text-green-600">All OK</p>
              )}
            </Link>

            <Link href="/dashboards/finished-goods"
              className="card hover:shadow-md transition-all touch-manipulation text-center space-y-1 p-4">
              <Box size={22} className="mx-auto text-pink-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Finished Goods</p>
              {summary.fgCritical > 0 ? (
                <p className="text-sm font-bold text-red-600">{summary.fgCritical} Critical</p>
              ) : summary.fgLow > 0 ? (
                <p className="text-sm font-bold text-amber-600">{summary.fgLow} Low</p>
              ) : (
                <p className="text-sm font-bold text-green-600">{formatNumber(summary.fgOnHand)} tubs</p>
              )}
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3">Operations</h2>
        <div className="space-y-3">
          {actions.map(a => (
            <Link key={a.href} href={a.href}
              className={`flex items-center gap-4 p-4 rounded-2xl border ${a.color} hover:shadow-sm transition-all touch-manipulation`}>
              <span className="text-3xl">{a.icon}</span>
              <div>
                <p className="font-bold text-gray-900 text-base">{a.label}</p>
                <p className="text-gray-500 text-sm">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3">Dashboards</h2>
        <div className="grid grid-cols-3 gap-3">
          {dashboards.map(d => (
            <Link key={d.href} href={d.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-orange-100 hover:shadow-sm transition-all touch-manipulation text-center">
              <span className="text-3xl">{d.emoji}</span>
              <span className="text-xs font-bold text-gray-700 leading-tight">{d.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
