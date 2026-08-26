import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import { formatCPF, formatCNPJ, formatPhone } from '../lib/masks';
import { generateFornecedorPdfBlob } from '../lib/fornecedorSnapshot';
import MultiSelectDropdown from '../components/MultiSelectDropdown';

const CATEGORIAS = [
  'Acabamentos',
  'Acabamentos Elétricos',
  'Adegas',
  'Ar Condicionado',
  'Assessoria Execução de Obra - Cliente',
  'Áudio e Vídeo',
  'Automação',
  'Banho e Restauração',
  'Caixilhos',
  'Camas e Colchões',
  'Carpetes',
  'Churrasqueiras',
  'Coberturas metálicas',
  'Colocador Bloquete',
  'Colocador Papel de Parede',
  'Colocador Vinílico',
  'Construtora',
  'Cortinas',
  'Diversos',
  'Eletricista',
  'Eletros',
  'Eletrotécnico',
  'Empreiteiro',
  'Engenheiro Elétrico',
  'Estruturas Metálicas',
  'Fechamentos de Vidro',
  'Ferragens',
  'Galeria de Arte',
  'Içamento',
  'Iluminação',
  'Instalação Eletros',
  'Lareiras',
  'Limpeza Pós-obra',
  'Louças e Metais',
  'Marcenaria',
  'Marmoraria',
  'Mobiliário',
  'Mobiliário Corporativo',
  'Molduras Cimentícias',
  'Paisagismo',
  'Paisagista',
  'Papel de Parede',
  'Persianas',
  'Pintura',
  'Pintura Especial',
  'Piso de Madeira',
  'Piso Vinílico',
  'Planejados',
  'Polimento',
  'Poltronas Cinema',
  'Portas',
  'Portas Automáticas',
  'Produção',
  'Projeto – Cliente',
  'Quadros e Molduras',
  'Rede de Proteção',
  'Reembolso - Cliente',
  'Revestimentos',
  'Serralheria',
  'Sistemas de Aquecimento',
  'Snooker e Jogos',
  'Tapeçaria',
  'Tapetes',
  'Tecidos',
  'Telefonia e Internet',
  'Tintas',
  'Vidraçaria',
  'Energia Solar',
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

// Programa de Fidelidade: seleção múltipla, ou nenhum, se o fornecedor não participar.
const PROGRAMAS_FIDELIDADE = [
  'Gabriel PRO',
  'We.Brasil',
  'Club&Casa',
  'ID - D&D',
  'Fast Shop Pro',
  'Telhanorte Pro',
  'Dexco',
  'Hunter Douglas',
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const STATUS_OPTIONS = [
  { codigo: 'AP', texto: 'OK, ALTO PADRÃO', cor: '#0d4d2e', corTexto: '#ffffff' },
  { codigo: 'MP', texto: 'OK, MÉDIO PADRÃO', cor: '#a8d8a8', corTexto: '#16211d' },
  { codigo: 'R', texto: 'ORÇAR COM RESSALVAS', cor: '#f3e6a3', corTexto: '#16211d' },
  { codigo: 'X', texto: 'NÃO ORÇAR', cor: '#f3c9c9', corTexto: '#16211d' },
  { codigo: 'NE', texto: 'FORNECEDOR NÃO EXISTE MAIS', cor: '#d9c6ee', corTexto: '#16211d' },
  { codigo: 'NU', texto: 'NUNCA UTILIZADO', cor: '#f7d2ab', corTexto: '#5a3a12' },
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
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [categorias, setCategorias] = useState([]);
  const [programasFidelidade, setProgramasFidelidade] = useState([]);
  const [trabalhouEm, setTrabalhouEm] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroFidelidade, setFiltroFidelidade] = useState('Todos');

  async function loadItems() {
    const { data } = await supabase.from('fornecedores').select('*').order('nome');
    setItems(data || []);
  }

  async function loadProjetos() {
    const { data } = await supabase.from('projetos').select('id, numero_projeto, nome');
    const ordenados = (data || []).sort(
      (a, b) => Number(b.numero_projeto || 0) - Number(a.numero_projeto || 0)
    );
    setProjetos(ordenados);
  }

  useEffect(() => {
    if (!loading) {
      loadItems();
      loadProjetos();
    }
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
    setTrabalhouEm([]);
    setError('');
    setReadOnly(false);
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
    setTrabalhouEm(Array.isArray(item.trabalhou_em) ? item.trabalhou_em : []);
    setEditingId(item.id);
    setError('');
    setReadOnly(false);
    setShowForm(true);
  }

  function openViewForm(item) {
    openEditForm(item);
    setReadOnly(true);
  }

  function handleCancelar() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setCategorias([]);
    setProgramasFidelidade([]);
    setTrabalhouEm([]);
    setError('');
    setReadOnly(false);
  }

  function handleLimpar() {
    if (!confirm('Tem certeza que quer limpar todas as informações inseridas?')) return;
    setForm(emptyForm);
    setCategorias([]);
    setProgramasFidelidade([]);
    setTrabalhouEm([]);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nome.trim() || categorias.length === 0) {
      setError('Preencha os campos obrigatórios: Fornecedor e Categoria.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      categorias,
      programas_fidelidade: programasFidelidade,
      trabalhou_em: trabalhouEm,
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
      const projetosTrabalhados = projetos.filter((p) => trabalhouEm.includes(p.id));
      const pdfBlob = generateFornecedorPdfBlob(payload, statusLabel, projetosTrabalhados);
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

  function renderStatusIcon(codigo) {
    const label = STATUS_OPTIONS.find((s) => s.codigo === codigo)?.texto;

    if (codigo === 'AP') {
      return (
        <span className="status-icon" title={label} style={{ backgroundColor: '#1e6b3a', color: '#ffffff' }}>
          ✓
        </span>
      );
    }
    if (codigo === 'MP') {
      return (
        <span className="status-icon" title={label} style={{ backgroundColor: '#a8d8a8', color: '#16211d' }}>
          ✓
        </span>
      );
    }
    if (codigo === 'R') {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" title={label} style={{ flexShrink: 0 }}>
          <polygon points="10,2 18.5,17 1.5,17" fill="#e8b93a" />
          <text x="10" y="15.5" fontSize="10" fontWeight="700" fill="#4a3a06" textAnchor="middle">
            !
          </text>
        </svg>
      );
    }
    if (codigo === 'X' || codigo === 'NE') {
      return (
        <span className="status-icon" title={label} style={{ backgroundColor: '#a03b3b', color: '#ffffff' }}>
          ✕
        </span>
      );
    }
    if (codigo === 'NU') {
      return (
        <span className="status-icon" title={label} style={{ backgroundColor: '#e8821e', color: '#ffffff' }}>
          ?
        </span>
      );
    }
    return null;
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
              <h2>{editingId ? (readOnly ? 'Visualizar fornecedor' : 'Editar fornecedor') : 'Novo fornecedor'}</h2>
              <button type="button" className="btn-secondary" onClick={handleCancelar}>
                {readOnly ? 'Fechar' : 'Cancelar'}
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
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
              <MultiSelectDropdown
                options={CATEGORIAS.map((cat) => ({ value: cat, label: cat }))}
                selected={categorias}
                onToggle={toggleCategoria}
                placeholder="Selecione as categorias..."
                searchable
              />
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
                    {s.codigo}: {s.texto}
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
                <label>Telefone</label>
                <input
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
              <label>Exige emissão de NF?</label>
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
              <MultiSelectDropdown
                options={PROGRAMAS_FIDELIDADE.map((p) => ({ value: p, label: p }))}
                selected={programasFidelidade}
                onToggle={toggleFidelidade}
                placeholder="Selecione os programas de fidelidade..."
              />
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

            <div className="form-section-title">Trabalhou em</div>
            <MultiSelectDropdown
              options={projetos.map((proj) => ({
                value: proj.id,
                label: `${proj.numero_projeto} - ${proj.nome}`,
              }))}
              selected={trabalhouEm}
              onToggle={(id) =>
                setTrabalhouEm((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
              }
              placeholder="Selecione os projetos..."
            />

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
            </fieldset>

            {!readOnly && (
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
            )}
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

            <div className="section-card">
              <h2 style={{ marginBottom: 10 }}>Legenda de status</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                {STATUS_OPTIONS.map((s) => (
                  <div key={s.codigo} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    {renderStatusIcon(s.codigo)}
                    <span>
                      <strong>{s.codigo}</strong> — {s.texto}
                    </span>
                  </div>
                ))}
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
                      <th></th>
                      <th>Vendedor</th>
                      <th>Financeiro</th>
                      <th>Cadastrado/editado em</th>
                      <th></th>
                      {canEdit && <th></th>}
                      {canDelete && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {itemsFiltrados.map((item) => (
                      <tr key={item.id}>
                        <td>{item.nome}</td>
                        <td>{renderStatusIcon(item.status)}</td>
                        <td>
                          {item.vendedor || '—'}
                          {item.telefone_vendedor ? ` — ${item.telefone_vendedor}` : ''}
                        </td>
                        <td>
                          {item.financeiro || '—'}
                          {item.telefone_financeiro ? ` — ${item.telefone_financeiro}` : ''}
                        </td>
                        <td>{formatData(item.atualizado_em || item.created_at)}</td>
                        <td>
                          <button className="btn-secondary table-action-btn" onClick={() => openViewForm(item)}>
                            Visualizar
                          </button>
                        </td>
                        {canEdit && (
                          <td>
                            <button className="btn-editar table-action-btn" onClick={() => openEditForm(item)}>
                              EDITAR
                            </button>
                          </td>
                        )}
                        {canDelete && (
                          <td>
                            <button className="delete-link table-action-btn" onClick={() => handleDelete(item.id)}>
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

        <Rodape />
      </div>
    </div>
  );
}
