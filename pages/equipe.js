import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';
import EquipeHorario from '../components/EquipeHorario';
import EquipeDeslocamento from '../components/EquipeDeslocamento';

export default function Equipe() {
  const { loading, role, session } = useAuth();
  const [view, setView] = useState('menu'); // menu | horario | deslocamento | usuario
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
  const [verHorario, setVerHorario] = useState(true);
  const [verDeslocamento, setVerDeslocamento] = useState(false);

  const meuId = session?.user?.id;
  const ehGestor = role === 'admin' || role === 'socio' || role === 'operador';
  const ehAdmin = role === 'admin';

  useEffect(() => {
    async function carregarUsuarios() {
      const { data } = await supabase.from('profiles').select('id, nome, email');
      const lista = (data || [])
        .map((u) => ({ id: u.id, rotulo: u.nome || u.email }))
        .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
      setUsuarios(lista);
    }
    if (!loading && ehGestor) carregarUsuarios();
  }, [loading, ehGestor]);

  if (loading || !meuId) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  const usuarioEscolhido = usuarios.find((u) => u.id === usuarioSelecionado);

  return (
    <div className="wide-page">
      <div className="wide-page-inner">
        <Nav />

        <div className="toolbar">
          <h1>
            Equipe
            {view === 'horario' && ' — Horário'}
            {view === 'deslocamento' && ' — Deslocamento'}
            {view === 'usuario' && ' — Usuário'}
          </h1>
          {view !== 'menu' && (
            <button className="btn-secondary" onClick={() => setView('menu')}>
              Voltar
            </button>
          )}
        </div>

        {view === 'menu' && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button style={{ width: 'auto', padding: '14px 24px' }} onClick={() => setView('horario')}>
              Horário
            </button>
            <button
              style={{ width: 'auto', padding: '14px 24px', background: 'var(--primary-dark)' }}
              onClick={() => setView('deslocamento')}
            >
              Deslocamento
            </button>
            {ehGestor && (
              <button
                style={{ width: 'auto', padding: '14px 24px', background: 'var(--accent)' }}
                onClick={() => setView('usuario')}
              >
                Usuário
              </button>
            )}
          </div>
        )}

        {view === 'horario' && <EquipeHorario userId={meuId} />}

        {view === 'deslocamento' && <EquipeDeslocamento userId={meuId} ehAdmin={ehAdmin} />}

        {view === 'usuario' && ehGestor && (
          <>
            <div className="filters-bar" style={{ alignItems: 'flex-end' }}>
              <div>
                <label>Usuário</label>
                <select value={usuarioSelecionado} onChange={(e) => setUsuarioSelecionado(e.target.value)}>
                  <option value="">Selecione...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.rotulo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  className={verHorario ? '' : 'btn-secondary'}
                  style={{ width: 'auto', padding: '10px 18px' }}
                  onClick={() => setVerHorario((v) => !v)}
                >
                  Horário
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className={verDeslocamento ? '' : 'btn-secondary'}
                  style={{ width: 'auto', padding: '10px 18px' }}
                  onClick={() => setVerDeslocamento((v) => !v)}
                >
                  Deslocamento
                </button>
              </div>
            </div>

            {!usuarioSelecionado && <p className="empty-hint">Escolha um usuário para ver os relatórios dele.</p>}

            {usuarioSelecionado && verHorario && (
              <div style={{ marginBottom: 30 }}>
                <h2 style={{ marginBottom: 10 }}>Horário — {usuarioEscolhido?.rotulo}</h2>
                <EquipeHorario key={`h-${usuarioSelecionado}`} userId={usuarioSelecionado} />
              </div>
            )}

            {usuarioSelecionado && verDeslocamento && (
              <div style={{ marginBottom: 30 }}>
                <h2 style={{ marginBottom: 10 }}>Deslocamento — {usuarioEscolhido?.rotulo}</h2>
                <EquipeDeslocamento key={`d-${usuarioSelecionado}`} userId={usuarioSelecionado} ehAdmin={ehAdmin} />
              </div>
            )}
          </>
        )}

        <Rodape />
      </div>
    </div>
  );
}
