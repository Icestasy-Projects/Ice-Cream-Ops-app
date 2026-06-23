'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { Home, Package, Beaker, ArrowRight, Box, Truck, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/receive', label: 'Receive Ingredients', icon: Package },
  { href: '/make-prep', label: 'Make Kitchen Mix', icon: Beaker },
  { href: '/transfer', label: 'Transfer to Factory', icon: ArrowRight },
  { href: '/make-tubs', label: 'Make Tubs', icon: Box },
  { href: '/dispatch', label: 'Dispatch Order', icon: Truck },
  { href: '/dashboards/raw-materials', label: 'RM Dashboard', icon: BarChart3 },
  { href: '/dashboards/prep', label: 'Prep Dashboard', icon: BarChart3 },
  { href: '/dashboards/finished-goods', label: 'FG Dashboard', icon: BarChart3 },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { displayName } = useUser();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🍦</span>
          <span className="font-bold text-gray-900 text-lg">Icestasy Ops</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">Hi, {displayName}</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl bg-orange-50 text-brand-600 hover:bg-orange-100 transition-colors touch-manipulation"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-30 flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative ml-auto w-72 bg-white h-full shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-orange-100 bg-orange-50">
              <p className="font-semibold text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-500">Kitchen / Factory Staff</p>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
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
