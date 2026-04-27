-- Flowstate — Tabela fundo_contribs (contribuições líquidas para o FE por mês)
--
-- Contexto:
--   A tabela fundo_emergencia guardava só o valor total e a meta do FE em
--   cada mês. Mistura "quanto reforçaste" com "quanto vale hoje", impedindo
--   distinguir juros (DP, fundo monetário) das tuas contribuições.
--
-- Solução (espelha o que já fizemos para investment_contribs):
--   fundo_contribs(user_id, month, amount) regista APENAS a contribuição
--   líquida do utilizador nesse mês (negativa se retirou). O valor de
--   mercado/atual do FE continua em fundo_emergencia.
--
--   Derivados na app:
--     fe_investido(ym) = soma de amount até ao mês ym
--     fe_valorizacao(ym) = fundo_emergencia.value[ym] - fe_investido(ym)

create table if not exists public.fundo_contribs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  month      text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount     numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

create index if not exists fundo_contribs_user_idx
  on public.fundo_contribs (user_id);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.fundo_contribs enable row level security;

drop policy if exists "fc_select_own" on public.fundo_contribs;
create policy "fc_select_own"
  on public.fundo_contribs for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "fc_insert_own" on public.fundo_contribs;
create policy "fc_insert_own"
  on public.fundo_contribs for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "fc_update_own" on public.fundo_contribs;
create policy "fc_update_own"
  on public.fundo_contribs for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "fc_delete_own" on public.fundo_contribs;
create policy "fc_delete_own"
  on public.fundo_contribs for delete to authenticated
  using (user_id = auth.uid());
