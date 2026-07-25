/* ══════════════════════════════════════════════════
   STUDIO LAGUNA — Service Worker
   Estrategia:
   - Navegación (HTML): red primero, cae a caché si no hay internet
   - Estáticos (css/js/iconos/fuentes): caché primero, actualiza en segundo plano
   ══════════════════════════════════════════════════ */

const VERSION = 'v1';
const CACHE_NAME = `studio-laguna-${VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/terminos.html',
  '/studio-laguna-styles.css',
  '/main.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo GET; deja pasar todo lo demás (POST al webhook de leads, etc.)
  if (req.method !== 'GET') return;

  // No interceptar peticiones a otros dominios (fuentes, WhatsApp, webhooks externos)
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegación de páginas: red primero, con respaldo en caché
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Estáticos: caché primero, refresca en segundo plano
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
