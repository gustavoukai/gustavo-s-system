-- ============================================================
-- PARTE 57 — Cobranças parceladas: identificador do grupo de parcelas
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

alter table public.cobrancas add column if not exists grupo_id uuid;

create index if not exists cobrancas_grupo_id_idx on public.cobrancas (grupo_id);

-- Agrupa as cobranças parceladas que já existem: parcelas criadas juntas
-- (mesmo projeto, fornecedor/cliente, categoria, total de parcelas e mesmo
-- instante de criação) passam a ter o mesmo grupo.
with grupos as (
  select
    projeto_id, fornecedor_tipo, fornecedor_id, categoria, parcela_total, created_at,
    gen_random_uuid() as novo_grupo
  from public.cobrancas
  where parcela_total > 1 and grupo_id is null
  group by projeto_id, fornecedor_tipo, fornecedor_id, categoria, parcela_total, created_at
)
update public.cobrancas c
set grupo_id = g.novo_grupo
from grupos g
where c.grupo_id is null
  and c.parcela_total > 1
  and c.projeto_id = g.projeto_id
  and c.fornecedor_tipo = g.fornecedor_tipo
  and c.fornecedor_id is not distinct from g.fornecedor_id
  and c.categoria is not distinct from g.categoria
  and c.parcela_total = g.parcela_total
  and c.created_at = g.created_at;
