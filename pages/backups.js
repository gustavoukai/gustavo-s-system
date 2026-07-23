import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';

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

function TabelaBackup({ titulo, linhas, carregando, onAbrir }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ marginBottom: 10 }}>{titulo}</h2>
      <div className="data-table-wrap">
        {carregando ? (
          <p className="empty-hint">Carregando...</p>
        ) : linhas.length === 0 ? (
          <p className="empty-hint">Nenhum backup gerado ainda.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Última cópia gerada em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.id}>
                  <td>{linha.nome}</td>
                  <td>{formatData(linha.atualizadoEm)}</td>
                  <td>
                    <button className="btn-editar" onClick={() => onAbrir(linha.id)}>
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
  );
}

export default function Backups() {
  const { loading, role } = useAuth();
  const [linhasClientes, setLinhasClientes] = useState([]);
  const [linhasFornecedores, setLinhasFornecedores] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  async function loadBackups() {
    setCarregandoLista(true);

    const [{ data: clientes }, { data: arquivosClientes }, { data: fornecedores }, { data: arquivosFornecedores }] =
      await Promise.all([
        supabase.from('clientes').select('id, nome').order('nome'),
        supabase.storage.from('backups-clientes').list(),
        supabase.from('fornecedores').select('id, nome').order('nome'),
        supabase.storage.from('backups-fornecedores').list(),
      ]);

    const mapaClientes = new Map((arquivosClientes || []).map((a) => [a.name, a]));
    const mapaFornecedores = new Map((arquivosFornecedores || []).map((a) => [a.name, a]));

    setLinhasClientes(
      (clientes || [])
        .map((c) => {
          const arquivo = mapaClientes.get(`${c.id}.pdf`);
          if (!arquivo) return null;
          return { id: c.id, nome: c.nome, atualizadoEm: arquivo.updated_at };
        })
        .filter(Boolean)
    );

    setLinhasFornecedores(
      (fornecedores || [])
        .map((f) => {
          const arquivo = mapaFornecedores.get(`${f.id}.pdf`);
          if (!arquivo) return null;
          return { id: f.id, nome: f.nome, atualizadoEm: arquivo.updated_at };
        })
        .filter(Boolean)
    );

    setCarregandoLista(false);
  }

  useEffect(() => {
    if (!loading && role === 'admin') {
      loadBackups();
    }
  }, [loading, role]);

  async function abrirBackup(bucket, id) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(`${id}.pdf`, 60);
    if (error || !data) {
      alert('Não foi possível abrir esse backup agora. Tente novamente.');
      return;
    }
    window.open(data.signedUrl, '_blank');
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

        <h1 style={{ marginBottom: 6 }}>Backups</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 22 }}>
          Cada cadastro tem uma cópia de segurança em PDF, não editável, gerada automaticamente
          toda vez que é salvo. Cada nova cópia substitui a anterior.
        </p>

        <TabelaBackup
          titulo="Clientes"
          linhas={linhasClientes}
          carregando={carregandoLista}
          onAbrir={(id) => abrirBackup('backups-clientes', id)}
        />

        <TabelaBackup
          titulo="Fornecedores"
          linhas={linhasFornecedores}
          carregando={carregandoLista}
          onAbrir={(id) => abrirBackup('backups-fornecedores', id)}
        />

        <Rodape />
      </div>
    </div>
  );
}
