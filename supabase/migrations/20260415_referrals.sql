-- Flowstate — Referral system
-- Two tables:
--   referral_codes: stable, unique code per user (used as their share URL).
--   referrals: one row per invite sent/accepted, tracks status + reward.

-- ── referral_codes ──────────────────────────────────────────────────────────
create table if not exists public.referral_codes (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code       text unique not null,
  created_at timestamptz not null default now()
);

alter table public.referral_codes enable row level security;

drop policy if exists "rc_select_own" on public.referral_codes;
create policy "rc_select_own"
  on public.referral_codes for select
  using (auth.uid() = user_id);

-- Anyone authenticated can look up a code → user mapping (needed to apply a referral at signup).
drop policy if exists "rc_select_lookup" on public.referral_codes;
create policy "rc_select_lookup"
  on public.referral_codes for select
  using (true);

-- Writes only via security definer function (see below).

create index if not exists referral_codes_code_idx on public.referral_codes(code);

-- ── referrals ──────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references auth.users(id) on delete cascade,
  referred_user_id  uuid references auth.users(id) on delete set null,
  code              text not null,
  status            text not null default 'pending',  -- 'pending' | 'activated' | 'rewarded'
  referred_email    text,
  created_at        timestamptz not null default now(),
  activated_at      timestamptz,
  rewarded_at       timestamptz,
  reward_details    jsonb,
  unique (referrer_user_id, referred_user_id)
);

alter table public.referrals enable row level security;

drop policy if exists "ref_select_own" on public.referrals;
create policy "ref_select_own"
  on public.referrals for select
  using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

-- No direct insert/update/delete policies; mutations flow through security-definer RPCs
-- or the service_role key in edge functions.

create index if not exists referrals_referrer_idx on public.referrals(referrer_user_id);
create index if not exists referrals_referred_idx on public.referrals(referred_user_id);
create index if not exists referrals_status_idx   on public.referrals(status);

-- ── Helpers ────────────────────────────────────────────────────────────────

-- Generate a referral code from email: FLOW + 6 chars (email prefix, alnum, upper) + 3 chars hash.
create or replace function public.fs_generate_referral_code(p_email text)
returns text language plpgsql immutable as $$
declare
  base_part text;
  hash_part text;
begin
  base_part := upper(regexp_replace(split_part(coalesce(p_email, ''), '@', 1), '[^a-zA-Z0-9]', '', 'g'));
  base_part := substring(base_part, 1, 6);
  if length(base_part) = 0 then
    base_part := 'USER' || to_char(floor(random() * 100)::int, 'FM00');
  end if;
  hash_part := upper(substring(md5(coalesce(p_email, '') || random()::text), 1, 3));
  return 'FLOW' || base_part || hash_part;
end;
$$;

-- Get-or-create the current user's referral code.
create or replace function public.fs_ensure_referral_code()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_code text;
  v_attempts int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Return existing code if already generated.
  select code into v_code from referral_codes where user_id = v_uid;
  if v_code is not null then
    return v_code;
  end if;

  select email into v_email from auth.users where id = v_uid;

  -- Retry on collision (extremely unlikely but cheap insurance).
  loop
    v_attempts := v_attempts + 1;
    v_code := fs_generate_referral_code(v_email);
    begin
      insert into referral_codes (user_id, code) values (v_uid, v_code);
      return v_code;
    exception when unique_violation then
      if v_attempts > 5 then raise; end if;
    end;
  end loop;
end;
$$;

grant execute on function public.fs_ensure_referral_code() to authenticated;

-- Apply a referral code at signup time.
-- Called by the authenticated new user immediately after their account exists.
-- Records a pending referral linking referrer → this user.
-- Returns 'ok' | 'invalid_code' | 'self_referral' | 'already_referred'.
create or replace function public.fs_apply_referral(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_referrer uuid;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    return 'invalid_code';
  end if;

  select user_id into v_referrer from referral_codes where code = upper(trim(p_code));
  if v_referrer is null then
    return 'invalid_code';
  end if;

  if v_referrer = v_uid then
    return 'self_referral';
  end if;

  -- If this user was already referred by someone, keep the first link.
  select id into v_existing from referrals where referred_user_id = v_uid limit 1;
  if v_existing is not null then
    return 'already_referred';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into referrals (referrer_user_id, referred_user_id, code, referred_email, status)
  values (v_referrer, v_uid, upper(trim(p_code)), v_email, 'pending');

  return 'ok';
end;
$$;

grant execute on function public.fs_apply_referral(text) to authenticated;

-- Stats view for the current user's referral page.
create or replace view public.fs_referral_stats as
select
  rc.user_id,
  rc.code,
  (select count(*) from referrals r where r.referrer_user_id = rc.user_id) as invites_sent,
  (select count(*) from referrals r where r.referrer_user_id = rc.user_id and r.status in ('activated','rewarded')) as invites_accepted,
  (select count(*) from referrals r where r.referrer_user_id = rc.user_id and r.status = 'rewarded') as rewards_claimed
from referral_codes rc;

grant select on public.fs_referral_stats to authenticated;

-- RLS on view via the underlying tables (referral_codes has select policy).
