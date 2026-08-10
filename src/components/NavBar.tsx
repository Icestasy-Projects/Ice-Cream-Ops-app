'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { useRole } from '@/hooks/useRole';
import { getNavItemsForRole, ROLE_LABELS } from '@/lib/roles';
import { Home, Package, Beaker, ArrowRight, Box, Truck, BarChart3, LogOut, Menu, X, Users, FlaskConical, Scissors, IceCream, ClipboardList, Link2, GitMerge, Trash2, Bell, ChevronDown } from 'lucide-react';
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
  '/dashboards/weekly-audit': ClipboardList,
  '/admin/sku-alignment': Link2,
  '/admin/flavour-alignment': GitMerge,
  '/admin/cleanup': Trash2,
};

// Top-level nav groups shown as tabs in the header
const TOP_GROUPS = ['Operations', 'Dashboards', 'Admin'];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName } = useUser();
  const { role } = useRole();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  // Initials for avatar
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Is any item in a group currently active?
  const groupActive = (groupName: string) =>
    groups[groupName]?.some(item => pathname === item.href) || false;

  return (
    <>
      <header className="sticky top-0 z-40 shadow-md" style={{background: 'linear-gradient(to right, #1a3fa8, #2563eb, #3b8ef0)'}}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="bg-white rounded-lg p-1 flex items-center justify-center">
              <img src="/logo1.jpeg" alt="Icestasy" className="h-7 w-auto" />
            </div>
            <div className="leading-none font-poppins">
              <span className="font-bold text-white text-base tracking-wide">Icestasy</span>
              <span className="text-blue-200 font-semibold text-[10px] block tracking-[0.2em] uppercase">HR PORTAL</span>
            </div>
          </Link>

          {/* Desktop nav tabs */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <Link
              href="/dashboard"
              className={cn(
                'px-4 py-2 rounded-md text-sm font-semibold transition-colors',
                pathname === '/dashboard'
                  ? 'bg-white/20 text-white'
                  : 'text-brand-200 hover:text-white hover:bg-white/10'
              )}
            >
              Home
            </Link>

            {TOP_GROUPS.filter(g => groups[g]?.length).map(group => (
              <div key={group} className="relative">
                <button
                  onMouseEnter={() => setActiveDropdown(group)}
                  onMouseLeave={() => setActiveDropdown(null)}
                  className={cn(
                    'flex items-center gap-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors',
                    groupActive(group)
                      ? 'bg-white/20 text-white'
                      : 'text-brand-200 hover:text-white hover:bg-white/10'
                  )}
                >
                  {group}
                  <ChevronDown size={14} />
                </button>

                {activeDropdown === group && (
                  <div
                    className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50"
                    onMouseEnter={() => setActiveDropdown(group)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    {groups[group].map(({ href, label }) => {
                      const Icon = ICON_MAP[href] || BarChart3;
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                            pathname === href
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-gray-700 hover:bg-slate-50'
                          )}
                        >
                          <Icon size={16} className={pathname === href ? 'text-brand-600' : 'text-gray-400'} />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-brand-200 text-sm hidden sm:block">Hi, {displayName}</span>

            {/* Avatar / profile */}
            <div className="w-8 h-8 rounded-full bg-brand-600 border-2 border-brand-400 flex items-center justify-center text-white text-xs font-bold select-none">
              {initials}
            </div>

            {/* Hamburger for mobile + full menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out full nav menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative ml-auto w-72 bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-blue-700 shrink-0" style={{background: 'linear-gradient(to right, #1a3fa8, #2563eb)'}}>
              <div>
                <p className="font-semibold text-white text-sm">{displayName}</p>
                <p className="text-xs text-brand-300">{role ? ROLE_LABELS[role] : ''}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 touch-manipulation"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="p-3 flex-1 space-y-4 overflow-y-auto">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors touch-manipulation',
                  pathname === '/dashboard'
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-700 hover:bg-brand-50'
                )}
              >
                <Home size={20} />
                Home
              </Link>

              {Object.entries(groups).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wide">{group}</p>
                  <div className="space-y-0.5">
                    {items.map(({ href, label }) => {
                      const Icon = ICON_MAP[href] || BarChart3;
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors touch-manipulation',
                            pathname === href
                              ? 'bg-brand-600 text-white'
                              : 'text-gray-700 hover:bg-brand-50'
                          )}
                        >
                          <Icon size={20} className={pathname === href ? 'text-white' : 'text-brand-400'} />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 w-full touch-manipulation"
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
