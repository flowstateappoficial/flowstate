-- Flowstate user recurrings (despesas recorrentes geridas pelo utilizador)
-- Feature: Subscrições v2 — substitui o detect-only por entrada manual + checklist mensal
-- Nota: tabela `subscriptions` já existe e é usada para estado Stripe.
-- Esta tabela é diferente: trata das subscrições/recorrentes que o utilizador acompanha (Netflix, MEO, etc.)

create table if not exists public.user_recurrings (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  emoji             text not null default '💳',
  default_amount    numeric(10,2) not null default 0,
  is_variable       boolean not null default false,
  cadence           text not null default 'monthly'
                      check (cadence in ('monthly','quarterly','semiannual','annual')),
  day_of_period     int not null default 1
                      check (day_of_period between 1 and 31),
  category          text not null default 'util'
                      check (category in ('essencial','util','corte')),
  is_trial          boolean not null default false,
  trial_end_date    date,
  trial_reminded    boolean not null default false,
  cancelled_at      date,
  payments          jsonb not null default '{}'::jsonb,
  -- payments shape: { "2026-04": { "amount": 6.99, "paidAt": "2026-04-01T10:00:00Z", "txId": 123 }, ... }
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists user_recurrings_user_idx
  on public.user_recurrings(user_id);

create index if not exists user_recurrings_user_active_idx
  on public.user_recurrings(user_id) where cancelled_at is null;

-- ── RLS ──
alter table public.user_recurrings enable row level security;

drop policy if exists "rec_select_own"  on public.user_recurrings;
drop policy if exists "rec_insert_own"  on public.user_recurrings;
drop policy if exists "rec_update_own"  on public.user_recurrings;
drop policy if exists "rec_delete_own"  on public.user_recurrings;

create policy "rec_select_own"
  on public.user_recurrings for select
  using (auth.uid() = user_id);

create policy "rec_insert_own"
  on public.user_recurrings for insert
  with check (auth.uid() = user_id);

create policy "rec_update_own"
  on public.user_recurrings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "rec_delete_own"
  on public.user_recurrings for delete
  using (auth.uid() = user_id);

-- ── Trigger updated_at ──
create or replace function public.tg_user_recurrings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_user_recurrings_updated_at on public.user_recurrings;
create trigger trg_user_recurrings_updated_at
before update on public.user_recurrings
for each row execute function public.tg_user_recurrings_updated_at();
