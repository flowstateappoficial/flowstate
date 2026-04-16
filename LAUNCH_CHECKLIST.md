# Flowstate — Checklist de Lançamento (Beta Fechada)

Plano para amanhã: **da versão de testes local → primeira versão online com convites**.

---

## ✅ Já feito

- [x] PWA instalável (manifest + SW + botão de instalação)
- [x] Service Worker com auto-bump de versão (sem caches presos em deploys)
- [x] Landing page responsiva (mockups laptop+telemóvel no desktop, só telemóvel no mobile)
- [x] NotificationCenter adaptada para mobile
- [x] Feedback button na navbar → Supabase `public.feedback`
- [x] Tabela `feedback` criada com RLS em produção

---

## 🎯 Fase 1 — Segurança & estabilidade (antes de qualquer login externo)

### 1.1 Auditoria RLS no Supabase
- [ ] Revisão das policies em `transactions`, `goals`, `investments`, `investment_entries`, `fundo_emergencia`, `referral_codes`, `referrals`, `subscriptions`
- [ ] Verificar que cada policy tem `user_id = auth.uid()` no SELECT/UPDATE/DELETE
- [ ] Testar com 2 contas: confirmar que conta A não vê nada da conta B
- [ ] Garantir que `anon` não consegue SELECT em nada sensível

### 1.2 Error Boundary + captura de crashes
- [ ] Criar `<ErrorBoundary />` React que apanha exceções não tratadas
- [ ] Gravar crashes numa tabela `public.error_logs` (ou enviar para Sentry free tier)
- [ ] UI de fallback bonita em vez de página branca
- [ ] Button "Reportar este erro" → pré-preenche feedback

### 1.3 Limpeza de dev
- [ ] Remover `console.log` barulhentos (guardar só os de erro)
- [ ] Confirmar que `VITE_ENABLE_SW=1` não está ativo em dev
- [ ] Verificar que chaves Stripe estão em **live mode** (não test) — ou decidir manter test para a beta
- [ ] Variáveis de ambiente documentadas em `.env.example`

---

## 🚀 Fase 2 — Deploy online

### 2.1 Escolher plataforma
Recomendação: **Vercel** (grátis, git push = deploy, PT/EU region, suporta PWA nativamente).
Alternativas: Netlify, Cloudflare Pages.

### 2.2 Configurar no Vercel
- [ ] Ligar o repo do GitHub
- [ ] Build command: `npm run build` · Output: `dist/`
- [ ] Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STRIPE_*`
- [ ] Primeiro deploy → URL temporário `flowstate.vercel.app`

### 2.3 Domínio próprio
- [ ] Decidir domínio: `flowstate.app`, `flowstate.pt`, `flowstate.money`, outro?
- [ ] Comprar (Namecheap / Porkbun / Cloudflare Registrar)
- [ ] Ligar DNS a Vercel
- [ ] Forçar HTTPS + `www` redirect

### 2.4 Supabase de produção
- [ ] Confirmar que é já o projeto de produção (é — `myjgthxaldqiwxgnxjvd`)
- [ ] Adicionar o novo domínio à lista de redirects permitidos em Auth → URL Configuration
- [ ] Rate limits por defeito do Supabase (confirmar que chegam)
- [ ] Ligar backups automáticos (Database → Backups)

### 2.5 Stripe
- [ ] Adicionar domínio de produção às "allowed origins"
- [ ] Confirmar webhooks apontam para `https://<dominio>/functions/v1/stripe-webhook`
- [ ] Se ainda estás em test mode, decidir: manter test durante beta fechada OU passar a live

---

## 🎟️ Fase 3 — Sistema de convites (Beta fechada)

**Objetivo:** só quem tem convite teu consegue criar conta.

### 3.1 Modelo de dados
Nova tabela `public.invite_codes`:
```sql
code          text primary key          -- ex: "FS-A3F9K2"
created_at    timestamptz default now()
created_by    uuid                      -- tu (admin)
note          text                      -- "Para o João"
used_at       timestamptz               -- null = ainda válido
used_by       uuid references auth.users(id)
max_uses      int default 1             -- normalmente 1
expires_at    timestamptz               -- opcional
```

### 3.2 Validação no signup
- [ ] Campo "Código de convite" na AuthPage (apenas no registo, não no login)
- [ ] Validar o código via Supabase Edge Function (não pode ser client-side — utilizadores viam todos os códigos)
- [ ] Se válido: criar user + marcar código como usado (atomicamente, com `SELECT ... FOR UPDATE`)
- [ ] Se inválido: "Este convite já foi usado ou não existe"

### 3.3 Admin panel (básico)
- [ ] Página escondida `/admin` (só para o teu email)
- [ ] Listar convites com estado (usado / pendente / expirado)
- [ ] Botão "Gerar novo convite" → cria código aleatório + opcional nota
- [ ] Copiar link: `flowstate.app/convite/FS-A3F9K2`

### 3.4 Landing para quem **não** tem convite
- [ ] Se acede via `flowstate.app` sem código → mostrar "Beta fechada" + waitlist
- [ ] Tabela `public.waitlist (email, created_at, note)` para juntar interessados
- [ ] Quando quiseres, usas esses emails para mandar convites

---

## ⚖️ Fase 4 — Legal & RGPD (obrigatório em PT/UE)

- [ ] **Política de Privacidade** (o que guardas, porquê, direitos do utilizador)
- [ ] **Termos de Utilização** (responsabilidades, beta disclaimer)
- [ ] **Cookie banner** mínimo — na prática não usamos cookies de tracking, mas preciso de avisar
- [ ] Email de contacto: `flowstate.app.oficial@gmail.com` (ou `suporte@flowstate.app`)
- [ ] Página `/legal/privacidade` e `/legal/termos` acessíveis a partir do footer
- [ ] Aceitar termos no signup (checkbox obrigatório)

Posso gerar os textos iniciais destes documentos — adaptados ao que a Flowstate faz.

---

## 🎨 Fase 5 — Polish antes de mostrar a humanos

- [ ] Badge "BETA" discreto num canto (para gerir expectativas)
- [ ] Onboarding: primeiro login mostra 3-4 passos rápidos ("Adiciona a tua primeira transação", "Define um objetivo", etc.)
- [ ] Empty states bonitos (sem transações, sem objetivos, sem investimentos)
- [ ] Testar em: iPhone Safari, Android Chrome, Windows Chrome, Mac Safari, modo escuro/claro do SO
- [ ] Manual smoke test: criar conta com convite → adicionar tx → editar → apagar → criar objetivo → logout → login → confirmar que dados persistem

---

## 📊 Fase 6 — Depois de lançar

(Não precisam para o launch, mas bom ter em mente)

- [ ] Monitorizar a tabela `feedback` todos os dias
- [ ] Database webhook → Discord/Slack quando chega feedback
- [ ] Analytics básica (Plausible, Umami — privacy-friendly)
- [ ] Email marketing simples (Resend free tier) para mandar updates aos beta testers

---

## 🗓️ Ordem sugerida para amanhã

Proponho atacarmos por esta ordem (por importância, não por divertimento):

1. **Auditoria RLS** (30 min) — crítico, não podemos dar login a amigos se conseguem ver dados uns dos outros
2. **Error Boundary** (30 min) — para saberes quando alguém rebenta a app
3. **Sistema de convites** (1-2h) — o coração da beta fechada
4. **Páginas legais + checkbox no signup** (45 min)
5. **Deploy no Vercel + domínio** (30 min + tempo de DNS propagar)
6. **Smoke test + convidar 2-3 pessoas de confiança como primeiros testes** (30 min)

Total estimado: **meia tarde de trabalho focado**.

---

## ❓ Decisões que preciso de ti antes de começar

1. **Domínio:** qual preferes? `.app`, `.pt`, `.money`, outro?
2. **Stripe:** durante a beta fechada, ficamos em **test mode** (sem cobrar ninguém) ou em **live**?
3. **Primeiros testers:** quantas pessoas queres convidar para começar? (Sugiro 3-5 na primeira leva.)
4. **Email de suporte:** usar `flowstate.app.oficial@gmail.com` ou criar um `suporte@<dominio>`?
