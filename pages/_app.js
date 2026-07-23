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
