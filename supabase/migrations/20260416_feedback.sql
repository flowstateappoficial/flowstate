-- Tabela de feedback da beta fechada
-- Cria a tabela + RLS: qualquer um (incl. anónimo) pode INSERT,
-- ninguém consegue SELECT via anon/authenticated key.
-- Tu lês via Supabase Dashboard (Table Editor ou SQL Editor), que usa service_role.

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete set null,
  type        text not null check (type in ('bug','sugestao','elogio','outro')),
  message     text not null check (char_length(message) between 1 and 5000),
  email       text check (email is null or char_length(email) <= 200),
  page        text,
  user_agent  text
);

-- Index para ordenar por data (dashboard fica mais rápido)
create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

-- Ativa RLS
alter table public.feedback enable row level security;

-- Permite INSERT a toda a gente (anónimo na landing page + logados na app)
drop policy if exists "feedback_insert_any" on public.feedback;
create policy "feedback_insert_any"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- Nota: nenhuma policy de SELECT → ninguém consegue ler via anon/authenticated.
-- Para leres, usas o Supabase Dashboard (service_role bypassa RLS).
