import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import { useBloqueiaVisualizante } from '../lib/acessoRestrito';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import { formatDataCurta } from '../lib/masks';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const ITENS = [
  { chave: 'cobranca_rts', titulo: 'Cobrança de RTs', periodicidade: 'a cada dois dias', quantidade: 15 },
  { chave: 'atualizacoes_sistema', titulo: 'Atualizações no Sistema', periodicidade: 'a cada dois dias', quantidade: 15 },
  { chave: 'conciliacao', titulo: 'Conciliação', periodicidade: 'toda segunda-feira', quantidade: 5 },
  { chave: 'emissao_nf', titulo: 'Emissão de NF', periodicidade: 'toda segunda-feira', quantidade: 5 },
  { chave: 'cobranca_projeto', titulo: 'Cobrança de Projeto', periodicidade: 'a cada 15 dias', quantidade: 2 },
  { chave: 'planilha_assessoria', titulo: 'Produção da Planilha de Assessoria', periodicidade: 'a cada 30 dias, na primeira semana do mês', quantidade: 1 },
  { chave: 'cobranca_assessoria', titulo: 'Cobrança de Assessoria', periodicidade: 'a cada 30 dias, na primeira quinzena do mês', quantidade: 1 },
];

function checkboxesVazios(quantidade) {
  return Array.from({ length: quantidade }, () => ({ feito: false, data: '' }));
}

function hojeFormatado() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = String(hoje.getFullYear()).slice(-2);
  return `${dia}/${mes}/${ano}`;
}

function ajustarAltura(e) {
  e.target.style.height = 'auto';
  e.target.style.height = `${e.target.scrollHeight}px`;
}

export default function ChecklistFinanceiro() {
  const { loading, canEdit, role } = useAuth();
  useBloqueiaVisualizante(role, loading);

  const [nomeUsuario, setNomeUsuario] = useState('Usuário');
  const [mesSelecionado, setMesSelecionado] = useState(() => new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(() => new Date().getFullYear());
  const [mesBusca, setMesBusca] = useState(() => new Date().getMonth() + 1);
  const [anoBusca, setAnoBusca] = useState(() => new Date().getFullYear());
  const [dadosItens, setDadosItens] = useState({});
  const [textosNovos, setTextosNovos] = useState({});
  const [versaoTextarea, setVersaoTextarea] = useState({});

  useEffect(() => {
    async function loadNomeUsuario() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('profiles').select('nome, email').eq('id', session.user.id).single();
      setNomeUsuario(data?.nome || data?.email || 'Usuário');
    }
    loadNomeUsuario();
  }, []);

  async function loadChecklist(ano, mes) {
    const { data } = await supabase
      .from('checklist_financeiro')
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes);

    const mapa = {};
    ITENS.forEach((item) => {
      const existente = (data || []).find((d) => d.item_chave === item.chave);
      mapa[item.chave] = {
        checkboxes:
          existente?.checkboxes && existente.checkboxes.length === item.quantidade
            ? existente.checkboxes
            : checkboxesVazios(item.quantidade),
        historico: existente?.observacoes_historico || [],
      };
    });
    setDadosItens(mapa);
    setTextosNovos({});
    setAnoSelecionado(ano);
    setMesSelecionado(mes);
  }

  useEffect(() => {
    if (!loading) loadChecklist(anoBusca, mesBusca);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function handleBuscar() {
    loadChecklist(anoBusca, mesBusca);
  }

  async function salvarNoBanco(chave, checkboxes, historico) {
    await supabase.from('checklist_financeiro').upsert(
      {
        ano: anoSelecionado,
        mes: mesSelecionado,
        item_chave: chave,
        checkboxes,
        observacoes_historico: historico,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'ano,mes,item_chave' }
    );
  }

  async function registrarAviso(chave, titulo, tipo, descricao) {
    await supabase.from('checklist_financeiro_avisos').insert([
      {
        item_chave: chave,
        ano: anoSelecionado,
        mes: mesSelecionado,
        tipo,
        descricao: `${nomeUsuario} — ${titulo}: ${descricao}`,
        usuario_nome: nomeUsuario,
      },
    ]);
  }

  function toggleCheckbox(chave, indice) {
    const item = ITENS.find((i) => i.chave === chave);
    setDadosItens((prev) => {
      const atual = prev[chave];
      const novoValor = !atual.checkboxes[indice].feito;
      const novosCheckboxes = atual.checkboxes.map((c, i) => (i === indice ? { ...c, feito: novoValor } : c));
      salvarNoBanco(chave, novosCheckboxes, atual.historico);
      registrarAviso(
        chave,
        item.titulo,
        'checkbox',
        `caixa ${indice + 1} foi ${novoValor ? 'marcada' : 'desmarcada'} (${MESES[mesSelecionado - 1]}/${anoSelecionado})`
      );
      return { ...prev, [chave]: { ...atual, checkboxes: novosCheckboxes } };
    });
  }

  function alterarData(chave, indice, valor) {
    setDadosItens((prev) => {
      const item = prev[chave];
      const novosCheckboxes = item.checkboxes.map((c, i) =>
        i === indice ? { ...c, data: formatDataCurta(valor) } : c
      );
      return { ...prev, [chave]: { ...item, checkboxes: novosCheckboxes } };
    });
  }

  function salvarDataAoSair(chave) {
    const item = dadosItens[chave];
    if (item) salvarNoBanco(chave, item.checkboxes, item.historico);
  }

  function alterarTextoNovo(chave, valor) {
    setTextosNovos((prev) => ({ ...prev, [chave]: valor }));
  }

  async function salvarObservacao(chave) {
    const texto = (textosNovos[chave] || '').trim();
    if (!texto) return;

    const item = ITENS.find((i) => i.chave === chave);
    const novaEntrada = { data: hojeFormatado(), texto };

    setDadosItens((prev) => {
      const atual = prev[chave];
      const novoHistorico = [...atual.historico, novaEntrada];
      salvarNoBanco(chave, atual.checkboxes, novoHistorico);
      return { ...prev, [chave]: { ...atual, historico: novoHistorico } };
    });

    registrarAviso(chave, item.titulo, 'observacao', `nova observação registrada: "${texto}"`);

    setTextosNovos((prev) => ({ ...prev, [chave]: '' }));
    setVersaoTextarea((prev) => ({ ...prev, [chave]: (prev[chave] || 0) + 1 }));
  }

  if (loading) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="wide-page">
      <div className="wide-page-inner">
        <Nav />

        <h1 style={{ marginBottom: 18 }}>Checklist Financeiro</h1>

        <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>Mês</label>
            <select value={mesBusca} onChange={(e) => setMesBusca(Number(e.target.value))}>
              {MESES.map((mes, index) => (
                <option key={mes} value={index + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Ano</label>
            <select value={anoBusca} onChange={(e) => setAnoBusca(Number(e.target.value))}>
              {[anoBusca - 1, anoBusca, anoBusca + 1]
                .filter((v, i, arr) => arr.indexOf(v) === i)
                .map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <button type="button" style={{ width: 'auto', padding: '10px 18px' }} onClick={handleBuscar}>
              Buscar
            </button>
          </div>
        </div>

        <h2 style={{ margin: '10px 0 18px' }}>
          {MESES[mesSelecionado - 1]}/{String(anoSelecionado).slice(-2)}
        </h2>

        {ITENS.map((item) => {
          const dados = dadosItens[item.chave];
          if (!dados) return null;

          return (
            <div key={item.chave} className="section-card">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20 }}>
                <div style={{ minWidth: 200 }}>
                  <h2 style={{ marginBottom: 2 }}>{item.titulo}</h2>
                  <p style={{ fontStyle: 'italic', color: 'var(--muted)', margin: 0 }}>{item.periodicidade}</p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                  {dados.checkboxes.map((c, indice) => (
                    <div key={indice} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={c.feito}
                        disabled={!canEdit}
                        onChange={() => toggleCheckbox(item.chave, indice)}
                        style={{ width: 18, height: 18 }}
                      />
                      <div style={{ marginTop: 4 }}>
                        <input
                          value={c.data}
                          disabled={!canEdit}
                          onChange={(e) => alterarData(item.chave, indice, e.target.value)}
                          onBlur={() => salvarDataAoSair(item.chave)}
                          placeholder="dd/mm/aa"
                          inputMode="numeric"
                          style={{ width: 78, fontSize: 12, padding: '4px 6px', textAlign: 'center' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {dados.historico.length > 0 && (
                <div style={{ marginTop: 14, fontStyle: 'italic', fontSize: 13 }}>
                  {dados.historico.map((entrada, i) => (
                    <p key={i} style={{ margin: '2px 0' }}>
                      - {entrada.data} – {entrada.texto};
                    </p>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <label>Observações</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    key={versaoTextarea[item.chave] || 0}
                    value={textosNovos[item.chave] || ''}
                    disabled={!canEdit}
                    onChange={(e) => alterarTextoNovo(item.chave, e.target.value)}
                    onInput={ajustarAltura}
                    rows={1}
                    style={{
                      flex: 1,
                      resize: 'none',
                      overflow: 'hidden',
                      minHeight: 40,
                      fontFamily: 'inherit',
                      fontSize: 14,
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                    }}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => salvarObservacao(item.chave)}
                      style={{ width: 'auto', padding: '10px 16px' }}
                    >
                      Salvar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <Rodape />
      </div>
    </div>
  );
}
