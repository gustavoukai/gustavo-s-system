-- ============================================================
-- PARTE 63 — Conta da cobrança vira o Recebedor dos recebimentos já existentes
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- Pode rodar mais de uma vez sem problema.
-- ============================================================

-- Preenche o Recebedor (só onde está vazio) com a Conta informada na cobrança.
update public.recebimentos r
set recebedor = btrim(c.pagamento_conta)
from public.cobrancas c
where r.cobranca_id = c.id
  and coalesce(btrim(c.pagamento_conta), '') <> ''
  and coalesce(btrim(r.recebedor), '') = '';
