/* Telefon sayfası salonda internetsiz de açılsın: kabuk önbellekten, föyler önce ağdan sonra son alınan kopyadan. */
const KABUK = "foy-a03f15fcde06", VERI = "foy-veri";
const DOSYALAR = ["./", "index.html", "okuma.js", "manifest.webmanifest", "ikon-192.png", "ikon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(KABUK).then((c) => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ad) => Promise.all(ad.filter((x) => x !== KABUK && x !== VERI).map((x) => caches.delete(x))))
    .then(() => self.clients.claim()));
});
async function veri(istek) {
  const c = await caches.open(VERI);
  try {
    const r = await fetch(istek);
    if (r.ok) await c.put("veri.json", r.clone());
    return r;
  } catch (e) {
    const eski = await c.match("veri.json");
    if (!eski) throw e;
    return new Response(eski.body, { headers: { "content-type": "application/json", "x-yedek": "1" } });
  }
}
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.endsWith("/veri.json")) { e.respondWith(veri(e.request)); return; }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
});
