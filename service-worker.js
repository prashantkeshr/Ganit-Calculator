/* ======================================================
   Ganit Calculator — Service Worker
   Calculator ~ by Ganit Technology | Powered by Dhurta Organisation
   BETA v0.1.0
   Cache-first strategy with network fallback.
   ====================================================== */

const CACHE_VERSION = 'ganit-v0.1.0';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE = [
  '/',
  '/index.html',
  '/css/brand.css',
  '/css/themes.css',
  '/css/main.css',
  '/css/components.css',
  '/css/rtl.css',
  '/css/print.css',
  '/js/app.js',
  '/js/brand.js',
  '/js/math-engine.js',
  '/js/storage.js',
  '/js/history.js',
  '/js/theme.js',
  '/js/i18n.js',
  '/js/router.js',
  '/js/store.js',
  '/js/registry.js',
  '/js/api/js-api.js',
  '/js/ui/sidebar.js',
  '/js/ui/command-palette.js',
  '/js/ui/history-panel.js',
  '/js/calculators/basic.js',
  '/js/calculators/scientific.js',
  '/js/calculators/engineering.js',
  '/js/calculators/financial.js',
  '/js/calculators/health.js',
  '/js/calculators/percentage.js',
  '/js/calculators/area.js',
  '/js/calculators/age.js',
  '/js/calculators/currency.js',
  '/js/calculators/programmer.js',
  '/js/calculators/equation.js',
  '/js/calculators/matrix.js',
  '/js/calculators/statistics.js',
  '/js/calculators/physics.js',
  '/js/calculators/construction.js',
  '/js/calculators/datetime.js',
  '/js/calculators/graph.js',
  '/js/web-component.js',
  '/js/plugin-system.js',
  '/js/share.js',
  '/js/keyboard.js',
  '/locales/en.json',
  '/data/currency-rates.json',
  '/assets/brand/logo.svg',
  '/manifest.webmanifest',
  '/robots.txt',
];

// ---- Install: precache all static assets ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// ---- Activate: delete old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Fetch: cache-first, fall back to network ----
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests to same origin
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Never cache chrome-extension or devtools
  if (request.url.includes('chrome-extension')) return;

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  // Static cache hit
  const cached = await caches.match(request);
  if (cached) return cached;

  // Network fetch
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline fallback
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Offline — Ganit Calculator is cached for offline use. Please reload once connected.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// ---- Message: skip waiting on demand ----
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
