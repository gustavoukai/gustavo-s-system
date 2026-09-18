-- ============================================================
-- PARTE 53 — Categorias de fornecedor cadastráveis pelo próprio site
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

create table if not exists public.fornecedores_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamp with time zone default now()
);

insert into public.fornecedores_categorias (nome) values
  ('Acabamentos'),
  ('Acabamentos Elétricos'),
  ('Adegas'),
  ('Ar Condicionado'),
  ('Assessoria Execução de Obra - Cliente'),
  ('Áudio e Vídeo'),
  ('Automação'),
  ('Banho e Restauração'),
  ('Caixilhos'),
  ('Camas e Colchões'),
  ('Carpetes'),
  ('Churrasqueiras'),
  ('Coberturas metálicas'),
  ('Colocador Bloquete'),
  ('Colocador Papel de Parede'),
  ('Colocador Vinílico'),
  ('Construtora'),
  ('Cortinas'),
  ('Diversos'),
  ('Eletricista'),
  ('Eletros'),
  ('Eletrotécnico'),
  ('Empreiteiro'),
  ('Engenheiro Elétrico'),
  ('Estruturas Metálicas'),
  ('Fechamentos de Vidro'),
  ('Ferragens'),
  ('Galeria de Arte'),
  ('Içamento'),
  ('Iluminação'),
  ('Instalação Eletros'),
  ('Lareiras'),
  ('Limpeza Pós-obra'),
  ('Louças e Metais'),
  ('Marcenaria'),
  ('Marmoraria'),
  ('Mobiliário'),
  ('Mobiliário Corporativo'),
  ('Molduras Cimentícias'),
  ('Paisagismo'),
  ('Paisagista'),
  ('Papel de Parede'),
  ('Persianas'),
  ('Pintura'),
  ('Pintura Especial'),
  ('Piso de Madeira'),
  ('Piso Vinílico'),
  ('Planejados'),
  ('Polimento'),
  ('Poltronas Cinema'),
  ('Portas'),
  ('Portas Automáticas'),
  ('Produção'),
  ('Projeto – Cliente'),
  ('Quadros e Molduras'),
  ('Rede de Proteção'),
  ('Reembolso - Cliente'),
  ('Revestimentos'),
  ('Serralheria'),
  ('Sistemas de Aquecimento'),
  ('Snooker e Jogos'),
  ('Tapeçaria'),
  ('Tapetes'),
  ('Tecidos'),
  ('Telefonia e Internet'),
  ('Tintas'),
  ('Vidraçaria'),
  ('Energia Solar')
on conflict (nome) do nothing;

alter table public.fornecedores_categorias enable row level security;

drop policy if exists "ver categorias fornecedor" on public.fornecedores_categorias;
create policy "ver categorias fornecedor" on public.fornecedores_categorias for select using (auth.role() = 'authenticated');

drop policy if exists "criar categorias fornecedor" on public.fornecedores_categorias;
create policy "criar categorias fornecedor" on public.fornecedores_categorias for insert with check (public.get_my_role() in ('admin', 'operador', 'visualizante'));
