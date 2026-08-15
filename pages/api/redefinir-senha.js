import { createClient } from '@supabase/supabase-js';

// Roda no servidor — pode usar a chave "service role"/"secret" com segurança.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseVerificador = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({
      error: 'A chave SUPABASE_SERVICE_ROLE_KEY não está configurada na Vercel.',
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseVerificador.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Sessão inválida.' });
  }

  const { data: perfil } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();

  if (perfil?.role !== 'admin') {
    return res.status(403).json({ error: 'Só o Administrador pode redefinir senhas.' });
  }

  const { userId, novaSenha } = req.body || {};

  if (!userId || !novaSenha || novaSenha.length < 6) {
    return res.status(400).json({ error: 'Informe uma senha com pelo menos 6 caracteres.' });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: novaSenha,
  });

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  return res.status(200).json({ ok: true });
}
