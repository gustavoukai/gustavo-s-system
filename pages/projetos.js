import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import { formatCEP, onlyDigits, buscarEnderecoPorCep } from '../lib/masks';

const emptyForm = {
  nome: '',
  numero_projeto: '',
  cliente_id: '',
  cep_obra: '',
  logradouro_obra: '',
  numero_obra: '',
  complemento_obra: '',
  bairro_obra: '',
  cidade_obra: '',
  uf_obra: '',
  observacoes: '',
};

export default function Projetos() {
  const { loading, canEdit, canDelete } = useAuth();
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadItems() {
    const { data } = await supabase.from('projetos').select('*, clientes(nome)');
    const ordenados = (data || []).sort(
      (a, b) => Number(b.numero_projeto || 0) - Number(a.numero_projeto || 0)
    );
    setItems(ordenados);
  }

  async function loadClientes() {
    const { data } = await supabase.from('clientes').select('id, nome').order('nome');
    setClientes(data || []);
  }

  useEffect(() => {
    if (!loading) {
      loadItems();
      loadClientes();
    }
  }, [loading]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCepChange(rawValue) {
    updateField('cep_obra', formatCEP(rawValue));
    if (onlyDigits(rawValue).length === 0) {
      setForm((prev) => ({
        ...prev,
        logradouro_obra: '',
        bairro_obra: '',
        cidade_obra: '',
        uf_obra: '',
      }));
    }
  }

  async function autofillCep(cepValue) {
    const endereco = await buscarEnderecoPorCep(cepValue);
    if (!endereco) return;
    setForm((prev) => ({
      ...prev,
      logradouro_obra: endereco.logradouro || prev.logradouro_obra,
      bairro_obra: endereco.bairro || prev.bairro_obra,
      cidade_obra: endereco.cidade || prev.cidade_obra,
      uf_obra: endereco.uf || prev.uf_obra,
    }));
  }

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
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

    const numeroDigitos = onlyDigits(form.numero_projeto);
    if (!form.nome.trim() || !form.cliente_id || (numeroDigitos.length !== 4 && numeroDigitos.length !== 5)) {
      setError(
        'Preencha os campos obrigatórios: Nome, Número (4 ou 5 dígitos, formato AANN ou AANNN) e Cliente.'
      );
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      ...form,
      numero_projeto: numeroDigitos,
      atualizado_em: new Date().toISOString(),
    };

    if (editingId) {
      const { error: updateError } = await supabase.from('projetos').update(payload).eq('id', editingId);
      if (updateError) {
        setSaving(false);
        setError('Não foi possível salvar o projeto. Tente novamente.');
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('projetos').insert([payload]);
      if (insertError) {
        setSaving(false);
        setError('Não foi possível salvar o projeto. Tente novamente.');
        return;
      }
    }

    setSaving(false);
    handleCancelar();
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este projeto?')) return;
    await supabase.from('projetos').delete().eq('id', id);
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

        <h1 style={{ marginBottom: 18 }}>Projetos</h1>

        {canEdit && !showForm && (
          <button
            type="button"
            onClick={openNewForm}
            style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}
          >
            + Novo Projeto
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
              <h2>{editingId ? 'Editar projeto' : 'Novo projeto'}</h2>
              <button type="button" className="btn-secondary" onClick={handleCancelar}>
                Cancelar
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="form-section-title">Dados do projeto</div>
            <div className="form-grid">
              <div>
                <label>
                  Nome <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                    (campo obrigatório)
                  </span>
                </label>
                <input required value={form.nome} onChange={(e) => updateField('nome', e.target.value)} />
              </div>
              <div>
                <label>
                  Número <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                    (AANN ou AANNN — campo obrigatório)
                  </span>
                </label>
                <input
                  required
                  value={form.numero_projeto}
                  onChange={(e) => updateField('numero_projeto', onlyDigits(e.target.value).slice(0, 5))}
                  placeholder="Ex: 2613"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label>
                  Cliente <span style={{ color: 'var(--danger)' }}>*</span>{' '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>
                    (campo obrigatório)
                  </span>
                </label>
                <select value={form.cliente_id} onChange={(e) => updateField('cliente_id', e.target.value)}>
                  <option value="">Selecione...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section-title">Endereço da obra</div>
            <div className="form-grid">
              <div>
                <label>CEP</label>
                <input
                  value={form.cep_obra}
                  onChange={(e) => handleCepChange(e.target.value)}
                  onBlur={(e) => autofillCep(e.target.value)}
                  placeholder="00000-000"
                />
              </div>
              <div>
                <label>Logradouro</label>
                <input
                  value={form.logradouro_obra}
                  onChange={(e) => updateField('logradouro_obra', e.target.value)}
                />
              </div>
              <div>
                <label>Número</label>
                <input
                  value={form.numero_obra}
                  onChange={(e) => updateField('numero_obra', e.target.value)}
                />
              </div>
              <div>
                <label>Complemento</label>
                <input
                  value={form.complemento_obra}
                  onChange={(e) => updateField('complemento_obra', e.target.value)}
                />
              </div>
              <div>
                <label>Bairro</label>
                <input
                  value={form.bairro_obra}
                  onChange={(e) => updateField('bairro_obra', e.target.value)}
                />
              </div>
              <div>
                <label>Cidade</label>
                <input
                  value={form.cidade_obra}
                  onChange={(e) => updateField('cidade_obra', e.target.value)}
                />
              </div>
              <div>
                <label>UF</label>
                <input value={form.uf_obra} onChange={(e) => updateField('uf_obra', e.target.value)} />
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
                {saving ? 'Salvando...' : 'Salvar projeto'}
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
              <p className="empty-hint">Nenhum projeto cadastrado ainda.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Nome do projeto</th>
                    <th>Cadastrado/editado em</th>
                    {canEdit && <th></th>}
                    {canDelete && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.numero_projeto}</td>
                      <td>{item.nome}</td>
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
        )}

        <Rodape />
      </div>
    </div>
  );
}
