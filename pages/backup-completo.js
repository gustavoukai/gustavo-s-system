import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';
import Nav from '../components/Nav';
import Rodape from '../components/Rodape';

export default function BackupCompleto() {
  const { loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, role, router]);

  if (loading || role !== 'admin') {
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

        <h1 style={{ marginBottom: 18 }}>Backup completo do sistema</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
          O sistema é feito de duas partes: o <strong>código</strong> (as telas, os botões, o
          funcionamento) e os <strong>dados</strong> (tudo que você e sua equipe cadastram: clientes,
          projetos, fornecedores, cobranças, etc). Cada parte tem sua própria forma de backup, explicadas
          abaixo.
        </p>

        <div className="section-card">
          <h2 style={{ marginBottom: 10 }}>1. O código já está seguro sozinho</h2>
          <p>
            Toda vez que você sobe uma atualização no <strong>GitHub</strong> ("Add file" → "Upload
            files" → "Commit changes"), o GitHub guarda essa versão para sempre no histórico do
            repositório — nada é perdido, mesmo que uma atualização dê algum problema.
          </p>
          <p style={{ marginTop: 10 }}>Se um dia precisar recuperar uma versão antiga do código:</p>
          <ol style={{ marginTop: 6, paddingLeft: 20 }}>
            <li>Entre no repositório em github.com (o mesmo onde você sobe os arquivos).</li>
            <li>
              Clique em <strong>"commits"</strong> (geralmente aparece perto do topo da lista de
              arquivos, com um número ao lado, tipo "32 commits").
            </li>
            <li>Você verá a lista de todas as atualizações já feitas, com data e descrição.</li>
            <li>
              Clique em qualquer uma delas pra ver ou baixar os arquivos exatamente como estavam
              naquele momento.
            </li>
          </ol>
        </div>

        <div className="section-card">
          <h2 style={{ marginBottom: 10 }}>2. Backup dos dados (recomendado fazer periodicamente)</h2>
          <p>
            Os dados ficam guardados no <strong>Supabase</strong>. Não existe um botão único de "baixar
            tudo", mas dá pra exportar cada tabela em poucos cliques. Recomendo fazer isso a cada poucos
            meses, ou antes de qualquer mudança grande no sistema.
          </p>
          <ol style={{ marginTop: 10, paddingLeft: 20 }}>
            <li>Entre no seu projeto em supabase.com.</li>
            <li>
              No menu da esquerda, clique em <strong>"Table Editor"</strong>.
            </li>
            <li>
              Você verá a lista de tabelas (clientes, fornecedores, projetos, cobrancas, contas_pagar,
              recebimentos, dados_escritorio, profiles, etc). Clique em uma delas.
            </li>
            <li>
              No canto superior, procure o botão <strong>"Export"</strong> (às vezes fica dentro de um
              menu com três pontinhos "..."). Clique nele e escolha <strong>"Export to CSV"</strong>.
            </li>
            <li>O arquivo CSV é baixado pro seu computador — salve numa pasta com a data de hoje.</li>
            <li>Repita esse processo para cada tabela importante.</li>
          </ol>
          <p style={{ marginTop: 10, fontSize: 13, color: 'var(--muted)' }}>
            Cada CSV é uma "fotografia" daquela tabela no momento em que você exportou. Se precisar
            recuperar dados um dia, me chame com o arquivo em mãos que eu ajudo a colocar de volta no
            sistema.
          </p>
        </div>

        <Rodape />
      </div>
    </div>
  );
}
