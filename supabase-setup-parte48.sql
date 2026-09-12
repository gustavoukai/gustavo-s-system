-- ============================================================
-- PARTE 48 — Corrige pagamentos que já estavam "Pago" antes da Parte 47
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

insert into public.pagamentos (conta_pagar_id, ano, mes, pagamento, referencia, recebedor, pagador, valor, data_pagamento)
select
  cp.id,
  cp.ano,
  cp.mes,
  cp.pagamento,
  case
    when cp.referencia_tipo = 'parcela' then cp.referencia
    else (array['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'])[
      case
        when cp.referencia_tipo = 'anterior' and cp.mes = 1 then 12
        when cp.referencia_tipo = 'anterior' then cp.mes - 1
        else cp.mes
      end
    ] || '/' || right(
      (case
        when cp.referencia_tipo = 'anterior' and cp.mes = 1 then (cp.ano - 1)
        else cp.ano
      end)::text, 2)
  end,
  cp.recebedor,
  cp.pagador,
  cp.valor_pago,
  cp.data_pagamento
from public.contas_pagar cp
where cp.status = 'pago'
  and not exists (select 1 from public.pagamentos p where p.conta_pagar_id = cp.id);
