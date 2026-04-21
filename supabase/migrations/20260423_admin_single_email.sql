-- ══════════════════════════════════════════════════════════════
-- RESTRIÇÃO: único admin é flowstate.app.oficial@gmail.com
-- ══════════════════════════════════════════════════════════════
-- Remove claudionobre8@gmail.com da whitelist em:
--   1. fs_end_beta() RPC
--   2. RLS policies da tabela beta_invites
-- ══════════════════════════════════════════════════════════════

-- ── 1. fs_end_beta (substitui a versão de 20260422) ──
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
  v_caller_email := auth.jwt()->>'email';
  if v_caller_email <> 'flowstate.app.oficial@gmail.com' then
    raise exception 'not_authorized';
  end if;

  select (value->>'at')::timestamptz into v_already_ended
  from fs_app_settings where key = 'beta_ended_at';

  if v_already_ended is not null then
    return jsonb_build_object(
      'status', 'already_ended',
      'ended_at', v_already_ended
    );
  end if;

  update fs_pending_rewards
  set delivered_at = now()
  where delivered_at is null;

  get diagnostics v_users_affected = row_count;

  select count(distinct user_id) into v_users_affected
  from fs_pending_rewards
  where delivered_at is not null and redeemed_at is null;

  select
    coalesce(sum(quantity) filter (where reward_type = 'plus_month_free'), 0),
    coalesce(sum(quantity) filter (where reward_type = 'trial_extension_7d'), 0) * 7
  into v_total_plus_months, v_total_trial_days
  from fs_pending_rewards
  where delivered_at is not null and redeemed_at is null;

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

-- ── 2. RLS policies em beta_invites ──
-- Recria as duas policies admin com whitelist de 1 só email.
drop policy if exists "admin_select_invites" on public.beta_invites;
create policy "admin_select_invites"
  on public.beta_invites for select to authenticated
  using (auth.jwt()->>'email' = 'flowstate.app.oficial@gmail.com');

drop policy if exists "admin_update_invites" on public.beta_invites;
create policy "admin_update_invites"
  on public.beta_invites for update to authenticated
  using (auth.jwt()->>'email' = 'flowstate.app.oficial@gmail.com');
