// Flowstate — Cancel / Reactivate Stripe Subscription
// Deploy: supabase functions deploy cancel-subscription
// IMPORTANT: In the Supabase dashboard, set "Verify JWT" to OFF for this
// function. We verify the user manually below using the Authorization header.
//
// Requires env vars:
//   STRIPE_SECRET_KEY          sk_test_... / sk_live_...
//   SUPABASE_URL               (auto)
//   SUPABASE_SERVICE_ROLE_KEY  (auto)
//
// Client call:
//   await supabase.functions.invoke('cancel-subscription', {
//     body: { reactivate: false } // true → uncancel
//   });
//
// Behaviour:
//   - reactivate=false (default): sets cancel_at_period_end=true.
//     Stripe NÃO cobra no fim do trial / período pago. A subscription
//     mantém-se acessível até trial_end / current_period_end e depois passa a 'canceled'.
//   - reactivate=true: sets cancel_at_period_end=false (uncancel).
//
// O webhook 'customer.subscription.updated' propaga o estado para a BD.

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

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

    // Body: { reactivate?: boolean }
    let reactivate = false;
    try {
      const body = await req.json();
      reactivate = !!body?.reactivate;
    } catch { /* body optional */ }

    // Find the user's Stripe subscription id.
    const { data: subRow, error: subErr } = await supa
      .from('subscriptions')
      .select('stripe_sub_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subErr) return json({ error: 'db_error', detail: subErr.message }, 500);
    if (!subRow?.stripe_sub_id) {
      return json({ error: 'no_subscription', message: 'No active Stripe subscription for this user.' }, 400);
    }

    // Subscriptions in 'canceled' state cannot be modified.
    if (subRow.status === 'canceled') {
      return json({ error: 'already_canceled', message: 'Subscription already fully canceled.' }, 400);
    }

    const updated = await stripe.subscriptions.update(subRow.stripe_sub_id, {
      cancel_at_period_end: !reactivate,
    });

    return json({
      ok: true,
      subscription_id: updated.id,
      cancel_at_period_end: updated.cancel_at_period_end,
      status: updated.status,
      trial_end: updated.trial_end,
      current_period_end: updated.current_period_end,
    });
  } catch (e) {
    console.error('cancel-subscription error', e);
    return json({ error: 'server_error', message: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
