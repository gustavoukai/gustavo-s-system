-- ============================================================
-- PARTE 44 — RH: dados pessoais/profissionais e histórico salarial
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.funcionarios rename column email to email_pessoal;
alter table public.funcionarios add column if not exists curso text;
alter table public.funcionarios add column if not exists email_profissional text;
alter table public.funcionarios add column if not exists base_salarial numeric(12,2);
alter table public.funcionarios add column if not exists data_ajuste date;
alter table public.funcionarios add column if not exists historico_salarial jsonb not null default '[]';
