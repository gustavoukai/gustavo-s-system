-- ============================================================
-- PARTE 36 — Histórico de observações do Checklist + avisos para o admin
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.checklist_financeiro add column if not exists observacoes_historico jsonb not null default '[]';

create table if not exists public.checklist_financeiro_avisos (
  id uuid primary key default gen_random_uuid(),
  item_chave text not null,
  ano integer not null,
  mes integer not null,
  tipo text not null,
  descricao text not null,
  usuario_nome text,
  aviso_lido boolean not null default false,
  criado_em timestamp with time zone not null default now()
);

alter table public.checklist_financeiro_avisos enable row level security;

drop policy if exists "admin ve avisos checklist" on public.checklist_financeiro_avisos;
create policy "admin ve avisos checklist" on public.checklist_financeiro_avisos for select using (public.get_my_role() = 'admin');

drop policy if exists "operador e admin criam avisos checklist" on public.checklist_financeiro_avisos;
create policy "operador e admin criam avisos checklist" on public.checklist_financeiro_avisos for insert with check (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "admin atualiza avisos checklist" on public.checklist_financeiro_avisos;
create policy "admin atualiza avisos checklist" on public.checklist_financeiro_avisos for update using (public.get_my_role() = 'admin');
