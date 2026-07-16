'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useRole } from '@/hooks/useRole';
import { AlertTriangle, Package, Beaker, Box, TrendingDown } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatNumber } from '@/lib/utils';
import type { AppRole } from '@/lib/roles';

interface Action {
  href: string;
  icon: string;
  label: string;
  desc: string;
  iconBg: string;
}

const ALL_ACTIONS: Action[] = [
  { href: '/receive',   icon: '📦', label: 'Receive Ingredients',  desc: 'Log a raw material delivery',        iconBg: 'bg-blue-50' },
  { href: '/make-prep', icon: '🧪', label: 'Make Kitchen Mix',      desc: 'Batch a flavour mix in the kitchen', iconBg: 'bg-purple-50' },
  { href: '/transfer',  icon: '➡️', label: 'Transfer to Factory',   desc: 'Move mix from kitchen to factory',   iconBg: 'bg-amber-50' },
  { href: '/make-tubs', icon: '🍦', label: 'Make Tubs',             desc: 'Fill tubs from factory stock',       iconBg: 'bg-pink-50' },
  { href: '/dispatch',  icon: '🚚', label: 'Dispatch Order',        desc: 'Send finished tubs to a customer',   iconBg: 'bg-emerald-50' },
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

function StockCard({
  href, icon: Icon, iconColor, label, critical, low, okLabel,
}: {
  href: string; icon: React.ElementType; iconColor: string;
  label: string; critical: number; low: number; okLabel: string;
}) {
  const isCrit = critical > 0;
  const isLow  = !isCrit && low > 0;
  return (
    <Link href={href} className="card hover:shadow-md transition-all touch-manipulation group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
            <Icon size={18} className={iconColor} />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        </div>
        {isCrit && <TrendingDown size={14} className="text-red-400 shrink-0 mt-1" />}
      </div>
      <div className="mt-3">
        {isCrit ? (
          <p className="text-lg font-bold text-red-600">{critical} Critical</p>
        ) : isLow ? (
          <p className="text-lg font-bold text-amber-600">{low} Low</p>
        ) : (
          <p className="text-lg font-bold text-emerald-600">{okLabel}</p>
        )}
        {isCrit && low > 0 && <p className="text-xs text-amber-600 mt-0.5">{low} low</p>}
        {!isCrit && !isLow && <p className="text-xs text-gray-400 mt-0.5">All levels good</p>}
      </div>
    </Link>
  );
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
    const rm   = rmAlerts.data || [];
    const prep = prepAlerts.data || [];
    const fg   = fgAlerts.data || [];
    const fgData = fgStock.data || [];
    setSummary({
      rmCritical:   rm.filter(r => r.status === 'critical').length,
      rmLow:        rm.filter(r => r.status === 'low').length,
      prepCritical: prep.filter(r => r.status === 'critical').length,
      prepLow:      prep.filter(r => r.status === 'low').length,
      fgCritical:   fg.filter(r => r.status === 'critical').length,
      fgLow:        fg.filter(r => r.status === 'low').length,
      fgOnHand:     fgData.reduce((s, r) => s + ((r.qty_on_hand as number) || 0), 0),
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
        <p className="text-gray-500 text-sm max-w-xs">Your account hasn&apos;t been assigned a role yet. Ask your Super Admin to set it up.</p>
      </div>
    );
  }

  const actions = actionsForRole(role);
  const showRM   = role === 'kitchen'  || role === 'super_admin';
  const showPrep = role === 'factory'  || role === 'super_admin';
  const showFG   = role === 'factory'  || role === 'super_admin';

  const totalAlerts = (summary ? [
    showRM   ? summary.rmCritical   + summary.rmLow   : 0,
    showPrep ? summary.prepCritical + summary.prepLow : 0,
    showFG   ? summary.fgCritical   + summary.fgLow   : 0,
  ] : []).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{greeting}, {displayName} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s your production overview for today.</p>
      </div>

      {/* Alert banner */}
      {totalAlerts > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-semibold text-amber-800 text-sm">{totalAlerts} item{totalAlerts > 1 ? 's' : ''} need attention</p>
            <p className="text-amber-600 text-xs mt-0.5">Check the stock dashboards below for details.</p>
          </div>
        </div>
      )}

      {/* Stock overview */}
      {!summaryLoading && summary && (showRM || showPrep || showFG) && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Stock Overview</h2>
          <div className={`grid gap-3 ${[showRM, showPrep, showFG].filter(Boolean).length === 3 ? 'grid-cols-3' : [showRM, showPrep, showFG].filter(Boolean).length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showRM && (
              <StockCard href="/dashboards/raw-materials" icon={Package} iconColor="text-orange-500"
                label="Raw Materials" critical={summary.rmCritical} low={summary.rmLow} okLabel="All OK" />
            )}
            {showPrep && (
              <StockCard href="/dashboards/prep" icon={Beaker} iconColor="text-purple-500"
                label="Prep / Mix" critical={summary.prepCritical} low={summary.prepLow} okLabel="All OK" />
            )}
            {showFG && (
              <StockCard href="/dashboards/finished-goods" icon={Box} iconColor="text-pink-500"
                label="Finished Goods" critical={summary.fgCritical} low={summary.fgLow}
                okLabel={`${formatNumber(summary.fgOnHand)} tubs`} />
            )}
          </div>
        </section>
      )}

      {/* Operations */}
      <section>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Operations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {actions.map(a => (
            <Link key={a.href} href={a.href}
              className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-md transition-all touch-manipulation flex flex-col gap-3">
              <div className={`w-10 h-10 ${a.iconBg} rounded-lg flex items-center justify-center text-xl shrink-0`}>
                {a.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-snug">{a.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Admin */}
      {role === 'super_admin' && (
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Admin</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: '/admin/flavours', emoji: '🍨', bg: 'bg-brand-50', label: 'Manage Flavours',     desc: 'Add or edit flavour profiles' },
              { href: '/admin/rm-items', emoji: '🌿', bg: 'bg-orange-50', label: 'Manage Ingredients', desc: 'Configure raw material items' },
              { href: '/admin/users',    emoji: '👥', bg: 'bg-blue-50',   label: 'Manage Employees',   desc: 'Assign roles and access' },
            ].map(({ href, emoji, bg, label, desc }) => (
              <Link key={href} href={href}
                className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-md transition-all touch-manipulation flex flex-col gap-3">
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center text-xl shrink-0`}>
                  {emoji}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
