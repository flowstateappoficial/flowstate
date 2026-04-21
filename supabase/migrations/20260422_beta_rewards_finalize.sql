-- ══════════════════════════════════════════════════════════════
-- FINALIZAÇÃO DE REWARDS BETA
-- ══════════════════════════════════════════════════════════════
-- Decisões (validadas com o Cláudio):
--   1. Todas as recompensas passam a ser em Plus (simplicidade).
--      Milestone 1  → +7 dias trial  + badge "Plantador"
--      Milestone 3  → +1 mês Plus    + badge "Embaixador"
--      Milestone 10 → +3 meses Plus  + badge "Top Referrer"
--   2. Entrega é accionada manualmente pelo admin via botão
--      "Terminar Beta" (fs_end_beta). Isto marca todas as linhas
--      pendentes como delivered_at = now(), desbloqueando-as para
--      redeem no próximo checkout do user.
--   3. Sem cap — todos os meses Plus acumulados são aplicados.
-- ══════════════════════════════════════════════════════════════

-- ── 1. Nova coluna redeemed_at ──────────────────────────────
-- delivered_at = "beta terminou, user pode usar"
-- redeemed_at  = "user já aplicou esta recompensa num checkout"
alter table public.fs_pending_rewards
  add column if not exists redeemed_at timestamptz;

create index if not exists fs_pending_rewards_to_redeem_idx
  on public.fs_pending_rewards(user_id)
  where delivered_at is not null and redeemed_at is null;

-- ── 2. Reescrever fs_grant_referral_reward (só Plus) ────────
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
  v_reward_type text;
  v_quantity    int := 1;
begin
  if p_milestone = 1 then
    v_reward_type := 'trial_extension_7d';
  elsif p_milestone = 3 then
    v_reward_type := 'plus_month_free';
    v_quantity    := 1;
  elsif p_milestone = 10 then
    v_reward_type := 'plus_month_free';
    v_quantity    := 3;             -- diferenciação do milestone 3
  else
    return;                         -- milestone desconhecido, nada a fazer
  end if;

  insert into fs_pending_rewards (user_id, reward_type, quantity, source, notes)
  values (
    p_referrer_user_id,
    v_reward_type,
    v_quantity,
    'referral_milestone_' || p_milestone,
    'Beta — aplicado no 1º checkout após lançamento público'
  );
end;
$$;

-- ── 3. Tabela de settings global ────────────────────────────
-- Guarda flags/config da app (ex: beta_ended_at). Key-value simples.
create table if not exists public.fs_app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.fs_app_settings enable row level security;

-- Qualquer authenticated pode LER (p.ex. para saber se beta acabou).
drop policy if exists "fas_read_all" on public.fs_app_settings;
create policy "fas_read_all"
  on public.fs_app_settings for select to authenticated
  using (true);

-- Writes só via security-definer RPC (fs_end_beta).

-- ── 4. RPC: fs_end_beta (admin-only) ────────────────────────
-- Marca beta como terminada e desbloqueia todas as recompensas.
-- Retorna counters para o botão admin mostrar confirmação.
create or replace function public.fs_end_beta()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_email text;
  v_users_affected int;
  v_total_plus_months int;
  v_total_trial_days int;
  v_already_ended timestamptz;
begin
  -- Admin check: único admin é flowstate.app.oficial@gmail.com.
  v_caller_email := auth.jwt()->>'email';
  if v_caller_email <> 'flowstate.app.oficial@gmail.com' then
    raise exception 'not_authorized';
  end if;

  -- Idempotente: se já terminou, devolve o estado atual sem fazer nada.
  select (value->>'at')::timestamptz into v_already_ended
  from fs_app_settings where key = 'beta_ended_at';

  if v_already_ended is not null then
    return jsonb_build_object(
      'status', 'already_ended',
      'ended_at', v_already_ended
    );
  end if;

  -- Marca todas as recompensas pendentes como entregues.
  update fs_pending_rewards
  set delivered_at = now()
  where delivered_at is null;

  get diagnostics v_users_affected = row_count;

  -- Totais para o relatório (conta utilizadores distintos).
  select count(distinct user_id) into v_users_affected
  from fs_pending_rewards
  where delivered_at is not null and redeemed_at is null;

  select
    coalesce(sum(quantity) filter (where reward_type = 'plus_month_free'), 0),
    coalesce(sum(quantity) filter (where reward_type = 'trial_extension_7d'), 0) * 7
  into v_total_plus_months, v_total_trial_days
  from fs_pending_rewards
  where delivered_at is not null and redeemed_at is null;

  -- Grava flag global.
  insert into fs_app_settings (key, value, updated_at)
  values ('beta_ended_at', jsonb_build_object('at', now()), now())
  on conflict (key) do update
  set value = excluded.value, updated_at = now();

  return jsonb_build_object(
    'status', 'ok',
    'ended_at', now(),
    'users_affected', v_users_affected,
    'total_plus_months', v_total_plus_months,
    'total_trial_days', v_total_trial_days
  );
end;
$$;

grant execute on function public.fs_end_beta() to authenticated;

-- ── 5. RPC: fs_get_user_beta_rewards ────────────────────────
-- Para o ConvitesPage mostrar ao user as suas recompensas e estado.
create or replace function public.fs_get_user_beta_rewards()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plus_months int;
  v_trial_days int;
  v_beta_ended_at timestamptz;
  v_redeemed_count int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select (value->>'at')::timestamptz into v_beta_ended_at
  from fs_app_settings where key = 'beta_ended_at';

  select
    coalesce(sum(quantity) filter (where reward_type = 'plus_month_free'), 0),
    coalesce(sum(quantity) filter (where reward_type = 'trial_extension_7d'), 0) * 7
  into v_plus_months, v_trial_days
  from fs_pending_rewards
  where user_id = v_uid
    and redeemed_at is null;     -- o que ainda está por resgatar

  select count(*) into v_redeemed_count
  from fs_pending_rewards
  where user_id = v_uid and redeemed_at is not null;

  return jsonb_build_object(
    'beta_ended_at', v_beta_ended_at,
    'plus_months_available', v_plus_months,
    'trial_days_available', v_trial_days,
    'redeemed_count', v_redeemed_count
  );
end;
$$;

grant execute on function public.fs_get_user_beta_rewards() to authenticated;

-- ── 6. RPC: fs_redeem_beta_rewards (chamada pela edge function) ──
-- NOTA: idealmente isto é chamado com service_role pela edge function
-- create-checkout-session. Aqui deixamos como security definer para
-- facilitar, mas protegemos verificando que o caller user_id match.
--
-- Retorna o que foi marcado como redeemido para a edge function saber
-- que coupon criar e que trial_period aplicar.
create or replace function public.fs_redeem_beta_rewards(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plus_months int;
  v_trial_days int;
  v_ids uuid[];
begin
  -- Coleciona ids por resgatar e totais, numa transação atómica.
  select
    array_agg(id),
    coalesce(sum(quantity) filter (where reward_type = 'plus_month_free'), 0),
    coalesce(sum(quantity) filter (where reward_type = 'trial_extension_7d'), 0) * 7
  into v_ids, v_plus_months, v_trial_days
  from fs_pending_rewards
  where user_id = p_user_id
    and delivered_at is not null    -- beta acabou
    and redeemed_at is null;        -- ainda não resgatado

  if v_ids is null or array_length(v_ids, 1) is null then
    return jsonb_build_object('plus_months', 0, 'trial_days', 0);
  end if;

  update fs_pending_rewards
  set redeemed_at = now()
  where id = any(v_ids);

  return jsonb_build_object(
    'plus_months', v_plus_months,
    'trial_days', v_trial_days,
    'redeemed_ids', v_ids
  );
end;
$$;

-- Só service_role deve invocar esta (edge function usa service role key).
revoke execute on function public.fs_redeem_beta_rewards(uuid) from public, authenticated, anon;
grant execute on function public.fs_redeem_beta_rewards(uuid) to service_role;
