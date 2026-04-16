-- ══════════════════════════════════════════════════════════════
-- SISTEMA DE CONVITES — Beta Fechada
-- ══════════════════════════════════════════════════════════════

-- Tabela de códigos de convite gerados pelo admin.
create table if not exists public.beta_invites (
  code        text primary key,                          -- ex: "FS-A3F9K2"
  created_at  timestamptz not null default now(),
  note        text,                                       -- "Para o João", "Grupo de amigos"
  max_uses    int not null default 1,                     -- quantas vezes pode ser usado
  used_count  int not null default 0,                     -- quantas vezes já foi usado
  expires_at  timestamptz,                                -- null = sem expiração
  active      boolean not null default true               -- desativar manualmente
);

-- RLS
alter table public.beta_invites enable row level security;

-- Admin emails que podem gerir convites via painel client-side.
-- auth.jwt()->>'email' retorna o email do utilizador autenticado.
drop policy if exists "admin_select_invites" on public.beta_invites;
create policy "admin_select_invites"
  on public.beta_invites for select to authenticated
  using (auth.jwt()->>'email' in ('flowstate.app.oficial@gmail.com', 'claudionobre8@gmail.com'));

drop policy if exists "admin_update_invites" on public.beta_invites;
create policy "admin_update_invites"
  on public.beta_invites for update to authenticated
  using (auth.jwt()->>'email' in ('flowstate.app.oficial@gmail.com', 'claudionobre8@gmail.com'));

-- ── RPC: Validar convite (client-side chama antes do signUp) ──
-- security definer → corre com permissões do owner (postgres), não do caller.
create or replace function validate_beta_invite(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from beta_invites
    where code = upper(trim(p_code))
      and active = true
      and used_count < max_uses
      and (expires_at is null or expires_at > now())
  );
$$;

-- ── RPC: Usar convite (chamado após signUp bem-sucedido) ──
create or replace function claim_beta_invite(p_code text)
returns text  -- 'ok' | 'invalid'
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
begin
  update beta_invites
  set used_count = used_count + 1
  where code = v_code
    and active = true
    and used_count < max_uses
    and (expires_at is null or expires_at > now());

  if found then
    return 'ok';
  else
    return 'invalid';
  end if;
end;
$$;

-- ── RPC: Gerar convite (admin panel) ──
-- Gera um código aleatório FS-XXXXXX.
create or replace function generate_beta_invite(p_note text default null, p_max_uses int default 1)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- sem I/O/0/1 (ambíguos)
  i int;
begin
  -- Gera código único FS-XXXXXX
  loop
    v_code := 'FS-';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;
    -- Verifica unicidade
    exit when not exists(select 1 from beta_invites where code = v_code);
  end loop;

  insert into beta_invites (code, note, max_uses)
  values (v_code, p_note, p_max_uses);

  return v_code;
end;
$$;

-- ── Gerar 15 convites iniciais para o lançamento ──
-- (Podes correr este bloco separadamente ou manter aqui)
do $$
begin
  for i in 1..15 loop
    perform generate_beta_invite('Convite beta #' || i, 1);
  end loop;
end;
$$;
