-- ============================================================
-- PARTE 27 — Cobranças
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

create table if not exists public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  fornecedor_tipo text not null check (fornecedor_tipo in ('cliente', 'fornecedor')),
  fornecedor_id uuid references public.fornecedores(id) on delete set null,
  categoria text,
  parcela_atual integer,
  parcela_total integer,
  percentual numeric(6,2),
  pedido_salvo text,
  pedido_numero text,
  pedido_data text,
  pedido_valor numeric(12,2),
  pagamento_valor numeric(12,2),
  pagamento_status text,
  pagamento_data text,
  pagamento_previsao text,
  nf text,
  nf_numero text,
  nf_emissao text,
  nf_envio text,
  fidelidade_programa text,
  fidelidade_status text,
  observacoes text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  atualizado_em timestamp with time zone not null default now()
);

alter table public.cobrancas enable row level security;

drop policy if exists "ver cobrancas" on public.cobrancas;
create policy "ver cobrancas" on public.cobrancas for select using (auth.role() = 'authenticated');

drop policy if exists "criar cobrancas" on public.cobrancas;
create policy "criar cobrancas" on public.cobrancas for insert with check (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "editar cobrancas" on public.cobrancas;
create policy "editar cobrancas" on public.cobrancas for update using (public.get_my_role() in ('admin', 'operador'));

drop policy if exists "apagar cobrancas" on public.cobrancas;
create policy "apagar cobrancas" on public.cobrancas for delete using (public.get_my_role() = 'admin');
