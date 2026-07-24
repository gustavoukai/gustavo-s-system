-- ============================================================
-- PARTE 15 — Cadastro completo de Projetos
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.projetos drop column if exists descricao;

alter table public.projetos add column if not exists numero_projeto text;
alter table public.projetos add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
alter table public.projetos add column if not exists cep_obra text;
alter table public.projetos add column if not exists logradouro_obra text;
alter table public.projetos add column if not exists numero_obra text;
alter table public.projetos add column if not exists complemento_obra text;
alter table public.projetos add column if not exists bairro_obra text;
alter table public.projetos add column if not exists cidade_obra text;
alter table public.projetos add column if not exists uf_obra text;
alter table public.projetos add column if not exists observacoes text;
alter table public.projetos add column if not exists atualizado_em timestamp with time zone not null default now();
