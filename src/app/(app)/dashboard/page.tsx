'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useRole } from '@/hooks/useRole';
import { AlertTriangle, Package, Beaker, Box } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import type { AppRole } from '@/lib/roles';

interface Action {
  href: string;
  icon: string;
  label: string;
  desc: string;
  color: string;
}

const ALL_ACTIONS: Action[] = [
  { href: '/receive',   icon: '📦', label: 'Receive Ingredients',  desc: 'Log a new delivery of raw materials',       color: 'bg-blue-50 border-blue-100' },
  { href: '/make-prep', icon: '🧪', label: 'Make Kitchen Mix',      desc: 'Make a batch of flavour mix in the kitchen', color: 'bg-purple-50 border-purple-100' },
  { href: '/transfer',  icon: '➡️', label: 'Transfer to Factory',   desc: 'Move mix from kitchen to the factory',       color: 'bg-yellow-50 border-yellow-100' },
  { href: '/make-tubs', icon: '🍦', label: 'Make Tubs',             desc: 'Fill tubs from factory stock',               color: 'bg-pink-50 border-pink-100' },
  { href: '/dispatch',  icon: '🚚', label: 'Dispatch Order',        desc: 'Send finished tubs to a customer',           color: 'bg-green-50 border-green-100' },
];

const KITCHEN_ACTIONS = new Set(['/receive', '/make-prep', '/transfer']);
const FACTORY_ACTIONS = new Set(['/make-tubs', '/dispatch']);

function actionsForRole(role: AppRole | null): Action[] {
  if (!role) return [];
  if (role === 'super_admin') return ALL_ACTIONS;
  if (role === 'kitchen') return ALL_ACTIONS.filter(a => KITCHEN_ACTIONS.has(a.href));
  if (role === 'factory') return ALL_ACTIONS.filter(a => FACTORY_ACTIONS.has(a.href));
  return [];
}

interface StockSummary {
  rmCritical: number; rmLow: number;
  prepCritical: number; prepLow: number;
  fgCritical: number; fgLow: number;
  fgOnHand: number;
}

export default function DashboardPage() {
  const { displayName, loading: userLoading } = useUser();
  const { role, loading: roleLoading } = useRole();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
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
      fgOnHand: fgData.reduce((s, r) => s + ((r.qty_on_hand as number) || 0), 0),
    });
    setSummaryLoading(false);
  }, [supabase]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (userLoading || roleLoading) return <LoadingSpinner />;

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <span className="text-5xl mb-4">🔒</span>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No role assigned</h2>
        <p className="text-gray-500 text-sm max-w-xs">Your account hasn&apos;t been assigned a role yet. Ask your Super Admin to set up your account.</p>
      </div>
    );
  }

  const actions = actionsForRole(role);
  const showRM    = role === 'kitchen'  || role === 'super_admin';
  const showPrep  = role === 'factory'  || role === 'super_admin';
  const showFG    = role === 'factory'  || role === 'super_admin';

  const relevantAlerts = (summary ? [
    showRM  ? summary.rmCritical + summary.rmLow : 0,
    showPrep ? summary.prepCritical + summary.prepLow : 0,
    showFG  ? summary.fgCritical + summary.fgLow : 0,
  ] : []).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {displayName}! 👋</h1>
        <p className="text-gray-500 mt-1">What would you like to do today?</p>
      </div>

      {relevantAlerts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" size={22} />
          <div>
            <p className="font-semibold text-amber-800">{relevantAlerts} item{relevantAlerts > 1 ? 's' : ''} need attention</p>
            <p className="text-amber-600 text-sm">Check the dashboards below for details.</p>
          </div>
        </div>
      )}

      {/* Stock overview cards — shown only for relevant dashboards */}
      {!summaryLoading && summary && (showRM || showPrep || showFG) && (
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3">Stock Overview</h2>
          <div className={`grid gap-2 sm:gap-3 ${[showRM, showPrep, showFG].filter(Boolean).length === 3 ? 'grid-cols-3' : [showRM, showPrep, showFG].filter(Boolean).length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showRM && (
              <Link href="/dashboards/raw-materials"
                className="card hover:shadow-md transition-all touch-manipulation text-center space-y-1 p-3 sm:p-4">
                <Package size={22} className="mx-auto text-orange-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">Raw Materials</p>
                {summary.rmCritical > 0 ? (
                  <p className="text-sm font-bold text-red-600">{summary.rmCritical} Critical</p>
                ) : summary.rmLow > 0 ? (
                  <p className="text-sm font-bold text-amber-600">{summary.rmLow} Low</p>
                ) : (
                  <p className="text-sm font-bold text-green-600">All OK</p>
                )}
              </Link>
            )}
            {showPrep && (
              <Link href="/dashboards/prep"
                className="card hover:shadow-md transition-all touch-manipulation text-center space-y-1 p-3 sm:p-4">
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
            )}
            {showFG && (
              <Link href="/dashboards/finished-goods"
                className="card hover:shadow-md transition-all touch-manipulation text-center space-y-1 p-3 sm:p-4">
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
            )}
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
    </div>
  );
}
