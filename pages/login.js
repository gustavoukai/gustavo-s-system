import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Rodape from '../components/Rodape';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('E-mail ou senha incorretos. Confira e tente novamente.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="page-center">
      <div style={{ width: '100%', maxWidth: 380 }}>
      <form className="card" onSubmit={handleSubmit}>
        <img
          src="/logo-horizontal.png"
          alt="Taneli Ukai"
          style={{ width: '100%', maxWidth: 200, marginBottom: 22 }}
        />
        <h1>Entrar no sistema</h1>
        <p className="subtitle">Use o e-mail e a senha cadastrados por quem administra o sistema.</p>

        {error && <div className="error-box">{error}</div>}

        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
        />

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <Rodape />
      </div>
    </div>
  );
}
