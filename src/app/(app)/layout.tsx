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
    <div className="min-h-screen flex flex-col bg-orange-50">
      <NavBar />
      <main className="flex-1 px-3 sm:px-4 py-4 sm:py-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
