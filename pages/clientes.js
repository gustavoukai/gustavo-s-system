import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import { formatCPF, formatRG, formatPhone, formatCEP, onlyDigits, buscarEnderecoPorCep } from '../lib/masks';

const emptyForm = {
  nome: '',
  cpf: '',
  rg: '',
  data_nascimento: '',
  celular1: '',
  celular2: '',
  email: '',
  instagram: '',
  profissao: '',
  cep_residencial: '',
  logradouro_residencial: '',
  numero_residencial: '',
  complemento_residencial: '',
  bairro_residencial: '',
  cidade_residencial: '',
  uf_residencial: '',
  empresa: '',
  email_comercial: '',
  contato_comercial: '',
  telefone_comercial: '',
  cep_comercial: '',
  logradouro_comercial: '',
  numero_comercial: '',
  complemento_comercial: '',
  bairro_comercial: '',
  cidade_comercial: '',
  uf_comercial: '',
  conjuge_nome: '',
  conjuge_data_nascimento: '',
  conjuge_rg: '',
  conjuge_cpf: '',
  conjuge_celular1: '',
  conjuge_celular2: '',
  conjuge_email: '',
  conjuge_instagram: '',
  conjuge_profissao: '',
  conjuge_cep_residencial: '',
  conjuge_logradouro_residencial: '',
  conjuge_numero_residencial: '',
  conjuge_complemento_residencial: '',
  conjuge_bairro_residencial: '',
  conjuge_cidade_residencial: '',
  conjuge_uf_residencial: '',
  conjuge_empresa: '',
  conjuge_email_comercial: '',
  conjuge_contato_comercial: '',
  conjuge_cep_comercial: '',
  conjuge_logradouro_comercial: '',
  conjuge_numero_comercial: '',
  conjuge_complemento_comercial: '',
  conjuge_bairro_comercial: '',
  conjuge_cidade_comercial: '',
  conjuge_uf_comercial: '',
  observacoes: '',
};

const emptyProjetoVinculado = {
  projeto_id: '',
  cep_obra: '',
  logradouro_obra: '',
  numero_obra: '',
  complemento_obra: '',
  bairro_obra: '',
  cidade_obra: '',
  uf_obra: '',
};

export default function Clientes() {
  const { loading, canEdit, canDelete } = useAuth();
  const [items, setItems] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filhos, setFilhos] = useState([]);
  const [projetosVinculados, setProjetosVinculados] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadItems() {
    const { data } = await supabase
      .from('clientes')
      .select('*, cliente_projetos(*, projetos(nome))')
      .order('nome');
    setItems(data || []);
  }

  async function loadProjetos() {
    const { data } = await supabase.from('projetos').select('id, nome').order('nome');
    setProjetos(data || []);
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

  function updateMaskedField(field, rawValue, maskFn) {
    updateField(field, maskFn(rawValue));
  }

  function handleCepChange(rawValue, cepField, relatedFields) {
    updateField(cepField, formatCEP(rawValue));
    if (onlyDigits(rawValue).length === 0) {
      setForm((prev) => ({
        ...prev,
        [relatedFields.logradouro]: '',
        [relatedFields.bairro]: '',
        [relatedFields.cidade]: '',
        [relatedFields.uf]: '',
      }));
    }
  }

  async function autofillCep(cepValue, fields) {
    const endereco = await buscarEnderecoPorCep(cepValue);
    if (!endereco) return;
    setForm((prev) => ({
      ...prev,
      [fields.logradouro]: endereco.logradouro || prev[fields.logradouro],
      [fields.bairro]: endereco.bairro || prev[fields.bairro],
      [fields.cidade]: endereco.cidade || prev[fields.cidade],
      [fields.uf]: endereco.uf || prev[fields.uf],
    }));
  }

  function addFilho() {
    setFilhos([...filhos, { nome: '', data_nascimento: '' }]);
  }

  function updateFilho(index, field, value) {
    const updated = [...filhos];
    updated[index] = { ...updated[index], [field]: value };
    setFilhos(updated);
  }

  function removeFilho(index) {
    setFilhos(filhos.filter((_, i) => i !== index));
  }

  function addProjetoVinculado() {
    setProjetosVinculados([...projetosVinculados, { ...emptyProjetoVinculado }]);
  }

  function updateProjetoVinculado(index, field, value) {
    const updated = [...projetosVinculados];
    updated[index] = { ...updated[index], [field]: value };
    setProjetosVinculados(updated);
  }

  function handleCepChangeProjeto(index, rawValue) {
    updateProjetoVinculado(index, 'cep_obra', formatCEP(rawValue));
    if (onlyDigits(rawValue).length === 0) {
      setProjetosVinculados((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          logradouro_obra: '',
          bairro_obra: '',
          cidade_obra: '',
          uf_obra: '',
        };
        return updated;
      });
    }
  }

  async function autofillCepProjeto(index, cepValue) {
    const endereco = await buscarEnderecoPorCep(cepValue);
    if (!endereco) return;
    setProjetosVinculados((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        logradouro_obra: endereco.logradouro || updated[index].logradouro_obra,
        bairro_obra: endereco.bairro || updated[index].bairro_obra,
        cidade_obra: endereco.cidade || updated[index].cidade_obra,
        uf_obra: endereco.uf || updated[index].uf_obra,
      };
      return updated;
    });
  }

  function removeProjetoVinculado(index) {
    setProjetosVinculados(projetosVinculados.filter((_, i) => i !== index));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFilhos([]);
    setProjetosVinculados([]);
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
    setFilhos(Array.isArray(item.filhos) ? item.filhos : []);
    setProjetosVinculados(
      (item.cliente_projetos || []).map((cp) => ({
        projeto_id: cp.projeto_id || '',
        cep_obra: cp.cep_obra || '',
        logradouro_obra: cp.logradouro_obra || '',
        numero_obra: cp.numero_obra || '',
        complemento_obra: cp.complemento_obra || '',
        bairro_obra: cp.bairro_obra || '',
        cidade_obra: cp.cidade_obra || '',
        uf_obra: cp.uf_obra || '',
      }))
    );
    setEditingId(item.id);
    setError('');
    setShowForm(true);
  }

  function handleCancelar() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFilhos([]);
    setProjetosVinculados([]);
    setError('');
  }

  function handleLimpar() {
    if (!confirm('Tem certeza que quer limpar todos inseridos?')) return;
    setForm(emptyForm);
    setFilhos([]);
    setProjetosVinculados([]);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.nome.trim() || !form.celular1.trim()) {
      setError('Preencha os campos obrigatórios: Nome e Celular 1.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      data_nascimento: form.data_nascimento || null,
      conjuge_data_nascimento: form.conjuge_data_nascimento || null,
      filhos,
      atualizado_em: new Date().toISOString(),
    };

    const vinculosValidos = projetosVinculados.filter((p) => p.projeto_id);
    let clienteId = editingId;

    if (editingId) {
      const { error: updateError } = await supabase.from('clientes').update(payload).eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError('Não foi possível salvar o cliente. Tente novamente.');
        return;
      }
      await supabase.from('cliente_projetos').delete().eq('cliente_id', editingId);
    } else {
      const { data: novoCliente, error: insertError } = await supabase
        .from('clientes')
        .insert([payload])
        .select()
        .single();

      if (insertError || !novoCliente) {
        setSaving(false);
        setError('Não foi possível salvar o cliente. Tente novamente.');
        return;
      }
      clienteId = novoCliente.id;
    }

    if (vinculosValidos.length > 0) {
      const vinculosPayload = vinculosValidos.map((p) => ({ ...p, cliente_id: clienteId }));
      await supabase.from('cliente_projetos').insert(vinculosPayload);
    }

    setSaving(false);
    handleCancelar();
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este cliente e todos os vínculos de projeto dele?')) return;
    await supabase.from('clientes').delete().eq('id', id);
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

        <h1 style={{ marginBottom: 18 }}>Clientes</h1>

        {canEdit && !showForm && (
          <button
            type="button"
            onClick={openNewForm}
            style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
          >
            + Novo cliente
          </button>
        )}

        {canEdit && showForm && (
          <form className="section-card" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
            <div className="toolbar" style={{ marginBottom: 4 }}>
              <h2>{editingId ? 'Editar cliente' : 'Novo cliente'}</h2>
              <button type="button" className="btn-secondary" onClick={handleCancelar}>
                Cancelar
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            {/* PROJETOS VINCULADOS */}
            <div className="form-section-title">Projetos vinculados</div>
            {projetosVinculados.map((p, index) => (
              <div className="repeatable-block" key={index}>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeProjetoVinculado(index)}
                >
                  Remover
                </button>
                <div className="form-grid">
                  <div>
                    <label>Projeto</label>
                    <select
                      value={p.projeto_id}
                      onChange={(e) => updateProjetoVinculado(index, 'projeto_id', e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {projetos.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-section-title" style={{ fontSize: 11 }}>
                  Endereço da obra
                </div>
                <div className="form-grid">
                  <div>
                    <label>CEP</label>
                    <input
                      value={p.cep_obra}
                      onChange={(e) => handleCepChangeProjeto(index, e.target.value)}
                      onBlur={(e) => autofillCepProjeto(index, e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <label>Logradouro</label>
                    <input
                      value={p.logradouro_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'logradouro_obra', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Número</label>
                    <input
                      value={p.numero_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'numero_obra', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Complemento</label>
                    <input
                      value={p.complemento_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'complemento_obra', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Bairro</label>
                    <input
                      value={p.bairro_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'bairro_obra', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Cidade</label>
                    <input
                      value={p.cidade_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'cidade_obra', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>UF</label>
                    <input
                      value={p.uf_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'uf_obra', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addProjetoVinculado}>
              + Adicionar projeto
            </button>

            {/* NOME (linha inteira) */}
            <div className="form-section-title">Dados do cliente</div>
            <div className="form-grid" style={{ marginBottom: 0 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>
                  Nome <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                    (campo obrigatório)
                  </span>
                </label>
                <input required value={form.nome} onChange={(e) => updateField('nome', e.target.value)} />
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label>CPF</label>
                <input
                  value={form.cpf}
                  onChange={(e) => updateMaskedField('cpf', e.target.value, formatCPF)}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>RG</label>
                <input
                  value={form.rg}
                  onChange={(e) => updateMaskedField('rg', e.target.value, formatRG)}
                  placeholder="00.000.000-0"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>Data de nascimento</label>
                <input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => updateField('data_nascimento', e.target.value)}
                />
              </div>
              <div>
                <label>
                  Celular 1 <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                    (campo obrigatório)
                  </span>
                </label>
                <input
                  required
                  value={form.celular1}
                  onChange={(e) => updateMaskedField('celular1', e.target.value, formatPhone)}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>Celular 2</label>
                <input
                  value={form.celular2}
                  onChange={(e) => updateMaskedField('celular2', e.target.value, formatPhone)}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>E-mail</label>
                <input value={form.email} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div>
                <label>Instagram</label>
                <input value={form.instagram} onChange={(e) => updateField('instagram', e.target.value)} />
              </div>
              <div>
                <label>Profissão</label>
                <input value={form.profissao} onChange={(e) => updateField('profissao', e.target.value)} />
              </div>
            </div>

            {/* ENDEREÇO RESIDENCIAL */}
            <div className="form-section-title">Endereço residencial</div>
            <div className="form-grid">
              <div>
                <label>CEP</label>
                <input
                  value={form.cep_residencial}
                  onChange={(e) =>
                    handleCepChange(e.target.value, 'cep_residencial', {
                      logradouro: 'logradouro_residencial',
                      bairro: 'bairro_residencial',
                      cidade: 'cidade_residencial',
                      uf: 'uf_residencial',
                    })
                  }
                  onBlur={(e) =>
                    autofillCep(e.target.value, {
                      logradouro: 'logradouro_residencial',
                      bairro: 'bairro_residencial',
                      cidade: 'cidade_residencial',
                      uf: 'uf_residencial',
                    })
                  }
                  placeholder="00000-000"
                />
              </div>
              <div>
                <label>Logradouro</label>
                <input
                  value={form.logradouro_residencial}
                  onChange={(e) => updateField('logradouro_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Número</label>
                <input
                  value={form.numero_residencial}
                  onChange={(e) => updateField('numero_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Complemento</label>
                <input
                  value={form.complemento_residencial}
                  onChange={(e) => updateField('complemento_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Bairro</label>
                <input
                  value={form.bairro_residencial}
                  onChange={(e) => updateField('bairro_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Cidade</label>
                <input
                  value={form.cidade_residencial}
                  onChange={(e) => updateField('cidade_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>UF</label>
                <input
                  value={form.uf_residencial}
                  onChange={(e) => updateField('uf_residencial', e.target.value)}
                />
              </div>
            </div>

            {/* DADOS COMERCIAIS */}
            <div className="form-section-title">Dados comerciais</div>
            <div className="form-grid">
              <div>
                <label>Empresa</label>
                <input value={form.empresa} onChange={(e) => updateField('empresa', e.target.value)} />
              </div>
              <div>
                <label>E-mail comercial</label>
                <input
                  value={form.email_comercial}
                  onChange={(e) => updateField('email_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Telefone</label>
                <input
                  value={form.telefone_comercial}
                  onChange={(e) => updateMaskedField('telefone_comercial', e.target.value, formatPhone)}
                  placeholder="(00) 0000-0000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>Contato</label>
                <input
                  value={form.contato_comercial}
                  onChange={(e) => updateField('contato_comercial', e.target.value)}
                />
              </div>
            </div>

            {/* ENDEREÇO COMERCIAL */}
            <div className="form-section-title">Endereço comercial</div>
            <div className="form-grid">
              <div>
                <label>CEP</label>
                <input
                  value={form.cep_comercial}
                  onChange={(e) =>
                    handleCepChange(e.target.value, 'cep_comercial', {
                      logradouro: 'logradouro_comercial',
                      bairro: 'bairro_comercial',
                      cidade: 'cidade_comercial',
                      uf: 'uf_comercial',
                    })
                  }
                  onBlur={(e) =>
                    autofillCep(e.target.value, {
                      logradouro: 'logradouro_comercial',
                      bairro: 'bairro_comercial',
                      cidade: 'cidade_comercial',
                      uf: 'uf_comercial',
                    })
                  }
                  placeholder="00000-000"
                />
              </div>
              <div>
                <label>Logradouro</label>
                <input
                  value={form.logradouro_comercial}
                  onChange={(e) => updateField('logradouro_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Número</label>
                <input
                  value={form.numero_comercial}
                  onChange={(e) => updateField('numero_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Complemento</label>
                <input
                  value={form.complemento_comercial}
                  onChange={(e) => updateField('complemento_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Bairro</label>
                <input
                  value={form.bairro_comercial}
                  onChange={(e) => updateField('bairro_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Cidade</label>
                <input
                  value={form.cidade_comercial}
                  onChange={(e) => updateField('cidade_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>UF</label>
                <input
                  value={form.uf_comercial}
                  onChange={(e) => updateField('uf_comercial', e.target.value)}
                />
              </div>
            </div>

            {/* CÔNJUGE */}
            <div className="form-section-title">Dados do cônjuge</div>
            <div className="form-grid">
              <div>
                <label>Nome do cônjuge</label>
                <input
                  value={form.conjuge_nome}
                  onChange={(e) => updateField('conjuge_nome', e.target.value)}
                />
              </div>
              <div>
                <label>CPF</label>
                <input
                  value={form.conjuge_cpf}
                  onChange={(e) => updateMaskedField('conjuge_cpf', e.target.value, formatCPF)}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>RG</label>
                <input
                  value={form.conjuge_rg}
                  onChange={(e) => updateMaskedField('conjuge_rg', e.target.value, formatRG)}
                  placeholder="00.000.000-0"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>Data de nascimento</label>
                <input
                  type="date"
                  value={form.conjuge_data_nascimento}
                  onChange={(e) => updateField('conjuge_data_nascimento', e.target.value)}
                />
              </div>
              <div>
                <label>Celular 1</label>
                <input
                  value={form.conjuge_celular1}
                  onChange={(e) => updateMaskedField('conjuge_celular1', e.target.value, formatPhone)}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>Celular 2</label>
                <input
                  value={form.conjuge_celular2}
                  onChange={(e) => updateMaskedField('conjuge_celular2', e.target.value, formatPhone)}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>E-mail</label>
                <input
                  value={form.conjuge_email}
                  onChange={(e) => updateField('conjuge_email', e.target.value)}
                />
              </div>
              <div>
                <label>Instagram</label>
                <input
                  value={form.conjuge_instagram}
                  onChange={(e) => updateField('conjuge_instagram', e.target.value)}
                />
              </div>
              <div>
                <label>Profissão</label>
                <input
                  value={form.conjuge_profissao}
                  onChange={(e) => updateField('conjuge_profissao', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">Endereço residencial do cônjuge</div>
            <div className="form-grid">
              <div>
                <label>CEP</label>
                <input
                  value={form.conjuge_cep_residencial}
                  onChange={(e) =>
                    handleCepChange(e.target.value, 'conjuge_cep_residencial', {
                      logradouro: 'conjuge_logradouro_residencial',
                      bairro: 'conjuge_bairro_residencial',
                      cidade: 'conjuge_cidade_residencial',
                      uf: 'conjuge_uf_residencial',
                    })
                  }
                  onBlur={(e) =>
                    autofillCep(e.target.value, {
                      logradouro: 'conjuge_logradouro_residencial',
                      bairro: 'conjuge_bairro_residencial',
                      cidade: 'conjuge_cidade_residencial',
                      uf: 'conjuge_uf_residencial',
                    })
                  }
                  placeholder="00000-000"
                />
              </div>
              <div>
                <label>Logradouro</label>
                <input
                  value={form.conjuge_logradouro_residencial}
                  onChange={(e) => updateField('conjuge_logradouro_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Número</label>
                <input
                  value={form.conjuge_numero_residencial}
                  onChange={(e) => updateField('conjuge_numero_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Complemento</label>
                <input
                  value={form.conjuge_complemento_residencial}
                  onChange={(e) => updateField('conjuge_complemento_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Bairro</label>
                <input
                  value={form.conjuge_bairro_residencial}
                  onChange={(e) => updateField('conjuge_bairro_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>Cidade</label>
                <input
                  value={form.conjuge_cidade_residencial}
                  onChange={(e) => updateField('conjuge_cidade_residencial', e.target.value)}
                />
              </div>
              <div>
                <label>UF</label>
                <input
                  value={form.conjuge_uf_residencial}
                  onChange={(e) => updateField('conjuge_uf_residencial', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">Dados comerciais do cônjuge</div>
            <div className="form-grid">
              <div>
                <label>Empresa</label>
                <input
                  value={form.conjuge_empresa}
                  onChange={(e) => updateField('conjuge_empresa', e.target.value)}
                />
              </div>
              <div>
                <label>E-mail comercial</label>
                <input
                  value={form.conjuge_email_comercial}
                  onChange={(e) => updateField('conjuge_email_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Contato</label>
                <input
                  value={form.conjuge_contato_comercial}
                  onChange={(e) => updateField('conjuge_contato_comercial', e.target.value)}
                />
              </div>
            </div>

            <div className="form-section-title">Endereço comercial do cônjuge</div>
            <div className="form-grid">
              <div>
                <label>CEP</label>
                <input
                  value={form.conjuge_cep_comercial}
                  onChange={(e) =>
                    handleCepChange(e.target.value, 'conjuge_cep_comercial', {
                      logradouro: 'conjuge_logradouro_comercial',
                      bairro: 'conjuge_bairro_comercial',
                      cidade: 'conjuge_cidade_comercial',
                      uf: 'conjuge_uf_comercial',
                    })
                  }
                  onBlur={(e) =>
                    autofillCep(e.target.value, {
                      logradouro: 'conjuge_logradouro_comercial',
                      bairro: 'conjuge_bairro_comercial',
                      cidade: 'conjuge_cidade_comercial',
                      uf: 'conjuge_uf_comercial',
                    })
                  }
                  placeholder="00000-000"
                />
              </div>
              <div>
                <label>Logradouro</label>
                <input
                  value={form.conjuge_logradouro_comercial}
                  onChange={(e) => updateField('conjuge_logradouro_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Número</label>
                <input
                  value={form.conjuge_numero_comercial}
                  onChange={(e) => updateField('conjuge_numero_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Complemento</label>
                <input
                  value={form.conjuge_complemento_comercial}
                  onChange={(e) => updateField('conjuge_complemento_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Bairro</label>
                <input
                  value={form.conjuge_bairro_comercial}
                  onChange={(e) => updateField('conjuge_bairro_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>Cidade</label>
                <input
                  value={form.conjuge_cidade_comercial}
                  onChange={(e) => updateField('conjuge_cidade_comercial', e.target.value)}
                />
              </div>
              <div>
                <label>UF</label>
                <input
                  value={form.conjuge_uf_comercial}
                  onChange={(e) => updateField('conjuge_uf_comercial', e.target.value)}
                />
              </div>
            </div>

            {/* FILHOS */}
            <div className="form-section-title">Filhos</div>
            {filhos.map((filho, index) => (
              <div className="repeatable-block" key={index}>
                <button type="button" className="btn-remove" onClick={() => removeFilho(index)}>
                  Remover
                </button>
                <div className="form-grid">
                  <div>
                    <label>Nome</label>
                    <input value={filho.nome} onChange={(e) => updateFilho(index, 'nome', e.target.value)} />
                  </div>
                  <div>
                    <label>Data de nascimento</label>
                    <input
                      type="date"
                      value={filho.data_nascimento}
                      onChange={(e) => updateFilho(index, 'data_nascimento', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addFilho}>
              + Adicionar filho
            </button>

            {/* OBSERVAÇÕES */}
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
                {saving ? 'Salvando...' : 'Salvar cliente'}
              </button>
              <button
                type="button"
                onClick={handleLimpar}
                style={{
                  marginLeft: 24,
                  background: 'var(--danger)',
                  color: 'white',
                }}
              >
                LIMPAR
              </button>
            </div>
          </form>
        )}

        {!showForm && (
          <div className="data-table-wrap">
            {items.length === 0 ? (
              <p className="empty-hint">Nenhum cliente cadastrado ainda.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cadastrado/editado em</th>
                    {canEdit && <th></th>}
                    {canDelete && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nome}</td>
                      <td>{formatData(item.atualizado_em || item.created_at)}</td>
                      {canEdit && (
                        <td>
                          <button
                            className="btn-editar"
                            onClick={() => openEditForm(item)}
                          >
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
      </div>
    </div>
  );
}
