-- ============================================================
-- PARTE 22 — Campo "Trabalhou em" no cadastro de Fornecedores
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.fornecedores add column if not exists trabalhou_em uuid[] not null default '{}';
