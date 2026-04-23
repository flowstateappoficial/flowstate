// Registo do Service Worker + gestao do prompt de instalacao (PWA).
// O SW e registado em producao (build) ou quando o dev define VITE_ENABLE_SW=1.
// O prompt de instalacao e capturado SEMPRE (independente do SW) para maximizar
// as hipoteses de apanhar o evento beforeinstallprompt que o Chrome dispara
// muito cedo no ciclo de vida da pagina.

let deferredPrompt = null;
const listeners = new Set();
let initialised = false;

function emit() {
  const state = { canInstall: !!deferredPrompt };
  listeners.forEach(fn => { try { fn(state); } catch {} });
}

// Inicializa os listeners do prompt imediatamente - tem que ser chamado o mais
// cedo possivel (idealmente antes do React render) para nao perdermos o evento.
export function initInstallPromptCapture() {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

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

export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Garantir que o prompt e capturado mesmo se o chamador se esqueceu de
  // chamar initInstallPromptCapture() antes.
  initInstallPromptCapture();

  const isProd = import.meta.env.PROD;
  const devEnabled = import.meta.env.VITE_ENABLE_SW === '1';
  if (!isProd && !devEnabled) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Quando ha nova versao a aguardar, ativa-a imediatamente.
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
