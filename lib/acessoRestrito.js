import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Usado em telas que o nível "visualizante" não pode acessar (Contas a Pagar,
// Recebimentos, Relatórios). Redireciona para a Home se o papel não for permitido.
export function useBloqueiaVisualizante(role, loading) {
  const router = useRouter();

  useEffect(() => {
    if (!loading && role === 'visualizante') {
      router.replace('/dashboard');
    }
  }, [loading, role, router]);
}
