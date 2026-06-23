'use client';
import { createClient } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.push('/dashboard');
    });
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍦</div>
          <h1 className="text-3xl font-bold text-gray-900">Icestasy Ops</h1>
          <p className="text-gray-500 mt-2">Sign in to manage kitchen & factory operations</p>
        </div>
        <div className="bg-white rounded-3xl shadow-md border border-orange-100 p-6">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#f6840b',
                    brandAccent: '#e76806',
                  },
                  radii: { borderRadiusButton: '16px', inputBorderRadius: '12px' },
                  fontSizes: { baseInputSize: '16px', baseLabelSize: '14px' },
                },
              },
            }}
            providers={[]}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback`}
          />
        </div>
      </div>
    </div>
  );
}
