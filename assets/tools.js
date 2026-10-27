/* Quality-of-life tools shared by every helper page (nav.js loads this file):
   - settings that follow you from page to page: light/dark and text size
   - big-screen mode for a projector or smartboard
   - read "Say it out loud" aloud
   - a short list of recent problems on each page
   - keyboard shortcuts (press ? to see them)
   - "Next problem" after a right answer in Check my answer
   - the "type any problem" search box in the bar at the top
   - a QR code for this page's address, to open the same problem on a phone (button QR, key Q); qr.js, next to this
     file, is only fetched the first time it's needed
   - Tutor me (practice=tutor), the fourth practice mode: tutor.js, next to this file, is fetched on pages that have
     the practice buttons and a "Say it out loud" list (embedded, only when the link asks for it); while it's on,
     Read aloud reads its question and choices
   - all of it in the visitor's language (assets/i18n.js, the "tools" part of assets/i18n/<lang>.js), the math read
     aloud too (MATH below; HelperTools.speechLang() / speechWords() for the other scripts); a Language row in "?"
   Everything is wrapped so a problem here can never break a helper page. */
(function() {
  "use strict";
  if (window.HelperTools) return;

  var KEY = "helpers-settings",
    RECENT = "helpers-recent";
  var SITE_VERSION = "dev"; // the release number is written in here when the site is published (.github/workflows/release.yml)
  var SCALES = [0.9, 1, 1.15, 1.3, 1.5];
  var root = document.documentElement;
  var SELF = (document.currentScript && document.currentScript.src) || "";
  var page = ((window.HelperSite && window.HelperSite.here) || location.pathname.split("/").pop() || "index.html").toLowerCase();
  var framed = true;
  try { framed = window.top !== window.self; } catch (e) {}

  function embedded() { return /[?&]embed=1(&|$)/.test(location.search) || root.classList.contains("embed"); }
  // pages shown inside another page (worksheets, practice sets, the self-test) keep their own look and record nothing
  var passive = framed || embedded() || page === "tests.html";

  // embedded on someone else's website (embed=site or embed=site-full, made by the Embed dialog): embed.js trims the
  // page down. Read from the address the page was opened with: each helper rewrites its own address as it starts.
  function siteEmbed() {
    var href = location.href;
    try { var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0]; if (nav && nav.name) href = nav.name; } catch (e) {}
    return /[?&]embed=site(-full)?(&|#|$)/i.test(href);
  }

  // a page's full address from its name (site.js knows the folders)
  function U(page, params) { return window.HelperSite ? window.HelperSite.url(page, params) : page + (params ? "?" + params : ""); }

  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v === null ? d : v; } catch (e) { return d; } }

  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function safe(fn) { return function() { try { return fn.apply(this, arguments); } catch (e) { if (window.console) console.warn("tools.js:", e); } }; }

  /* ---- the visitor's language (assets/i18n.js; the strings are the "tools" part of assets/i18n/<lang>.js) ----
     T(key, english, vars): the string in the language in use; English (and a page without i18n.js) gets the English
     written here, exactly as it always was. */
  function fillIn(s, vars) { return String(s).replace(/\{(\w+)\}/g, function(m, k) { return vars && vars.hasOwnProperty(k) ? vars[k] : m; }); }

  function T(key, en, vars) {
    var I = window.HelperI18n;
    if (I && I.lang && I.lang !== "en" && I.t) {
      var s = I.t(key, vars);
      if (s !== key) return s;
    }
    return vars ? fillIn(en, vars) : en;
  }
  // the language the page's own text is in: a page with its own strings (i18n.js data-strings=…) is in the visitor's
  // language; the others are still English, so they are read in English with an English voice
  function speechLang() {
    var I = window.HelperI18n;
    if (!I || !I.lang || I.lang === "en") return String(root.lang || "en").toLowerCase().split("-")[0];
    var own = [].some.call(document.querySelectorAll("script[data-strings]"), function(s) { return /\S/.test(s.getAttribute("data-strings")); });
    return own ? I.lang : "en";
  }
  var S = load(KEY, {});
  if (typeof S !== "object" || !S) S = {};

  /* ===================== styles ===================== */
  var CSS =
    "a.ht-report{text-decoration:none;display:inline-flex;align-items:center;color:inherit}" +
    "@media print{a.ht-report{display:none !important}}" +
    // a helper's "Lessons:" line (the Math at work pages): a quiet label and links as pills in the page's own colors
    "p.learn-line{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:14px 0 0;color:var(--ink-3)}" +
    "p.learn-line a{font-family:var(--f-body,inherit);font-size:13.5px;font-weight:500;line-height:1.3;color:var(--ink);text-decoration:none;" +
    "background:var(--surface,transparent);border:1px solid var(--rule);border-radius:999px;padding:4px 11px}" +
    "p.learn-line a:hover{border-color:var(--key,var(--ink-3));color:var(--key,var(--ink))}" +
    "p.learn-line a:focus-visible{outline:2.5px solid var(--focus,var(--ink));outline-offset:2px}" +
    "p.learn-line a:last-child{background:none;border-style:dashed}" +
    "p.learn-line .ht-ll{font-family:var(--f-mono,monospace);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin-right:4px}" +
    "@media print{p.learn-line{display:none !important}}" +
    // a helper's "About" section under the footnote: what it does, a worked example, questions (plain text for readers
    // and search engines; not in print, embeds or Big screen)
    "section.ht-about{max-width:46rem;margin:36px 0 8px;padding-top:22px;border-top:1px solid var(--rule);color:var(--ink-2);font-size:15px;line-height:1.6}" +
    "section.ht-about h2{font-family:var(--f-display,inherit);font-size:20px;font-weight:600;color:var(--ink);margin:0 0 8px}" +
    "section.ht-about h3{font-family:var(--f-body,inherit);font-size:15.5px;font-weight:600;color:var(--ink);margin:20px 0 6px}" +
    "section.ht-about p,section.ht-about ol,section.ht-about ul{margin:0 0 10px}" +
    "section.ht-about ol,section.ht-about ul{padding-left:1.3em}section.ht-about li{margin:3px 0}" +
    "section.ht-about a{color:var(--key,var(--ink));text-underline-offset:2px}" +
    "section.ht-about .ht-q{margin:12px 0 2px;font-weight:600;color:var(--ink)}" +
    "@media print{section.ht-about{display:none !important}}" +
    "html.embed section.ht-about,html.ht-site section.ht-about,html.ht-big section.ht-about{display:none !important}" +
    ".ht-sendbox{margin-top:10px;font-size:14px;color:var(--ink-2)}" +
    ".ht-sendbox small{font-size:13px;color:var(--ink-3)}" +
    ".ht-send{font:inherit;font-size:14px;font-weight:600;color:var(--key,var(--ink));background:var(--surface,#fff);" +
    "border:1px solid currentColor;border-radius:999px;padding:4px 14px;cursor:pointer;margin-right:4px}" +
    ".ht-send:focus-visible{outline:2.5px solid var(--focus,var(--ink));outline-offset:2px}" +
    "@media print{.ht-sendbox{display:none !important}}" +
    ".ht-bar{display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap}" +
    ".ht-btn{font-family:var(--f-body,\"IBM Plex Sans\",Arial,sans-serif);font-size:12.5px;font-weight:600;line-height:1;" +
    "color:var(--ink-2);background:var(--surface);border:1px solid var(--rule);border-radius:999px;padding:6px 10px;cursor:pointer}" +
    ".ht-btn:hover{color:var(--ink);border-color:var(--ink-3)}" +
    ".ht-btn[aria-pressed=\"true\"]{color:var(--ink);border-color:var(--ink-2)}" +
    ".ht-search{display:flex;align-items:center;gap:6px;flex:1 1 240px;max-width:420px;min-width:0}" +
    ".ht-search input{flex:1;min-width:0;font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-size:13px;" +
    "color:var(--ink);background:var(--surface);border:1px solid var(--rule);border-radius:999px;padding:6px 12px;outline:none}" +
    "@supports (-webkit-touch-callout:none){.ht-search input{font-size:16px}}" + // iPhone/iPad Safari zooms the page into a box under 16px
    ".ht-search input:focus{border-color:var(--ink-3)}" +
    ".ht-search input::placeholder{color:var(--ink-3)}" +
    ".ht-menu{position:absolute;z-index:60;min-width:240px;max-width:min(360px,92vw);background:var(--surface);color:var(--ink);" +
    "border:1px solid var(--rule);border-radius:12px;box-shadow:0 18px 36px -18px rgba(0,0,0,.55);padding:8px;font-size:14px}" +
    ".ht-menu h3{margin:4px 8px 6px;font-size:11px;font-family:var(--f-mono,monospace);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}" +
    ".ht-menu a,.ht-menu button.ht-row{display:block;width:100%;text-align:left;padding:7px 9px;border-radius:8px;color:var(--ink);" +
    "text-decoration:none;background:none;border:0;font:inherit;cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".ht-menu a:hover,.ht-menu a:focus,.ht-menu button.ht-row:hover{background:var(--surface-2,rgba(127,127,127,.12));outline:none}" +
    ".ht-menu .ht-empty{padding:6px 9px;color:var(--ink-3)}" +
    ".ht-menu .ht-sm{font-size:12px;color:var(--ink-3)}" +
    ".ht-help table{border-collapse:collapse;width:100%}" +
    ".ht-help td{padding:5px 8px;vertical-align:top}" +
    ".ht-help kbd{font-family:var(--f-mono,monospace);font-size:12px;border:1px solid var(--rule);border-bottom-width:2px;" +
    "border-radius:5px;padding:1px 6px;background:var(--paper,transparent);white-space:nowrap}" +
    ".ht-next{margin-top:10px;font-family:var(--f-body,Arial,sans-serif);font-size:15px;font-weight:600;color:var(--surface);" +
    "background:var(--ink);border:0;border-radius:9px;padding:9px 16px;cursor:pointer}" +
    ".ht-next:hover{filter:brightness(1.15)}" +
    ".ht-reading{outline:3px solid var(--focus,var(--ink-2));outline-offset:2px;border-radius:6px}" +
    ".ht-read{margin-left:auto}.ht-read + .ht-voice{margin-left:-6px}" + // Read aloud and Voice side by side, on the right
    ".ht-menu .ht-row[aria-pressed=\"true\"]{font-weight:600}" +
    "html.ht-big .sitenav,html.ht-big .maker,html.ht-big .examples,html.ht-big .footnote,html.ht-big .theme-btn," +
    "html.ht-big .keys,html.ht-big .hint,html.ht-big .eyebrow,html.ht-big .tagline{display:none !important}" +
    ".ht-exit{position:fixed;top:12px;right:12px;z-index:70;font-family:var(--f-body,Arial,sans-serif);font-size:14px;font-weight:600;" +
    "color:var(--ink);background:var(--surface);border:1px solid var(--rule);border-radius:999px;padding:8px 14px;cursor:pointer;" +
    "box-shadow:0 10px 24px -14px rgba(0,0,0,.6)}" +
    ".ht-byhand{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;margin:12px 0 0;padding:12px 16px;border-radius:12px;" +
    "background:rgba(180,83,9,.12);border:1.5px solid rgba(180,83,9,.45);" + /* for browsers without color-mix (Safari before 16.2: iOS 15 iPads) */
    "background:color-mix(in srgb, #B45309 12%, var(--surface));border:1.5px solid color-mix(in srgb, #B45309 45%, var(--rule))}" +
    ".ht-byhand a{display:inline-flex;align-items:center;gap:8px;font-family:var(--f-body,Arial,sans-serif);font-size:15.5px;font-weight:700;" +
    "text-decoration:none;color:#fff;background:#B45309;border-radius:10px;padding:9px 16px}" +
    ".ht-byhand a:hover{filter:brightness(1.1)}" +
    ".ht-byhand a:focus-visible{outline:2.5px solid var(--ink);outline-offset:2px}" +
    ".ht-byhand span{font-size:14px;color:var(--ink-2)}" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]) .ht-byhand a{background:#FCD34D;color:#231A05}}" +
    ":root[data-theme=\"dark\"] .ht-byhand a{background:#FCD34D;color:#231A05}" +
    "@media print{.ht-byhand{display:none !important}}" +
    ".ht-pad{position:fixed;left:0;right:0;bottom:0;z-index:80;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;" +
    "padding:8px 8px calc(8px + env(safe-area-inset-bottom));background:var(--surface-2,#e3e7df);border-top:1px solid var(--rule);" +
    "box-shadow:0 -10px 24px -16px rgba(0,0,0,.5)}" +
    ".ht-pad[hidden]{display:none}" +
    ".ht-pad button{min-width:44px;height:44px;padding:0 10px;font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);" +
    "font-size:19px;font-weight:600;color:var(--ink);background:var(--surface);border:1px solid var(--rule);border-radius:10px;cursor:pointer;" +
    "touch-action:manipulation;user-select:none;-webkit-user-select:none}" +
    ".ht-pad button:active{background:var(--rule)}" +
    ".ht-pad button.wide{min-width:84px;font-size:14px}" +
    ".ht-pad button.done{font-family:var(--f-body,Arial,sans-serif);font-size:15px;background:var(--ink);color:var(--surface);border-color:var(--ink)}" +
    "html.ht-padding body{padding-bottom:120px}" +
    "html.ht-site-wait body{visibility:hidden}" +
    "@media print{.ht-bar,.ht-search,.ht-menu,.ht-next,.ht-exit,.ht-read,.ht-pad{display:none !important}}";

  /* ===================== settings that follow you ===================== */
  var themeBtn = null;

  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function paintThemeBtn() {
    themeBtn = themeBtn || document.getElementById("themeBtn");
    if (themeBtn) themeBtn.textContent = isDark() ? T("common.lightMode", "Light mode") : T("common.darkMode", "Dark mode");
  }

  function applySettings() {
    if (S.theme === "light" || S.theme === "dark") {
      if (root.getAttribute("data-theme") !== S.theme) root.setAttribute("data-theme", S.theme);
    }
    var scale = SCALES.indexOf(S.scale) >= 0 ? S.scale : 1;
    var z = (root.classList.contains("ht-big") ? 1.3 : 1) * scale;
    var box = document.querySelector(".page") || document.querySelector(".wrap");
    if (box) box.style.zoom = z === 1 ? "" : String(z);
    paintThemeBtn();
  }

  function watchTheme() {
    // a page's own theme button changes data-theme; remember that choice for every page
    new MutationObserver(safe(function() {
      var t = root.getAttribute("data-theme");
      if ((t === "light" || t === "dark") && t !== S.theme) {
        S.theme = t;
        save(KEY, S);
      }
    })).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("storage", safe(function(e) {
      if (e.key === KEY) {
        S = load(KEY, {}) || {};
        applySettings();
      }
    }));
  }

  function setScale(dir) {
    var i = SCALES.indexOf(SCALES.indexOf(S.scale) >= 0 ? S.scale : 1);
    i = Math.max(0, Math.min(SCALES.length - 1, i + dir));
    S.scale = SCALES[i];
    save(KEY, S);
    applySettings();
    announce(T("tools.textSize", "Text size {n}%", { n: Math.round(S.scale * 100) }));
  }

  /* ===================== big-screen mode ===================== */
  var exitBtn = null;

  function setBig(on) {
    root.classList.toggle("ht-big", on);
    if (on && !exitBtn) {
      exitBtn = document.createElement("button");
      exitBtn.type = "button";
      exitBtn.className = "ht-exit";
      exitBtn.textContent = T("tools.exitBig", "Exit big screen ✕");
      exitBtn.addEventListener("click", function() { setBig(false); });
      document.body.appendChild(exitBtn);
    }
    if (exitBtn) exitBtn.hidden = !on;
    var b = document.getElementById("htBig");
    if (b) b.setAttribute("aria-pressed", String(on));
    applySettings();
    announce(on ? T("tools.bigOn", "Big screen on. Press Escape to leave.") : T("tools.bigOff", "Big screen off"));
  }

  /* ===================== read aloud ===================== */
  var speaking = false,
    readBtn = null,
    tutorReading = false;

  /* math in words: what Read aloud, Play and the screen-reader labels (a11y.js) say for the page's math.
     spoken(el): an element's text, with its math markup (stacked fractions, powers, roots, repeating digits, matrices)
     read as words. words(t): text with its math symbols in words, said the way a teacher would say them. */
  var MATH = (function() {
    // private-use marks that spoken() leaves in place of the page's markup, so words() knows what it was
    var FO = "\uE001",
      FM = "\uE002",
      FC = "\uE003", // a stacked fraction: FO top FM bottom FC
      PO = "\uE010",
      PC = "\uE011", // a power (superscript)
      BO = "\uE012",
      BC = "\uE013", // a subscript
      RO = "\uE014",
      RC = "\uE015", // what's under a root sign
      EO = "\uE016",
      EC = "\uE017", // repeating digits
      GO = "\uE030",
      GC = "\uE031", // a group in brackets: GO number GC
      END = "\uE050"; // the end of a long part: a pause, if more follows

    function chars(o) {
      var k = [];
      for (var c in o)
        if (o.hasOwnProperty(c)) k.push(c);
      return k.join("");
    }
    var SUPS = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "−", "⁼": "=", "⁽": "(", "⁾": ")", "ⁿ": "n", "ⁱ": "i", "ˣ": "x", "ʸ": "y", "ᵗ": "t", "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d", "ᵉ": "e", "ᶠ": "f", "ᵍ": "g", "ʰ": "h", "ʲ": "j", "ᵏ": "k", "ᵐ": "m", "ᵖ": "p", "ʳ": "r", "ˢ": "s", "ᵘ": "u", "ᵛ": "v", "ʷ": "w", "ᶻ": "z", "ᵀ": "T", "ᐟ": "/" };
    var SUBS = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9", "₊": "+", "₋": "−", "₌": "=", "₍": "(", "₎": ")", "ₐ": "a", "ₑ": "e", "ₒ": "o", "ₓ": "x", "ₕ": "h", "ₖ": "k", "ₗ": "l", "ₘ": "m", "ₙ": "n", "ₚ": "p", "ₛ": "s", "ₜ": "t", "ᵢ": "i", "ⱼ": "j", "ᵣ": "r", "ᵤ": "u", "ᵥ": "v" };
    var VULGAR = { "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5", "⅙": "1/6", "⅚": "5/6", "⅐": "1/7", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8", "⅑": "1/9", "⅒": "1/10" };
    var SUP_RE = new RegExp("[" + chars(SUPS) + "]+", "g"),
      SUB_RE = new RegExp("[" + chars(SUBS) + "]+", "g"),
      VUL_RE = new RegExp("(\\d?)([" + chars(VULGAR) + "])", "g");

    function mapRun(run, o) { var s = ""; for (var i = 0; i < run.length; i++) s += o[run.charAt(i)]; return s; }

    /* ---- numbers ---- */
    var ORD = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"];
    var ORD_MORE = { 100: "hundredth", 1000: "thousandth" };
    // 21st to 99th: "twenty-seventh", "sixtieth"
    ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"].forEach(function(t, i) {
      ORD_MORE[20 + 10 * i] = t.replace(/y$/, "ieth");
      for (var u = 1; u < 10; u++) ORD_MORE[20 + 10 * i + u] = t + "-" + ORD[u];
    });

    function nth(n) { // 23 → "23rd"
      var t = n % 100,
        u = n % 10;
      return n + (t > 10 && t < 14 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th");
    }
    // 3/4 → "3 quarters", 1/2 → "1 half", 7/12 → "7 twelfths", 5/37 and 720/6 → "5 over 37", "720 over 6"
    function fracWords(n, d) {
      var a = String(n).replace(/\s+/g, " ").trim(),
        b = String(d).replace(/\s+/g, " ").trim();
      if (/^(?:[−-]|negative )?\d+$/.test(a) && /^\d+$/.test(b)) {
        var k = Number(b),
          top = Number(a.replace(/\D/g, "")),
          one = top === 1,
          name = k === 2 ? (one ? "half" : "halves") : k === 4 ? (one ? "quarter" : "quarters") : null;
        if (!name && k > 2 && (k <= 20 || ORD_MORE[k])) name = (ORD[k] || ORD_MORE[k]) + (one ? "" : "s");
        if (name && !(top > 20 && top > 3 * k)) return a + " " + name;
      }
      var unit = /^[\d.,]+( (?!squared|cubed)[a-z]{2,})+$/i; // 1 kilogram over 2.2 pounds
      return (simple(a) || unit.test(a) ? a : a + ",") + " over " + (simple(b) || unit.test(b) ? b : "the quantity " + b + END);
    }
    // one number or letter (or a word): no "the quantity", no pause after it
    function simple(s) { return !/[\s+−\-×÷·*=\/<>≤≥±]/.test(String(s).trim().replace(/^(?:[−-]|negative )\s*/, "")); }

    /* ---- units, after a number ---- */
    // symbol: [one, many]. "a" before the singular when a fraction comes first: "3 quarters of a cup"
    var UNITS = {
      mm: ["millimeter", "millimeters"],
      cm: ["centimeter", "centimeters"],
      m: ["meter", "meters"],
      km: ["kilometer", "kilometers"],
      "μm": ["micrometer", "micrometers"],
      "in": ["inch", "inches"],
      ft: ["foot", "feet"],
      yd: ["yard", "yards"],
      yds: ["yard", "yards"],
      mi: ["mile", "miles"],
      NM: ["nautical mile", "nautical miles"],
      nm: ["nautical mile", "nautical miles"],
      nmi: ["nautical mile", "nautical miles"],
      mL: ["milliliter", "milliliters"],
      ml: ["milliliter", "milliliters"],
      L: ["liter", "liters"],
      dL: ["deciliter", "deciliters"],
      cc: ["cubic centimeter", "cubic centimeters"],
      gal: ["gallon", "gallons"],
      qt: ["quart", "quarts"],
      pt: ["pint", "pints"],
      "fl oz": ["fluid ounce", "fluid ounces"],
      tsp: ["teaspoon", "teaspoons"],
      tbsp: ["tablespoon", "tablespoons"],
      Tbsp: ["tablespoon", "tablespoons"],
      mg: ["milligram", "milligrams"],
      g: ["gram", "grams"],
      kg: ["kilogram", "kilograms"],
      mcg: ["microgram", "micrograms"],
      "μg": ["microgram", "micrograms"],
      lb: ["pound", "pounds"],
      lbs: ["pound", "pounds"],
      oz: ["ounce", "ounces"],
      ms: ["millisecond", "milliseconds"],
      s: ["second", "seconds"],
      sec: ["second", "seconds"],
      min: ["minute", "minutes"],
      mins: ["minute", "minutes"],
      h: ["hour", "hours"],
      hr: ["hour", "hours"],
      hrs: ["hour", "hours"],
      wk: ["week", "weeks"],
      yr: ["year", "years"],
      yrs: ["year", "years"],
      mph: ["mile per hour", "miles per hour"],
      kph: ["kilometer per hour", "kilometers per hour"],
      kt: ["knot", "knots"],
      kts: ["knot", "knots"],
      kn: ["knot", "knots"],
      fpm: ["foot per minute", "feet per minute"],
      rpm: ["revolution per minute", "revolutions per minute"],
      gph: ["gallon per hour", "gallons per hour"],
      gpm: ["gallon per minute", "gallons per minute"],
      mpg: ["mile per gallon", "miles per gallon"],
      psi: ["pound per square inch", "pounds per square inch"],
      gtt: ["drop", "drops"],
      gtts: ["drop", "drops"],
      mEq: ["milliequivalent", "milliequivalents"],
      units: ["unit", "units"],
      unit: ["unit", "units"],
      tab: ["tablet", "tablets"],
      tabs: ["tablet", "tablets"],
      V: ["volt", "volts"],
      mV: ["millivolt", "millivolts"],
      kV: ["kilovolt", "kilovolts"],
      A: ["amp", "amps"],
      mA: ["milliamp", "milliamps"],
      W: ["watt", "watts"],
      kW: ["kilowatt", "kilowatts"],
      MW: ["megawatt", "megawatts"],
      Wh: ["watt hour", "watt hours"],
      kWh: ["kilowatt hour", "kilowatt hours"],
      mW: ["milliwatt", "milliwatts"],
      hp: ["horsepower", "horsepower"],
      "Ω": ["ohm", "ohms"],
      "kΩ": ["kilohm", "kilohms"],
      "MΩ": ["megohm", "megohms"],
      F: ["farad", "farads"],
      "μF": ["microfarad", "microfarads"],
      nF: ["nanofarad", "nanofarads"],
      pF: ["picofarad", "picofarads"],
      Hz: ["hertz", "hertz"],
      kHz: ["kilohertz", "kilohertz"],
      MHz: ["megahertz", "megahertz"],
      J: ["joule", "joules"],
      kJ: ["kilojoule", "kilojoules"],
      kcal: ["kilocalorie", "kilocalories"],
      BTU: ["BTU", "BTUs"],
      "°F": ["degree Fahrenheit", "degrees Fahrenheit"],
      "°C": ["degree Celsius", "degrees Celsius"],
      "°": ["degree", "degrees"],
      "′": ["foot", "feet"],
      "″": ["inch", "inches"],
      "'": ["foot", "feet"],
      '"': ["inch", "inches"],
      inHg: ["inch of mercury", "inches of mercury"],
      sq: ["square", "square"],
      cup: ["cup", "cups"],
      cups: ["cup", "cups"],
      c: ["cup", "cups"],
      "bd ft": ["board foot", "board feet"],
      ha: ["hectare", "hectares"],
      ac: ["acre", "acres"]
    };
    // these are letters too (a point A, a variable m): read as units only after a space, or when the page marked them
    var RISKY = { c: 1, m: 1, "in": 1, L: 1, g: 1, s: 1, h: 1, V: 1, A: 1, W: 1, F: 1, J: 1, pt: 1, kn: 1, tab: 1, ac: 1, sq: 1, unit: 1, units: 1, ha: 1, hp: 1 };
    var PER = { hr: "hour", h: "hour", min: "minute", sec: "second", s: "second", day: "day", wk: "week", week: "week", mo: "month", month: "month", yr: "year", year: "year", mL: "milliliter", ml: "milliliter", L: "liter", kg: "kilogram", lb: "pound", g: "gram", mg: "milligram", dL: "deciliter", gal: "gallon", mi: "mile", ft: "foot", "in": "inch", m: "meter", km: "kilometer", dose: "dose", item: "item", ea: "each", unit: "unit", oz: "ounce", hour: "hour", minute: "minute", person: "person", page: "page" };
    var UNIT_KEYS = Object.keys(UNITS).sort(function(a, b) { return b.length - a.length; });

    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"); }
    var NUM = "(?:\\d[\\d,]*(?:\\.\\d+)?|\\.\\d+)(?:\\s\\d+\\/\\d+|\\/\\d+|\\s?" + FO + "[^" + FC + "]*" + FC + ")?…?|" + FO + "[^" + FC + "]*" + FC;
    var UNIT_RE = new RegExp("(" + NUM + ")(\\s?)(" + UNIT_KEYS.map(esc).join("|") + ")(²|³|" + PO + "[23]" + PC + ")?((?:\\/(?:" + UNIT_KEYS.concat(Object.keys(PER)).map(esc).join("|") + "))*)(?![A-Za-z0-9μΩ])", "g");

    function unitName(u, many, pow) {
      var w = UNITS[u] ? UNITS[u][many ? 1 : 0] : PER[u] || u;
      if (pow === "²" || pow === PO + "2" + PC) w = "square " + w;
      else if (pow) w = "cubic " + w;
      return w;
    }

    function units(t) {
      return t.replace(UNIT_RE, function(m, n, sp, u, pow, per, at, all) {
          var before = all.charAt(at - 1);
          if (/[A-Za-z_]/.test(before)) return m; // part of a word or a name: x2m
          if (RISKY[u] && (!sp || !/^(\s*$|\s*[^\sA-Za-z0-9]|\s+(by|long|wide|tall|high|deep|of|per|and|or|to|is|on|in|at|for|away|each|apart|left|right|across)\b|\s+\d+\s?(?:min|s|sec|in|"|″)(?![A-Za-z]))/.test(all.slice(at + m.length)))) return m; // 2A, 3m, "3 in 4": a number and a letter
          if (u === "sq") return m; // "sq ft" is its own unit
          if ((u === "'" || u === '"') && /^[A-Za-z]/.test(all.slice(at + m.length))) return m; // a quote
          var frac = /^\d+\/\d+$/.test(n) || n.charAt(0) === FO,
            one = /^1(\.0+)?$/.test(n),
            w = unitName(u, !one && !frac, pow);
          var rest = per ? per.split("/").slice(1).map(function(p) { return " per " + unitName(p, false); }).join("") : "";
          if (frac) w = "of " + (/^[aeiou]|^hour/i.test(w) ? "an " : "a ") + w;
          return n.replace(/…$/, "") + " " + w + rest;
        }).replace(/\bsq\.?\s?(ft|in|yd|mi|m|cm|km)\b/g, function(m, u) { return "square " + UNITS[u][1]; })
        .replace(/\b(mL|gtt|mg|mcg|units?|mEq|km|mi|m|ft)\/(hr|h|min|s|sec|kg|mL|dL|L|dose)\b/g, function(m, a, b) { return unitName(a, true) + " per " + unitName(b, false); })
        .replace(/\bper (oz|lb|kg|g|mg|mL|L|gal|qt|ft|in|yd|mi|km|hr|h|min|sq ft)\b/g, function(m, u) { return "per " + unitName(u, false); })
        // a fraction before a unit written out: "3/4 inch drill" is "3 quarters of an inch"
        .replace(/(^|[^\d\s.,\/]\s?|[^\d]\s)(\d+\/\d+)\s(inch|foot|cup|mile|pound|ounce|teaspoon|tablespoon|gallon|hour|yard|meter|liter|tablet)\b/g, function(m, pre, f, u) { return pre + f + " of " + (/^[aeiou]|^hour/.test(u) ? "an " : "a ") + u; })
        .replace(/\b(cm|mm|km|in|ft|yd)(²|³|\uE010[23]\uE011)/g, function(m, u, p) { return unitName(u, true, p); });
    }

    /* ---- money ---- */
    function money(t) {
      return t.replace(/([−-]?)\$\s?(\d{1,3}(?:,\d{3})+|\d+)?(?:\.(\d+))?(?:\s?(thousand|million|billion|trillion))?(\s?\/\s?(?:hour|hr|h|day|week|wk|month|mo|year|yr|minute|min|mile|mi|gal|lb|oz|kg|item|each|ea|unit|person|page|sq ft|ft)\b)?/g, function(m, neg, d, c, big, per) {
        if (!d && !c) return m;
        var s, dn = Number(String(d || "0").replace(/,/g, ""));
        if (big) s = (d || "0") + (c ? "." + c : "") + " " + big + " dollars";
        else if (c && c.length !== 2) s = (d || "0") + "." + c + " dollars";
        else if (c && dn === 0) s = Number(c) + (Number(c) === 1 ? " cent" : " cents");
        else s = (d || "0") + (dn === 1 && !(c && Number(c)) ? " dollar" : " dollars") + (c && Number(c) ? " and " + Number(c) + (Number(c) === 1 ? " cent" : " cents") : "");
        per = per && per.replace(/^\s?\/\s?/, "");
        if (per) s += " per " + (PER[per] || per.replace("sq ft", "square foot"));
        return (neg ? "negative " : "") + s;
      }).replace(/(\d)\s?¢/g, "$1 cents").replace(/(\d)\s?€/g, "$1 euros").replace(/€\s?(\d[\d,.]*)/g, "$1 euros").replace(/£\s?(\d[\d,.]*)/g, "$1 pounds");
    }

    /* ---- clock times and ratios ---- */
    function clock(t) {
      t = t.replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([ap])(?:\.\s?m\.|m\b)/gi, function(m, h, mm, ss, ap) {
        var n = Number(mm);
        return h + (n === 0 ? "" : n < 10 ? " oh " + n : " " + mm) + " " + ap.toUpperCase() + "M";
      }).replace(/\b(\d{1,2}):(\d{2}):(\d{2})\b/g, function(m, h, mm, ss) { return h + " " + Number(mm) + " " + Number(ss); });
      // a time on the clock: 4:00, 3:05, "until 3:45" — and every h:mm on the page that tells the time
      var clocky = /number-sense|clock|time/i.test(location.pathname + location.search);
      t = t.replace(/(\b(?:at|until|till|by|from|to|before|after|past|is|reads|shows|says)\s)?\b(\d{1,2}):([0-5]\d)\b(?!:|\s?[\d\/])/g, function(m, w, h, mm) {
        var n = Number(mm);
        if (!w && !clocky && mm.charAt(0) !== "0") return m; // 12:18 is a ratio
        return (w || "") + h + (n === 0 ? " o’clock" : n < 10 ? " oh " + n : " " + mm);
      });
      // 3:2, 3 : 2 (not "Step 1: 3")
      return t.replace(/(\d)(?::|\s:\s)(?=\d)/g, "$1 to ");
    }

    /* ---- repeating decimals: 0.1(6), 0.1 with a bar over the 6, the page's marked digits ---- */
    function repeat(t) {
      t = t.replace(/(\d*\.\d*)\((\d+)\)/g, function(m, a, r) { return a + EO + r + EC; });
      return t.replace(new RegExp("([\\d.]*)" + EO + "([^" + EC + "]*)" + EC, "g"), function(m, a, r) {
        r = r.replace(/\D/g, "");
        if (!r) return a;
        var digits = r.split("").join(" ");
        if (!a || /\.$/.test(a)) return (a ? a + r : r) + " repeating";
        return a + " with " + (r.length === 1 ? "the " : "") + digits + " repeating";
      });
    }

    /* ---- symbols the calculus, sets and vectors use, said before the groups are taken apart ---- */
    function special(t) {
      // the integral and the sum, with their bounds: ∫₀² x² dx, ∫ from 0 to 2
      t = t.replace(/(\d)\s?∫/g, "$1 times ∫").replace(/∫\s*(?=from\b)/g, " the integral ");
      t = t.replace(new RegExp("∫\\s?(?:" + BO + "([^" + BC + "]*)" + BC + "\\s?" + PO + "([^" + PC + "]*)" + PC + ")?", "g"), function(m, a, b) {
        return a !== undefined ? " the integral from " + a + " to " + b + " of " : " the integral of ";
      });
      t = t.replace(new RegExp("[Σ∑]\\s?(?:" + BO + "([^" + BC + "]*)" + BC + "\\s?" + PO + "([^" + PC + "]*)" + PC + ")?", "g"), function(m, a, b) {
        return a !== undefined ? " the sum from " + a + " to " + b + " of " : " the sum of ";
      });
      // lim x→2, lim_(x→2), the limit as x approaches 2
      t = t.replace(new RegExp("\\blim\\s?" + BO + "?\\s?([a-zθ])\\s?(?:→|->)\\s?([−-]?[\\d.]+|[−-]?∞|[a-z])" + BC + "?", "g"), " the limit as $1 approaches $2 of ");
      t = t.replace(/\b([a-zθ])\s?(?:→|->)\s?([−-]?∞|[−-]?\d+(?:\.\d+)?)(?![\d.])/g, "$1 approaches $2");
      t = t.replace(/\bd\/d([a-z])\b/g, " the derivative with respect to $1 of ").replace(/\bd([a-z])\/d([a-z])\b/g, "d $1 by d $2").replace(/\bd([xyt])\b/g, "d $1");
      // n choose r
      t = t.replace(new RegExp(BO + "(\\d+|n)" + BC + "\\s?C\\s?" + BO + "(\\d+|r|k)" + BC, "g"), "$1 choose $2").replace(/\b(\d+|n)C(\d+|r|k)\b/g, "$1 choose $2");
      t = t.replace(/\bC\(\s?(\d+|n)\s?,\s?(\d+|r|k)\s?\)/g, "$1 choose $2");
      // set builder {x | x > 2}, a set {1, 2, 3}
      t = t.replace(/\{\s?([a-z])\s?[|:]\s?([^{}]*)\}/g, "the set of $1 such that $2" + END).replace(/\{([^{}]*)\}/g, function(m, a) { return /\S/.test(a) ? "the set " + a + END : "the empty set"; });
      // intervals: [0, ∞), (−∞, 3], [2, 5) — and [a, b] after "on", "over", "in", "interval"
      t = t.replace(/(\b(?:on|over|in|interval|domain|range|from|is)\s)?([\[(])\s?([^\[\]()]*?)\s?,\s?([^\[\]()]*?)\s?([\])])/g, function(m, w, l, a, b, r) {
        var inf = /∞/.test(a + b);
        if (!(inf || l !== r.replace("]", "[").replace(")", "(") || (w && l === "["))) return m;
        if (l === "(" && r === ")" && !inf) return m; // a point
        var la = l === "[",
          rb = r === "]",
          say = "the interval from " + a + " to " + b;
        if (la && rb) say = "the closed interval from " + a + " to " + b;
        else if (!la && !rb) say = inf && /^[−-]∞$/.test(a) && b === "∞" ? "all real numbers" : "the interval from " + a + " to " + b + (inf ? "" : ", not including either end");
        else if (la) say += ", including " + a + (/∞/.test(b) ? "" : " but not " + b);
        else say += ", including " + b + (/∞/.test(a) ? "" : " but not " + a);
        return (w || "") + say + END;
      });
      // vectors ⟨3, 4⟩, norms ‖v‖, P(A|B), |x|
      t = t.replace(/[⟨〈]([^⟩〉]*)[⟩〉]/g, "the vector $1" + END).replace(/‖([^‖]+)‖/g, function(m, a) { return "the magnitude of " + a + (simple(a) ? "" : END); });
      t = t.replace(/\b([A-Z])\s?\|\s?([A-Z])\b/g, "$1 given $2").replace(/\bdet\b\s?/g, "the determinant of ");
      t = t.replace(/\|([^|]+)\|/g, function(m, a) {
        if (/^\s?[A-Z]\s?$/.test(a)) return "the determinant of " + a.trim();
        if (/^\s?[A-Z]{2}\s?$/.test(a)) return "the length of " + a.trim().split("").join(" "); // |PQ|
        return "the absolute value of " + a.trim() + (simple(a) ? "" : END);
      });
      // matrices typed as [[1, 2], [3, 4]]
      t = t.replace(/\[\s?(\[[^\[\]]*\](?:\s?,\s?\[[^\[\]]*\])*)\s?\]/g, function(m, rows) {
        var rs = rows.match(/\[[^\[\]]*\]/g) || [];
        return matrixWords(rs.map(function(r) { return r.slice(1, -1).split(/\s?,\s?/); }));
      });
      return t;
    }

    function matrixWords(rows) {
      var c = rows.length ? rows[0].length : 0;
      return "the " + rows.length + " by " + c + " matrix: " + rows.map(function(r, i) { return "row " + (i + 1) + ": " + r.join(", "); }).join("; ") + END;
    }

    /* ---- groups in brackets: taken apart from the inside out, each said by expr() with what's around it ---- */
    var raw = [],
      done = [],
      plain = [];

    function groups(t) {
      var re = /\(([^()]*)\)/g,
        guard = 0;
      while (/\([^()]*\)/.test(t) && guard++ < 30)
        t = t.replace(re, function(m, a) {
          raw.push(a);
          done.push(null);
          return GO + (raw.length - 1) + GC;
        });
      return t;
    }

    function inner(id) {
      id = Number(id);
      if (done[id] === null) done[id] = expr(raw[id]);
      return done[id];
    }
    // words already said, kept as one piece: "f of x" in f(x)/2 is the top of the fraction
    function keep(w) {
      raw.push("k");
      done.push(w);
      plain[raw.length - 1] = true;
      return GO + (raw.length - 1) + GC;
    }

    function flatRaw(id) { return String(raw[Number(id)]).replace(new RegExp(GO + "(\\d+)" + GC, "g"), function(m, k) { return "(" + flatRaw(k) + ")"; }); }

    function compound(id) { // more than one number or letter: "the quantity …"
      if (plain[Number(id)]) return false;
      var r = String(raw[Number(id)]).replace(new RegExp(GO + "\\d+" + GC + "|" + PO + "[^" + PC + "]*" + PC + "|" + BO + "[^" + BC + "]*" + BC, "g"), "x");
      return !simple(r) && !/,/.test(r);
    }

    function tuple(id) { return !plain[Number(id)] && /,/.test(flatRaw(id)); }

    function prose(id) { return !plain[Number(id)] && /[A-Za-z]{3,}/.test(flatRaw(id).replace(/\b(sin|cos|tan|sec|csc|cot|log|ln|sqrt|exp|abs|mod)\b/g, "")); }

    function quantity(id) { // what a group says on its own
      var w = inner(id);
      if (plain[Number(id)]) return w;
      if (tuple(id) || prose(id)) return "(" + w + ")";
      return compound(id) ? "the quantity " + w + END : w;
    }
    var G = GO + "(\\d+)" + GC;

    /* ---- powers and subscripts ---- */
    var TRIG = { sin: "sine", cos: "cosine", tan: "tangent", sec: "secant", csc: "cosecant", cot: "cotangent", arcsin: "arc sine", arccos: "arc cosine", arctan: "arc tangent", sinh: "hyperbolic sine", cosh: "hyperbolic cosine", tanh: "hyperbolic tangent" };

    function powerWords(e) {
      e = String(e).replace(/-/g, "−").replace(/\s+/g, " ").trim();
      if (/^\d+$/.test(e)) {
        var n = Number(e);
        return n === 2 ? "squared" : n === 3 ? "cubed" : n === 0 ? "to the zero power" : n === 1 ? "to the first power" : "to the " + nth(n) + " power";
      }
      if (/^−\d+(\.\d+)?$/.test(e)) return "to the power of negative " + e.slice(1);
      if (/^[a-zA-Zθ]$/.test(e)) return "to the " + e;
      if (/^[a-z]{2,3}$/.test(e)) return "to the power " + e.split("").join(" "); // (1 + r/n)^nt
      if (/^[′'″]+$/.test(e)) return e.length > 1 || e === "″" ? "double prime" : "prime"; // f with a prime written as a power
      var f = /^(−?)(\d+)\/(\d+)$/.exec(e);
      if (f) return "to the " + (f[1] ? "negative " : "") + fracWords(f[2], f[3]) + " power";
      if (e === "∘" || e === "o") return "degrees";
      return "to the power " + expr(e) + END;
    }

    function powers(s) {
      var re = new RegExp("(" + G + "|[A-Za-z]+|θ|\\d+(?:\\.\\d+)?)?(\\s?)" + PO + "([^" + PO + PC + "]*)" + PC),
        guard = 0;
      while (re.test(s) && guard++ < 40) s = s.replace(re, function(m, base, id, sp, e) {
        var ee = e.replace(/-/g, "−").trim();
        base = base || "";
        // (x + 1)², (−3)² and (i⁴)⁵: "the quantity …, squared" — not −3² or i to the 4th to the 5th; kept whole: P(1 + r)² is P times it
        if (id !== undefined) return keep((compound(id) || (!plain[Number(id)] && new RegExp("^\\s*[−-]|" + PO).test(raw[Number(id)])) ? "the quantity " + inner(id) + ", " : quantity(id) + " ") + powerWords(e)) + " ";
        if (TRIG[base]) return ee === "−1" ? "inverse " + TRIG[base] : TRIG[base] + " " + powerWords(e);
        if (ee === "−1" && /^[fghA-Z]$/.test(base)) return base + " inverse";
        if (ee === "T" && /^[A-Z]$/.test(base)) return base + " transpose";
        if (ee === "*" && /^[A-Z]$/.test(base)) return base + " star";
        return (base ? base : sp) + " " + powerWords(e) + " ";
      });
      return s;
    }

    function subs(s) {
      var re = new RegExp("(\\b[A-Za-z]+|θ|" + G + ")?" + BO + "([^" + BO + BC + "]*)" + BC),
        guard = 0;
      while (re.test(s) && guard++ < 40) s = s.replace(re, function(m, base, id, c) {
        c = c.trim();
        if (base === "log") return "log base " + expr(c);
        if (base === "H" && /^[0a]$/.test(c)) return c === "0" ? "H naught" : "H a"; // the hypotheses
        var say = /^[a-z]{2,3}$/.test(c) ? c.split("").join(" ") : expr(c);
        return (id !== undefined ? quantity(id) : base || "") + " sub " + say + (simple(c) ? "" : END) + " ";
      });
      return s;
    }

    /* ---- roots ---- */
    var ROOT = { "√": 2, "∛": 3, "∜": 4 };

    function roots(s) {
      var re = new RegExp("(\\d+(?:\\.\\d+)?|[a-zA-Zθπ]|" + G + ")?(\\s?)(?:" + PO + "(\\d+|[a-z])" + PC + ")?([√∛∜])\\s?(" + RO + "([^" + RO + RC + "]*)" + RC + "|" + G + "|\\d+(?:\\.\\d+)?[a-zA-Z]?|[a-zA-Zθπ])?", "g");
      return s.replace(re, function(m, coef, cid, sp, idx, sign, rad, rin, rid, at, all) {
        var pre = coef ? "" : sp;
        if (coef && /[A-Za-z]/.test(coef) && /[A-Za-z]/.test(all.charAt(at - 1))) {
          pre = coef + sp;
          coef = "";
        } // a word, not a number in front
        var k = idx ? (/^\d+$/.test(idx) ? Number(idx) : idx) : ROOT[sign],
          name = k === 2 ? "square root" : k === 3 ? "cube root" : typeof k === "number" ? nth(k) + " root" : k + "th root",
          what, long = false;
        if (rin !== undefined) {
          what = expr(rin);
          long = !simple(rin.replace(new RegExp("[" + PO + PC + "]", "g"), ""));
        } else if (rid !== undefined) {
          what = inner(rid);
          long = compound(rid);
        } else what = rad || "";
        if (!what) return pre + (coef ? coef + " times " : "") + "the " + name + " of ";
        var c = coef ? (cid !== undefined ? quantity(cid) : coef) : "";
        if (long) return pre + (c ? c + " times " : "") + "the " + name + " of the quantity " + what + END;
        if (c && k === 2) return pre + c + " root " + what;
        return pre + (c ? c + " times " : "") + "the " + name + " of " + what;
      });
    }

    /* ---- functions: f(x), f′(2), sin 30°, log₂ 32, P(A) ---- */
    function funcs(s) {
      s = s.replace(/\b([fghyFGH])(′′′|‴|′′|″|′|''|')/g, function(m, f, p) { return f + (p.length === 3 || p === "‴" ? " triple prime" : p === "″" || p.length === 2 ? " double prime" : " prime"); });
      // each said as one piece (keep), so f(x)/2 is "f of x over 2"
      s = s.replace(new RegExp("\\b([fgh](?: inverse| prime| double prime| triple prime)?)\\s?" + G, "g"), function(m, f, id) { return keep(f + " of " + inner(id)) + (compound(id) ? END : ""); });
      s = s.replace(new RegExp("\\b([A-Z])" + G, "g"), function(m, f, id) {
        var r = flatRaw(id);
        if (f === "P" && !plain[Number(id)] && /^\s*[A-Z]|[<>=≤≥]/.test(r)) return keep("P of " + inner(id)) + (compound(id) ? END : ""); // P(X = 4), P(Z < −1)
        if (plain[Number(id)] || /[+−×÷*\/=]|\d\s?-/.test(r)) return m; // P(1 + r): times, said below
        if (tuple(id) && f !== "P") return f + " " + quantity(id); // a point A(2, 3)
        return keep(f + " of " + inner(id)) + (compound(id) ? END : "");
      });
      s = s.replace(new RegExp("\\b([a-z])" + G, "g"), function(m, f, id, at, all) {
        if (plain[Number(id)] || /[A-Za-z]/.test(all.charAt(at - 1)) || !/^\s?[txnrθ]\s?$/.test(raw[Number(id)]) || f === "x") return m;
        return keep(f + " of " + inner(id));
      });
      s = s.replace(new RegExp("\\b(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh|inverse (?:sine|cosine|tangent)|(?:sine|cosine|tangent|secant|cosecant|cotangent) (?:squared|cubed)|log base [A-Za-z0-9.]+|log|ln|exp)\\b(?:\\s?" + G + "|\\s(?=[−-]?[\\d.θπxyzt√" + FO + "]))?", "g"), function(m, f, id) {
        var name = TRIG[f] || (f === "ln" ? "natural log" : f === "exp" ? "e to the" : f);
        if (id !== undefined) return name + (f === "exp" ? " " : " of ") + inner(id) + (compound(id) ? END : "");
        if (/\s$/.test(m)) return name + (f === "exp" ? " " : " of ");
        return name;
      });
      return s;
    }

    /* ---- fractions ---- */
    function fractions(s) {
      // the page's stacked fractions, inside ones first; a whole number just before one makes a mixed number
      var re = new RegExp("(\\d+\\s?)?" + FO + "([^" + FO + FM + FC + "]*)" + FM + "([^" + FO + FM + FC + "]*)" + FC),
        guard = 0;
      while (re.test(s) && guard++ < 30) s = s.replace(re, function(m, w, a, b, at, all) {
        var mixed = w && /^\s*\d+\s*$/.test(a) && /^\s*\d+\s*$/.test(b) && !/[\d.,]/.test(all.charAt(at - 1));
        return (w ? w.trim() + (mixed ? " and " : " ") : "") + fracWords(expr(a), expr(b)) + " ";
      });
      // 1 3/4, 3/4, x/3, (x + 1)/(x − 2)
      s = s.replace(/(\d+\s)?([−-]?)(\d+)\/(\d+)(?![\d\/]|\.\d)/g, function(m, w, neg, a, b, at, all) {
        var pre = all.charAt(at - 1);
        if (/[\d.,\/]/.test(pre) || (!w && /[\w.]/.test(pre))) return m;
        if (w && Number(a) >= Number(b)) return w + neg + a + " over " + b;
        return (w ? w.trim() + " and " : "") + (neg ? "negative " : "") + fracWords(a, b);
      });
      var tok = "(" + G + "|[A-Za-z0-9.θπ?]+)";
      return s.replace(new RegExp(tok + "\\s*\\/\\s*" + tok, "g"), function(m, a, ia, b, ib) {
        if (/^and$/i.test(a) && /^or$/i.test(b)) return m;
        var l = ia !== undefined ? (compound(ia) ? "the quantity " + inner(ia) + "," : quantity(ia)) : a,
          r = ib !== undefined ? quantity(ib) : b;
        if (ib === undefined && /^[a-z]{3,}$/i.test(a) && /^(hours?|minutes?|seconds?|days?|weeks?|months?|years?|gallons?|miles?|person|people|items?|pounds?|ounces?|kilograms?|units?|doses?|foot|feet|inch(es)?|meters?|liters?|cups?)$/.test(b)) return a + " per " + b;
        return l + " over " + r;
      });
    }

    /* ---- a number or letter right before a group, or two groups together: times ---- */
    function times(s) {
      s = s.replace(new RegExp("(\\d|\\b[a-zA-Zθπ]|" + GC + "|!)(?=" + G + ")", "g"), function(m, l, id, at, all) {
        if (/[A-Za-z]/.test(l) && /[A-Za-z]/.test(all.charAt(at - 1))) return m; // a word: item(s)
        if (tuple(id) || prose(id)) return m;
        return l + " times ";
      });
      return s.replace(new RegExp("(" + GC + ")(?=" + GO + "|\\d|[a-zA-Z]\\b)", "g"), "$1 times ");
    }
    // the groups still left, said on their own: "the quantity x − 1"; a word's (s) stays as it is
    // and an aside after a word or number, "1 1/3 (≈ 1.33) apples", keeps its brackets
    function ungroup(s) {
      return s.replace(new RegExp(G, "g"), function(m, id, at, all) {
        var before = all.slice(0, at);
        if (/[A-Za-z]$/.test(before) || /[\d%]\s+$/.test(before) || /^\s*[≈~=]/.test(raw[Number(id)])) return "(" + inner(id) + ")";
        return quantity(id);
      });
    }

    /* ---- the symbols ---- */
    var SYM = [
      [/≤/g, " is less than or equal to "],
      [/≥/g, " is greater than or equal to "],
      [/≠/g, " is not equal to "],
      [/≅/g, " is congruent to "],
      [/≡/g, " is equivalent to "],
      [/∝/g, " is proportional to "],
      [/(^|[(,:;]\s*)≈/g, "$1about "],
      [/≈/g, " is about "],
      [/(^|\s)~\s?(?=\d)/g, "$1about "],
      [/</g, " is less than "],
      [/>/g, " is greater than "],
      [/=/g, " equals "],
      [/±/g, " plus or minus "],
      [/∓/g, " minus or plus "],
      [/÷/g, " divided by "],
      [/\+/g, " plus "],
      [/%/g, " percent"],
      [/‰/g, " per thousand"],
      [/∞/g, " infinity "],
      [/∠\s?([A-Z]+)/g, function(m, a) { return " angle " + a.split("").join(" ") + " "; }],
      [/∠/g, " angle "],
      [/(△|∆(?=[A-Z]{3}))\s?([A-Z]+)/g, function(m, x, a) { return " triangle " + a.split("").join(" ") + " "; }],
      [/⊥/g, " is perpendicular to "],
      [/\b(R\d*)\s?∥\s?(?=R)/g, "$1 in parallel with "],
      [/∥/g, " is parallel to "],
      [/∴/g, " so "],
      [/∈/g, " is in "],
      [/∉/g, " is not in "],
      [/∪/g, " union "],
      [/∩/g, " intersect "],
      [/⊆/g, " is a subset of "],
      [/⊂/g, " is a subset of "],
      [/∅/g, " the empty set "],
      [/ℝ/g, " the real numbers "],
      [/ℤ/g, " the integers "],
      [/ℕ/g, " the natural numbers "],
      [/ℚ/g, " the rational numbers "],
      [/ℂ/g, " the complex numbers "],
      [/[Δ∆]\s?(?=[a-zA-Z])/g, " delta "],
      [/[Δ∆]/g, " delta "],
      [/∂/g, " partial "],
      [/∏/g, " the product of "],
      [/√/g, " the square root of "],
      [/∛/g, " the cube root of "],
      [/∜/g, " the fourth root of "],
      [/\^/g, " to the power "],
      [/°F\b/g, " degrees Fahrenheit"],
      [/°C\b/g, " degrees Celsius"],
      [/°/g, " degrees"],
      [/″/g, " double prime"],
      [/′/g, " prime"],
      [/\s*…|\.\.\.(?!\.)/g, " and so on"],
      [/\s*[⇒⟹]\s*/g, ", so "],
      [/\s*⇔\s*/g, " if and only if "],
      [/\b(R\d+)\s?↔\s?(R\d+)/g, "swap $1 and $2"],
      [/\s*↔\s*/g, " if and only if "],
      [/(^|\s)([a-zA-Z]{1,3})\s→\s([a-zA-Z]{1,3})(?=$|[\s.,;])/g, "$1$2 to $3"],
      [/\s*→\s*/g, ", so "],
      [/&/g, " and "],
      [/\s\|\s/g, ", "],
      [/#(?=\d)/g, "number "],
      [/✓/g, " "],
      [/α/g, " alpha "],
      [/β/g, " beta "],
      [/γ/g, " gamma "],
      [/δ/g, " delta "],
      [/ε/g, " epsilon "],
      [/θ/g, " theta "],
      [/λ/g, " lambda "],
      [/μ/g, " mu "],
      [/ν/g, " nu "],
      [/ρ/g, " rho "],
      [/σ/g, " sigma "],
      [/τ/g, " tau "],
      [/[φϕ]/g, " phi "],
      [/χ/g, " chi "],
      [/ω/g, " omega "],
      [/Ω/g, " ohms "],
      [/π/g, " pi "],
      [/Σ/g, " sum "]
    ];

    function ops(s) {
      s = s.replace(/(\d)\s*R\s*(\d)/g, "$1 remainder $2");
      // a list: "V = 12 V · R = 4 Ω", "36 W · work the power" (not u · v = 11, 4 · 5)
      s = s.replace(/\s*·\s*(?=([A-Za-z]{2,}\b(?!\s?[=(])|[A-Za-z]\w*\s?=))/g, function(m, x, at, all) {
        var eq = /=[^;·]*$/.test(all.slice(0, at)); // an equation before it, and a word or "R =" after
        var word = /^[A-Za-z]{2,}/.test(x) && !/^(negative|the|quantity|square|cube|pi|log|natural|sine|cosine|tangent|absolute|inverse|delta|theta|sigma|mu|alpha)\b/.test(x);
        return (word && /^\s/.test(m)) || eq ? "; " : m;
      });
      // 2 × 2 matrix: "by"; u · v, u × v: "dot", "cross"
      s = s.replace(/(\b[\dmn]+)\s?×\s?([\dmn]+)(?=\s+(?:matri|identity|grid|array|system|block|board|lumber|stud|joist|rafter|plank|post|piece))/g, "$1 by $2");
      s = s.replace(/\b(inch(?:es)?|feet|foot|yards?|meters?|centimeters?|millimeters?)\s?×\s?(?=[\d.])/g, "$1 by "); // 8 feet by 10 feet
      s = s.replace(/\b([12])\s?×\s?(2|3|4|6|8|10|12)\b(?=s\b|,?\s+\d+(?:\.\d+)?\s(?:feet|foot|inches)\b)/g, "$1 by $2"); // lumber: a 2 by 10, 16 feet long
      s = s.replace(/\b([uvw])\s?·\s?([uvw])\b/g, "$1 dot $2").replace(/\b([uvw])\s?×\s?([uvw])\b/g, "$1 cross $2");
      s = s.replace(new RegExp("([\\w!" + END + "]\\s*)·(?=\\s*[\\w(√π−-])", "g"), "$1 times ").replace(/\s·\s/g, ", ").replace(/·/g, " times ");
      s = s.replace(/×/g, " times ").replace(/\*/g, " times ");
      // a minus sign at the start, after a bracket or a sign, or right before a number: negative
      s = s.replace(/(^|[\[(=,:;<>≤≥≈±+×÷·]|\s(?:is|of|times|by|over|plus|minus|and|to|from|approaches|power|sub|base|root))(\s*)−(?=\s?(?:\.?\d|[√π∞a-zA-Zθ]))/g, "$1$2negative ");
      s = s.replace(/(\s)−(?=\.?\d|[√π∞])/g, "$1negative ");
      s = s.replace(/−/g, " minus ").replace(/–/g, " minus ");
      for (var i = 0; i < SYM.length; i++) s = s.replace(SYM[i][0], SYM[i][1]);
      // 3xy: "3x y", read as letters
      s = s.replace(/\b(\d*)([a-z])([a-z]{1,2})\b/g, function(m, d, a, b) {
        if (!d && !/^(xy|xz|yz|ab|bc|ac|mn|xyz|abc|ax|bx|cx|mx|kx)$/.test(a + b)) return m;
        if (d && /^(st|nd|rd|th|am|pm|in|s)$/.test(a + b)) return m;
        return d + a + " " + b.split("").join(" ");
      });
      return s;
    }

    // the groups, powers, roots, functions, fractions and symbols in one piece of text
    function expr(s) {
      s = groups(String(s));
      // n!, 3!·7!, (n − r)!
      s = s.replace(new RegExp("(\\d|\\b[nrk]|" + GC + ")!(?!=)", "g"), "$1 factorial");
      s = roots(s);
      s = subs(powers(s));
      s = funcs(s);
      s = fractions(times(s));
      return ops(ungroup(s));
    }

    function prep(t) {
      t = String(t == null ? "" : t).replace(/[\u00a0\u2007\u2009\u200a\u202f]/g, " ").replace(/[\u200b\u2060\ufeff]/g, "")
        .replace(/\u00b5/g, "μ").replace(/\u2044/g, "/").replace(/[⋅∙]/g, "·").replace(/∶/g, ":").replace(/''/g, "″").replace(/\s+/g, " ");
      t = t.replace(VUL_RE, function(m, d, f) { var p = VULGAR[f].split("/"); return (d ? d + " " : "") + FO + p[0] + FM + p[1] + FC; });
      t = t.replace(SUP_RE, function(r) { return PO + mapRun(r, SUPS) + PC; }).replace(SUB_RE, function(r) { return BO + mapRun(r, SUBS) + BC; });
      t = t.replace(/\^\s?\(([^()]*)\)/g, PO + "$1" + PC).replace(/\^\s?\{([^{}]*)\}/g, PO + "$1" + PC).replace(/\^\s?([−-]?(?:\d+(?:\.\d+)?|[a-zA-Z]))/g, PO + "$1" + PC);
      t = t.replace(/_\{([^{}]*)\}/g, BO + "$1" + BC).replace(/\b([a-zA-Z])_([a-zA-Z0-9]+)/g, "$1" + BO + "$2" + BC);
      // a bar over digits: they repeat; over a letter: "x bar"; a hat: "p hat"; an arrow: "vector v"
      t = t.replace(/((?:\d[\u0305\u0304])+)/g, function(m) { return EO + m.replace(/[\u0305\u0304]/g, "") + EC; })
        .replace(/([a-zA-Z])[\u0305\u0304]/g, "$1 bar").replace(/([a-zA-Z])\u0302/g, "$1 hat").replace(/([a-zA-Z])\u20d7/g, "vector $1").replace(/ȳ/g, "y bar");
      t = t.replace(/ȳ/g, "y bar").replace(/ŷ/g, "y hat").replace(/\b([tz]|df)\*/g, "$1 star"); // t*, the critical value
      t = t.replace(/\b(401|403|457|529)\(([a-z])\)/g, "$1 $2"); // a 401(k)
      // dashes: a pause between words; numbers in a row (the 68–95–99.7 rule), a range (pages 3–5); else a minus
      t = t.replace(/\s*—\s*/g, ", ").replace(/([A-Za-z]{2,}[.,;]?)\s+–\s+(?=[A-Za-z]{2,})/g, "$1, ")
        .replace(/(\d)–(\d[\d.]*)–(?=\d)/g, "$1, $2, ").replace(/([A-Za-z]{3,}\s\d+)–(\d+)\b/g, "$1 to $2").replace(/–/g, "−");
      t = t.replace(/([A-Za-z]{2,}[.,;]?)\s+-\s+(?=[A-Za-z]{2,})/g, "$1, ").replace(/\s-\s/g, " − ").replace(/(^|[\s(\[=,:;<>≤≥+×÷])-(?=[\d.√π($])/g, "$1−");
      return t.replace(/(\w|\))\s?\*\s?(?=[\w(])/g, "$1 × ");
    }

    function tidy(s) {
      s = s.replace(new RegExp(END + "+(?=\\s*[\\w(\\-−\\uE000-\\uF8FF])", "g"), ", ").replace(/[\uE000-\uF8FF]/g, " ");
      return s.replace(/\s+/g, " ").replace(/\s+([,.;:!?)]|[’']s\b)/g, "$1").replace(/\(\s+/g, "(").replace(/,(\s*,)+/g, ",").replace(/([.;:!?]),/g, "$1")
        .replace(/,(?=\s*(?:$|[.;:!?]))/g, "").replace(/^[\s,]+/, "").trim();
    }

    /* ---- the math in another language. Its words are data: HelperI18n.raw("tools.speech"), in the "tools" part of
       assets/i18n/<lang>.js (es.js says what each entry is). It covers what the helpers' explanations hold: the
       operations and relations, negative numbers, fractions (by name, mixed, "a over b"), powers, roots, money,
       decimals, big numbers, remainders, ratios and repeating digits. Units, clock times, functions, calculus, sets
       and matrices are left as they are written, for the voice to read. English never comes here. ---- */
    function lex() {
      if (speechLang() === "en" || !window.HelperI18n || !HelperI18n.raw) return null;
      var L = HelperI18n.raw("tools.speech");
      return L && typeof L === "object" ? L : null;
    }

    function one(forms, n) { return fillIn(Number(n) === 1 ? forms[0] : forms[1], { n: n }); } // ["un dólar", "{n} dólares"]

    function fracL(L, n, d) {
      var F = L.fractions || {},
        a = String(n).replace(/\s+/g, " ").trim(),
        b = String(d).replace(/\s+/g, " ").trim(),
        m = /^([−-])?(\d+)$/.exec(a);
      if (m && /^\d+$/.test(b)) {
        var k = Number(b),
          top = Number(m[2]),
          name = F.names && F.names[k];
        if (name && !(top > 20 && top > 3 * k)) return (m[1] ? L.negative + " " : "") + (top === 1 ? fillIn(name[0], { n: m[2] }) : fillIn(name[1], { n: m[2] }));
      }
      return fillIn(F.over, { a: simple(a) ? a : a + ",", b: simple(b) ? b : L.quantity + " " + b + END });
    }

    function moneyL(L, t) {
      var M = L.money;
      return t.replace(/([−-]?)\$\s?(\d{1,3}(?:,\d{3})+|\d+)?(?:\.(\d+))?/g, function(m, neg, d, c) {
          if (!d && !c) return m;
          d = String(d || "0").replace(/,/g, "");
          var dn = Number(d),
            cn = c ? Number(c) : 0,
            s;
          if (c && c.length !== 2) s = fillIn(M.dollar[1], { n: d + "." + c }); // $2.5: 2.5 dollars
          else if (c && dn === 0) s = one(M.cent, cn); // $0.50: 50 cents
          else {
            s = one(M.dollar, dn === 1 ? 1 : d);
            if (cn) s = fillIn(M.both, { d: s, c: one(M.cent, cn) }); // $12.50: 12 dollars and 50 cents
          }
          return (neg ? L.negative + " " : "") + s;
        }).replace(/(\d+)\s?¢/g, function(m, n) { return one(M.cent, n); })
        .replace(/(\d[\d,.]*)\s?€|€\s?(\d[\d,.]*)/g, function(m, a, b) { return fillIn(M.euro, { n: a || b }); })
        .replace(/£\s?(\d[\d,.]*)/g, function(m, n) { return fillIn(M.pound, { n: n }); });
    }

    function powerL(L, e) {
      var P = L.powers;
      e = String(e).replace(/-/g, "−").replace(/\s+/g, " ").trim();
      if (e !== "n" && e !== "negative" && P[e]) return P[e]; // "n" and "negative" are the templates, not powers
      if (/^−\d+(\.\d+)?$/.test(e)) return fillIn(P.negative, { n: e.slice(1) });
      if (/^[′'″]+$/.test(e)) return e;
      return fillIn(P.n, { n: e });
    }

    function rootsL(L, s) {
      var R = L.roots,
        re = new RegExp("(\\d+(?:\\.\\d+)?|[a-zA-Zθπ])?(\\s?)(?:" + PO + "(\\d+|[a-z])" + PC + ")?([√∛∜])\\s?(" + RO + "([^" + RO + RC + "]*)" + RC + "|\\d+(?:\\.\\d+)?[a-zA-Z]?|[a-zA-Zθπ])?", "g");
      return s.replace(re, function(m, coef, sp, idx, sign, rad, rin, at, all) {
        var pre = coef ? "" : sp;
        if (coef && /[A-Za-z]/.test(coef) && /[A-Za-zÀ-ÿ]/.test(all.charAt(at - 1))) { // a word, not a number in front
          pre = coef + sp;
          coef = "";
        }
        var k = idx || ROOT[sign],
          name = R[k] || fillIn(R.n, { n: k }),
          what = rin !== undefined ? rin : rad || "",
          r = !what ? name : rin !== undefined && !simple(rin.replace(new RegExp("[" + PO + PC + "]", "g"), "")) ? name + " " + L.quantity + " " + what + END : name + " " + what;
        return pre + (coef ? fillIn(R.times, { c: coef, r: r }) : r) + " ";
      });
    }

    function wordsL(L, t) {
      var F = L.fractions,
        s = prep(t).replace(/\.\.\.(?!\.)/g, "…");
      // prep() names a few marks in English (x bar, p hat, t star, vector v, a range "3 to 5"): the language's words
      var M = L.marks || {};
      s = s.replace(/\b([a-zA-Z]|df) (bar|hat|star)\b/g, function(m, x, k) { return x + " " + (M[k] || k); })
        .replace(/\bvector ([a-zA-Z])\b/g, function(m, x) { return (M.vector || "vector") + " " + x; })
        .replace(/(\d) to (?=\d)/g, "$1 " + (M.to || "to") + " ");
      s = moneyL(L, s);
      s = s.replace(/(^|[^\d.,])(\d{1,3}(?:,\d{3})+)(?!\d|,\d)/g, function(m, pre, n) { return pre + n.replace(/,/g, ""); }); // 1,200 is one number
      // repeating digits: 0.(3), 0.1(6), and the page's marked ones
      s = s.replace(/(\d*\.\d*)\((\d+)\)/g, function(m, a, r) { return a + EO + r + EC; });
      s = s.replace(new RegExp("([\\d.]*)" + EO + "([^" + EC + "]*)" + EC, "g"), function(m, a, r) {
        r = r.replace(/\D/g, "");
        if (!r) return a;
        if (!a || /\.$/.test(a)) return fillIn(L.repeat.all, { n: a + r });
        return fillIn(L.repeat.part, { a: a, r: r.split("").join(" ") });
      });
      s = s.replace(/(\d)(?::|\s:\s)(?=\d)/g, "$1 " + L.ratio + " "); // 3:2
      s = rootsL(L, s);
      var guard = 0,
        pw = new RegExp(PO + "([^" + PO + PC + "]*)" + PC),
        sb = new RegExp(BO + "([^" + BO + BC + "]*)" + BC);
      while (pw.test(s) && guard++ < 40) s = s.replace(pw, function(m, e) { return " " + powerL(L, e) + " "; });
      while (sb.test(s) && guard++ < 80) s = s.replace(sb, function(m, c) { return " " + L.sub + " " + c.trim() + " "; });
      // the page's stacked fractions; a whole number just before one makes a mixed number
      var fr = new RegExp("(\\d+\\s?)?" + FO + "([^" + FO + FM + FC + "]*)" + FM + "([^" + FO + FM + FC + "]*)" + FC);
      guard = 0;
      while (fr.test(s) && guard++ < 30) s = s.replace(fr, function(m, w, a, b, at, all) {
        var mixed = w && /^\s*\d+\s*$/.test(a) && /^\s*\d+\s*$/.test(b) && !/[\d.,]/.test(all.charAt(at - 1));
        if (mixed) return fillIn(F.mixed, { w: w.trim(), f: fracL(L, a, b) }) + " ";
        return (w ? w.trim() + " " : "") + fracL(L, a, b) + " ";
      });
      // 1 3/4, 3/4, −3/4; x/3
      s = s.replace(/(\d+\s)?([−-]?)(\d+)\/(\d+)(?![\d\/]|\.\d)/g, function(m, w, neg, a, b, at, all) {
        var pre = all.charAt(at - 1);
        if (/[\d.,\/]/.test(pre) || (!w && /[\w.]/.test(pre))) return m;
        if (w && Number(a) >= Number(b)) return w + (neg ? L.negative + " " : "") + fillIn(F.over, { a: a, b: b });
        var f = (neg ? L.negative + " " : "") + fracL(L, a, b);
        return w ? fillIn(F.mixed, { w: w.trim(), f: f }) : f;
      });
      s = s.replace(/(^|[\s(])([a-zA-Z0-9.θπ]+)\s?\/\s?([a-zA-Z0-9.θπ]+)(?=$|[\s),.;:!?])/g, function(m, pre, a, b) {
        return /\d/.test(a + b) ? pre + fillIn(F.over, { a: a, b: b }) : m; // x/3, not y/o
      });
      s = s.replace(/(\d)\s*R\s*(\d+)/g, function(m, q, r) { return fillIn(L.remainder, { q: q, r: r }); });
      // a minus sign at the start, after a bracket or a sign, or right before a number: negative
      s = s.replace(/(^|[\[(=,:;<>≤≥≈±+×÷·])(\s*)−(?=\s?(?:\.?\d|[√π∞a-zA-Zθ]))/g, "$1$2" + L.negative + " ").replace(/(\s)−(?=\.?\d|[√π∞])/g, "$1" + L.negative + " ");
      s = s.replace(/[−–]/g, " " + L.minus + " ").replace(/\s*[×·*]\s*/g, " " + L.times + " ");
      s = s.replace(/(^|[(,:;]\s*)[≈~]\s?(?=\d)/g, "$1" + L.about + " ").replace(/#(?=\d)/g, L.number + " ").replace(/✓/g, " ");
      if (L.blank) s = s.replace(/(^|[\s(=×÷+−])\?(?=\s*(?:$|[=×÷+−),]))/g, "$1 " + L.blank + " "); // 0.2 × ? = 15: the number to find
      for (var k in L.sym)
        if (L.sym.hasOwnProperty(k)) s = s.split(k).join(" " + L.sym[k] + " ");
      // decimals: 25.4 is "25 point 4"
      s = s.replace(/(\d)\.(?=\d)/g, "$1 " + L.point + " ").replace(/(^|[^\w])\.(?=\d)/g, "$1" + L.point + " ");
      return tidy(s);
    }

    function words(t) {
      var L = lex();
      if (L) return wordsL(L, t);
      raw = [];
      done = [];
      plain = [];
      var s = prep(t);
      s = money(s);
      s = clock(s);
      s = repeat(s);
      s = units(s);
      s = special(s);
      return tidy(expr(s));
    }

    /* the page's markup, said: a copy of el with its math turned into marks words() reads */
    function txt(e) { return e ? e.textContent : ""; }
    // the last character of the text before node n
    function lastChar(n) {
      while (n) {
        if (n.previousSibling) {
          n = n.previousSibling;
          var t = n.textContent;
          if (t) return t.charAt(t.length - 1);
        } else n = n.parentNode;
      }
      return "";
    }

    function spoken(el) {
      var c = document.createElement("div"), // a holder, so el itself is read too (a fraction, a power on its own)
        q = function(sel) { return [].slice.call(c.querySelectorAll(sel)); };
      c.appendChild(el.cloneNode(true));
      q("svg, .sr-only, button, script, style").forEach(function(x) { if (x.parentNode) x.parentNode.removeChild(x); });
      // a pause after the step label ("Set up"), each tag ("Ignore points") and each line, so they aren't run together
      q(".n, .sn, .tag, .line, .aside, .note").forEach(function(x) { x.appendChild(document.createTextNode(". ")); });
      q(".u").forEach(function(x) { x.insertBefore(document.createTextNode(" "), x.firstChild); }); // 40 cm²
      // the inside ones first: powers, then roots and fractions (whose parts may hold powers), then matrices
      q(".sep").forEach(function(x) { x.textContent = "; "; }); // GCF 6 · LCM 36
      // the arrow between two fractions, the same step above and below it: "÷6" over "÷6"
      var L = lex();
      q(".xa").forEach(function(x) {
        var k = [].map.call(x.children, function(y) { return y.textContent.trim(); }),
          m = /^([÷×])\s?(\d+)$/.exec(k[0] || "");
        if (m && k.length === 2 && k[0] === k[1]) x.textContent = ", " + (L ? fillIn(L.steps[m[1] === "÷" ? "div" : "mul"], { n: m[2] }) : (m[1] === "÷" ? "divide" : "multiply") + " the top and the bottom by " + m[2] + ", to get") + " ";
        else if (k.length) x.textContent = " " + k.join(L ? " " + L.and + " " : " and ") + " ";
      });
      q(".wk, .op-s").forEach(function(x) {
        x.insertBefore(document.createTextNode(" "), x.firstChild);
        x.appendChild(document.createTextNode(" "));
      });
      // an integral's bounds, the top one first: ∫ with 2 over 0
      q(".bnd").forEach(function(b) { if (b.children.length === 2) b.textContent = BO + b.children[1].textContent + BC + PO + b.children[0].textContent + PC + " "; });
      q("sup").reverse().forEach(function(s) { s.textContent = PO + s.textContent + PC; });
      q("sub").reverse().forEach(function(s) { s.textContent = BO + s.textContent + BC; });
      q(".rep").reverse().forEach(function(x) { x.textContent = EO + x.textContent + EC; });
      // roots: .rt holding √ and the .rad under it, or .rad holding .ri (index), .rs (the sign) and .rc (under it)
      q(".rt").reverse().forEach(function(r) {
        var u = r.querySelector(".rad");
        if (u) r.textContent = (r.textContent.replace(u.textContent, "").replace(/[^√∛∜]/g, "") || "√") + RO + u.textContent + RC;
      });
      q(".rad").reverse().forEach(function(r) {
        var rc = r.querySelector(".rc"),
          rs = r.querySelector(".rs"),
          sign = rs ? rs.textContent.replace(/[^√∛∜]/g, "") || "√" : "√",
          ix = r.querySelector(".ri, .idx, .ix");
        if (rc) r.textContent = (ix ? PO + ix.textContent.trim() + PC : "") + sign + RO + rc.textContent + RC;
      });
      q(".fr, .frac, .fraction").reverse().forEach(function(fr) {
        var nu = fr.querySelector(".nu, .num, .top"),
          de = fr.querySelector(".de, .den, .bot, .bottom");
        if (!nu || !de) {
          var k = fr.children;
          if (k.length === 2) {
            nu = k[0];
            de = k[1];
          }
        }
        if (nu && de) fr.textContent = (/[\w)]/.test(lastChar(fr)) ? " " : "") + FO + nu.textContent.trim() + FM + de.textContent.trim() + FC + " ";
      });
      q(".mx").reverse().forEach(function(mx) {
        if (L && !mx.children.length) return; // the helpers' whole number in a mixed number, not a matrix (English still says "the column" here)
        var cells = [].slice.call(mx.children).map(function(e) { var t = txt(e); return /^[\s·•?…]*$/.test(t) ? "blank" : t; }), // a cell still to work out shows a dot
          m = /repeat\(\s?(\d+)/.exec(mx.getAttribute("style") || ""),
          n = m ? Number(m[1]) : Math.round(Math.sqrt(cells.length)) || 1,
          rows = [];
        for (var i = 0; i < cells.length; i += n) rows.push(cells.slice(i, i + n));
        mx.textContent = " " + (n === 1 ? "the column " + rows.map(function(r) { return r[0]; }).join(", ") + END : matrixWords(rows)) + " ";
      });
      // no ". ." where a line already ended
      return words(c.textContent).replace(/\s+\./g, ".").replace(/([.!?:;])(?:\s*\.)+/g, "$1").replace(/^\.\s*/, "");
    }

    return { words: words, spoken: spoken, lex: lex };
  })();

  function spoken(el) { return MATH.spoken(el); }

  function words(t) { return MATH.words(t); }

  function logItems() {
    var log = document.querySelector(".log");
    if (!log) return [];
    return [].filter.call(log.children, function(li) {
      return li.offsetParent !== null && !li.classList.contains("veil") && getComputedStyle(li).visibility !== "hidden";
    });
  }

  function stopReading() {
    speaking = false;
    tutorReading = false;
    sayTok++;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    [].forEach.call(document.querySelectorAll(".ht-reading"), function(x) { x.classList.remove("ht-reading"); });
    if (readBtn) {
      readBtn.textContent = T("tools.readAloud", "Read aloud");
      readBtn.setAttribute("aria-pressed", "false");
    }
  }
  /* the voice: the most natural one this device has (Edge's "Natural" voices, Google's, Apple's Enhanced and Siri
     voices) rather than the browser's default, unless one was picked in the Voice menu (S.voice, S.rate) */
  var NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i;

  function voiceScore(v) {
    var n = v.name || "",
      l = String(v.lang || "").toLowerCase().replace("_", "-"),
      want = speechLang();
    if (l.indexOf(want) !== 0) return -1; // another language
    if (NOVELTY.test(n)) return 0; // the joke voices on a Mac
    var s = 10;
    if (/natural|neural/i.test(n)) s += 100; // Edge on Windows: the closest to a real person
    if (/siri/i.test(n)) s += 75;
    if (/premium|enhanced/i.test(n)) s += 70; // Apple's downloaded voices
    if (/^google/i.test(n)) s += 60; // Chrome's own voices
    if (/\b(samantha|ava|allison|zoe|susan|serena|daniel|karen|moira|tessa|evan|nathan|noelle|joelle)\b/i.test(n)) s += 25;
    if (/desktop|espeak|mbrola|pico/i.test(n)) s -= 30; // the old robotic ones
    if (want === "es" && /\b(paloma|dalia|elena|jorge|paulina|monica|juan|sabina|helena|laura|pablo|alvaro|elvira|ximena|marisol|diego|jimena)\b/i.test(n)) s += 25;
    if (l === "en-us" || l === "es-us") s += 6; // Spanish: the US and Mexican voices, as in US schools
    else if (l === "en-gb" || l === "es-mx") s += 4;
    if (v["default"]) s += 2;
    return Math.max(1, s); // a robotic voice is still better than none
  }

  function rankedVoices() {
    var all = [];
    try { all = window.speechSynthesis.getVoices() || []; } catch (e) {}
    return all.map(function(v) { return { v: v, s: voiceScore(v) }; }).filter(function(x) { return x.s > 0; })
      .sort(function(a, b) { return b.s - a.s || (a.v.name < b.v.name ? -1 : 1); }).map(function(x) { return x.v; });
  }

  function pickVoice() {
    var all = rankedVoices();
    for (var i = 0; S.voice && i < all.length; i++)
      if (all[i].voiceURI === S.voice) return all[i];
    return all[0] || null;
  }
  var lastUtter = null; // kept, or Chrome can drop it before onend fires
  var sayTok = 0; // a newer say() (or Stop) ends the one before
  function say(text, done) {
    // a sentence at a time: Chrome stops some voices part-way through a long one
    var parts = String(text).replace(/([.!?:;])\s+(?=\S)/g, "$1\u0001").split("\u0001").filter(function(x) { return /\w/.test(x); });
    var v = pickVoice(),
      k = 0,
      tok = ++sayTok;
    (function one() {
      if (tok !== sayTok) return;
      if (k >= parts.length) { if (done) done(); return; }
      var u = lastUtter = new SpeechSynthesisUtterance(parts[k++]);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else if (speechLang() !== "en" && window.HelperI18n && HelperI18n.tag) u.lang = HelperI18n.tag; // no voice of its own: the browser's, in the language
      u.rate = S.rate || 1;
      u.pitch = 1;
      u.onend = function() { if (tok === sayTok && (speaking || !done)) one(); };
      u.onerror = function() { if (tok === sayTok && done) done(); };
      window.speechSynthesis.speak(u);
    })();
  }
  /* Tutor me (tutor.js): read its question and choices, not the steps still hidden. While reading is on, each new
     question is read as it comes up, after what just happened and the step just shown. */
  function tutorOn() { return !!(window.HelperTutor && window.HelperTutor.active && window.HelperTutor.active()); }

  function readTutor() {
    var sp = window.HelperTutor.speech();
    [].forEach.call(document.querySelectorAll(".ht-reading"), function(x) { x.classList.remove("ht-reading"); });
    if (!sp || !sp.parts.length) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    var text = sp.parts.map(function(p) { return p.el ? spoken(p.el) : words(p.text); }).join(". ");
    sp.box.classList.add("ht-reading");
    say(text, function() { sp.box.classList.remove("ht-reading"); });
  }
  var tutorTimer = null;

  function onTutor(e) {
    if (!tutorReading) return;
    if (e.detail && e.detail.what === "off") { stopReading(); return; }
    clearTimeout(tutorTimer);
    tutorTimer = setTimeout(safe(function() { if (tutorReading && tutorOn()) readTutor(); }), 150);
  }

  function readAloud() {
    if (speaking) { stopReading(); return; }
    if (tutorOn()) {
      speaking = true;
      tutorReading = true;
      if (readBtn) {
        readBtn.textContent = T("tools.stopReading", "Stop reading");
        readBtn.setAttribute("aria-pressed", "true");
      }
      readTutor();
      return;
    }
    var items = logItems();
    if (!items.length) { announce(T("tools.nothingToRead", "Nothing to read yet")); return; }
    try { window.speechSynthesis.cancel(); } catch (e) {}
    speaking = true;
    readBtn.textContent = T("tools.stopReading", "Stop reading");
    readBtn.setAttribute("aria-pressed", "true");
    var i = 0;
    (function next() {
      [].forEach.call(document.querySelectorAll(".ht-reading"), function(x) { x.classList.remove("ht-reading"); });
      if (!speaking || i >= items.length) { stopReading(); return; }
      var li = items[i++];
      li.classList.add("ht-reading");
      if (li.scrollIntoView) li.scrollIntoView({ block: "nearest" });
      say(spoken(li), function() { if (speaking) next(); });
    })();
  }
  var SPEEDS = [
    ["Slower", 0.85, "tools.slower"],
    ["Normal", 1, "tools.normal"],
    ["Faster", 1.15, "tools.faster"]
  ];

  function anyVoices() { try { return (window.speechSynthesis.getVoices() || []).length > 0; } catch (e) { return false; } }

  function voiceMenu(anchor) {
    var all = rankedVoices().slice(0, 10),
      cur = pickVoice();
    var none = speechLang() !== "en" && anyVoices() ? // voices, but none in the page's language
      T("tools.voiceNoneHere", "This device has no voice in this language yet. More can be added in its speech settings.") :
      T("tools.voicesNotYet", "This browser hasn’t listed its voices yet. Try again in a moment.");
    var html = "<h3>" + T("tools.voice", "Voice") + "</h3>" + (all.length ?
        all.map(function(v) {
          var on = cur && v.voiceURI === cur.voiceURI;
          return '<button type="button" class="ht-row" data-voice="' + esc(v.voiceURI) + '" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(v.name.replace(/^Microsoft\s+/, "").replace(/\s+Online\s+\(Natural\)/, " (natural)")) + "</button>";
        }).join("") :
        '<div class="ht-empty">' + none + "</div>") +
      "<h3>" + T("tools.speed", "Speed") + "</h3><div style=\"display:flex;gap:4px;padding:0 4px\">" + SPEEDS.map(function(sp) {
        return '<button type="button" class="ht-btn" data-rate="' + sp[1] + '" aria-pressed="' + ((S.rate || 1) === sp[1]) + '">' + T(sp[2], sp[0]) + "</button>";
      }).join("") + "</div>" +
      '<div class="ht-empty ht-sm" style="white-space:normal">' + T("tools.voiceNote", "The voices come from this device. Microsoft Edge has the most natural ones; on a phone or tablet, more can be added in its speech settings.") + "</div>";
    var m = showMenu(anchor, html);
    [].forEach.call(m.querySelectorAll("[data-voice]"), function(b) {
      b.addEventListener("click", function() {
        S.voice = b.getAttribute("data-voice");
        save(KEY, S);
        try { window.speechSynthesis.cancel(); } catch (e) {}
        say(T("tools.voiceSample", "This is how the steps will sound."));
        voiceMenu(anchor);
      });
    });
    [].forEach.call(m.querySelectorAll("[data-rate]"), function(b) {
      b.addEventListener("click", function() {
        S.rate = Number(b.getAttribute("data-rate"));
        save(KEY, S);
        try { window.speechSynthesis.cancel(); } catch (e) {}
        say(T("tools.voiceSample", "This is how the steps will sound."));
        voiceMenu(anchor);
      });
    });
  }

  function headsLog(head) {
    for (var x = head.nextElementSibling; x && !x.classList.contains("panel-head"); x = x.nextElementSibling)
      if (x.classList.contains("log") || x.querySelector(".log")) return true;
    return false;
  }

  function addReadButton() {
    if (!("speechSynthesis" in window)) return;
    var heads = document.querySelectorAll(".panel-head h2");
    [].forEach.call(heads, function(h) {
      // the "Say it out loud" heading, in any language: the one with the explanation list (.log) after it
      if (!(/say it out loud/i.test(h.textContent) || headsLog(h.parentNode)) || h.parentNode.querySelector(".ht-read")) return;
      readBtn = document.createElement("button");
      readBtn.type = "button";
      readBtn.className = "ht-btn ht-read";
      readBtn.textContent = T("tools.readAloud", "Read aloud");
      readBtn.setAttribute("aria-pressed", "false");
      readBtn.title = T("tools.readTitle", "Read the explanation aloud (shortcut: R)");
      readBtn.addEventListener("click", readAloud);
      var vb = document.createElement("button");
      vb.type = "button";
      vb.className = "ht-btn ht-read ht-voice";
      vb.textContent = T("tools.voice", "Voice");
      vb.setAttribute("aria-haspopup", "dialog");
      vb.title = T("tools.voiceTitle", "Choose the reading voice and speed");
      vb.addEventListener("click", function(e) {
        e.stopPropagation();
        if (openMenu) closeMenu();
        else voiceMenu(vb);
      });
      h.parentNode.appendChild(readBtn);
      h.parentNode.appendChild(vb);
    });
    try {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", function() {});
    } catch (e) {} // start the list loading
    window.addEventListener("beforeunload", function() { try { window.speechSynthesis.cancel(); } catch (e) {} });
  }

  /* ===================== recent problems ===================== */
  var recentTimer = null;

  function labelFor(search) {
    var u = new URLSearchParams(search),
      q = u.get("q");
    if (q) return q;
    var bits = [];
    u.forEach(function(v, k) { if (["practice", "embed", "theme"].indexOf(k) < 0) bits.push(k === "mode" || k === "shape" ? v : k + " " + v); });
    return bits.join(" · ");
  }

  function remember() {
    var s = location.search.replace(/([?&])(practice|embed|theme)=[^&]*/g, "$1").replace(/[?&]+$/, "").replace(/\?&+/, "?");
    if (!s || s === "?") return;
    var all = load(RECENT, {}) || {},
      list = all[page] || [];
    list = list.filter(function(r) { return r.s !== s; });
    list.unshift({ s: s, l: labelFor(s).slice(0, 80), t: Date.now() });
    all[page] = list.slice(0, 10);
    save(RECENT, all);
  }

  function watchAddress() {
    // the pages keep their address up to date as you type; note the problem once you stop
    ["replaceState", "pushState"].forEach(function(name) {
      var orig = history[name];
      if (typeof orig !== "function") return;
      history[name] = function() {
        var r = orig.apply(this, arguments);
        clearTimeout(recentTimer);
        recentTimer = setTimeout(safe(remember), 1800);
        return r;
      };
    });
    recentTimer = setTimeout(safe(remember), 1800);
  }
  var openMenu = null;

  function closeMenu() {
    if (openMenu) {
      openMenu.remove();
      openMenu = null;
    }
  }

  function showMenu(anchor, html) {
    closeMenu();
    var m = document.createElement("div");
    m.className = "ht-menu";
    m.setAttribute("role", "dialog");
    m.innerHTML = html;
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    var left = Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - m.offsetWidth - 8);
    m.style.left = Math.max(8, left) + "px";
    m.style.top = (r.bottom + window.scrollY + 6) + "px";
    openMenu = m;
    var first = m.querySelector("a, button");
    if (first) first.focus();
    return m;
  }

  function recentMenu(anchor) {
    var list = ((load(RECENT, {}) || {})[page] || []);
    var html = "<h3>" + T("tools.recentHead", "Recent problems here") + "</h3>" + (list.length ?
      list.map(function(r) { return '<a href="' + esc(U(page, r.s)) + '">' + esc(r.l || r.s) + "</a>"; }).join("") +
      '<button type="button" class="ht-row ht-sm" data-clear="1">' + T("tools.recentClear", "Clear this list") + "</button>" :
      '<div class="ht-empty">' + T("tools.recentEmpty", "Nothing yet — problems you work on this page show up here.") + "</div>");
    var m = showMenu(anchor, html);
    var c = m.querySelector("[data-clear]");
    if (c) c.addEventListener("click", function() {
      var all = load(RECENT, {}) || {};
      delete all[page];
      save(RECENT, all);
      closeMenu();
      announce(T("tools.recentCleared", "Recent list cleared"));
    });
  }

  /* ===================== keyboard shortcuts ===================== */
  function keyRow(keys, key, en) { return "<tr><td>" + keys + "</td><td>" + T(key, en) + "</td></tr>"; }

  // the languages, each by its own name (assets/i18n.js): a choice here opens the page again in it
  function langRow() {
    var I = window.HelperI18n;
    if (!I || !I.langs || I.langs.length < 2 || !I.set) return "";
    return '<div class="ht-lang i18n-ui"><h3 style="margin-top:12px">' + T("lang.button", "Language") + '</h3><div style="display:flex;flex-wrap:wrap;gap:4px;padding:0 4px">' +
      I.langs.map(function(l) {
        var on = l.code === I.lang;
        return '<button type="button" class="ht-btn" data-lang="' + esc(l.code) + '" lang="' + esc(String(l.tag || l.code).split("-")[0]) + '" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(l.name) + "</button>";
      }).join("") + "</div></div>";
  }

  function helpMenu(anchor) {
    var m = showMenu(anchor || document.body, '<div class="ht-help"><h3>' + T("tools.keysHead", "Keyboard shortcuts") + "</h3><table>" +
      keyRow("<kbd>/</kbd>", "tools.keySlash", "Jump to the problem box") +
      keyRow("<kbd>N</kbd>", "tools.keyN", "A new problem (or the next one after a right answer)") +
      keyRow("<kbd>←</kbd> <kbd>→</kbd>", "tools.keyArrows", "Back and forward a step in One step at a time") +
      keyRow("<kbd>1</kbd>–<kbd>4</kbd>", "tools.keyChoice", "Pick a choice in Tutor me") +
      keyRow("<kbd>" + T("tools.kbdSpace", "Space") + "</kbd>", "tools.keySpace", "Play or pause in Play") +
      keyRow("<kbd>R</kbd>", "tools.keyR", "Read the explanation aloud") +
      keyRow("<kbd>D</kbd>", "tools.keyD", "Switch light and dark") +
      keyRow("<kbd>+</kbd> <kbd>−</kbd>", "tools.keyPlus", "Bigger or smaller text") +
      keyRow("<kbd>B</kbd>", "tools.keyB", "Big screen, for a projector") +
      keyRow("<kbd>Q</kbd>", "tools.keyQ", "A QR code for this page, to open it on a phone") +
      (document.getElementById("htEmbed") ? keyRow("<kbd>E</kbd>", "tools.keyE", "Put this problem on another website (embed it)") : "") +
      keyRow("<kbd>K</kbd>", "tools.keyK", "Show or hide the math keys (they come up by themselves on phones)") +
      keyRow("<kbd>Esc</kbd>", "tools.keyEsc", "Close this, or leave big screen") +
      keyRow("<kbd>?</kbd>", "tools.keyHelp", "Show this list") + "</table>" + langRow() +
      '<p class="ht-sm" style="margin:10px 8px 2px">Show The Steps ' + (SITE_VERSION === "dev" ? T("tools.versionDev", "(a copy that isn’t published yet)") : T("tools.version", "version {v}", { v: esc(SITE_VERSION) })) +
      ' · <a href="' + esc(window.HelperSite ? window.HelperSite.url("help.html") : "help.html") + '" style="display:inline;padding:0">' + T("tools.helpLink", "help") + "</a>" +
      ' · <a href="https://github.com/chrisdfennell/showthesteps/releases" target="_blank" rel="noopener" style="display:inline;padding:0">' + T("tools.whatsNew", "what’s new") + "</a>" +
      (document.querySelector(".page") ? ' · <a href="' + esc(reportHref()) + '" target="_blank" rel="noopener" style="display:inline;padding:0">' + T("tools.reportLink", "report a problem") + "</a>" : "") + "</p></div>");
    [].forEach.call(m.querySelectorAll(".ht-lang [data-lang]"), function(b) {
      b.addEventListener("click", function(e) {
        e.stopPropagation();
        var c = b.getAttribute("data-lang");
        if (c === window.HelperI18n.lang) closeMenu();
        else window.HelperI18n.set(c);
      });
    });
    if (!anchor && openMenu) {
      openMenu.style.position = "fixed";
      openMenu.style.top = "70px";
      openMenu.style.left = "50%";
      openMenu.style.transform = "translateX(-50%)";
    }
  }

  function problemBox() {
    var box = document.querySelector(".problem") || document.querySelector(".page");
    if (!box) return null;
    return [].filter.call(box.querySelectorAll('input[type="text"], input:not([type]), input[type="number"], textarea'), function(i) {
      return i.offsetParent !== null && !i.readOnly && !i.disabled;
    })[0] || null;
  }

  // the page's "New problem" button, in any language: the maker's (#genBtn), or one with that label
  function newProblemBtn() {
    var mine = T("common.newProblem", "New problem").toLowerCase();
    return [].filter.call(document.querySelectorAll("button"), function(b) {
      var t = b.textContent.trim();
      return /^New problem$/i.test(t) || t.toLowerCase() === mine || b.id === "genBtn";
    })[0] || null;
  }

  // the page has the practice buttons (One step at a time among them), in any language
  function hasStepMode() {
    var mine = T("common.oneStep", "One step at a time").toLowerCase();
    return [].some.call(document.querySelectorAll('[role="group"] button'), function(b) {
      var t = b.textContent.trim();
      return /^one step at a time$/i.test(t) || t.toLowerCase() === mine || (b.hasAttribute("aria-pressed") && (b.id === "stepBtn" || b.id === "pStep"));
    });
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target,
      tag = t && t.tagName;
    if (e.key === "Escape") {
      if (openMenu) { closeMenu(); return; }
      if (root.classList.contains("ht-big")) { setBig(false); return; }
      if (speaking) { stopReading(); return; }
      return;
    }
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
    var k = e.key;
    if (k === "/") {
      var box = problemBox();
      if (box) {
        e.preventDefault();
        box.focus();
        if (box.select) box.select();
      }
    } else if (k === "n" || k === "N") {
      var nb = document.querySelector(".ht-next:not([hidden])") || newProblemBtn();
      if (nb) {
        e.preventDefault();
        nb.click();
      }
    } else if (k === "r" || k === "R") {
      if (readBtn) {
        e.preventDefault();
        readAloud();
      }
    } else if (k === "d" || k === "D") {
      var tb = document.getElementById("themeBtn");
      if (tb) {
        e.preventDefault();
        tb.click();
      }
    } else if (k === "b" || k === "B") {
      e.preventDefault();
      setBig(!root.classList.contains("ht-big"));
    } else if (k === "q" || k === "Q") {
      e.preventDefault();
      closeMenu();
      showQR();
    } else if ((k === "e" || k === "E") && document.getElementById("htEmbed")) {
      e.preventDefault();
      closeMenu();
      showEmbed();
    } else if (k === "+" || k === "=") {
      e.preventDefault();
      setScale(1);
    } else if (k === "-" || k === "_") {
      e.preventDefault();
      setScale(-1);
    } else if (k === "k" || k === "K") {
      e.preventDefault();
      togglePad();
    } else if (k === "?") {
      e.preventDefault();
      if (openMenu) closeMenu();
      else helpMenu(document.getElementById("htKeys"));
    }
  }

  /* ===================== next problem after a right answer ===================== */
  function onChecked(e) {
    var d = e.detail || {};
    if (d.verdict !== "right" || embedded()) return;
    var maker = newProblemBtn();
    if (!maker) return;
    setTimeout(safe(function() {
      // put the button under the "✓ Correct!" message
      var msg = [].filter.call(document.querySelectorAll("[aria-live]"), function(x) {
        return x.offsetParent !== null && (/✓|correct/i.test(x.textContent) || x.textContent.indexOf(T("common.correct", "✓ Correct!")) >= 0);
      })[0];
      if (!msg) return;
      var old = document.querySelector(".ht-next");
      if (old) old.remove();
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ht-next";
      b.textContent = T("tools.next", "Next problem →");
      b.title = T("tools.nextTitle", "Another problem with the same settings (shortcut: N)");
      b.addEventListener("click", function() {
        b.remove();
        maker.click();
        setTimeout(function() { var box = answerBox(msg); if (box) box.focus(); }, 120);
      });
      msg.parentNode.insertBefore(b, msg.nextSibling);
    }), 60);
  }

  // the answer box beside the Check my answer verdict (not the first [aria-live] on the page: the camera's status line
  // and #statusLine come before it)
  function answerBox(live) {
    live = live || document.querySelector("[aria-live]:not(.ht-cam-status):not(#statusLine)");
    var box = live && (live.closest("form, section, .ckbox, .try, .check") || live.parentNode);
    if (!box) return null;
    return [].filter.call(box.querySelectorAll("input"), function(i) { return i.offsetParent !== null && !i.readOnly; })[0] || null;
  }

  /* ===================== the math keypad (phones and tablets) ===================== */
  // the symbols that are awkward to type on a phone, chosen for each page
  var PAD = {
    "addition.html": "+ − / . , space",
    "subtraction.html": "− + / . , space",
    "multiplication.html": "× / . , space",
    "division.html": "÷ / . : space",
    "fractions.html": "/ space . % , − ( )",
    "percents.html": "% $ . , /",
    "factors.html": ", × ^ ²",
    "integers.html": "− + × ÷ ( ) | ,",
    "ratios.html": ": / = ? x . $ ,",
    "pemdas.html": "+ − × ÷ ( ) ^ ² .",
    "algebra.html": "x y + − × ÷ ( ) = < > ^ / .",
    "lines.html": "x y ( ) , = + − / .",
    "geometry.html": ". / π √ , °",
    "stats.html": ", . − :",
    "wordproblems.html": ". $ / % ,",
    "scratch.html": "+ − × ÷ . , space",
    "flashcards.html": "/ . % − ,",
    "trigonometry.html": "° π √ / ( ) . − =",
    "calculus.html": "x ^ ( ) / √ π e − + =",
    "number-sense.html": ", . $ ¢ : < > =",
    "quadratics.html": "x ^ ² ( ) − + = / √ ±",
    "logarithms.html": "log ln ^ ( ) = / e − .",
    "sequences.html": ", ^ / − ( ) = Σ .",
    "functions.html": "x f( ) ^ √ / − + = , |",
    "radicals.html": "√ ∛ x ^ / ( ) − + =",
    "complex-numbers.html": "i ^ √ / ( ) − + ° π",
    "college-statistics.html": ", . = < > ± % ( )",
    "matrices-and-vectors.html": "[ ] , ; < > − / ( ) |",
    "unit-conversions.html": "/ . ° ′ ″ , ²",
    "money-math.html": "$ % . , / ( )",
    "counting.html": "! C( P( ( ) , × ÷ ^ n",
    "aviation.html": "° @ , . / : E W",
    "nursing.html": "/ . , : % mg mcg mL",
    "carpentry.html": "' \" / + − x ° % $ space",
    "electrical.html": "Ω k µ | + ( ) . % $",
    "cooking.html": "/ ½ ¼ ¾ $ % ° : ×",
    "pharmacy.html": "/ . , % $ : ° mg mL",
    "hvac-plumbing.html": "/ . ° % \" ' x R- Δ ,",
    "machining.html": "/ \" . x - ° ± + % #",
    "automotive.html": ": / . $ % rpm lb-ft mph space",
    "business.html": "$ % . , : x −",
    "real-estate.html": "$ % , . x / ( )"
  };
  var padEl = null,
    padFor = null,
    padHide = null;

  function padWanted() {
    if (S.keypad === true) return true;
    if (S.keypad === false) return false;
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }

  function padTarget(el) {
    if (!el || el.tagName !== "INPUT" || el.readOnly || el.disabled) return false;
    if (!/^(text|search|)$/i.test(el.getAttribute("type") || "")) return false;
    if (el.closest(".sitenav, .ht-search, .maker, .ht-menu")) return false; // not the search box or the maker's settings
    return !!el.closest(".page");
  }

  function insertAt(el, text) {
    var a = el.selectionStart,
      b = el.selectionEnd;
    if (typeof a !== "number") { a = b = el.value.length; }
    if (el.setRangeText) el.setRangeText(text, a, b, "end");
    else el.value = el.value.slice(0, a) + text + el.value.slice(b);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function padKey(k) {
    var el = padFor;
    if (!el) return;
    if (k === "done") {
      el.blur();
      hidePad();
      return;
    }
    if (k === "back") {
      var a = el.selectionStart,
        b = el.selectionEnd;
      if (a === b && a > 0) el.setSelectionRange(a - 1, a);
      insertAt(el, "");
      return;
    }
    if (k === "left" || k === "right") {
      var p = Math.max(0, Math.min(el.value.length, (el.selectionStart || 0) + (k === "left" ? -1 : 1)));
      el.setSelectionRange(p, p);
      return;
    }
    insertAt(el, k === "space" ? " " : k);
  }

  function placePad() {
    if (!padEl) return;
    var vv = window.visualViewport,
      bottom = 0;
    if (vv) bottom = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)); // sit just above the phone's keyboard
    padEl.style.bottom = bottom + "px";
  }

  function showPad(el) {
    if (!padWanted()) return;
    clearTimeout(padHide);
    padFor = el;
    if (!padEl) {
      padEl = document.createElement("div");
      padEl.className = "ht-pad";
      padEl.setAttribute("role", "toolbar");
      padEl.setAttribute("aria-label", T("tools.mathKeys", "Math keys"));
      document.body.appendChild(padEl);
      // keep the box focused (and the phone keyboard open) when a key is pressed
      // (not on a touch pointerdown: Safari then drops the tap's click, so the key does nothing; the mousedown below keeps the focus there)
      padEl.addEventListener("pointerdown", function(e) { if (e.pointerType === "mouse" && e.target.closest("button")) e.preventDefault(); });
      padEl.addEventListener("mousedown", function(e) { if (e.target.closest("button")) e.preventDefault(); });
      padEl.addEventListener("click", function(e) { var b = e.target.closest("button"); if (b) padKey(b.getAttribute("data-k")); });
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", placePad);
        window.visualViewport.addEventListener("scroll", placePad);
      }
    }
    var keys = (PAD[page] || "+ − × ÷ / ( ) . = ,").split(" ");
    var space = T("tools.padSpace", "space"),
      label = { space: space, "^": "xⁿ", "²": "x²" };
    padEl.innerHTML = keys.map(function(k) {
        return '<button type="button" data-k="' + esc(k) + '"' + (k === "space" ? ' class="wide"' : "") + ' aria-label="' + esc(k === "space" ? space : k) + '">' +
          esc(label[k] || k) + "</button>";
      }).join("") +
      '<button type="button" data-k="left" aria-label="' + esc(T("tools.padLeft", "Move left")) + '">←</button>' +
      '<button type="button" data-k="right" aria-label="' + esc(T("tools.padRight", "Move right")) + '">→</button>' +
      '<button type="button" data-k="back" aria-label="' + esc(T("tools.padDelete", "Delete")) + '">⌫</button>' +
      '<button type="button" data-k="done" class="done" aria-label="' + esc(T("tools.padDone", "Done")) + '">' + esc(T("tools.padDone", "Done")) + "</button>";
    padEl.hidden = false;
    root.classList.add("ht-padding");
    placePad();
  }

  function hidePad() {
    if (padEl) padEl.hidden = true;
    root.classList.remove("ht-padding");
    padFor = null;
  }

  function initPad() {
    document.addEventListener("focusin", safe(function(e) { if (padTarget(e.target)) showPad(e.target); }));
    document.addEventListener("focusout", safe(function(e) {
      if (e.target === padFor) {
        clearTimeout(padHide);
        padHide = setTimeout(function() { if (document.activeElement !== padFor) hidePad(); }, 150);
      }
    }));
  }

  function togglePad() {
    S.keypad = !padWanted();
    save(KEY, S);
    if (!S.keypad) hidePad();
    else { var a = document.activeElement; if (padTarget(a)) showPad(a); }
    announce(S.keypad ? T("tools.mathKeysOn", "Math keys on") : T("tools.mathKeysOff", "Math keys off"));
  }

  /* ===================== a QR code for this page ===================== */
  // qr.js sits next to this file; it's fetched the first time a QR code is wanted, not on every page load
  var qrWait = null;

  function qrSrc() {
    var src = SELF;
    if (!src) {
      var s = document.querySelector('script[src$="tools.js"], script[src*="tools.js?"]');
      src = s ? s.src : "tools.js";
    }
    return src.replace(/tools\.js([?#].*)?$/, "qr.js");
  }

  function withQR(done) {
    if (window.HelperQR) { done(); return; }
    if (qrWait) { qrWait.push(done); return; }
    qrWait = [done];
    var sc = document.createElement("script");
    sc.src = qrSrc();
    sc.async = true;
    sc.onload = function() {
      var w = qrWait || [];
      qrWait = null;
      if (window.HelperQR) w.forEach(function(f) { safe(f)(); });
      else announce(T("tools.qrFail", "Couldn’t load the QR code maker"));
    };
    sc.onerror = function() {
      qrWait = null;
      sc.remove();
      announce(T("tools.qrFailNet", "Couldn’t load the QR code maker. Check the connection and try again."));
    };
    document.head.appendChild(sc);
  }

  function showQR() {
    withQR(function() {
      var h1 = document.querySelector(".page h1") || document.querySelector("h1"),
        label = labelFor(location.search);
      window.HelperQR.show(location.href, {
        title: (h1 && h1.textContent.replace(/\s+/g, " ").trim()) || document.title,
        sub: label ? T("tools.qrThis", "This problem: {p}", { p: label.slice(0, 80) }) : T("tools.qrPage", "Open this page on a phone"),
        filename: (window.HelperSite ? window.HelperSite.path(page) : page).replace(/^.*\//, "").replace(/\.html$/, "") + "-qr.svg"
      });
    });
  }

  /* ===================== Embed on another website: embed.js, next to this file ===================== */
  // fetched the first time the Embed button is pressed, or straight away on a page opened with embed=site…
  var embedWait = null;

  function withEmbed(done) {
    if (window.HelperEmbed) { done(); return; }
    if (embedWait) { embedWait.push(done); return; }
    embedWait = [done];
    var sc = document.createElement("script");
    sc.src = qrSrc().replace(/qr\.js$/, "embed.js");
    sc.async = true;
    sc.onload = function() {
      var w = embedWait || [];
      embedWait = null;
      if (window.HelperEmbed) w.forEach(function(f) { safe(f)(); });
      else announce(T("tools.embedFail", "Couldn’t load the embed maker"));
    };
    sc.onerror = function() {
      embedWait = null;
      sc.remove();
      root.classList.remove("ht-site-wait");
      announce(T("tools.embedFailNet", "Couldn’t load the embed maker. Check the connection and try again."));
    };
    document.head.appendChild(sc);
  }

  function showEmbed() { withEmbed(function() { window.HelperEmbed.open({ label: labelFor(location.search) }); }); }

  function addEmbedButton() { // beside Copy link, on the helpers only
    var copy = document.getElementById("copyBtn"),
      path = window.HelperSite ? window.HelperSite.path(page) : location.pathname;
    if (!copy || !/(^|\/)helpers\//.test(path) || document.getElementById("htEmbed")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.id = "htEmbed";
    b.className = copy.className;
    b.textContent = T("tools.embed", "Embed");
    b.setAttribute("aria-haspopup", "dialog");
    b.title = T("tools.embedTitle", "Put this problem on your class website, Google Sites, Canvas or a blog (E)");
    b.addEventListener("click", safe(showEmbed));
    copy.parentNode.insertBefore(b, copy.nextSibling);
  }

  /* ===================== "Now try it by hand": the four written methods go on to the Scratch Paper ===================== */
  var BYHAND = { "addition.html": "add", "subtraction.html": "sub", "multiplication.html": "mul", "division.html": "div" };

  function byHandHref() {
    var op = BYHAND[page],
      u = new URLSearchParams(location.search),
      q = String(u.get("q") || "").replace(/\s+/g, "").replace(/,/g, "");
    if (!op || !q) return null;
    if (op !== "div" && /\//.test(q)) return null; // 2 3/4 + 1 5/6: fractions stay on the helper
    if (op === "div" && /[÷:]/.test(q) && /\//.test(q)) return null; // 3/4 ÷ 1/2
    var nums = q.split({ add: /\+/, sub: /[\-−]/, mul: /[×x*]/, div: /[÷:\/]/ } [op]),
      ints = nums.every(function(n) { return /^\d+$/.test(n); });
    if (!nums.every(function(n) { return /^\d*\.?\d+$/.test(n); })) return null; // fractions and negatives stay on the helper
    var digits = function(n) { return n.replace(".", "").replace(/^0+(?=\d)/, "").length; };
    if (op === "add" && (nums.length < 2 || nums.length > 4)) return null;
    if (op === "sub" && nums.length !== 2) return null;
    if (op === "mul" && (nums.length !== 2 || digits(nums[0]) > 4 || digits(nums[1]) > 3)) return null;
    if (op === "div" && (nums.length !== 2 || !ints || nums[0].length > 6 || nums[1].length > 3 || +nums[1] === 0)) return null;
    var sign = { add: "+", sub: "-", mul: "*", div: "/" } [op],
      ans = u.get("ans");
    return U("scratch.html", "op=" + op + "&q=" + encodeURIComponent(nums.join(sign)) + (op === "div" ? "&ans=" + (ans === "decimal" ? "decimal" : "remainder") : ""));
  }

  function byHand() {
    if (!BYHAND[page]) return;
    var band = document.querySelector(".answer"),
      href = byHandHref(),
      box = document.getElementById("htByHand");
    if (!band || !href) { if (box) box.remove(); return; }
    if (!box || box.previousElementSibling !== band) {
      if (box) box.remove();
      box = document.createElement("div");
      box.id = "htByHand";
      box.className = "ht-byhand";
      box.innerHTML = '<a href="#">' + T("tools.byHand", "✍ Now try it by hand →") + "</a><span>" + T("tools.byHandNote", "Work this same problem yourself on the Scratch Paper: carry, borrow and write each digit, checked square by square.") + "</span>";
      band.insertAdjacentElement("afterend", box);
    }
    box.querySelector("a").setAttribute("href", href);
  }

  function watchByHand() {
    if (!BYHAND[page]) return;
    ["replaceState", "pushState"].forEach(function(name) {
      var orig = history[name];
      if (typeof orig !== "function") return;
      history[name] = function() {
        var r = orig.apply(this, arguments);
        setTimeout(safe(byHand), 60);
        return r;
      };
    });
    setInterval(safe(byHand), 1200); // the page redraws its answer band; put the button back beside it
    setTimeout(safe(byHand), 300);
  }

  /* ===================== Tutor me: tutor.js, next to this file ===================== */
  function linkPractice() { // practice= as the page was opened (it may have rewritten its address since)
    var href = location.href;
    try { var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0]; if (nav && nav.name) href = nav.name; } catch (e) {}
    var m = /[?&]practice=([^&#]*)/.exec(href);
    return m ? m[1].toLowerCase() : null;
  }

  function loadTutor() {
    if (window.HelperTutor || page === "tests.html") return;
    var modes = hasStepMode();
    if (!modes || !document.querySelector(".log")) return;
    if (embedded() && linkPractice() !== "tutor") return; // practice sets and worksheets: only when the link asks
    var src = SELF;
    if (!src) {
      var s = document.querySelector('script[src$="tools.js"], script[src*="tools.js?"]');
      src = s ? s.src : "tools.js";
    }
    var sc = document.createElement("script");
    sc.src = src.replace(/tools\.js([?#].*)?$/, "tutor.js");
    sc.async = true;
    document.head.appendChild(sc);
  }

  /* ===================== Play: play.js, next to this file ===================== */
  // the steps one at a time by themselves, read aloud (practice=play); on the pages with step mode, never in an embed
  function loadPlay() {
    if (window.HelperPlay || page === "tests.html" || embedded()) return;
    var modes = hasStepMode();
    if (!modes || !document.querySelector(".log")) return;
    var src = SELF;
    if (!src) {
      var s = document.querySelector('script[src$="tools.js"], script[src*="tools.js?"]');
      src = s ? s.src : "tools.js";
    }
    var sc = document.createElement("script");
    sc.src = src.replace(/tools\.js([?#].*)?$/, "play.js");
    sc.async = true;
    document.head.appendChild(sc);
  }

  /* ===================== math names for screen readers: a11y.js, next to this file ===================== */
  // fractions, powers, roots and the answer band get an aria-label in the words above (spoken); everywhere, embeds
  // and frames too, but not on the self-test page itself
  function loadA11y() {
    if (window.HelperA11y || page === "tests.html" || !window.MutationObserver) return;
    var src = SELF;
    if (!src) {
      var s = document.querySelector('script[src$="tools.js"], script[src*="tools.js?"]');
      src = s ? s.src : "tools.js";
    }
    var sc = document.createElement("script");
    sc.src = src.replace(/tools\.js([?#].*)?$/, "a11y.js");
    sc.async = true;
    document.head.appendChild(sc);
  }

  /* ===================== the bar: search, recent, text size, big screen, shortcuts ===================== */
  function goSearch(text) {
    var r = window.HelperSearch && window.HelperSearch.route(text);
    var href = (r && !r.none && window.HelperSearch.href(r)) || U("glossary.html", "q=" + encodeURIComponent(text));
    location.href = href;
  }

  function addToBar(nav) {
    if (nav.querySelector(".ht-search")) return;
    var f = document.createElement("form");
    f.className = "ht-search";
    f.setAttribute("role", "search");
    f.innerHTML = '<input type="text" aria-label="' + esc(T("tools.searchLabel", "Type any problem, or a math word")) + '" placeholder="' + esc(T("tools.searchHint", "Type any problem…")) + '" spellcheck="false" autocomplete="off">';
    f.addEventListener("submit", function(e) { e.preventDefault(); var v = f.firstChild.value.trim(); if (v) goSearch(v); });
    var home = nav.querySelector(".sn-home");
    if (home && home.nextSibling) nav.insertBefore(f, home.nextSibling);
    else nav.appendChild(f);

    var bar = document.createElement("div");
    bar.className = "ht-bar";
    bar.innerHTML =
      '<button type="button" class="ht-btn" id="htRecent" aria-haspopup="dialog" title="' + esc(T("tools.recentTitle", "Problems you worked on this page")) + '">' + T("tools.recent", "Recent") + "</button>" +
      '<button type="button" class="ht-btn" id="htSmaller" aria-label="' + esc(T("tools.smaller", "Smaller text")) + '" title="' + esc(T("tools.smallerTitle", "Smaller text (−)")) + '">A−</button>' +
      '<button type="button" class="ht-btn" id="htBigger" aria-label="' + esc(T("tools.bigger", "Bigger text")) + '" title="' + esc(T("tools.biggerTitle", "Bigger text (+)")) + '">A+</button>' +
      '<button type="button" class="ht-btn" id="htBig" aria-pressed="false" title="' + esc(T("tools.bigTitle", "Big screen, for a projector (B)")) + '">' + T("tools.big", "Big screen") + "</button>" +
      '<button type="button" class="ht-btn" id="htQR" aria-haspopup="dialog" aria-label="' + esc(T("tools.qrLabel", "QR code for this page")) + '" title="' + esc(T("tools.qrTitle", "A QR code for this page, to open it on a phone (Q)")) + '">QR</button>' +
      '<button type="button" class="ht-btn" id="htKeys" aria-haspopup="dialog" aria-label="' + esc(T("tools.keysHead", "Keyboard shortcuts")) + '" title="' + esc(T("tools.keysTitle", "Keyboard shortcuts (?)")) + '">?</button>';
    nav.insertBefore(bar, f.nextSibling);
    document.getElementById("htRecent").addEventListener("click", function(e) {
      e.stopPropagation();
      if (openMenu) closeMenu();
      else recentMenu(this);
    });
    document.getElementById("htSmaller").addEventListener("click", function() { setScale(-1); });
    document.getElementById("htBigger").addEventListener("click", function() { setScale(1); });
    document.getElementById("htBig").addEventListener("click", function() { setBig(!root.classList.contains("ht-big")); });
    document.getElementById("htQR").addEventListener("click", safe(showQR));
    document.getElementById("htKeys").addEventListener("click", function(e) {
      e.stopPropagation();
      if (openMenu) closeMenu();
      else helpMenu(this);
    });
  }
  var live = null;

  function announce(t) {
    if (!live) {
      live = document.createElement("div");
      live.setAttribute("role", "status");
      live.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
      document.body.appendChild(live);
    }
    live.textContent = t;
  }

  /* ===================== Report a problem, and an anonymous count of "couldn't read" ===================== */
  // the button opens the repo's "wrong answer" form with the page and the exact problem link filled in; a page showing
  // its "couldn't read that" notice counts one GoatCounter event named after the page (never what was typed)
  var ISSUE_FORM = "https://github.com/chrisdfennell/showthesteps/issues/new";

  function visibleNotice() {
    return [].filter.call(document.querySelectorAll(".notice"), function(n) { return n.offsetParent !== null && n.textContent.trim(); })[0] || null;
  }

  function reportHref() {
    var h1 = document.querySelector("h1"),
      name = document.title;
    if (h1) {
      h1 = h1.cloneNode(true);
      [].forEach.call(h1.querySelectorAll("sup, sub"), function(x) { x.parentNode.removeChild(x); });
      name = h1.textContent;
    } // "The Area Box", not "The Area Box²"
    name = name.replace(/\s+/g, " ").trim();
    return ISSUE_FORM + "?template=wrong-answer.yml&title=" + encodeURIComponent("Wrong or confusing: " + name) +
      "&link=" + encodeURIComponent(location.href) + (visibleNotice() ? "&kind=" + encodeURIComponent("It wouldn't read my problem") : "");
  }

  function addReportButton() {
    var copy = document.getElementById("copyBtn");
    if (!copy || document.getElementById("htReport")) return;
    var a = document.createElement("a");
    a.id = "htReport";
    a.className = copy.className + " ht-report";
    a.target = "_blank";
    a.rel = "noopener";
    a.href = reportHref();
    a.textContent = T("tools.report", "Report a problem");
    a.title = T("tools.reportTitle", "Tell us about a wrong answer or a confusing step (opens a form on GitHub with this problem's link filled in)");
    a.addEventListener("click", function() { a.href = reportHref(); }); // the problem showing when it's pressed
    copy.parentNode.insertBefore(a, copy.nextSibling);
  }
  var countedNotices = {};

  /* "Send this problem": only when the visitor presses it, the problem they typed (and nothing else) is counted as a
     GoatCounter event "sent/<page>/<problem>", so the readers can be taught new wording. Email addresses are taken out
     and it's cut to 300 characters. */
  var sentProblems = {};

  function typedProblem() {
    var q = null;
    try { q = new URLSearchParams(location.search).get("q"); } catch (e) {}
    if (!q) {
      var box = [].filter.call(document.querySelectorAll(".page textarea, .page input[type=text], .page input:not([type])"), function(i) {
        return i.offsetParent !== null && !i.closest(".sitenav, .ht-search, .maker, .ht-menu") && i.value.trim();
      })[0];
      q = box ? box.value : "";
    }
    // email addresses and phone numbers written with separators (555-123-4567, (555) 123 4567) are taken out
    return String(q || "").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
      .replace(/(?:\+\d{1,3}[\s.-]?)?(?:\b\d{3}[.-]\d{3}[.-]\d{4}|\(\d{3}\)\s?\d{3}[\s.-]\d{4})\b/g, "[phone]")
      .replace(/\s+/g, " ").trim().slice(0, 300);
  }

  function offerSend(notice, gc) {
    var text = typedProblem();
    if (!text || notice.querySelector(".ht-sendbox")) return;
    var box = document.createElement("div");
    box.className = "ht-sendbox";
    if (sentProblems[page + "|" + text]) {
      box.textContent = T("tools.sent", "Sent. Thank you!");
      notice.appendChild(box);
      return;
    }
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ht-send";
    b.textContent = T("tools.send", "Send this problem so we can teach the page");
    var note = document.createElement("small");
    note.textContent = " " + T("tools.sendNote", "Only the problem you typed is sent, nothing else. Please leave out names or anything personal.");
    b.addEventListener("click", safe(function() {
      gc.count({ path: "sent/" + page.replace(/\.html$/, "") + "/" + text, title: "A problem a visitor sent", event: true });
      sentProblems[page + "|" + text] = true;
      box.textContent = T("tools.sentThanks", "Sent. Thank you! The page will learn to read problems like this one.");
    }));
    box.appendChild(b);
    box.appendChild(note);
    notice.appendChild(box);
  }

  function watchNotices() {
    var t = null;

    function check() {
      var gc = window.goatcounter,
        notice = visibleNotice();
      if (!notice || !gc || typeof gc.count !== "function") return;
      offerSend(notice, gc);
      var key = location.search || "-";
      if (countedNotices[key]) return;
      countedNotices[key] = true;
      gc.count({ path: "couldnt-read/" + page.replace(/\.html$/, ""), title: "Couldn't read a typed problem", event: true });
    }
    new MutationObserver(function() {
        clearTimeout(t);
        t = setTimeout(safe(check), 500);
      })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class", "style"] });
    setTimeout(safe(check), 1500);
  }

  /* ===================== Photo of the problem: photo.js, next to this file ===================== */
  // a camera button by the problem box on the helper pages and by the home page's search box: a photo, a picture or a
  // pasted screenshot is read on this device and typed into the box. photo.js adds the button, and downloads the reading
  // engine (Tesseract.js, from jsDelivr) only when a picture is first read. Not when framed or embedded.
  // This block starts itself, so main() has no line for it.
  (function() {
    var loadPhoto = safe(function() {
      if (window.HelperPhoto || passive || !window.Promise || !window.URL || !URL.createObjectURL) return;
      var path = window.HelperSite ? window.HelperSite.path(page) : location.pathname;
      if (!/(^|\/)helpers\//.test(path) && !document.getElementById("askIn")) return; // the helpers, and the home page
      var src = SELF;
      if (!src) {
        var s = document.querySelector('script[src$="tools.js"], script[src*="tools.js?"]');
        src = s ? s.src : "tools.js";
      }
      var sc = document.createElement("script");
      sc.src = src.replace(/tools\.js([?#].*)?$/, "photo.js");
      sc.async = true;
      document.head.appendChild(sc);
      // Say the problem: a microphone button beside the camera (voice.js), only where the browser can turn speech into
      // text (Chrome, Edge, Safari; not Firefox). voice.js waits for photo.js's button, and asks before the first use.
      if (!window.HelperVoice && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
        var vc = document.createElement("script");
        vc.src = src.replace(/tools\.js([?#].*)?$/, "voice.js");
        vc.charset = "utf-8";
        vc.async = true;
        document.head.appendChild(vc);
      }
    });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadPhoto);
    else loadPhoto();
  })();

  /* ===================== start ===================== */
  var main = safe(function() {
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    if (page !== "tests.html") initPad(); // the math keys also help inside practice sets on a phone
    loadTutor(); // framed too (the self-test); embedded, only when the link says practice=tutor
    loadPlay(); // framed too (the self-test); never embedded
    loadA11y(); // framed and embedded too
    document.addEventListener("helper:tutor", safe(onTutor));
    if (siteEmbed()) { // on someone else's website: embed.js hides the site bar, adds the link back, posts the height
      root.classList.add("ht-site-wait");
      setTimeout(function() { root.classList.remove("ht-site-wait"); }, 2500); // in case embed.js can't be fetched
      withEmbed(function() { window.HelperEmbed.site(); });
    }
    if (passive) return; // framed or embedded: nothing else to add, nothing to save
    applySettings();
    watchTheme();
    document.addEventListener("keydown", safe(onKey));
    document.addEventListener("click", function(e) { if (openMenu && !openMenu.contains(e.target)) closeMenu(); });
    document.addEventListener("helper:checked", safe(onChecked));
    if (!document.querySelector(".page")) return; // the home page: settings only
    addReadButton();
    addReportButton();
    addEmbedButton(); // between Copy link and Report a problem
    // ---- assignments: assets/assign.js adds the "Add to assignment" button beside Copy link on the helper pages ----
    if (!window.HelperAssign) {
      var asg = document.createElement("script");
      asg.src = U("assign.js");
      asg.async = true;
      document.head.appendChild(asg);
    }
    watchNotices();
    watchAddress();
    watchByHand();
    // Common Core line under the heading (assets/standards.js adds it, hides it in embeds and print)
    if (!window.HelperStandards) {
      var stdS = document.createElement("script");
      stdS.src = U("standards.js");
      stdS.async = true;
      document.head.appendChild(stdS);
    }
    // the bar is drawn by nav.js; wait for it briefly
    var tries = 0;
    (function waitBar() {
      var nav = document.querySelector(".sitenav");
      if (nav) addToBar(nav);
      else if (tries++ < 40) setTimeout(waitBar, 50);
    })();
  });

  window.HelperTools = { settings: function() { return S; }, setBig: setBig, setScale: setScale, showQR: showQR, showEmbed: showEmbed, words: words, togglePad: togglePad, voiceScore: voiceScore, spoken: spoken, speechLang: speechLang, speechWords: function() { return MATH.lex(); }, version: SITE_VERSION };
  // the bar, the buttons and the menus are built once the strings of the visitor's language are in (on a page that
  // doesn't load i18n.js in its <head>, nav.js fetches them just after this file runs); without i18n.js, in English
  var started = false;

  function begin() {
    if (started) return;
    started = true;
    main();
  }

  function start() {
    var I = window.HelperI18n;
    if (I && I.ready) {
      I.ready(begin);
      setTimeout(begin, 4000); // the strings never came: English
    } else begin();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
