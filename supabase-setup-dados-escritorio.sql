-- ============================================================
-- PARTE 29 — Dados do Escritório
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

create table if not exists public.dados_escritorio (
  id integer primary key default 1,
  nome_escritorio text,
  endereco_linha1 text,
  endereco_linha2 text,
  endereco_linha3 text,
  email text,
  telefone text,
  razao_social text,
  cnpj text,
  ie text,
  banco1_titulo text,
  banco1_titular text,
  banco1_cpf text,
  banco1_banco text,
  banco1_agencia text,
  banco1_conta text,
  banco1_pix text,
  banco2_titulo text,
  banco2_titular text,
  banco2_cnpj text,
  banco2_banco text,
  banco2_agencia text,
  banco2_conta text,
  banco2_pix text,
  atualizado_em timestamp with time zone default now()
);

insert into public.dados_escritorio (
  id, nome_escritorio, endereco_linha1, endereco_linha2, endereco_linha3, email, telefone,
  razao_social, cnpj, ie,
  banco1_titulo, banco1_titular, banco1_cpf, banco1_banco, banco1_agencia, banco1_conta, banco1_pix,
  banco2_titulo, banco2_titular, banco2_cnpj, banco2_banco, banco2_agencia, banco2_conta, banco2_pix
) values (
  1, 'Taneli Ukai Arquitetura', 'Av. Onze de Junho, 1070, cj. 711', 'Vila Clementino - 04041-004', 'São Paulo - SP',
  'contato@taneliukai.com', '11 999372165',
  'Taneli Ukai Decoração de Interiores Ltda', '18.176.985/0001-76', 'isenta',
  'PARA PAGAMENTO COM NF', 'Gustavo Hideo dos Anjos Ukai', '318.609.998-67', 'Banco XP SA (348)', '0001', '1538465-0', 'ac36ec3e-996a-4afa-ae72-2e3ae6134d5c',
  'PARA PAGAMENTO COM NF', 'Taneli Ukai Decoração de Interiores Ltda', '18.176.985/0001-76', 'Banco XP SA (348)', '0001', '1954336-7', '11921811163'
)
on conflict (id) do nothing;

alter table public.dados_escritorio enable row level security;

drop policy if exists "ver dados_escritorio" on public.dados_escritorio;
create policy "ver dados_escritorio" on public.dados_escritorio for select using (auth.role() = 'authenticated');

drop policy if exists "editar dados_escritorio" on public.dados_escritorio;
create policy "editar dados_escritorio" on public.dados_escritorio for update using (public.get_my_role() = 'admin');
