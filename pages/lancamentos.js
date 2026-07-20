import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';

const STATUS_OPTIONS = ['pendente', 'pago', 'cancelado'];

const emptyForm = {
  tipo: 'entrada',
  valor: '',
  data: '',
  status: 'pendente',
  programa_fidelidade: '',
  descricao: '',
  cliente_id: '',
  fornecedor_id: '',
  projeto_id: '',
};

export default function Lancamentos() {
  const { loading, canEdit, canDelete, session } = useAuth();
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    cliente_id: '',
    fornecedor_id: '',
    projeto_id: '',
    status: '',
    programa_fidelidade: '',
    data_inicio: '',
    data_fim: '',
  });

  async function loadSupportData() {
    const [c, f, p] = await Promise.all([
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('fornecedores').select('id, nome').order('nome'),
      supabase.from('projetos').select('id, nome').order('nome'),
    ]);
    setClientes(c.data || []);
    setFornecedores(f.data || []);
    setProjetos(p.data || []);
  }

  async function loadItems() {
    let query = supabase
      .from('lancamentos')
      .select('*, clientes(nome), fornecedores(nome), projetos(nome)')
      .order('data', { ascending: false });

    if (filters.cliente_id) query = query.eq('cliente_id', filters.cliente_id);
    if (filters.fornecedor_id) query = query.eq('fornecedor_id', filters.fornecedor_id);
    if (filters.projeto_id) query = query.eq('projeto_id', filters.projeto_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.programa_fidelidade)
      query = query.ilike('programa_fidelidade', `%${filters.programa_fidelidade}%`);
    if (filters.data_inicio) query = query.gte('data', filters.data_inicio);
    if (filters.data_fim) query = query.lte('data', filters.data_fim);

    const { data } = await query;
    setItems(data || []);
  }

  useEffect(() => {
    if (!loading) {
      loadSupportData();
      loadItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!loading) loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.valor || !form.data) return;
    setSaving(true);
    setError('');

    const payload = {
      tipo: form.tipo,
      valor: parseFloat(form.valor),
      data: form.data,
      status: form.status,
      programa_fidelidade: form.programa_fidelidade || null,
      descricao: form.descricao || null,
      cliente_id: form.cliente_id || null,
      fornecedor_id: form.fornecedor_id || null,
      projeto_id: form.projeto_id || null,
      created_by: session?.user?.id || null,
    };

    const { error: insertError } = await supabase.from('lancamentos').insert([payload]);
    setSaving(false);
    if (insertError) {
      setError('Não foi possível salvar. Confira os campos e tente novamente.');
      return;
    }
    setForm(emptyForm);
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este lançamento?')) return;
    await supabase.from('lancamentos').delete().eq('id', id);
    loadItems();
  }

  function formatMoney(value) {
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

        <h1 style={{ marginBottom: 18 }}>Lançamentos</h1>

        {canEdit && (
          <form className="section-card" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 14 }}>Novo lançamento</h2>
            {error && <div className="error-box">{error}</div>}
            <div className="form-grid">
              <div>
                <label>Tipo *</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <div>
                <label>Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                />
              </div>
              <div>
                <label>Data *</label>
                <input
                  type="date"
                  required
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Cliente (se for entrada)</label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                >
                  <option value="">—</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Fornecedor (se for saída)</label>
                <select
                  value={form.fornecedor_id}
                  onChange={(e) => setForm({ ...form, fornecedor_id: e.target.value })}
                >
                  <option value="">—</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Projeto</label>
                <select
                  value={form.projeto_id}
                  onChange={(e) => setForm({ ...form, projeto_id: e.target.value })}
                >
                  <option value="">—</option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Programa de fidelidade</label>
                <input
                  value={form.programa_fidelidade}
                  onChange={(e) => setForm({ ...form, programa_fidelidade: e.target.value })}
                />
              </div>
              <div>
                <label>Descrição</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar lançamento'}
              </button>
            </div>
          </form>
        )}

        <div className="filters-bar">
          <div>
            <label>Cliente</label>
            <select
              value={filters.cliente_id}
              onChange={(e) => setFilters({ ...filters, cliente_id: e.target.value })}
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Fornecedor</label>
            <select
              value={filters.fornecedor_id}
              onChange={(e) => setFilters({ ...filters, fornecedor_id: e.target.value })}
            >
              <option value="">Todos</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Projeto</label>
            <select
              value={filters.projeto_id}
              onChange={(e) => setFilters({ ...filters, projeto_id: e.target.value })}
            >
              <option value="">Todos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Programa de fidelidade</label>
            <input
              value={filters.programa_fidelidade}
              onChange={(e) => setFilters({ ...filters, programa_fidelidade: e.target.value })}
            />
          </div>
          <div>
            <label>Data início</label>
            <input
              type="date"
              value={filters.data_inicio}
              onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value })}
            />
          </div>
          <div>
            <label>Data fim</label>
            <input
              type="date"
              value={filters.data_fim}
              onChange={(e) => setFilters({ ...filters, data_fim: e.target.value })}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="empty-hint">Nenhum lançamento encontrado com esses filtros.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Cliente</th>
                  <th>Fornecedor</th>
                  <th>Projeto</th>
                  <th>Fidelidade</th>
                  <th>Descrição</th>
                  {canDelete && <th></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`tag tag-${item.tipo}`}>{item.tipo}</span>
                    </td>
                    <td>{formatMoney(item.valor)}</td>
                    <td>{new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className={`tag tag-${item.status}`}>{item.status}</span>
                    </td>
                    <td>{item.clientes?.nome || '—'}</td>
                    <td>{item.fornecedores?.nome || '—'}</td>
                    <td>{item.projetos?.nome || '—'}</td>
                    <td>{item.programa_fidelidade || '—'}</td>
                    <td>{item.descricao || '—'}</td>
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
