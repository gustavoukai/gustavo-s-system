import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';

const STATUS_OPTIONS = ['pendente', 'pago', 'cancelado'];

export default function Relatorios() {
  const { loading } = useAuth();
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [projetos, setProjetos] = useState([]);

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

  function exportCsv() {
    const header = [
      'Tipo',
      'Valor',
      'Data',
      'Status',
      'Cliente',
      'Fornecedor',
      'Projeto',
      'Programa de fidelidade',
      'Descrição',
    ];

    const rows = items.map((item) => [
      item.tipo,
      item.valor,
      item.data,
      item.status,
      item.clientes?.nome || '',
      item.fornecedores?.nome || '',
      item.projetos?.nome || '',
      item.programa_fidelidade || '',
      (item.descricao || '').replace(/,/g, ';'),
    ]);

    const csvContent = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalEntradas = items
    .filter((i) => i.tipo === 'entrada')
    .reduce((sum, i) => sum + Number(i.valor), 0);
  const totalSaidas = items
    .filter((i) => i.tipo === 'saida')
    .reduce((sum, i) => sum + Number(i.valor), 0);

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

        <div className="toolbar">
          <h1>Relatórios</h1>
          <button className="btn-secondary" onClick={exportCsv}>
            Exportar CSV ({items.length} linhas)
          </button>
        </div>

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

        <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
          <div className="section-card" style={{ flex: 1, marginBottom: 0 }}>
            <h2>Total de entradas</h2>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#1e6b3a' }}>
              {formatMoney(totalEntradas)}
            </p>
          </div>
          <div className="section-card" style={{ flex: 1, marginBottom: 0 }}>
            <h2>Total de saídas</h2>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#a03b3b' }}>
              {formatMoney(totalSaidas)}
            </p>
          </div>
          <div className="section-card" style={{ flex: 1, marginBottom: 0 }}>
            <h2>Saldo</h2>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{formatMoney(totalEntradas - totalSaidas)}</p>
          </div>
        </div>

        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="empty-hint">Nenhum resultado com esses filtros.</p>
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
