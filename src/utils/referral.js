// ── REFERRAL SYSTEM ──
// Backend: Supabase (tables: referral_codes, referrals; view: fs_referral_stats;
// RPCs: fs_ensure_referral_code, fs_apply_referral).
// Per-invite reward: referrer gets +7 days trial when their invite starts a paid trial.
import { getSupabaseClient } from './supabase';

const LS_PENDING_CODE = 'fs_pending_referral_code';  // captured from /convite/:code before signup
const LS_CACHE = 'fs_referral_cache_v2';              // fallback cache for offline

// Durante a beta fechada: recompensas são sobretudo badges + acumulação
// de meses grátis que são entregues no lançamento público (fs_pending_rewards).
const REWARDS = [
  { invites: 1,  reward: '🌱 Primeiro amigo ativado',                    desc: 'Desbloqueia a badge "Plantador" e acumulas +7 dias de trial para o launch', type: 'first_referral' },
  { invites: 3,  reward: '🏆 Badge "Embaixador" + 1 mês Plus no launch', desc: 'Badge exclusiva agora + 1 mês Flow Plus grátis quando o app sair da beta',    type: 'ambassador_beta' },
  { invites: 10, reward: '💎 Badge "Top Referrer" + 1 mês Max no launch', desc: 'Badge rara + 1 mês Flow Max grátis quando o app sair da beta',                type: 'top_referrer_beta' },
];

// Badge metadata — keyed by the slug stored in referrals.reward_details.badge by the trigger.
export const BADGES_META = {
  beta_tester:  { label: 'Beta Tester',   icon: '🧪', color: '#7c83ff', desc: 'Apanhaste o Flowstate antes do launch' },
  planter:      { label: 'Plantador',     icon: '🌱', color: '#4ade80', desc: 'Trouxeste o primeiro amigo' },
  ambassador:   { label: 'Embaixador',    icon: '🏆', color: '#f7931a', desc: '3 amigos ativados' },
  top_referrer: { label: 'Top Referrer',  icon: '💎', color: '#00D764', desc: '10 amigos ativados' },
};

// ── Pending code (capture from /convite/:code before signup) ──
export function setPendingReferralCode(code) {
  if (!code) return;
  try { localStorage.setItem(LS_PENDING_CODE, String(code).trim().toUpperCase()); } catch {}
}
export function getPendingReferralCode() {
  try { return localStorage.getItem(LS_PENDING_CODE) || null; } catch { return null; }
}
export function clearPendingReferralCode() {
  try { localStorage.removeItem(LS_PENDING_CODE); } catch {}
}

// ── Fallback local code generator (only used if Supabase unreachable) ──
export function generateReferralCode(userEmail) {
  if (!userEmail) return 'FLOW' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const base = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  const hash = Math.abs(userEmail.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)).toString(36).slice(0, 3).toUpperCase();
  return 'FLOW' + base + hash;
}

// ── Main data fetcher for ConvitesPage ──
// Returns { code, invitesSent, invitesAccepted, rewardsClaimed } or null.
export async function fetchReferralData(userId) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return loadCache();

  try {
    // 1. Ensure user has a referral code (idempotent, creates if missing).
    const { data: codeRpc, error: codeErr } = await sb.rpc('fs_ensure_referral_code');
    if (codeErr) console.warn('fs_ensure_referral_code:', codeErr.message);

    // 2. Load stats from the view.
    const { data: stats, error: statsErr } = await sb
      .from('fs_referral_stats')
      .select('code, invites_sent, invites_accepted, rewards_claimed')
      .eq('user_id', userId)
      .maybeSingle();

    if (statsErr) console.warn('fs_referral_stats:', statsErr.message);

    const code = stats?.code || codeRpc || null;
    if (!code) return loadCache();

    // 3. Load earned badges from referrals with reward_details.badge set.
    let badges = [];
    try {
      const { data: rewardedRows, error: badgeErr } = await sb
        .from('referrals')
        .select('reward_details, rewarded_at')
        .eq('referrer_user_id', userId)
        .eq('status', 'rewarded')
        .order('rewarded_at', { ascending: false });
      if (badgeErr) console.warn('referrals (badges):', badgeErr.message);
      const seen = new Set();
      for (const r of rewardedRows || []) {
        const slug = r?.reward_details?.badge;
        if (slug && !seen.has(slug)) {
          seen.add(slug);
          badges.push({ slug, earnedAt: r.rewarded_at || null });
        }
      }
    } catch (e) { console.warn('badges load error:', e); }

    // 4. Pending rewards (acumulados durante a beta, entregues no launch).
    let pending = { maxMonthsPending: 0, plusMonthsPending: 0, trialWeeksPending: 0 };
    try {
      const { data: pendRow } = await sb
        .from('fs_user_pending_rewards')
        .select('max_months_pending, plus_months_pending, trial_days_pending_weeks')
        .eq('user_id', userId)
        .maybeSingle();
      if (pendRow) {
        pending = {
          maxMonthsPending: Number(pendRow.max_months_pending ?? 0),
          plusMonthsPending: Number(pendRow.plus_months_pending ?? 0),
          trialWeeksPending: Number(pendRow.trial_days_pending_weeks ?? 0),
        };
      }
    } catch (e) { console.warn('pending rewards load:', e); }

    const data = {
      code,
      invitesSent: Number(stats?.invites_sent ?? 0),
      invitesAccepted: Number(stats?.invites_accepted ?? 0),
      rewardsClaimed: Number(stats?.rewards_claimed ?? 0),
      badges,
      pending,
    };
    saveCache(data);
    return data;
  } catch (e) {
    console.warn('fetchReferralData error:', e);
    return loadCache();
  }
}

// ── Apply referral code (called right after signup) ──
// Returns 'ok' | 'invalid_code' | 'self_referral' | 'already_referred' | 'error'.
export async function applyReferralCode(code) {
  if (!code) return 'invalid_code';
  const sb = getSupabaseClient();
  if (!sb) return 'error';
  try {
    const { data, error } = await sb.rpc('fs_apply_referral', { p_code: String(code).trim().toUpperCase() });
    if (error) { console.warn('fs_apply_referral:', error.message); return 'error'; }
    return data || 'error';
  } catch (e) {
    console.warn('applyReferralCode error:', e);
    return 'error';
  }
}

// ── Send invite (via edge function `send-referral-invite` → Resend) ──
// Returns { ok: true, method: 'email' } | { ok: true, method: 'mailto' } | { ok: false, error: string }.
// The edge function sends a real email via Resend and inserts a 'pending' row in referrals
// so the invitesSent count bumps immediately (before the friend signs up).
export async function sendInvite(referralData, email) {
  if (!referralData || !email) return { ok: false, error: 'missing_args' };
  const sb = getSupabaseClient();
  if (!sb) {
    return fallbackMailto(referralData.code, email);
  }

  try {
    // Força envio explícito do access_token do user no Authorization.
    // (Workaround para supabase-js com publishable keys novas, onde o
    // auto-attach do JWT pode falhar e o gateway/função rejeitar com 401.)
    const { data: sessData } = await sb.auth.getSession();
    const accessToken = sessData?.session?.access_token;
    const invokeOpts = {
      body: { to: email.trim().toLowerCase() },
    };
    if (accessToken) {
      invokeOpts.headers = { Authorization: `Bearer ${accessToken}` };
    }
    const { data, error } = await sb.functions.invoke('send-referral-invite', invokeOpts);
    if (error) {
      console.warn('send-referral-invite error:', error.message);
      // Backend falhou → cai para mailto como último recurso.
      return fallbackMailto(referralData.code, email);
    }
    if (data?.error) {
      console.warn('send-referral-invite returned error:', data.error);
      return { ok: false, error: data.error };
    }
    return { ok: true, method: 'email' };
  } catch (e) {
    console.warn('sendInvite error:', e);
    return fallbackMailto(referralData.code, email);
  }
}

function fallbackMailto(code, email) {
  const subject = encodeURIComponent('Experimenta o Flowstate comigo');
  const body = encodeURIComponent(getShareText(code));
  try { window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank'); } catch {}
  return { ok: true, method: 'mailto' };
}

// ── Rewards mapping ──
export function getRewardsInfo(invitesAccepted) {
  const unlocked = REWARDS.filter(r => invitesAccepted >= r.invites);
  const next = REWARDS.find(r => invitesAccepted < r.invites);
  return { unlocked, next, all: REWARDS };
}

// ── Share helpers ──
export function getReferralLink(code) {
  const origin = (typeof window !== 'undefined' && window.location?.origin) || 'https://flowstate.pt';
  return `${origin}/convite/${code}`;
}

export function getShareText(code) {
  return `Estou a usar o Flowstate para gerir as minhas finanças e está a mudar a forma como lido com o dinheiro! Experimenta grátis com o meu código: ${code}\n\n${getReferralLink(code)}`;
}

// ── Local cache (used as fallback when Supabase is unreachable) ──
function saveCache(data) {
  try { localStorage.setItem(LS_CACHE, JSON.stringify(data)); } catch {}
}
function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_CACHE) || 'null'); } catch { return null; }
}

// ── Legacy API kept for backward compatibility with older App.jsx code ──
export function loadReferralData() { return loadCache(); }
export function initReferralData(userEmail) {
  const existing = loadCache();
  if (existing) return existing;
  // Best-effort local stub; real data arrives via fetchReferralData after mount.
  const data = {
    code: generateReferralCode(userEmail),
    invitesSent: 0,
    invitesAccepted: 0,
    rewardsClaimed: 0,
  };
  saveCache(data);
  return data;
}
export function saveReferralData(data) { saveCache(data); }
