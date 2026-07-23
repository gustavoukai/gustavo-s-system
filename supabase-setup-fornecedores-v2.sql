-- ============================================================
-- PARTE 12 — Ficha completa de Fornecedores
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- Remove os campos antigos, mais simples
alter table public.fornecedores drop column if exists documento;
alter table public.fornecedores drop column if exists contato;

-- Novos campos
alter table public.fornecedores add column if not exists categorias text[] not null default '{}';
alter table public.fornecedores add column if not exists status text;
alter table public.fornecedores add column if not exists cpf text;
alter table public.fornecedores add column if not exists cnpj text;
alter table public.fornecedores add column if not exists razao_social text;
alter table public.fornecedores add column if not exists vendedor text;
alter table public.fornecedores add column if not exists telefone_vendedor text;
alter table public.fornecedores add column if not exists financeiro text;
alter table public.fornecedores add column if not exists telefone_financeiro text;
alter table public.fornecedores add column if not exists nf text;
alter table public.fornecedores add column if not exists programas_fidelidade text[] not null default '{}';
alter table public.fornecedores add column if not exists banco text;
alter table public.fornecedores add column if not exists agencia text;
alter table public.fornecedores add column if not exists conta text;
alter table public.fornecedores add column if not exists nomenclatura_bancaria text;
alter table public.fornecedores add column if not exists atualizado_em timestamp with time zone not null default now();

-- ============================================================
-- Bucket de backup dos fornecedores (mesmo esquema do de clientes)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('backups-fornecedores', 'backups-fornecedores', false)
on conflict (id) do nothing;

drop policy if exists "enviar backups de fornecedores" on storage.objects;
create policy "enviar backups de fornecedores"
  on storage.objects for insert
  with check (bucket_id = 'backups-fornecedores' and public.get_my_role() in ('admin', 'operador'));

drop policy if exists "atualizar backups de fornecedores" on storage.objects;
create policy "atualizar backups de fornecedores"
  on storage.objects for update
  using (bucket_id = 'backups-fornecedores' and public.get_my_role() in ('admin', 'operador'));

drop policy if exists "ver backups de fornecedores" on storage.objects;
create policy "ver backups de fornecedores"
  on storage.objects for select
  using (bucket_id = 'backups-fornecedores' and public.get_my_role() = 'admin');

drop policy if exists "apagar backups de fornecedores" on storage.objects;
create policy "apagar backups de fornecedores"
  on storage.objects for delete
  using (bucket_id = 'backups-fornecedores' and public.get_my_role() = 'admin');
