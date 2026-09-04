import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
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
  cargo: '',
  data_admissao: '',
  instituicao_ensino: '',
  semestre_ano: '',
  cep_residencial: '',
  logradouro_residencial: '',
  numero_residencial: '',
  complemento_residencial: '',
  bairro_residencial: '',
  cidade_residencial: '',
  uf_residencial: '',
  observacoes: '',
};

export default function Funcionarios() {
  const { loading, role } = useAuth();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && role !== 'admin' && typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  }, [loading, role]);

  async function loadItems() {
    const { data } = await supabase.from('funcionarios').select('*').order('nome');
    setItems(data || []);
  }

  useEffect(() => {
    if (!loading && role === 'admin') loadItems();
  }, [loading, role]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateMaskedField(field, rawValue, maskFn) {
    updateField(field, maskFn(rawValue));
  }

  function handleCepChange(rawValue) {
    updateField('cep_residencial', formatCEP(rawValue));
    if (onlyDigits(rawValue).length === 0) {
      setForm((prev) => ({
        ...prev,
        logradouro_residencial: '',
        bairro_residencial: '',
        cidade_residencial: '',
        uf_residencial: '',
      }));
    }
  }

  async function autofillCep(cepValue) {
    const endereco = await buscarEnderecoPorCep(cepValue);
    if (!endereco) return;
    setForm((prev) => ({
      ...prev,
      logradouro_residencial: endereco.logradouro || prev.logradouro_residencial,
      bairro_residencial: endereco.bairro || prev.bairro_residencial,
      cidade_residencial: endereco.cidade || prev.cidade_residencial,
      uf_residencial: endereco.uf || prev.uf_residencial,
    }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
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
    setError('');
    setReadOnly(false);
  }

  function handleLimpar() {
    if (!confirm('Tem certeza que quer limpar todas as informações inseridas?')) return;
    setForm(emptyForm);
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
      data_admissao: form.data_admissao || null,
      atualizado_em: new Date().toISOString(),
    };

    if (editingId) {
      const { error: updateError } = await supabase.from('funcionarios').update(payload).eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError('Não foi possível salvar o funcionário. Tente novamente.');
        return;
      }
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error: insertError } = await supabase
        .from('funcionarios')
        .insert([{ ...payload, created_by: session?.user?.id || null }]);

      if (insertError) {
        setSaving(false);
        setError('Não foi possível salvar o funcionário. Tente novamente.');
        return;
      }
    }

    setSaving(false);
    handleCancelar();
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este funcionário?')) return;
    await supabase.from('funcionarios').delete().eq('id', id);
    loadItems();
  }

  function formatData(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR');
  }

  if (loading || role !== 'admin') {
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

        <div className="toolbar">
          <h1>RH — Funcionários</h1>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={openNewForm}
            style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
          >
            + Novo Funcionário
          </button>
        )}

        {showForm && (
          <form
            className="section-card"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            style={{ marginBottom: 24 }}
          >
            <div className="toolbar" style={{ marginBottom: 4 }}>
              <h2>{editingId ? (readOnly ? 'Visualizar funcionário' : 'Editar funcionário') : 'Novo funcionário'}</h2>
              <button type="button" className="btn-secondary" onClick={handleCancelar}>
                {readOnly ? 'Fechar' : 'Cancelar'}
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="form-section-title">Dados do funcionário</div>
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
                    placeholder="00.000.000-0 (aceita X)"
                    inputMode="text"
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
                  <label>Cargo</label>
                  <input value={form.cargo} onChange={(e) => updateField('cargo', e.target.value)} />
                </div>
                <div>
                  <label>Data de admissão</label>
                  <input
                    type="date"
                    value={form.data_admissao}
                    onChange={(e) => updateField('data_admissao', e.target.value)}
                  />
                </div>
                <div>
                  <label>Instituição de ensino</label>
                  <input
                    value={form.instituicao_ensino}
                    onChange={(e) => updateField('instituicao_ensino', e.target.value)}
                  />
                </div>
                <div>
                  <label>Semestre/Ano</label>
                  <input
                    value={form.semestre_ano}
                    onChange={(e) => updateField('semestre_ano', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section-title">Endereço residencial</div>
              <div className="form-grid">
                <div>
                  <label>CEP</label>
                  <input
                    value={form.cep_residencial}
                    onChange={(e) => handleCepChange(e.target.value)}
                    onBlur={(e) => autofillCep(e.target.value)}
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
                  {saving ? 'Salvando...' : 'Salvar funcionário'}
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
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Celular</th>
                  <th>Cadastrado/editado em</th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.cargo || '—'}</td>
                    <td>{item.celular1 || '—'}</td>
                    <td>{formatData(item.atualizado_em || item.created_at)}</td>
                    <td>
                      <button className="btn-secondary table-action-btn" onClick={() => openViewForm(item)}>
                        Visualizar
                      </button>
                    </td>
                    <td>
                      <button className="btn-editar table-action-btn" onClick={() => openEditForm(item)}>
                        EDITAR
                      </button>
                    </td>
                    <td>
                      <button className="delete-link table-action-btn" onClick={() => handleDelete(item.id)}>
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Rodape />
      </div>
    </div>
  );
}
