import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const ROLE_LABELS = {
  admin: 'Administrador',
  operador: 'Operador',
  visualizante: 'Visualizante',
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', session.user.id)
        .single();

      if (error || !data) {
        setProfile({ email: session.user.email, role: 'visualizante' });
      } else {
        setProfile(data);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  const role = profile?.role || 'visualizante';

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <div className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: 4 }}>Painel</h1>
            <span className="role-badge">{ROLE_LABELS[role] || role}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sair
          </button>
        </div>

        <div className="section-card">
          <h2>Bem-vindo, {profile?.email}</h2>
          <p>Esta área é visível para qualquer pessoa que faça login no sistema.</p>
        </div>

        {(role === 'operador' || role === 'admin') && (
          <div className="section-card">
            <h2>Área do Operador</h2>
            <p>
              Este bloco só aparece para quem tem o nível &quot;Operador&quot; ou
              &quot;Administrador&quot;. Substitua este texto pelas funções reais que esse
              nível pode usar.
            </p>
          </div>
        )}

        {role === 'admin' && (
          <div className="section-card">
            <h2>Área do Administrador</h2>
            <p>
              Este bloco só aparece para quem tem o nível &quot;Administrador&quot;. É aqui
              que entrariam funções sensíveis, como gerenciar outros usuários.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
