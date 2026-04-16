-- Flowstate subscriptions table
-- Single source of truth for a user's subscription state, synced from Stripe via webhook.

create table if not exists public.subscriptions (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_sub_id      text unique,
  plan               text not null default 'free',       -- 'free' | 'plus' | 'max'
  status             text not null default 'none',       -- 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'
  billing_interval   text,                               -- 'month' | 'year' | null
  current_period_end timestamptz,
  trial_end          timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at         timestamptz not null default now()
);

-- RLS: user can only read their own row. Writes happen only from service_role (the webhook).
alter table public.subscriptions enable row level security;

drop policy if exists "sub_select_own" on public.subscriptions;
create policy "sub_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies for authenticated users on purpose.
-- All mutations flow through the service_role key inside the Edge Function.

create index if not exists subscriptions_customer_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_sub_idx      on public.subscriptions(stripe_sub_id);

-- Trigger: keep updated_at fresh.
create or replace function public.tg_subscriptions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.tg_subscriptions_updated_at();
