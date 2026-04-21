// ── useBetaStatus ────────────────────────────────────────────────────────
// Single source of truth for whether the beta is still running.
// Reads `fs_app_settings` row with key='beta_ended_at' once per session and
// caches the result in module-level memory to avoid re-fetching across
// mounts. Components should call `useBetaStatus()` and branch UI on
// `isBetaActive`.
//
// Shape:
//   { isBetaActive: boolean | null, betaEndedAt: string | null, loading: boolean }
//
// `isBetaActive === null` means we haven't finished loading yet — treat that
// as "assume beta is active" for the hide/show-upgrade UI (safer default:
// don't allow checkout until we know for sure).
//
// The admin panel dispatches `fs-beta-ended` when it flips the flag, and
// this hook listens for it so the UI updates without a full reload.
//
// RLS on `fs_app_settings` allows any authenticated user to SELECT (see
// 20260422_beta_rewards_finalize.sql), so this is safe to call from the
// client.

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabase';

const CACHE = {
  betaEndedAt: undefined,   // undefined = not yet loaded; null = still running; string = ended
  loadedAt: 0,
  inflight: null,
};

// Slightly stale is fine — this flag flips at most once in the app's life.
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchBetaEndedAt() {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('fs_app_settings')
      .select('value')
      .eq('key', 'beta_ended_at')
      .maybeSingle();
    if (error) {
      console.warn('useBetaStatus: fetch error', error.message);
      return null;
    }
    return data?.value?.at || null;
  } catch (e) {
    console.warn('useBetaStatus: fetch exception', e);
    return null;
  }
}

function cacheIsFresh() {
  return (
    CACHE.betaEndedAt !== undefined &&
    Date.now() - CACHE.loadedAt < CACHE_TTL_MS
  );
}

async function loadOrReuse() {
  if (cacheIsFresh()) return CACHE.betaEndedAt;
  if (CACHE.inflight) return CACHE.inflight;
  CACHE.inflight = (async () => {
    const v = await fetchBetaEndedAt();
    CACHE.betaEndedAt = v;
    CACHE.loadedAt = Date.now();
    CACHE.inflight = null;
    return v;
  })();
  return CACHE.inflight;
}

// Invalidate the cache — AdminInvitesPage calls this after fs_end_beta().
export function invalidateBetaStatusCache() {
  CACHE.betaEndedAt = undefined;
  CACHE.loadedAt = 0;
  CACHE.inflight = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fs-beta-ended'));
  }
}

export default function useBetaStatus() {
  const initial = cacheIsFresh() ? CACHE.betaEndedAt : undefined;
  const [betaEndedAt, setBetaEndedAt] = useState(initial ?? null);
  const [loading, setLoading] = useState(initial === undefined);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const v = await loadOrReuse();
      if (!cancelled) {
        setBetaEndedAt(v);
        setLoading(false);
      }
    })();

    const onBetaEnded = async () => {
      const v = await fetchBetaEndedAt();
      CACHE.betaEndedAt = v;
      CACHE.loadedAt = Date.now();
      if (!cancelled) setBetaEndedAt(v);
    };
    window.addEventListener('fs-beta-ended', onBetaEnded);

    return () => {
      cancelled = true;
      window.removeEventListener('fs-beta-ended', onBetaEnded);
    };
  }, []);

  // If we're still loading AND have no cached value, treat beta as active
  // (safer default — don't show checkout buttons before we know).
  const isBetaActive = loading ? true : !betaEndedAt;

  return { isBetaActive, betaEndedAt, loading };
}
