import Head from 'next/head';
import { useRouter } from 'next/router';
import '../styles/globals.css';

const TITULOS = {
  '/login': 'Login',
  '/dashboard': 'Home',
  '/clientes': 'Clientes',
  '/fornecedores': 'Fornecedores',
  '/projetos': 'Projetos',
  '/lancamentos': 'Lançamentos',
  '/relatorios': 'Relatórios',
  '/backups': 'Backups',
};

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const titulo = TITULOS[router.pathname] || 'Sistema Financeiro';

  return (
    <>
      <Head>
        <title>{titulo} — Sistema Financeiro</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
