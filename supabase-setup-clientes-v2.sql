-- ============================================================
-- PARTE 6 — FICHA COMPLETA DE CLIENTES
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- Remove os campos antigos que serão substituídos
alter table public.clientes drop column if exists documento;
alter table public.clientes drop column if exists contato;

-- Dados pessoais do cliente
alter table public.clientes add column if not exists cpf text;
alter table public.clientes add column if not exists rg text;
alter table public.clientes add column if not exists data_nascimento date;
alter table public.clientes add column if not exists celular1 text;
alter table public.clientes add column if not exists celular2 text;
alter table public.clientes add column if not exists email text;
alter table public.clientes add column if not exists instagram text;
alter table public.clientes add column if not exists profissao text;

-- Endereço residencial do cliente
alter table public.clientes add column if not exists endereco_residencial text;
alter table public.clientes add column if not exists bairro_residencial text;
alter table public.clientes add column if not exists cep_residencial text;
alter table public.clientes add column if not exists cidade_residencial text;
alter table public.clientes add column if not exists uf_residencial text;

-- Dados comerciais do cliente
alter table public.clientes add column if not exists empresa text;
alter table public.clientes add column if not exists email_comercial text;
alter table public.clientes add column if not exists contato_comercial text;
alter table public.clientes add column if not exists endereco_comercial text;
alter table public.clientes add column if not exists bairro_comercial text;
alter table public.clientes add column if not exists cep_comercial text;
alter table public.clientes add column if not exists cidade_comercial text;
alter table public.clientes add column if not exists uf_comercial text;

-- Dados do cônjuge (mesma estrutura do cliente)
alter table public.clientes add column if not exists conjuge_nome text;
alter table public.clientes add column if not exists conjuge_data_nascimento date;
alter table public.clientes add column if not exists conjuge_rg text;
alter table public.clientes add column if not exists conjuge_cpf text;
alter table public.clientes add column if not exists conjuge_celular1 text;
alter table public.clientes add column if not exists conjuge_celular2 text;
alter table public.clientes add column if not exists conjuge_email text;
alter table public.clientes add column if not exists conjuge_instagram text;
alter table public.clientes add column if not exists conjuge_profissao text;
alter table public.clientes add column if not exists conjuge_endereco_residencial text;
alter table public.clientes add column if not exists conjuge_bairro_residencial text;
alter table public.clientes add column if not exists conjuge_cep_residencial text;
alter table public.clientes add column if not exists conjuge_cidade_residencial text;
alter table public.clientes add column if not exists conjuge_uf_residencial text;
alter table public.clientes add column if not exists conjuge_empresa text;
alter table public.clientes add column if not exists conjuge_email_comercial text;
alter table public.clientes add column if not exists conjuge_contato_comercial text;
alter table public.clientes add column if not exists conjuge_endereco_comercial text;
alter table public.clientes add column if not exists conjuge_bairro_comercial text;
alter table public.clientes add column if not exists conjuge_cep_comercial text;
alter table public.clientes add column if not exists conjuge_cidade_comercial text;
alter table public.clientes add column if not exists conjuge_uf_comercial text;

-- Filhos: lista (nome + data de nascimento de cada um), guardada como lista de itens
alter table public.clientes add column if not exists filhos jsonb not null default '[]'::jsonb;

-- ---------- Projetos vinculados ao cliente (um cliente pode ter mais de um) ----------
create table if not exists public.cliente_projetos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  projeto_id uuid references public.projetos(id) on delete set null,
  endereco_obra text,
  bairro_obra text,
  cep_obra text,
  cidade_obra text,
  uf_obra text,
  created_at timestamp with time zone default now()
);

alter table public.cliente_projetos enable row level security;

drop policy if exists "ver cliente_projetos" on public.cliente_projetos;
create policy "ver cliente_projetos" on public.cliente_projetos for select using (auth.role() = 'authenticated');

drop policy if exists "criar cliente_projetos" on public.cliente_projetos;
create policy "criar cliente_projetos" on public.cliente_projetos for insert with check (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "editar cliente_projetos" on public.cliente_projetos;
create policy "editar cliente_projetos" on public.cliente_projetos for update using (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "apagar cliente_projetos" on public.cliente_projetos;
create policy "apagar cliente_projetos" on public.cliente_projetos for delete using (public.get_my_role() in ('admin', 'operador'));
