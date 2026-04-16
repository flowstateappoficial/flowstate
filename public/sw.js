/* Flowstate Service Worker
 * Estratégia:
 *  - App shell (HTML/JS/CSS gerado pelo build):   network-first, cache fallback
 *  - Ícones / manifest / fontes:                   cache-first
 *  - API / Supabase / Stripe:                      nunca cache (sempre rede)
 */
const VERSION = 'flowstate-20260416-012602';
const SHELL_CACHE = `shell-${VERSION}`;
const ASSETS_CACHE = `assets-${VERSION}`;

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png',
  '/favicon-16.png',
];

const NEVER_CACHE_HOSTS = [
  'supabase.co',
  'supabase.in',
  'stripe.com',
  'api.stripe.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => ![SHELL_CACHE, ASSETS_CACHE].includes(k)).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

function isNeverCache(url) {
  return NEVER_CACHE_HOSTS.some(h => url.hostname.endsWith(h));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Apenas GETs do mesmo domínio ou de fontes/CDNs conhecidos entram em cache.
  if (isNeverCache(url)) return;

  // Navegações (HTML): network-first
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('/index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match('/index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  // Resto (assets, imagens, fontes, JS/CSS com hash): cache-first, atualiza em background
  event.respondWith((async () => {
    const cache = await caches.open(ASSETS_CACHE);
    const cached = await cache.match(req);
    if (cached) {
      // Revalida em background
      fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch {
      return Response.error();
    }
  })());
});

// Permite forçar skipWaiting a partir da app (para atualizações imediatas)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
