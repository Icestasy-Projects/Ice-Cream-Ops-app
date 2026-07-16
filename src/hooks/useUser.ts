'use client';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Staff';
  const displayName = rawName
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase())
    .trim();
  return { user, loading, displayName };
}
