-- ============================================================
-- PARTE 61 — Conta do pagamento nas cobranças e Notas para Admin/Sócio/Operador
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

-- 1) Conta bancária em que o pagamento aconteceu
alter table public.cobrancas add column if not exists pagamento_conta text;

-- 2) Notas: agora Admin, Sócio e Operador (notas "particulares" só o autor vê)
drop policy if exists "ver notas" on public.notas;
create policy "ver notas" on public.notas for select
  using (public.get_my_role() in ('admin', 'socio', 'operador') and (not privada or user_id = auth.uid()));

drop policy if exists "criar notas" on public.notas;
create policy "criar notas" on public.notas for insert
  with check (public.get_my_role() in ('admin', 'socio', 'operador') and user_id = auth.uid());

drop policy if exists "editar notas" on public.notas;
create policy "editar notas" on public.notas for update
  using (public.get_my_role() in ('admin', 'socio', 'operador') and (not privada or user_id = auth.uid()))
  with check (public.get_my_role() in ('admin', 'socio', 'operador') and (not privada or user_id = auth.uid()));

drop policy if exists "apagar notas" on public.notas;
create policy "apagar notas" on public.notas for delete
  using (public.get_my_role() in ('admin', 'socio', 'operador') and (not privada or user_id = auth.uid()));
