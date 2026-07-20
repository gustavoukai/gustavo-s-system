import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './supabaseClient';

export function useAuth() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();

      setRole(data?.role || 'visualizante');
      setLoading(false);
    }

    load();
  }, [router]);

  const canEdit = role === 'admin' || role === 'operador';
  const canDelete = role === 'admin';

  return { session, role, loading, canEdit, canDelete };
}
