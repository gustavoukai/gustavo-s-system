import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import { formatCPF, formatCNPJ, formatPhone } from '../lib/masks';
import { generateFornecedorPdfBlob } from '../lib/fornecedorSnapshot';

const CATEGORIAS = [
  'Ar Condicionado',
  'Empreiteiro',
  'Marmoraria',
  'Mobiliário',
  'Planejados',
  'Produção',
  'Snooker e Jogos',
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

// Lista ainda não enviada pelo cliente — adicionar aqui quando ele mandar a lista completa.
const PROGRAMAS_FIDELIDADE = [];

const STATUS_OPTIONS = [
  { codigo: 'AP', texto: 'OK, ALTO PADRÃO', cor: '#0d4d2e', corTexto: '#ffffff' },
  { codigo: 'MP', texto: 'OK, MÉDIO PADRÃO', cor: '#a8d8a8', corTexto: '#16211d' },
  { codigo: 'R', texto: 'ORÇAR COM RESSALVAS', cor: '#f3e6a3', corTexto: '#16211d' },
  { codigo: 'X', texto: 'NÃO ORÇAR', cor: '#f3c9c9', corTexto: '#16211d' },
  { codigo: 'NE', texto: 'FORNECEDOR NÃO EXISTE MAIS', cor: '#d9c6ee', corTexto: '#16211d' },
];

const emptyForm = {
  nome: '',
  status: '',
  cpf: '',
  cnpj: '',
  razao_social: '',
  vendedor: '',
  telefone_vendedor: '',
  financeiro: '',
  telefone_financeiro: '',
  nf: '',
  banco: '',
  agencia: '',
  conta: '',
  nomenclatura_bancaria: '',
  observacoes: '',
};

export default function Fornecedores() {
  const { loading, canEdit, canDelete } = useAuth();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categorias, setCategorias] = useState([]);
  const [programasFidelidade, setProgramasFidelidade] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroFidelidade, setFiltroFidelidade] = useState('Todos');

  async function loadItems() {
    const { data } = await supabase.from('fornecedores').select('*').order('nome');
    setItems(data || []);
  }

  useEffect(() => {
    if (!loading) loadItems();
  }, [loading]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategoria(categoria) {
    setCategorias((prev) =>
      prev.includes(categoria) ? prev.filter((c) => c !== categoria) : [...prev, categoria]
    );
  }

  function toggleFidelidade(programa) {
    setProgramasFidelidade((prev) =>
      prev.includes(programa) ? prev.filter((p) => p !== programa) : [...prev, programa]
    );
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setCategorias([]);
    setProgramasFidelidade([]);
    setError('');
    setShowForm(true);
  }

  function openEditForm(item) {
    const formData = { ...emptyForm };
    Object.keys(emptyForm).forEach((key) => {
      if (item[key] !== undefined && item[key] !== null) {
        formData[key] = item[key];
      }
    });
    setForm(formData);
    setCategorias(Array.isArray(item.categorias) ? item.categorias : []);
    setProgramasFidelidade(Array.isArray(item.programas_fidelidade) ? item.programas_fidelidade : []);
    setEditingId(item.id);
    setError('');
    setShowForm(true);
  }

  function handleCancelar() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCategorias([]);
    setProgramasFidelidade([]);
    setError('');
  }

  function handleLimpar() {
    if (!confirm('Tem certeza que quer limpar todas as informações inseridas?')) return;
    setForm(emptyForm);
    setCategorias([]);
    setProgramasFidelidade([]);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nome.trim() || categorias.length === 0 || !form.telefone_vendedor.trim()) {
      setError('Preencha os campos obrigatórios: Fornecedor, Categoria e Telefone do vendedor.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      categorias,
      programas_fidelidade: programasFidelidade,
      atualizado_em: new Date().toISOString(),
    };

    let fornecedorId = editingId;

    if (editingId) {
      const { error: updateError } = await supabase.from('fornecedores').update(payload).eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError('Não foi possível salvar o fornecedor. Tente novamente.');
        return;
      }
    } else {
      const { data: novoFornecedor, error: insertError } = await supabase
        .from('fornecedores')
        .insert([payload])
        .select()
        .single();
      if (insertError || !novoFornecedor) {
        setSaving(false);
        setError('Não foi possível salvar o fornecedor. Tente novamente.');
        return;
      }
      fornecedorId = novoFornecedor.id;
    }

    try {
      const statusLabel = STATUS_OPTIONS.find((s) => s.codigo === payload.status)?.texto;
      const pdfBlob = generateFornecedorPdfBlob(payload, statusLabel);
      await supabase.storage
        .from('backups-fornecedores')
        .upload(`${fornecedorId}.pdf`, pdfBlob, { contentType: 'application/pdf', upsert: true });
    } catch (snapshotError) {
      // Backup é só uma cópia extra; se falhar, não impede o cadastro principal.
    }

    setSaving(false);
    handleCancelar();
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este fornecedor?')) return;
    await supabase.from('fornecedores').delete().eq('id', id);
    loadItems();
  }

  function formatData(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statusStyle(codigo) {
    const opcao = STATUS_OPTIONS.find((s) => s.codigo === codigo);
    if (!opcao) return {};
    return { backgroundColor: opcao.cor, color: opcao.corTexto };
  }

  const statusSelecionado = STATUS_OPTIONS.find((s) => s.codigo === form.status);

  const itemsFiltrados = items.filter((item) => {
    if (filtroCategoria !== 'Todos' && !(item.categorias || []).includes(filtroCategoria)) return false;
    if (filtroFidelidade !== 'Todos' && !(item.programas_fidelidade || []).includes(filtroFidelidade))
      return false;
    if (busca.trim()) {
      const alvo = [
        item.nome,
        item.razao_social,
        item.vendedor,
        item.telefone_vendedor,
        item.financeiro,
        item.telefone_financeiro,
        item.cpf,
        item.cnpj,
        item.banco,
        item.agencia,
        item.conta,
        item.nomenclatura_bancaria,
        item.observacoes,
        ...(item.categorias || []),
        ...(item.programas_fidelidade || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!alvo.includes(busca.trim().toLowerCase())) return false;
    }
    return true;
  });

  function limparFiltros() {
    setBusca('');
    setFiltroCategoria('Todos');
    setFiltroFidelidade('Todos');
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

        <h1 style={{ marginBottom: 18 }}>Fornecedores</h1>

        {canEdit && !showForm && (
          <button
            type="button"
            onClick={openNewForm}
            style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
          >
            + Novo Fornecedor
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
              <h2>{editingId ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
              <button type="button" className="btn-secondary" onClick={handleCancelar}>
                Cancelar
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="form-section-title">Dados do fornecedor</div>
            <div className="form-grid" style={{ marginBottom: 0 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>
                  Fornecedor (Empresa/Loja/Profissional) <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                    (campo obrigatório)
                  </span>
                </label>
                <input required value={form.nome} onChange={(e) => updateField('nome', e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <label>
                Categoria <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                  (campo obrigatório — selecione uma ou mais)
                </span>
              </label>
              <div className="checkbox-group">
                {CATEGORIAS.map((cat) => (
                  <label key={cat} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={categorias.includes(cat)}
                      onChange={() => toggleCategoria(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                style={statusSelecionado ? statusStyle(statusSelecionado.codigo) : {}}
              >
                <option value="">Selecione...</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.codigo} value={s.codigo}>
                    {s.codigo}
                  </option>
                ))}
              </select>
              {statusSelecionado && (
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -12, marginBottom: 18 }}>
                  {statusSelecionado.texto}
                </p>
              )}
            </div>

            <div className="form-grid">
              <div>
                <label>CPF</label>
                <input
                  value={form.cpf}
                  onChange={(e) => updateField('cpf', formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>CNPJ</label>
                <input
                  value={form.cnpj}
                  onChange={(e) => updateField('cnpj', formatCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>Razão Social</label>
                <input
                  value={form.razao_social}
                  onChange={(e) => updateField('razao_social', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">Vendedor</div>
            <div className="form-grid">
              <div>
                <label>Vendedor</label>
                <input value={form.vendedor} onChange={(e) => updateField('vendedor', e.target.value)} />
              </div>
              <div>
                <label>
                  Telefone <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                    (campo obrigatório)
                  </span>
                </label>
                <input
                  required
                  value={form.telefone_vendedor}
                  onChange={(e) => updateField('telefone_vendedor', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="form-section-title">Financeiro</div>
            <div className="form-grid">
              <div>
                <label>Financeiro</label>
                <input value={form.financeiro} onChange={(e) => updateField('financeiro', e.target.value)} />
              </div>
              <div>
                <label>Telefone</label>
                <input
                  value={form.telefone_financeiro}
                  onChange={(e) => updateField('telefone_financeiro', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="form-section-title">Outras informações</div>
            <div style={{ marginBottom: 18 }}>
              <label>NF</label>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="radio"
                    name="nf"
                    checked={form.nf === 'sim'}
                    onChange={() => updateField('nf', 'sim')}
                  />
                  Sim
                </label>
                <label className="checkbox-item">
                  <input
                    type="radio"
                    name="nf"
                    checked={form.nf === 'nao'}
                    onChange={() => updateField('nf', 'nao')}
                  />
                  Não
                </label>
              </div>
            </div>

            <div>
              <label>Programa de Fidelidade</label>
              {PROGRAMAS_FIDELIDADE.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Aguardando a lista de programas de fidelidade para carregar aqui.
                </p>
              ) : (
                <div className="checkbox-group">
                  {PROGRAMAS_FIDELIDADE.map((programa) => (
                    <label key={programa} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={programasFidelidade.includes(programa)}
                        onChange={() => toggleFidelidade(programa)}
                      />
                      {programa}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section-title">Dados bancários</div>
            <div className="form-grid">
              <div>
                <label>Banco</label>
                <input value={form.banco} onChange={(e) => updateField('banco', e.target.value)} />
              </div>
              <div>
                <label>Agência</label>
                <input value={form.agencia} onChange={(e) => updateField('agencia', e.target.value)} />
              </div>
              <div>
                <label>Conta</label>
                <input value={form.conta} onChange={(e) => updateField('conta', e.target.value)} />
              </div>
              <div>
                <label>Nomenclatura Bancária</label>
                <input
                  value={form.nomenclatura_bancaria}
                  onChange={(e) => updateField('nomenclatura_bancaria', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">Observações</div>
            <div className="form-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Observações</label>
                <input
                  value={form.observacoes}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar fornecedor'}
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
          <>
            <div className="filters-bar">
              <div>
                <label>Buscar</label>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Nome, vendedor, financeiro, CPF, CNPJ..."
                />
              </div>
              <div>
                <label>Categoria</label>
                <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Programa de fidelidade</label>
                <select value={filtroFidelidade} onChange={(e) => setFiltroFidelidade(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {PROGRAMAS_FIDELIDADE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={limparFiltros}>
                  Todos
                </button>
              </div>
            </div>

            <div className="data-table-wrap">
              {itemsFiltrados.length === 0 ? (
                <p className="empty-hint">Nenhum fornecedor encontrado.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fornecedor</th>
                      <th>Vendedor</th>
                      <th>Financeiro</th>
                      <th>Cadastrado/editado em</th>
                      {canEdit && <th></th>}
                      {canDelete && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {itemsFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td>{item.nome}</td>
                        <td>
                          {item.vendedor || '—'}
                          {item.telefone_vendedor ? ` — ${item.telefone_vendedor}` : ''}
                        </td>
                        <td>
                          {item.financeiro || '—'}
                          {item.telefone_financeiro ? ` — ${item.telefone_financeiro}` : ''}
                        </td>
                        <td>{formatData(item.atualizado_em || item.created_at)}</td>
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
          </>
        )}
      </div>
    </div>
  );
}
