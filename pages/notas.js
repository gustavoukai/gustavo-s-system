import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import { BotaoEditarIcone, BotaoApagarIcone } from '../components/Icones';

const formVazio = { titulo: '', texto: '', privada: false };

function ajustarAltura(e) {
  e.target.style.height = 'auto';
  e.target.style.height = `${Math.max(e.target.scrollHeight, 140)}px`;
}

export default function Notas() {
  const { loading, role, session } = useAuth();
  const [notas, setNotas] = useState([]);
  const [autores, setAutores] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(formVazio);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const meuId = session?.user?.id;
  const podeVer = role === 'admin' || role === 'socio' || role === 'operador';

  useEffect(() => {
    if (!loading && !podeVer && typeof window !== 'undefined') window.location.href = '/dashboard';
  }, [loading, podeVer]);

  async function carregar() {
    const { data } = await supabase.from('notas').select('*').order('created_at', { ascending: false });
    setNotas(data || []);
    const { data: perfis } = await supabase.from('profiles').select('id, nome, email');
    const mapa = {};
    (perfis || []).forEach((p) => {
      mapa[p.id] = p.nome || p.email;
    });
    setAutores(mapa);
  }

  useEffect(() => {
    if (!loading && podeVer) carregar();
  }, [loading, podeVer]);

  function abrirNova() {
    setEditingId(null);
    setForm(formVazio);
    setErro('');
    setShowForm(true);
  }

  function abrirEdicao(nota) {
    setEditingId(nota.id);
    setForm({ titulo: nota.titulo || '', texto: nota.texto || '', privada: !!nota.privada });
    setErro('');
    setShowForm(true);
  }

  function cancelar() {
    setShowForm(false);
    setEditingId(null);
    setForm(formVazio);
    setErro('');
  }

  async function salvar(e) {
    e.preventDefault();
    if (!form.titulo.trim() && !form.texto.trim()) {
      setErro('Escreva um título ou um texto antes de salvar.');
      return;
    }
    setSaving(true);
    setErro('');

    const payload = {
      titulo: form.titulo.trim() || null,
      texto: form.texto || null,
      privada: form.privada,
      atualizado_em: new Date().toISOString(),
    };

    const resposta = editingId
      ? await supabase.from('notas').update(payload).eq('id', editingId)
      : await supabase.from('notas').insert([{ ...payload, user_id: meuId }]);

    setSaving(false);
    if (resposta.error) {
      setErro(`Não foi possível salvar: ${resposta.error.message}`);
      return;
    }
    cancelar();
    carregar();
  }

  async function apagar(nota) {
    if (!confirm('Apagar esta nota?')) return;
    await supabase.from('notas').delete().eq('id', nota.id);
    carregar();
  }

  if (loading || !podeVer) {
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

        <h1 style={{ marginBottom: 18 }}>Notas</h1>

        {!showForm && (
          <button type="button" onClick={abrirNova} style={{ width: 'auto', padding: '10px 18px', marginBottom: 20 }}>
            + Criar
          </button>
        )}

        {showForm && (
          <form className="section-card" onSubmit={salvar} style={{ marginBottom: 24 }}>
            <div className="toolbar" style={{ marginBottom: 4 }}>
              <h2>{editingId ? 'Editar nota' : 'Nova nota'}</h2>
              <button type="button" className="btn-secondary" onClick={cancelar}>
                Cancelar
              </button>
            </div>

            {erro && <div className="error-box">{erro}</div>}

            <label>Título (opcional)</label>
            <input value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} />

            <label>Texto</label>
            <textarea
              value={form.texto}
              onChange={(e) => setForm((p) => ({ ...p, texto: e.target.value }))}
              onInput={ajustarAltura}
              onFocus={ajustarAltura}
              rows={6}
              style={{
                width: '100%',
                minHeight: 140,
                resize: 'vertical',
                fontFamily: 'inherit',
                fontSize: 14,
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                marginBottom: 14,
              }}
            />

            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={form.privada}
                onChange={(e) => setForm((p) => ({ ...p, privada: e.target.checked }))}
                style={{ width: 'auto', margin: 0 }}
              />
              Nota particular (só eu posso ver). Sem marcar, Admin, Sócios e Operadores veem e podem editar.
            </label>

            <div className="form-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar nota'}
              </button>
            </div>
          </form>
        )}

        {notas.length === 0 && !showForm && <p className="empty-hint">Nenhuma nota criada ainda.</p>}

        {notas.map((nota) => {
          const editada = new Date(nota.atualizado_em) - new Date(nota.created_at) > 60000;
          return (
            <div
              key={nota.id}
              className="section-card"
              style={nota.privada ? { borderLeft: '4px solid var(--accent)' } : undefined}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ marginBottom: 2 }}>{nota.titulo || '(sem título)'}</h2>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                    {autores[nota.user_id] || 'Usuário'} · {new Date(nota.created_at).toLocaleString('pt-BR')}
                    {editada && ` · editada em ${new Date(nota.atualizado_em).toLocaleString('pt-BR')}`}
                    {nota.privada && ' · 🔒 particular'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <BotaoEditarIcone onClick={() => abrirEdicao(nota)} />
                  <BotaoApagarIcone onClick={() => apagar(nota)} />
                </div>
              </div>
              {nota.texto && <p style={{ whiteSpace: 'pre-wrap', marginTop: 12, marginBottom: 0 }}>{nota.texto}</p>}
            </div>
          );
        })}

        <Rodape />
      </div>
    </div>
  );
}
