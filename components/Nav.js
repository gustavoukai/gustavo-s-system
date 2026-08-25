import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';

const LINKS_BASE = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dados-escritorio', label: 'Dados do Escritório' },
  { href: '/projetos', label: 'Projetos' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/fornecedores', label: 'Fornecedores' },
  { href: '/cobrancas', label: 'Cobranças' },
];

// Só quem pode operar/administrar vê estas quatro (visualizante não).
const LINKS_RESTRITOS = [
  { href: '/checklist-financeiro', label: 'Checklist Financeiro' },
  { href: '/contas-a-pagar', label: 'Contas a Pagar' },
  { href: '/recebimentos', label: 'Recebimentos' },
  { href: '/relatorios', label: 'Relatórios' },
];

const LINKS_ADMIN = [
  { href: '/usuarios', label: 'Usuários' },
  { href: '/log-acessos', label: 'Log de Acessos' },
  { href: '/backups', label: 'Backups' },
  { href: '/backup-completo', label: 'Backup Sistema' },
];

export default function Nav() {
  const router = useRouter();
  const { role } = useAuth();

  let links = role === 'visualizante' ? LINKS_BASE : [...LINKS_BASE, ...LINKS_RESTRITOS];
  if (role === 'admin') links = [...links, ...LINKS_ADMIN];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="dashboard-header">
      <div className="nav-left">
        <Link href="/dashboard">
          <img src="/logo-horizontal.png" alt="Taneli Ukai" className="nav-logo" />
        </Link>
        <div className="nav-bar" style={{ marginBottom: 0 }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${router.pathname === link.href ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <button className="logout-btn" onClick={handleLogout}>
        Sair
      </button>
    </div>
  );
}
