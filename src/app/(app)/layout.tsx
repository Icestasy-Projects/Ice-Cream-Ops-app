'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import NavBar from '@/components/NavBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkPasswordChange() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .schema('production')
        .from('user_profiles')
        .select('must_change_password')
        .eq('user_id', user.id)
        .single();
      if (data?.must_change_password === true) {
        router.replace('/change-password');
      }
    }
    checkPasswordChange();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <NavBar />
      {/* On desktop the sidebar is rendered inside NavBar as a sticky aside.
          On mobile NavBar renders the top bar + drawer overlay only. */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 max-w-7xl w-full mx-auto lg:mx-0">
          {children}
        </main>
      </div>
    </div>
  );
}
