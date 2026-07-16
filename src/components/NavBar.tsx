'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useRole } from '@/hooks/useRole';
import { getNavItemsForRole, ROLE_LABELS } from '@/lib/roles';
import { Home, Package, Beaker, ArrowRight, Box, Truck, BarChart3, LogOut, Menu, X, Users, FlaskConical, Scissors } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  '/receive': Package,
  '/make-prep': Beaker,
  '/transfer': ArrowRight,
  '/make-tubs': Box,
  '/break-bulk': Scissors,
  '/dispatch': Truck,
  '/dashboards/raw-materials': BarChart3,
  '/dashboards/prep': BarChart3,
  '/dashboards/finished-goods': BarChart3,
  '/admin/flavours': FlaskConical,
  '/admin/rm-items': Package,
  '/admin/users': Users,
};

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName } = useUser();
  const { role } = useRole();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = getNavItemsForRole(role);

  const groups: Record<string, typeof navItems> = {};
  for (const item of navItems) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-orange-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🍦</span>
          <span className="font-bold text-gray-900 text-lg">Icestasy Ops</span>
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-gray-500 hidden sm:block truncate">Hi, {displayName}</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl bg-orange-50 text-brand-600 hover:bg-orange-100 transition-colors touch-manipulation shrink-0"
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative ml-auto w-72 bg-white h-full shadow-xl overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 h-14 border-b border-orange-100 shrink-0">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
                <p className="text-xs text-gray-400">{role ? ROLE_LABELS[role] : ''}</p>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 touch-manipulation">
                <X size={20} />
              </button>
            </div>

            <nav className="p-3 flex-1 space-y-4 overflow-y-auto">
              {/* Home always shown */}
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-medium transition-colors touch-manipulation',
                  pathname === '/dashboard'
                    ? 'bg-brand-500 text-white'
                    : 'text-gray-700 hover:bg-orange-50'
                )}
              >
                <Home size={20} />
                Home
              </Link>

              {Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">{group}</p>
                  <div className="space-y-1">
                    {items.map(({ href, label }) => {
                      const Icon = ICON_MAP[href] || BarChart3;
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-medium transition-colors touch-manipulation',
                            pathname === href
                              ? 'bg-brand-500 text-white'
                              : 'text-gray-700 hover:bg-orange-50'
                          )}
                        >
                          <Icon size={20} />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-base font-medium text-red-600 hover:bg-red-50 w-full touch-manipulation"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
