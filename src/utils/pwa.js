// Registo do Service Worker + gestão do prompt de instalação (PWA).
// O SW é registado em produção (build) ou quando o dev define VITE_ENABLE_SW=1.

let deferredPrompt = null;
const listeners = new Set();

function emit() {
  const state = { canInstall: !!deferredPrompt };
  listeners.forEach(fn => { try { fn(state); } catch {} });
}

export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const isProd = import.meta.env.PROD;
  const devEnabled = import.meta.env.VITE_ENABLE_SW === '1';
  if (!isProd && !devEnabled) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Quando há nova versão a aguardar, ativa-a imediatamente.
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(() => {});

    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      window.location.reload();
    });
  });

  // Captura o evento que permite mostrar o prompt de instalação.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

export function subscribeInstall(fn) {
  listeners.add(fn);
  fn({ canInstall: !!deferredPrompt });
  return () => listeners.delete(fn);
}

export async function promptInstall() {
  if (!deferredPrompt) return { outcome: 'unavailable' };
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  emit();
  return { outcome };
}

export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}
