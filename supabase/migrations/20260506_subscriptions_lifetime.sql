-- Flowstate beta grandfathering: marca utilizadores beta com Plus vitalício
-- Adiciona coluna is_lifetime à tabela subscriptions (que já existe para estado Stripe).
-- O cliente verifica este flag em effectivePlan() e devolve 'plus' independentemente
-- do estado Stripe ou trial. Os beta-testers ficam com Plus para sempre, sem cobrança.

alter table public.subscriptions
  add column if not exists is_lifetime boolean not null default false;

create index if not exists subscriptions_lifetime_idx
  on public.subscriptions(is_lifetime) where is_lifetime = true;

-- ── RLS já existe para subscriptions (rec_select_own etc.). Adicionar política
--    explícita para SELECT do is_lifetime continua a funcionar via política existente.

-- ── NOTA OPERACIONAL ──
-- Quando "Terminar Beta" for carregado, correr SQL one-shot para marcar todos os
-- utilizadores beta-testers actuais como lifetime. Exemplo (NÃO correr ainda):
--
--   update public.subscriptions
--      set is_lifetime = true
--    where user_id in (
--      select id from auth.users
--       where created_at < (select beta_ended_at from public.fs_app_settings limit 1)
--    );
--
-- Ou marcar manualmente por user_id se preferires controlo explícito.
