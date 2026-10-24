/* Your practice, kept on this device.
   Every helper page reports each graded "Check" (and each "Show me the work") as a helper:checked event on
   document; this file keeps a small log of them in localStorage and works out how it's going.

   Storage: localStorage["helper-progress"] = { v:1, e:[ entry, … ] }, oldest first, at most 3000 entries.
     entry = { t:time (ms), p:"fractions" (page, without .html), q:"mode=simplify&q=18%2F24" (the problem's link),
               x:"Simplify 18/24" (the problem as text), v:"r"|"w"|"s"|"h" (right, wrong, simplify, shown the work),
               f:1 when it was the first graded try at that problem, h:1 when a hint had been used, s:1 when it was
               done inside a practice set }
   A problem counts as "right first time" (the evidence that it's mastered) when its first try was right, with no hint.

   Tutor me (tutor.js) reports each problem it finishes as helper:tutored, { page, params, text, picked, moves }:
   "picked 6 of 8 moves first time". Those go in a log of their own, so they never change the numbers above:
     localStorage["helper-tutor-log"] = { v:1, e:[ { t, p, q, x, k:moves picked first time, n:moves }, … ] }, at most 1000.
   HelperProgress.tutorEntries() lists them, summary().tutor adds them up, and clear() clears them too.

   window.HelperProgress = { record(detail), entries(), summary(), clear(), exportCSV(), topics, topic(page), link(page, params) }
   A page with an element #progressPanel gets a "Your practice" panel drawn into it.
   Nothing here ever throws on a page: no localStorage (private mode, blocked) just means nothing is kept. */
(function() {
  "use strict";
  if (window.HelperProgress) return;
  var KEY = "helper-progress",
    VERSION = 1,
    CAP = 3000,
    DAY = 86400000;

  // the helpers in the order they're usually learned; c = the page color on the home page (--add, --sub, …)
  var TOPICS = [
    { page: "number-sense.html", name: "Number sense", title: "The Place Value Chart", c: "num" },
    { page: "addition.html", name: "Addition", title: "The Carry Column", c: "add" },
    { page: "subtraction.html", name: "Subtraction", title: "The Borrow Bank", c: "sub" },
    { page: "multiplication.html", name: "Multiplication", title: "The Product Ladder", c: "mul" },
    { page: "division.html", name: "Division", title: "The Division House", c: "div" },
    { page: "scratch.html", name: "By hand", title: "The Scratch Paper", c: "scr" },
    { page: "fractions.html", name: "Fractions", title: "The Fraction Bar", c: "fra" },
    { page: "percents.html", name: "Percents", title: "The Hundred Grid", c: "pct" },
    { page: "money-math.html", name: "Money math", title: "The Money Jar", c: "mon" },
    { page: "aviation.html", name: "Aviation", title: "The Flight Computer", c: "avi" },
    { page: "nursing.html", name: "Nursing", title: "The Dose Calculator", c: "nur" },
    { page: "carpentry.html", name: "Carpentry", title: "The Framing Square", c: "crp" },
    { page: "electrical.html", name: "Electrical", title: "The Circuit Board", c: "ele" },
    { page: "cooking.html", name: "Cooking", title: "The Recipe Card", c: "rcp" },
    { page: "factors.html", name: "Factors & primes", title: "The Factor Tree", c: "fac" },
    { page: "integers.html", name: "Integers", title: "The Number Line", c: "int" },
    { page: "ratios.html", name: "Ratios & rates", title: "The Ratio Table", c: "rat" },
    { page: "unit-conversions.html", name: "Unit conversions", title: "The Measuring Tape", c: "uni" },
    { page: "exponents.html", name: "Exponents", title: "The Power Tower", c: "exp" },
    { page: "pemdas.html", name: "Order of operations", title: "The Order Stack", c: "ord" },
    { page: "algebra.html", name: "Algebra", title: "The Balance Scale", c: "alg" },
    { page: "lines.html", name: "Lines & slope", title: "The Slope Grid", c: "lin" },
    { page: "graphing.html", name: "Graphing", title: "The Graph Paper", c: "gra" },
    { page: "functions.html", name: "Functions", title: "The Function Machine", c: "fun" },
    { page: "quadratics.html", name: "Quadratics & polynomials", title: "The Area Box", c: "qua" },
    { page: "logarithms.html", name: "Logarithms", title: "The Log Ladder", c: "log" },
    { page: "radicals.html", name: "Radicals & rational expressions", title: "The Root Cellar", c: "rad" },
    { page: "complex-numbers.html", name: "Complex numbers", title: "The Complex Plane", c: "cpx" },
    { page: "sequences.html", name: "Sequences & series", title: "The Number Staircase", c: "seq" },
    { page: "geometry.html", name: "Geometry", title: "The Shape Shop", c: "geo" },
    { page: "stats.html", name: "Statistics", title: "The Dot Plot", c: "sta" },
    { page: "probability.html", name: "Probability", title: "The Chance Spinner", c: "pro" },
    { page: "counting.html", name: "Counting", title: "The Counting Tree", c: "cnt" },
    { page: "trigonometry.html", name: "Trigonometry", title: "The Unit Circle", c: "tri" },
    { page: "calculus.html", name: "Calculus", title: "The Rate Machine", c: "cal" },
    { page: "college-statistics.html", name: "College statistics", title: "The Bell Curve", c: "bel" },
    { page: "matrices-and-vectors.html", name: "Matrices & vectors", title: "The Matrix Grid", c: "mat" },
    { page: "wordproblems.html", name: "Story problems", title: "The Story Problem", c: "wrd" },
    { page: "flashcards.html", name: "Flash cards", title: "The Flash Cards", c: "fla" }
  ];
  // a page's full address from its name (site.js knows the folders), so a link works from any page
  function U(page, params) { return window.HelperSite ? window.HelperSite.url(page, params) : page + (params ? "?" + params : ""); }
  var BY = {};
  TOPICS.forEach(function(t, i) {
    t.order = i;
    BY[t.page] = t;
  });

  function topic(page) {
    page = String(page || "");
    if (!/\.html$/.test(page)) page += ".html";
    return BY[page] || { page: page, name: page.replace(/\.html$/, ""), title: "", c: "ink", order: 99 };
  }
  var VERDICT = { right: "r", wrong: "w", simplify: "s", shown: "h" },
    VNAME = { r: "right", w: "wrong", s: "simplify", h: "shown" };

  /* ===================== the log ===================== */
  var cache = null;

  function read() {
    if (cache) return cache;
    var log = [];
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && v.v === VERSION && Array.isArray(v.e)) log = v.e.filter(function(x) { return x && typeof x.t === "number" && typeof x.p === "string" && VNAME[x.v]; });
    } catch (e) {}
    cache = log;
    return log;
  }

  function write(log) {
    cache = log;
    try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, e: log })); return true; } catch (e) {
      // full? keep the newer half and try once more
      try {
        cache = log = log.slice(Math.floor(log.length / 2));
        localStorage.setItem(KEY, JSON.stringify({ v: VERSION, e: log }));
        return true;
      } catch (e2) {}
      return false;
    }
  }

  function changed() {
    try { document.dispatchEvent(new CustomEvent("helper:progress")); } catch (e) {}
  }

  function record(d) {
    if (!d || typeof d !== "object" || !VERDICT[d.verdict]) return false;
    var page = String(d.page || (window.HelperSite && window.HelperSite.here) || location.pathname.split("/").pop() || "");
    if (!BY[page]) return false; // only the helpers' own pages
    var x = {
      t: typeof d.time === "number" ? d.time : Date.now(),
      p: page.replace(/\.html$/, ""),
      q: String(d.params || "").replace(/^\?/, "").slice(0, 600),
      x: String(d.text || "").replace(/\s+/g, " ").trim().slice(0, 140),
      v: VERDICT[d.verdict]
    };
    if (d.firstTry) x.f = 1;
    if (d.hinted) x.h = 1;
    if (d.inSet || document.documentElement.classList.contains("embed")) x.s = 1;
    cache = null;
    var log = read().slice();
    log.push(x);
    if (log.length > CAP) log = log.slice(log.length - CAP);
    var ok = write(log);
    changed();
    return ok;
  }

  function entries() {
    return read().map(function(x) {
      return { time: x.t, page: x.p + ".html", params: x.q, text: x.x, verdict: VNAME[x.v], firstTry: !!x.f, hinted: !!x.h, inSet: !!x.s };
    });
  }

  function clear() {
    cache = [];
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(TKEY);
    } catch (e) {}
    changed();
  }

  /* ===================== Tutor me: its own log ===================== */
  var TKEY = "helper-tutor-log",
    TCAP = 1000;

  function readTutor() {
    try {
      var v = JSON.parse(localStorage.getItem(TKEY) || "null");
      if (v && v.v === VERSION && Array.isArray(v.e)) return v.e.filter(function(x) { return x && typeof x.t === "number" && typeof x.p === "string" && x.n > 0; });
    } catch (e) {}
    return [];
  }

  function recordTutor(d) {
    if (!d || typeof d !== "object") return false;
    var page = String(d.page || (window.HelperSite && window.HelperSite.here) || "");
    var n = Math.floor(Number(d.moves)),
      k = Math.floor(Number(d.picked));
    if (!BY[page] || !(n > 0) || !(k >= 0) || k > n) return false;
    var x = {
      t: Date.now(),
      p: page.replace(/\.html$/, ""),
      q: String(d.params || "").replace(/^\?/, "").slice(0, 600),
      x: String(d.text || "").replace(/\s+/g, " ").trim().slice(0, 140),
      k: k,
      n: n
    };
    if (document.documentElement.classList.contains("embed")) x.s = 1;
    var log = readTutor();
    log.push(x);
    if (log.length > TCAP) log = log.slice(log.length - TCAP);
    try { localStorage.setItem(TKEY, JSON.stringify({ v: VERSION, e: log })); } catch (e) { return false; }
    changed();
    return true;
  }

  function tutorEntries() {
    return readTutor().map(function(x) { return { time: x.t, page: x.p + ".html", params: x.q, text: x.x, picked: x.k, moves: x.n, inSet: !!x.s }; });
  }

  function tutorSummary() {
    var log = readTutor(),
      s = { problems: log.length, picked: 0, moves: 0 };
    log.forEach(function(x) {
      s.picked += x.k;
      s.moves += x.n;
    });
    return s;
  }

  function link(page, params) {
    var q = String(params || "").replace(/^\?/, "").split("&").filter(function(kv) { return kv && !/^(practice|embed|theme)=/.test(kv); });
    q.push("practice=check");
    return U(topic(page).page, q.join("&"));
  }

  /* ===================== working it out ===================== */
  function dayKey(t) {
    var d = new Date(t);
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  function startOfDay(t) {
    var d = new Date(t);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }

  // one record per problem (page + link), in the order they were first tried
  function problems(log) {
    var map = {},
      list = [];
    log.forEach(function(x) {
      var k = x.p + "?" + x.q,
        P = map[k];
      if (!P) {
        P = map[k] = {
          key: k,
          page: x.p + ".html",
          params: x.q,
          text: x.x,
          first: x.t,
          last: x.t,
          tries: 0,
          checks: 0,
          firstRight: x.v === "r" && !!x.f && !x.h,
          right: false,
          hinted: false,
          shown: false,
          redeemed: false,
          lastVerdict: ""
        };
        list.push(P);
      } else if (x.v === "r" && x.f && !x.h) P.redeemed = true; // done again later, right first time
      P.last = x.t;
      P.checks++;
      if (x.v !== "h") P.tries++;
      if (x.v === "r") P.right = true;
      if (x.h) P.hinted = true;
      if (x.v === "h") P.shown = true;
      if (x.x) P.text = x.x;
      P.lastVerdict = VNAME[x.v];
    });
    return list;
  }

  function summary(now) {
    now = now || Date.now();
    var log = read(),
      probs = problems(log),
      today = startOfDay(now);
    var days = {},
      byTopic = {};
    log.forEach(function(x) { days[dayKey(x.t)] = true; });
    // the streak: days in a row with practice, up to today (or up to yesterday, if today hasn't been practiced yet)
    var streak = 0,
      d = today;
    if (!days[dayKey(d)]) d = startOfDay(d - DAY / 2);
    while (days[dayKey(d)]) {
      streak++;
      d = startOfDay(d - DAY / 2);
    }
    var weekFrom = today - 6 * DAY,
      week = { problems: 0, rightFirst: 0, checks: 0, days: 0 },
      wd = {};
    log.forEach(function(x) {
      if (x.t >= weekFrom) {
        week.checks++;
        wd[dayKey(x.t)] = true;
      }
    });
    week.days = Object.keys(wd).length;
    probs.forEach(function(P) {
      if (P.first >= weekFrom) { week.problems++; if (P.firstRight) week.rightFirst++; }
      var T = byTopic[P.page];
      if (!T) {
        var info = topic(P.page);
        T = byTopic[P.page] = {
          page: P.page,
          name: info.name,
          title: info.title,
          c: info.c,
          order: info.order,
          tried: 0,
          rightFirst: 0,
          hinted: 0,
          shown: 0,
          solved: 0,
          last: 0,
          recent: []
        };
      }
      T.tried++;
      if (P.firstRight) T.rightFirst++;
      if (P.hinted) T.hinted++;
      if (P.shown) T.shown++;
      if (P.right) T.solved++;
      if (P.last > T.last) T.last = P.last;
      T.recent.push(P);
    });
    var topics = Object.keys(byTopic).map(function(k) {
      var T = byTopic[k],
        rec = T.recent.slice(-10);
      T.rightFirstPct = pct(T.rightFirst, T.tried);
      T.recentTried = rec.length;
      T.recentRightFirst = rec.filter(function(P) { return P.firstRight; }).length;
      T.recentPct = pct(T.recentRightFirst, rec.length);
      T.toRevisit = T.recent.filter(function(P) { return !P.firstRight && !P.redeemed; }).length;
      delete T.recent;
      return T;
    }).sort(function(a, b) { return b.last - a.last; });
    var rf = probs.filter(function(P) { return P.firstRight; }).length;
    return {
      total: log.length,
      problems: probs.length,
      rightFirst: rf,
      rightFirstPct: pct(rf, probs.length),
      hinted: probs.filter(function(P) { return P.hinted; }).length,
      shown: probs.filter(function(P) { return P.shown; }).length,
      days: Object.keys(days).length,
      streak: streak,
      practicedToday: !!days[dayKey(today)],
      week: week,
      last: log.length ? log[log.length - 1].t : 0,
      first: log.length ? log[0].t : 0,
      topics: topics,
      revisit: probs.filter(function(P) { return !P.firstRight && !P.redeemed; }).sort(function(a, b) { return b.last - a.last; }),
      recent: probs.slice().sort(function(a, b) { return b.last - a.last; }),
      dayCounts: (function() {
        var o = {};
        log.forEach(function(x) {
          var k = dayKey(x.t);
          o[k] = (o[k] || 0) + 1;
        });
        return o;
      })(),
      suggestions: null
    };
  }
  // one or two "keep going" ideas
  function suggest(s) {
    var out = [],
      used = {};
    // the weakest topic lately, if it's been tried a few times: retry its newest mistake
    var weak = s.topics.filter(function(T) { return T.recentTried >= 3 && T.recentPct < 70 && T.toRevisit; })
      .sort(function(a, b) { return a.recentPct - b.recentPct || b.last - a.last; })[0];
    if (weak) {
      var miss = s.revisit.filter(function(P) { return P.page === weak.page; })[0];
      out.push({
        page: weak.page,
        c: weak.c,
        href: miss ? link(miss.page, miss.params) : link(weak.page, ""),
        head: "Have another go at " + weak.name,
        body: weak.recentRightFirst + " of your last " + weak.recentTried + " were right first time." + (miss ? " Start with " + miss.text + "." : "")
      });
      used[weak.page] = true;
    }
    // doing well on something: the next topic along that hasn't been tried
    var strong = s.topics.filter(function(T) { return T.tried >= 5 && T.recentPct >= 80; }).sort(function(a, b) { return b.order - a.order; })[0];
    if (strong) {
      var tried = {};
      s.topics.forEach(function(T) { tried[T.page] = true; });
      var next = TOPICS.filter(function(t) { return t.order > strong.order && !tried[t.page]; })[0] ||
        TOPICS.filter(function(t) { return !tried[t.page]; })[0];
      if (next && !used[next.page]) {
        out.push({
          page: next.page,
          c: next.c,
          href: link(next.page, ""),
          head: "Ready for " + next.name + "?",
          body: "You’re getting " + strong.name.toLowerCase() + " right first time. " + next.title + " is a good next step."
        });
        used[next.page] = true;
      }
    }
    if (out.length < 2 && s.revisit.length && !weak) {
      var m = s.revisit[0],
        t = topic(m.page);
      out.push({ page: m.page, c: t.c, href: link(m.page, m.params), head: "Try one again", body: m.text + " (" + t.name + ") wasn’t right first time." });
    }
    if (out.length < 2) {
      var lastT = s.topics[0];
      if (lastT && !used[lastT.page])
        out.push({
          page: lastT.page,
          c: lastT.c,
          href: U(lastT.page, "practice=check"),
          head: "A new " + lastT.name.toLowerCase() + " problem",
          body: "Open " + lastT.title + ", use “Make a problem for me”, and check your answer."
        });
      else out.push({
        page: "practice.html",
        c: "ink",
        href: U("practice.html"),
        head: "Make a practice set",
        body: "Pick topics and how many, and work through them one at a time."
      });
    }
    return out.slice(0, 2);
  }

  function fullSummary(now) {
    var s = summary(now);
    s.suggestions = suggest(s);
    s.tutor = tutorSummary();
    return s;
  }

  function exportCSV() {
    function cell(v) { v = String(v === undefined || v === null ? "" : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var rows = [
      ["time", "date", "topic", "page", "problem", "verdict", "first_try", "hinted", "in_a_practice_set", "link"]
    ];
    entries().forEach(function(e) {
      var d = new Date(e.time);
      rows.push([d.toISOString(), dayKey(e.time) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2),
        topic(e.page).name, e.page, e.text, e.verdict, e.firstTry ? "yes" : "no", e.hinted ? "yes" : "no", e.inSet ? "yes" : "no",
        U(e.page, e.params)
      ]);
    });
    return rows.map(function(r) { return r.map(cell).join(","); }).join("\r\n") + "\r\n";
  }

  /* ===================== the "Your practice" panel ===================== */
  var CSS =
    ".hp{background:var(--surface);border:1px solid var(--rule);border-radius:16px;box-shadow:var(--shadow);padding:20px 22px 18px;" +
    "display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:18px 28px;color:var(--ink)}" +
    "@media (max-width:820px){.hp{grid-template-columns:minmax(0,1fr)}}" +
    "@media (max-width:520px){.hp{padding:16px 16px 14px}}" +
    ".hp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-self:start}" +
    ".hp-stat{background:var(--surface-2);border-radius:12px;padding:11px 12px 10px;min-width:0}" +
    ".hp-stat b{display:block;font-family:var(--f-display);font-stretch:112%;font-weight:800;font-size:clamp(22px,3.4vw,28px);line-height:1.05;" +
    "letter-spacing:-.01em;font-variant-numeric:tabular-nums}" +
    ".hp-stat b small{font-size:.55em;font-weight:700;color:var(--ink-3);margin-left:2px}" +
    ".hp-stat span{display:block;font-size:12.5px;color:var(--ink-2);margin-top:3px;line-height:1.3}" +
    ".hp-lbl{font-family:var(--f-mono);font-size:10.5px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--ink-3);margin:0 0 8px}" +
    ".hp-topics{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}" +
    ".hp-topics li{display:grid;grid-template-columns:minmax(0,11.5em) minmax(0,1fr) auto;gap:10px;align-items:center;font-size:13.5px}" +
    ".hp-topics a{color:var(--ink);text-decoration:none;font-weight:600;display:flex;align-items:center;gap:7px;min-width:0}" +
    ".hp-topics a span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".hp-topics a:hover span{text-decoration:underline}" +
    ".hp-dot{width:9px;height:9px;border-radius:50%;background:var(--c);flex:none}" +
    ".hp-bar{height:9px;border-radius:999px;background:var(--surface-2);overflow:hidden}" +
    ".hp-bar i{display:block;height:100%;border-radius:999px;background:var(--c);min-width:3px}" +
    ".hp-n{font-family:var(--f-mono);font-size:12px;color:var(--ink-2);white-space:nowrap;font-variant-numeric:tabular-nums}" +
    ".hp-more{font-size:12.5px;color:var(--ink-3);margin:6px 0 0}" +
    ".hp-side{display:flex;flex-direction:column;gap:10px;min-width:0}" +
    ".hp-sug{display:block;text-decoration:none;color:inherit;border:1px solid var(--rule);border-left:4px solid var(--c);border-radius:6px 12px 12px 6px;" +
    "padding:10px 14px;background:var(--surface)}" +
    ".hp-sug:hover{border-color:var(--c)}" +
    ".hp-sug b{display:block;font-size:14.5px;font-weight:600}" +
    ".hp-sug span{display:block;font-size:13px;color:var(--ink-2);margin-top:2px}" +
    ".hp-foot{grid-column:1 / -1;display:flex;justify-content:space-between;gap:8px 16px;flex-wrap:wrap;align-items:center;" +
    "border-top:1px dashed var(--rule);padding-top:12px;font-size:13px;color:var(--ink-3)}" +
    ".hp-foot a{color:var(--ink);font-weight:600}" +
    ".hp-empty{grid-template-columns:minmax(0,1fr);text-align:left}" +
    ".hp-empty p{margin:0;color:var(--ink-2);font-size:15px;max-width:60ch}" +
    ".hp-empty .hp-acts{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}" +
    ".hp-empty .hp-acts a{font-size:14px;font-weight:600;color:var(--ink);text-decoration:none;border:1px solid var(--rule);border-radius:10px;" +
    "padding:8px 14px;background:var(--surface)}" +
    ".hp-empty .hp-acts a:hover{border-color:var(--ink-3)}" +
    ".hp a:focus-visible{outline:2.5px solid var(--c,var(--ink));outline-offset:2px;border-radius:6px}";

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function cvar(c) { return c === "ink" ? "var(--ink-2)" : "var(--" + c + ",var(--ink-2))"; }

  function ago(t, now) {
    if (!t) return "";
    var d = Math.round((startOfDay(now) - startOfDay(t)) / DAY);
    return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 7 ? d + " days ago" : new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function panelHTML(s, now) {
    if (!s.total) {
      return '<div class="hp hp-empty"><p>Use <b>Check my answer</b> on any page and your practice shows up here: how many days in a row, ' +
        "which topics, and how many you get right first time. It stays on this device.</p>" +
        '<div class="hp-acts"><a href="' + esc(U("practice.html")) + '">Make a practice set</a><a href="' + esc(U("pemdas.html", "practice=check")) + '">Try a problem</a>' +
        '<a href="' + esc(U("progress.html")) + '">Your progress page</a></div></div>';
    }
    var html = '<div class="hp"><div class="hp-main"><div class="hp-stats">' +
      '<div class="hp-stat"><b>' + s.streak + "<small>" + (s.streak === 1 ? "day" : "days") + "</small></b><span>" +
      (s.streak ? (s.practicedToday ? "in a row, today too" : "in a row — practice today to keep it") : "streak — practice today to start one") + "</span></div>" +
      '<div class="hp-stat"><b>' + s.week.problems + "</b><span>problem" + (s.week.problems === 1 ? "" : "s") + " in the last 7 days</span></div>" +
      '<div class="hp-stat"><b>' + s.rightFirstPct + "<small>%</small></b><span>right first time (" + s.rightFirst + " of " + s.problems + ")</span></div>" +
      '</div><div style="margin-top:16px"><p class="hp-lbl">By topic &middot; right first time</p><ul class="hp-topics">';
    s.topics.slice(0, 6).forEach(function(T) {
      html += '<li style="--c:' + cvar(T.c) + '"><a href="' + esc(U(T.page, "practice=check")) + '" title="' + esc(T.title) + '"><i class="hp-dot"></i><span>' + esc(T.name) + "</span></a>" +
        '<span class="hp-bar" role="img" aria-label="' + T.rightFirst + " of " + T.tried + ' right first time"><i style="width:' + T.rightFirstPct + '%"></i></span>' +
        '<span class="hp-n">' + T.rightFirst + "/" + T.tried + "</span></li>";
    });
    html += "</ul>" + (s.topics.length > 6 ? '<p class="hp-more">and ' + (s.topics.length - 6) + " more on your progress page</p>" : "") + "</div></div>";
    html += '<div class="hp-side"><p class="hp-lbl" style="margin:0">Keep going</p>';
    (s.suggestions || []).forEach(function(g) {
      html += '<a class="hp-sug" style="--c:' + cvar(g.c) + '" href="' + esc(g.href) + '"><b>' + esc(g.head) + "</b><span>" + esc(g.body) + "</span></a>";
    });
    html += "</div>";
    html += '<div class="hp-foot"><span>Last practiced ' + ago(s.last, now) + " &middot; " + s.days + " day" + (s.days === 1 ? "" : "s") +
      " in all" +
      (s.tutor && s.tutor.problems ? " &middot; Tutor me: " + s.tutor.picked + " of " + s.tutor.moves + " moves picked first time" : "") +
      " &middot; kept on this device only</span>" +
      '<a href="' + esc(U("progress.html")) + '">See all your progress <span aria-hidden="true">→</span></a></div></div>';
    return html;
  }
  var styled = false;

  function drawPanel() {
    var host = document.getElementById("progressPanel");
    if (!host) return;
    if (!styled) {
      var st = document.createElement("style");
      st.textContent = CSS;
      document.head.appendChild(st);
      styled = true;
    }
    var now = Date.now();
    try { host.innerHTML = panelHTML(fullSummary(now), now); } catch (e) { host.innerHTML = ""; }
  }

  /* ===================== wiring ===================== */
  document.addEventListener("helper:checked", function(e) { try { record(e.detail); } catch (x) {} });
  document.addEventListener("helper:tutored", function(e) { try { recordTutor(e.detail); } catch (x) {} });
  document.addEventListener("helper:progress", drawPanel);
  window.addEventListener("storage", function(e) {
    if (e.key === KEY || e.key === null) {
      cache = null;
      drawPanel();
    }
  });
  window.HelperProgress = {
    record: record,
    entries: entries,
    summary: fullSummary,
    clear: clear,
    exportCSV: exportCSV,
    topics: TOPICS.map(function(t) { return { page: t.page, name: t.name, title: t.title, c: t.c }; }),
    topic: topic,
    link: link,
    problems: function() { return problems(read()); },
    dayKey: dayKey,
    recordTutor: recordTutor,
    tutorEntries: tutorEntries,
    reload: function() { cache = null; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", drawPanel);
  else drawPanel();
})();
