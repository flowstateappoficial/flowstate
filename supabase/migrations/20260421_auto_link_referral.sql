-- Flowstate — Auto-link pending referrals by email
--
-- Contexto do bug:
--   A edge function `send-referral-invite` cria uma linha em `referrals`
--   com `referred_email` preenchido mas `referred_user_id = null`.
--   Quando o convidado se regista, o `fs_apply_referral` é que devia
--   associar a linha — mas só corre se o código do convite estiver em
--   localStorage (o utilizador tem de clicar no link /convite/:code).
--
--   Se o convidado:
--     • se regista via Google OAuth (redirect pode perder o estado)
--     • entra diretamente em /auth sem passar por /convite
--     • cola o código à mão mas o fluxo falha silenciosamente
--   a linha fica órfã (referred_user_id = null) e o trigger de ativação
--   nos 3 transações nunca encontra a ligação → contador "Ativos" fica 0.
--
-- Solução:
--   Trigger em auth.users que, sempre que um novo user é criado, faz
--   match pelo email com referrals pendentes sem user_id. Idempotente e
--   cobre TODOS os caminhos de registo.

create or replace function public.fs_auto_link_pending_referral()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.referrals
  set referred_user_id = new.id
  where referred_email = new.email
    and referred_user_id is null
    and status = 'pending';
  return new;
end;
$$;

drop trigger if exists trg_fs_auto_link_pending_referral on auth.users;
create trigger trg_fs_auto_link_pending_referral
  after insert on auth.users
  for each row
  execute function public.fs_auto_link_pending_referral();
