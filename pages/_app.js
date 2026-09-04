import Head from 'next/head';
import { useRouter } from 'next/router';
import '../styles/globals.css';

const TITULOS = {
  '/login': 'Login',
  '/dashboard': 'Home',
  '/clientes': 'Clientes',
  '/fornecedores': 'Fornecedores',
  '/projetos': 'Projetos',
  '/contas-a-pagar': 'Contas a Pagar',
  '/cobrancas': 'Cobranças',
  '/recebimentos': 'Recebimentos',
  '/relatorios': 'Relatórios',
  '/backup-completo': 'Backup Completo',
  '/dados-escritorio': 'Dados do Escritório',
  '/checklist-financeiro': 'Checklist Financeiro',
  '/funcionarios': 'RH',
  '/usuarios': 'Usuários',
  '/log-acessos': 'Log de Acessos',
  '/backups': 'Backups',
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const titulo = TITULOS[router.pathname] || 'Taneli Ukai';

  return (
    <>
      <Head>
        <title>{titulo} - Taneli Ukai</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
