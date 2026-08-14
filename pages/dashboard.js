import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import { getLembretesAniversario } from '../lib/aniversarios';
import { getContasProximasDoVencimento, mensagemVencimento } from '../lib/contasPagarLembretes';
import { getCobrancasComPrevisaoProxima, getCobrancasAtrasadas, getCobrancasNovasHoje } from '../lib/cobrancasLembretes';
import Rodape from '../components/Rodape';

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
  const [contasProximas, setContasProximas] = useState([]);
  const [cobrancasProximas, setCobrancasProximas] = useState([]);
  const [cobrancasAtrasadas, setCobrancasAtrasadas] = useState([]);
  const [cobrancasNovas, setCobrancasNovas] = useState([]);

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

      const { data: contas } = await supabase
        .from('contas_pagar')
        .select('id, pagamento, ano, mes, dia_vencimento, status, valor_previsto');
      setContasProximas(getContasProximasDoVencimento(contas));

      const { data: cobrancasData } = await supabase
        .from('cobrancas')
        .select('id, pagamento_previsao, pagamento_status, fornecedor_tipo, created_by, created_at, projetos(numero_projeto, nome), fornecedores(nome)');

      const { data: perfis } = await supabase.from('profiles').select('id, email');
      const mapaEmails = {};
      (perfis || []).forEach((p) => {
        mapaEmails[p.id] = p.email;
      });

      setCobrancasProximas(getCobrancasComPrevisaoProxima(cobrancasData));
      setCobrancasAtrasadas(getCobrancasAtrasadas(cobrancasData));
      setCobrancasNovas(getCobrancasNovasHoje(cobrancasData, mapaEmails));

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

        {contasProximas.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h2>💰 Contas a pagar nos próximos 7 dias</h2>
            {contasProximas.map((conta) => (
              <p key={conta.id} style={{ margin: '6px 0' }}>
                {conta.pagamento || '(sem descrição)'}
                {conta.valor_previsto != null
                  ? ` — ${Number(conta.valor_previsto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                  : ''}{' '}
                {mensagemVencimento(conta.diffDias)} ({String(conta.dia_vencimento).padStart(2, '0')}/
                {String(conta.mes).padStart(2, '0')})
              </p>
            ))}
          </div>
        )}

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

        {cobrancasProximas.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h2>📋 Cobranças com previsão nos próximos 7 dias</h2>
            {cobrancasProximas.map((c) => (
              <p key={c.id} style={{ margin: '6px 0' }}>
                {c.texto}
              </p>
            ))}
          </div>
        )}

        {cobrancasAtrasadas.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h2>⚠️ Cobranças com previsão vencida, ainda não pagas</h2>
            {cobrancasAtrasadas.map((c) => (
              <p key={c.id} style={{ margin: '6px 0' }}>
                {c.texto}
              </p>
            ))}
          </div>
        )}

        {cobrancasNovas.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2>🆕 Novas cobranças cadastradas hoje</h2>
            {cobrancasNovas.map((c) => (
              <p key={c.id} style={{ margin: '6px 0' }}>
                {c.texto}
              </p>
            ))}
          </div>
        )}

        <div className="section-card">
          <h2>Checklist Financeiro</h2>
          <p style={{ color: 'var(--muted)' }}>Em breve.</p>
        </div>

        <div className="section-card">
          <h2>Bem-vindo, {profile?.email}</h2>
          <p>
            Use o menu acima para lançar entradas e saídas, cadastrar clientes, fornecedores e
            projetos, e ver os relatórios financeiros.
          </p>
        </div>

        <Rodape />
      </div>
    </div>
  );
}
