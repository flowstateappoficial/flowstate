// ── useIsMobile / useBreakpoint ──
// Lightweight responsive hook built on matchMedia. Avoids re-renders on every
// resize tick (matchMedia only fires when crossing the boundary).
//
// Usage:
//   const isMobile = useIsMobile();             // default ≤ 768px
//   const isTablet = useIsMobile(1024);         // ≤ 1024px
//   const bp = useBreakpoint();                 // 'mobile' | 'tablet' | 'desktop'

import { useEffect, useState } from 'react';

export const MOBILE_MAX = 768;   // phones + small foldables
export const TABLET_MAX = 1024;  // tablets / small laptops

function safeMatch(query) {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try { return window.matchMedia(query).matches; } catch { return false; }
}

export function useIsMobile(maxWidth = MOBILE_MAX) {
  const query = `(max-width: ${maxWidth}px)`;
  const [matches, setMatches] = useState(() => safeMatch(query));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    // Initial sync in case SSR mismatch.
    setMatches(mql.matches);
    // Safari <14 uses addListener/removeListener.
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const isMobile = useIsMobile(MOBILE_MAX);
  const isTablet = useIsMobile(TABLET_MAX);
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

export default useIsMobile;
