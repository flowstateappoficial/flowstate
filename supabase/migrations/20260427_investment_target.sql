-- Flowstate — Adicionar coluna target_amount à tabela investments
--
-- Permite ao utilizador definir uma meta opcional por cada ativo de
-- investimento (ex: "quero chegar aos 10.000€ neste ETF"). Mostra barra
-- de progresso no card do ativo quando target_amount > 0.

alter table public.investments
  add column if not exists target_amount numeric(14,2) not null default 0;
