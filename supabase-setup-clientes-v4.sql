-- ============================================================
-- PARTE 8 — Data de cadastro/edição do cliente
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.clientes add column if not exists atualizado_em timestamp with time zone not null default now();
