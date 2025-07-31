const CACHE_NAME = "radio-cache-v6";
const OFFLINE_URL = "./offline.html";
const FILES_TO_CACHE = [
  "./manifest.json",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
  // index.html はキャッシュしない！
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // HTMLページ（document）はオフライン時に必ずoffline.html
  if (event.request.destination === "document") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // その他リソースはキャッシュ優先
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => caches.match(event.request).then(res => res || caches.match(OFFLINE_URL)))
  );
});
