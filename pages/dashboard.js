import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import { getLembretesAniversario, getAniversariosPassados } from '../lib/aniversarios';
import { getContasProximasDoVencimento, mensagemVencimento } from '../lib/contasPagarLembretes';
import { getCobrancasComPrevisaoProxima, getCobrancasAtrasadas, getCobrancasNovasNaoLidas } from '../lib/cobrancasLembretes';
import { getClientesNovosNaoLidos, getProjetosNovosNaoLidos } from '../lib/cadastrosLembretes';
import Rodape from '../components/Rodape';

const ROLE_LABELS = {
  admin: 'Administrador',
  operador: 'Operador',
  visualizante: 'Visualizante',
};

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lembretes, setLembretes] = useState([]);
  const [aniversariosPassados, setAniversariosPassados] = useState([]);
  const [contasProximas, setContasProximas] = useState([]);
  const [cobrancasProximas, setCobrancasProximas] = useState([]);
  const [cobrancasAtrasadas, setCobrancasAtrasadas] = useState([]);
  const [cobrancasNovas, setCobrancasNovas] = useState([]);
  const [clientesNovos, setClientesNovos] = useState([]);
  const [projetosNovos, setProjetosNovos] = useState([]);
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);

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
        .select('email, role, nome')
        .eq('id', session.user.id)
        .single();

      const perfilAtual = error || !data ? { email: session.user.email, role: 'visualizante' } : data;
      setProfile(perfilAtual);
      const roleAtual = perfilAtual.role || 'visualizante';

      // Boas-vindas: mostra só se fizer mais de 7 dias desde a última vez.
      const { data: visita } = await supabase
        .from('visitas_usuario')
        .select('ultima_boas_vindas')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const deveMostrarBoasVindas =
        !visita?.ultima_boas_vindas || Date.now() - new Date(visita.ultima_boas_vindas).getTime() > SETE_DIAS_MS;
      setMostrarBoasVindas(deveMostrarBoasVindas);
      if (deveMostrarBoasVindas) {
        await supabase
          .from('visitas_usuario')
          .upsert({ user_id: session.user.id, ultima_boas_vindas: new Date().toISOString() });
      }

      const { data: perfis } = await supabase.from('profiles').select('id, email, nome');
      const mapaNomes = {};
      (perfis || []).forEach((p) => {
        mapaNomes[p.id] = p.nome || p.email;
      });

      const { data: clientes } = await supabase
        .from('clientes')
        .select('id, nome, data_nascimento, conjuge_nome, conjuge_data_nascimento, filhos, created_by, created_at, aviso_lido');
      setLembretes(getLembretesAniversario(clientes));
      setAniversariosPassados(getAniversariosPassados(clientes));
      setClientesNovos(getClientesNovosNaoLidos(clientes, mapaNomes));

      const { data: projetos } = await supabase
        .from('projetos')
        .select('id, numero_projeto, nome, created_by, created_at, aviso_lido');
      setProjetosNovos(getProjetosNovosNaoLidos(projetos, mapaNomes));

      // Avisos de pagamentos/cobranças não aparecem pra quem só visualiza.
      if (roleAtual !== 'visualizante') {
        const { data: contas } = await supabase
          .from('contas_pagar')
          .select('id, pagamento, ano, mes, dia_vencimento, status, valor_previsto');
        setContasProximas(getContasProximasDoVencimento(contas));

        const { data: cobrancasData } = await supabase
          .from('cobrancas')
          .select(
            'id, pagamento_previsao, pagamento_status, fornecedor_tipo, created_by, created_at, aviso_lido, projetos(numero_projeto, nome), fornecedores(nome)'
          );

        setCobrancasProximas(getCobrancasComPrevisaoProxima(cobrancasData));
        setCobrancasAtrasadas(getCobrancasAtrasadas(cobrancasData));
        setCobrancasNovas(getCobrancasNovasNaoLidas(cobrancasData, mapaNomes));
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function marcarAvisoComoVisto(tabela, id, listaSetter) {
    await supabase.from(tabela).update({ aviso_lido: true }).eq('id', id);
    listaSetter((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  const role = profile?.role || 'visualizante';
  const nomeExibicao = profile?.nome || profile?.email;
  const canEdit = role === 'admin' || role === 'operador';

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <Nav />

        <div style={{ marginBottom: 18 }}>
          <span className="role-badge">{ROLE_LABELS[role] || role}</span>
        </div>

        {mostrarBoasVindas && (
          <div className="section-card">
            <h2>Bem-vindo, {nomeExibicao}</h2>
            <p>
              Use o menu acima para lançar entradas e saídas, cadastrar clientes, fornecedores e
              projetos, e ver os relatórios financeiros.
            </p>
          </div>
        )}

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

        {aniversariosPassados.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--muted)' }}>
            <h2>🎈 Aniversários recentes</h2>
            {aniversariosPassados.map((lembrete, index) => (
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
            <h2>🆕 Novas cobranças cadastradas</h2>
            {cobrancasNovas.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, margin: '6px 0' }}>
                <p style={{ margin: 0 }}>{c.texto}</p>
                {canEdit && (
                  <button className="btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => marcarAvisoComoVisto('cobrancas', c.id, setCobrancasNovas)}>
                    ✔ Marcar como visto
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {clientesNovos.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2>🆕 Novos clientes cadastrados</h2>
            {clientesNovos.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, margin: '6px 0' }}>
                <p style={{ margin: 0 }}>{c.texto}</p>
                {canEdit && (
                  <button className="btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => marcarAvisoComoVisto('clientes', c.id, setClientesNovos)}>
                    ✔ Marcar como visto
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {projetosNovos.length > 0 && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2>🆕 Novos projetos cadastrados</h2>
            {projetosNovos.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, margin: '6px 0' }}>
                <p style={{ margin: 0 }}>{c.texto}</p>
                {canEdit && (
                  <button className="btn-secondary" style={{ whiteSpace: 'nowrap' }} onClick={() => marcarAvisoComoVisto('projetos', c.id, setProjetosNovos)}>
                    ✔ Marcar como visto
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <Rodape />
      </div>
    </div>
  );
}
