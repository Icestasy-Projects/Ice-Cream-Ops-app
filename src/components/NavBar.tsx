'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useRole } from '@/hooks/useRole';
import { getNavItemsForRole, ROLE_LABELS } from '@/lib/roles';
import {
  Home, Package, Beaker, ArrowRight, Box, Truck,
  BarChart3, LogOut, Menu, X, Users, FlaskConical, Scissors,
} from 'lucide-react';
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

function NavContent({
  pathname,
  displayName,
  role,
  navItems,
  onClose,
  onSignOut,
}: {
  pathname: string;
  displayName: string;
  role: string | null;
  navItems: { href: string; label: string; group: string }[];
  onClose?: () => void;
  onSignOut: () => void;
}) {
  const groups: Record<string, typeof navItems> = {};
  for (const item of navItems) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <span className="text-2xl">🍦</span>
          <span className="font-bold text-gray-900 text-base tracking-tight">Icestasy Ops</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 touch-manipulation lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User pill */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
        <p className="text-xs text-gray-400 mt-0.5">{role ? ROLE_LABELS[role as keyof typeof ROLE_LABELS] : ''}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        <div>
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation',
              pathname === '/dashboard'
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Home size={16} />
            Home
          </Link>
        </div>

        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <p className="px-3 pb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">{group}</p>
            <div className="space-y-0.5">
              {items.map(({ href, label }) => {
                const Icon = ICON_MAP[href] || BarChart3;
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation',
                      active
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-gray-100 shrink-0">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full touch-manipulation transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName } = useUser();
  const { role } = useRole();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = getNavItemsForRole(role);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0">
        <NavContent
          pathname={pathname}
          displayName={displayName}
          role={role}
          navItems={navItems}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Mobile / tablet top bar ── */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🍦</span>
          <span className="font-bold text-gray-900">Icestasy Ops</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[120px]">{displayName}</span>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative ml-auto w-64 bg-white h-full shadow-2xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <NavContent
              pathname={pathname}
              displayName={displayName}
              role={role}
              navItems={navItems}
              onClose={() => setMobileOpen(false)}
              onSignOut={handleSignOut}
            />
          </div>
        </div>
      )}
    </>
  );
}
