-- ============================================================
-- PARTE 47 — Pagamentos (gerados automaticamente a partir de Contas a Pagar "Pago")
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  conta_pagar_id uuid unique references public.contas_pagar(id) on delete cascade,
  ano integer not null,
  mes integer not null,
  pagamento text,
  referencia text,
  recebedor text,
  pagador text,
  valor numeric(12,2),
  data_pagamento text,
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now()
);

alter table public.pagamentos enable row level security;

drop policy if exists "ver pagamentos" on public.pagamentos;
create policy "ver pagamentos" on public.pagamentos for select using (auth.role() = 'authenticated');

drop policy if exists "criar pagamentos" on public.pagamentos;
create policy "criar pagamentos" on public.pagamentos for insert with check (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "editar pagamentos" on public.pagamentos;
create policy "editar pagamentos" on public.pagamentos for update using (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "apagar pagamentos" on public.pagamentos;
create policy "apagar pagamentos" on public.pagamentos for delete using (public.get_my_role() in ('admin', 'operador'));
