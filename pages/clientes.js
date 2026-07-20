import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';

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
  endereco_residencial: '',
  bairro_residencial: '',
  cep_residencial: '',
  cidade_residencial: '',
  uf_residencial: '',
  empresa: '',
  email_comercial: '',
  contato_comercial: '',
  endereco_comercial: '',
  bairro_comercial: '',
  cep_comercial: '',
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
  conjuge_endereco_residencial: '',
  conjuge_bairro_residencial: '',
  conjuge_cep_residencial: '',
  conjuge_cidade_residencial: '',
  conjuge_uf_residencial: '',
  conjuge_empresa: '',
  conjuge_email_comercial: '',
  conjuge_contato_comercial: '',
  conjuge_endereco_comercial: '',
  conjuge_bairro_comercial: '',
  conjuge_cep_comercial: '',
  conjuge_cidade_comercial: '',
  conjuge_uf_comercial: '',
  observacoes: '',
};

export default function Clientes() {
  const { loading, canEdit, canDelete } = useAuth();
  const [items, setItems] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filhos, setFilhos] = useState([]);
  const [projetosVinculados, setProjetosVinculados] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadItems() {
    const { data } = await supabase
      .from('clientes')
      .select('*, cliente_projetos(endereco_obra, projetos(nome))')
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
    setForm({ ...form, [field]: value });
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
    setProjetosVinculados([
      ...projetosVinculados,
      { projeto_id: '', endereco_obra: '', bairro_obra: '', cep_obra: '', cidade_obra: '', uf_obra: '' },
    ]);
  }

  function updateProjetoVinculado(index, field, value) {
    const updated = [...projetosVinculados];
    updated[index] = { ...updated[index], [field]: value };
    setProjetosVinculados(updated);
  }

  function removeProjetoVinculado(index) {
    setProjetosVinculados(projetosVinculados.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSaving(true);
    setError('');

    const payload = { ...form, filhos };

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

    const vinculosValidos = projetosVinculados.filter((p) => p.projeto_id);
    if (vinculosValidos.length > 0) {
      const vinculosPayload = vinculosValidos.map((p) => ({
        ...p,
        cliente_id: novoCliente.id,
      }));
      await supabase.from('cliente_projetos').insert(vinculosPayload);
    }

    setSaving(false);
    setForm(emptyForm);
    setFilhos([]);
    setProjetosVinculados([]);
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este cliente e todos os vínculos de projeto dele?')) return;
    await supabase.from('clientes').delete().eq('id', id);
    loadItems();
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

        {canEdit && (
          <form className="section-card" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 4 }}>Novo cliente</h2>

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
                  <div>
                    <label>Endereço da obra</label>
                    <input
                      value={p.endereco_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'endereco_obra', e.target.value)}
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
                    <label>CEP</label>
                    <input
                      value={p.cep_obra}
                      onChange={(e) => updateProjetoVinculado(index, 'cep_obra', e.target.value)}
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

            {/* DADOS DO CLIENTE */}
            <div className="form-section-title">Dados do cliente</div>
            <div className="form-grid">
              <div>
                <label>Nome *</label>
                <input required value={form.nome} onChange={(e) => updateField('nome', e.target.value)} />
              </div>
              <div>
                <label>CPF</label>
                <input value={form.cpf} onChange={(e) => updateField('cpf', e.target.value)} />
              </div>
              <div>
                <label>RG</label>
                <input value={form.rg} onChange={(e) => updateField('rg', e.target.value)} />
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
                <label>Celular 1</label>
                <input value={form.celular1} onChange={(e) => updateField('celular1', e.target.value)} />
              </div>
              <div>
                <label>Celular 2</label>
                <input value={form.celular2} onChange={(e) => updateField('celular2', e.target.value)} />
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
                <label>Endereço</label>
                <input
                  value={form.endereco_residencial}
                  onChange={(e) => updateField('endereco_residencial', e.target.value)}
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
                <label>CEP</label>
                <input
                  value={form.cep_residencial}
                  onChange={(e) => updateField('cep_residencial', e.target.value)}
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
                <label>Endereço</label>
                <input
                  value={form.endereco_comercial}
                  onChange={(e) => updateField('endereco_comercial', e.target.value)}
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
                <label>CEP</label>
                <input
                  value={form.cep_comercial}
                  onChange={(e) => updateField('cep_comercial', e.target.value)}
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
                  onChange={(e) => updateField('conjuge_cpf', e.target.value)}
                />
              </div>
              <div>
                <label>RG</label>
                <input value={form.conjuge_rg} onChange={(e) => updateField('conjuge_rg', e.target.value)} />
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
                  onChange={(e) => updateField('conjuge_celular1', e.target.value)}
                />
              </div>
              <div>
                <label>Celular 2</label>
                <input
                  value={form.conjuge_celular2}
                  onChange={(e) => updateField('conjuge_celular2', e.target.value)}
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
                <label>Endereço</label>
                <input
                  value={form.conjuge_endereco_residencial}
                  onChange={(e) => updateField('conjuge_endereco_residencial', e.target.value)}
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
                <label>CEP</label>
                <input
                  value={form.conjuge_cep_residencial}
                  onChange={(e) => updateField('conjuge_cep_residencial', e.target.value)}
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
                <label>Endereço</label>
                <input
                  value={form.conjuge_endereco_comercial}
                  onChange={(e) => updateField('conjuge_endereco_comercial', e.target.value)}
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
                <label>CEP</label>
                <input
                  value={form.conjuge_cep_comercial}
                  onChange={(e) => updateField('conjuge_cep_comercial', e.target.value)}
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
            </div>
          </form>
        )}

        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="empty-hint">Nenhum cliente cadastrado ainda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Celular 1</th>
                  <th>E-mail</th>
                  <th>Cidade</th>
                  <th>Projetos</th>
                  <th>Observações</th>
                  {canDelete && <th></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.cpf || '—'}</td>
                    <td>{item.celular1 || '—'}</td>
                    <td>{item.email || '—'}</td>
                    <td>{item.cidade_residencial || '—'}</td>
                    <td>
                      {item.cliente_projetos && item.cliente_projetos.length > 0
                        ? item.cliente_projetos.map((cp) => cp.projetos?.nome).filter(Boolean).join(', ')
                        : '—'}
                    </td>
                    <td>{item.observacoes || '—'}</td>
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
      </div>
    </div>
  );
}
