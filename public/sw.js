/*
 * The reason the offline strip can be believed.
 *
 * The strip says "OVVO still works — your journeys, boards and saved stops are all here", and until
 * now that was true only until somebody reloaded: a cold load with no network showed the browser's
 * own error page, because a page the browser has never been given cannot be drawn from nowhere. The
 * app is entirely local (no server, no API of its own), so the whole thing is one shell plus a few
 * data modules, and keeping them on the device is enough to make the promise true on a reload.
 *
 * Two behaviours, and they are deliberately different:
 *
 * - **A navigation** is network-first. Fresh markup is worth one request when there is a network;
 *   the cached copy is the answer when there is not. A successful response replaces the cached one,
 *   so a new build is picked up on the next online load rather than being pinned forever.
 * - **Everything else same-origin** is cache-first with a background fill. The bundles are
 *   content-hashed by the build, so a cached hit is the right hit; the fonts and the favicon do not
 *   change either. Nothing here is live data — live times never existed on this app — so there is
 *   nothing to keep fresh.
 *
 * Cross-origin requests (the Google font files, the IP estimate) are left to the network and to
 * their own caches: they are not this app's to store, and a stale font is not worth a stale estimate
 * of where somebody is.
 */
/*
 * **The version is bumped when the cache has to be thrown away, and it has to be now.**
 *
 * Everything below is cache-first, which is right for content-hashed bundles and wrong for
 * anything a bad answer can stick to. Two files a browser reads to decide whether this app can be
 * installed are exactly that: an old copy of `manifest.json` kept here (or of the site's page,
 * served in its place by a host long ago) is handed to Chrome on every visit, and Chrome's answer
 * is the one in its own menu — Installeren, greyed out, "this app cannot be installed" — on a
 * build that installs perfectly in a browser that has never seen the old copy.
 *
 * `v2` drops the old cache on activate, so a phone carrying a poisoned one is clean once, and the
 * two rules below make sure it cannot happen again.
 */
const CACHE = 'ovvo-shell-v2';
const SHELL = ['/', '/index.html', '/favicon.svg'];

/**
 * Files whose answer decides installability, and which must therefore never come out of a cache.
 *
 * The worker itself is here for the same reason as the manifest: a cached `sw.js` is a worker that
 * is never replaced, so every fix in this file would take a cache name bump to reach anyone.
 */
const NEVER_CACHE = ['/manifest.json', '/sw.js'];

const isUncached = (url) => NEVER_CACHE.some((each) => url.pathname === each);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      /* `reload` so the install cannot be satisfied by an older copy in the HTTP cache. */
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /* Asked of the network every time, and never stored: see `NEVER_CACHE`. */
  if (isUncached(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html').then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
