import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/useAuth';

const LINKS = [
  { href: '/dashboard', label: 'Home' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/fornecedores', label: 'Fornecedores' },
  { href: '/projetos', label: 'Projetos' },
  { href: '/relatorios', label: 'Relatórios' },
];

export default function Nav() {
  const router = useRouter();
  const { role } = useAuth();

  const links = role === 'admin' ? [...LINKS, { href: '/backups', label: 'Backups' }] : LINKS;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="dashboard-header">
      <div className="nav-bar">
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
      <button className="logout-btn" onClick={handleLogout}>
        Sair
      </button>
    </div>
  );
}
