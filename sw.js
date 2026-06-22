const CACHE_NAME = 'dua-ziyarat-v16';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './audio/ashura.mp3',
  './audio/ameenallah.mp3',
  './audio/kisa.mp3',
  './audio/aleyasin.mp3',
  './audio/isteghasa.mp3',
  './audio/ahd.mp3',
  './audio/kumayl.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Is this a request for the app shell / HTML document?
function isHtml(req) {
  if (req.mode === 'navigate') return true;
  const url = new URL(req.url);
  return url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (isHtml(req)) {
    // Network-first for the page so new duas/content appear immediately when online,
    // falling back to cache when offline.
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Cache-first for static assets (audio, icons, manifest).
  e.respondWith(
    caches.match(req).then(r => r || fetch(req))
  );
});
