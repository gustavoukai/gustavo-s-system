-- ============================================================
-- PARTE 9 — Backup automático do cadastro de clientes
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

-- Cria o espaço de armazenamento (bucket) privado para os backups
insert into storage.buckets (id, name, public)
values ('backups-clientes', 'backups-clientes', false)
on conflict (id) do nothing;

-- Quem pode ENVIAR um backup: Admin e Operador (mesma regra de quem pode salvar clientes)
drop policy if exists "enviar backups de clientes" on storage.objects;
create policy "enviar backups de clientes"
  on storage.objects for insert
  with check (bucket_id = 'backups-clientes' and public.get_my_role() in ('admin', 'operador'));

-- Quem pode SUBSTITUIR um backup existente: Admin e Operador
drop policy if exists "atualizar backups de clientes" on storage.objects;
create policy "atualizar backups de clientes"
  on storage.objects for update
  using (bucket_id = 'backups-clientes' and public.get_my_role() in ('admin', 'operador'));

-- Quem pode VER/ABRIR os backups: somente o Administrador
drop policy if exists "ver backups de clientes" on storage.objects;
create policy "ver backups de clientes"
  on storage.objects for select
  using (bucket_id = 'backups-clientes' and public.get_my_role() = 'admin');

-- Quem pode APAGAR um backup: somente o Administrador
drop policy if exists "apagar backups de clientes" on storage.objects;
create policy "apagar backups de clientes"
  on storage.objects for delete
  using (bucket_id = 'backups-clientes' and public.get_my_role() = 'admin');
