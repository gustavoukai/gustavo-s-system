-- ============================================================
-- PARTE 5 — CONTROLE FINANCEIRO
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- (Pode rodar mesmo já tendo rodado o supabase-setup.sql antes.)
-- ============================================================

-- Função auxiliar: descobre o nível (role) do usuário logado
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- ---------- CLIENTES ----------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  contato text,
  observacoes text,
  created_at timestamp with time zone default now()
);

-- ---------- FORNECEDORES ----------
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text,
  contato text,
  observacoes text,
  created_at timestamp with time zone default now()
);

-- ---------- PROJETOS ----------
create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  created_at timestamp with time zone default now()
);

-- ---------- LANÇAMENTOS (entradas e saídas) ----------
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor numeric(14,2) not null,
  data date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  programa_fidelidade text,
  descricao text,
  cliente_id uuid references public.clientes(id) on delete set null,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  projeto_id uuid references public.projetos(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- ============================================================
-- SEGURANÇA (RLS) — quem pode ver/criar/editar/apagar
-- ============================================================

alter table public.clientes enable row level security;
alter table public.fornecedores enable row level security;
alter table public.projetos enable row level security;
alter table public.lancamentos enable row level security;

-- Qualquer pessoa logada pode VER tudo
drop policy if exists "ver clientes" on public.clientes;
create policy "ver clientes" on public.clientes for select using (auth.role() = 'authenticated');
drop policy if exists "ver fornecedores" on public.fornecedores;
create policy "ver fornecedores" on public.fornecedores for select using (auth.role() = 'authenticated');
drop policy if exists "ver projetos" on public.projetos;
create policy "ver projetos" on public.projetos for select using (auth.role() = 'authenticated');
drop policy if exists "ver lancamentos" on public.lancamentos;
create policy "ver lancamentos" on public.lancamentos for select using (auth.role() = 'authenticated');

-- Admin e Operador podem CADASTRAR
drop policy if exists "criar clientes" on public.clientes;
create policy "criar clientes" on public.clientes for insert with check (public.get_my_role() in ('admin', 'operador'));
drop policy if exists "criar fornecedores" on public.fornecedores;
create policy "criar fornecedores" on public.fornecedores for insert with check (public.get_my_role() in ('admin', 'operador'));
drop policy if exists "criar projetos" on public.projetos;
create policy "criar projetos" on public.projetos for insert with check (public.get_my_role() in ('admin', 'operador'));
drop policy if exists "criar lancamentos" on public.lancamentos;
create policy "criar lancamentos" on public.lancamentos for insert with check (public.get_my_role() in ('admin', 'operador'));

-- Admin e Operador podem EDITAR
drop policy if exists "editar clientes" on public.clientes;
create policy "editar clientes" on public.clientes for update using (public.get_my_role() in ('admin', 'operador'));
drop policy if exists "editar fornecedores" on public.fornecedores;
create policy "editar fornecedores" on public.fornecedores for update using (public.get_my_role() in ('admin', 'operador'));
drop policy if exists "editar projetos" on public.projetos;
create policy "editar projetos" on public.projetos for update using (public.get_my_role() in ('admin', 'operador'));
drop policy if exists "editar lancamentos" on public.lancamentos;
create policy "editar lancamentos" on public.lancamentos for update using (public.get_my_role() in ('admin', 'operador'));

-- Só Admin pode APAGAR
drop policy if exists "apagar clientes" on public.clientes;
create policy "apagar clientes" on public.clientes for delete using (public.get_my_role() = 'admin');
drop policy if exists "apagar fornecedores" on public.fornecedores;
create policy "apagar fornecedores" on public.fornecedores for delete using (public.get_my_role() = 'admin');
drop policy if exists "apagar projetos" on public.projetos;
create policy "apagar projetos" on public.projetos for delete using (public.get_my_role() = 'admin');
drop policy if exists "apagar lancamentos" on public.lancamentos;
create policy "apagar lancamentos" on public.lancamentos for delete using (public.get_my_role() = 'admin');
