import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import { getLembretesAniversario } from '../lib/aniversarios';

const ROLE_LABELS = {
  admin: 'Administrador',
  operador: 'Operador',
  visualizante: 'Visualizante',
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lembretes, setLembretes] = useState([]);

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

      const { data: clientes } = await supabase
        .from('clientes')
        .select('nome, data_nascimento, conjuge_nome, conjuge_data_nascimento, filhos');
      setLembretes(getLembretesAniversario(clientes));

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
        <Nav />

        <div style={{ marginBottom: 18 }}>
          <span className="role-badge">{ROLE_LABELS[role] || role}</span>
        </div>

        {lembretes.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2>🎂 Aniversários próximos</h2>
            {lembretes.map((lembrete, index) => (
              <p key={index} style={{ margin: '6px 0' }}>
                {lembrete.texto}
              </p>
            ))}
          </div>
        )}

        <div className="section-card">
          <h2>Bem-vindo, {profile?.email}</h2>
          <p>
            Use o menu acima para lançar entradas e saídas, cadastrar clientes, fornecedores e
            projetos, e ver os relatórios financeiros.
          </p>
        </div>
      </div>
    </div>
  );
}
