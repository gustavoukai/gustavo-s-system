import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';

export default function LogAcessos() {
  const { loading, role } = useAuth();
  const [acessos, setAcessos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  async function loadUsuarios() {
    const { data } = await supabase.from('profiles').select('id, email, nome').order('email');
    setUsuarios(data || []);
  }

  async function loadAcessos() {
    let query = supabase.from('acessos_log').select('*').order('criado_em', { ascending: false });
    if (usuarioFiltro) query = query.eq('user_id', usuarioFiltro);
    if (inicio) query = query.gte('criado_em', `${inicio}T00:00:00`);
    if (fim) query = query.lte('criado_em', `${fim}T23:59:59`);

    const { data } = await query;
    setAcessos(data || []);
  }

  useEffect(() => {
    if (!loading && role === 'admin') {
      loadUsuarios();
      loadAcessos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, role]);

  if (!loading && role && role !== 'admin') {
    if (typeof window !== 'undefined') window.location.href = '/dashboard';
    return null;
  }

  function nomeDoUsuario(userId, emailFallback) {
    const usuario = usuarios.find((u) => u.id === userId);
    return usuario?.nome || emailFallback || usuario?.email || '—';
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

        <h1 style={{ marginBottom: 18 }}>Log de Acessos</h1>

        <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
          <div>
            <label>Usuário</label>
            <select value={usuarioFiltro} onChange={(e) => setUsuarioFiltro(e.target.value)}>
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome || u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>De</label>
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <label>Até</label>
            <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <div>
            <button type="button" style={{ width: 'auto', padding: '10px 18px' }} onClick={loadAcessos}>
              Buscar
            </button>
          </div>
        </div>

        <div className="data-table-wrap">
          {acessos.length === 0 ? (
            <p className="empty-hint">Nenhum acesso encontrado.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Data e hora</th>
                </tr>
              </thead>
              <tbody>
                {acessos.map((a) => (
                  <tr key={a.id}>
                    <td>{nomeDoUsuario(a.user_id, a.email)}</td>
                    <td>{new Date(a.criado_em).toLocaleString('pt-BR')}</td>
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
