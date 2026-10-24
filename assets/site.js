/* Where every page and file of the site lives: the one list to change when a page is added, moved or renamed.
   Every page loads this first (before nav.js), so anything that builds a link to another page asks here.

   Inside the site a page is known by its short name, the file name it had before the pages were put in folders
   and renamed: "pemdas.html", "practice.html", "fractions.html". That is what practice-set codes, progress entries,
   saved worksheets, recent problems and the pages' own messages (page:"pemdas.html") store and send, so links and
   records made at any time keep working. PAGES below says where each one lives now.

     HelperSite.root                 the site's folder as a full address, worked out from this file's own address
     HelperSite.url(name[, params])  the full address of a page or file. name: a short name ("pemdas", "pemdas.html"),
                                     a new name ("order-of-operations"), an address ("pemdas.html?q=3%2B4"), or a
                                     file ("nav.js", "icons/og.png"); params: a query ("q=…", with or without "?"),
                                     or a "#part"
     HelperSite.path(name)           the real file, from the site's folder: "helpers/order-of-operations.html"
     HelperSite.id(name)             the short name for any of those, or for an address: "pemdas.html" (or "")
     HelperSite.here                 the short name of the page this is ("pemdas.html")
     HelperSite.moved(path)          for 404.html: where an old address lives now (see below), or null
     HelperSite.pretty               true where page addresses go without ".html"

   Readable addresses: GitHub Pages serves /helpers/order-of-operations as order-of-operations.html, so on the live
   site (and any http(s) server other than localhost) links leave ".html" off; opened as a file, or from
   `python -m http.server` on localhost, which can't do that, they keep it. With pretty addresses, links already
   in a page ("division.html", "../helpers/fractions.html") are tidied as they appear, and the page's own address
   loses its ".html" too, so Copy link and QR codes share the readable form. */
(function() {
  "use strict";
  var G = typeof window !== "undefined" ? window : self; // a page, or the service worker (sw.js imports this file)
  if (G.HelperSite) return;

  // short name → where it lives (folder/file, without .html)
  var PAGES = {
    index: "",
    addition: "helpers/addition",
    subtraction: "helpers/subtraction",
    multiplication: "helpers/multiplication",
    division: "helpers/division",
    fractions: "helpers/fractions",
    percents: "helpers/percents",
    factors: "helpers/factors-and-primes",
    integers: "helpers/negative-numbers",
    ratios: "helpers/ratios",
    exponents: "helpers/exponents",
    pemdas: "helpers/order-of-operations",
    algebra: "helpers/algebra",
    lines: "helpers/lines-and-slope",
    graphing: "helpers/graphing",
    geometry: "helpers/geometry",
    stats: "helpers/statistics",
    probability: "helpers/probability",
    counting: "helpers/counting",
    wordproblems: "helpers/story-problems",
    scratch: "helpers/scratch-paper",
    trigonometry: "helpers/trigonometry",
    calculus: "helpers/calculus",
    "number-sense": "helpers/number-sense",
    quadratics: "helpers/quadratics",
    logarithms: "helpers/logarithms",
    sequences: "helpers/sequences",
    "unit-conversions": "helpers/unit-conversions",
    "money-math": "helpers/money-math",
    aviation: "helpers/aviation",
    nursing: "helpers/nursing",
    carpentry: "helpers/carpentry",
    electrical: "helpers/electrical",
    cooking: "helpers/cooking",
    functions: "helpers/functions",
    radicals: "helpers/radicals",
    "complex-numbers": "helpers/complex-numbers",
    "college-statistics": "helpers/college-statistics",
    "matrices-and-vectors": "helpers/matrices-and-vectors",
    practice: "practice/sets",
    worksheet: "practice/worksheets",
    flashcards: "practice/flash-cards",
    daily: "practice/problem-of-the-day",
    progress: "practice/progress",
    skills: "practice/skills",
    results: "practice/class-results",
    reference: "reference/sheets",
    glossary: "reference/definitions",
    standards: "reference/standards",
    about: "info/about",
    privacy: "info/privacy",
    help: "info/help",
    embed: "info/embed",
    tests: "tests/self-test"
  };
  var FILES = { "404.html": "404.html", "sw.js": "sw.js" };
  ["site.js", "nav.js", "tools.js", "tutor.js", "play.js", "search.js", "progress.js", "glossary.js", "qr.js", "standards.js", "manifest.webmanifest"].forEach(function(a) { FILES[a] = "assets/" + a; });
  FILES["assign.js"] = "assets/assign.js"; // the "Add to assignment" button (tools.js loads it)
  FILES["photo.js"] = "assets/photo.js"; // Photo of the problem (tools.js loads it)
  FILES["embed.js"] = "assets/embed.js"; // Embed on another website (tools.js loads it)
  ["icon.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon.svg", "og.png"].forEach(function(i) { FILES["icons/" + i] = "assets/icons/" + i; });
  var FOLDERS = ["helpers", "practice", "reference", "info", "learn", "tests"];
  var ALIAS = {}; // a page's own file name → its short name
  Object.keys(PAGES).forEach(function(k) { ALIAS[k] = k; if (PAGES[k]) ALIAS[PAGES[k].split("/")[1]] = k; });
  var has = function(o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  var LOC = G.location,
    LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(LOC.hostname);
  var PRETTY = /^https?:$/.test(LOC.protocol) && !LOCAL;

  // this file is <root>/assets/site.js
  function findRoot() {
    if (typeof document === "undefined") return LOC.href.replace(/[^\/]*$/, ""); // sw.js, at the top of the site
    var src = (document.currentScript && document.currentScript.src) || "";
    if (!/assets\/site\.js/.test(src)) {
      var s = document.querySelector('script[src*="assets/site.js"]');
      src = s ? s.src : "";
    }
    if (src) return src.replace(/assets\/site\.js(?:[?#].*)?$/, "");
    var here = LOC.href.split(/[?#]/)[0].replace(/[^\/]*$/, "");
    return /\/(helpers|practice|reference|info|learn|tests|assets)\/$/.test(here) ? here.replace(/[^\/]+\/$/, "") : here;
  }
  var ROOT = findRoot();

  // the short name of a page, from any way of naming it; "" when it isn't one of the pages
  function shortName(name) {
    var raw = String(name || "").split(/[?#]/)[0];
    if (raw.indexOf(ROOT) === 0) raw = raw.slice(ROOT.length);
    // the lessons (learn/…) have no short names; some share a helper's file name (learn/unit-conversions.html) or "index"
    if (/(?:^|\/)learn\/[^\/]*$/i.test(raw)) return "";
    var n = raw.replace(/^.*\//, "").toLowerCase().replace(/\.html$/, "");
    if (n === "") return raw === "" || (raw.charAt(0) === "/" && ROOT.indexOf(raw) >= 0) ? "index" : "";
    return has(ALIAS, n) ? ALIAS[n] : "";
  }

  function id(name) { var k = shortName(name); return k ? k + ".html" : ""; }

  function fileKey(name) { // "nav.js", "icons/og.png" from any address of them
    var n = String(name || "").split(/[?#]/)[0].replace(/^.*\/(?=icons\/)/, "");
    if (!/^icons\//.test(n)) n = n.replace(/^.*\//, "");
    return n.toLowerCase();
  }

  function path(name) {
    var k = shortName(name);
    if (k) return k === "index" ? "" : PAGES[k] + ".html";
    var f = fileKey(name);
    return has(FILES, f) ? FILES[f] : String(name).split(/[?#]/)[0].replace(/^\.?\//, "");
  }

  function pageAddress(k) { return k === "index" ? "" : PAGES[k] + (PRETTY ? "" : ".html"); }

  function url(name, params) {
    var s = String(name || ""),
      q = "",
      h = "";
    var hi = s.indexOf("#");
    if (hi >= 0) {
      h = s.slice(hi);
      s = s.slice(0, hi);
    }
    var qi = s.indexOf("?");
    if (qi >= 0) {
      q = s.slice(qi + 1);
      s = s.slice(0, qi);
    }
    var p = params === undefined || params === null ? "" : String(params);
    var phi = p.indexOf("#");
    if (phi >= 0) {
      h = p.slice(phi);
      p = p.slice(0, phi);
    }
    p = p.replace(/^\?/, "");
    q = [q, p].filter(Boolean).join("&");
    var k = shortName(s);
    return ROOT + (k ? pageAddress(k) : path(s)) + (q ? "?" + q : "") + h;
  }
  /* An address from before the move (a path from the site's folder, as 404.html sees it), and where it lives now:
       pemdas.html, pemdas, order-of-operations        (a page at the top)       → the page
       helpers/pemdas.html, helpers/pemdas, practice/practice.html, tests/tests  (the first folders, old names) → the page
       practice/, reference/, tests/, helpers/          (a folder on its own)    → its main page (sets, sheets, …)
       icons/og.png, nav.js, manifest.webmanifest       (files at the top)        → assets/…
     → { page:"pemdas.html" } or { file:"assets/icons/og.png" }, or null for anything else */
  function moved(rel) {
    var r = String(rel || "").replace(/^\/+/, ""),
      lower = r.toLowerCase();
    var f = fileKey(r);
    if (has(FILES, f) && FILES[f] !== r && (lower === f || /^icons\//.test(lower))) return { file: FILES[f] };
    var parts = lower.split("/");
    // a folder on its own (practice/, from an old practice address): its main page
    var MAIN = { helpers: "index", practice: "practice", reference: "reference", tests: "tests" };
    if (parts.length === 2 && parts[1] === "" && has(MAIN, parts[0])) return { page: MAIN[parts[0]] + ".html" };
    if (parts.length > 2 || (parts.length === 2 && FOLDERS.indexOf(parts[0]) < 0)) return null;
    var k = shortName(parts[parts.length - 1]);
    if (!k || k === "index") return null;
    if (parts[parts.length - 1].replace(/\.html$/, "") === "") return null;
    if (r === PAGES[k] || r === PAGES[k] + ".html") return null; // the page itself: nothing to do
    return { page: k + ".html" };
  }

  // this page's short name, when it is open at its own address (with or without .html); not on 404.html
  var here = "";
  if (typeof document !== "undefined") {
    var at = LOC.href.split(/[?#]/)[0],
      hk = shortName(at);
    if (hk && (hk === "index" ? at === ROOT || at === ROOT + "index.html" : at === ROOT + PAGES[hk] || at === ROOT + PAGES[hk] + ".html")) here = hk + ".html";
  }

  /* readable addresses on the page: its own address, and every link to a page of the site, as they appear */
  function tidy(a) {
    var h = a.getAttribute("href");
    if (!h || /^(#|mailto:|javascript:|data:|blob:)/i.test(h)) return;
    var abs = a.href;
    if (abs.indexOf(ROOT) !== 0) return;
    var bare = abs.split(/[?#]/)[0];
    if (!/\.html$/i.test(bare)) return;
    var k = shortName(bare);
    if (!k) return;
    var to = ROOT + pageAddress(k) + abs.slice(bare.length);
    if (to !== abs) a.setAttribute("href", to);
  }
  if (PRETTY && typeof document !== "undefined") {
    try {
      if (here && /\.html$/i.test(LOC.pathname) && G.history && history.replaceState)
        history.replaceState(history.state, "", ROOT + pageAddress(shortName(here)) + LOC.search + LOC.hash);
    } catch (e) {}
    var sweep = function(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.tagName === "A" && node.hasAttribute("href")) tidy(node);
      if (node.querySelectorAll)[].forEach.call(node.querySelectorAll("a[href]"), tidy);
    };
    var watch = function() {
      sweep(document.documentElement);
      if (G.MutationObserver) new MutationObserver(function(list) {
        list.forEach(function(m) {
          if (m.type === "attributes") tidy(m.target);
          else [].forEach.call(m.addedNodes, sweep);
        });
      }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch);
    else watch();
  }

  G.HelperSite = { root: ROOT, url: url, path: path, id: id, here: here, moved: moved, pretty: PRETTY, pages: PAGES };
})();
