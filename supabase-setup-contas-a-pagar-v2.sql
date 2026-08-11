-- ============================================================
-- PARTE 24 — Ajustes em Contas a Pagar (referência automática)
-- Cole este arquivo inteiro no "SQL Editor" do Supabase e clique em Run.
-- ============================================================

alter table public.contas_pagar add column if not exists referencia_tipo text;
