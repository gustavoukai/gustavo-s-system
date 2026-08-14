-- ============================================================
-- PARTE 30 — Nome de usuário, boas-vindas semanais, aviso de cobrança
--            até ser visto, correção do texto bancário
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- 1. Corrige o texto da conta bancária de pessoa física
update public.dados_escritorio set banco1_titulo = 'PARA PAGAMENTO SEM NF' where id = 1;

-- 2. Nome (nome e sobrenome) de cada usuário, além do e-mail de login
alter table public.profiles add column if not exists nome text;

-- Deixa qualquer usuário autenticado enxergar o nome/e-mail de todos os outros
-- (precisa disso pra mostrar "quem cadastrou" nos avisos e relatórios)
drop policy if exists "usuarios veem o proprio perfil" on public.profiles;
drop policy if exists "usuarios veem todos os perfis" on public.profiles;
create policy "usuarios veem todos os perfis"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');

-- Pra cadastrar o nome de cada usuário, edite a tabela "profiles" direto pela
-- aba "Table Editor" do Supabase, preenchendo a coluna "nome" (ex: "Gustavo Ukai").

-- 3. Controle de "boas-vindas" (uma vez por semana, por usuário)
create table if not exists public.visitas_usuario (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ultima_boas_vindas timestamp with time zone
);

alter table public.visitas_usuario enable row level security;

drop policy if exists "usuario ve a propria visita" on public.visitas_usuario;
create policy "usuario ve a propria visita" on public.visitas_usuario for select using (auth.uid() = user_id);

drop policy if exists "usuario grava a propria visita" on public.visitas_usuario;
create policy "usuario grava a propria visita" on public.visitas_usuario for insert with check (auth.uid() = user_id);

drop policy if exists "usuario atualiza a propria visita" on public.visitas_usuario;
create policy "usuario atualiza a propria visita" on public.visitas_usuario for update using (auth.uid() = user_id);

-- 4. Aviso de "nova cobrança cadastrada" permanece até alguém marcar como visto
alter table public.cobrancas add column if not exists aviso_lido boolean not null default false;
