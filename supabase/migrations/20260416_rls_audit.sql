-- ══════════════════════════════════════════════════════════════
-- AUDITORIA RLS — Tabelas core de dados do utilizador
-- ══════════════════════════════════════════════════════════════
-- Estas 5 tabelas guardam dados pessoais do utilizador.
-- TODAS precisam de RLS com scoping por user_id = auth.uid().
-- Se a tabela já tiver RLS activo, os comandos são idempotentes.

-- ── 1. TRANSACTIONS ──────────────────────────────────────────
alter table public.transactions enable row level security;

drop policy if exists "tx_select_own" on public.transactions;
create policy "tx_select_own"
  on public.transactions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "tx_insert_own" on public.transactions;
create policy "tx_insert_own"
  on public.transactions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "tx_update_own" on public.transactions;
create policy "tx_update_own"
  on public.transactions for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "tx_delete_own" on public.transactions;
create policy "tx_delete_own"
  on public.transactions for delete to authenticated
  using (user_id = auth.uid());

-- ── 2. GOALS ─────────────────────────────────────────────────
alter table public.goals enable row level security;

drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own"
  on public.goals for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own"
  on public.goals for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own"
  on public.goals for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own"
  on public.goals for delete to authenticated
  using (user_id = auth.uid());

-- ── 3. INVESTMENTS ───────────────────────────────────────────
alter table public.investments enable row level security;

drop policy if exists "inv_select_own" on public.investments;
create policy "inv_select_own"
  on public.investments for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "inv_insert_own" on public.investments;
create policy "inv_insert_own"
  on public.investments for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "inv_update_own" on public.investments;
create policy "inv_update_own"
  on public.investments for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "inv_delete_own" on public.investments;
create policy "inv_delete_own"
  on public.investments for delete to authenticated
  using (user_id = auth.uid());

-- ── 4. INVESTMENT_ENTRIES ────────────────────────────────────
alter table public.investment_entries enable row level security;

drop policy if exists "ie_select_own" on public.investment_entries;
create policy "ie_select_own"
  on public.investment_entries for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "ie_insert_own" on public.investment_entries;
create policy "ie_insert_own"
  on public.investment_entries for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "ie_update_own" on public.investment_entries;
create policy "ie_update_own"
  on public.investment_entries for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "ie_delete_own" on public.investment_entries;
create policy "ie_delete_own"
  on public.investment_entries for delete to authenticated
  using (user_id = auth.uid());

-- ── 5. FUNDO_EMERGENCIA ─────────────────────────────────────
alter table public.fundo_emergencia enable row level security;

drop policy if exists "fe_select_own" on public.fundo_emergencia;
create policy "fe_select_own"
  on public.fundo_emergencia for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "fe_insert_own" on public.fundo_emergencia;
create policy "fe_insert_own"
  on public.fundo_emergencia for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "fe_update_own" on public.fundo_emergencia;
create policy "fe_update_own"
  on public.fundo_emergencia for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "fe_delete_own" on public.fundo_emergencia;
create policy "fe_delete_own"
  on public.fundo_emergencia for delete to authenticated
  using (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (corre após aplicar para confirmar)
-- ══════════════════════════════════════════════════════════════
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('transactions','goals','investments','investment_entries','fundo_emergencia',
--                     'subscriptions','referral_codes','referrals','feedback','beta_invites')
-- ORDER BY tablename;
-- → Todas devem ter rowsecurity = true.
