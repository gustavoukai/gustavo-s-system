import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
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

export default function ChecklistFinanceiro() {
  const { loading, canEdit } = useAuth();
  const [mesSelecionado, setMesSelecionado] = useState(() => new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(() => new Date().getFullYear());
  const [mesBusca, setMesBusca] = useState(() => new Date().getMonth() + 1);
  const [anoBusca, setAnoBusca] = useState(() => new Date().getFullYear());
  const [dadosItens, setDadosItens] = useState({});

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
        observacoes: existente?.observacoes || '',
      };
    });
    setDadosItens(mapa);
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

  async function salvarNoBanco(chave, checkboxes, observacoes) {
    await supabase.from('checklist_financeiro').upsert(
      {
        ano: anoSelecionado,
        mes: mesSelecionado,
        item_chave: chave,
        checkboxes,
        observacoes: observacoes || null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'ano,mes,item_chave' }
    );
  }

  function toggleCheckbox(chave, indice) {
    setDadosItens((prev) => {
      const item = prev[chave];
      const novosCheckboxes = item.checkboxes.map((c, i) => (i === indice ? { ...c, feito: !c.feito } : c));
      salvarNoBanco(chave, novosCheckboxes, item.observacoes);
      return { ...prev, [chave]: { ...item, checkboxes: novosCheckboxes } };
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
    if (item) salvarNoBanco(chave, item.checkboxes, item.observacoes);
  }

  function alterarObservacoes(chave, valor) {
    setDadosItens((prev) => ({ ...prev, [chave]: { ...prev[chave], observacoes: valor } }));
  }

  function salvarObservacoesAoSair(chave) {
    const item = dadosItens[chave];
    if (item) salvarNoBanco(chave, item.checkboxes, item.observacoes);
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

              <div style={{ marginTop: 16 }}>
                <label>Observações</label>
                <input
                  value={dados.observacoes}
                  disabled={!canEdit}
                  onChange={(e) => alterarObservacoes(item.chave, e.target.value)}
                  onBlur={() => salvarObservacoesAoSair(item.chave)}
                />
              </div>
            </div>
          );
        })}

        <Rodape />
      </div>
    </div>
  );
}
