-- ============================================================
-- PARTE 23 — Contas a Pagar
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- Anos disponíveis para escolher (você pode ir criando mais com o botão "Criar ano")
create table if not exists public.contas_pagar_anos (
  ano integer primary key
);

insert into public.contas_pagar_anos (ano) values (2025), (2026), (2027)
on conflict (ano) do nothing;

alter table public.contas_pagar_anos enable row level security;

drop policy if exists "ver anos" on public.contas_pagar_anos;
create policy "ver anos" on public.contas_pagar_anos for select using (auth.role() = 'authenticated');

drop policy if exists "criar anos" on public.contas_pagar_anos;
create policy "criar anos" on public.contas_pagar_anos for insert with check (public.get_my_role() in ('admin', 'operador'));

-- Contas a pagar
create table if not exists public.contas_pagar (
  id uuid primary key default gen_random_uuid(),
  ano integer not null,
  mes integer not null,
  pagamento text,
  referencia text,
  recebedor text,
  pagador text,
  dia_vencimento integer,
  status text,
  data_pagamento text,
  valor_pago numeric(12,2),
  valor_previsto numeric(12,2),
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now()
);

alter table public.contas_pagar enable row level security;

drop policy if exists "ver contas_pagar" on public.contas_pagar;
create policy "ver contas_pagar" on public.contas_pagar for select using (auth.role() = 'authenticated');

drop policy if exists "criar contas_pagar" on public.contas_pagar;
create policy "criar contas_pagar" on public.contas_pagar for insert with check (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "editar contas_pagar" on public.contas_pagar;
create policy "editar contas_pagar" on public.contas_pagar for update using (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "apagar contas_pagar" on public.contas_pagar;
create policy "apagar contas_pagar" on public.contas_pagar for delete using (public.get_my_role() = 'admin');
