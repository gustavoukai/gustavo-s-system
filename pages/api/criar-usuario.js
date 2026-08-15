import { createClient } from '@supabase/supabase-js';

// Esta função roda no servidor (nunca no navegador), então pode usar a chave
// "service role" do Supabase com segurança — ela nunca fica visível pro usuário.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cliente comum, só pra conferir quem está fazendo a chamada.
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
      error:
        'A chave SUPABASE_SERVICE_ROLE_KEY não está configurada na Vercel. Veja o passo a passo no README.',
    });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  // Confirma que quem está chamando essa rota é mesmo um admin logado.
  const {
    data: { user },
    error: userError,
  } = await supabaseVerificador.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Sessão inválida.' });
  }

  const { data: perfil } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();

  if (perfil?.role !== 'admin') {
    return res.status(403).json({ error: 'Só o Administrador pode cadastrar novos usuários.' });
  }

  const { email, senha, nome, role } = req.body || {};

  if (!email || !senha || !role) {
    return res.status(400).json({ error: 'Preencha e-mail, senha e nível de acesso.' });
  }

  const { data: novoUsuario, error: criarError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (criarError) {
    return res.status(400).json({ error: criarError.message });
  }

  // O gatilho do banco já cria a linha em "profiles" automaticamente;
  // aqui só completamos com o nome e o nível de acesso escolhidos.
  const { error: perfilError } = await supabaseAdmin
    .from('profiles')
    .update({ nome: nome || null, role })
    .eq('id', novoUsuario.user.id);

  if (perfilError) {
    return res.status(400).json({ error: perfilError.message });
  }

  return res.status(200).json({ ok: true });
}
