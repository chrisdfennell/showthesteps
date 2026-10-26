/* Keeps a copy of the site so it works offline once it has been opened.
   Pages are fetched fresh whenever there's a connection (so updates show straight away),
   and the saved copy is used when there isn't. The fonts are the site's own files too (assets/fonts).
   Adding a page: put it in PAGES (its real file, with its folder); a language adds its files under assets/i18n/ here too.
   Change VERSION to throw away everything saved before.
   Pages are opened by readable addresses (helpers/order-of-operations, no .html): offline, such an address is found
   under its file's name.
   This file stays at the top of the site: a service worker only looks after the pages in its own folder and below. */
var VERSION = "v11";
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
  "helpers/nursing.html", "helpers/pharmacy.html", "helpers/carpentry.html", "helpers/electrical.html", "helpers/hvac-plumbing.html",
  "helpers/machining.html", "helpers/automotive.html", "helpers/cooking.html", "helpers/business.html", "helpers/real-estate.html",
  "practice/sets.html", "practice/worksheets.html", "practice/flash-cards.html", "practice/problem-of-the-day.html", "practice/progress.html", "practice/skills.html", "practice/review.html", "practice/class-results.html",
  "reference/sheets.html", "reference/definitions.html", "info/about.html", "info/privacy.html", "info/help.html", "info/embed.html", "tests/self-test.html",
  "assets/site.js", "assets/nav.js", "assets/progress.js", "assets/glossary.js", "assets/search.js", "assets/tools.js", "assets/tutor.js", "assets/play.js", "assets/a11y.js", "assets/embed.js", "assets/qr.js", "assets/standards.js", "assets/assign.js", "assets/photo.js", "assets/voice.js",
  // the site in other languages (assets/i18n.js): the shared strings of each language, and each helper's own
  "assets/i18n.js", "assets/i18n/en.js", "assets/i18n/es.js",
  "assets/i18n/en/addition.js", "assets/i18n/en/subtraction.js", "assets/i18n/en/multiplication.js", "assets/i18n/en/division.js", "assets/i18n/en/fractions.js", "assets/i18n/en/percents.js",
  "assets/i18n/es/addition.js", "assets/i18n/es/subtraction.js", "assets/i18n/es/multiplication.js", "assets/i18n/es/division.js", "assets/i18n/es/fractions.js", "assets/i18n/es/percents.js",
  "assets/i18n/en/algebra.js", "assets/i18n/en/automotive.js", "assets/i18n/en/aviation.js",
  "assets/i18n/en/business.js", "assets/i18n/en/calculus.js", "assets/i18n/en/carpentry.js",
  "assets/i18n/en/college-statistics.js", "assets/i18n/en/complex-numbers.js", "assets/i18n/en/cooking.js",
  "assets/i18n/en/counting.js", "assets/i18n/en/electrical.js", "assets/i18n/en/exponents.js",
  "assets/i18n/en/factors-and-primes.js", "assets/i18n/en/functions.js", "assets/i18n/en/geometry.js",
  "assets/i18n/en/graphing.js", "assets/i18n/en/hvac-plumbing.js", "assets/i18n/en/lines-and-slope.js",
  "assets/i18n/en/logarithms.js", "assets/i18n/en/machining.js", "assets/i18n/en/matrices-and-vectors.js",
  "assets/i18n/en/money-math.js", "assets/i18n/en/negative-numbers.js", "assets/i18n/en/number-sense.js",
  "assets/i18n/en/nursing.js", "assets/i18n/en/order-of-operations.js", "assets/i18n/en/pharmacy.js",
  "assets/i18n/en/probability.js", "assets/i18n/en/quadratics.js", "assets/i18n/en/radicals.js",
  "assets/i18n/en/ratios.js", "assets/i18n/en/real-estate.js", "assets/i18n/en/scratch-paper.js",
  "assets/i18n/en/sequences.js", "assets/i18n/en/statistics.js", "assets/i18n/en/story-problems.js",
  "assets/i18n/en/trigonometry.js", "assets/i18n/en/unit-conversions.js",
  "assets/i18n/es/algebra.js", "assets/i18n/es/automotive.js", "assets/i18n/es/aviation.js",
  "assets/i18n/es/business.js", "assets/i18n/es/calculus.js", "assets/i18n/es/carpentry.js",
  "assets/i18n/es/college-statistics.js", "assets/i18n/es/complex-numbers.js", "assets/i18n/es/cooking.js",
  "assets/i18n/es/counting.js", "assets/i18n/es/electrical.js", "assets/i18n/es/exponents.js",
  "assets/i18n/es/factors-and-primes.js", "assets/i18n/es/functions.js", "assets/i18n/es/geometry.js",
  "assets/i18n/es/graphing.js", "assets/i18n/es/hvac-plumbing.js", "assets/i18n/es/lines-and-slope.js",
  "assets/i18n/es/logarithms.js", "assets/i18n/es/machining.js", "assets/i18n/es/matrices-and-vectors.js",
  "assets/i18n/es/money-math.js", "assets/i18n/es/negative-numbers.js", "assets/i18n/es/number-sense.js",
  "assets/i18n/es/nursing.js", "assets/i18n/es/order-of-operations.js", "assets/i18n/es/pharmacy.js",
  "assets/i18n/es/probability.js", "assets/i18n/es/quadratics.js", "assets/i18n/es/radicals.js",
  "assets/i18n/es/ratios.js", "assets/i18n/es/real-estate.js", "assets/i18n/es/scratch-paper.js",
  "assets/i18n/es/sequences.js", "assets/i18n/es/statistics.js", "assets/i18n/es/story-problems.js",
  "assets/i18n/es/trigonometry.js", "assets/i18n/es/unit-conversions.js",
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
