-- ============================================================
-- PARTE 59 — Novo nível de usuário: Sócio
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- Pode rodar mais de uma vez sem problema.
--
-- O Sócio passa a ter tudo que o Operador tem, e mais: apagar registros,
-- editar os Dados do Escritório e acessar o RH. Continuam só do Admin:
-- Usuários, Log de Acessos, Backups e os valores de VT/KM da Equipe.
-- ============================================================

-- 1) Em todas as tabelas, inclui o Sócio onde o Operador já tinha permissão
--    e onde só o Admin tinha (apagar, RH, Dados do Escritório etc.).
--    Ficam de fora (só Admin): perfis de usuários, log de acessos e valores de VT/KM.
do $$
declare
  r record;
  nova_qual text;
  novo_check text;
  comando text;
begin
  for r in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') like '%get_my_role%' or coalesce(with_check, '') like '%get_my_role%')
      and tablename not in ('profiles', 'acessos_log', 'equipe_config')
  loop
    nova_qual := r.qual;
    novo_check := r.with_check;

    if nova_qual is not null and nova_qual not like '%''socio''%' then
      if nova_qual like '%''operador''::text%' then
        nova_qual := replace(nova_qual, '''operador''::text', '''operador''::text, ''socio''::text');
      elsif nova_qual like '%= ''admin''::text%' then
        nova_qual := replace(nova_qual, '= ''admin''::text', '= ANY (ARRAY[''admin''::text, ''socio''::text])');
      end if;
    end if;

    if novo_check is not null and novo_check not like '%''socio''%' then
      if novo_check like '%''operador''::text%' then
        novo_check := replace(novo_check, '''operador''::text', '''operador''::text, ''socio''::text');
      elsif novo_check like '%= ''admin''::text%' then
        novo_check := replace(novo_check, '= ''admin''::text', '= ANY (ARRAY[''admin''::text, ''socio''::text])');
      end if;
    end if;

    if nova_qual is distinct from r.qual or novo_check is distinct from r.with_check then
      comando := format('alter policy %I on public.%I', r.policyname, r.tablename);
      if nova_qual is not null then
        comando := comando || ' using (' || nova_qual || ')';
      end if;
      if novo_check is not null then
        comando := comando || ' with check (' || novo_check || ')';
      end if;
      begin
        execute comando;
      exception when others then
        raise notice 'Não foi possível ajustar a política "%" da tabela %: %', r.policyname, r.tablename, sqlerrm;
      end;
    end if;
  end loop;
end $$;

-- 2) Backups em PDF: o Sócio também precisa poder gerar a cópia ao salvar
--    clientes/fornecedores (ver e apagar os backups continua só do Admin).
drop policy if exists "enviar backups de clientes" on storage.objects;
create policy "enviar backups de clientes"
  on storage.objects for insert
  with check (bucket_id = 'backups-clientes' and public.get_my_role() in ('admin', 'socio', 'operador'));

drop policy if exists "atualizar backups de clientes" on storage.objects;
create policy "atualizar backups de clientes"
  on storage.objects for update
  using (bucket_id = 'backups-clientes' and public.get_my_role() in ('admin', 'socio', 'operador'));

drop policy if exists "enviar backups de fornecedores" on storage.objects;
create policy "enviar backups de fornecedores"
  on storage.objects for insert
  with check (bucket_id = 'backups-fornecedores' and public.get_my_role() in ('admin', 'socio', 'operador'));

drop policy if exists "atualizar backups de fornecedores" on storage.objects;
create policy "atualizar backups de fornecedores"
  on storage.objects for update
  using (bucket_id = 'backups-fornecedores' and public.get_my_role() in ('admin', 'socio', 'operador'));

-- 3) Conferência: o segundo número deve ser 0.
select
  (select count(*) from pg_policies
    where schemaname in ('public', 'storage')
      and (coalesce(qual, '') like '%socio%' or coalesce(with_check, '') like '%socio%')) as politicas_com_socio,
  (select count(*) from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') like '%get_my_role%' or coalesce(with_check, '') like '%get_my_role%')
      and tablename not in ('profiles', 'acessos_log', 'equipe_config')
      and coalesce(qual, '') || coalesce(with_check, '') not like '%socio%') as faltando_ajustar_deve_ser_zero;
