import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import { useBloqueiaVisualizante } from '../lib/acessoRestrito';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import { formatParcela, formatDataCurta, formatValorReais } from '../lib/masks';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_OPTIONS = [
  { codigo: 'aberto', texto: 'Pagamento em aberto', cor: '#f7d2ab', corTexto: '#5a3a12' },
  { codigo: 'agendado', texto: 'Pagamento agendado', cor: '#c2e8c6', corTexto: '#1e6b3a' },
  { codigo: 'débito', texto: 'Pagamento programado em débito automático na c/c', cor: '#dcd0f0', corTexto: '#3a2a5e' },
  { codigo: 'pago', texto: 'Pagamento efetuado', cor: '#bcdcf2', corTexto: '#1c3f5e' },
  { codigo: 'reembolso', texto: 'Pagamento efetuado passível de reembolso', cor: '#d9342b', corTexto: '#ffffff' },
  { codigo: 'não pago', texto: 'Pagamento não efetuado ou isento', cor: '#e6e6e6', corTexto: '#4a4a4a' },
  { codigo: 'info', texto: 'Completar informação', cor: '#f3e6a3', corTexto: '#5a4a06' },
  { codigo: 'indefinido', texto: 'Pagamento indefinido', cor: '#b5b5b5', corTexto: '#232323' },
];

const REFERENCIA_OPCOES = ['Mês corrente', 'Mês anterior', 'Parcela'];

function labelReferencia(item) {
  if (item.referencia_tipo === 'parcela') return item.referencia || '—';
  if (!item.referencia_tipo) return item.referencia || '—';

  let ano = item.ano;
  let mes = item.mes;
  if (item.referencia_tipo === 'anterior') {
    mes -= 1;
    if (mes < 1) {
      mes = 12;
      ano -= 1;
    }
  }
  return `${MESES[mes - 1].toLowerCase()}/${String(ano).slice(-2)}`;
}

const emptyForm = {
  pagamento: '',
  referenciaTipo: 'Mês corrente',
  parcela: '',
  recebedor: '',
  pagador: '',
  dia_vencimento: '',
  status: '',
  data_pagamento: '',
  valor_pago: '',
  valor_previsto: '',
  observacoes: '',
  recorrencia: 1,
};

export default function ContasAPagar() {
  const { loading, canEdit, canDelete, role } = useAuth();
  useBloqueiaVisualizante(role, loading);
  const [anos, setAnos] = useState([]);
  const [anoSelecionado, setAnoSelecionado] = useState(() => new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(() => new Date().getMonth() + 1);
  const [items, setItems] = useState([]);
  const [todasContas, setTodasContas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadAnos() {
    const { data } = await supabase.from('contas_pagar_anos').select('ano').order('ano');
    setAnos((data || []).map((a) => a.ano));
  }

  async function loadTodasContas() {
    const { data } = await supabase
      .from('contas_pagar')
      .select('pagamento, recebedor, pagador');
    setTodasContas(data || []);
  }

  async function loadItems() {
    if (!anoSelecionado || !mesSelecionado) {
      setItems([]);
      return;
    }
    const { data } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('ano', anoSelecionado)
      .eq('mes', mesSelecionado)
      .order('dia_vencimento', { ascending: true, nullsFirst: true })
      .order('pagamento', { ascending: true });
    setItems(data || []);
  }

  useEffect(() => {
    if (!loading) {
      loadAnos();
      loadTodasContas();
    }
  }, [loading]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoSelecionado, mesSelecionado]);

  const sugestoesPagamento = useMemo(
    () => [...new Set(todasContas.map((c) => c.pagamento).filter(Boolean))],
    [todasContas]
  );
  const sugestoesRecebedor = useMemo(
    () => [...new Set(todasContas.map((c) => c.recebedor).filter(Boolean))],
    [todasContas]
  );
  const sugestoesPagador = useMemo(
    () => [...new Set(todasContas.map((c) => c.pagador).filter(Boolean))],
    [todasContas]
  );

  async function handleCriarAno() {
    const proximoAno = anos.length > 0 ? Math.max(...anos) + 1 : new Date().getFullYear();
    const { error: insertError } = await supabase.from('contas_pagar_anos').insert([{ ano: proximoAno }]);
    if (!insertError) {
      loadAnos();
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEditForm(item) {
    let referenciaTipo = 'Mês corrente';
    let parcela = '';
    if (item.referencia_tipo === 'anterior') {
      referenciaTipo = 'Mês anterior';
    } else if (item.referencia_tipo === 'parcela') {
      referenciaTipo = 'Parcela';
      parcela = item.referencia || '';
    }

    setForm({
      pagamento: item.pagamento || '',
      referenciaTipo,
      parcela,
      recebedor: item.recebedor || '',
      pagador: item.pagador || '',
      dia_vencimento: item.dia_vencimento || '',
      status: item.status || '',
      data_pagamento: item.data_pagamento || '',
      valor_pago: item.valor_pago != null ? String(Math.round(item.valor_pago)) : '',
      valor_previsto: item.valor_previsto != null ? String(Math.round(item.valor_previsto)) : '',
      observacoes: item.observacoes || '',
      recorrencia: 1,
    });
    setEditingId(item.id);
    setError('');
    setShowForm(true);
  }

  function handleCancelar() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  function handleLimpar() {
    if (!confirm('Tem certeza que quer limpar todas as informações inseridas?')) return;
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const referenciaTipoSalvo =
      form.referenciaTipo === 'Mês corrente' ? 'corrente' : form.referenciaTipo === 'Mês anterior' ? 'anterior' : 'parcela';
    const referencia = form.referenciaTipo === 'Parcela' ? form.parcela : null;

    const basePayload = {
      pagamento: form.pagamento || null,
      referencia_tipo: referenciaTipoSalvo,
      referencia: referencia || null,
      recebedor: form.recebedor || null,
      pagador: form.pagador || null,
      dia_vencimento: form.dia_vencimento ? parseInt(form.dia_vencimento, 10) : null,
      status: form.status || null,
      data_pagamento: form.data_pagamento || null,
      valor_pago: form.valor_pago ? parseInt(form.valor_pago, 10) : null,
      valor_previsto: form.valor_previsto ? parseInt(form.valor_previsto, 10) : null,
      observacoes: form.observacoes || null,
      atualizado_em: new Date().toISOString(),
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from('contas_pagar')
        .update(basePayload)
        .eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError(`Não foi possível salvar: ${updateError.message}`);
        return;
      }
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const repeticoes = Math.min(Math.max(parseInt(form.recorrencia, 10) || 1, 1), 14);
      const registros = [];
      let anoAtual = Number(anoSelecionado);
      let mesAtual = Number(mesSelecionado);

      for (let i = 0; i < repeticoes; i++) {
        registros.push({
          ...basePayload,
          ano: anoAtual,
          mes: mesAtual,
          created_by: session?.user?.id || null,
        });
        mesAtual += 1;
        if (mesAtual > 12) {
          mesAtual = 1;
          anoAtual += 1;
        }
      }

      const { error: insertError } = await supabase.from('contas_pagar').insert(registros);
      if (insertError) {
        setSaving(false);
        setError(`Não foi possível salvar: ${insertError.message}`);
        return;
      }
    }

    setSaving(false);
    handleCancelar();
    loadItems();
    loadTodasContas();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar esta conta?')) return;
    await supabase.from('contas_pagar').delete().eq('id', id);
    loadItems();
  }

  function statusStyle(codigo) {
    const opcao = STATUS_OPTIONS.find((s) => s.codigo === codigo);
    if (!opcao) return {};
    return { backgroundColor: opcao.cor, color: opcao.corTexto };
  }

  function formatMoney(value) {
    if (value == null) return '—';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

        <h1 style={{ marginBottom: 18 }}>Contas a Pagar</h1>

        <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>Ano</label>
            <select value={anoSelecionado} onChange={(e) => { setAnoSelecionado(e.target.value); setMesSelecionado(''); }}>
              <option value="">Selecione...</option>
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </div>
          {anoSelecionado && (
            <div>
              <label>Mês</label>
              <select value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
                <option value="">Selecione...</option>
                {MESES.map((mes, index) => (
                  <option key={mes} value={index + 1}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
          )}
          {canEdit && (
            <div>
              <button type="button" className="btn-secondary" onClick={handleCriarAno}>
                + Criar ano
              </button>
            </div>
          )}
        </div>

        {anoSelecionado && mesSelecionado && (
          <>
            <div className="section-card">
              <h2 style={{ marginBottom: 10 }}>Legenda de status</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {STATUS_OPTIONS.map((s) => (
                  <span
                    key={s.codigo}
                    style={{
                      backgroundColor: s.cor,
                      color: s.corTexto,
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <strong style={{ textTransform: 'capitalize' }}>{s.codigo}</strong> - {s.texto}
                  </span>
                ))}
              </div>
            </div>

            {canEdit && !showForm && (
              <button
                type="button"
                onClick={openNewForm}
                style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
              >
                + Nova conta
              </button>
            )}

            {canEdit && showForm && (
              <form
                className="section-card"
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                style={{ marginBottom: 24 }}
              >
                <div className="toolbar" style={{ marginBottom: 4 }}>
                  <h2>{editingId ? 'Editar conta' : 'Nova conta'}</h2>
                  <button type="button" className="btn-secondary" onClick={handleCancelar}>
                    Cancelar
                  </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                <div className="form-grid">
                  <div>
                    <label>Pagamento</label>
                    <input
                      list="lista-pagamento"
                      value={form.pagamento}
                      onChange={(e) => updateField('pagamento', e.target.value)}
                    />
                    <datalist id="lista-pagamento">
                      {sugestoesPagamento.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label>Referência</label>
                    <select
                      value={form.referenciaTipo}
                      onChange={(e) => updateField('referenciaTipo', e.target.value)}
                    >
                      {REFERENCIA_OPCOES.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.referenciaTipo === 'Parcela' && (
                    <div>
                      <label>Parcela (ex: 02/06)</label>
                      <input
                        value={form.parcela}
                        onChange={(e) => updateField('parcela', formatParcela(e.target.value))}
                        placeholder="00/00"
                        inputMode="numeric"
                      />
                    </div>
                  )}

                  <div>
                    <label>Recebedor</label>
                    <input
                      list="lista-recebedor"
                      value={form.recebedor}
                      onChange={(e) => updateField('recebedor', e.target.value)}
                    />
                    <datalist id="lista-recebedor">
                      {sugestoesRecebedor.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label>Pagador</label>
                    <input
                      list="lista-pagador"
                      value={form.pagador}
                      onChange={(e) => updateField('pagador', e.target.value)}
                    />
                    <datalist id="lista-pagador">
                      {sugestoesPagador.map((v) => (
                        <option key={v} value={v} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label>Dia do vencimento</label>
                    <select
                      value={form.dia_vencimento}
                      onChange={(e) => updateField('dia_vencimento', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                        <option key={dia} value={dia}>
                          {String(dia).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      style={form.status ? statusStyle(form.status) : {}}
                    >
                      <option value="">Selecione...</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.codigo} value={s.codigo}>
                          {s.codigo}
                        </option>
                      ))}
                    </select>
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

                  <div>
                    <label>Valor pago</label>
                    <input
                      value={form.valor_pago}
                      onChange={(e) => updateField('valor_pago', e.target.value.replace(/\D/g, ''))}
                      placeholder="Só os números. Ex: 1351"
                      inputMode="numeric"
                    />
                    {form.valor_pago && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                        = {formatValorReais(form.valor_pago)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label>Valor previsto</label>
                    <input
                      value={form.valor_previsto}
                      onChange={(e) => updateField('valor_previsto', e.target.value.replace(/\D/g, ''))}
                      placeholder="Só os números. Ex: 1351"
                      inputMode="numeric"
                    />
                    {form.valor_previsto && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                        = {formatValorReais(form.valor_previsto)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Observações</label>
                    <input
                      value={form.observacoes}
                      onChange={(e) => updateField('observacoes', e.target.value)}
                    />
                  </div>
                </div>

                {!editingId && (
                  <div style={{ marginTop: 4, marginBottom: 10 }}>
                    <label>Recorrência mensal (repetir por quantos meses)</label>
                    <select
                      value={form.recorrencia}
                      onChange={(e) => updateField('recorrencia', e.target.value)}
                      style={{ maxWidth: 200 }}
                    >
                      <option value={1}>Não repetir</option>
                      {Array.from({ length: 13 }, (_, i) => i + 2).map((n) => (
                        <option key={n} value={n}>
                          {n} meses
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar conta'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLimpar}
                    style={{ marginLeft: 24, background: 'var(--danger)', color: 'white' }}
                  >
                    LIMPAR
                  </button>
                </div>
              </form>
            )}

            {!showForm && (
              <div className="data-table-wrap">
                {items.length === 0 ? (
                  <p className="empty-hint">Nenhuma conta cadastrada neste mês.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pagamento</th>
                        <th>Referência</th>
                        <th>Recebedor</th>
                        <th>Pagador</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th>Data pagto.</th>
                        <th>Valor pago</th>
                        <th>Valor previsto</th>
                        {canEdit && <th></th>}
                        {canDelete && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.pagamento || '—'}</td>
                          <td>{labelReferencia(item)}</td>
                          <td>{item.recebedor || '—'}</td>
                          <td>{item.pagador || '—'}</td>
                          <td>{item.dia_vencimento ? String(item.dia_vencimento).padStart(2, '0') : '—'}</td>
                          <td>
                            <span className="tag" style={statusStyle(item.status)}>
                              {item.status || '—'}
                            </span>
                          </td>
                          <td>{item.data_pagamento || '—'}</td>
                          <td>{formatMoney(item.valor_pago)}</td>
                          <td>{formatMoney(item.valor_previsto)}</td>
                          {canEdit && (
                            <td>
                              <button className="btn-editar" onClick={() => openEditForm(item)}>
                                EDITAR
                              </button>
                            </td>
                          )}
                          {canDelete && (
                            <td>
                              <button className="delete-link" onClick={() => handleDelete(item.id)}>
                                Apagar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        <Rodape />
      </div>
    </div>
  );
}
