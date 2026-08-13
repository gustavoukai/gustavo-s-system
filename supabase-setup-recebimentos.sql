-- ============================================================
-- PARTE 28 — Recebimentos (gerados automaticamente a partir de Cobranças pagas)
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

create table if not exists public.recebimentos (
  id uuid primary key default gen_random_uuid(),
  cobranca_id uuid unique references public.cobrancas(id) on delete cascade,
  ano integer not null,
  mes integer not null,
  data text,
  projeto_id uuid references public.projetos(id) on delete set null,
  fornecedor_tipo text,
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  categoria text,
  parcela_atual integer,
  parcela_total integer,
  percentual numeric(6,2),
  recebedor text,
  valor numeric(12,2),
  nf_numero text,
  observacoes text,
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now()
);

alter table public.recebimentos enable row level security;

drop policy if exists "ver recebimentos" on public.recebimentos;
create policy "ver recebimentos" on public.recebimentos for select using (auth.role() = 'authenticated');

drop policy if exists "criar recebimentos" on public.recebimentos;
create policy "criar recebimentos" on public.recebimentos for insert with check (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "editar recebimentos" on public.recebimentos;
create policy "editar recebimentos" on public.recebimentos for update using (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "apagar recebimentos" on public.recebimentos;
create policy "apagar recebimentos" on public.recebimentos for delete using (public.get_my_role() in ('admin', 'operador'));
