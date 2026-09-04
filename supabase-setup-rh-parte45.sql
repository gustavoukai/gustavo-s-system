-- ============================================================
-- PARTE 45 — RH: seção Dados bancários
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.funcionarios add column if not exists banco_titular text;
alter table public.funcionarios add column if not exists banco_nome text;
alter table public.funcionarios add column if not exists banco_agencia text;
alter table public.funcionarios add column if not exists banco_conta text;
alter table public.funcionarios add column if not exists banco_pix text;
alter table public.funcionarios add column if not exists banco_observacoes text;
