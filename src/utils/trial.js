// ── Trial lifecycle ──
// Trial state lives in localStorage: fs_trial_v1
// Shape: { startedAt: ISOString, plan: 'plus', duration: 7, converted: bool, dismissedOffer: bool, postTrialAck: bool }
// Flags:
//   - startedAt: when trial was activated
//   - plan: which plan the trial grants ('plus')
//   - duration: days (default 7)
//   - converted: user upgraded (paid) — trial obj kept for reference but effectivePlan comes from LS_PLAN
//   - dismissedOffer: user closed the conversion modal
//   - postTrialAck: user dismissed the post-trial persistent banner

const LS_TRIAL = 'fs_trial_v1';
export const TRIAL_DURATION_DAYS = 7;

export function getTrial() {
  try {
    const raw = localStorage.getItem(LS_TRIAL);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function saveTrial(obj) {
  try { localStorage.setItem(LS_TRIAL, JSON.stringify(obj)); } catch {}
}

export function startTrial(plan = 'plus', duration = TRIAL_DURATION_DAYS, billing = 'mensal') {
  const existing = getTrial();
  if (existing) return existing; // prevent restart
  const obj = {
    startedAt: new Date().toISOString(),
    plan,
    duration,
    billing,                // 'mensal' | 'anual' — determines what amount is charged on expiry
    autoRenew: true,        // if true, converts to paid plan when trial ends
    cancelledAt: null,      // set when user cancels before expiry
    converted: false,
    dismissedOffer: false,
    postTrialAck: false,
    notifiedDays: [],
  };
  saveTrial(obj);
  return obj;
}

// Cancel auto-renew (user still has trial access until end-date)
export function cancelTrial() {
  const t = getTrial();
  if (!t) return;
  t.autoRenew = false;
  t.cancelledAt = new Date().toISOString();
  saveTrial(t);
}

// Re-enable auto-renew (if user changes mind before expiry)
export function reactivateTrial() {
  const t = getTrial();
  if (!t) return;
  t.autoRenew = true;
  t.cancelledAt = null;
  saveTrial(t);
}

// Run on every trialTick. If the trial has expired and autoRenew is on and
// the user hasn't converted, auto-upgrade the stored plan + mark converted.
// Returns true if a conversion happened (caller can show a toast / reload plan).
export function processExpiry(writePlan) {
  const t = getTrial();
  if (!t) return false;
  if (t.converted) return false;
  const elapsed = Date.now() - new Date(t.startedAt).getTime();
  const total = (t.duration || TRIAL_DURATION_DAYS) * 24 * 60 * 60 * 1000;
  if (elapsed < total) return false; // still active
  if (!t.autoRenew) return false;    // expired but cancelled → stay free
  // Auto-convert
  if (writePlan) writePlan(t.plan || 'plus');
  t.converted = true;
  t.autoConverted = true;            // for UI distinction
  saveTrial(t);
  return true;
}

// Returns detailed trial status for UI
export function getTrialStatus() {
  const t = getTrial();
  if (!t || !t.startedAt) return { hasTrial: false };
  const start = new Date(t.startedAt).getTime();
  const now = Date.now();
  const elapsedMs = now - start;
  const totalMs = (t.duration || TRIAL_DURATION_DAYS) * 24 * 60 * 60 * 1000;
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const daysElapsed = Math.floor(elapsedMs / (24 * 60 * 60 * 1000));
  const daysLeft = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const active = remainingMs > 0 && !t.converted;
  const expired = remainingMs <= 0 && !t.converted;
  return {
    hasTrial: true,
    trial: t,
    active,
    expired,
    converted: !!t.converted,
    autoConverted: !!t.autoConverted,
    autoRenew: t.autoRenew !== false,
    cancelled: !!t.cancelledAt,
    billing: t.billing || 'mensal',
    daysLeft,
    daysElapsed,
    remainingMs,
    plan: t.plan,
    startedAt: t.startedAt,
    dismissedOffer: !!t.dismissedOffer,
    postTrialAck: !!t.postTrialAck,
  };
}

// Computes the date on which the user will be charged (trial end date)
export function getChargeDate() {
  const t = getTrial();
  if (!t) return null;
  return new Date(new Date(t.startedAt).getTime() + (t.duration || TRIAL_DURATION_DAYS) * 24 * 60 * 60 * 1000);
}

// Called when the user upgrades to a paid plan — marks the trial as converted
export function markConverted() {
  const t = getTrial();
  if (!t) return;
  t.converted = true;
  saveTrial(t);
}

export function dismissOffer() {
  const t = getTrial();
  if (!t) return;
  t.dismissedOffer = true;
  saveTrial(t);
}

export function ackPostTrial() {
  const t = getTrial();
  if (!t) return;
  t.postTrialAck = true;
  saveTrial(t);
}

export function markNotified(day) {
  const t = getTrial();
  if (!t) return;
  if (!Array.isArray(t.notifiedDays)) t.notifiedDays = [];
  if (!t.notifiedDays.includes(day)) t.notifiedDays.push(day);
  saveTrial(t);
}

// Resolve the plan the user effectively has right now, considering the trial.
// storedPlan is the raw LS_PLAN value (default 'free').
//
// BETA MODE: quando VITE_BETA_MODE=true, todos os utilizadores logados têm
// acesso total (plano 'max'). Removemos este flag quando abrirmos ao público.
export function effectivePlan(storedPlan) {
  if (import.meta.env.VITE_BETA_MODE === 'true' || import.meta.env.VITE_BETA_MODE === '1') {
    return 'max';
  }
  const status = getTrialStatus();
  if (status.active) {
    // Trial always grants at least 'plus'. If user also has 'max', keep it.
    if (storedPlan === 'max') return 'max';
    return status.plan || 'plus';
  }
  return storedPlan || 'free';
}

// Only true if the trial exists and has expired without conversion
export function isPostTrial() {
  const s = getTrialStatus();
  return s.expired && !s.converted;
}
