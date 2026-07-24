/* ─────────────────────────────────────────────────
   Service Worker — القرآن الكريم
   Caches: app shell, Quran API responses, audio CDN
   Strategy:
     • App shell  → Cache-first, network fallback
     • API/Audio  → Cache-first, background revalidate
   ───────────────────────────────────────────────── */

const APP_SHELL_CACHE  = 'quran-shell-v2';
const API_CACHE        = 'quran-api-v2';
const AUDIO_CACHE      = 'quran-audio-v2';

const ALL_CACHES = [APP_SHELL_CACHE, API_CACHE, AUDIO_CACHE];

// App shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

/* ── INSTALL ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

/* ── ACTIVATE: delete old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── FETCH ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // ── Quran API (api.alquran.cloud) ──
  if (url.hostname === 'api.alquran.cloud') {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // ── Audio CDN (cdn.islamic.network) ──
  if (url.hostname === 'cdn.islamic.network') {
    event.respondWith(cacheFirst(request, AUDIO_CACHE));
    return;
  }

  // ── App shell (same origin) ──
  if (url.origin === self.location.origin) {
    event.respondWith(
      cacheFirst(request, APP_SHELL_CACHE).catch(() =>
        // SPA fallback: always return index.html for navigation requests
        request.mode === 'navigate'
          ? caches.match('/index.html')
          : new Response('Offline', { status: 503 })
      )
    );
    return;
  }

  // ── Everything else: network with cache fallback ──
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

/* ────── Strategy helpers ────── */

/** Cache-first: serve from cache, fetch only on miss */
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const network = await fetch(request);
  if (network && network.status === 200) {
    cache.put(request, network.clone());
  }
  return network;
}

/** Stale-while-revalidate: serve from cache instantly, update cache in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((network) => {
    if (network && network.status === 200) {
      cache.put(request, network.clone());
    }
    return network;
  }).catch(() => null);

  return cached || await fetchPromise || new Response(
    JSON.stringify({ error: 'Offline and not cached' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}
