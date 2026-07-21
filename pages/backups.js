import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';

export default function Backups() {
  const { loading, role } = useAuth();
  const [linhas, setLinhas] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  async function loadBackups() {
    setCarregandoLista(true);
    const [{ data: clientes }, { data: arquivos }] = await Promise.all([
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.storage.from('backups-clientes').list(),
    ]);

    const arquivosPorNome = new Map((arquivos || []).map((a) => [a.name, a]));

    const combinado = (clientes || [])
      .map((c) => {
        const arquivo = arquivosPorNome.get(`${c.id}.html`);
        if (!arquivo) return null;
        return {
          clienteId: c.id,
          nome: c.nome,
          atualizadoEm: arquivo.updated_at,
        };
      })
      .filter(Boolean);

    setLinhas(combinado);
    setCarregandoLista(false);
  }

  useEffect(() => {
    if (!loading && role === 'admin') {
      loadBackups();
    }
  }, [loading, role]);

  async function handleAbrir(clienteId) {
    const { data, error } = await supabase.storage
      .from('backups-clientes')
      .createSignedUrl(`${clienteId}.html`, 60);
    if (error || !data) {
      alert('Não foi possível abrir esse backup agora. Tente novamente.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  function formatData(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="page-center">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="wide-page">
        <div className="wide-page-inner">
          <Nav />
          <div className="section-card">
            <h2>Acesso restrito</h2>
            <p>Esta área é exclusiva para o Administrador.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wide-page">
      <div className="wide-page-inner">
        <Nav />

        <h1 style={{ marginBottom: 6 }}>Backups de clientes</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 18 }}>
          Cada cliente tem uma cópia de segurança, não editável, gerada automaticamente toda vez
          que o cadastro dele é salvo. Cada nova cópia substitui a anterior.
        </p>

        <div className="data-table-wrap">
          {carregandoLista ? (
            <p className="empty-hint">Carregando...</p>
          ) : linhas.length === 0 ? (
            <p className="empty-hint">Nenhum backup gerado ainda.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Última cópia gerada em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.clienteId}>
                    <td>{linha.nome}</td>
                    <td>{formatData(linha.atualizadoEm)}</td>
                    <td>
                      <button className="btn-editar" onClick={() => handleAbrir(linha.clienteId)}>
                        Abrir
                      </button>
                    </td>
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
