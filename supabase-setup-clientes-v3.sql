-- ============================================================
-- PARTE 7 — CEP com preenchimento automático (logradouro, número, complemento)
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- Endereço residencial do cliente
alter table public.clientes drop column if exists endereco_residencial;
alter table public.clientes add column if not exists logradouro_residencial text;
alter table public.clientes add column if not exists numero_residencial text;
alter table public.clientes add column if not exists complemento_residencial text;

-- Endereço comercial do cliente
alter table public.clientes drop column if exists endereco_comercial;
alter table public.clientes add column if not exists logradouro_comercial text;
alter table public.clientes add column if not exists numero_comercial text;
alter table public.clientes add column if not exists complemento_comercial text;
alter table public.clientes add column if not exists telefone_comercial text;

-- Endereço residencial do cônjuge
alter table public.clientes drop column if exists conjuge_endereco_residencial;
alter table public.clientes add column if not exists conjuge_logradouro_residencial text;
alter table public.clientes add column if not exists conjuge_numero_residencial text;
alter table public.clientes add column if not exists conjuge_complemento_residencial text;

-- Endereço comercial do cônjuge
alter table public.clientes drop column if exists conjuge_endereco_comercial;
alter table public.clientes add column if not exists conjuge_logradouro_comercial text;
alter table public.clientes add column if not exists conjuge_numero_comercial text;
alter table public.clientes add column if not exists conjuge_complemento_comercial text;

-- Endereço da obra (por projeto vinculado ao cliente)
alter table public.cliente_projetos drop column if exists endereco_obra;
alter table public.cliente_projetos add column if not exists logradouro_obra text;
alter table public.cliente_projetos add column if not exists numero_obra text;
alter table public.cliente_projetos add column if not exists complemento_obra text;
