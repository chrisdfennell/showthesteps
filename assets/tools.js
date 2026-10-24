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
  var S = load(KEY, {});
  if (typeof S !== "object" || !S) S = {};

  /* ===================== styles ===================== */
  var CSS =
    "a.ht-report{text-decoration:none;display:inline-flex;align-items:center;color:inherit}" +
    "@media print{a.ht-report{display:none !important}}" +
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
    if (themeBtn) themeBtn.textContent = isDark() ? "Light mode" : "Dark mode";
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
    announce("Text size " + Math.round(S.scale * 100) + "%");
  }

  /* ===================== big-screen mode ===================== */
  var exitBtn = null;

  function setBig(on) {
    root.classList.toggle("ht-big", on);
    if (on && !exitBtn) {
      exitBtn = document.createElement("button");
      exitBtn.type = "button";
      exitBtn.className = "ht-exit";
      exitBtn.textContent = "Exit big screen ✕";
      exitBtn.addEventListener("click", function() { setBig(false); });
      document.body.appendChild(exitBtn);
    }
    if (exitBtn) exitBtn.hidden = !on;
    var b = document.getElementById("htBig");
    if (b) b.setAttribute("aria-pressed", String(on));
    applySettings();
    announce(on ? "Big screen on. Press Escape to leave." : "Big screen off");
  }

  /* ===================== read aloud ===================== */
  var speaking = false,
    readBtn = null,
    tutorReading = false;

  function spoken(el) {
    var c = el.cloneNode(true);
    [].forEach.call(c.querySelectorAll("svg, .sr-only, button"), function(x) { x.remove(); });
    // a pause after the step label ("Set up"), each tag ("Ignore points") and each line, so they aren't run together
    [].forEach.call(c.querySelectorAll(".n, .sn, .tag, .line, .aside, .note"), function(x) { x.appendChild(document.createTextNode(". ")); });
    [].forEach.call(c.querySelectorAll(".fr, .frac, .fraction"), function(fr) {
      var nu = fr.querySelector(".nu, .num, .top"),
        de = fr.querySelector(".de, .den, .bot, .bottom");
      if (!nu || !de) {
        var k = fr.children;
        if (k.length === 2) {
          nu = k[0];
          de = k[1];
        }
      }
      if (nu && de) fr.textContent = " " + nu.textContent.trim() + " over " + de.textContent.trim() + " ";
    });
    [].forEach.call(c.querySelectorAll("sup"), function(s) {
      var t = s.textContent.trim();
      s.textContent = t === "2" ? " squared " : t === "3" ? " cubed " : " to the power " + t + " ";
    });
    return words(c.textContent).replace(/\s+\./g, ".").replace(/([.!?:;])(?:\s*\.)+/g, "$1").replace(/^\.\s*/, ""); // no ". ." where a line already ended
  }
  // math symbols said the way a teacher would say them
  function words(t) {
    return String(t)
      .replace(/(^|[\s(=,:])[−-](?=\d)/g, "$1negative ")
      .replace(/[−–]/g, " minus ").replace(/\+/g, " plus ").replace(/×/g, " times ").replace(/÷/g, " divided by ")
      .replace(/≤/g, " is less than or equal to ").replace(/≥/g, " is greater than or equal to ")
      .replace(/</g, " is less than ").replace(/>/g, " is greater than ").replace(/≈/g, " about ")
      .replace(/=/g, " equals ").replace(/%/g, " percent").replace(/√/g, " the square root of ")
      .replace(/π/g, " pi ").replace(/²/g, " squared").replace(/³/g, " cubed").replace(/°/g, " degrees")
      .replace(/(\d)\s*\/\s*(\d)/g, "$1 over $2").replace(/\s*…/g, " and so on").replace(/\s*[→⇒]\s*/g, ", so ")
      .replace(/\s+/g, " ").trim();
  }

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
      readBtn.textContent = "Read aloud";
      readBtn.setAttribute("aria-pressed", "false");
    }
  }
  /* the voice: the most natural one this device has (Edge's "Natural" voices, Google's, Apple's Enhanced and Siri
     voices) rather than the browser's default, unless one was picked in the Voice menu (S.voice, S.rate) */
  var NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|princess|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)\b/i;

  function voiceScore(v) {
    var n = v.name || "",
      l = String(v.lang || "").toLowerCase().replace("_", "-"),
      want = String(root.lang || "en").toLowerCase().split("-")[0];
    if (l.indexOf(want) !== 0) return -1; // another language
    if (NOVELTY.test(n)) return 0; // the joke voices on a Mac
    var s = 10;
    if (/natural|neural/i.test(n)) s += 100; // Edge on Windows: the closest to a real person
    if (/siri/i.test(n)) s += 75;
    if (/premium|enhanced/i.test(n)) s += 70; // Apple's downloaded voices
    if (/^google/i.test(n)) s += 60; // Chrome's own voices
    if (/\b(samantha|ava|allison|zoe|susan|serena|daniel|karen|moira|tessa|evan|nathan|noelle|joelle)\b/i.test(n)) s += 25;
    if (/desktop|espeak|mbrola|pico/i.test(n)) s -= 30; // the old robotic ones
    if (l === "en-us") s += 6;
    else if (l === "en-gb") s += 4;
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
      }
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
        readBtn.textContent = "Stop reading";
        readBtn.setAttribute("aria-pressed", "true");
      }
      readTutor();
      return;
    }
    var items = logItems();
    if (!items.length) { announce("Nothing to read yet"); return; }
    try { window.speechSynthesis.cancel(); } catch (e) {}
    speaking = true;
    readBtn.textContent = "Stop reading";
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
    ["Slower", 0.85],
    ["Normal", 1],
    ["Faster", 1.15]
  ];

  function voiceMenu(anchor) {
    var all = rankedVoices().slice(0, 10),
      cur = pickVoice();
    var html = "<h3>Voice</h3>" + (all.length ?
        all.map(function(v) {
          var on = cur && v.voiceURI === cur.voiceURI;
          return '<button type="button" class="ht-row" data-voice="' + esc(v.voiceURI) + '" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(v.name.replace(/^Microsoft\s+/, "").replace(/\s+Online\s+\(Natural\)/, " (natural)")) + "</button>";
        }).join("") :
        '<div class="ht-empty">This browser hasn’t listed its voices yet. Try again in a moment.</div>') +
      "<h3>Speed</h3><div style=\"display:flex;gap:4px;padding:0 4px\">" + SPEEDS.map(function(sp) {
        return '<button type="button" class="ht-btn" data-rate="' + sp[1] + '" aria-pressed="' + ((S.rate || 1) === sp[1]) + '">' + sp[0] + "</button>";
      }).join("") + "</div>" +
      '<div class="ht-empty ht-sm" style="white-space:normal">The voices come from this device. Microsoft Edge has the most natural ones; on a phone or tablet, more can be added in its speech settings.</div>';
    var m = showMenu(anchor, html);
    [].forEach.call(m.querySelectorAll("[data-voice]"), function(b) {
      b.addEventListener("click", function() {
        S.voice = b.getAttribute("data-voice");
        save(KEY, S);
        try { window.speechSynthesis.cancel(); } catch (e) {}
        say("This is how the steps will sound.");
        voiceMenu(anchor);
      });
    });
    [].forEach.call(m.querySelectorAll("[data-rate]"), function(b) {
      b.addEventListener("click", function() {
        S.rate = Number(b.getAttribute("data-rate"));
        save(KEY, S);
        try { window.speechSynthesis.cancel(); } catch (e) {}
        say("This is how the steps will sound.");
        voiceMenu(anchor);
      });
    });
  }

  function addReadButton() {
    if (!("speechSynthesis" in window)) return;
    var heads = document.querySelectorAll(".panel-head h2");
    [].forEach.call(heads, function(h) {
      if (!/say it out loud/i.test(h.textContent) || h.parentNode.querySelector(".ht-read")) return;
      readBtn = document.createElement("button");
      readBtn.type = "button";
      readBtn.className = "ht-btn ht-read";
      readBtn.textContent = "Read aloud";
      readBtn.setAttribute("aria-pressed", "false");
      readBtn.title = "Read the explanation aloud (shortcut: R)";
      readBtn.addEventListener("click", readAloud);
      var vb = document.createElement("button");
      vb.type = "button";
      vb.className = "ht-btn ht-read ht-voice";
      vb.textContent = "Voice";
      vb.setAttribute("aria-haspopup", "dialog");
      vb.title = "Choose the reading voice and speed";
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
    var html = "<h3>Recent problems here</h3>" + (list.length ?
      list.map(function(r) { return '<a href="' + esc(U(page, r.s)) + '">' + esc(r.l || r.s) + "</a>"; }).join("") +
      '<button type="button" class="ht-row ht-sm" data-clear="1">Clear this list</button>' :
      '<div class="ht-empty">Nothing yet — problems you work on this page show up here.</div>');
    var m = showMenu(anchor, html);
    var c = m.querySelector("[data-clear]");
    if (c) c.addEventListener("click", function() {
      var all = load(RECENT, {}) || {};
      delete all[page];
      save(RECENT, all);
      closeMenu();
      announce("Recent list cleared");
    });
  }

  /* ===================== keyboard shortcuts ===================== */
  function helpMenu(anchor) {
    showMenu(anchor || document.body, '<div class="ht-help"><h3>Keyboard shortcuts</h3><table>' +
      "<tr><td><kbd>/</kbd></td><td>Jump to the problem box</td></tr>" +
      "<tr><td><kbd>N</kbd></td><td>A new problem (or the next one after a right answer)</td></tr>" +
      "<tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Back and forward a step in One step at a time</td></tr>" +
      "<tr><td><kbd>1</kbd>–<kbd>4</kbd></td><td>Pick a choice in Tutor me</td></tr>" +
      "<tr><td><kbd>Space</kbd></td><td>Play or pause in Play</td></tr>" +
      "<tr><td><kbd>R</kbd></td><td>Read the explanation aloud</td></tr>" +
      "<tr><td><kbd>D</kbd></td><td>Switch light and dark</td></tr>" +
      "<tr><td><kbd>+</kbd> <kbd>−</kbd></td><td>Bigger or smaller text</td></tr>" +
      "<tr><td><kbd>B</kbd></td><td>Big screen, for a projector</td></tr>" +
      "<tr><td><kbd>Q</kbd></td><td>A QR code for this page, to open it on a phone</td></tr>" +
      (document.getElementById("htEmbed") ? "<tr><td><kbd>E</kbd></td><td>Put this problem on another website (embed it)</td></tr>" : "") +
      "<tr><td><kbd>K</kbd></td><td>Show or hide the math keys (they come up by themselves on phones)</td></tr>" +
      "<tr><td><kbd>Esc</kbd></td><td>Close this, or leave big screen</td></tr>" +
      "<tr><td><kbd>?</kbd></td><td>Show this list</td></tr></table>" +
      '<p class="ht-sm" style="margin:10px 8px 2px">Show The Steps ' + (SITE_VERSION === "dev" ? "(a copy that isn’t published yet)" : "version " + esc(SITE_VERSION)) + ' · <a href="' + esc(window.HelperSite ? window.HelperSite.url("help.html") : "help.html") + '" style="display:inline;padding:0">help</a> · <a href="https://github.com/chrisdfennell/showthesteps/releases" target="_blank" rel="noopener" style="display:inline;padding:0">what’s new</a>' +
      (document.querySelector(".page") ? ' · <a href="' + esc(reportHref()) + '" target="_blank" rel="noopener" style="display:inline;padding:0">report a problem</a>' : "") + "</p></div>");
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

  function buttonByText(re) {
    return [].filter.call(document.querySelectorAll("button"), function(b) { return re.test(b.textContent.trim()); })[0] || null;
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
      var nb = document.querySelector(".ht-next:not([hidden])") || buttonByText(/^New problem$/i);
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
    var maker = buttonByText(/^New problem$/i);
    if (!maker) return;
    setTimeout(safe(function() {
      // put the button under the "✓ Correct!" message
      var msg = [].filter.call(document.querySelectorAll("[aria-live]"), function(x) {
        return x.offsetParent !== null && /✓|correct/i.test(x.textContent);
      })[0];
      if (!msg) return;
      var old = document.querySelector(".ht-next");
      if (old) old.remove();
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ht-next";
      b.textContent = "Next problem →";
      b.title = "Another problem with the same settings (shortcut: N)";
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
    "cooking.html": "/ ½ ¼ ¾ $ % ° : ×"
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
      padEl.setAttribute("aria-label", "Math keys");
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
    var label = { space: "space", "^": "xⁿ", "²": "x²" };
    padEl.innerHTML = keys.map(function(k) {
        return '<button type="button" data-k="' + esc(k) + '"' + (k === "space" ? ' class="wide"' : "") + ' aria-label="' + esc(k) + '">' +
          esc(label[k] || k) + "</button>";
      }).join("") +
      '<button type="button" data-k="left" aria-label="Move left">←</button>' +
      '<button type="button" data-k="right" aria-label="Move right">→</button>' +
      '<button type="button" data-k="back" aria-label="Delete">⌫</button>' +
      '<button type="button" data-k="done" class="done" aria-label="Done">Done</button>';
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
    announce(S.keypad ? "Math keys on" : "Math keys off");
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
      else announce("Couldn’t load the QR code maker");
    };
    sc.onerror = function() {
      qrWait = null;
      sc.remove();
      announce("Couldn’t load the QR code maker. Check the connection and try again.");
    };
    document.head.appendChild(sc);
  }

  function showQR() {
    withQR(function() {
      var h1 = document.querySelector(".page h1") || document.querySelector("h1"),
        label = labelFor(location.search);
      window.HelperQR.show(location.href, {
        title: (h1 && h1.textContent.replace(/\s+/g, " ").trim()) || document.title,
        sub: label ? "This problem: " + label.slice(0, 80) : "Open this page on a phone",
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
      else announce("Couldn’t load the embed maker");
    };
    sc.onerror = function() {
      embedWait = null;
      sc.remove();
      root.classList.remove("ht-site-wait");
      announce("Couldn’t load the embed maker. Check the connection and try again.");
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
    b.textContent = "Embed";
    b.setAttribute("aria-haspopup", "dialog");
    b.title = "Put this problem on your class website, Google Sites, Canvas or a blog (E)";
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
      box.innerHTML = '<a href="#">✍ Now try it by hand →</a><span>Work this same problem yourself on the Scratch Paper: carry, borrow and write each digit, checked square by square.</span>';
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
    var modes = [].some.call(document.querySelectorAll('[role="group"] button'), function(b) { return /^one step at a time$/i.test(b.textContent.trim()); });
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
    var modes = [].some.call(document.querySelectorAll('[role="group"] button'), function(b) { return /^one step at a time$/i.test(b.textContent.trim()); });
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
    f.innerHTML = '<input type="text" aria-label="Type any problem, or a math word" placeholder="Type any problem…" spellcheck="false" autocomplete="off">';
    f.addEventListener("submit", function(e) { e.preventDefault(); var v = f.firstChild.value.trim(); if (v) goSearch(v); });
    var home = nav.querySelector(".sn-home");
    if (home && home.nextSibling) nav.insertBefore(f, home.nextSibling);
    else nav.appendChild(f);

    var bar = document.createElement("div");
    bar.className = "ht-bar";
    bar.innerHTML =
      '<button type="button" class="ht-btn" id="htRecent" aria-haspopup="dialog" title="Problems you worked on this page">Recent</button>' +
      '<button type="button" class="ht-btn" id="htSmaller" aria-label="Smaller text" title="Smaller text (−)">A−</button>' +
      '<button type="button" class="ht-btn" id="htBigger" aria-label="Bigger text" title="Bigger text (+)">A+</button>' +
      '<button type="button" class="ht-btn" id="htBig" aria-pressed="false" title="Big screen, for a projector (B)">Big screen</button>' +
      '<button type="button" class="ht-btn" id="htQR" aria-haspopup="dialog" aria-label="QR code for this page" title="A QR code for this page, to open it on a phone (Q)">QR</button>' +
      '<button type="button" class="ht-btn" id="htKeys" aria-haspopup="dialog" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">?</button>';
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
    a.textContent = "Report a problem";
    a.title = "Tell us about a wrong answer or a confusing step (opens a form on GitHub with this problem's link filled in)";
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
      box.textContent = "Sent. Thank you!";
      notice.appendChild(box);
      return;
    }
    var b = document.createElement("button");
    b.type = "button";
    b.className = "ht-send";
    b.textContent = "Send this problem so we can teach the page";
    var note = document.createElement("small");
    note.textContent = " Only the problem you typed is sent, nothing else. Please leave out names or anything personal.";
    b.addEventListener("click", safe(function() {
      gc.count({ path: "sent/" + page.replace(/\.html$/, "") + "/" + text, title: "A problem a visitor sent", event: true });
      sentProblems[page + "|" + text] = true;
      box.textContent = "Sent. Thank you! The page will learn to read problems like this one.";
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

  window.HelperTools = { settings: function() { return S; }, setBig: setBig, setScale: setScale, showQR: showQR, showEmbed: showEmbed, words: words, togglePad: togglePad, voiceScore: voiceScore, spoken: spoken, version: SITE_VERSION };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
})();
