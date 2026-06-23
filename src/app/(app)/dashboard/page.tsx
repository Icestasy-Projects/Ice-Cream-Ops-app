'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const actions = [
  { href: '/receive', icon: '📦', label: 'Receive Ingredients', desc: 'Log a new delivery of raw materials', color: 'bg-blue-50 border-blue-100' },
  { href: '/make-prep', icon: '🧪', label: 'Make Kitchen Mix', desc: 'Make a batch of flavour mix in the kitchen', color: 'bg-purple-50 border-purple-100' },
  { href: '/transfer', icon: '➡️', label: 'Transfer to Factory', desc: 'Move mix from kitchen to the factory', color: 'bg-yellow-50 border-yellow-100' },
  { href: '/make-tubs', icon: '🍦', label: 'Make Tubs', desc: 'Fill tubs from factory stock', color: 'bg-pink-50 border-pink-100' },
  { href: '/dispatch', icon: '🚚', label: 'Dispatch Order', desc: 'Send finished tubs to a customer', color: 'bg-green-50 border-green-100' },
];

const dashboards = [
  { href: '/dashboards/raw-materials', label: 'Raw Materials', emoji: '🌿' },
  { href: '/dashboards/prep', label: 'Prep / Mix', emoji: '🧪' },
  { href: '/dashboards/finished-goods', label: 'Finished Goods', emoji: '🍦' },
];

export default function DashboardPage() {
  const { displayName, loading } = useUser();
  const [alerts, setAlerts] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAlerts() {
      const [rm, prep, fg] = await Promise.all([
        supabase.schema('production').from('v_rm_stock').select('status').in('status', ['low', 'critical']),
        supabase.schema('production').from('v_prep_stock').select('status').in('status', ['low', 'critical']),
        supabase.schema('production').from('v_fg_stock').select('status').in('status', ['low', 'critical']),
      ]);
      const count = (rm.data?.length || 0) + (prep.data?.length || 0) + (fg.data?.length || 0);
      setAlerts(count);
    }
    fetchAlerts();
  }, [supabase]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good morning, {displayName}! 👋</h1>
        <p className="text-gray-500 mt-1">What would you like to do today?</p>
      </div>

      {alerts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" size={22} />
          <div>
            <p className="font-semibold text-amber-800">{alerts} item{alerts > 1 ? 's' : ''} need attention</p>
            <p className="text-amber-600 text-sm">Some stock levels are low or critical — check the dashboards below.</p>
          </div>
        </div>
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
        <h2 className="text-lg font-bold text-gray-700 mb-3">Stock Dashboards</h2>
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
