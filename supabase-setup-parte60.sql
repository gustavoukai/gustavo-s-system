-- ============================================================
-- PARTE 60 — Contas "vistas" na Home, Notas e memória de campos
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

-- 1) "Marcar como visto" nas contas a pagar que aparecem na Home
alter table public.contas_pagar add column if not exists aviso_lido boolean not null default false;

-- 2) Notas (só para o nível Sócio)
create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text,
  texto text,
  privada boolean not null default false,
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now()
);

alter table public.notas enable row level security;

drop policy if exists "ver notas" on public.notas;
create policy "ver notas" on public.notas for select
  using (public.get_my_role() = 'socio' and (not privada or user_id = auth.uid()));

drop policy if exists "criar notas" on public.notas;
create policy "criar notas" on public.notas for insert
  with check (public.get_my_role() = 'socio' and user_id = auth.uid());

drop policy if exists "editar notas" on public.notas;
create policy "editar notas" on public.notas for update
  using (public.get_my_role() = 'socio' and (not privada or user_id = auth.uid()))
  with check (public.get_my_role() = 'socio' and (not privada or user_id = auth.uid()));

drop policy if exists "apagar notas" on public.notas;
create policy "apagar notas" on public.notas for delete
  using (public.get_my_role() = 'socio' and (not privada or user_id = auth.uid()));

-- 3) Sugestões "esquecidas" dos campos com memória (Pagamento, Recebedor, Pagador)
create table if not exists public.sugestoes_excluidas (
  id uuid primary key default gen_random_uuid(),
  campo text not null,
  valor text not null,
  created_at timestamp with time zone default now(),
  unique (campo, valor)
);

alter table public.sugestoes_excluidas enable row level security;

drop policy if exists "ver sugestoes_excluidas" on public.sugestoes_excluidas;
create policy "ver sugestoes_excluidas" on public.sugestoes_excluidas for select
  using (public.get_my_role() in ('admin', 'socio', 'operador'));

drop policy if exists "criar sugestoes_excluidas" on public.sugestoes_excluidas;
create policy "criar sugestoes_excluidas" on public.sugestoes_excluidas for insert
  with check (public.get_my_role() in ('admin', 'socio', 'operador'));

drop policy if exists "apagar sugestoes_excluidas" on public.sugestoes_excluidas;
create policy "apagar sugestoes_excluidas" on public.sugestoes_excluidas for delete
  using (public.get_my_role() in ('admin', 'socio', 'operador'));
