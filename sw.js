/* Service worker: guarda la app en el celular para que abra al tiro,
   incluso sin internet. Los datos (los gastos) siempre vienen de Google
   Sheets en vivo — eso nunca se cachea. */

const VERSION = 'gastos-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Nunca tocar las llamadas a Google (los gastos) ni nada que no sea GET.
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Red primero: si hay internet, siempre la versión más nueva.
  // Si no hay, se usa la copia guardada.
  e.respondWith(
    fetch(req)
      .then(res => {
        const copia = res.clone();
        caches.open(VERSION).then(c => c.put(req, copia));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
