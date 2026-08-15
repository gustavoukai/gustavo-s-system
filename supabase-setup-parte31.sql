-- ============================================================
-- PARTE 31 — Visualizante pode cadastrar/editar em 4 áreas,
--            cadastro de usuários pelo portal, log de acessos
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- 1. Visualizante passa a poder cadastrar/editar (nunca apagar) em
--    Clientes, Fornecedores, Projetos e Cobranças.
drop policy if exists "criar clientes" on public.clientes;
create policy "criar clientes" on public.clientes for insert with check (public.get_my_role() in ('admin', 'operador', 'visualizante'));
drop policy if exists "editar clientes" on public.clientes;
create policy "editar clientes" on public.clientes for update using (public.get_my_role() in ('admin', 'operador', 'visualizante'));

drop policy if exists "criar fornecedores" on public.fornecedores;
create policy "criar fornecedores" on public.fornecedores for insert with check (public.get_my_role() in ('admin', 'operador', 'visualizante'));
drop policy if exists "editar fornecedores" on public.fornecedores;
create policy "editar fornecedores" on public.fornecedores for update using (public.get_my_role() in ('admin', 'operador', 'visualizante'));

drop policy if exists "criar projetos" on public.projetos;
create policy "criar projetos" on public.projetos for insert with check (public.get_my_role() in ('admin', 'operador', 'visualizante'));
drop policy if exists "editar projetos" on public.projetos;
create policy "editar projetos" on public.projetos for update using (public.get_my_role() in ('admin', 'operador', 'visualizante'));

drop policy if exists "criar cobrancas" on public.cobrancas;
create policy "criar cobrancas" on public.cobrancas for insert with check (public.get_my_role() in ('admin', 'operador', 'visualizante'));
drop policy if exists "editar cobrancas" on public.cobrancas;
create policy "editar cobrancas" on public.cobrancas for update using (public.get_my_role() in ('admin', 'operador', 'visualizante'));

-- 2. Admin pode editar nome/role de qualquer usuário direto pelo portal
drop policy if exists "admin edita perfis" on public.profiles;
create policy "admin edita perfis" on public.profiles for update using (public.get_my_role() = 'admin');

-- 3. Log de acessos (um registro por login bem-sucedido)
create table if not exists public.acessos_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  criado_em timestamp with time zone default now()
);

alter table public.acessos_log enable row level security;

drop policy if exists "usuario registra o proprio acesso" on public.acessos_log;
create policy "usuario registra o proprio acesso" on public.acessos_log for insert with check (auth.uid() = user_id);

drop policy if exists "admin ve o log de acessos" on public.acessos_log;
create policy "admin ve o log de acessos" on public.acessos_log for select using (public.get_my_role() = 'admin');
