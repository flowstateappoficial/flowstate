# Deploy Flowstate no Vercel — Guia Passo-a-Passo

## Pré-requisitos

- Conta no GitHub (com o repo do Flowstate)
- Conta no Vercel (vercel.com — podes criar com o GitHub)
- Acesso ao domínio flowstate.pt (registo no registrador)

---

## Passo 1 — Push para o GitHub

Se o repo ainda não está no GitHub:

```bash
cd flowstate-react
git add -A
git commit -m "Preparar para deploy — beta fechada v1"
git remote add origin https://github.com/TEU_USER/flowstate.git
git push -u origin main
```

Se já está, faz push das alterações recentes:

```bash
git add -A
git commit -m "RLS audit + páginas legais + vercel.json"
git push
```

---

## Passo 2 — Criar Projeto no Vercel

1. Vai a **vercel.com** e faz login (usa "Continue with GitHub")
2. Clica **"Add New..." → "Project"**
3. Na lista de repos, encontra **flowstate** e clica **"Import"**
4. Nas configurações do projeto:
   - **Framework Preset:** Vite (deve ser detetado automaticamente)
   - **Root Directory:** deixa vazio (o projeto está na raiz)
   - **Build Command:** `npm run build` (já está por defeito)
   - **Output Directory:** `dist` (já está por defeito)

---

## Passo 3 — Environment Variables

Antes de clicar Deploy, expande **"Environment Variables"** e adiciona:

| Variável | Valor |
|---|---|
| `VITE_BETA_MODE` | `true` |

**Nota:** O Supabase URL e anon key estão hardcoded no código (constants.js), por isso não precisas de os pôr como env vars. Quando quiseres migrar para env vars no futuro, adiciona aqui `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

Agora clica **"Deploy"** e espera 1-2 minutos.

---

## Passo 4 — Testar o Deploy

O Vercel vai dar-te um URL tipo `flowstate-XXXXX.vercel.app`. Abre e verifica:

- [ ] Landing page carrega com logo e botões
- [ ] Links de Termos e Privacidade funcionam no footer
- [ ] Botão "Começar" leva para AuthPage
- [ ] Login/Register funciona (Supabase tem de aceitar o domínio — ver Passo 5)

---

## Passo 5 — Configurar Domínio no Supabase

**IMPORTANTE:** O Supabase bloqueia auth de domínios não autorizados.

1. Vai ao **Supabase Dashboard → Authentication → URL Configuration**
2. Em **Site URL**, mete: `https://flowstate.pt`
3. Em **Redirect URLs**, adiciona:
   - `https://flowstate.pt/**`
   - `https://flowstate-*.vercel.app/**` (para previews)
4. Clica **Save**

---

## Passo 6 — Domínio Personalizado (flowstate.pt)

### No Vercel:

1. Vai a **Settings → Domains** no teu projeto
2. Escreve `flowstate.pt` e clica **Add**
3. O Vercel vai mostrar registos DNS que precisas de configurar

### No teu registrador de domínios (onde compraste flowstate.pt):

Adiciona estes registos DNS:

| Tipo | Nome | Valor |
|---|---|---|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

**Nota:** Os valores exatos aparecem no Vercel quando adicionas o domínio. Usa os que o Vercel te der.

Espera 5-30 minutos para propagação DNS. O Vercel gera SSL automático.

---

## Passo 7 — Verificação Final

Depois do domínio estar ativo:

- [ ] `https://flowstate.pt` carrega a landing page
- [ ] `https://www.flowstate.pt` redireciona para o principal
- [ ] Auth (login + register com convite) funciona
- [ ] PWA install funciona (Service Worker registado)
- [ ] Feedback button funciona (guarda no Supabase)
- [ ] Dados do utilizador carregam (transactions, goals, etc.)

---

## Troubleshooting

**"Page not found" em rotas como /convite/FS-XXX:**
→ O ficheiro `vercel.json` com rewrites já foi criado. Se ainda der 404, verifica que está na raiz do repo.

**Auth não funciona no novo domínio:**
→ Esqueceste o Passo 5. O Supabase rejeita auth de domínios que não estejam na lista.

**Build falha no Vercel:**
→ Verifica que `node_modules` está no `.gitignore`. Se der erro de dependências, tenta `npm ci` localmente primeiro.

**PWA não aparece:**
→ O Service Worker só regista em HTTPS (que o Vercel dá por defeito). Limpa cache e recarrega.
