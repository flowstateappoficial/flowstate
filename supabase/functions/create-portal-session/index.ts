// Flowstate — Create Stripe Billing Portal Session
// Deploy: supabase functions deploy create-portal-session
// IMPORTANT: In the Supabase dashboard, set "Verify JWT" to OFF for this
// function. We verify the user manually below using the Authorization header.
//
// Requires env vars:
//   STRIPE_SECRET_KEY          sk_test_... / sk_live_...
//   SUPABASE_URL               (auto)
//   SUPABASE_SERVICE_ROLE_KEY  (auto)
//   APP_URL                    http://localhost:3000 (or prod domain)
//
// Client call:
//   const { data } = await supabase.functions.invoke('create-portal-session');
//   window.location.href = data.url;

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // Auth: extract JWT from Authorization header and resolve the user.
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userRes, error: userErr } = await supa.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return json({ error: 'not_authenticated', detail: userErr?.message }, 401);
    }
    const user = userRes.user;

    // Find the Stripe customer for this user.
    const { data: subRow } = await supa
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const customerId = subRow?.stripe_customer_id;
    if (!customerId) {
      return json({ error: 'no_customer', message: 'User has no Stripe customer yet.' }, 400);
    }

    // Optional: body can override the return URL (e.g. deep-link back to a specific page).
    let returnTo = `${APP_URL}/?portal=return`;
    try {
      const body = await req.json();
      if (body?.returnTo && typeof body.returnTo === 'string') {
        // Only allow same-origin return URLs.
        if (body.returnTo.startsWith(APP_URL)) returnTo = body.returnTo;
      }
    } catch { /* body is optional */ }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnTo,
      locale: 'pt',
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('create-portal-session error', e);
    return json({ error: 'server_error', message: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
