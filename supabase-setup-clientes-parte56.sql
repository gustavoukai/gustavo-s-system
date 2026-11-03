-- ============================================================
-- PARTE 56 — Novos campos em Clientes (razão social, CNPJ, atividade)
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.clientes add column if not exists nome_razao_social text;
alter table public.clientes add column if not exists cnpj text;
alter table public.clientes add column if not exists atividade text;
