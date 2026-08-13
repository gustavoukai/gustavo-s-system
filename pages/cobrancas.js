import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import { formatDataCurta, sanitizeValorComCentavos, previewValorComCentavos, parseValorComCentavos } from '../lib/masks';
import {
  CATEGORIA_CLIENTE,
  CATEGORIA_FORNECEDOR,
  PAGAMENTO_STATUS_OPTIONS,
  statusCor,
  formatParcelaLabel,
  calcPercentual,
} from '../lib/cobrancaHelpers';

const emptyForm = {
  fornecedorSelecao: '',
  categoria: '',
  parcelas: '1',
  pedido_salvo: '',
  pedido_numero: '',
  pedido_data: '',
  pedido_valor: '',
  pagamento_valor: '',
  pagamento_status: '',
  pagamento_data: '',
  pagamento_previsao: '',
  nf: '',
  nf_numero: '',
  nf_emissao: '',
  nf_envio: '',
  fidelidade_programa: '',
  fidelidade_status: '',
  observacoes: '',
};

export default function Cobrancas() {
  const { loading, canEdit, canDelete } = useAuth();
  const [view, setView] = useState('menu');
  const [projetos, setProjetos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [projetoAtual, setProjetoAtual] = useState(null);
  const [fornecedorAtual, setFornecedorAtual] = useState(null);
  const [cobrancas, setCobrancas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadProjetos() {
    const { data } = await supabase.from('projetos').select('id, numero_projeto, nome');
    const ordenados = (data || []).sort(
      (a, b) => Number(b.numero_projeto || 0) - Number(a.numero_projeto || 0)
    );
    setProjetos(ordenados);
  }

  async function loadFornecedores() {
    const { data } = await supabase
      .from('fornecedores')
      .select('id, nome, categorias, vendedor, telefone_vendedor, financeiro, telefone_financeiro, programas_fidelidade')
      .order('nome');
    setFornecedores(data || []);
  }

  useEffect(() => {
    if (!loading) {
      loadProjetos();
      loadFornecedores();
    }
  }, [loading]);

  async function loadCobrancasPorProjeto(projetoId) {
    const { data } = await supabase
      .from('cobrancas')
      .select('*, fornecedores(nome, categorias, vendedor, telefone_vendedor, financeiro, telefone_financeiro)')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: true });
    setCobrancas(data || []);
  }

  async function loadCobrancasPorFornecedor(fornecedorId) {
    const { data } = await supabase
      .from('cobrancas')
      .select('*, projetos(numero_projeto, nome)')
      .eq('fornecedor_id', fornecedorId)
      .order('created_at', { ascending: true });
    const ordenadas = (data || []).sort(
      (a, b) => Number(b.projetos?.numero_projeto || 0) - Number(a.projetos?.numero_projeto || 0)
    );
    setCobrancas(ordenadas);
  }

  function abrirProjeto(projeto) {
    setProjetoAtual(projeto);
    setView('projeto');
    loadCobrancasPorProjeto(projeto.id);
  }

  function abrirFornecedor(fornecedor) {
    setFornecedorAtual(fornecedor);
    setView('fornecedor');
    loadCobrancasPorFornecedor(fornecedor.id);
  }

  function voltarParaMenu() {
    setView('menu');
    setProjetoAtual(null);
    setFornecedorAtual(null);
    setCobrancas([]);
    handleCancelar();
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFornecedorSelecaoChange(valor) {
    if (valor === 'Cliente') {
      setForm((prev) => ({ ...prev, fornecedorSelecao: 'Cliente', categoria: '', fidelidade_programa: '' }));
      return;
    }
    const fornecedor = fornecedores.find((f) => f.id === valor);
    setForm((prev) => ({
      ...prev,
      fornecedorSelecao: valor,
      categoria: '',
      fidelidade_programa: (fornecedor?.programas_fidelidade || []).join(', '),
    }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEditForm(item) {
    setForm({
      fornecedorSelecao: item.fornecedor_tipo === 'cliente' ? 'Cliente' : item.fornecedor_id,
      categoria: item.categoria || '',
      parcelas: String(item.parcela_total || 1),
      pedido_salvo: item.pedido_salvo || '',
      pedido_numero: item.pedido_numero || '',
      pedido_data: item.pedido_data || '',
      pedido_valor: item.pedido_valor != null ? String(item.pedido_valor).replace('.', ',') : '',
      pagamento_valor: item.pagamento_valor != null ? String(item.pagamento_valor).replace('.', ',') : '',
      pagamento_status: item.pagamento_status || '',
      pagamento_data: item.pagamento_data || '',
      pagamento_previsao: item.pagamento_previsao || '',
      nf: item.nf || '',
      nf_numero: item.nf_numero || '',
      nf_emissao: item.nf_emissao || '',
      nf_envio: item.nf_envio || '',
      fidelidade_programa: item.fidelidade_programa || '',
      fidelidade_status: item.fidelidade_status || '',
      observacoes: item.observacoes || '',
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

    if (!form.fornecedorSelecao || !form.categoria) {
      setError('Escolha o Cliente/Fornecedor e a Categoria antes de salvar.');
      return;
    }

    setSaving(true);
    setError('');

    const tipo = form.fornecedorSelecao === 'Cliente' ? 'cliente' : 'fornecedor';
    const fornecedorId = tipo === 'fornecedor' ? form.fornecedorSelecao : null;

    const basePayload = {
      fornecedor_tipo: tipo,
      fornecedor_id: fornecedorId,
      categoria: form.categoria,
      pedido_salvo: form.pedido_salvo || null,
      pedido_numero: form.pedido_numero || null,
      pedido_data: form.pedido_data || null,
      pedido_valor: form.pedido_valor ? parseValorComCentavos(form.pedido_valor) : null,
      pagamento_valor: form.pagamento_valor ? parseValorComCentavos(form.pagamento_valor) : null,
      pagamento_status: form.pagamento_status || null,
      pagamento_data: form.pagamento_data || null,
      pagamento_previsao: form.pagamento_previsao || null,
      nf: form.nf || null,
      nf_numero: form.nf_numero || null,
      nf_emissao: form.nf_emissao || null,
      nf_envio: form.nf_envio || null,
      fidelidade_programa: form.fidelidade_programa || null,
      fidelidade_status: form.fidelidade_status || null,
      observacoes: form.observacoes || null,
      atualizado_em: new Date().toISOString(),
    };

    let idsParaSincronizar = [];

    if (editingId) {
      const { error: updateError } = await supabase.from('cobrancas').update(basePayload).eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError(`Não foi possível salvar: ${updateError.message}`);
        return;
      }
      idsParaSincronizar = [editingId];
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const totalParcelas = Math.max(parseInt(form.parcelas, 10) || 1, 1);
      const percentual = calcPercentual(totalParcelas);
      const registros = [];
      for (let i = 1; i <= totalParcelas; i++) {
        registros.push({
          ...basePayload,
          projeto_id: projetoAtual.id,
          parcela_atual: i,
          parcela_total: totalParcelas,
          percentual,
          created_by: session?.user?.id || null,
        });
      }

      const { data: inseridos, error: insertError } = await supabase.from('cobrancas').insert(registros).select('id');
      if (insertError) {
        setSaving(false);
        setError(`Não foi possível salvar: ${insertError.message}`);
        return;
      }
      idsParaSincronizar = (inseridos || []).map((r) => r.id);
    }

    try {
      const { data: linhasCompletas } = await supabase
        .from('cobrancas')
        .select('*')
        .in('id', idsParaSincronizar);
      for (const linha of linhasCompletas || []) {
        await sincronizarRecebimento(linha);
      }
    } catch (syncError) {
      // A sincronização com Recebimentos não deve travar o cadastro principal.
    }

    setSaving(false);
    handleCancelar();
    loadCobrancasPorProjeto(projetoAtual.id);
  }

  // Sempre que uma cobrança é salva com status "PAGO" + valor + data preenchidos,
  // cria (ou atualiza) o recebimento correspondente. Se deixar de atender a condição,
  // o recebimento automático é removido.
  async function sincronizarRecebimento(cobranca) {
    const condicaoAtendida =
      cobranca.pagamento_status === 'PAGO' && cobranca.pagamento_valor != null && !!cobranca.pagamento_data;

    if (!condicaoAtendida) {
      await supabase.from('recebimentos').delete().eq('cobranca_id', cobranca.id);
      return;
    }

    const partesData = (cobranca.pagamento_data || '').split('/');
    if (partesData.length !== 3) return;
    const anoCurto = parseInt(partesData[2], 10);
    const ano = anoCurto < 100 ? 2000 + anoCurto : anoCurto;
    const mes = parseInt(partesData[1], 10);
    if (!ano || !mes) return;

    const { data: existente } = await supabase
      .from('recebimentos')
      .select('id')
      .eq('cobranca_id', cobranca.id)
      .maybeSingle();

    const payload = {
      cobranca_id: cobranca.id,
      ano,
      mes,
      data: cobranca.pagamento_data,
      projeto_id: cobranca.projeto_id,
      fornecedor_tipo: cobranca.fornecedor_tipo,
      fornecedor_id: cobranca.fornecedor_id,
      categoria: cobranca.categoria,
      parcela_atual: cobranca.parcela_atual,
      parcela_total: cobranca.parcela_total,
      percentual: cobranca.percentual,
      valor: cobranca.pagamento_valor,
      nf_numero: cobranca.nf_numero,
      atualizado_em: new Date().toISOString(),
    };

    if (existente) {
      await supabase.from('recebimentos').update(payload).eq('id', existente.id);
    } else {
      await supabase.from('recebimentos').insert([payload]);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Apagar esta cobrança?')) return;
    await supabase.from('cobrancas').delete().eq('id', id);
    if (view === 'projeto') loadCobrancasPorProjeto(projetoAtual.id);
    if (view === 'fornecedor') loadCobrancasPorFornecedor(fornecedorAtual.id);
  }

  const categoriaOpcoes =
    form.fornecedorSelecao === 'Cliente' ? CATEGORIA_CLIENTE : CATEGORIA_FORNECEDOR;

  function CobrancaBox({ item, mostrarFornecedorInfo }) {
    const style = statusCor(item.pagamento_status);
    return (
      <div className="cobranca-box" style={{ backgroundColor: style.backgroundColor, color: style.color }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            {mostrarFornecedorInfo && (
              <h3>
                {item.fornecedor_tipo === 'cliente' ? 'Cliente' : item.fornecedores?.nome || '(fornecedor)'}
              </h3>
            )}
            {mostrarFornecedorInfo && item.fornecedor_tipo === 'fornecedor' && item.fornecedores && (
              <p style={{ margin: '2px 0', fontSize: 12 }}>
                {(item.fornecedores.categorias || []).join(', ')}
                {item.fornecedores.vendedor ? ` · Vendedor: ${item.fornecedores.vendedor}` : ''}
                {item.fornecedores.telefone_vendedor ? ` (${item.fornecedores.telefone_vendedor})` : ''}
                {item.fornecedores.financeiro ? ` · Financeiro: ${item.fornecedores.financeiro}` : ''}
                {item.fornecedores.telefone_financeiro ? ` (${item.fornecedores.telefone_financeiro})` : ''}
              </p>
            )}
            {view === 'fornecedor' && item.projetos && (
              <p style={{ margin: '2px 0', fontSize: 12 }}>
                Projeto: {item.projetos.numero_projeto} - {item.projetos.nome}
              </p>
            )}
            <p style={{ margin: '2px 0', fontWeight: 700 }}>
              Categoria: {item.categoria} — Parcela {formatParcelaLabel(item.parcela_atual, item.parcela_total)}
              {item.percentual != null ? ` (${item.percentual}%)` : ''}
            </p>
          </div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-editar" onClick={() => openEditForm(item)}>
                EDITAR
              </button>
              {canDelete && (
                <button className="delete-link" onClick={() => handleDelete(item.id)}>
                  Apagar
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '4px 16px', marginTop: 8, fontSize: 13 }}>
          <div><strong>Pedido salvo:</strong> {item.pedido_salvo || '—'}</div>
          <div><strong>Pedido nº:</strong> {item.pedido_numero || '—'}</div>
          <div><strong>Pedido data:</strong> {item.pedido_data || '—'}</div>
          <div><strong>Pedido valor:</strong> {item.pedido_valor != null ? `R$ ${Number(item.pedido_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</div>
          <div><strong>Pagamento valor:</strong> {item.pagamento_valor != null ? `R$ ${Number(item.pagamento_valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}</div>
          <div><strong>Pagamento status:</strong> {item.pagamento_status || '—'}</div>
          <div><strong>Pagamento data:</strong> {item.pagamento_data || '—'}</div>
          <div><strong>Pagamento previsão:</strong> {item.pagamento_previsao || '—'}</div>
          <div><strong>NF:</strong> {item.nf || '—'}</div>
          <div><strong>NF nº:</strong> {item.nf_numero || '—'}</div>
          <div><strong>NF emissão:</strong> {item.nf_emissao || '—'}</div>
          <div><strong>NF envio:</strong> {item.nf_envio || '—'}</div>
          <div><strong>Fidelidade:</strong> {item.fidelidade_programa || '—'} {item.fidelidade_status ? `(${item.fidelidade_status})` : ''} {item.fidelidade_status === 'Creditado' && ' ✅'}</div>
        </div>
        {item.observacoes && (
          <p style={{ marginTop: 8, fontSize: 13 }}>
            <strong>Observações:</strong> {item.observacoes}
          </p>
        )}
      </div>
    );
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

        {view === 'menu' && (
          <>
            <h1 style={{ marginBottom: 18 }}>Cobranças</h1>
            <div style={{ display: 'flex', gap: 16 }}>
              <button style={{ width: 'auto', padding: '14px 24px' }} onClick={() => setView('projetos')}>
                Lista por Projeto
              </button>
              <button
                style={{ width: 'auto', padding: '14px 24px', background: 'var(--primary-dark)' }}
                onClick={() => setView('fornecedores')}
              >
                Lista por Fornecedor
              </button>
            </div>
          </>
        )}

        {view === 'projetos' && (
          <>
            <div className="toolbar">
              <h1>Cobranças por Projeto</h1>
              <button className="btn-secondary" onClick={voltarParaMenu}>
                Voltar
              </button>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Nome do projeto</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projetos.map((p) => (
                    <tr key={p.id}>
                      <td>{p.numero_projeto}</td>
                      <td>{p.nome}</td>
                      <td>
                        <button className="btn-editar" onClick={() => abrirProjeto(p)}>
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'fornecedores' && (
          <>
            <div className="toolbar">
              <h1>Cobranças por Fornecedor</h1>
              <button className="btn-secondary" onClick={voltarParaMenu}>
                Voltar
              </button>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fornecedor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedores.map((f) => (
                    <tr key={f.id}>
                      <td>{f.nome}</td>
                      <td>
                        <button className="btn-editar" onClick={() => abrirFornecedor(f)}>
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'projeto' && projetoAtual && (
          <>
            <div className="toolbar">
              <h1>
                {projetoAtual.numero_projeto} - {projetoAtual.nome}
              </h1>
              <button className="btn-secondary" onClick={() => setView('projetos')}>
                Voltar
              </button>
            </div>

            {canEdit && !showForm && (
              <button
                type="button"
                onClick={openNewForm}
                style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
              >
                + Nova cobrança
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
                  <h2>{editingId ? 'Editar cobrança' : 'Nova cobrança'}</h2>
                  <button type="button" className="btn-secondary" onClick={handleCancelar}>
                    Cancelar
                  </button>
                </div>

                {error && <div className="error-box">{error}</div>}

                <div className="form-grid">
                  <div>
                    <label>Cliente / Fornecedor</label>
                    <select
                      value={form.fornecedorSelecao}
                      onChange={(e) => handleFornecedorSelecaoChange(e.target.value)}
                      disabled={!!editingId}
                    >
                      <option value="">Selecione...</option>
                      <option value="Cliente">Cliente</option>
                      {fornecedores.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.fornecedorSelecao && (
                    <div>
                      <label>Categoria</label>
                      <select value={form.categoria} onChange={(e) => updateField('categoria', e.target.value)}>
                        <option value="">Selecione...</option>
                        {categoriaOpcoes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!editingId && (
                    <div>
                      <label>Parcela (quantidade)</label>
                      <input
                        value={form.parcelas}
                        onChange={(e) => updateField('parcelas', e.target.value.replace(/\D/g, '').slice(0, 2))}
                        placeholder="Ex: 3"
                        inputMode="numeric"
                      />
                    </div>
                  )}

                  {!editingId && form.parcelas && (
                    <div>
                      <label>%</label>
                      <input value={`${calcPercentual(parseInt(form.parcelas, 10) || 1)}%`} disabled />
                    </div>
                  )}
                </div>

                <div className="form-section-title">Pedido</div>
                <div className="form-grid">
                  <div>
                    <label>Pedido salvo</label>
                    <select value={form.pedido_salvo} onChange={(e) => updateField('pedido_salvo', e.target.value)}>
                      <option value="">—</option>
                      <option value="sim">Sim</option>
                      <option value="não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label>Número</label>
                    <input value={form.pedido_numero} onChange={(e) => updateField('pedido_numero', e.target.value)} />
                  </div>
                  <div>
                    <label>Data</label>
                    <input
                      value={form.pedido_data}
                      onChange={(e) => updateField('pedido_data', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label>Valor</label>
                    <input
                      value={form.pedido_valor}
                      onChange={(e) => updateField('pedido_valor', sanitizeValorComCentavos(e.target.value))}
                      placeholder="1500 ou 1500,50"
                      inputMode="decimal"
                    />
                    {form.pedido_valor && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                        = {previewValorComCentavos(form.pedido_valor)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-section-title">Pagamento</div>
                <div className="form-grid">
                  <div>
                    <label>Valor</label>
                    <input
                      value={form.pagamento_valor}
                      onChange={(e) => updateField('pagamento_valor', sanitizeValorComCentavos(e.target.value))}
                      placeholder="1500 ou 1500,50"
                      inputMode="decimal"
                    />
                    {form.pagamento_valor && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                        = {previewValorComCentavos(form.pagamento_valor)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={form.pagamento_status}
                      onChange={(e) => updateField('pagamento_status', e.target.value)}
                      style={form.pagamento_status ? statusCor(form.pagamento_status) : {}}
                    >
                      <option value="">Selecione...</option>
                      {PAGAMENTO_STATUS_OPTIONS.map((s) => (
                        <option key={s.codigo} value={s.codigo}>
                          {s.codigo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Data</label>
                    <input
                      value={form.pagamento_data}
                      onChange={(e) => updateField('pagamento_data', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label>Previsão</label>
                    <input
                      value={form.pagamento_previsao}
                      onChange={(e) => updateField('pagamento_previsao', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="form-section-title">Nota Fiscal</div>
                <div className="form-grid">
                  <div>
                    <label>NF</label>
                    <select value={form.nf} onChange={(e) => updateField('nf', e.target.value)}>
                      <option value="">—</option>
                      <option value="sim">Sim</option>
                      <option value="não">Não</option>
                    </select>
                  </div>
                  <div>
                    <label>Número</label>
                    <input
                      value={form.nf_numero}
                      onChange={(e) => updateField('nf_numero', e.target.value)}
                      className={form.nf === 'sim' && !form.nf_numero ? 'field-highlight-red' : ''}
                    />
                  </div>
                  <div>
                    <label>Emissão</label>
                    <input
                      value={form.nf_emissao}
                      onChange={(e) => updateField('nf_emissao', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                      className={form.nf === 'sim' && !form.nf_emissao ? 'field-highlight-red' : ''}
                    />
                  </div>
                  <div>
                    <label>Envio</label>
                    <input
                      value={form.nf_envio}
                      onChange={(e) => updateField('nf_envio', formatDataCurta(e.target.value))}
                      placeholder="DD/MM/AA"
                      inputMode="numeric"
                      className={form.nf === 'sim' && !form.nf_envio ? 'field-highlight-red' : ''}
                    />
                  </div>
                </div>

                <div className="form-section-title">Programa de Fidelidade</div>
                <div className="form-grid">
                  <div>
                    <label>Programa</label>
                    <input
                      value={form.fidelidade_programa}
                      onChange={(e) => updateField('fidelidade_programa', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={form.fidelidade_status}
                      onChange={(e) => updateField('fidelidade_status', e.target.value)}
                      className={form.fidelidade_status === 'Lançar' ? 'field-highlight-amber' : ''}
                    >
                      <option value="">—</option>
                      <option value="Lançar">Lançar</option>
                      <option value="Creditado">Creditado ✅</option>
                    </select>
                  </div>
                </div>

                <div className="form-section-title">Observações</div>
                <div className="form-grid">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input value={form.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
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
              <div>
                {cobrancas.length === 0 ? (
                  <p className="empty-hint">Nenhuma cobrança cadastrada neste projeto.</p>
                ) : (
                  cobrancas.map((item) => <CobrancaBox key={item.id} item={item} mostrarFornecedorInfo />)
                )}
              </div>
            )}
          </>
        )}

        {view === 'fornecedor' && fornecedorAtual && (
          <>
            <div className="toolbar">
              <h1>{fornecedorAtual.nome}</h1>
              <button className="btn-secondary" onClick={() => setView('fornecedores')}>
                Voltar
              </button>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
              {fornecedorAtual.vendedor ? `Vendedor: ${fornecedorAtual.vendedor}` : ''}
              {fornecedorAtual.telefone_vendedor ? ` (${fornecedorAtual.telefone_vendedor})` : ''}
              {fornecedorAtual.financeiro ? ` · Financeiro: ${fornecedorAtual.financeiro}` : ''}
              {fornecedorAtual.telefone_financeiro ? ` (${fornecedorAtual.telefone_financeiro})` : ''}
            </p>

            {cobrancas.length === 0 ? (
              <p className="empty-hint">Nenhuma cobrança cadastrada com este fornecedor.</p>
            ) : (
              cobrancas.map((item) => <CobrancaBox key={item.id} item={item} mostrarFornecedorInfo={false} />)
            )}
          </>
        )}

        <Rodape />
      </div>
    </div>
  );
}
