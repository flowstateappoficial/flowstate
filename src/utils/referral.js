// ── REFERRAL SYSTEM ──
// Backend: Supabase (tables: referral_codes, referrals; view: fs_referral_stats;
// RPCs: fs_ensure_referral_code, fs_apply_referral).
// Per-invite reward: referrer gets +7 days trial when their invite starts a paid trial.
import { getSupabaseClient } from './supabase';

const LS_PENDING_CODE = 'fs_pending_referral_code';  // captured from /convite/:code before signup
const LS_CACHE = 'fs_referral_cache_v2';              // fallback cache for offline

const REWARDS = [
  { invites: 1, reward: '🎁 +7 dias de trial', desc: 'Prolonga o teu trial atual por uma semana', type: 'trial_plus_7d' },
  { invites: 3, reward: '🏆 Badge "Embaixador" + 1 mês Flow Plus', desc: 'Badge exclusiva + plano Plus durante 1 mês', type: 'badge_ambassador_plus_30d' },
  { invites: 10, reward: '💎 1 mês Flow Max grátis', desc: 'Acesso total ao plano Max durante 1 mês', type: 'trial_max_30d' },
];

// Badge metadata — keyed by the slug stored in referrals.reward_details.badge by the webhook.
export const BADGES_META = {
  ambassador:   { label: 'Embaixador',  icon: '🏆', color: '#f7931a', desc: '3 amigos ativados' },
  top_referrer: { label: 'Top Referrer', icon: '💎', color: '#00D764', desc: '10 amigos ativados' },
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

    const data = {
      code,
      invitesSent: Number(stats?.invites_sent ?? 0),
      invitesAccepted: Number(stats?.invites_accepted ?? 0),
      rewardsClaimed: Number(stats?.rewards_claimed ?? 0),
      badges,
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

// ── Send invite ──
// We don't have an email-sending edge function yet. This just opens the default
// mail client with a prefilled message, and optimistically bumps local cache
// (real invitesSent count only increments once the friend signs up via the link).
export function sendInvite(referralData, email) {
  if (!referralData || !email) return referralData;
  const subject = encodeURIComponent('Experimenta o Flowstate comigo');
  const body = encodeURIComponent(getShareText(referralData.code));
  try { window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank'); } catch {}
  // No optimistic increment — invitesSent is derived from the referrals table.
  return referralData;
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
