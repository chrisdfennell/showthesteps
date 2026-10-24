/* Keeps a copy of the site so it works offline once it has been opened.
   Pages are fetched fresh whenever there's a connection (so updates show straight away),
   and the saved copy is used when there isn't. The fonts are the site's own files too (assets/fonts).
   Adding a page: put it in PAGES (its real file, with its folder). Change VERSION to throw away everything saved before.
   Pages are opened by readable addresses (helpers/order-of-operations, no .html): offline, such an address is found
   under its file's name.
   This file stays at the top of the site: a service worker only looks after the pages in its own folder and below. */
var VERSION = "v9";
var CACHE = "helpers-" + VERSION;
var PAGES = [
  "./", "index.html", "404.html",
  "helpers/addition.html", "helpers/subtraction.html", "helpers/multiplication.html", "helpers/division.html",
  "helpers/fractions.html", "helpers/percents.html", "helpers/factors-and-primes.html", "helpers/negative-numbers.html",
  "helpers/ratios.html", "helpers/exponents.html", "helpers/order-of-operations.html", "helpers/algebra.html",
  "helpers/lines-and-slope.html", "helpers/graphing.html", "helpers/geometry.html", "helpers/statistics.html",
  "helpers/probability.html", "helpers/counting.html", "helpers/trigonometry.html", "helpers/calculus.html", "helpers/story-problems.html",
  "helpers/scratch-paper.html", "helpers/number-sense.html", "helpers/quadratics.html", "helpers/logarithms.html",
  "helpers/sequences.html", "helpers/functions.html", "helpers/radicals.html", "helpers/complex-numbers.html",
  "helpers/college-statistics.html", "helpers/matrices-and-vectors.html", "helpers/unit-conversions.html", "helpers/money-math.html", "helpers/aviation.html",
  "helpers/nursing.html", "helpers/carpentry.html", "helpers/electrical.html", "helpers/cooking.html",
  "practice/sets.html", "practice/worksheets.html", "practice/flash-cards.html", "practice/problem-of-the-day.html", "practice/progress.html", "practice/skills.html", "practice/class-results.html",
  "reference/sheets.html", "reference/definitions.html", "info/about.html", "info/privacy.html", "info/help.html", "info/embed.html", "tests/self-test.html",
  "assets/site.js", "assets/nav.js", "assets/progress.js", "assets/glossary.js", "assets/search.js", "assets/tools.js", "assets/tutor.js", "assets/play.js", "assets/embed.js", "assets/qr.js", "assets/standards.js", "assets/assign.js", "assets/photo.js",
  "reference/standards.html", "learn/index.html",
  "assets/fonts/fonts.css", "assets/fonts/archivo-latin.woff2", "assets/fonts/IBMPlexSans-Regular-Latin1.woff2", "assets/fonts/IBMPlexSans-Medium-Latin1.woff2",
  "assets/fonts/IBMPlexSans-SemiBold-Latin1.woff2", "assets/fonts/IBMPlexMono-Regular-Latin1.woff2", "assets/fonts/IBMPlexMono-SemiBold-Latin1.woff2",
  "assets/manifest.webmanifest", "assets/icons/icon.svg", "assets/icons/icon-192.png", "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png", "assets/icons/apple-touch-icon.png", "assets/icons/favicon.svg", "assets/icons/og.png"
];

// where each page lives (assets/site.js), so an old address opened offline still finds its page
try { importScripts("assets/site.js"); } catch (e) {}

self.addEventListener("install", function(e) {
  // save each file on its own, so one missing page doesn't stop the rest being saved
  e.waitUntil(caches.open(CACHE).then(function(c) {
    return Promise.all(PAGES.map(function(u) { return c.add(u).catch(function() {}); }));
  }).then(function() { return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // the site's own files: fresh when online, saved copy when offline
  e.respondWith(fetch(req).then(function(res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(CACHE).then(function(c) {
        // a page opened with ?q=… is saved once, under its plain address
        var key = url.search ? new Request(url.origin + url.pathname) : req;
        c.put(key, copy);
      });
    }
    return res;
  }).catch(function() {
    return caches.match(req, { ignoreSearch: true }).then(function(hit) {
      if (hit) return hit;
      // a readable address (…/helpers/order-of-operations) is saved under its file's name (….html)
      var last = url.pathname.split("/").pop();
      if (last && last.indexOf(".") < 0) {
        return caches.match(url.origin + url.pathname + ".html", { ignoreSearch: true }).then(function(h2) { return h2 || missing(); });
      }
      return missing();
    });

    function missing() {
      if (req.mode === "navigate") {
        // an address from before the pages were put in folders and renamed (pemdas.html?q=…): send it on
        var scope = self.registration.scope,
          to = null;
        if (self.HelperSite && url.href.indexOf(scope) === 0) {
          try { to = self.HelperSite.moved(decodeURIComponent(url.pathname.slice(new URL(scope).pathname.length))); } catch (x) {}
        }
        if (to) return Response.redirect((to.page ? self.HelperSite.url(to.page) : scope + to.file) + url.search, 302);
        return caches.match("index.html");
      }
      return new Response("", { status: 504, statusText: "Offline" });
    }
  }));
});
