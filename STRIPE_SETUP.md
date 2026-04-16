# Flowstate — Setup de Pagamentos (Stripe + Supabase)

Passo-a-passo para ligar o Stripe ao Flowstate. Feito uma vez, fica a correr.

---

## 1 · Stripe (dashboard)

1. Cria conta em <https://dashboard.stripe.com/register>. Mantém o toggle em **"Test mode"** no canto superior direito.
2. **Products → + Add product**, cria 4 produtos recorrentes:

   | Nome             | Preço      | Recurring |
   |------------------|------------|-----------|
   | Flow Plus        | 3,99 €     | monthly   |
   | Flow Plus Anual  | 39,99 €    | yearly    |
   | Flow Max         | 7,99 €     | monthly   |
   | Flow Max Anual   | 79,99 €    | yearly    |

   Guarda os 4 **Price IDs** (começam por `price_…`).

3. **Developers → API keys**: copia a **Secret key** (`sk_test_…`).

---

## 2 · Supabase (tabela)

No SQL editor, cola e corre o ficheiro:
`supabase/migrations/20260414_subscriptions.sql`

Cria a tabela `public.subscriptions` + RLS.

---

## 3 · Supabase (Edge Functions)

Instala o CLI se ainda não tens:
```bash
npm i -g supabase
supabase login
supabase link --project-ref <TEU_PROJECT_REF>
```

Define os secrets (uma vez):
```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_XXX \
  STRIPE_PRICE_PLUS_MONTH=price_XXX \
  STRIPE_PRICE_PLUS_YEAR=price_XXX \
  STRIPE_PRICE_MAX_MONTH=price_XXX \
  STRIPE_PRICE_MAX_YEAR=price_XXX \
  APP_URL=http://localhost:5173
# STRIPE_WEBHOOK_SECRET é adicionado no passo 4
```

Faz deploy das 2 funções:
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

A flag `--no-verify-jwt` na `stripe-webhook` é obrigatória — o Stripe não envia JWT de user, mas assinatura própria.

---

## 4 · Stripe (webhook)

1. Developers → Webhooks → **+ Add endpoint**
2. URL: `https://<TEU_PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`
3. Eventos a subscrever:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia o **Signing secret** (`whsec_…`) e grava:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXX
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

---

## 5 · Testar

1. Na app, clica **"Experimentar 7 dias grátis"**.
2. És redirecionado para o Stripe Checkout. Usa o cartão de teste:
   - **Número:** `4242 4242 4242 4242`
   - **Data:** qualquer futura
   - **CVC:** qualquer 3 dígitos
3. Volta para a app com `?checkout=success` → o `trial_end` aparece no Stripe e na tabela `subscriptions`.
4. Para simular o fim do trial, no Stripe dashboard abre a subscription → **Cancel trial** → o webhook cobra automaticamente.

Outros cartões de teste úteis:
- `4000 0000 0000 9995` — cartão sem saldo (dispara `invoice.payment_failed`).
- `4000 0025 0000 3155` — pede autenticação 3D Secure.

---

## 6 · Passar para produção

1. Repete os produtos em **Live mode** do Stripe.
2. Muda os secrets para as chaves `sk_live_…`, `price_…` de produção, e `APP_URL` para o domínio real.
3. Cria novo webhook endpoint em modo Live e actualiza `STRIPE_WEBHOOK_SECRET`.
4. Re-deploy das duas funções.

---

## Como funciona no Flowstate

- O utilizador clica "Experimentar" → `startCheckout()` invoca a Edge Function → redirect para Stripe.
- Após pagar (ou começar trial), o Stripe manda webhooks → `stripe-webhook` faz upsert em `subscriptions`.
- O React lê `subscriptions` via `syncSubscription()` e cacheia em localStorage como `fs_sub_v1`.
- `userPlan()` continua a ler `fs_plan_v1`, mas agora é mantido pelo sync (em vez de só local).
- Quando o trial termina, o Stripe cobra automaticamente e o webhook actualiza `status: 'active'`. Se o utilizador cancelar antes, `cancel_at_period_end: true` e no fim do período vai para `free`.
