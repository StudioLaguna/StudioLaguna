/* ══════════════════════════════════════════════════
   STUDIO LAGUNA — Service Worker del Panel de Leads
   Solo cachea la "cáscara" de la app (HTML/CSS/JS/íconos).
   Los datos de leads SIEMPRE se piden en vivo a Apps Script,
   nunca se sirven desde caché, para no mostrar datos viejos.
   ══════════════════════════════════════════════════ */

const VERSION = 'v1';
const CACHE_NAME = `sl-leads-shell-${VERSION}`;

const PRECACHE_URLS = [
  '/leads/',
  '/leads/index.html',
  '/leads/leads.css',
  '/leads/leads.js',
  '/leads/manifest.json',
  '/leads/icons/icon-leads-192.png',
  '/leads/icons/icon-leads-512.png'
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
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Nunca cachear ni interceptar llamadas a Apps Script u otros orígenes:
  // los datos de leads deben ser siempre en vivo.
  if (url.origin !== self.location.origin) return;

  // Solo maneja rutas dentro de /leads/ (la cáscara de esta app)
  if (!url.pathname.startsWith('/leads/')) return;

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
