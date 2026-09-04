-- ============================================================
-- PARTE 43 — RH (Funcionários)
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  rg text,
  data_nascimento date,
  celular1 text not null,
  celular2 text,
  email text,
  instagram text,
  cargo text,
  data_admissao date,
  instituicao_ensino text,
  semestre_ano text,
  cep_residencial text,
  logradouro_residencial text,
  numero_residencial text,
  complemento_residencial text,
  bairro_residencial text,
  cidade_residencial text,
  uf_residencial text,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now()
);

alter table public.funcionarios enable row level security;

drop policy if exists "admin ve funcionarios" on public.funcionarios;
create policy "admin ve funcionarios" on public.funcionarios for select using (public.get_my_role() = 'admin');

drop policy if exists "admin cria funcionarios" on public.funcionarios;
create policy "admin cria funcionarios" on public.funcionarios for insert with check (public.get_my_role() = 'admin');

drop policy if exists "admin edita funcionarios" on public.funcionarios;
create policy "admin edita funcionarios" on public.funcionarios for update using (public.get_my_role() = 'admin');

drop policy if exists "admin apaga funcionarios" on public.funcionarios;
create policy "admin apaga funcionarios" on public.funcionarios for delete using (public.get_my_role() = 'admin');
