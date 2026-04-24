-- Flowstate — Tabela investment_contribs (contribuições líquidas por mês)
--
-- Contexto:
--   Até agora a tabela investment_entries guardava só o valor total do
--   ativo em cada mês. Isto mistura "quanto o mercado mexeu" com
--   "quanto o utilizador contribuiu", tornando impossível mostrar
--   valorização real (rendimento) separada das contribuições.
--
-- Solução:
--   Nova tabela investment_contribs(investment_id, month, amount) que
--   regista APENAS a contribuição líquida do utilizador nesse mês
--   (pode ser negativa se retirou). O valor de mercado continua em
--   investment_entries.
--
--   Derivados na app:
--     total_investido(ym) = soma de amount até ao mês ym
--     valorizacao(ym)     = investment_entries.value[ym] - total_investido(ym)
--     rendimento_%        = valorizacao / total_investido × 100
--
-- Migração dos dados existentes: feita no cliente de forma silenciosa
--   (opção A). Se um ativo tiver entries mas não tiver contribs, a app
--   assume investido = valor actual (valorização = 0 até o utilizador
--   começar a registar). Não backfill automático aqui.

create table if not exists public.investment_contribs (
  investment_id uuid not null references public.investments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  month         text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount        numeric(14,2) not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (investment_id, month)
);

create index if not exists investment_contribs_user_idx
  on public.investment_contribs (user_id);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.investment_contribs enable row level security;

drop policy if exists "ic_select_own" on public.investment_contribs;
create policy "ic_select_own"
  on public.investment_contribs for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "ic_insert_own" on public.investment_contribs;
create policy "ic_insert_own"
  on public.investment_contribs for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "ic_update_own" on public.investment_contribs;
create policy "ic_update_own"
  on public.investment_contribs for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "ic_delete_own" on public.investment_contribs;
create policy "ic_delete_own"
  on public.investment_contribs for delete to authenticated
  using (user_id = auth.uid());

-- ── VERIFICAÇÃO ─────────────────────────────────────────────────
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename = 'investment_contribs';
-- → rowsecurity = true
