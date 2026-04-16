// Flowstate — Subscription Helper
// Bridges the UI to the `subscriptions` table maintained by the Stripe webhook.
// Falls back gracefully to the legacy localStorage plan if the user hasn't gone
// through Stripe yet (e.g. existing testers).

import { getSupabaseClient } from './supabase';

const LS_PLAN_LEGACY  = 'fs_plan_v1';
const LS_SUB_CACHE    = 'fs_sub_v1';
const LS_TRIAL_LEGACY = 'fs_trial_v1';
const TRIAL_DURATION_DAYS = 7;

// ── READ ──────────────────────────────────────────────────────────────────

// Pull subscription row from Supabase and cache it in localStorage for fast
// synchronous reads (the rest of the app expects `userPlan()` to be sync).
export async function syncSubscription(userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;
  try {
    const { data, error } = await sb
      .from('subscriptions')
      .select('plan,status,billing_interval,current_period_end,trial_end,cancel_at_period_end,stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) { console.warn('syncSubscription:', error.message); return null; }
    if (!data) {
      localStorage.removeItem(LS_SUB_CACHE);
      return null;
    }
    localStorage.setItem(LS_SUB_CACHE, JSON.stringify(data));
    // Keep legacy LS_PLAN in sync so the existing userPlan()/gating keeps working.
    if (data.plan) localStorage.setItem(LS_PLAN_LEGACY, data.plan);
    // Keep legacy fs_trial_v1 in sync so the UI countdown keeps working when
    // the user is on a Stripe trial (status='trialing' + trial_end set).
    syncLocalTrialFromSubscription(data);
    window.dispatchEvent(new CustomEvent('fs-subscription-change'));
    return data;
  } catch (e) {
    console.warn('syncSubscription error:', e);
    return null;
  }
}

// Sync read from cache (for any place that needs it right now).
export function readCachedSubscription() {
  try {
    const raw = localStorage.getItem(LS_SUB_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSubscriptionCache() {
  localStorage.removeItem(LS_SUB_CACHE);
}

// ── TRIAL SYNC ────────────────────────────────────────────────────────────
// Bridges a Stripe `trialing` subscription into the legacy `fs_trial_v1`
// shape so the existing UI (countdown, banners, gating) keeps working
// without being rewritten.
function syncLocalTrialFromSubscription(row) {
  try {
    if (!row) return;
    const isTrialing = row.status === 'trialing' && row.trial_end;
    if (isTrialing) {
      const trialEnd = new Date(row.trial_end).getTime();
      const duration = TRIAL_DURATION_DAYS;
      const startedAt = new Date(trialEnd - duration * 24 * 60 * 60 * 1000).toISOString();
      // Preserve local-only flags (dismissedOffer, postTrialAck, notifiedDays).
      let existing = {};
      try {
        const raw = localStorage.getItem(LS_TRIAL_LEGACY);
        if (raw) existing = JSON.parse(raw) || {};
      } catch {}
      const obj = {
        ...existing,
        startedAt,
        plan: row.plan || 'plus',
        duration,
        billing: row.billing_interval === 'year' ? 'anual' : 'mensal',
        autoRenew: !row.cancel_at_period_end,
        cancelledAt: row.cancel_at_period_end ? (existing.cancelledAt || new Date().toISOString()) : null,
        converted: false,
        stripeBacked: true,
      };
      localStorage.setItem(LS_TRIAL_LEGACY, JSON.stringify(obj));
    } else if (row.status === 'active') {
      // User paid — mark the trial object (if any) as converted so UI shows
      // "Flow Plus ativo" instead of a trial countdown.
      try {
        const raw = localStorage.getItem(LS_TRIAL_LEGACY);
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj && !obj.converted) {
            obj.converted = true;
            localStorage.setItem(LS_TRIAL_LEGACY, JSON.stringify(obj));
          }
        }
      } catch {}
    }
  } catch (e) {
    console.warn('syncLocalTrialFromSubscription error:', e);
  }
}

// ── WRITE / ACTIONS ───────────────────────────────────────────────────────

// Kick off Stripe Checkout. Redirects the browser to Stripe's hosted page.
export async function startCheckout({ plan = 'plus', interval = 'month', withTrial = true } = {}) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('supabase_unavailable');

  const { data, error } = await sb.functions.invoke('create-checkout-session', {
    body: { plan, interval, withTrial },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('no_checkout_url');

  window.location.href = data.url;
}

// Open Stripe Billing Portal (hosted page to cancel / upgrade / update card / invoices).
// Redirects the browser. Requires the user already has a stripe_customer_id.
export async function openCustomerPortal({ returnTo } = {}) {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('supabase_unavailable');

  const body = returnTo ? { returnTo } : {};
  const { data, error } = await sb.functions.invoke('create-portal-session', { body });
  if (error) throw error;
  if (!data?.url) throw new Error(data?.error || 'no_portal_url');

  window.location.href = data.url;
}

// Poll Supabase a few times right after returning from Checkout so the UI
// updates as soon as the webhook lands.
export async function pollSubscriptionUntilActive(userId, { tries = 8, intervalMs = 1500 } = {}) {
  for (let i = 0; i < tries; i++) {
    const row = await syncSubscription(userId);
    if (row && (row.status === 'trialing' || row.status === 'active')) return row;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return null;
}
