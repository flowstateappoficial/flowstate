# Configuração do Feedback (Beta Fechada) — via Supabase

O botão flutuante 💬 da app envia o feedback diretamente para a tabela `public.feedback` no Supabase que já tens ligado ao projeto.

**Vantagens vs. Google Forms:**
- Zero env vars extra
- Zero setup manual
- Dados no mesmo DB que os utilizadores → podes fazer JOIN com `auth.users` se quiseres
- Acesso via Supabase Dashboard com SQL filtros/exports

---

## 1. Criar a tabela (só fazes uma vez)

1. Abre o **Supabase Dashboard** do projeto Flowstate.
2. Navega para **SQL Editor** (ícone `</>` no menu lateral) → **New query**.
3. Copia e cola o conteúdo de `supabase/migrations/20260416_feedback.sql` (está na raiz deste projeto).
4. Carrega em **Run**. Deves ver *"Success. No rows returned."*

A migration cria:
- A tabela `public.feedback` (id, created_at, user_id, type, message, email, page, user_agent)
- Um index em `created_at desc` (para listar rápido)
- **RLS ligada** com policy que permite só `INSERT` (anón + logados) e **bloqueia SELECT** (só tu via dashboard)

---

## 2. Testar

1. Arranca o projeto (`npm run dev`).
2. Carrega no botão 💬 no canto inferior direito (aparece na landing page, no login e dentro da app).
3. Escolhe um tipo (🐛 Bug / 💡 Sugestão / ❤️ Elogio / 💬 Outro), escreve uma mensagem → **Enviar feedback**.
4. Deves ver **"✓ Obrigado! Recebemos o teu feedback."**

---

## 3. Como leres o feedback dos utilizadores

Tens três opções, por ordem de conveniência:

### Opção A — Table Editor (mais visual)

1. Supabase Dashboard → **Table Editor** → seleciona `feedback`.
2. Vês uma grelha com todas as submissões, ordenadas por `created_at`.
3. Podes filtrar por `type`, procurar texto em `message`, etc.
4. Clicar numa linha abre o detalhe completo (mensagem inteira, user_agent, etc.).

### Opção B — SQL Editor (mais poder)

SQL Editor → cola e corre:

```sql
-- Últimos 50 feedbacks
select
  created_at,
  type,
  message,
  email,
  page,
  user_id
from public.feedback
order by created_at desc
limit 50;
```

Queries úteis:

```sql
-- Só bugs dos últimos 7 dias
select * from public.feedback
where type = 'bug'
  and created_at > now() - interval '7 days'
order by created_at desc;

-- Contagem por tipo
select type, count(*) from public.feedback group by type order by 2 desc;

-- Juntar com o email do utilizador logado (se existir)
select
  f.created_at, f.type, f.message, f.email as reported_email,
  u.email as account_email
from public.feedback f
left join auth.users u on u.id = f.user_id
order by f.created_at desc
limit 50;
```

### Opção C — Export CSV

Table Editor → botão **Export** → **CSV**. Útil para partilhares com alguém ou guardares.

---

## 4. Notificações (opcional, futuro)

Se quiseres receber email/Slack quando alguém submete feedback, podes adicionar um **Database Webhook** no Supabase:

1. Dashboard → **Database** → **Webhooks** → **Create a new hook**.
2. Table: `feedback`, Events: `INSERT`.
3. Type: `HTTP Request` → POSTa para um endpoint teu (ou Zapier / Make / n8n / webhook do Discord).

Fica para depois — por agora, consultar o dashboard uma vez por dia chega.

---

## 5. Privacidade / dados

- Não é armazenado nada sensível (passwords, tokens, etc.).
- `user_id` é `null` se o feedback vier da landing page ou auth (utilizador não logado).
- `email` só é guardado se o utilizador o escrever no campo (é opcional).
- `user_agent` e `page` ajudam a reproduzir bugs; apenas os últimos 500 chars são guardados.
- RLS bloqueia SELECT via anon/authenticated → utilizadores não conseguem ler feedback uns dos outros.

---

## 6. Migrar para outro backend no futuro

Se um dia quiseres trocar (Airtable, Notion, etc.), é só editar `src/utils/feedback.js` — a função `submitFeedback({ type, message, email })` é o único ponto de contacto. O `FeedbackButton.jsx` não muda.
