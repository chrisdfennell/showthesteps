/* The site in more than one language. Every string a page shows is looked up here by a key ("nav.arith",
   "common.showAll", "addition.carryNote"), in the language the visitor chose, falling back to English and then to
   the key itself. English is the source of truth (assets/i18n/en.js); each other language is a copy of it with the
   values translated (assets/i18n/es.js …). A helper's own strings are in a file of their own, loaded only on that
   page (assets/i18n/en/addition.js, assets/i18n/es/addition.js …). How to add a language: docs/TRANSLATING.md.

     HelperI18n.lang               the language in use ("en", "es")
     HelperI18n.tag                its BCP 47 tag for Intl and speech ("en-US", "es-US")
     HelperI18n.langs              [{ code, name, tag }] every language there is, by its own name
     HelperI18n.t(key[, vars])     the string for key, with {name} filled in from vars (vars are put in as they are:
                                   HTML stays HTML, so escape what a visitor typed). Plurals:
                                     "{n} {n|problem|problems}"           forms in the order one | other
                                     "{n|one:problema|other:problemas}"   or by name (zero, one, two, few, many, other)
                                     { one: "{n} problem", other: "{n} problems", "=0": "no problems" }  a whole value
                                   the form is picked by Intl.PluralRules for the language
     HelperI18n.has(key)           true when the language in use has its own string for key
     HelperI18n.raw(key)           a value as the locale file gave it (a word table, a list), not filled in
     HelperI18n.n(x[, opts])       a number written the language's way (Intl.NumberFormat with the language's
                                   numbers locale; es uses es-US: 1,234.5)
     HelperI18n.d(date[, opts])    a date the same way (Intl.DateTimeFormat)
     HelperI18n.add(lang, strings) a locale file's strings (each file calls this once)
     HelperI18n.typed(lang, data)  a locale file's words for typed problems (number words, math words)
     HelperI18n.normalize(text)    a typed problem in the language in use, turned into what the readers know
                                   ("tres cuartos de veinte" → "3/4 of 20"); English, or text with nothing to
                                   change, comes back exactly as it was
     HelperI18n.apply([root])      put the language into the page's own markup: data-i18n="key" (its inner HTML),
                                   data-i18n-attr="aria-label=key;title=key2". English leaves the markup alone.
     HelperI18n.set(code)          choose a language: remembered on this device, and the page opens again in it
     HelperI18n.link(url)          url with lang= added when this visit's links should carry it
     HelperI18n.ready(fn)          fn once the language's strings are loaded (at once on a page that loads this
                                   file in its <head>)
     HelperI18n.missing()          keys asked for that the language in use doesn't have (for testing)

   Which language: ?lang=es in the address (kept in the page's own address and links, so Copy link and QR codes
   share it), else this visit's choice, else the one remembered on this device (localStorage "helpers-lang"), else
   English. A browser set to a language the site has, with nothing chosen yet, gets a small offer to switch
   ("¿Ver en español?") but is never switched without asking. <html lang> follows the choice.

   Loading: a page that has its own strings loads this file in its <head>, right after site.js:
     <script src="../assets/i18n.js" data-strings="addition"></script>
   and this file writes in the locale files (so the page's scripts can use t() straight away). On every other page
   nav.js loads it, with the shared locale files, before search.js and tools.js. */
(function() {
  "use strict";
  if (window.HelperI18n) return;

  /* ---- the languages: one line each. code: the file name in assets/i18n/; name: in the language itself;
     tag: for <html lang>, Intl and speech; numbers / dates: the Intl locale for writing them (es-US keeps the
     decimal point and comma thousands that US schools use; es-ES would give 1.234,5); offer, yes, no: the words of
     the "switch to this language?" offer, shown before the language's own file is loaded ---- */
  var LANGS = [
    { code: "en", name: "English", tag: "en-US", numbers: "en-US", dates: "en-US" },
    { code: "es", name: "Español", tag: "es-US", numbers: "es-US", dates: "es-US", offer: "¿Ver esta página en español?", yes: "Sí, en español", no: "No, gracias" }
  ];

  var KEY = "helpers-lang",
    VISIT = "helpers-lang-visit",
    OFFER = "helpers-lang-offer";
  var STR = {},
    TYPED = {},
    MISSING = {};
  var BY = {};
  LANGS.forEach(function(l) {
    BY[l.code] = l;
    STR[l.code] = {};
  });
  var has = function(o, k) { return Object.prototype.hasOwnProperty.call(o, k); };

  function store(kind) { try { return window[kind]; } catch (e) { return null; } }

  function get(kind, k) { try { var s = store(kind); return s ? s.getItem(k) : null; } catch (e) { return null; } }

  function put(kind, k, v) {
    try {
      var s = store(kind);
      if (!s) return;
      if (v === null) s.removeItem(k);
      else s.setItem(k, v);
    } catch (e) {}
  }

  function known(c) { return !!c && has(BY, c); }

  function code(c) { return String(c || "").toLowerCase().split(/[-_]/)[0]; }

  /* ---- which language ---- */
  // the address the page was opened with: a page may already have rewritten its own (dropping lang=) by the time
  // nav.js loads this file
  function opened() {
    try { var e = performance.getEntriesByType && performance.getEntriesByType("navigation")[0]; if (e && e.name) return e.name.split("#")[0]; } catch (x) {}
    return "";
  }

  function fromUrl() {
    var m = /[?&]lang=([A-Za-z_-]+)/.exec(location.search) || /[?&]lang=([A-Za-z_-]+)/.exec(opened().replace(/^[^?]*/, ""));
    return m && known(code(m[1])) ? code(m[1]) : "";
  }

  // a page inside the self-test reads its English, unless its own address asks for a language
  function inSelfTest() {
    try { return window.top !== window.self && /\/tests\/(self-test|tests)(\.html)?$/i.test(window.top.location.pathname); } catch (e) { return false; }
  }

  function pick() {
    var u = fromUrl();
    if (u) return { lang: u, from: "url" };
    if (inSelfTest()) return { lang: "en", from: "test" };
    var v = code(get("sessionStorage", VISIT));
    if (known(v)) return { lang: v, from: "visit" };
    var s = code(get("localStorage", KEY));
    if (known(s)) return { lang: s, from: "saved" };
    return { lang: "en", from: "default" };
  }
  var chosen = pick();
  var LANG = chosen.lang,
    L = BY[LANG];
  if (chosen.from === "url") put("sessionStorage", VISIT, LANG); // the rest of this visit stays in it
  // the address and the page's links carry lang= when the language isn't English, or when the link asked for one
  var CARRY = LANG !== "en" || chosen.from === "url";
  if (LANG !== "en") document.documentElement.setAttribute("lang", L.tag.split("-")[0]);

  /* ---- strings ---- */
  function add(lang, strings) {
    var c = code(lang);
    if (!has(STR, c)) STR[c] = {};
    for (var k in strings)
      if (has(strings, k)) STR[c][k] = strings[k];
  }

  var rules = {};

  function plural(n) {
    var x = Number(n);
    if (!isFinite(x)) return "other";
    try {
      if (!rules[LANG]) rules[LANG] = new Intl.PluralRules(L.tag);
      return rules[LANG].select(x);
    } catch (e) { return x === 1 ? "one" : "other"; }
  }

  function form(forms, n) { // forms: { one, other, "=0" … }
    if (has(forms, "=" + n)) return forms["=" + n];
    var p = plural(n);
    return has(forms, p) ? forms[p] : has(forms, "other") ? forms.other : "";
  }

  function fill(s, vars) {
    return String(s).replace(/\{([A-Za-z_][\w.]*)(\|[^{}]*)?\}/g, function(m, name, forms) {
      if (!vars || !has(vars, name)) return m;
      var v = vars[name];
      if (!forms) return v === null || v === undefined ? "" : String(v);
      var parts = forms.slice(1).split("|"),
        named = {};
      if (parts.some(function(p) { return /^(=\d+|zero|one|two|few|many|other):/.test(p); })) {
        parts.forEach(function(p) { var i = p.indexOf(":"); if (i > 0) named[p.slice(0, i)] = p.slice(i + 1); });
      } else {
        named.one = parts[0];
        named.other = parts[parts.length - 1];
      }
      return form(named, v);
    });
  }

  function look(key) {
    if (has(STR[LANG], key)) return STR[LANG][key];
    if (LANG !== "en") MISSING[key] = true;
    if (has(STR.en, key)) return STR.en[key];
    return null;
  }

  function t(key, vars) {
    var s = look(key);
    if (s === null) return key;
    if (s && typeof s === "object") s = form(s, vars && has(vars, "n") ? vars.n : vars && has(vars, "count") ? vars.count : 0);
    return fill(s, vars);
  }

  function hasKey(key) { return has(STR[LANG], key); }

  // a value as it was added (a table, a list), in the language in use, else English, else undefined
  function raw(key) { return has(STR[LANG], key) ? STR[LANG][key] : has(STR.en, key) ? STR.en[key] : undefined; }

  /* ---- numbers and dates ---- */
  var nf = {};

  function n(x, opts) {
    try {
      var k = JSON.stringify(opts || {});
      if (!nf[k]) nf[k] = new Intl.NumberFormat(L.numbers || L.tag, opts || { maximumFractionDigits: 20 });
      return nf[k].format(x);
    } catch (e) { return String(x); }
  }

  function d(date, opts) {
    try { return new Intl.DateTimeFormat(L.dates || L.tag, opts || { year: "numeric", month: "long", day: "numeric" }).format(date); } catch (e) { return String(date); }
  }

  /* ---- typed problems: a language's words, turned into what the readers know ---- */
  function typed(lang, data) { TYPED[code(lang)] = data; }

  function fold(s) { return s.normalize ? s.normalize("NFD").replace(/[̀-ͯ]/g, "") : s; }

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  var NW = null; // the number words of the language in use, ready to match

  function numberWords(D) {
    if (NW) return NW;
    var val = {},
      kind = {};
    [
      ["units", "u"],
      ["tens", "t"],
      ["hundreds", "h"],
      ["scales", "s"]
    ].forEach(function(g) {
      var o = D.numbers && D.numbers[g[0]] || {};
      for (var w in o)
        if (has(o, w)) {
          val[w] = o[w];
          kind[w] = g[1];
        }
    });
    var list = Object.keys(val).sort(function(a, b) { return b.length - a.length; }).map(escRe);
    var join = (D.numbers && D.numbers.join || []).map(escRe);
    var W = "(?:" + list.join("|") + ")";
    NW = {
      val: val,
      kind: kind,
      join: D.numbers && D.numbers.join || [],
      word: W,
      run: list.length ? new RegExp("(^|[^a-z0-9])(" + W + "(?:\\s+(?:(?:" + (join.join("|") || "\\u0000") + ")\\s+)?" + W + ")*)(?![a-z0-9])", "g") : null
    };
    return NW;
  }

  // "treinta y ocho" → "38"; "dos y tres" → "2 y 3" (y joins only tens and units)
  function readRun(run, W) {
    var toks = run.split(/\s+/),
      out = [],
      total = 0,
      cur = 0,
      any = false,
      last = "";

    function flush() {
      if (any) out.push(String(total + cur));
      total = 0;
      cur = 0;
      any = false;
      last = "";
    }
    for (var i = 0; i < toks.length; i++) {
      var w = toks[i];
      if (W.join.indexOf(w) >= 0) {
        var nx = toks[i + 1];
        if (last === "t" && nx && W.kind[nx] === "u" && W.val[nx] < 10 && W.val[nx] > 0) continue;
        flush();
        out.push(w);
        continue;
      }
      var k = W.kind[w],
        v = W.val[w];
      // a new number starts when the word can't follow the one before (dos tres → 2 3)
      if (any && ((k === "u" && (last === "u" || (last === "t" && toks[i - 1] && W.join.indexOf(toks[i - 1]) < 0))) || (k === "t" && (last === "u" || last === "t")) || (k === "h" && (last === "u" || last === "t" || last === "h")))) flush();
      if (k === "s") {
        if (v >= 1e6) {
          total = ((total + cur) || 1) * v;
          cur = 0;
        } else {
          total += (cur || 1) * v;
          cur = 0;
        }
      } else cur += v;
      any = true;
      last = k === "s" ? "s" : k;
    }
    flush();
    return out.join(" ");
  }

  function normalize(text) {
    var D = TYPED[LANG];
    if (LANG === "en" || !D || text === null || text === undefined) return text;
    var orig = String(text),
      s = orig.replace(/[¿¡]/g, " ");
    if (D.fold !== false) s = fold(s);
    s = s.toLowerCase();
    var before = s;
    var W = numberWords(D);
    // a number word with a denominator ending: veinticuatroavos → 24avos
    if (D.denomSuffix && D.denomSuffix.length) {
      var suf = new RegExp("(^|[^a-z])(" + W.word + ")(" + D.denomSuffix.map(escRe).join("|") + ")(?![a-z])", "g");
      s = s.replace(suf, function(m, pre, w, sx) { return pre + readRun(w, W) + "\u0001"; });
    }
    if (D.before)
      D.before.forEach(function(r) { s = s.replace(new RegExp(r[0], "g"), r[1]); });
    if (W.run) s = s.replace(W.run, function(m, pre, run) { return pre + readRun(run, W); });
    // 3 cuartos → 3/4, 18 24avos → 18/24
    s = s.replace(/(\d+)\s+(\d+)\u0001/g, "$1/$2").replace(/(\d+)\u0001/g, "1/$1");
    if (D.denominators) {
      var dn = Object.keys(D.denominators).sort(function(a, b) { return b.length - a.length; }).map(escRe).join("|");
      s = s.replace(new RegExp("(\\d+)\\s+(" + dn + ")(?![a-z])", "g"), function(m, a, w) { return a + "/" + D.denominators[w]; });
    }
    if (D.phrases)
      D.phrases.forEach(function(r) { s = s.replace(new RegExp(r[0], "g"), r[1]); });
    // tidy the spaces (a "?" inside the problem is a blank: 18 es ?% de 72, so only a last one moves)
    s = s.replace(/\s+/g, " ").replace(/\s+([.,!]|\?(?=\s*$))/g, "$1").replace(/^[\s,]+/, "").trim();
    return s === before.replace(/\s+/g, " ").trim() ? orig : s;
  }

  /* ---- the page's own markup ---- */
  function apply(rootEl) {
    if (LANG === "en") return;
    var r = rootEl || document;
    if (!r.querySelectorAll) return;
    var list = [].slice.call(r.querySelectorAll("[data-i18n], [data-i18n-attr]"));
    if (r.nodeType === 1 && r.matches && r.matches("[data-i18n], [data-i18n-attr]")) list.unshift(r);
    list.forEach(function(el) {
      if (el.getAttribute("data-i18n-done") === LANG) return;
      el.setAttribute("data-i18n-done", LANG);
      var k = el.getAttribute("data-i18n");
      if (k && hasKey(k)) {
        if (el.tagName === "TITLE") el.textContent = t(k);
        else el.innerHTML = t(k);
      } else if (k) MISSING[k] = true;
      var a = el.getAttribute("data-i18n-attr");
      if (a) a.split(";").forEach(function(pair) {
        var i = pair.indexOf("=");
        if (i < 0) return;
        var name = pair.slice(0, i).trim(),
          key = pair.slice(i + 1).trim();
        if (hasKey(key)) el.setAttribute(name, t(key));
        else MISSING[key] = true;
      });
    });
  }

  /* ---- the address and links keep lang= ---- */
  function withLang(u, c) {
    c = c || LANG;
    if (u === null || u === undefined) return u;
    var s = String(u),
      h = "",
      hi = s.indexOf("#");
    if (hi >= 0) {
      h = s.slice(hi);
      s = s.slice(0, hi);
    }
    if (/[?&]lang=/.test(s)) s = s.replace(/([?&])lang=[^&]*/, "$1lang=" + c);
    else s += (s.indexOf("?") >= 0 ? "&" : "?") + "lang=" + c;
    return s + h;
  }

  function sameSite(href) {
    try {
      var a = new URL(href, location.href);
      if (a.origin !== location.origin || !/^https?:|^file:/.test(a.protocol)) return false;
      var root = window.HelperSite && window.HelperSite.root;
      if (root && a.href.indexOf(root) !== 0) return false;
      return !/\.(js|css|png|svg|jpe?g|gif|webmanifest|json|txt|pdf|zip)$/i.test(a.pathname);
    } catch (e) { return false; }
  }

  function link(u) { return CARRY && sameSite(u) ? withLang(u) : u; }
  if (CARRY && window.history && history.replaceState) {
    ["replaceState", "pushState"].forEach(function(m) {
      var orig = history[m];
      history[m] = function(state, title, url) {
        if (url !== undefined && url !== null && sameSite(url)) url = withLang(url);
        return orig.call(history, state, title, url);
      };
    });
    try { if (!/[?&]lang=/.test(location.search)) history.replaceState(history.state, "", location.href); } catch (e) {}
    var onLink = function(e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var h = a.getAttribute("href");
      if (!h || /^(#|mailto:|javascript:|data:|blob:)/i.test(h) || /[?&]lang=/.test(h) || !sameSite(a.href)) return;
      a.setAttribute("href", withLang(h));
    };
    ["click", "auxclick", "contextmenu", "dragstart", "focusin"].forEach(function(ev) { document.addEventListener(ev, onLink, true); });
  }

  /* ---- choosing ---- */
  function set(c) {
    c = code(c);
    if (!known(c)) return;
    put("localStorage", KEY, c);
    put("localStorage", OFFER, "done");
    put("sessionStorage", VISIT, null);
    var u = location.href.replace(/([?&])lang=[^&#]*&?/, "$1").replace(/[?&](?=#|$)/, "");
    if (c !== "en") u = withLang(u, c);
    if (u === location.href) location.reload();
    else location.replace(u);
  }

  /* ---- the offer: a browser in a language the site has, and nothing chosen ---- */
  function offer() {
    if (chosen.from !== "default") return;
    var framed = true;
    try { framed = window.top !== window.self; } catch (e) {}
    if (framed || /[?&]embed=/.test(location.search) || document.documentElement.classList.contains("embed")) return;
    if (get("localStorage", OFFER)) return;
    var want = "";
    var prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]);
    for (var i = 0; i < prefs.length && !want; i++) {
      var c = code(prefs[i]);
      if (c === "en") return; // English comes first: nothing to offer
      if (known(c) && BY[c].offer) want = c;
    }
    if (!want) return;
    var o = BY[want];
    var css = document.createElement("style");
    css.textContent = ".hi-offer{position:fixed;z-index:120;left:50%;bottom:16px;transform:translateX(-50%);max-width:calc(100vw - 32px);" +
      "display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:10px 12px 10px 16px;border-radius:14px;" +
      "background:var(--surface,#fff);color:var(--ink,#19211D);border:1px solid var(--rule,#C9D0C6);box-shadow:0 18px 36px -18px rgba(0,0,0,.55);" +
      "font-family:var(--f-body,\"IBM Plex Sans\",\"Segoe UI\",Arial,sans-serif);font-size:14.5px}" +
      ".hi-offer button{font:inherit;font-size:13.5px;font-weight:600;border-radius:999px;padding:6px 14px;cursor:pointer;" +
      "border:1px solid var(--rule,#C9D0C6);background:var(--surface-2,#E2E6DD);color:var(--ink,#19211D)}" +
      ".hi-offer button.hi-yes{background:var(--key,#0D7361);border-color:var(--key,#0D7361);color:var(--surface,#fff)}" +
      ".hi-offer button:focus-visible{outline:2.5px solid var(--focus,var(--ink,#000));outline-offset:2px}" +
      "@media print{.hi-offer{display:none !important}}";
    document.head.appendChild(css);
    var box = document.createElement("div");
    box.className = "hi-offer";
    box.setAttribute("role", "region");
    box.setAttribute("lang", o.tag.split("-")[0]);
    box.setAttribute("aria-label", o.name);
    box.innerHTML = '<span>' + o.offer + '</span><button type="button" class="hi-yes">' + o.yes + '</button><button type="button" class="hi-no">' + o.no + "</button>";
    box.querySelector(".hi-yes").addEventListener("click", function() { set(want); });
    box.querySelector(".hi-no").addEventListener("click", function() {
      put("localStorage", OFFER, "no");
      if (box.parentNode) box.parentNode.removeChild(box);
    });
    document.body.appendChild(box);
  }

  /* ---- loading the locale files ---- */
  var me = document.currentScript;
  var ROOT = (window.HelperSite && window.HelperSite.root) ||
    (me && me.src ? me.src.replace(/assets\/i18n\.js(?:[?#].*)?$/, "") : "");
  var pageFiles = ((me && me.getAttribute("data-strings")) || "").split(/[\s,]+/).filter(Boolean);
  var waiting = [],
    isReady = false;

  // a locale file that didn't arrive (a dropped request on a poor connection): fetched once more, at once, so the
  // page never shows its keys. Each file is known by its keys: the shared one has common.*, a page's has <page>.*
  function repair() {
    files().forEach(function(f) {
      var m = /assets\/i18n\/([a-z]+)(?:\/([\w-]+))?\.js$/.exec(f);
      if (!m || !has(STR, m[1])) return;
      var pre = (m[2] || "common") + ".";
      for (var k in STR[m[1]])
        if (k.indexOf(pre) === 0) return;
      try {
        var x = new XMLHttpRequest();
        x.open("GET", ROOT + f, false);
        x.send(null);
        if (x.status === 200 || (x.status === 0 && x.responseText))(0, eval)(x.responseText);
      } catch (e) { if (window.console) console.warn("i18n: couldn't load " + f, e); }
    });
  }

  function done() {
    try { repair(); } catch (e) {}
    isReady = true;
    var w = waiting;
    waiting = [];
    w.forEach(function(fn) { try { fn(); } catch (e) { if (window.console) console.warn("i18n:", e); } });
  }

  function ready(fn) {
    if (isReady) fn();
    else waiting.push(fn);
  }

  function files() {
    var f = ["assets/i18n/en.js"];
    pageFiles.forEach(function(p) { f.push("assets/i18n/en/" + p + ".js"); });
    if (LANG !== "en") {
      f.push("assets/i18n/" + LANG + ".js");
      pageFiles.forEach(function(p) { f.push("assets/i18n/" + LANG + "/" + p + ".js"); });
    }
    return f;
  }

  window.HelperI18n = {
    lang: LANG,
    tag: L.tag,
    from: chosen.from,
    langs: LANGS.map(function(l) { return { code: l.code, name: l.name, tag: l.tag }; }),
    t: t,
    has: hasKey,
    raw: raw,
    n: n,
    d: d,
    add: add,
    typed: typed,
    normalize: normalize,
    apply: apply,
    set: set,
    link: link,
    ready: ready,
    files: files,
    missing: function() { return Object.keys(MISSING); },
    _done: done
  };

  var byNav = me && me.hasAttribute("data-by-nav"); // nav.js loads the locale files itself, and calls _done
  if (!byNav) {
    if (document.readyState === "loading" && me && !me.async && !me.defer) {
      var html = files().map(function(f) { return '<script src="' + ROOT + f + '"><\/script>'; }).join("");
      document.write(html + "<script>HelperI18n._done()<\/script>");
    } else {
      var left = 0;
      files().forEach(function(f) {
        var sc = document.createElement("script");
        sc.src = ROOT + f;
        sc.async = false;
        left++;
        sc.onload = sc.onerror = function() { if (--left === 0) done(); };
        document.head.appendChild(sc);
      });
      if (!left) done();
    }
  }

  function start() {
    try { apply(document); } catch (e) {}
    try { offer(); } catch (e) {}
  }
  ready(function() {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  });
})();
