import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import { useBloqueiaVisualizante } from '../lib/acessoRestrito';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import TabelaRolavel from '../components/TabelaRolavel';
import { BotaoEditarIcone } from '../components/Icones';
import { formatDataCurta, sanitizeValorComCentavos, previewValorComCentavos, parseValorComCentavos } from '../lib/masks';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_CONTAS_PAGAR = ['aberto', 'agendado', 'débito', 'pago', 'reembolso', 'não pago', 'info', 'indefinido'];

const emptyEdit = {
  pagamento: '',
  referencia: '',
  recebedor: '',
  pagador: '',
  valor: '',
  data_pagamento: '',
};

function parseDataCurtaParaData(str) {
  if (!str) return null;
  const partes = str.split('/');
  if (partes.length !== 3) return null;
  const [d, m, a] = partes;
  const ano = Number(a) < 100 ? 2000 + Number(a) : Number(a);
  const data = new Date(ano, Number(m) - 1, Number(d));
  return isNaN(data.getTime()) ? null : data;
}

export default function Pagamentos() {
  const { loading, canEdit, role } = useAuth();
  useBloqueiaVisualizante(role, loading);

  const [anos, setAnos] = useState([]);
  const [modoBusca, setModoBusca] = useState('mes'); // 'mes' | 'periodo'
  const [anoSelecionado, setAnoSelecionado] = useState(() => new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(() => new Date().getMonth() + 1);
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [filtroPagamento, setFiltroPagamento] = useState('');
  const [filtroRecebedor, setFiltroRecebedor] = useState('');
  const [itens, setItens] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [form, setForm] = useState(emptyEdit);
  const [saving, setSaving] = useState(false);

  const [relAno, setRelAno] = useState(() => new Date().getFullYear());
  const [relMes, setRelMes] = useState('');
  const [relPagamento, setRelPagamento] = useState('');
  const [relRecebedor, setRelRecebedor] = useState('');
  const [relStatus, setRelStatus] = useState('');
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  async function loadAnos() {
    const { data } = await supabase.from('contas_pagar_anos').select('ano').order('ano');
    setAnos((data || []).map((a) => a.ano));
  }

  async function loadPagamentosDoMes() {
    if (!anoSelecionado || !mesSelecionado) {
      setItens([]);
      return;
    }
    const { data } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('ano', anoSelecionado)
      .eq('mes', mesSelecionado);
    setItens(data || []);
  }

  async function buscarPorPeriodo() {
    if (!periodoInicio || !periodoFim) {
      setItens([]);
      return;
    }
    const anoInicio = Number(periodoInicio.slice(0, 4));
    const anoFim = Number(periodoFim.slice(0, 4));

    const { data } = await supabase.from('pagamentos').select('*').gte('ano', anoInicio).lte('ano', anoFim);

    const dataInicio = new Date(periodoInicio + 'T00:00:00');
    const dataFim = new Date(periodoFim + 'T23:59:59');

    const filtrados = (data || []).filter((item) => {
      const d = parseDataCurtaParaData(item.data_pagamento);
      return d && d >= dataInicio && d <= dataFim;
    });
    setItens(filtrados);
  }

  useEffect(() => {
    if (!loading) loadAnos();
  }, [loading]);

  useEffect(() => {
    if (modoBusca === 'mes') loadPagamentosDoMes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoSelecionado, mesSelecionado, modoBusca]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openEdit(item) {
    setForm({
      pagamento: item.pagamento || '',
      referencia: item.referencia || '',
      recebedor: item.recebedor || '',
      pagador: item.pagador || '',
      valor: item.valor != null ? String(item.valor).replace('.', ',') : '',
      data_pagamento: item.data_pagamento || '',
    });
    setEditingId(item.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyEdit);
  }

  function recarregar() {
    if (modoBusca === 'mes') loadPagamentosDoMes();
    else buscarPorPeriodo();
  }

  async function salvarEdicao(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      pagamento: form.pagamento || null,
      referencia: form.referencia || null,
      recebedor: form.recebedor || null,
      pagador: form.pagador || null,
      valor: form.valor ? parseValorComCentavos(form.valor) : null,
      data_pagamento: form.data_pagamento || null,
      atualizado_em: new Date().toISOString(),
    };

    await supabase.from('pagamentos').update(payload).eq('id', editingId);

    setSaving(false);
    cancelEdit();
    recarregar();
  }

  async function gerarRelatorioContasPagas() {
    setGerandoRelatorio(true);

    let query = supabase.from('contas_pagar').select('*').eq('ano', relAno);
    if (relMes) query = query.eq('mes', Number(relMes));
    if (relStatus) query = query.eq('status', relStatus);

    const { data } = await query;
    let linhas = data || [];

    if (relPagamento.trim()) {
      linhas = linhas.filter((i) => (i.pagamento || '').toLowerCase().includes(relPagamento.trim().toLowerCase()));
    }
    if (relRecebedor.trim()) {
      linhas = linhas.filter((i) => (i.recebedor || '').toLowerCase().includes(relRecebedor.trim().toLowerCase()));
    }

    const header = ['Ano', 'Mês', 'Pagamento', 'Recebedor', 'Pagador', 'Dia vencimento', 'Status', 'Data pagamento', 'Valor pago', 'Valor previsto'];
    const linhasCsv = linhas.map((i) => [
      i.ano ?? '',
      MESES[i.mes - 1] || i.mes || '',
      (i.pagamento || '').replace(/;/g, ','),
      (i.recebedor || '').replace(/;/g, ','),
      (i.pagador || '').replace(/;/g, ','),
      i.dia_vencimento ?? '',
      i.status || '',
      i.data_pagamento || '',
      i.valor_pago != null ? String(i.valor_pago).replace('.', ',') : '',
      i.valor_previsto != null ? String(i.valor_previsto).replace('.', ',') : '',
    ]);

    // Ponto-e-vírgula como separador: é o que o Excel em português espera
    // (já que a vírgula ali é usada como separador decimal).
    const csvContent = [header, ...linhasCsv].map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-contas-pagas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setGerandoRelatorio(false);
  }

  function formatMoney(value) {
    if (value == null) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Filtros cumulativos: período/mês (já aplicado na consulta) -> pagamento -> recebedor
  const itensFiltrados = itens.filter((item) => {
    if (filtroPagamento.trim() && !(item.pagamento || '').toLowerCase().includes(filtroPagamento.trim().toLowerCase())) {
      return false;
    }
    if (filtroRecebedor.trim() && !(item.recebedor || '').toLowerCase().includes(filtroRecebedor.trim().toLowerCase())) {
      return false;
    }
    return true;
  });

  // Agrupa por mês/ano (no modo "mês completo" sempre vai dar um grupo só;
  // no modo "período" pode dar vários, do mais recente pro mais antigo).
  const chavesMeses = [...new Set(itensFiltrados.map((i) => `${i.ano}-${i.mes}`))].sort((a, b) => {
    const [anoA, mesA] = a.split('-').map(Number);
    const [anoB, mesB] = b.split('-').map(Number);
    return anoB - anoA || mesB - mesA;
  });

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

        <h1 style={{ marginBottom: 18 }}>Pagamentos</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
          Esta lista é gerada automaticamente: toda conta marcada com status "Pago" em Contas a Pagar
          aparece aqui sozinha.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            className={modoBusca === 'mes' ? '' : 'btn-secondary'}
            style={{ width: 'auto', padding: '8px 16px' }}
            onClick={() => setModoBusca('mes')}
          >
            Mês completo
          </button>
          <button
            type="button"
            className={modoBusca === 'periodo' ? '' : 'btn-secondary'}
            style={{ width: 'auto', padding: '8px 16px' }}
            onClick={() => setModoBusca('periodo')}
          >
            Período específico
          </button>
        </div>

        {modoBusca === 'mes' ? (
          <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
            <div>
              <label>Ano</label>
              <select value={anoSelecionado} onChange={(e) => setAnoSelecionado(Number(e.target.value))}>
                {anos.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Mês</label>
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(Number(e.target.value))}>
                {MESES.map((mes, index) => (
                  <option key={mes} value={index + 1}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Pagamento</label>
              <input
                value={filtroPagamento}
                onChange={(e) => setFiltroPagamento(e.target.value)}
                placeholder="Filtrar por pagamento..."
              />
            </div>
            <div>
              <label>Recebedor</label>
              <input
                value={filtroRecebedor}
                onChange={(e) => setFiltroRecebedor(e.target.value)}
                placeholder="Filtrar por recebedor..."
              />
            </div>
          </div>
        ) : (
          <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
            <div>
              <label>De</label>
              <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
            </div>
            <div>
              <label>Até</label>
              <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
            </div>
            <div>
              <label>Pagamento</label>
              <input
                value={filtroPagamento}
                onChange={(e) => setFiltroPagamento(e.target.value)}
                placeholder="Filtrar por pagamento..."
              />
            </div>
            <div>
              <label>Recebedor</label>
              <input
                value={filtroRecebedor}
                onChange={(e) => setFiltroRecebedor(e.target.value)}
                placeholder="Filtrar por recebedor..."
              />
            </div>
            <div>
              <button type="button" style={{ width: 'auto', padding: '10px 18px' }} onClick={buscarPorPeriodo}>
                Buscar
              </button>
            </div>
          </div>
        )}

        {modoBusca === 'mes' && (
          <h2 style={{ margin: '10px 0 18px' }}>
            {MESES[mesSelecionado - 1]}/{String(anoSelecionado).slice(-2)}
          </h2>
        )}

        {chavesMeses.length === 0 ? (
          <p className="empty-hint">
            {modoBusca === 'periodo' && (!periodoInicio || !periodoFim)
              ? 'Escolha o período e clique em Buscar.'
              : 'Nenhum pagamento nesse filtro.'}
          </p>
        ) : (
          chavesMeses.map((chave) => {
            const [ano, mes] = chave.split('-').map(Number);
            const itensDoGrupo = itensFiltrados
              .filter((i) => i.ano === ano && i.mes === mes)
              .sort((a, b) => (parseDataCurtaParaData(b.data_pagamento)?.getTime() || 0) - (parseDataCurtaParaData(a.data_pagamento)?.getTime() || 0));
            const totalGrupo = itensDoGrupo.reduce((soma, i) => soma + (Number(i.valor) || 0), 0);

            return (
              <div key={chave} style={{ marginBottom: 28 }}>
                {modoBusca === 'periodo' && (
                  <h2 style={{ marginBottom: 10 }}>
                    {MESES[mes - 1]}/{String(ano).slice(-2)}
                  </h2>
                )}
                <TabelaRolavel>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {canEdit && <th></th>}
                        <th>Pagamento</th>
                        <th>Referência</th>
                        <th>Recebedor</th>
                        <th>Pagador</th>
                        <th>Valor</th>
                        <th>Data do pagamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensDoGrupo.map((item) => (
                        <tr
                          key={item.id}
                          className={linhaSelecionada === item.id ? 'linha-selecionada' : ''}
                          onClick={() => setLinhaSelecionada(linhaSelecionada === item.id ? null : item.id)}
                        >
                          {canEdit && (
                            <td>
                              <BotaoEditarIcone onClick={() => openEdit(item)} />
                            </td>
                          )}
                          <td>{item.pagamento || '—'}</td>
                          <td>{item.referencia || '—'}</td>
                          <td>{item.recebedor || '—'}</td>
                          <td>{item.pagador || '—'}</td>
                          <td>{formatMoney(item.valor)}</td>
                          <td>{item.data_pagamento || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TabelaRolavel>
                <p style={{ textAlign: 'right', fontWeight: 700, marginTop: 8 }}>
                  Total: {formatMoney(totalGrupo)}
                </p>
              </div>
            );
          })
        )}

        {editingId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: 20,
            }}
          >
            <form
              className="section-card"
              onSubmit={salvarEdicao}
              style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div className="toolbar" style={{ marginBottom: 4 }}>
                <h2>Editar pagamento</h2>
                <button type="button" className="btn-secondary" onClick={cancelEdit}>
                  Cancelar
                </button>
              </div>

              <div className="form-grid">
                <div>
                  <label>Pagamento</label>
                  <input value={form.pagamento} onChange={(e) => updateField('pagamento', e.target.value)} />
                </div>
                <div>
                  <label>Referência</label>
                  <input value={form.referencia} onChange={(e) => updateField('referencia', e.target.value)} />
                </div>
                <div>
                  <label>Recebedor</label>
                  <input value={form.recebedor} onChange={(e) => updateField('recebedor', e.target.value)} />
                </div>
                <div>
                  <label>Pagador</label>
                  <input value={form.pagador} onChange={(e) => updateField('pagador', e.target.value)} />
                </div>
                <div>
                  <label>Valor</label>
                  <input
                    value={form.valor}
                    onChange={(e) => updateField('valor', sanitizeValorComCentavos(e.target.value))}
                    placeholder="1500 ou 1500,50"
                    inputMode="decimal"
                  />
                  {form.valor && (
                    <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                      = {previewValorComCentavos(form.valor)}
                    </p>
                  )}
                </div>
                <div>
                  <label>Data do pagamento</label>
                  <input
                    value={form.data_pagamento}
                    onChange={(e) => updateField('data_pagamento', formatDataCurta(e.target.value))}
                    placeholder="DD/MM/AA"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="section-card" style={{ marginTop: 30 }}>
          <h2 style={{ marginBottom: 10 }}>Relatório de Contas Pagas</h2>
          <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
            <div>
              <label>Ano</label>
              <select value={relAno} onChange={(e) => setRelAno(Number(e.target.value))}>
                {anos.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Mês</label>
              <select value={relMes} onChange={(e) => setRelMes(e.target.value)}>
                <option value="">Todos os meses</option>
                {MESES.map((mes, index) => (
                  <option key={mes} value={index + 1}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Pagamento</label>
              <input value={relPagamento} onChange={(e) => setRelPagamento(e.target.value)} />
            </div>
            <div>
              <label>Recebedor</label>
              <input value={relRecebedor} onChange={(e) => setRelRecebedor(e.target.value)} />
            </div>
            <div>
              <label>Status</label>
              <select value={relStatus} onChange={(e) => setRelStatus(e.target.value)}>
                <option value="">Todos</option>
                {STATUS_CONTAS_PAGAR.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="button"
                style={{ width: 'auto', padding: '10px 18px' }}
                onClick={gerarRelatorioContasPagas}
                disabled={gerandoRelatorio}
              >
                {gerandoRelatorio ? 'Gerando...' : 'Gerar relatório (CSV)'}
              </button>
            </div>
          </div>
        </div>

        <Rodape />
      </div>
    </div>
  );
}
