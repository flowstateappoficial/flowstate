# ⚠️ Pendente — Tratar antes de lançar em produção

## 1. Domínio próprio no Resend (bloqueador de produção)

**Estado actual:** Resend em modo sandbox.
- Só envia `from: onboarding@resend.dev`
- Só envia `to: flowstate.app.oficial@gmail.com`
- Qualquer outro destinatário → HTTP 403 `validation_error`

**Consequência:** Utilizadores reais **NÃO recebem** o welcome email nem qualquer outro email transacional.

**Passos quando tiver o domínio `flowstate.pt` (~10 min):**

1. Comprar/registar o domínio `flowstate.pt`
2. Resend dashboard → **Domains** → **Add Domain** → `flowstate.pt`
3. Copiar os 3 registos DNS que o Resend mostra (1 MX + 2 TXT — SPF/DKIM)
4. Adicionar os registos no provedor de DNS (Cloudflare, GoDaddy, etc.)
5. Clicar **Verify** no Resend (demora 5 min a algumas horas)
6. Quando ficar verde, alterar o secret do Supabase:
   - Abrir: https://supabase.com/dashboard/project/myjgthxaldqiwxgnxjvd/functions/secrets
   - Editar `EMAIL_FROM`:
     - Antes: `Flowstate <onboarding@resend.dev>`
     - Depois: `Flowstate <no-reply@flowstate.pt>` (ou `ola@flowstate.pt`)
7. Redeploy não é necessário — o edge function lê o env a cada invocação

**Verificação:** criar um novo utilizador de teste com email `@gmail.com` qualquer, iniciar trial via Stripe, e confirmar que o email chega.

---

## Outros pendentes desta fase

- [ ] `trial_will_end` email (3 dias antes do trial expirar) — scheduled edge function
- [ ] Recibos/facturas em PDF (Stripe já envia nativo, avaliar se precisamos template próprio)
- [ ] Sistema de convites funcional (criado mas não ligado)
