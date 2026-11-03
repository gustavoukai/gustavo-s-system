import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Rodape from '../components/Rodape';
import { IconeOlhoAberto, IconeOlhoFechado } from '../components/Icones';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('E-mail ou senha incorretos. Confira e tente novamente.');
      return;
    }

    if (signInData?.user) {
      supabase
        .from('acessos_log')
        .insert([{ user_id: signInData.user.id, email: signInData.user.email }])
        .then(() => {});
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
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <input
            id="password"
            type={mostrarSenha ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ marginBottom: 0, paddingRight: 46 }}
          />
          <button
            type="button"
            className="icon-btn"
            title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setMostrarSenha((v) => !v)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}
          >
            {mostrarSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <Rodape />
      </div>
    </div>
  );
}
