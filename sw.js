/* service worker — קאשינג לאופליין */
const CACHE = 'gematria-v11';
const ASSETS = [
  './', './index.html', './css/styles.css',
  './js/gematria.js', './js/search.js', './js/ui.js',
  './manifest.json', './icon-192.png', './data/verses.v2.json', './data/values_list.json',
  './fonts/assistant-hebrew.woff2', './fonts/KeterYG-Medium.ttf', './fonts/assistant-latin.woff2',
];
self.addEventListener('install', e => {
  // cache:'reload' — עוקף את קאש ה-HTTP של הדפדפן, שאחרת עלול להזין גרסאות ישנות לקאש החדש
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))
  ).then(() => self.skipWaiting()));
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
