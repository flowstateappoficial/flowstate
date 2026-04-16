// Flowstate — Create Stripe Checkout Session
// Deploy: supabase functions deploy create-checkout-session --no-verify-jwt=false
//
// Requires env vars (set via: supabase secrets set KEY=value):
//   STRIPE_SECRET_KEY       sk_test_... or sk_live_...
//   STRIPE_PRICE_PLUS_MONTH price_...
//   STRIPE_PRICE_PLUS_YEAR  price_...
//   STRIPE_PRICE_MAX_MONTH  price_...
//   STRIPE_PRICE_MAX_YEAR   price_...
//   SUPABASE_URL            (auto in Supabase)
//   SUPABASE_SERVICE_ROLE_KEY (auto in Supabase)
//   APP_URL                 https://your-app.com (used for success/cancel redirects)
//
// Client call:
//   const { data } = await supabase.functions.invoke('create-checkout-session', {
//     body: { plan: 'plus', interval: 'month', withTrial: true }
//   });
//   window.location.href = data.url;

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_MAP: Record<string, string | undefined> = {
  'plus:month': Deno.env.get('STRIPE_PRICE_PLUS_MONTH'),
  'plus:year':  Deno.env.get('STRIPE_PRICE_PLUS_YEAR'),
  'max:month':  Deno.env.get('STRIPE_PRICE_MAX_MONTH'),
  'max:year':   Deno.env.get('STRIPE_PRICE_MAX_YEAR'),
};

const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // Auth: verify the calling user from the JWT.
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    // Pass the token explicitly — required when the client is built with the
    // service-role key (otherwise getUser() reads no session).
    const { data: userRes, error: userErr } = await supa.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return json({ error: 'not_authenticated', detail: userErr?.message }, 401);
    }
    const user = userRes.user;

    const { plan, interval, withTrial } = await req.json() as {
      plan: 'plus' | 'max';
      interval: 'month' | 'year';
      withTrial?: boolean;
    };

    const priceId = PRICE_MAP[`${plan}:${interval}`];
    if (!priceId) return json({ error: 'invalid_price' }, 400);

    // Re-use existing customer if we've already seen this user.
    const { data: subRow } = await supa
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = subRow?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      // Upsert a stub row so we don't create duplicate customers on retry.
      await supa.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'incomplete',
      }, { onConflict: 'user_id' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: withTrial ? 7 : undefined,
        metadata: { user_id: user.id, plan },
      },
      // Charge the card automatically at trial end. Card is required upfront.
      payment_method_collection: 'always',
      allow_promotion_codes: true,
      success_url: `${APP_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/?checkout=cancel`,
      locale: 'pt',
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('create-checkout-session error', e);
    return json({ error: 'server_error', message: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
