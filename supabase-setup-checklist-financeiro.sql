-- ============================================================
-- PARTE 35 — Checklist Financeiro
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

create table if not exists public.checklist_financeiro (
  id uuid primary key default gen_random_uuid(),
  ano integer not null,
  mes integer not null,
  item_chave text not null,
  checkboxes jsonb not null default '[]',
  observacoes text,
  atualizado_em timestamp with time zone not null default now(),
  unique (ano, mes, item_chave)
);

alter table public.checklist_financeiro enable row level security;

drop policy if exists "ver checklist_financeiro" on public.checklist_financeiro;
create policy "ver checklist_financeiro" on public.checklist_financeiro for select using (auth.role() = 'authenticated');

drop policy if exists "criar checklist_financeiro" on public.checklist_financeiro;
create policy "criar checklist_financeiro" on public.checklist_financeiro for insert with check (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "editar checklist_financeiro" on public.checklist_financeiro;
create policy "editar checklist_financeiro" on public.checklist_financeiro for update using (public.get_my_role() in ('admin', 'operador'));
