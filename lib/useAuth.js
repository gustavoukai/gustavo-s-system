import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './supabaseClient';

// Guarda o nível do usuário entre uma tela e outra, para o menu já aparecer certo
// (sem mostrar, por um instante, seções que o nível não pode ver).
let cacheAuth = { userId: null, role: null };

export function limparCacheAuth() {
  cacheAuth = { userId: null, role: null };
}

export function useAuth() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(cacheAuth.role);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        limparCacheAuth();
        router.replace('/login');
        return;
      }

      setSession(currentSession);

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();

      const roleAtual = data?.role || 'visualizante';
      cacheAuth = { userId: currentSession.user.id, role: roleAtual };
      setRole(roleAtual);
      setLoading(false);
    }

    load();
  }, [router]);

  const canEdit = role === 'admin' || role === 'socio' || role === 'operador' || role === 'visualizante';
  const canDelete = role === 'admin' || role === 'socio';

  return { session, role, loading, canEdit, canDelete };
}
