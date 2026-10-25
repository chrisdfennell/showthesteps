/* Tutor me: a fourth practice mode on every step-by-step helper (practice=tutor). tools.js loads this file.
   It works like One step at a time, but before each step is shown it asks "What would you do next?" with 3 or 4
   choices: the real move (named from that step's own labels and its first sentence in "Say it out loud") and moves
   that are wrong right now (a later step of the same problem, a step already done, or a common wrong move).
   Right: "✓ Yes — " and why, then the step. Wrong: a gentle hint and another try; after two wrong tries the step is
   shown with its explanation. "Show me" skips the question. At the end: "You picked 6 of 8 moves first time",
   kept by progress.js (helper:tutored, its own log, so the Check my answer numbers don't change).

   How a helper works with this. There is no per-page code: it runs on top of the page's own step mode, through
   the parts every helper already has (the shared template):
     - the practice buttons: a role="group" (aria-label="Practice mode") with a "One step at a time" button;
       "Tutor me" is added after the others
     - step mode: #stepCount says "k of N" while it's on (no [hidden] around it), #nextBtn shows the next step
     - "Say it out loud": .log > li, every item of step k marked data-step="k−1" (step 1 is data-step="0"; items
       with no data-step, like "Set up", are always shown), with .line rows of a .tag (the move's name) and a .txt
       (what to say), and an optional .aside (the reason); the same data-step marks the step's parts in the work
     - the answer: .answer .v (and its facts), kept behind "Finish the steps to see the answer" until the last step,
       with #closer and the parts of the work still to come; a figure or caption in the work's panels (#workHost,
       #figHost) that isn't part of a step but says the answer is hidden too
   The one hook a page may need: a page that warns about a practice= value it doesn't know must take "tutor" as
   step mode, so the link opens without a warning:
       if (pr === "tutor") pr = "step";      // Tutor me (assets/tutor.js) runs on top of step mode
   A page that quietly ignores values it doesn't know needs nothing; this file switches it to step mode.

   practice=tutor in the link (or "Tutor me" picked on this page before, while the page still remembers step mode)
   turns it on. Embedded (embed=1, practice sets and worksheets) it only runs when the link says practice=tutor.
   window.HelperTutor = { active(), start(), stop(), speech(), peek(), pick(i), show() }   (peek/pick/show: for tests)
   In another language (assets/i18n.js): its own words are the tutor.* keys; the choices are the page's own steps, so
   they are in the page's language already. The page's parts are found by their ids and structure, and by their
   English or translated words ("One step at a time": common.oneStep; "3 of 5" or "3 de 5"); the step text is read with
   English patterns plus the language's own (tutor.re.* in its locale file: the tags that aren't moves, the words for
   "or"/"and" between answers, …), so a language without them still works, with plainer choices and hints.
   Everything is wrapped so a problem here can never break a helper page. */
(function() {
  "use strict";
  if (window.HelperTutor) return;

  var root = document.documentElement;
  var page = ((window.HelperSite && window.HelperSite.here) || location.pathname.split("/").pop() || "").toLowerCase();
  var STORE = "helpers-tutor"; // { pages:{ "addition.html":1 } }: Tutor me was picked here
  var framed = true;
  try { framed = window.top !== window.self; } catch (e) {}

  function embedded() { return /[?&]embed=1(&|$)/.test(location.search) || root.classList.contains("embed"); }
  var passive = framed || embedded(); // nothing is remembered inside another page
  function safe(fn) { return function() { try { return fn.apply(this, arguments); } catch (e) { if (window.console) console.warn("tutor.js:", e); } }; }

  function $(id) { return document.getElementById(id); }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ---- the words, in the visitor's language (assets/i18n.js): the tutor.* keys, and en.js repeats the English for
     translators. English always shows the words written here; so does a page without i18n.js. The questions and
     choices come from the page's own steps, so they are in the page's language already. ---- */
  function tr(key, en, vars) {
    var I = window.HelperI18n;
    if (I && I.lang !== "en" && I.t) {
      var s = I.t(key, vars);
      if (s !== key) return s;
    }
    return vars ? fillIn(en, vars) : en;
  }

  function fillIn(s, vars) { // {name}, and {n|one|other}
    return String(s).replace(/\{(\w+)(\|[^{}]*)?\}/g, function(m, k, forms) {
      if (!Object.prototype.hasOwnProperty.call(vars, k)) return m;
      if (!forms) return String(vars[k]);
      var f = forms.slice(1).split("|");
      return Number(vars[k]) === 1 ? f[0] : f[f.length - 1];
    });
  }

  function foreign() { return !!(window.HelperI18n && window.HelperI18n.lang && window.HelperI18n.lang !== "en"); }

  /* Reading the steps in another language: the English patterns below always apply; a language can add its own words
     as a pattern string under a tutor.re.* (or tutor.g.<move>.skip) key, e.g. "tutor.re.meta": "nota|consejo|pista" */
  var RE = {};

  function langRe(key, wrap) {
    if (!foreign()) return null;
    var ck = key + "|" + (wrap || "");
    if (Object.prototype.hasOwnProperty.call(RE, ck)) return RE[ck];
    var I = window.HelperI18n,
      r = null;
    try {
      var src = I.has(key) ? I.raw(key) : "";
      if (src && typeof src === "string") r = new RegExp(wrap ? wrap.replace("@", function() { return src; }) : src, "i"); // wrap: "^(?:@)$"
    } catch (e) { r = null; }
    RE[ck] = r;
    return r;
  }

  function anyRe(re, key, s, wrap) { // the English pattern, or the language's own
    if (re && re.test(s)) return true;
    var r = langRe(key, wrap);
    return !!r && r.test(s);
  }

  // fn once the language's strings are in (at once without i18n.js; never later than 4 s)
  function whenReady(fn) {
    var done = false,
      go = function() {
        if (!done) {
          done = true;
          fn();
        }
      };
    var I = window.HelperI18n;
    if (I && I.ready) {
      I.ready(go);
      setTimeout(go, 4000);
    } else go();
  }

  function cssText(s) { return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, " ") + '"'; }

  function load() { try { var v = JSON.parse(localStorage.getItem(STORE) || "null"); return v && typeof v === "object" && v.pages ? v : { pages: {} }; } catch (e) { return { pages: {} }; } }

  function remember(on) {
    if (passive) return;
    var v = load();
    if (on) v.pages[page] = 1;
    else delete v.pages[page];
    try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) {}
  }
  // practice= as the page was opened (the page may already have rewritten its address)
  function linkPractice() {
    var href = location.href;
    try { var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0]; if (nav && nav.name) href = nav.name; } catch (e) {}
    var m = /[?&]practice=([^&#]*)/.exec(href);
    if (!m) return null;
    try { return decodeURIComponent(m[1]).trim().toLowerCase(); } catch (e) { return m[1].toLowerCase(); }
  }

  /* ===================== styles ===================== */
  var CSS =
    ":root{--ht-acc:#1F5E8C;--ht-ok:#0B6B57;--ht-no:#9A4A08}" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){--ht-acc:#7DB8E8;--ht-ok:#5ED3B5;--ht-no:#F2A85C}}" +
    ":root[data-theme=\"dark\"]{--ht-acc:#7DB8E8;--ht-ok:#5ED3B5;--ht-no:#F2A85C}" +
    ".ht-tq{background:var(--surface);color:var(--ink);border:1px solid var(--rule);border-left:5px solid var(--ht-acc);border-radius:12px;" +
    "padding:14px 16px 12px;display:flex;flex-direction:column;gap:10px;box-shadow:var(--shadow,none);min-width:0;" +
    "font-family:var(--f-body,\"IBM Plex Sans\",\"Segoe UI\",Arial,sans-serif)}" +
    ".ht-tq[hidden]{display:none}" +
    ".ht-tq-top{display:flex;align-items:baseline;justify-content:space-between;gap:4px 12px;flex-wrap:wrap}" +
    ".ht-tq-h{margin:0;font-size:17px;font-weight:600;line-height:1.3;color:var(--ink)}" +
    ".ht-tq-n{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-size:12px;color:var(--ink-3);white-space:nowrap}" +
    ".ht-tq-fb{margin:0;padding:8px 12px;border-radius:9px;background:var(--surface-2,rgba(127,127,127,.1));font-size:15px;line-height:1.5;color:var(--ink-2);overflow-wrap:anywhere}" +
    ".ht-tq-body{display:flex;flex-direction:column;gap:10px;min-width:0}" +
    ".ht-tq-fb:empty{display:none}" +
    ".ht-tq-fb b{font-weight:600;color:var(--ink)}" +
    ".ht-tq-fb.ok .lead{color:var(--ht-ok);font-weight:700}" +
    ".ht-tq-fb.no .lead,.ht-tq-fb.show .lead{color:var(--ht-no);font-weight:700}" +
    ".ht-tq-opts{display:grid;gap:8px;margin:0;padding:0}" +
    ".ht-tq-opt{display:flex;align-items:flex-start;gap:10px;width:100%;min-height:44px;margin:0;padding:9px 12px;text-align:left;" +
    "font:inherit;font-size:15px;line-height:1.4;color:var(--ink);background:var(--paper,var(--surface));border:1.5px solid var(--rule);" +
    "border-radius:10px;cursor:pointer;overflow-wrap:anywhere;min-width:0}" +
    ".ht-tq-opt:hover:not([disabled]){border-color:var(--ht-acc)}" +
    ".ht-tq-opt:focus-visible{outline:3px solid var(--focus,var(--ht-acc));outline-offset:2px}" +
    ".ht-tq-opt[disabled]{cursor:default;opacity:.6}" +
    ".ht-tq-opt[disabled] .ht-tq-t{text-decoration:line-through}" +
    ".ht-tq-k{flex:none;width:24px;height:24px;border-radius:50%;border:1px solid var(--rule);background:var(--surface);" +
    "font-family:var(--f-mono,Consolas,monospace);font-size:12.5px;font-weight:600;line-height:22px;text-align:center;color:var(--ink-2)}" +
    ".ht-tq-b{display:flex;flex-direction:column;gap:1px;min-width:0}" +
    ".ht-tq-c{font-family:var(--f-mono,Consolas,monospace);font-size:11.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ht-acc)}" +
    ".ht-tq-acts{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap}" +
    ".ht-tq-btn{font:inherit;font-size:14px;font-weight:600;color:var(--ink);background:var(--surface-2,var(--surface));border:1px solid var(--rule);" +
    "border-radius:9px;padding:7px 14px;cursor:pointer;min-height:36px}" +
    ".ht-tq-btn:hover{border-color:var(--ink-3)}" +
    ".ht-tq-btn:focus-visible{outline:3px solid var(--focus,var(--ht-acc));outline-offset:2px}" +
    ".ht-tq-keys{font-size:12.5px;color:var(--ink-3)}" +
    ".ht-tq-score{margin:0;font-size:16px;font-weight:600;color:var(--ink)}" +
    ".ht-tq-sr{position:absolute !important;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}" +
    // while the first question is up, step 1 is hidden like the steps after it; the steps still to come can't be read
    "html.ht-tpre .board .log > li[data-step=\"0\"],html.ht-tpre #board .log > li[data-step=\"0\"]{opacity:.16 !important;filter:blur(4px);user-select:none}" +
    "html.ht-tpre .board [data-step=\"0\"]:not(li),html.ht-tpre #board [data-step=\"0\"]:not(li){visibility:hidden !important}" +
    // until the last step is shown, nothing gives the answer away: the answer band (values and facts) waits behind a
    // note, the closing line is hidden, and so are the parts of the work still to come (the steps to come stay as
    // blurred lines in "Say it out loud", so it's clear there's more)
    "html.ht-tmask .answer{position:relative;min-height:56px}" +
    "html.ht-tmask .answer > *{visibility:hidden !important}" +
    "html.ht-tmask .answer::after{content:@FINISH@;visibility:visible;position:absolute;inset:0;display:flex;" +
    "align-items:center;justify-content:center;padding:8px 16px;text-align:center;font-family:var(--f-body,Arial,sans-serif);" +
    "font-size:15px;font-weight:600;color:var(--ink-2);filter:none}" +
    "html.ht-tmask #closer,html.ht-tmask .closer,html.ht-tmask .ht-tleak{visibility:hidden !important}" +
    "html.ht-tmask .board .veil:not(li),html.ht-tmask #board .veil:not(li){visibility:hidden !important}" +
    "html.ht-tutor .log > li.veil{filter:blur(5px);user-select:none}" +
    "html.ht-tutor .log > li.ht-tnew{outline:2.5px solid var(--ht-acc);outline-offset:3px;border-radius:6px}" +
    "@media (max-width:520px){.ht-tq{padding:12px 12px 10px}.ht-tq-opt{padding:8px 10px;font-size:14.5px}}" +
    "@media print{.ht-tq{display:none !important}html.ht-tutor .log > li{filter:none !important}}";

  /* ===================== reading a step from "Say it out loud" ===================== */
  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻", "−": "⁻", "+": "⁺", "n": "ⁿ", "(": "⁽", ")": "⁾", "=": "⁼" };
  // an element's words as plain text: stacked fractions as a/b, powers as ²
  function plain(el) {
    if (!el) return "";
    var c = el.cloneNode(true);
    [].forEach.call(c.querySelectorAll("svg, script, style, .sr-only, button"), function(x) { x.parentNode.removeChild(x); });
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
      if (nu && de) fr.textContent = " " + nu.textContent.trim() + "/" + de.textContent.trim() + " ";
    });
    [].forEach.call(c.querySelectorAll("sup"), function(s) {
      var t = s.textContent.trim(),
        ok = t && t.split("").every(function(ch) { return SUP[ch]; });
      s.textContent = ok ? t.split("").map(function(ch) { return SUP[ch]; }).join("") : "^" + (t.length > 1 ? "(" + t + ")" : t);
    });
    return c.textContent.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
  }

  function norm(s) { return String(s).toLowerCase().replace(/[−–]/g, "-").replace(/\s+/g, " ").trim(); }

  function key(s) { return norm(s).replace(/[\s·—\-.,:;!?…'’"“”()]/g, ""); }

  function words(s) { return String(s).split(/\s+/).filter(Boolean).length; }

  function clip(s, n) {
    s = String(s || "").trim();
    if (s.length <= n) return s;
    var cut = s.slice(0, n),
      sp = cut.lastIndexOf(" ");
    return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:—–-]+$/, "") + "…";
  }

  function sentences(t) {
    var out = [],
      s = String(t || ""),
      // a sentence starts with a capital, a quote, a bracket or a number (in another language also ¿ ¡ and À–Þ)
      re = foreign() ? /[.!?](?=\s+[A-Z“"(\d−\-¿¡À-ÖØ-Þ]|\s*$)/g : /[.!?](?=\s+[A-Z“"(\d−-]|\s*$)/g,
      at = 0,
      m;
    while ((m = re.exec(s))) {
      out.push(s.slice(at, m.index + 1).trim());
      at = m.index + 1;
    }
    if (at < s.length && s.slice(at).trim()) out.push(s.slice(at).trim());
    return out.filter(Boolean);
  }
  // the move in a few words: the first sentence (two if the first is very short), with its result left as "= ?"
  function gistOf(t) {
    var ss = sentences(t),
      g = ss[0] || String(t || "");
    // a second sentence only when the first is short, and never a bare result ("How many 12s fit into 84? 7.")
    if (ss[1] && words(ss[1]) >= 3 && (words(g) < 4 || (words(g) < 7 && (g + " " + ss[1]).length <= 110))) g += " " + ss[1];
    // a sum's result ("Add: 23 + 15 = 38") is left for the step to show; an equation ("x − 3 = 0") stays as it is
    var bare = g.replace(/[.!]+$/, ""),
      m = /^(.*\S)\s*=\s*([^=]{1,18})$/.exec(bare);
    if (m) {
      var tail = m[1].split(/[:;]/).pop().trim(),
        right = m[2].trim();
      var calc = /\d/.test(tail) && /[+×÷·\/^*−-]/.test(tail.replace(/^[−-]/, "")); // "0.1 × 30", "5x+7x+9x", "3(2)²"
      var named = m[1].indexOf(":") >= 0 && /^[A-Za-zα-ωθμσπ′'₀-₉\d()° ]{1,10}$/.test(tail); // "…: m", "…: P(4)", "…: sin 60°"
      var formula = (bare.replace(/\b(sin|cos|tan|log|ln|sqrt|lim)\b/g, "").match(/[a-z]{3,}/gi) || []).length === 0; // "f′(x) = 3x²": no words, all math
      var value = /[\d√π]/.test(right) && !anyRe(/\b(so|and|which|because|means|gives)\b/i, "tutor.re.notValue", right, "(?:^|[^\\wÀ-ÿ])(?:@)(?![\\wÀ-ÿ])");
      var equation = right === "0" && /[a-z]/i.test(tail); // "x − 3 = 0" stays as it is
      if ((calc || named || formula) && value && !equation) g = m[1] + " = ?";
    }
    return clip(g, 110);
  }
  var META = /^(why|because|note|tip|careful|hint|remember|aside|so)$/i;

  function isMeta(tag) { return anyRe(META, "tutor.re.meta", tag, "^(?:@)$"); }

  function describe(k, lis) {
    var lines = [],
      aside = [];
    lis.forEach(function(li) {
      var rows = li.querySelectorAll(".line");
      if (rows.length)[].forEach.call(rows, function(r) {
        var tg = r.querySelector(".tag"),
          tx = r.querySelector(".txt");
        var c = r.cloneNode(true);
        [].forEach.call(c.querySelectorAll(".tag"), function(x) { x.parentNode.removeChild(x); });
        lines.push({ tag: tg ? plain(tg) : "", txt: tx ? plain(tx) : plain(c) });
      });
      else {
        var c2 = li.cloneNode(true);
        [].forEach.call(c2.querySelectorAll(".n, .sn, .aside, .tag"), function(x) { x.parentNode.removeChild(x); });
        var tags = [].map.call(li.querySelectorAll(".tag"), plain);
        lines.push({ tag: tags[0] || "", txt: plain(c2) });
      }
      [].forEach.call(li.querySelectorAll(".aside"), function(a) { var t = plain(a); if (t) aside.push(t); });
    });
    lines = lines.filter(function(l) { return l.tag || l.txt; });
    if (!lines.length) return null;
    var chips = [],
      seen = {};
    lines.forEach(function(l) {
      var t = l.tag;
      if (t && !isMeta(t) && !seen[norm(t)]) {
        seen[norm(t)] = 1;
        chips.push(t);
      }
    });
    if (!chips.length && lines[0].tag) chips.push(lines[0].tag);
    var first = lines[0].txt || lines[0].tag,
      full = lines.map(function(l) { return (l.tag ? l.tag + ": " : "") + l.txt; }).join(" ");
    var chip = clip(chips.slice(0, 3).join(" · "), 60),
      gist = gistOf(first);
    return {
      step: k + 1,
      lis: lis,
      lines: lines,
      aside: aside.join(" "),
      chip: chip,
      gist: gist,
      label: (chip ? chip + " — " : "") + gist,
      full: full,
      k: key((chip ? chip + "|" : "") + gist),
      g: key(gist),
      text: norm(full + " " + aside.join(" "))
    };
  }

  function readSteps(n) {
    var log = document.querySelector(".log"),
      groups = {};
    if (!log) return [];
    [].forEach.call(log.children, function(li) {
      var ds = li.getAttribute("data-step");
      if (ds === null || ds === "" || !/^\d+$/.test(ds)) return;
      (groups[ds] = groups[ds] || []).push(li);
    });
    var out = [];
    for (var k = 0; k < n; k++) out.push(groups[k] ? describe(k, groups[k]) : null);
    // a last step with nothing of its own to show is the answer itself (some pages save it for the end)
    if (n > 1 && !out[n - 1] && !document.querySelector('.board [data-step="' + (n - 1) + '"], #board [data-step="' + (n - 1) + '"]')) {
      var t = tr("tutor.together", "Put it all together and write down the answer."),
        ans = tr("common.answer", "Answer");
      out[n - 1] = {
        step: n,
        lis: [],
        lines: [{ tag: ans, txt: t }],
        aside: "",
        chip: ans,
        gist: t,
        label: ans + " — " + t,
        full: ans + ": " + t,
        k: key(ans + "|" + t),
        g: key(t),
        text: ""
      };
    }
    return out;
  }

  function answerVals() {
    var out = [];
    [].forEach.call(document.querySelectorAll(".answer .v"), function(v) {
      // "3 or 5", "x = 2 and y = 3" (and the language's own words: tutor.re.or)
      var or = langRe("tutor.re.or", "\\s*(?:,|;|\\||\\bor\\b|\\band\\b|\\s(?:@)\\s)\\s*") || /\s*(?:,|;|\||\bor\b|\band\b)\s*/i;
      plain(v).split(or).forEach(function(x) {
        x = norm(x).replace(/[.]$/, "");
        if (x && x !== "?" && (/\d/.test(x) || x.length >= 3)) out.push(x);
        // "38 shells": the number on its own too
        (x.match(/[−-]?\d[\d,.\/]*/g) || []).forEach(function(d) { if (d !== x) out.push(d); });
      });
    });
    return out;
  }
  /* A picture in the work that isn't one of the steps can still state the answer in its caption ("which is exactly
     1/9"): while the answer is hidden, such a piece of the work (one with no step in it whose words say a whole answer
     value that isn't in the problem itself) is hidden too, and shown again with the last step */
  function hideLeaks(mask) {
    var old = document.querySelectorAll(".ht-tleak");
    if (!mask) {
      [].forEach.call(old, function(x) { x.classList.remove("ht-tleak"); });
      return;
    }
    // the panels of the work: #workHost, and a figure beside it (#figHost); "Say it out loud" itself is left alone
    var hosts = [].slice.call(document.querySelectorAll(".board .panel, #board .panel"));
    if (!hosts.length && $("workHost")) hosts = [$("workHost")];
    if (!hosts.length) return;
    var given = norm(plain(document.querySelector(".problem")) + " " + [].map.call(document.querySelectorAll(".problem input, .problem textarea"), function(i) { return i.value; }).join(" "));
    var vals = [];
    [].forEach.call(document.querySelectorAll(".answer .v"), function(v) {
      var t = norm(plain(v)).replace(/[.]$/, "");
      if (t && t !== "?" && t.replace(/^-/, "").length >= 2 && !holds(given, t)) vals.push(t);
    });
    var hit = [];
    // the biggest pieces of the work with no step in them (a figure, a caption): one that says the answer is hidden
    function walk(el) {
      [].forEach.call(el.children, function(c) {
        if (c.hasAttribute("data-step") || c.classList.contains("veil") || c.matches(".panel-head, .stepper, .legend, #legend, h2, .log, #closer, .closer")) return;
        if (c.querySelector("[data-step]")) { walk(c); return; }
        var t2 = norm(plain(c)); // its words, not a picture's labels (a number line's ticks)
        if (vals.some(function(v) { return holds(t2, v); })) hit.push(c);
      });
    }
    if (vals.length) hosts.forEach(walk);
    [].forEach.call(old, function(x) { if (hit.indexOf(x) < 0) x.classList.remove("ht-tleak"); });
    hit.forEach(function(x) { x.classList.add("ht-tleak"); });
  }

  function holds(text, v) {
    var e = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // a single digit is in too many steps ("Plot all 7 of them"): it counts only as a result, "= 7"
    if (/^-?\d$/.test(v)) return new RegExp("=\\s*" + e + "(?![0-9\\/]|[.,]\\d)").test(text);
    return new RegExp("(^|[^0-9a-z.])" + e + "(?![0-9])").test(text);
  }

  /* ===================== the choices ===================== */
  // common wrong moves, for when the problem itself doesn't have enough other moves
  var GENERIC = [
    { id: "guess", chip: "Guess", text: "Guess the answer and move on", why: "A guess skips the thinking: there’s a real move to make here.", skip: /guess|estimat|try a number/i },
    { id: "answer", chip: "Answer", text: "Write down the final answer straight away", why: "There’s still work to do before the answer.", answer: true },
    { id: "startOver", chip: "Start over", text: "Start the whole problem again from the top", why: "No need to start again: the steps so far are right.", notFirst: true },
    { id: "round", chip: "Round", text: "Round every number off first", why: "Rounding would change the numbers, and this problem wants them exact.", skip: /round|estimat|≈|nearest|about|approx/i },
    { id: "skip", chip: "Skip", text: "Leave this step out — it isn’t needed", why: "Every step here is needed to reach the answer.", skipRight: /check|graph|meaning|likely|picture|draw|another|way|pattern|why|ladder|plot|look/i },
    { id: "copy", chip: "Copy", text: "Copy the problem out again without changing anything", why: "Copying it out again doesn’t get any closer to the answer.", notFirst: true },
    { id: "lastStep", chip: "Last step", text: "Jump straight to the last step", why: "The steps build on each other, so the last one has to wait.", notLast: true },
    { id: "addAll", chip: "Add them all", text: "Add up every number in the problem", why: "Adding everything together isn’t what this problem asks for.", skip: /\badd|sum|total|plus|\+|combine|together|altogether/i },
    // last resorts: always wrong while there's work left
    { id: "stop", chip: "Stop", text: "Stop here — the problem is already done", why: "There’s still work to do before it’s finished.", notAtEnd: true },
    { id: "change", chip: "Change", text: "Change the numbers in the problem to easier ones", why: "Changing the numbers would make it a different problem.", skip: /round|estimat|easier|friendly|compatible|nearest|approx/i }
  ];

  function seeded(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function() {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  function build(steps, q) {
    var right = steps[q - 1],
      n = steps.length,
      all = steps.filter(Boolean);
    var vals = answerVals(),
      multi = document.querySelectorAll(".answer .v").length > 1;
    var ends = steps.map(function(s) { return !!s && vals.some(function(v) { return holds(s.text, v); }); });
    var opts = [{ kind: "right", chip: right.chip, text: right.gist, k: right.k, g: right.g, step: q }],
      used = {};
    used[right.k] = 1;

    function add(o) {
      if (opts.length >= 4 || used[o.k] || (o.g && o.g === right.g)) return;
      used[o.k] = 1;
      opts.push(o);
    }

    function fromStep(s, kind) { if (s) add({ kind: kind, chip: s.chip, text: s.gist, k: s.k, g: s.g, step: s.step }); }
    // later steps of this part of the problem: up to the step that gives an answer (after it, an extra or another
    // part may start, and that could be a fine next move too). A many-part answer takes no later steps at all.
    var end = n;
    for (var e = q; e <= n; e++)
      if (ends[e - 1]) { end = e; break; }
    var later = multi ? [] : steps.slice(q, end).filter(Boolean),
      earlier = steps.slice(0, q - 1).filter(Boolean).reverse();
    // a step already done is the weakest wrong move, so at most one of those comes before the common wrong moves
    if (later.length > 1) fromStep(later[later.length - 1], "later");
    if (later.length) fromStep(later[0], "later");
    if (earlier.length) fromStep(earlier[0], "earlier");
    later.slice(1, -1).forEach(function(s) { fromStep(s, "later"); });
    var everything = all.map(function(s) { return s.text; }).join(" "),
      rightWords = norm(right.chip + " " + right.gist);
    var answerSoon = q >= n || ends.slice(0, q).some(Boolean) || anyRe(/answer|result|final|simplest|^so\b/i, "tutor.re.answerSoon", right.chip);
    GENERIC.forEach(function(G) {
      if (opts.length >= 4) return;
      var g = "tutor.g." + G.id + ".",
        chip = tr(g + "chip", G.chip),
        text = tr(g + "text", G.text);
      if (G.skip && anyRe(G.skip, g + "skip", everything)) return;
      if (G.skipRight && anyRe(G.skipRight, g + "skipRight", right.chip + " " + right.gist)) return;
      if (G.notFirst && q === 1) return;
      if (G.notLast && q >= n - 1) return; // the step after next is the last one: too close to call it wrong
      if (G.notAtEnd && (q >= n || answerSoon)) return;
      if (G.answer && answerSoon) return;
      if (rightWords.indexOf(norm(chip)) >= 0) return;
      add({ kind: "generic", chip: chip, text: text, k: key(chip + "|" + text), g: key(text), why: tr(g + "why", G.why) });
    });
    earlier.slice(1).forEach(function(s) { fromStep(s, "earlier"); });
    // a steady order for this step of this problem, so a redraw doesn't shuffle them
    var rnd = seeded(T.sig + "#" + q);
    for (var i = opts.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)),
        t = opts[i];
      opts[i] = opts[j];
      opts[j] = t;
    }
    return { step: q, opts: opts };
  }

  /* ===================== state ===================== */
  var on = false,
    box = null,
    btn = null,
    selfClick = false,
    timer = null,
    observer = null,
    focusNext = false,
    lastView = "";
  var T = fresh(null);

  function fresh(sig) { return { sig: sig, res: {}, pre: false, q: null, tries: 0, fb: null, recorded: false, newest: 0, said: "" }; }

  // "One step at a time", in English or in the page's language
  function isStepLabel(t) {
    t = String(t || "").trim();
    return /^one step at a time$/i.test(t) || (foreign() && !!t && t === tr("common.oneStep", "One step at a time"));
  }

  // the practice buttons: the group with "One step at a time" in it (aria-label "Practice mode" on most pages; in
  // another language, also the group that holds #stepBtn or #pStep)
  function group() {
    var g = document.querySelector('[role="group"][aria-label="Practice mode"]');
    if (g) return g;
    var all = [].slice.call(document.querySelectorAll('[role="group"]'));
    return all.filter(function(x) {
      return [].some.call(x.querySelectorAll("button"), function(b) { return isStepLabel(b.textContent); });
    })[0] || (foreign() ? all.filter(function(x) { return !!x.querySelector("#stepBtn, #pStep"); })[0] : null) || null;
  }

  function stepBtn() {
    var g = group();
    var b = g ? [].filter.call(g.querySelectorAll("button"), function(x) { return x !== btn && isStepLabel(x.textContent); })[0] : null;
    return b || $("stepBtn") || $("pStep");
  }

  // step mode's "3 of 5" (or "3 de 5" in Spanish: any two numbers)
  function counter() {
    var el = $("stepCount");
    if (!el || el.closest("[hidden]")) return null;
    var t = el.textContent || "";
    var m = /(\d+)\s*of\s*(\d+)/.exec(t) || (foreign() ? /(\d+)\D+(\d+)/.exec(t) : null);
    return m ? { cur: Number(m[1]), n: Number(m[2]) } : null;
  }

  function clickQuiet(b) {
    if (!b) return;
    selfClick = true;
    try { b.click(); } finally { selfClick = false; }
  }

  function paintButtons() {
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(on));
    var sb = stepBtn();
    if (on && sb && sb.getAttribute("aria-pressed") === "true") sb.setAttribute("aria-pressed", "false");
  }

  function ensureBox() {
    if (box && box.isConnected) return box;
    var board = $("board") || document.querySelector(".board");
    if (!board || !board.parentNode) return null;
    box = document.createElement("section");
    box.className = "ht-tq";
    box.id = "htTutor";
    box.setAttribute("aria-label", tr("tutor.button", "Tutor me"));
    box.addEventListener("click", safe(onBoxClick));
    box.addEventListener("keydown", safe(onBoxKey));
    // the body is redrawn; the live region stays, so screen readers keep listening to it
    box.innerHTML = '<div class="ht-tq-body"></div><div class="ht-tq-sr" role="status" aria-live="polite"></div>';
    board.parentNode.insertBefore(box, board);
    lastView = "";
    return box;
  }

  function start(byUser) {
    if (!stepBtn() || !$("nextBtn")) return;
    on = true;
    T = fresh(null);
    remember(true);
    root.classList.add("ht-tutor");
    var c = counter();
    if (byUser || !c) clickQuiet(stepBtn()); // step mode, from step 1
    paintButtons();
    focusNext = !!byUser;
    sync();
    say("question");
  }

  function stop(keepMemory) {
    if (!on) return;
    on = false;
    if (!keepMemory) remember(false);
    root.classList.remove("ht-tutor", "ht-tpre", "ht-tmask");
    hideLeaks(false);
    [].forEach.call(document.querySelectorAll(".ht-tnew"), function(x) { x.classList.remove("ht-tnew"); });
    if (box) { box.hidden = true; var bd = box.querySelector(".ht-tq-body"); if (bd) bd.innerHTML = ""; }
    lastView = "";
    paintButtons();
    var sb = stepBtn();
    if (sb && counter()) sb.setAttribute("aria-pressed", "true");
    say("off");
  }

  // keeps the quiz in step with the page: a new problem starts it again, Next or ← on the page move it along
  function sync() {
    if (!on) return;
    paintButtons();
    var c = counter();
    if (!c || !c.n) {
      if (box) { box.hidden = true; } root.classList.remove("ht-tpre", "ht-tmask");
      lastView = "";
      return;
    }
    var steps = readSteps(c.n);
    var sig = c.n + "|" + steps.map(function(s) { return s ? s.k + ":" + key(s.full) : "-"; }).join("|");
    if (sig !== T.sig) {
      T = fresh(sig);
      T.pre = c.cur === 1 && !!steps[0]; // ask about step 1 too, before it's shown
      T.steps = steps;
    } else T.steps = steps;
    var shown = T.pre ? 0 : c.cur;
    for (var s = 1; s <= shown; s++)
      if (!T.res[s]) { // shown with the page's own Next (or →): skipped
        T.res[s] = "skipped";
        T.fb = null;
        T.newest = s;
        if (T.q && T.q.step === s) {
          T.q = null;
          T.tries = 0;
        }
      }
    root.classList.toggle("ht-tpre", T.pre);
    root.classList.toggle("ht-tmask", shown < c.n);
    hideLeaks(shown < c.n);
    // the step just shown gets an outline
    [].forEach.call(document.querySelectorAll(".log > li.ht-tnew"), function(x) { if (!T.newest || x.getAttribute("data-step") !== String(T.newest - 1)) x.classList.remove("ht-tnew"); });
    if (T.newest && T.newest <= shown && steps[T.newest - 1]) steps[T.newest - 1].lis.forEach(function(li) { li.classList.add("ht-tnew"); });
    var view;
    T.asking = false;
    if (shown >= c.n) view = "done";
    else if (T.res[shown + 1]) view = "back";
    else if (!steps[shown]) { view = "none"; } else {
      if (!T.q || T.q.step !== shown + 1) {
        T.q = build(steps, shown + 1);
        T.tries = 0;
      }
      view = "ask";
      T.asking = true;
    }
    draw(view, c, shown);
  }

  function later() {
    clearTimeout(timer);
    timer = setTimeout(safe(sync), 30);
  }
  // the question on the screen now (none while looking back at an earlier step, or at the end)
  function open() { return on && T.asking ? T.q : null; }

  /* ===================== drawing the quiz ===================== */
  function draw(view, c, shown) {
    var b = ensureBox();
    if (!b) return;
    var q = T.q,
      sig = view + "|" + T.sig + "|" + (q ? q.step + ":" + q.opts.map(function(o) { return o.wrong ? 1 : 0; }).join("") : "") + "|" + shown + "|" + (T.fb ? T.fb.id : "");
    if (sig === lastView && !b.hidden) return;
    lastView = sig;
    b.hidden = false;
    var fb = T.fb ? '<p class="ht-tq-fb ' + T.fb.cls + '"><span class="lead">' + esc(T.fb.lead) + "</span>" + esc(T.fb.text) + "</p>" : '<p class="ht-tq-fb"></p>';
    var html = "",
      spoken = "";
    if (view === "ask") {
      var first = q.step === 1;
      html = fb + '<div class="ht-tq-top"><h2 class="ht-tq-h" id="htTqH">' + question(first) + "</h2>" +
        '<span class="ht-tq-n">' + stepOf(q.step, c.n) + "</span></div>" +
        '<div class="ht-tq-opts" role="group" aria-labelledby="htTqH">' +
        q.opts.map(function(o, i) {
          return '<button type="button" class="ht-tq-opt" data-i="' + i + '"' + (o.wrong ? " disabled" : "") + ">" +
            '<span class="ht-tq-k" aria-hidden="true">' + (i + 1) + "</span>" +
            '<span class="ht-tq-b">' + (o.chip ? '<span class="ht-tq-c">' + esc(o.chip) + "</span>" : "") +
            '<span class="ht-tq-t">' + esc(o.text) + "</span></span>" +
            (o.wrong ? '<span class="ht-tq-sr">' + tr("tutor.notThis", " (not this one)") + "</span>" : "") + "</button>";
        }).join("") + "</div>" +
        '<div class="ht-tq-acts"><button type="button" class="ht-tq-btn" data-act="show">' + tr("tutor.showMe", "Show me") + "</button>" +
        '<span class="ht-tq-keys">' + tr("tutor.keys", "Pick one: click it, or press 1–{n}", { n: q.opts.length }) + "</span></div>";
      spoken = (T.fb ? T.fb.lead + T.fb.text + " " : "") + tr("tutor.asked", "{step}. {question} {n} choices.", { step: stepOf(q.step, c.n), question: question(first), n: q.opts.length });
    } else if (view === "done") {
      var picked = 0,
        asked = 0;
      for (var s = 1; s <= c.n; s++) { if (T.res[s] === "first") picked++; if (T.res[s] && T.res[s] !== "skipped") asked++; }
      var line = tr("tutor.score", "You picked {picked} of {n} {n|move|moves} first time.", { picked: picked, n: c.n });
      html = fb + '<p class="ht-tq-score">' + (picked === c.n ? "★ " : "") + esc(line) + "</p>" +
        '<div class="ht-tq-acts">' + (newProblemBtn() ? '<button type="button" class="ht-tq-btn" data-act="new">' + tr("common.newProblem", "New problem") + "</button>" : "") +
        '<button type="button" class="ht-tq-btn" data-act="again">' + tr("tutor.again", "Do this one again") + "</button></div>";
      spoken = (T.fb ? T.fb.lead + T.fb.text + " " : "") + tr("tutor.everyStep", "That’s every step.") + " " + line;
      if (!T.recorded && asked) {
        T.recorded = true;
        record(picked, c.n);
      }
    } else if (view === "back") {
      html = '<p class="ht-tq-fb">' + tr("tutor.back", "You’re looking back at step {k}. Press → or the Next step button to carry on.", { k: c.cur }) + "</p>";
      spoken = "";
    } else {
      html = fb + '<div class="ht-tq-acts"><span class="ht-tq-keys">' + tr("tutor.noExplain", "This step has no explanation to ask about.") + "</span>" +
        '<button type="button" class="ht-tq-btn" data-act="show">' + tr("tutor.showNext", "Show the next step") + "</button></div>";
    }
    var hadFocus = b.contains(document.activeElement) || focusNext;
    var body = b.querySelector(".ht-tq-body"),
      live = b.querySelector(".ht-tq-sr");
    if (!body || !live) {
      b.innerHTML = '<div class="ht-tq-body"></div><div class="ht-tq-sr" role="status" aria-live="polite"></div>';
      body = b.firstChild;
      live = b.lastChild;
    }
    body.innerHTML = html;
    if (spoken && spoken !== T.said) {
      T.said = spoken;
      live.textContent = "";
      setTimeout(function() { live.textContent = spoken; }, 60); // a moment later, so it's read as news
    }
    if (hadFocus) {
      focusNext = false;
      var f = b.querySelector(".ht-tq-opt:not([disabled])") || b.querySelector(".ht-tq-btn");
      if (f) try { f.focus({ preventScroll: !isOffscreen(b) }); } catch (e) { f.focus(); }
    }
    say(view === "ask" ? "question" : view);
  }

  function isOffscreen(el) { var r = el.getBoundingClientRect(); return r.top < 0 || r.top > (window.innerHeight || 800) - 80; }

  function question(first) { return first ? tr("tutor.first", "What would you do first?") : tr("tutor.next", "What would you do next?"); }

  function stepOf(k, n) { return tr("tutor.stepOf", "Step {k} of {n}", { k: k, n: n }); }

  // the page's own New problem button (its words in English, or in the page's language)
  function newProblemBtn() {
    var mine = foreign() ? tr("common.newProblem", "New problem").toLowerCase() : "";
    return [].filter.call(document.querySelectorAll("button"), function(b) {
      var t = b.textContent.trim();
      return (/^New problem$/i.test(t) || (!!mine && t.toLowerCase() === mine)) && !b.closest(".ht-tq");
    })[0] || null;
  }

  /* ===================== answering ===================== */
  // why the move is right: the step's reason (its aside), else the rest of what it says; never just the choice again
  function reason(s) {
    var w = s.lines.filter(function(l) { return anyRe(/^(why|because)$/i, "tutor.re.why", l.tag, "^(?:@)$"); })[0];
    if (w) return w.txt;
    if (!s.aside) return "";
    var ss = sentences(s.aside);
    return /\?$/.test(ss[0] || "") && ss[1] ? ss[0] + " " + ss[1] : ss[0]; // "Don’t spot it right away? Small bites work too."
  }

  function why(s) {
    var rest = s.lines[1] ? (s.lines[1].tag && !isMeta(s.lines[1].tag) ? s.lines[1].tag + ": " : "") + s.lines[1].txt : sentences(s.lines[0].txt).slice(1).join(" ");
    var t = reason(s) || rest;
    if (!t) { t = s.lines[0].txt; if (key(t) === key(s.gist)) t = nextMove(); }
    return clip(t, 170);
  }
  // a gentle hint: the step's reason, else the first half of what it says (its result still left out)
  function hint(s) {
    var r = reason(s);
    if (r) return clip(r, 160);
    var w = s.lines.map(function(l) { return l.txt; }).join(" ").split(/\s+/);
    var half = w.slice(0, Math.max(5, Math.ceil(w.length / 2))).join(" ")
      .replace(/=\s*[−-]?[\d.,\/]*\d(?![\d\/])/g, "= ?").replace(/=\s*\S+$/, "= ?"); // its results stay hidden
    return clip(half, 150) + (w.length > 5 ? " …" : "");
  }
  var fbId = 0;

  function nextMove() { return tr("tutor.nextMove", "that’s the next move."); }

  function feedback(cls, lead, text) { T.fb = { cls: cls, lead: lead, text: text, id: ++fbId }; }

  function pick(i) {
    var q = open();
    if (!on || !q) return false;
    var o = q.opts[i],
      s = T.steps[q.step - 1];
    if (!o || o.wrong) return false;
    focusNext = true;
    if (o.kind === "right") {
      T.res[q.step] = T.tries ? "later" : "first";
      feedback("ok", tr("tutor.yes", "✓ Yes — "), why(s));
      reveal(q.step);
      return true;
    }
    o.wrong = true;
    T.tries++;
    if (T.tries >= 2) {
      T.res[q.step] = "missed";
      var y = why(s);
      feedback("show", tr("tutor.theMove", "Here’s the move: "), s.label + (/[.?!…]$/.test(s.label) ? "" : ".") + (/^that’s the next move/.test(y) || y === nextMove() ? "" : " " + y));
      reveal(q.step);
      return false;
    }
    var what = o.kind === "later" ? tr("tutor.later", "That one comes later (step {k}).", { k: o.step }) :
      o.kind === "earlier" ? tr("tutor.earlier", "That one’s already done (step {k}).", { k: o.step }) :
      o.why;
    feedback("no", tr("tutor.notQuite", "Not quite. "), tr("tutor.hintLine", "{what} Hint: {hint}", { what: what, hint: hint(s) }));
    sync();
    return false;
  }

  function show() {
    var q = open(),
      c = counter();
    if (!on || !c) return;
    var st = q ? q.step : (T.pre ? 1 : c.cur + 1);
    var s = T.steps && T.steps[st - 1];
    T.res[st] = T.res[st] || "shown";
    if (s) feedback("show", tr("tutor.hereItIs", "Here it is: "), s.label);
    else T.fb = null;
    focusNext = true;
    reveal(st);
  }

  function reveal(st) {
    T.q = null;
    T.tries = 0;
    T.newest = st;
    if (st === 1 && T.pre) T.pre = false;
    else {
      var c = counter(),
        nb = $("nextBtn");
      if (c && c.cur === st - 1 && nb && !nb.disabled) clickQuiet(nb);
    }
    sync();
  }

  function record(picked, n) {
    var u = location.search.replace(/^\?/, "").split("&").filter(function(kv) { return kv && !/^(practice|embed|theme)=/.test(kv); }).join("&");
    var sp = new URLSearchParams(u),
      q = sp.get("q"),
      bits = [];
    if (!q) {
      sp.forEach(function(v, k) { bits.push(k === "mode" || k === "shape" ? v : k + " " + v); });
      q = bits.join(" · ");
    }
    var h1 = document.querySelector(".page h1");
    var d = { page: page, params: u, text: String(q || (h1 && h1.textContent) || "").replace(/\s+/g, " ").trim().slice(0, 120), picked: picked, moves: n };
    try { document.dispatchEvent(new CustomEvent("helper:tutored", { detail: d })); } catch (e) {}
  }

  /* ===================== keys and clicks ===================== */
  function onBoxClick(e) {
    var o = e.target.closest(".ht-tq-opt"),
      a = e.target.closest("[data-act]");
    if (o && !o.disabled) { pick(Number(o.getAttribute("data-i"))); return; }
    if (!a) return;
    var act = a.getAttribute("data-act");
    if (act === "show") show();
    else if (act === "again") {
      T = fresh(null);
      focusNext = true;
      clickQuiet(stepBtn());
      sync();
    } else if (act === "new") {
      var nb = newProblemBtn();
      focusNext = true;
      if (nb) nb.click();
    }
  }

  function onBoxKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var list = [].slice.call(box.querySelectorAll(".ht-tq-opt:not([disabled])"));
    var i = list.indexOf(document.activeElement),
      k = e.key;
    if (k === "ArrowDown" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowLeft") {
      e.stopPropagation(); // not the page's step arrows
      if (i < 0 || !list.length) return;
      e.preventDefault();
      var j = (i + (k === "ArrowDown" || k === "ArrowRight" ? 1 : list.length - 1)) % list.length;
      list[j].focus();
    } else if ((k === "Home" || k === "End") && i >= 0) {
      e.preventDefault();
      e.stopPropagation();
      list[k === "Home" ? 0 : list.length - 1].focus();
    }
  }

  function onDocKey(e) {
    if (!on || !open() || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target,
      tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
    if (!/^[1-9]$/.test(e.key)) return;
    var n = Number(e.key) - 1;
    if (n >= T.q.opts.length) return;
    e.preventDefault();
    pick(n);
  }

  /* ===================== read aloud (tools.js) ===================== */
  function say(what) { try { document.dispatchEvent(new CustomEvent("helper:tutor", { detail: { what: what } })); } catch (e) {} }
  // what Read aloud says while Tutor me is on: what just happened, the step just shown, then the question and choices
  function speech() {
    if (!on || !box || box.hidden) return null;
    var parts = [],
      c = counter();
    if (T.fb) parts.push({ text: T.fb.lead + T.fb.text });
    if (T.newest && T.steps && T.steps[T.newest - 1]) T.steps[T.newest - 1].lis.forEach(function(li) { parts.push({ el: li }); });
    if (open() && c) {
      parts.push({ text: stepOf(open().step, c.n) + ". " + question(open().step === 1) });
      open().opts.forEach(function(o, i) { if (!o.wrong) parts.push({ text: tr("tutor.choice", "Choice {i}: {text}", { i: i + 1, text: (o.chip ? o.chip + ". " : "") + o.text }) }); });
    } else {
      var sc = box.querySelector(".ht-tq-score");
      if (sc) parts.push({ text: tr("tutor.everyStep", "That’s every step.") + " " + sc.textContent.replace(/^★\s*/, "") });
      else { var bk = box.querySelector(".ht-tq-fb:not(:empty)"); if (bk && !T.fb) parts.push({ text: bk.textContent }); }
    }
    return { box: box, parts: parts };
  }

  /* ===================== start ===================== */
  var main = safe(function() {
    var g = group(),
      sb = stepBtn();
    if (!g || !sb || !$("nextBtn") || !$("stepCount") || !document.querySelector(".log")) return;
    var st = document.createElement("style");
    st.textContent = CSS.replace("@FINISH@", function() { return cssText(tr("tutor.finish", "Finish the steps to see the answer")); });
    document.head.appendChild(st);
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "tutorBtn";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = tr("tutor.button", "Tutor me");
    btn.title = tr("tutor.buttonTitle", "Before each step, pick what you’d do next");
    g.appendChild(btn);
    btn.addEventListener("click", safe(function() {
      if (on) {
        T = fresh(null);
        focusNext = true;
        clickQuiet(stepBtn());
        sync();
      } else start(true);
    }));
    // another practice button turns it off
    g.addEventListener("click", safe(function(e) {
      var b = e.target.closest("button");
      if (b && b !== btn && !selfClick && on) stop(false);
    }), true);
    document.addEventListener("keydown", safe(onDocKey));
    observer = new MutationObserver(function() { if (on) later(); });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["hidden", "aria-pressed"] });
    // the page's own address: where it writes practice=step, write practice=tutor while this is on
    var orig = history.replaceState;
    if (typeof orig === "function") history.replaceState = function(st2, t, url) {
      if (on && typeof url === "string") url = url.replace(/([?&])practice=step(?=&|#|$)/, "$1practice=tutor");
      return orig.call(this, st2, t, url);
    };
    var lp = linkPractice();
    if (lp === "tutor") start(false);
    else if (lp === null && !embedded() && load().pages[page] && counter()) start(false); // picked here before, and the page is in step mode
    else if (lp !== null && lp !== "tutor") remember(false);
  });

  window.HelperTutor = {
    active: function() { return on; },
    start: function() { start(true); },
    stop: function() { stop(false); },
    speech: speech,
    // for the self-test: the open question and which choice is right
    peek: function() {
      if (!on) return null;
      var c = counter();
      return {
        step: open() ? open().step : 0,
        n: c ? c.n : 0,
        cur: c ? c.cur : 0,
        pre: T.pre,
        right: open() ? open().opts.map(function(o) { return o.kind; }).indexOf("right") : -1,
        options: open() ? open().opts.map(function(o) { return { kind: o.kind, chip: o.chip, text: o.text, step: o.step || 0, wrong: !!o.wrong }; }) : [],
        res: JSON.parse(JSON.stringify(T.res)),
        feedback: T.fb ? T.fb.lead + T.fb.text : "",
        tries: T.tries
      };
    },
    pick: function(i) { return pick(i); },
    show: function() { show(); },
    sync: function() { sync(); }
  };
  var begin = function() { whenReady(main); }; // the button's words in the page's language
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", begin);
  else begin();
})();
