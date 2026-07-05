/* service worker — קאשינג לאופליין */
const CACHE = 'gematria-v3';
const ASSETS = [
  './', './index.html', './css/styles.css',
  './js/gematria.js', './js/search.js', './js/ui.js',
  './manifest.json', './data/verses.v2.json', './data/values_list.json',
  './fonts/assistant-hebrew.woff2', './fonts/assistant-latin.woff2',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
