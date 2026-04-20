-- ══════════════════════════════════════════════════════════════
-- REFERRALS BETA — Lógica ajustada para beta fechada
-- ══════════════════════════════════════════════════════════════
-- Durante a beta:
--   • Código de referral também dá acesso à beta (sem precisar de FS-XXXXXX)
--   • Ativação = registo + 3 transações criadas
--   • Recompensas ao referrer são badges + acumulação para launch
--   • Meses grátis Max são entregues no lançamento público
-- ══════════════════════════════════════════════════════════════

-- ── RPC: Validar código de referral (pré-signup, AuthPage) ──
-- Permite à AuthPage aceitar código de referral como bilhete de entrada na beta.
create or replace function public.fs_validate_referral_code(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from referral_codes
    where code = upper(trim(p_code))
  );
$$;

grant execute on function public.fs_validate_referral_code(text) to anon, authenticated;

-- ── Tabela: Recompensas pendentes (entregues no launch) ──
-- Durante a beta, em vez de entregar os meses Max grátis imediatamente,
-- acumulamos aqui e entregamos quando o utilizador ativar a subscrição no launch.
create table if not exists public.fs_pending_rewards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  reward_type   text not null,        -- 'max_month_free' | 'plus_month_free' | 'trial_extension_7d'
  quantity      int  not null default 1,
  source        text,                  -- 'referral_milestone_3' | 'referral_milestone_10' | etc
  earned_at     timestamptz not null default now(),
  delivered_at  timestamptz,           -- null = ainda por entregar
  notes         text
);

alter table public.fs_pending_rewards enable row level security;

drop policy if exists "fpr_select_own" on public.fs_pending_rewards;
create policy "fpr_select_own"
  on public.fs_pending_rewards for select to authenticated
  using (auth.uid() = user_id);

create index if not exists fs_pending_rewards_user_idx
  on public.fs_pending_rewards(user_id);
create index if not exists fs_pending_rewards_undelivered_idx
  on public.fs_pending_rewards(user_id) where delivered_at is null;

-- ── Função: Conceder badge + possível recompensa pendente ──
-- Chamada quando uma referral transita para 'activated' ou 'rewarded'.
create or replace function public.fs_grant_referral_reward(
  p_referrer_user_id uuid,
  p_milestone int                       -- 1, 3, 10
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_badge text;
  v_reward_type text;
begin
  -- Badge por milestone.
  if p_milestone = 3 then
    v_badge := 'ambassador';
    v_reward_type := 'plus_month_free';  -- 1 mês Plus, entregue no launch
  elsif p_milestone = 10 then
    v_badge := 'top_referrer';
    v_reward_type := 'max_month_free';   -- 1 mês Max, entregue no launch
  else
    v_badge := null;
    v_reward_type := 'trial_extension_7d';
  end if;

  -- Acumula recompensa pendente (entregue no launch público).
  if v_reward_type is not null then
    insert into fs_pending_rewards (user_id, reward_type, quantity, source, notes)
    values (
      p_referrer_user_id,
      v_reward_type,
      1,
      'referral_milestone_' || p_milestone,
      'Beta — entregue no lançamento público'
    );
  end if;
end;
$$;

-- ── Função: Ativar referral quando refereee atinge 3 transações ──
-- Chamada pelo trigger na tabela de transações.
create or replace function public.fs_check_referral_activation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_referral_id uuid;
  v_referrer_id uuid;
  v_accepted_count int;
begin
  -- Conta transações do utilizador.
  select count(*) into v_count
  from transactions
  where user_id = new.user_id;

  -- Só interessa exatamente quando chega às 3 (ativar uma única vez).
  if v_count <> 3 then
    return new;
  end if;

  -- Procura referral pendente onde este user é o referido.
  select id, referrer_user_id into v_referral_id, v_referrer_id
  from referrals
  where referred_user_id = new.user_id
    and status = 'pending'
  limit 1;

  if v_referral_id is null then
    return new;
  end if;

  -- Marca como ativada.
  update referrals
  set status = 'activated',
      activated_at = now()
  where id = v_referral_id;

  -- Conta quantas ativações totais tem o referrer (após esta).
  select count(*) into v_accepted_count
  from referrals
  where referrer_user_id = v_referrer_id
    and status in ('activated', 'rewarded');

  -- Milestone 1: +7 dias trial pendente
  if v_accepted_count = 1 then
    perform fs_grant_referral_reward(v_referrer_id, 1);
  end if;

  -- Milestone 3: badge Embaixador + 1 mês Plus pendente
  if v_accepted_count = 3 then
    perform fs_grant_referral_reward(v_referrer_id, 3);
    update referrals
    set status = 'rewarded',
        rewarded_at = now(),
        reward_details = jsonb_build_object('badge', 'ambassador', 'milestone', 3)
    where id = v_referral_id;
  end if;

  -- Milestone 10: badge Top Referrer + 1 mês Max pendente
  if v_accepted_count = 10 then
    perform fs_grant_referral_reward(v_referrer_id, 10);
    update referrals
    set status = 'rewarded',
        rewarded_at = now(),
        reward_details = jsonb_build_object('badge', 'top_referrer', 'milestone', 10)
    where id = v_referral_id;
  end if;

  return new;
end;
$$;

-- ── Trigger: dispara depois de cada INSERT em transactions ──
-- Só ativa referrals — não altera a transação.
drop trigger if exists trg_fs_check_referral_activation on public.transactions;
create trigger trg_fs_check_referral_activation
  after insert on public.transactions
  for each row
  execute function public.fs_check_referral_activation();

-- ── View: Recompensas pendentes por utilizador (para ConvitesPage) ──
create or replace view public.fs_user_pending_rewards as
select
  user_id,
  count(*) filter (where reward_type = 'max_month_free' and delivered_at is null) as max_months_pending,
  count(*) filter (where reward_type = 'plus_month_free' and delivered_at is null) as plus_months_pending,
  count(*) filter (where reward_type = 'trial_extension_7d' and delivered_at is null) as trial_days_pending_weeks
from fs_pending_rewards
group by user_id;

grant select on public.fs_user_pending_rewards to authenticated;
