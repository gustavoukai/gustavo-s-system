-- ============================================================
-- PARTE 58 — Seção Equipe (Horário e Deslocamento)
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- Anos disponíveis (compartilhado entre Horário e Deslocamento)
create table if not exists public.equipe_anos (
  ano integer primary key
);
insert into public.equipe_anos (ano) values (2026), (2027), (2028), (2029), (2030)
on conflict (ano) do nothing;

alter table public.equipe_anos enable row level security;
drop policy if exists "ver equipe_anos" on public.equipe_anos;
create policy "ver equipe_anos" on public.equipe_anos for select using (auth.role() = 'authenticated');
drop policy if exists "criar equipe_anos" on public.equipe_anos;
create policy "criar equipe_anos" on public.equipe_anos for insert with check (auth.role() = 'authenticated');

-- Valores de reembolso (só o admin altera): R$ por VT e R$ por KM
create table if not exists public.equipe_config (
  id integer primary key default 1,
  valor_vt numeric(10,2) not null default 0,
  valor_km numeric(10,2) not null default 0,
  atualizado_em timestamp with time zone default now(),
  constraint equipe_config_unica check (id = 1)
);
insert into public.equipe_config (id, valor_vt, valor_km) values (1, 0, 0) on conflict (id) do nothing;

alter table public.equipe_config enable row level security;
drop policy if exists "ver equipe_config" on public.equipe_config;
create policy "ver equipe_config" on public.equipe_config for select using (auth.role() = 'authenticated');
drop policy if exists "admin edita equipe_config" on public.equipe_config;
create policy "admin edita equipe_config" on public.equipe_config for update using (public.get_my_role() = 'admin');

-- Horários trabalhados (um registro por usuário por dia)
create table if not exists public.equipe_horarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  inicio1 text,
  fim1 text,
  inicio2 text,
  fim2 text,
  total_minutos integer not null default 0,
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now(),
  unique (user_id, data)
);
create index if not exists equipe_horarios_user_data_idx on public.equipe_horarios (user_id, data);

alter table public.equipe_horarios enable row level security;
drop policy if exists "ver equipe_horarios" on public.equipe_horarios;
create policy "ver equipe_horarios" on public.equipe_horarios for select
  using (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));
drop policy if exists "criar equipe_horarios" on public.equipe_horarios;
create policy "criar equipe_horarios" on public.equipe_horarios for insert
  with check (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));
drop policy if exists "editar equipe_horarios" on public.equipe_horarios;
create policy "editar equipe_horarios" on public.equipe_horarios for update
  using (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));
drop policy if exists "apagar equipe_horarios" on public.equipe_horarios;
create policy "apagar equipe_horarios" on public.equipe_horarios for delete
  using (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));

-- Deslocamentos (pode haver mais de um por dia)
create table if not exists public.equipe_deslocamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  origem text,
  destino text,
  vt boolean not null default false,
  km numeric(8,2),
  uber numeric(10,2),
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now()
);
create index if not exists equipe_deslocamentos_user_data_idx on public.equipe_deslocamentos (user_id, data);

alter table public.equipe_deslocamentos enable row level security;
drop policy if exists "ver equipe_deslocamentos" on public.equipe_deslocamentos;
create policy "ver equipe_deslocamentos" on public.equipe_deslocamentos for select
  using (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));
drop policy if exists "criar equipe_deslocamentos" on public.equipe_deslocamentos;
create policy "criar equipe_deslocamentos" on public.equipe_deslocamentos for insert
  with check (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));
drop policy if exists "editar equipe_deslocamentos" on public.equipe_deslocamentos;
create policy "editar equipe_deslocamentos" on public.equipe_deslocamentos for update
  using (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));
drop policy if exists "apagar equipe_deslocamentos" on public.equipe_deslocamentos;
create policy "apagar equipe_deslocamentos" on public.equipe_deslocamentos for delete
  using (auth.uid() = user_id or public.get_my_role() in ('admin', 'operador'));
