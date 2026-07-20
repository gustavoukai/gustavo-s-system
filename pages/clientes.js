import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';

export default function Clientes() {
  const { loading, canEdit, canDelete } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nome: '', documento: '', contato: '', observacoes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadItems() {
    const { data } = await supabase.from('clientes').select('*').order('nome');
    setItems(data || []);
  }

  useEffect(() => {
    if (!loading) loadItems();
  }, [loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSaving(true);
    setError('');
    const { error: insertError } = await supabase.from('clientes').insert([form]);
    setSaving(false);
    if (insertError) {
      setError('Não foi possível salvar. Tente novamente.');
      return;
    }
    setForm({ nome: '', documento: '', contato: '', observacoes: '' });
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este cliente?')) return;
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
            <h2 style={{ marginBottom: 14 }}>Novo cliente</h2>
            {error && <div className="error-box">{error}</div>}
            <div className="form-grid">
              <div>
                <label>Nome *</label>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label>Documento (CPF/CNPJ)</label>
                <input
                  value={form.documento}
                  onChange={(e) => setForm({ ...form, documento: e.target.value })}
                />
              </div>
              <div>
                <label>Contato</label>
                <input
                  value={form.contato}
                  onChange={(e) => setForm({ ...form, contato: e.target.value })}
                />
              </div>
              <div>
                <label>Observações</label>
                <input
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
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
                  <th>Documento</th>
                  <th>Contato</th>
                  <th>Observações</th>
                  {canDelete && <th></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.documento || '—'}</td>
                    <td>{item.contato || '—'}</td>
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
