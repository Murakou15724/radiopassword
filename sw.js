const CACHE_NAME = "radio-cache-v4";
const OFFLINE_URL = "./offline.html";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
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

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => {
        // HTMLページの場合は必ず offline.html を返す
        if (event.request.destination === "document") {
          return caches.match(OFFLINE_URL);
        }
        return caches.match(event.request).then(res => res || caches.match(OFFLINE_URL));
      })
  );
});
