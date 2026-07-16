-- ============================================================
-- COLE ESTE ARQUIVO INTEIRO NO "SQL Editor" DO SUPABASE
-- (passo detalhado no README.md)
-- ============================================================

-- 1. Tabela que guarda o nível de permissão de cada usuário
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  role text not null default 'visualizante',
  created_at timestamp with time zone default now()
);

-- 2. Segurança: cada usuário só pode ver o próprio perfil
alter table public.profiles enable row level security;

drop policy if exists "usuarios veem o proprio perfil" on public.profiles;
create policy "usuarios veem o proprio perfil"
  on public.profiles
  for select
  using (auth.uid() = id);

-- 3. Função e gatilho: toda vez que você criar um usuário novo
--    na aba Authentication, uma linha é criada aqui automaticamente,
--    já com o nível padrão "visualizante"
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'visualizante');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
