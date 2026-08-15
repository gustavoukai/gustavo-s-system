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

const PERMISSOES = [
  { area: 'Home, Dados do Escritório, Projetos, Clientes, Fornecedores, Cobranças', visualizante: 'Ver, cadastrar e editar', operador: 'Ver, cadastrar e editar', admin: 'Ver, cadastrar e editar' },
  { area: 'Contas a Pagar, Recebimentos, Relatórios', visualizante: 'Sem acesso', operador: 'Ver, cadastrar e editar', admin: 'Ver, cadastrar e editar' },
  { area: 'Apagar registros (qualquer seção)', visualizante: 'Não pode', operador: 'Não pode', admin: 'Pode' },
  { area: 'Backups', visualizante: 'Sem acesso', operador: 'Sem acesso', admin: 'Acesso total' },
  { area: 'Dados do Escritório (edição)', visualizante: 'Não pode editar', operador: 'Não pode editar', admin: 'Pode editar' },
  { area: 'Usuários / Log de Acessos', visualizante: 'Sem acesso', operador: 'Sem acesso', admin: 'Acesso total' },
  { area: 'Avisos de pagamento/cobrança na Home', visualizante: 'Não recebe', operador: 'Recebe', admin: 'Recebe' },
  { area: 'Aviso de aniversário na Home', visualizante: 'Recebe', operador: 'Recebe', admin: 'Recebe' },
];

export default function Usuarios() {
  const { loading, role } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: '', role: 'visualizante' });
  const [redefinindoSenhaId, setRedefinindoSenhaId] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaDefinidaAgora, setSenhaDefinidaAgora] = useState(null);
  const [erroSenha, setErroSenha] = useState('');

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

  function abrirRedefinicaoSenha(id) {
    setRedefinindoSenhaId(id);
    setNovaSenha('');
    setErroSenha('');
    setSenhaDefinidaAgora(null);
  }

  async function confirmarNovaSenha(usuario) {
    if (!novaSenha || novaSenha.length < 6) {
      setErroSenha('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setErroSenha('');

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch('/api/redefinir-senha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ userId: usuario.id, novaSenha }),
    });

    const resultado = await response.json();

    if (!response.ok) {
      setErroSenha(resultado.error || 'Não foi possível redefinir a senha.');
      return;
    }

    setRedefinindoSenhaId(null);
    setSenhaDefinidaAgora({ email: usuario.email, senha: novaSenha });
    setNovaSenha('');
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

        <div className="section-card">
          <h2 style={{ marginBottom: 10 }}>O que cada nível de acesso pode fazer</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Visualizante</th>
                  <th>Operador</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSOES.map((p) => (
                  <tr key={p.area}>
                    <td>{p.area}</td>
                    <td>{p.visualizante}</td>
                    <td>{p.operador}</td>
                    <td>{p.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="section-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h2 style={{ marginBottom: 6 }}>Sobre senhas</h2>
          <p style={{ fontSize: 13, margin: 0 }}>
            Por segurança, o sistema nunca guarda nem mostra a senha real de ninguém (nem pra você, como
            administrador — isso vale pra qualquer sistema sério, não é uma limitação só daqui). Cada
            usuário faz login só com a senha que você definir, e não existe tela pra ele trocar sozinho.
            Se precisar trocar a senha de alguém, use o botão <strong>"Redefinir senha"</strong> na lista
            abaixo — a senha nova aparece na tela só naquele momento, então anote ou avise a pessoa na hora.
          </p>
        </div>

        {senhaDefinidaAgora && (
          <div className="section-card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2 style={{ marginBottom: 6 }}>Senha definida</h2>
            <p style={{ margin: 0 }}>
              Nova senha para <strong>{senhaDefinidaAgora.email}</strong>: <strong>{senhaDefinidaAgora.senha}</strong>
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Anote ou avise a pessoa agora — essa senha não vai aparecer de novo em lugar nenhum.
            </p>
            <button className="btn-secondary" style={{ marginTop: 10 }} onClick={() => setSenhaDefinidaAgora(null)}>
              Ok, já anotei
            </button>
          </div>
        )}

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
                  placeholder="Pelo menos 6 caracteres"
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
                      <td colSpan={2}>
                        <button className="btn-editar" onClick={() => salvarEdicao(u.id)}>
                          SALVAR
                        </button>
                        <button className="btn-secondary" style={{ marginLeft: 6 }} onClick={() => setEditingId(null)}>
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : redefinindoSenhaId === u.id ? (
                    <>
                      <td>{u.nome || '—'}</td>
                      <td>{u.email}</td>
                      <td>{ROLES.find((r) => r.valor === u.role)?.label || u.role}</td>
                      <td colSpan={2}>
                        <input
                          type="text"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          placeholder="Nova senha (mín. 6 caracteres)"
                          style={{ display: 'inline-block', width: 200, marginRight: 6 }}
                        />
                        <button className="btn-editar" onClick={() => confirmarNovaSenha(u)}>
                          CONFIRMAR
                        </button>
                        <button className="btn-secondary" style={{ marginLeft: 6 }} onClick={() => setRedefinindoSenhaId(null)}>
                          Cancelar
                        </button>
                        {erroSenha && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{erroSenha}</p>}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{u.nome || '—'}</td>
                      <td>{u.email}</td>
                      <td>{ROLES.find((r) => r.valor === u.role)?.label || u.role}</td>
                      <td>
                        <button className="btn-secondary" onClick={() => abrirRedefinicaoSenha(u.id)}>
                          Redefinir senha
                        </button>
                      </td>
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
