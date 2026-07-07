// Service worker do GeriUpdates (escopo /updates).
// Estratégia: assets com cache-first; API e navegação com network-first e
// fallback ao cache — o assinante consegue reler conteúdos já abertos offline.
const CACHE = "geriupdates-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add("/updates").catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, chaveCache) {
  const cache = await caches.open(CACHE);
  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(chaveCache ?? request, resposta.clone());
    return resposta;
  } catch (erro) {
    const cacheada = await cache.match(chaveCache ?? request);
    if (cacheada) return cacheada;
    throw erro;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cacheada = await cache.match(request);
  if (cacheada) return cacheada;
  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação dentro do app → shell do SPA
  if (request.mode === "navigate" && url.pathname.startsWith("/updates")) {
    event.respondWith(networkFirst(request, "/updates"));
    return;
  }
  // Assets com hash do Vite → imutáveis
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // API do assinante → última resposta disponível quando offline
  if (url.pathname.startsWith("/api/gu/")) {
    event.respondWith(networkFirst(request));
  }
});
