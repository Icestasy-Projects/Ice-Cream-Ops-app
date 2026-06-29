'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useUser } from './useUser';
import type { AppRole } from '@/lib/roles';

export function useRole() {
  const { user, loading: userLoading } = useUser();
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }
    supabase
      .schema('production')
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setRole((data?.role as AppRole) || null);
        setRoleLoading(false);
      });
  }, [user, userLoading, supabase]);

  return { role, loading: roleLoading || userLoading };
}
