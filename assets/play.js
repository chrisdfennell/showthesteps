/* Play: watch the steps like a short video (practice=play). tools.js loads this file.
   On every helper with step mode, "▶ Play" (after the other practice buttons) shows the worked steps one at a time
   by itself, reading each one aloud with the voice and speed picked for Read aloud (tools.js: Voice), the step
   being read outlined and scrolled into view. At the end it shows the answer, reads it, and stops. With no voice
   on the device, or the sound off, it moves on by a timer instead, longer for a longer step.
   The player: play/pause, back and forward a step, restart, speed (slower, normal, faster: the same setting as
   Read aloud's), sound on/off, and close. Keys while it's open: space plays or pauses, ← → go a step (the page's
   own step keys), Escape pauses. Pausing (or closing) leaves the page in ordinary One step at a time.

   How a helper works with this: no per-page code, the same parts Tutor me (tutor.js) uses: the practice buttons (a
   role="group" with "One step at a time" in it), step mode's #stepCount ("k of N", not inside [hidden]), #prevBtn and
   #nextBtn, and "Say it out loud" (.log > li, step k's items marked data-step="k−1"; items with no data-step, like
   "Set up", are read with the step after them), and the answer band (.answer: its .k labels and .v values).
   A page that warns about a practice= value it doesn't know must take "play" as step mode:
       if (pr === "tutor" || pr === "play") pr = "step";   // Tutor me and Play run on top of step mode
   A page that quietly ignores values it doesn't know needs nothing; this file switches it to step mode.

   practice=play in the link opens the player and starts it. Browsers only speak after a click or a key on the page,
   so when the sound is on and nothing has been pressed yet, a big "▶ Play" button comes first.
   Not in embeds (embed=1: practice sets and worksheets). Nothing is remembered inside another page.
   window.HelperPlay = { active(), playing(), start(), play(), pause(), toggle(), next(), prev(), restart(), close(),
     sound(on), state() }   (state: for tests)
   Everything is wrapped so a problem here can never break a helper page. */
(function() {
  "use strict";
  if (window.HelperPlay) return;

  var root = document.documentElement;
  var STORE = "helpers-play"; // { sound:false }: the sound was turned off in the player
  var KEY = "helpers-settings"; // tools.js's settings: the voice (voice) and the speed (rate)
  var SPEEDS = [
    ["Slower", 0.85],
    ["Normal", 1],
    ["Faster", 1.15]
  ]; // the same three as tools.js's Voice menu
  var framed = true;
  try { framed = window.top !== window.self; } catch (e) {}

  function embedded() { return /[?&]embed=1(&|$)/.test(location.search) || root.classList.contains("embed"); }
  var passive = framed || embedded(); // nothing is remembered inside another page
  function safe(fn) { return function() { try { return fn.apply(this, arguments); } catch (e) { if (window.console) console.warn("play.js:", e); } }; }

  function $(id) { return document.getElementById(id); }

  function HT() { return window.HelperTools || null; }
  var synth = null;
  try { synth = ("speechSynthesis" in window) && typeof window.SpeechSynthesisUtterance === "function" ? window.speechSynthesis : null; } catch (e) {}

  function loadPrefs() { try { var v = JSON.parse(localStorage.getItem(STORE) || "null"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }

  function savePrefs() {
    if (passive) return;
    try { localStorage.setItem(STORE, JSON.stringify({ sound: P.sound })); } catch (e) {}
  }
  // practice= as the page was opened (the page may already have rewritten its address)
  function linkPractice() {
    var href = location.href;
    try { var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0]; if (nav && nav.name) href = nav.name; } catch (e) {}
    var m = /[?&]practice=([^&#]*)/.exec(href);
    if (!m) return null;
    try { return decodeURIComponent(m[1]).trim().toLowerCase(); } catch (e) { return m[1].toLowerCase(); }
  }

  function reduced() { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } }

  /* ===================== styles ===================== */
  var CSS =
    ":root{--hp-acc:#1F5E8C;--hp-on:#FFFFFF}" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){--hp-acc:#7DB8E8;--hp-on:#0D1B26}}" +
    ":root[data-theme=\"dark\"]{--hp-acc:#7DB8E8;--hp-on:#0D1B26}" +
    ".ht-play{position:sticky;top:8px;z-index:30;background:var(--surface);color:var(--ink);border:1px solid var(--rule);" +
    "border-left:5px solid var(--hp-acc);border-radius:12px;padding:8px 10px 12px;box-shadow:0 12px 26px -20px rgba(0,0,0,.6);min-width:0;" +
    "font-family:var(--f-body,\"IBM Plex Sans\",\"Segoe UI\",Arial,sans-serif);overflow:hidden}" +
    ".ht-play[hidden],.ht-play [hidden]{display:none !important}" +
    ".hp-row{display:flex;align-items:center;gap:6px 6px;flex-wrap:wrap;min-width:0}" +
    ".hp-ctl{display:flex;align-items:center;gap:6px;min-width:0}" +
    ".hp-b{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:40px;height:40px;padding:0 9px;margin:0;" +
    "font:inherit;font-size:14px;font-weight:600;line-height:1;color:var(--ink);background:var(--surface-2,var(--surface));" +
    "border:1px solid var(--rule);border-radius:10px;cursor:pointer;touch-action:manipulation}" +
    ".hp-b:hover:not([disabled]){border-color:var(--ink-3)}" +
    ".hp-b:focus-visible,.hp-big:focus-visible{outline:3px solid var(--focus,var(--hp-acc));outline-offset:2px}" +
    ".hp-b[disabled]{opacity:.45;cursor:default}" +
    ".hp-b svg,.hp-big svg{width:20px;height:20px;flex:none;fill:currentColor}" +
    ".hp-main{min-width:92px;color:var(--hp-on);background:var(--hp-acc);border-color:var(--hp-acc)}" +
    ".hp-main:hover:not([disabled]){filter:brightness(1.08);border-color:var(--hp-acc)}" +
    ".hp-n{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-size:13px;color:var(--ink-2);white-space:nowrap;padding:0 4px}" +
    ".hp-x{margin-left:auto}" +
    ".hp-brk{display:none}" +
    ".hp-opts{display:flex;align-items:center;gap:6px 10px;flex-wrap:wrap;min-width:0}" +
    ".hp-speed{display:inline-flex;gap:0;border:1px solid var(--rule);border-radius:10px;overflow:hidden}" +
    ".hp-speed button{height:36px;padding:0 11px;margin:0;font:inherit;font-size:13px;font-weight:600;color:var(--ink-2);" +
    "background:var(--surface);border:0;border-left:1px solid var(--rule);cursor:pointer;touch-action:manipulation}" +
    ".hp-speed button:first-child{border-left:0}" +
    ".hp-speed button[aria-pressed=\"true\"]{color:var(--hp-on);background:var(--hp-acc)}" +
    ".hp-speed button:focus-visible{outline:3px solid var(--focus,var(--hp-acc));outline-offset:-3px}" +
    ".hp-snd{height:36px;font-size:13px}" +
    ".hp-snd[aria-pressed=\"false\"]{color:var(--ink-3)}" +
    ".hp-note{font-size:12.5px;color:var(--ink-3);line-height:1.35}" +
    ".hp-bar{position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--rule)}" +
    ".hp-bar i{display:block;height:100%;width:0;background:var(--hp-acc);transition:width .4s ease}" +
    "@media (prefers-reduced-motion: reduce){.hp-bar i{transition:none}}" +
    ".hp-gate{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;padding:6px 2px 2px}" +
    ".hp-big{display:inline-flex;align-items:center;gap:10px;min-height:56px;padding:0 26px 0 20px;margin:0;font:inherit;font-size:21px;" +
    "font-weight:700;color:var(--hp-on);background:var(--hp-acc);border:0;border-radius:14px;cursor:pointer;" +
    "box-shadow:0 10px 22px -12px rgba(0,0,0,.55);touch-action:manipulation}" +
    ".hp-big svg{width:28px;height:28px}" +
    ".hp-big:hover{filter:brightness(1.08)}" +
    ".hp-gate p{margin:0;font-size:15px;color:var(--ink-2);flex:1 1 200px;min-width:0}" +
    ".hp-sr{position:absolute !important;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}" +
    // the step being read, and the answer at the end
    ".log > li.hp-now{outline:3px solid var(--hp-acc);outline-offset:3px;border-radius:6px}" +
    ".answer.hp-now{outline:3px solid var(--hp-acc);outline-offset:3px}" +
    // a phone: the buttons that move it on the first line, speed, sound and "Step 3 of 5" on the second
    "@media (max-width:520px){.ht-play{top:4px;padding:7px 8px 11px}.hp-b{padding:0 7px}.hp-main{min-width:84px}.hp-speed button{padding:0 8px}" +
    ".hp-opts{display:contents}.hp-ctl{order:1}.hp-x{order:2}.hp-brk{display:block;order:3;flex-basis:100%;height:0}.hp-speed{order:4}" +
    ".hp-snd{order:5;min-width:36px}.hp-st,.hp-sw{display:none}.hp-n{order:6;padding:0 2px}.hp-note{order:7;flex-basis:100%}" +
    ".hp-big{font-size:19px;padding:0 20px 0 16px}.hp-gate .hp-x{order:2}.hp-gate p{order:3;flex-basis:100%}}" +
    "@media print{.ht-play,#playBtn{display:none !important}.log > li.hp-now,.answer.hp-now{outline:none !important}}";

  var ICON = {
    play: "M8 5v14l11-7z",
    pause: "M6 5h4v14H6zM14 5h4v14h-4z",
    prev: "M6 6h2v12H6zM9.5 12l8.5 6V6z",
    next: "M16 6h2v12h-2zM6 18l8.5-6L6 6z",
    restart: "M12 5V2L7 6.5 12 11V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z",
    sound: "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z",
    mute: "M3 9v6h4l5 5V4L7 9H3zm13.6 3L14 9.4 15.4 8l2.6 2.6L20.6 8 22 9.4 19.4 12l2.6 2.6-1.4 1.4-2.6-2.6-2.6 2.6-1.4-1.4z",
    close: "M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z"
  };

  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + ICON[name] + '"/></svg>'; }

  /* ===================== the page's step mode ===================== */
  var btn = null, // ▶ Play, with the practice buttons
    bar = null, // the player
    selfClick = false;

  // the practice buttons: the group with "One step at a time" in it (aria-label "Practice mode" on most pages)
  function group() {
    var g = document.querySelector('[role="group"][aria-label="Practice mode"]');
    if (g) return g;
    return [].filter.call(document.querySelectorAll('[role="group"]'), function(x) {
      return [].some.call(x.querySelectorAll("button"), function(b) { return /^one step at a time$/i.test(b.textContent.trim()); });
    })[0] || null;
  }

  function stepBtn() {
    var g = group();
    var b = g ? [].filter.call(g.querySelectorAll("button"), function(x) { return /^one step at a time$/i.test(x.textContent.trim()); })[0] : null;
    return b || $("stepBtn") || $("pStep");
  }

  function counter() {
    var el = $("stepCount");
    if (!el || el.closest("[hidden]")) return null;
    var m = /(\d+)\s*of\s*(\d+)/.exec(el.textContent || "");
    return m ? { cur: Number(m[1]), n: Number(m[2]) } : null;
  }

  function clickQuiet(b) {
    if (!b) return;
    selfClick = true;
    try { b.click(); } finally { selfClick = false; }
  }

  function tutorOn() { return !!(window.HelperTutor && window.HelperTutor.active && window.HelperTutor.active()); }

  function shown(el) { return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden"; }

  // "Say it out loud" for step k (1 = the first): its own items, and items with no step (like "Set up") before them
  function stepLis(k, n) {
    var log = document.querySelector(".log");
    if (!log) return [];
    var kids = [].slice.call(log.children),
      own = [],
      next = null,
      last = null;
    for (var i = kids.length - 1; i >= 0; i--) {
      var ds = kids[i].getAttribute("data-step");
      if (ds !== null && /^\d+$/.test(ds)) {
        own[i] = Number(ds) + 1;
        next = own[i];
        if (last === null) last = own[i];
      } else own[i] = next; // read with the step after it
    }
    return kids.filter(function(li, j) {
      var o = own[j] === null ? (last === null ? 1 : Math.max(last, n || 0)) : own[j]; // after the last step: with the last one
      return o === k && getComputedStyle(li).display !== "none";
    });
  }

  function words(t) { var w = HT() && HT().words; return w ? w(t) : String(t).replace(/\s+/g, " ").trim(); }

  function spokenOf(el) {
    var sp = HT() && HT().spoken;
    if (sp) return sp(el);
    var c = el.cloneNode(true);
    [].forEach.call(c.querySelectorAll("svg, .sr-only, button"), function(x) { x.parentNode.removeChild(x); });
    return words(c.textContent);
  }

  function sentences(text) {
    // a sentence at a time, the way tools.js reads: Chrome stops some voices part-way through a long one
    return String(text || "").replace(/([.!?:;])\s+(?=\S)/g, "$1\u0001").split("\u0001").filter(function(x) { return /\w/.test(x); });
  }

  function rate() { var S = HT() && HT().settings ? HT().settings() : null; var r = S && Number(S.rate); return r > 0.3 && r < 3 ? r : 1; }

  // how long a part stays up with no voice: about the time it takes to say it
  function estimate(text) {
    var n = String(text || "").split(/\s+/).filter(Boolean).length;
    return Math.round(Math.max(1400, 650 + 330 * n) / rate());
  }

  function partsOf(text) {
    var ss = sentences(text);
    if (!ss.length) return [{ text: "", ms: Math.round(1800 / rate()) }]; // a step with nothing to read: a moment to look at it
    return ss.map(function(s) { return { text: s, ms: estimate(s) }; });
  }

  function stepParts(k, n) { return partsOf(stepLis(k, n).map(spokenOf).join(" ")); }

  function laidOut(el) { return !!el && el.getClientRects().length > 0; } // not display:none (a frame may be hidden as a whole)

  function answerBand() { var a = document.querySelector(".answer"); return laidOut(a) ? a : null; }

  function answerParts() {
    var band = answerBand();
    if (!band) return [];
    var vs = [].filter.call(band.querySelectorAll(".v"), laidOut),
      out = [];
    vs.forEach(function(v) {
      var k = v.previousElementSibling && v.previousElementSibling.classList.contains("k") ? v.previousElementSibling : null;
      if (!k && v.parentNode !== band) k = v.parentNode.querySelector(".k");
      if (!k && vs.length === 1) k = band.querySelector(".k");
      var c = v.cloneNode(true); // "40 cm²", not "40cm²"
      [].forEach.call(c.querySelectorAll("span, b, i, sub"), function(x) { if (!x.closest(".fr, .frac, .fraction") || x.matches(".fr, .frac, .fraction")) x.insertAdjacentText("beforebegin", " "); });
      var val = spokenOf(c).replace(/(\d)\s*:\s*(?=\d)/g, "$1 to ").replace(/\s+/g, " ").trim(), // a ratio, 2:3: "2 to 3"
        lab = k ? spokenOf(k).replace(/[.:\s]+$/, "") : "";
      if (!val) return;
      out.push((!lab || /^answer$/i.test(lab) ? "The answer" : lab) + ": " + val + ".");
    });
    return out.map(function(t) { return { text: t, ms: estimate(t) }; }); // "Sum: 29.15." in one breath
  }

  function sigOf(n) {
    var log = document.querySelector(".log");
    return n + "|" + (log ? [].map.call(log.querySelectorAll("li[data-step]"), function(li) { return li.textContent.replace(/\s+/g, " "); }).join("|") : "");
  }

  /* ===================== state ===================== */
  var P = {
    open: false,
    playing: false,
    gate: false,
    cur: 0,
    n: 0,
    phase: "step", // "step": reading step cur; "answer": reading the answer; "done": the end
    parts: null,
    at: 0, // the step parts are for
    k: 0, // the part being read
    sig: "",
    sound: loadPrefs().sound !== false,
    moveUntil: 0
  };
  var tok = 0, // a newer run (or a pause) ends the one before
    timer = null,
    noVoice = !synth,
    silentFails = 0,
    unlocked = false;

  function useSpeech() { return P.sound && !!synth && !noVoice; }

  function stopAll() {
    tok++;
    clearTimeout(timer);
    timer = null;
    stopSpeech();
  }

  /* ===================== speech ===================== */
  var current = null, // the utterance being spoken: { over:true } ends it quietly
    lastUtter = null; // kept, or Chrome can drop it before onend fires
  function pickVoice() {
    var all = [];
    try { all = synth.getVoices() || []; } catch (e) {}
    var score = HT() && HT().voiceScore;
    if (!score || !all.length) return null;
    var ranked = all.map(function(v) { return { v: v, s: score(v) }; }).filter(function(x) { return x.s > 0; })
      .sort(function(a, b) { return b.s - a.s || (a.v.name < b.v.name ? -1 : 1); }).map(function(x) { return x.v; });
    var S = HT().settings ? HT().settings() : null;
    for (var i = 0; S && S.voice && i < ranked.length; i++)
      if (ranked[i].voiceURI === S.voice) return ranked[i];
    return ranked[0] || null;
  }

  function stopSpeech() {
    if (current) current.over = true;
    current = null;
    if (synth) try { synth.cancel(); } catch (e) {}
  }
  // say one sentence; done(how): "end", "not-allowed" (no click on the page yet), "interrupted" (someone else stopped
  // it), "silent" (it never started), or another error
  function speak(text, done) {
    var me = { over: false },
      started = false,
      w1 = null,
      w2 = null;

    function end(how) {
      if (me.over) return;
      me.over = true;
      clearTimeout(w1);
      clearTimeout(w2);
      if (current === me) current = null;
      done(how);
    }
    current = me;
    var u = lastUtter = new SpeechSynthesisUtterance(text),
      v = pickVoice();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else if (root.lang) u.lang = root.lang;
    u.rate = rate();
    u.pitch = 1;
    u.onstart = function() {
      started = true;
      silentFails = 0;
      clearTimeout(w1);
    };
    u.onend = function() { end("end"); };
    u.onerror = function(e) { end((e && e.error) || "error"); };
    try {
      if (synth.paused) synth.resume();
      synth.speak(u);
    } catch (e) { end("error"); return; }
    w1 = setTimeout(function() { if (!started) end("silent"); }, 4000);
    w2 = setTimeout(function() { end("end"); }, estimate(text) * 3 + 6000); // a voice that never says it's finished
  }
  // iPhone and iPad Safari only speak after the first sentence was asked for inside a tap: ask for a silent one
  function unlock() {
    if (unlocked || !synth || !P.sound) return;
    unlocked = true;
    try {
      var u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      synth.speak(u);
    } catch (e) {}
  }

  function needsTap() {
    var ua = navigator.userActivation;
    return !!(ua && !ua.hasBeenActive);
  }

  // Read aloud (tools.js) and Play don't talk over each other
  function stopReadAloud() {
    var rb = document.querySelector('.ht-read:not(.ht-voice)[aria-pressed="true"]');
    if (rb) rb.click();
  }

  /* ===================== playing ===================== */
  function run() {
    if (!P.playing) return;
    var my = tok;
    if (!P.parts || P.k >= P.parts.length) {
      if (P.phase === "answer") { finish(); return; }
      timer = setTimeout(safe(function() { if (my === tok) advance(); }), Math.round(650 / rate()));
      return;
    }
    var part = P.parts[P.k];
    if (P.k) paint(); // the progress line moves on a sentence at a time
    if (useSpeech() && part.text) {
      speak(part.text, safe(function(how) {
        if (my !== tok || !P.playing) return;
        if (how === "end") {
          P.k++;
          run();
        } else if (how === "not-allowed") {
          pause(true);
          showGate();
        } else if (how === "interrupted" || how === "canceled") pause(); // Read aloud, or the Voice menu, took over
        else {
          // no voice after all: this sentence on the timer, and after two in a row, every one
          if (how !== "silent" || ++silentFails >= 2) noVoice = true;
          stopSpeech();
          timer = setTimeout(safe(function() {
            if (my === tok) {
              P.k++;
              run();
            }
          }), part.ms);
          paint();
        }
      }));
    } else {
      timer = setTimeout(safe(function() {
        if (my !== tok) return;
        P.k++;
        run();
      }), part.ms);
    }
  }

  function beginStep(k) {
    var c = counter();
    P.phase = "step";
    P.cur = k;
    P.at = k;
    P.n = c ? c.n : P.n;
    P.parts = stepParts(k, P.n);
    P.k = 0;
    markStep(k);
    scrollToNow();
    paint();
    if (!useSpeech()) say("Step " + k + " of " + P.n);
    run();
  }

  function advance() {
    var c = counter();
    if (!c) { close(); return; }
    if (c.cur < c.n) {
      var my = tok;
      goTo(c.cur + 1, function(ok) {
        if (my !== tok || !P.playing) return;
        if (ok) beginStep(P.cur);
        else pause();
      });
    } else answerPhase();
  }

  function answerPhase() {
    var c = counter();
    P.phase = "answer";
    P.cur = c ? c.n : P.cur;
    P.at = P.cur;
    P.parts = answerParts();
    P.k = 0;
    markAnswer();
    scrollToNow();
    paint();
    if (!P.parts.length || !P.playing) finish();
    else run();
  }

  function finish() {
    stopAll();
    P.playing = false;
    P.phase = "done";
    if (markAnswer()) scrollToNow();
    paint();
    say("That’s the end. The answer is shown.");
  }

  // move the page to step `target` with its own buttons; cb(true) once it's there
  function goTo(target, cb) {
    var c = counter();
    if (!c) { cb(false); return; }
    P.cur = target;
    P.moveUntil = Date.now() + 1500;
    var guard = 0;
    while (c && c.cur !== target && guard++ < 80) {
      var b = c.cur < target ? $("nextBtn") : $("prevBtn");
      if (!b || b.disabled) break;
      b.click();
      var c2 = counter();
      if (c2 && c2.cur === c.cur) break; // the page redraws later: wait for it below
      c = c2;
    }
    var t0 = Date.now();
    (function wait() {
      var c3 = counter();
      if (c3 && c3.cur === target) {
        P.moveUntil = 0;
        cb(true);
      } else if (Date.now() - t0 > 1200) {
        P.moveUntil = 0;
        if (c3) P.cur = c3.cur;
        cb(false);
      } else setTimeout(safe(wait), 40);
    })();
  }

  // back to step 1 of One step at a time
  function toStart() {
    clickQuiet(stepBtn());
    var c = counter(),
      guard = 0;
    while (c && c.cur > 1 && guard++ < 80) {
      var pb = $("prevBtn");
      if (!pb || pb.disabled) break;
      pb.click();
      var c2 = counter();
      if (c2 && c2.cur === c.cur) break;
      c = c2;
    }
    return counter();
  }

  // step mode, if the page isn't in it; cb(counter) once it shows "k of N"
  function stepMode(cb) {
    var c = counter();
    if (c && c.n) { cb(c); return; }
    clickQuiet(stepBtn());
    var t0 = Date.now();
    (function wait() {
      var c2 = counter();
      if (c2 && c2.n) cb(c2);
      else if (Date.now() - t0 > 1500) cb(null);
      else setTimeout(safe(wait), 50);
    })();
  }

  function play() {
    if (!btn) return;
    if (!P.open) openBar();
    stopReadAloud();
    if (tutorOn()) window.HelperTutor.stop();
    unlock();
    stepMode(function(c) {
      if (!c) {
        say("Nothing to play yet: type a problem first.");
        paint();
        return;
      }
      if (!P.open) openBar();
      hideGate();
      stopAll();
      P.sig = sigOf(c.n);
      P.n = c.n;
      if (P.phase === "done") {
        c = toStart() || c;
        P.parts = null;
      }
      P.playing = true;
      if (P.parts && P.at === c.cur && P.cur === c.cur && P.k < P.parts.length) { // carry on where it was paused
        markNow();
        scrollToNow();
        paint();
        run();
      } else beginStep(c.cur);
    });
  }

  function pause(quiet) {
    if (!P.playing) return;
    P.playing = false;
    stopAll();
    paint();
    if (!quiet) say("Paused at step " + P.cur + " of " + P.n);
  }

  function toggle() {
    if (P.playing) pause();
    else play();
  }

  function next() {
    var c = counter();
    if (!c || !P.open) return;
    var was = P.playing;
    if (c.cur < c.n) {
      stopAll();
      var my = tok;
      goTo(c.cur + 1, function(ok) {
        if (my !== tok) return;
        P.parts = null;
        P.phase = "step";
        if (was && P.playing) beginStep(P.cur);
        else {
          markStep(P.cur);
          scrollToNow();
          paint();
        }
      });
    } else if (P.phase === "step") {
      stopAll();
      if (was) answerPhase();
      else finish();
    } else if (P.phase === "answer") finish(); // skip the rest of the answer
  }

  function prev() {
    var c = counter();
    if (!c || !P.open) return;
    var was = P.playing;
    stopAll();
    if (P.phase !== "step" && c.cur === c.n) { // from the answer back to the last step
      P.parts = null;
      if (was) beginStep(c.cur);
      else {
        P.phase = "step";
        markStep(c.cur);
        scrollToNow();
        paint();
      }
      return;
    }
    if (c.cur <= 1) {
      if (was) beginStep(1);
      return;
    }
    var my = tok;
    goTo(c.cur - 1, function(ok) {
      if (my !== tok) return;
      P.parts = null;
      P.phase = "step";
      if (was && P.playing) beginStep(P.cur);
      else {
        markStep(P.cur);
        scrollToNow();
        paint();
      }
    });
  }

  function restart() {
    if (!P.open) openBar();
    stopAll();
    hideGate();
    stopReadAloud();
    unlock();
    stepMode(function(c) {
      if (!c) return;
      c = toStart() || c;
      P.sig = sigOf(c.n);
      P.playing = true;
      beginStep(c.cur);
    });
  }

  function setSound(on) {
    P.sound = !!on;
    savePrefs();
    if (P.sound) {
      noVoice = !synth;
      silentFails = 0;
      unlock();
    }
    if (P.playing) {
      stopAll();
      run();
    } // the same sentence again, now with (or without) the voice
    paint();
    say(P.sound ? (synth ? "Sound on" : "This browser can’t read aloud") : "Sound off");
  }

  function setRate(r) {
    var S = HT() && HT().settings ? HT().settings() : null;
    if (!S) return;
    S.rate = r;
    if (!passive) try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    if (P.playing) {
      stopAll();
      P.parts && P.parts.forEach(function(p) { p.ms = p.text ? estimate(p.text) : Math.round(1800 / rate()); });
      run();
    }
    paint();
    var name = SPEEDS.filter(function(s) { return s[1] === r; })[0];
    say("Speed: " + (name ? name[0] : r).toString().toLowerCase());
  }

  /* ===================== the step being read ===================== */
  var marked = null; // { step:k } or { answer:true }
  function mark(els) {
    [].forEach.call(document.querySelectorAll(".hp-now"), function(x) { if (els.indexOf(x) < 0) x.classList.remove("hp-now"); });
    els.forEach(function(x) { x.classList.add("hp-now"); });
  }

  function markStep(k) {
    marked = { step: k };
    mark(stepLis(k, P.n));
  }

  function markAnswer() {
    marked = { answer: true };
    var band = answerBand();
    mark(band ? [band] : []);
    return !!band;
  }

  function markNow() {
    if (!marked) return;
    if (marked.step) {
      var lis = stepLis(marked.step, P.n);
      if (lis.some(function(li) { return !li.classList.contains("hp-now"); }) || document.querySelectorAll(".hp-now").length !== lis.length) mark(lis);
    } else {
      var band = answerBand();
      if (band && !band.classList.contains("hp-now")) mark([band]);
    }
  }

  function unmark() {
    marked = null;
    mark([]);
  }

  // the step's lines in "Say it out loud", and its part of the work too when both fit on the screen (not under the player)
  function scrollToNow() {
    var now = [].slice.call(document.querySelectorAll(".hp-now")).filter(shown);
    if (!now.length) return;
    var work = [];
    if (P.phase === "step") work = [].slice.call(document.querySelectorAll('.board [data-step="' + (P.cur - 1) + '"]:not(li), #board [data-step="' + (P.cur - 1) + '"]:not(li)')).filter(shown);

    function box(els) {
      var t = Infinity,
        b = -Infinity;
      els.forEach(function(e) {
        var r = e.getBoundingClientRect();
        if (r.height <= 0 && r.width <= 0) return;
        t = Math.min(t, r.top);
        b = Math.max(b, r.bottom);
      });
      return t === Infinity ? null : { top: t, bottom: b };
    }
    var vh = window.innerHeight || document.documentElement.clientHeight || 800;
    var top = 10;
    if (bar && !bar.hidden) {
      var br = bar.getBoundingClientRect();
      if (br.top <= 12 && br.bottom > 0) top = br.bottom + 10; // stuck at the top of the screen
    }
    var bottom = vh - 12;
    var pad = $("htPad") || document.querySelector(".ht-pad:not([hidden])");
    if (pad && shown(pad)) bottom = Math.min(bottom, pad.getBoundingClientRect().top - 8);
    var want = box(now.concat(work)),
      own = box(now);
    if (!own) return;
    if (!want || want.bottom - want.top > bottom - top) want = own;
    var dy = 0;
    if (want.top < top) dy = want.top - top;
    else if (want.bottom > bottom) dy = Math.min(want.bottom - bottom, want.top - top);
    if (Math.abs(dy) < 2) return;
    // to a place, not by an amount: a smooth scroll still going (from the step before) would otherwise end short
    var y = Math.max(0, (window.pageYOffset || document.documentElement.scrollTop || 0) + dy);
    try { window.scrollTo({ top: y, left: window.pageXOffset || 0, behavior: reduced() ? "auto" : "smooth" }); } catch (e) { window.scrollTo(0, y); }
  }

  /* ===================== the player ===================== */
  function ensureBar() {
    if (bar && bar.isConnected) return bar;
    var board = $("board") || document.querySelector(".board");
    if (!board || !board.parentNode) return null;
    bar = document.createElement("section");
    bar.className = "ht-play";
    bar.id = "htPlay";
    bar.setAttribute("aria-label", "Play the steps");
    bar.hidden = true;
    bar.innerHTML =
      '<div class="hp-gate" hidden><button type="button" class="hp-big" data-act="go">' + svg("play") + "Play</button>" +
      "<p>Watch the steps one at a time, read aloud. Press Play to start.</p>" +
      '<button type="button" class="hp-b hp-x" data-act="close" aria-label="Close the player" title="Not now (the page stays in One step at a time)">' + svg("close") + "</button></div>" +
      '<div class="hp-row" data-part="main">' +
      '<div class="hp-ctl">' +
      '<button type="button" class="hp-b" data-act="restart" aria-label="Restart from step 1" title="Restart from step 1">' + svg("restart") + "</button>" +
      '<button type="button" class="hp-b" data-act="prev" aria-label="Previous step" title="Previous step (←)">' + svg("prev") + "</button>" +
      '<button type="button" class="hp-b hp-main" data-act="toggle" title="Play or pause (space)"><span class="hp-ico"></span><span class="hp-lab"></span></button>' +
      '<button type="button" class="hp-b" data-act="next" aria-label="Next step" title="Next step (→)">' + svg("next") + "</button>" +
      "</div>" +
      '<span class="hp-n"></span>' +
      '<span class="hp-brk"></span>' +
      '<div class="hp-opts">' +
      '<div class="hp-speed" role="group" aria-label="Speed">' + SPEEDS.map(function(s) { return '<button type="button" data-rate="' + s[1] + '" aria-pressed="false">' + s[0] + "</button>"; }).join("") + "</div>" +
      '<button type="button" class="hp-b hp-snd" data-act="sound" aria-label="Sound" aria-pressed="true" title="Read the steps aloud, or play them silently"><span class="hp-ico"></span><span class="hp-st">Sound</span></button>' +
      '<span class="hp-note" hidden></span>' +
      "</div>" +
      '<button type="button" class="hp-b hp-x" data-act="close" aria-label="Close the player" title="Close the player (the page stays in One step at a time)">' + svg("close") + "</button>" +
      "</div>" +
      '<div class="hp-bar" aria-hidden="true"><i></i></div>' +
      '<div class="hp-sr" role="status" aria-live="polite"></div>';
    bar.addEventListener("click", safe(onBarClick));
    board.parentNode.insertBefore(bar, board);
    return bar;
  }

  function openBar() {
    if (!ensureBar()) return false;
    P.open = true;
    bar.hidden = false;
    var c = counter();
    if (c) {
      P.n = c.n;
      P.cur = c.cur;
      P.sig = sigOf(c.n);
    }
    paint();
    return true;
  }

  function close() {
    var had = P.open && bar && bar.contains(document.activeElement);
    pause(true);
    P.gate = false;
    P.open = false;
    P.phase = "step";
    P.parts = null;
    unmark();
    if (bar) bar.hidden = true;
    paint();
    if (had && btn) btn.focus();
  }

  function showGate() {
    if (!openBar()) return;
    P.gate = true;
    paint();
    var g = bar.querySelector(".hp-big");
    if (g) {
      try { g.focus({ preventScroll: true }); } catch (e) { g.focus(); }
      var r = bar.getBoundingClientRect();
      if (r.top < 0 || r.bottom > (window.innerHeight || 800)) bar.scrollIntoView({ block: "nearest" });
    }
  }

  function hideGate() {
    if (!P.gate) return;
    P.gate = false;
    var had = bar && bar.contains(document.activeElement);
    paint();
    if (had) { var m = bar.querySelector(".hp-main"); if (m) m.focus(); }
  }

  function paint() {
    if (btn && btn.getAttribute("aria-pressed") !== String(P.open)) btn.setAttribute("aria-pressed", String(P.open)); // only a change: the page is watched for these
    if (!bar) return;
    var c = counter(),
      n = c ? c.n : P.n,
      cur = c ? c.cur : P.cur;
    bar.querySelector(".hp-gate").hidden = !P.gate;
    bar.querySelector('[data-part="main"]').hidden = P.gate;
    var main = bar.querySelector(".hp-main"),
      lab = P.playing ? "Pause" : P.phase === "done" ? "Again" : "Play";
    main.querySelector(".hp-ico").innerHTML = svg(P.playing ? "pause" : P.phase === "done" ? "restart" : "play");
    main.querySelector(".hp-lab").textContent = lab;
    main.setAttribute("aria-label", P.playing ? "Pause" : P.phase === "done" ? "Play again from step 1" : "Play");
    bar.querySelector('[data-act="prev"]').disabled = !c || (cur <= 1 && P.phase === "step");
    bar.querySelector('[data-act="next"]').disabled = !c || (cur >= n && P.phase === "done");
    bar.querySelector(".hp-n").innerHTML = !n ? "" : P.phase === "step" ? '<span class="hp-sw">Step </span>' + cur + " of " + n : "Answer";
    var done = !n ? 0 : P.phase !== "step" ? 1 : (cur - 1 + (P.parts && P.at === cur ? Math.min(1, P.k / Math.max(1, P.parts.length)) : 0)) / n;
    bar.querySelector(".hp-bar i").style.width = Math.round(done * 1000) / 10 + "%";
    var r = rate();
    [].forEach.call(bar.querySelectorAll("[data-rate]"), function(b) { b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-rate")) === r)); });
    var snd = bar.querySelector(".hp-snd");
    snd.hidden = !synth;
    snd.setAttribute("aria-pressed", String(P.sound));
    snd.querySelector(".hp-ico").innerHTML = svg(P.sound ? "sound" : "mute");
    var note = bar.querySelector(".hp-note");
    note.textContent = !synth ? "This browser can’t read aloud: the steps move on by themselves." :
      P.sound && noVoice ? "No voice to read with here: the steps move on by themselves." : "";
    note.hidden = !note.textContent;
  }

  var sayTimer = null;

  // the player's news for screen readers: playing, paused, the end (a step's words are read by the voice, not here)
  function say(t) {
    if (!bar) return;
    var live = bar.querySelector(".hp-sr");
    if (!live) return;
    clearTimeout(sayTimer);
    live.textContent = "";
    sayTimer = setTimeout(function() { live.textContent = t; }, 60);
  }

  function onBarClick(e) {
    var r = e.target.closest("[data-rate]");
    if (r) { setRate(Number(r.getAttribute("data-rate"))); return; }
    var a = e.target.closest("[data-act]");
    if (!a || a.disabled) return;
    var act = a.getAttribute("data-act");
    if (act === "go") play();
    else if (act === "toggle") toggle();
    else if (act === "prev") prev();
    else if (act === "next") next();
    else if (act === "restart") restart();
    else if (act === "sound") setSound(!P.sound);
    else if (act === "close") close();
  }

  /* ===================== keeping up with the page ===================== */
  var checkTimer = null;

  function later() {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(safe(check), 40);
  }

  function check() {
    if (!P.open) return;
    var c = counter();
    if (!c || !c.n) { if (!P.gate) close(); return; } // left step mode (Show all work, Check my answer, a problem it couldn't read)
    var sig = sigOf(c.n);
    if (sig !== P.sig) { // a new problem: stop, and wait at its first step
      P.sig = sig;
      pause();
      P.n = c.n;
      P.cur = c.cur;
      P.phase = "step";
      P.parts = null;
      markStep(c.cur);
      paint();
      return;
    }
    if (c.cur !== P.cur && P.moveUntil < Date.now()) { // moved with the page's own buttons or ← →
      P.n = c.n;
      P.parts = null;
      if (P.playing) {
        stopAll();
        beginStep(c.cur);
      } else {
        P.cur = c.cur;
        P.phase = "step";
        markStep(c.cur);
        paint();
      }
      return;
    }
    markNow(); // the page may have drawn the list again
    paint();
  }

  function onKey(e) {
    if (!P.open || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target,
      tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
    var k = e.key;
    if (k === " " || k === "Spacebar") {
      // a focused button or link takes the space itself
      if (t && t.closest && t.closest('button, a[href], summary, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], [role="option"]')) return;
      e.preventDefault();
      if (P.gate) play();
      else toggle();
    } else if ((k === "r" || k === "R") && P.playing) pause(true); // Read aloud reads instead
    else if (k === "Escape" && P.playing && !document.querySelector(".ht-menu")) pause();
  }

  /* ===================== start ===================== */
  var main = safe(function() {
    if (embedded()) return; // practice sets and worksheets: no Play
    var g = group(),
      sb = stepBtn();
    if (!g || !sb || !$("nextBtn") || !$("prevBtn") || !$("stepCount") || !document.querySelector(".log")) return;
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "playBtn";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "▶︎ Play";
    btn.title = "Watch the steps one at a time, read aloud (space: play or pause)";
    g.appendChild(btn);
    // after the other practice buttons, Tutor me too (tutor.js may add it after this)
    new MutationObserver(function() { if (btn.parentNode === g && g.lastElementChild !== btn) g.appendChild(btn); }).observe(g, { childList: true });
    btn.addEventListener("click", safe(function() {
      if (P.open && !P.gate) toggle();
      else play();
      var m = bar && !bar.hidden && bar.querySelector(".hp-main");
      if (m && !P.gate) m.focus();
    }));
    // another practice button (Show all work, One step at a time, Check my answer, Tutor me) closes the player
    g.addEventListener("click", safe(function(e) {
      var b = e.target.closest("button");
      if (b && b !== btn && !selfClick && P.open) close();
    }), true);
    document.addEventListener("helper:tutor", safe(function() { if (P.open && tutorOn()) close(); }));
    document.addEventListener("keydown", safe(onKey), true);
    // Read aloud pressed while playing: it reads, Play waits
    document.addEventListener("click", safe(function(e) { if (P.playing && e.target.closest && e.target.closest(".ht-read:not(.ht-voice)")) pause(true); }), true);
    document.addEventListener("visibilitychange", safe(function() { if (document.hidden && P.playing) pause(); }));
    window.addEventListener("pagehide", function() { if (P.playing) stopSpeech(); });
    new MutationObserver(function(recs) {
      if (!P.open) return;
      for (var i = 0; i < recs.length; i++)
        if (!bar || !bar.contains(recs[i].target)) { later(); return; }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden", "aria-pressed", "disabled"] });
    // the page's own address: where it writes practice=step, write practice=play while the player is open
    var orig = history.replaceState;
    if (typeof orig === "function") history.replaceState = function(st2, t, url) {
      if (P.open && typeof url === "string") url = url.replace(/([?&])practice=step(?=&|#|$)/, "$1practice=play");
      return orig.call(this, st2, t, url);
    };
    if (synth) try { synth.getVoices(); } catch (e) {} // start the list loading
    if (linkPractice() === "play") {
      setTimeout(safe(function() {
        if (tutorOn()) window.HelperTutor.stop();
        stepMode(function(c) {
          if (!c) return;
          openBar();
          if (useSpeech() && needsTap()) showGate();
          else play();
        });
      }), 150);
    }
  });

  window.HelperPlay = {
    active: function() { return P.open; },
    playing: function() { return P.playing; },
    start: function() { play(); },
    play: function() { play(); },
    pause: function() { pause(); },
    toggle: function() { toggle(); },
    next: function() { next(); },
    prev: function() { prev(); },
    restart: function() { restart(); },
    close: function() { close(); },
    sound: function(on) { if (typeof on === "boolean") setSound(on); return P.sound; },
    // for the self-test: where it is
    state: function() {
      var c = counter();
      return {
        open: P.open,
        playing: P.playing,
        gate: P.gate,
        phase: P.phase,
        cur: c ? c.cur : 0,
        n: c ? c.n : 0,
        step: P.cur,
        part: P.k,
        parts: P.parts ? P.parts.map(function(p) { return p.text; }) : [],
        speech: useSpeech(),
        rate: rate(),
        marked: [].map.call(document.querySelectorAll(".hp-now"), function(x) { return x.tagName === "LI" ? "li:" + x.getAttribute("data-step") : "answer"; })
      };
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
  else main();
})();
