const CACHE_NAME = 'mop-mjerenje-v74';
const urlsToCache = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './rename_vent.js',
  './chart_view.js',
  './prev_measurement.js',
  './slike/uredjaji/GA5000.jpg',
  './slike/uredjaji/Optima-Biogas.png',
  './slike/odlagalista/Krizevci.jpg',
  './slike/odlagalista/Koprivnica.jpg',
  './slike/odlagalista/Virovitica.jpg',
  './slike/odlagalista/Grubisno-Polje.jpg',
  './slike/odlagalista/Belisce.jpg',
  './slike/odlagalista/Beli-Manastir.jpg',
  './slike/odlagalista/Pag.jpg',
  './slike/odlagalista/Otocac.jpg',
  './slike/odlagalista/Zadar.jpg',
  './slike/odlagalista/Karepovac.jpg',
  './slike/odlagalista/Knin.jpg',
  './slike/odlagalista/Obrovac.jpg',
  './slike/odlagalista/Labin.jpg',
  './slike/odlagalista/Zapresic.jpg',
  './slike/odlagalista/Griza.jpg',
  './slike/odlagalista/Cres.jpg',
  './slike/odlagalista/Bedekovcina.jpg',
  './slike/odlagalista/Rovinj.jpg',
  './slike/odlagalista/Pazin.jpg',
  './slike/odlagalista/Biljane-Donje.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(urlsToCache.map(url => cache.add(url).catch(() => {})));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Obrisi SVE stare cacheove
      caches.keys().then(names =>
        Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
      )
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // index.html i HTML dokumenti — UVIJEK s mreže, nikad iz cachea
  if (event.request.destination === 'document' ||
      url.pathname.endsWith('index.html') ||
      url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // JS fajlovi — uvijek s mreže
  if (event.request.destination === 'script') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Slike i ostalo — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
