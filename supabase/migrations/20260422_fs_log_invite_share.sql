-- Flowstate — Log generic invite share (WhatsApp, link copy, etc.)
--
-- Contexto do bug:
--   A ConvitesPage tem vários botões de partilha (WhatsApp, copiar link,
--   email). Só o email hit o backend (edge function send-referral-invite),
--   portanto os outros nunca incrementavam `invites_sent` na view
--   `fs_referral_stats`. Resultado: o utilizador partilha via WhatsApp e
--   vê o contador a 0 — parece que a app está partida.
--
-- Solução:
--   RPC `fs_log_invite_share(p_channel text)` que insere uma linha em
--   `referrals` com `referred_user_id = null` e `referred_email = null`.
--   O canal de partilha (whatsapp/link_copy/web_share) fica em
--   `reward_details.channel` para analítica futura.
--
-- Notas:
--   • Sem rate-limiting server-side — o `invites_sent` é métrica de
--     vaidade; o que importa para rewards é `invites_accepted` que só
--     sobe quando o convidado cria 3 transações. Rate-limiting básico
--     fica no cliente (cooldown curto para evitar duplo-clique).
--   • Reutiliza `fs_ensure_referral_code()` para garantir que o user
--     tem um código antes de inserir.

create or replace function public.fs_log_invite_share(p_channel text default 'unknown')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_id uuid;
  v_channel text;
begin
  if v_uid is null then return null; end if;

  -- Normalizar channel. Aceita apenas canais conhecidos; resto vira 'other'.
  v_channel := lower(coalesce(nullif(trim(p_channel), ''), 'unknown'));
  if v_channel not in ('whatsapp', 'link_copy', 'web_share', 'telegram', 'email_manual', 'unknown') then
    v_channel := 'other';
  end if;

  -- Garante que o user tem referral_code (cria um se não tiver).
  select code into v_code from public.referral_codes where user_id = v_uid;
  if v_code is null then
    v_code := public.fs_ensure_referral_code();
  end if;

  insert into public.referrals (
    referrer_user_id,
    code,
    status,
    reward_details
  )
  values (
    v_uid,
    v_code,
    'pending',
    jsonb_build_object('channel', v_channel, 'source', 'share')
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.fs_log_invite_share(text) to authenticated;
