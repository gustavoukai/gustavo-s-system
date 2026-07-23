import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';

export default function Projetos() {
  const { loading, canEdit, canDelete } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadItems() {
    const { data } = await supabase.from('projetos').select('*').order('nome');
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
    const { error: insertError } = await supabase.from('projetos').insert([form]);
    setSaving(false);
    if (insertError) {
      setError('Não foi possível salvar. Tente novamente.');
      return;
    }
    setForm({ nome: '', descricao: '' });
    loadItems();
  }

  async function handleDelete(id) {
    if (!confirm('Apagar este projeto?')) return;
    await supabase.from('projetos').delete().eq('id', id);
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

        <h1 style={{ marginBottom: 18 }}>Projetos</h1>

        {canEdit && (
          <form className="section-card" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 14 }}>Novo projeto</h2>
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
                <label>Descrição</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar projeto'}
              </button>
            </div>
          </form>
        )}

        <div className="data-table-wrap">
          {items.length === 0 ? (
            <p className="empty-hint">Nenhum projeto cadastrado ainda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  {canDelete && <th></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
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

        <Rodape />
      </div>
    </div>
  );
}
