// Flowstate — Stripe Webhook Receiver
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// (important: webhooks don't have a user JWT, must disable verification)
//
// Requires env vars:
//   STRIPE_SECRET_KEY           sk_test_... / sk_live_...
//   STRIPE_WEBHOOK_SECRET       whsec_...
//   SUPABASE_URL                (auto)
//   SUPABASE_SERVICE_ROLE_KEY   (auto)
//
// Stripe dashboard → Developers → Webhooks → Add endpoint:
//   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//   Events to listen to:
//     customer.subscription.created
//     customer.subscription.updated
//     customer.subscription.deleted
//     invoice.payment_succeeded
//     invoice.payment_failed

import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendEmail, welcomeTrialHtml, welcomeTrialText } from '../_shared/email.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

const supa = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const APP_URL = Deno.env.get('APP_URL') ?? 'http://localhost:3000';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('missing signature', { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('webhook signature failed', err);
    return new Response(`signature_invalid: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        // Fire welcome email on trial start (or immediate active, rare).
        if (sub.status === 'trialing' || sub.status === 'active') {
          await sendWelcomeEmailForSub(sub).catch((e) =>
            console.error('welcome email failed', e)
          );
          // If this user was referred, activate referral and reward the referrer (+7d trial).
          await processReferralReward(sub).catch((e) =>
            console.error('referral reward failed', e)
          );
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await upsertSubscription(sub);
        }
        break;
      }
      default:
        // Ignored event, but ack so Stripe doesn't retry.
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('webhook handler error', event.type, e);
    return new Response('handler_error', { status: 500 });
  }
});

async function upsertSubscription(sub: Stripe.Subscription) {
  const userId = (sub.metadata?.user_id as string | undefined)
    ?? await lookupUserFromCustomer(sub.customer as string);
  if (!userId) {
    console.warn('no user_id for subscription', sub.id);
    return;
  }

  const price = sub.items.data[0]?.price;
  const interval = price?.recurring?.interval ?? null;
  const plan = (sub.metadata?.plan as string | undefined)
    ?? inferPlanFromPrice(price?.id);

  // Map Stripe status → our status column (kept 1:1 where possible).
  const status = sub.status; // 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | ...
  const effectivePlan = (status === 'active' || status === 'trialing') ? plan : 'free';

  await supa.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_sub_id: sub.id,
    plan: effectivePlan,
    status,
    billing_interval: interval,
    current_period_end: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
  }, { onConflict: 'user_id' });
}

async function lookupUserFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await supa
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function sendWelcomeEmailForSub(sub: Stripe.Subscription) {
  // Resolve customer email + name (prefer Stripe customer record, fallback to Supabase user).
  const customerId = sub.customer as string;
  let email: string | null = null;
  let name: string | null = null;

  try {
    const cus = await stripe.customers.retrieve(customerId);
    if (!('deleted' in cus) || !cus.deleted) {
      email = (cus as Stripe.Customer).email ?? null;
      name = (cus as Stripe.Customer).name ?? null;
    }
  } catch (e) {
    console.warn('welcome email: could not fetch customer', e);
  }

  // Fallback: lookup user email via Supabase auth using user_id from metadata or subscriptions table.
  if (!email) {
    const userId = (sub.metadata?.user_id as string | undefined)
      ?? await lookupUserFromCustomer(customerId);
    if (userId) {
      const { data } = await supa.auth.admin.getUserById(userId);
      email = data?.user?.email ?? null;
    }
  }

  if (!email) {
    console.warn('welcome email: no email resolved for sub', sub.id);
    return;
  }

  const firstName = name ? name.split(' ')[0] : undefined;
  const plan = (sub.metadata?.plan as string | undefined)
    ?? inferPlanFromPrice(sub.items.data[0]?.price?.id);
  const billingInterval = sub.items.data[0]?.price?.recurring?.interval ?? 'month';
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : new Date();

  const planLabel = plan === 'max' ? 'Flow Max' : 'Flow Plus';
  const html = welcomeTrialHtml({ firstName, plan, trialEnd, billingInterval, appUrl: APP_URL });
  const text = welcomeTrialText({ firstName, plan, trialEnd });

  await sendEmail({
    to: email,
    subject: `Bem-vindo ao ${planLabel} — o teu trial de 7 dias começou`,
    html,
    text,
    tags: [
      { name: 'category', value: 'welcome_trial' },
      { name: 'plan', value: plan },
    ],
  });
}

// Referral reward tiers (must mirror REWARDS in src/utils/referral.js).
// When the referrer's total ACTIVATED referrals hits exactly one of these
// milestones, we apply the corresponding trial extension + badge.
const REFERRAL_TIERS: Array<{ invites: number; days: number; badge: string | null; label: string }> = [
  { invites: 1,  days: 7,  badge: null,           label: '+7 dias de trial' },
  { invites: 3,  days: 30, badge: 'ambassador',   label: 'Badge Embaixador + 1 mês Flow Plus' },
  { invites: 10, days: 30, badge: 'top_referrer', label: 'Badge Top Referrer + 1 mês Flow Max' },
];

// Referral reward: when a referred user starts a paid trial, activate the referral
// and — if the referrer just hit a milestone — extend their trial and grant a badge.
async function processReferralReward(sub: Stripe.Subscription) {
  const referredUserId = (sub.metadata?.user_id as string | undefined)
    ?? await lookupUserFromCustomer(sub.customer as string);
  if (!referredUserId) return;

  // Find pending referral for this user.
  const { data: referral } = await supa
    .from('referrals')
    .select('id, referrer_user_id, status')
    .eq('referred_user_id', referredUserId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!referral) return;

  // Mark as activated immediately (idempotent).
  await supa
    .from('referrals')
    .update({ status: 'activated', activated_at: new Date().toISOString() })
    .eq('id', referral.id);

  // Count total activated+rewarded referrals for this referrer (including the one we just flipped).
  const { count: totalActivated } = await supa
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_user_id', referral.referrer_user_id)
    .in('status', ['activated', 'rewarded']);

  const activatedCount = Number(totalActivated ?? 0);
  const tier = REFERRAL_TIERS.find((t) => t.invites === activatedCount);

  if (!tier) {
    console.log(
      'referral activated, no milestone reached',
      referral.id,
      'referrer_total=',
      activatedCount,
    );
    return;
  }

  // Find referrer's Stripe subscription to extend their trial.
  const { data: referrerSub } = await supa
    .from('subscriptions')
    .select('stripe_sub_id, status, trial_end')
    .eq('user_id', referral.referrer_user_id)
    .maybeSingle();

  if (!referrerSub?.stripe_sub_id) {
    console.log(
      'milestone reached but referrer has no active sub — storing badge only',
      referral.id,
      'tier=',
      tier.invites,
    );
    // Still persist the badge on the referral row so UI can show it even without a sub.
    await supa
      .from('referrals')
      .update({
        status: 'rewarded',
        rewarded_at: new Date().toISOString(),
        reward_details: {
          type: 'badge_only',
          tier: tier.invites,
          badge: tier.badge,
          label: tier.label,
          reason: 'referrer_no_active_sub',
        },
      })
      .eq('id', referral.id);
    return;
  }

  try {
    const current = await stripe.subscriptions.retrieve(referrerSub.stripe_sub_id);
    // Baseline for extension: existing trial_end if in future, else now.
    const nowSec = Math.floor(Date.now() / 1000);
    const baselineSec = (current.trial_end && current.trial_end > nowSec)
      ? current.trial_end
      : nowSec;
    const newTrialEnd = baselineSec + tier.days * 24 * 60 * 60;

    const updated = await stripe.subscriptions.update(referrerSub.stripe_sub_id, {
      trial_end: newTrialEnd,
      proration_behavior: 'none',
    });

    // Sync our DB from Stripe response (upsertSubscription also gets called via sub.updated webhook).
    await upsertSubscription(updated);

    // Mark rewarded.
    await supa
      .from('referrals')
      .update({
        status: 'rewarded',
        rewarded_at: new Date().toISOString(),
        reward_details: {
          type: 'trial_extension',
          tier: tier.invites,
          days: tier.days,
          badge: tier.badge,
          label: tier.label,
          prev_trial_end: current.trial_end,
          new_trial_end: newTrialEnd,
        },
      })
      .eq('id', referral.id);

    console.log(
      'referral rewarded',
      referral.id,
      'referrer',
      referral.referrer_user_id,
      `tier=${tier.invites}`,
      `+${tier.days}d`,
      tier.badge ? `badge=${tier.badge}` : '',
    );
  } catch (e) {
    console.error('failed to extend referrer trial', referral.id, e);
  }
}

function inferPlanFromPrice(priceId?: string | null): string {
  if (!priceId) return 'plus';
  const mapping: Record<string, string> = {
    [Deno.env.get('STRIPE_PRICE_PLUS_MONTH') ?? '']: 'plus',
    [Deno.env.get('STRIPE_PRICE_PLUS_YEAR')  ?? '']: 'plus',
    [Deno.env.get('STRIPE_PRICE_MAX_MONTH')  ?? '']: 'max',
    [Deno.env.get('STRIPE_PRICE_MAX_YEAR')   ?? '']: 'max',
  };
  return mapping[priceId] ?? 'plus';
}
