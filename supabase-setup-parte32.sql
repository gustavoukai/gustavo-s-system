-- ============================================================
-- PARTE 32 — Avisos de novo Projeto/Cliente cadastrado
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.clientes add column if not exists created_by uuid references auth.users(id);
alter table public.clientes add column if not exists aviso_lido boolean not null default false;

alter table public.projetos add column if not exists created_by uuid references auth.users(id);
alter table public.projetos add column if not exists aviso_lido boolean not null default false;
