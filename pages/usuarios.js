import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';

const ROLES = [
  { valor: 'visualizante', label: 'Visualizante' },
  { valor: 'operador', label: 'Operador' },
  { valor: 'admin', label: 'Administrador' },
];

const emptyForm = { nome: '', email: '', senha: '', role: 'visualizante' };

export default function Usuarios() {
  const { loading, role } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', role: 'visualizante' });

  async function loadUsuarios() {
    const { data } = await supabase.from('profiles').select('id, email, nome, role').order('email');
    setUsuarios(data || []);
  }

  useEffect(() => {
    if (!loading && role === 'admin') loadUsuarios();
  }, [loading, role]);

  if (!loading && role && role !== 'admin') {
    if (typeof window !== 'undefined') window.location.href = '/dashboard';
    return null;
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/criar-usuario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(form),
    });

    const resultado = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(resultado.error || 'Não foi possível cadastrar o usuário.');
      return;
    }

    setForm(emptyForm);
    setShowForm(false);
    loadUsuarios();
  }

  function openEdit(usuario) {
    setEditingId(usuario.id);
    setEditForm({ nome: usuario.nome || '', role: usuario.role || 'visualizante' });
  }

  async function salvarEdicao(id) {
    await supabase.from('profiles').update({ nome: editForm.nome || null, role: editForm.role }).eq('id', id);
    setEditingId(null);
    loadUsuarios();
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
          <h1>Usuários</h1>
          {!showForm && (
            <button style={{ width: 'auto', padding: '10px 18px' }} onClick={() => setShowForm(true)}>
              + Novo usuário
            </button>
          )}
        </div>

        {showForm && (
          <form
            className="section-card"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
          >
            <div className="toolbar" style={{ marginBottom: 4 }}>
              <h2>Novo usuário</h2>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="form-grid">
              <div>
                <label>Nome</label>
                <input value={form.nome} onChange={(e) => updateField('nome', e.target.value)} />
              </div>
              <div>
                <label>E-mail (campo obrigatório)</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div>
                <label>Senha provisória (campo obrigatório)</label>
                <input
                  type="text"
                  required
                  value={form.senha}
                  onChange={(e) => updateField('senha', e.target.value)}
                  placeholder="Peça pra pessoa trocar depois"
                />
              </div>
              <div>
                <label>Nível de acesso</label>
                <select value={form.role} onChange={(e) => updateField('role', e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r.valor} value={r.valor}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Cadastrando...' : 'Cadastrar usuário'}
              </button>
            </div>
          </form>
        )}

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Nível</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  {editingId === u.id ? (
                    <>
                      <td>
                        <input
                          value={editForm.nome}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, nome: e.target.value }))}
                        />
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))}
                        >
                          {ROLES.map((r) => (
                            <option key={r.valor} value={r.valor}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button className="btn-editar" onClick={() => salvarEdicao(u.id)}>
                          SALVAR
                        </button>
                        <button className="btn-secondary" style={{ marginLeft: 6 }} onClick={() => setEditingId(null)}>
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{u.nome || '—'}</td>
                      <td>{u.email}</td>
                      <td>{ROLES.find((r) => r.valor === u.role)?.label || u.role}</td>
                      <td>
                        <button className="btn-editar" onClick={() => openEdit(u)}>
                          EDITAR
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Rodape />
      </div>
    </div>
  );
}
