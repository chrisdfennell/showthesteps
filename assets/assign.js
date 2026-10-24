/* "Add to assignment": a button beside Copy link on every helper page (tools.js loads this file).
   It puts THE PROBLEM ON THE SCREEN, by its link (this page and its address, without practice/embed/theme), into the
   assignment the teacher is building on this device, and shows how many are in it, with a link to the builder
   (practice/sets.html?assignment). Nothing leaves the browser: the draft is kept in localStorage["assignment-draft"]:
     { v:1, items:[ { p:"fractions", q:"mode=simplify&q=18%2F24", t:"18/24", at:time added }, … ],
       title, instr, due:"2026-10-30", steps:true, retries:true }
   p is the page's short name without .html (the name practice sets use), q its address, t a readable label.
   sets.html reads and edits the same draft (reorder, remove, title, instructions, due date, options, Share).
   HelperAssign.load() / .save(d) / .add(page, params, label) / .count() / .builder() for other pages. */
(function() {
  "use strict";
  if (window.HelperAssign) return;
  var KEY = "assignment-draft",
    MAX = 100;
  var SITE = window.HelperSite;

  function U(name, params) { return SITE ? SITE.url(name, params) : name + (params ? "?" + params : ""); }

  function load() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && typeof v === "object" && Array.isArray(v.items)) {
        v.items = v.items.filter(function(x) { return x && typeof x.p === "string" && typeof x.q === "string"; });
        return v;
      }
    } catch (e) {}
    return { v: 1, items: [] };
  }

  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }

  function clean(search) {
    return String(search || "").replace(/^\?/, "").split("&").filter(function(kv) { return kv && !/^(practice|embed|theme)=/.test(kv); }).join("&");
  }

  function labelOf(params) {
    var bits = [],
      q = "";
    String(params || "").split("&").forEach(function(kv) {
      if (!kv) return;
      var i = kv.indexOf("="),
        k = i < 0 ? kv : kv.slice(0, i),
        v = i < 0 ? "" : kv.slice(i + 1);
      try { v = decodeURIComponent(v.replace(/\+/g, " ")); } catch (e) {}
      if (k === "q") q = v;
      else bits.push(k === "mode" || k === "shape" ? v : k + " " + v);
    });
    return (q || bits.join(" · ")).slice(0, 120);
  }
  // the label kept with a problem: what was typed (q=…); otherwise the builder words it from the link itself
  function itemLabel(params) { return /(?:^|&)q=/.test(params) ? labelOf(params) : ""; }
  // → "added", "already" or "full" (or "error" when the device won't keep it)
  function add(page, params, label) {
    var d = load(),
      p = String(page || "").replace(/\.html$/, ""),
      q = clean(params);
    if (!p) return "error";
    if (d.items.some(function(x) { return x.p === p && x.q === q; })) return "already";
    if (d.items.length >= MAX) return "full";
    d.items.push({ p: p, q: q, t: String(label === undefined ? itemLabel(q) : label).slice(0, 140), at: Date.now() });
    return save(d) ? "added" : "error";
  }

  function count() { return load().items.length; }

  function builder() { return U("practice.html", "assignment"); }

  /* ---- problem banks by standard: HelperAssign.bank("6.RP.A.3,6.RP.A.2", 10[, titleMax]) ----
     The Standards page, the Worksheet Maker (worksheets.html?std=…&n=…) and the assignment builder
     (sets.html?assignment&std=…&n=…) all use it. Needs standards.js (HelperStandards). For each standard: the helper
     tabs that practice it (HelperStandards.pagesFor), as worksheet sections { page:"ratios.html", count, opts }, with
     n problems split across them (n for each standard). A standard with more tabs than problems gets one problem from
     each of n tabs, taken a helper at a time. → { codes, unknown:[codes not on the list], secs:[…], none:[{ code, pages }]
     (no tab of theirs can make problems), left:[{ code, name, tab }] (tabs left out; capped: to keep to 12 sections), notes:[beyond-Common-Core notes],
     title } */
  // a tab's worksheet mode, where the helper names it differently (the others use the tab's key); null: makes no problems
  var BANK_MODE = {
    addition: { dec: "decimals", frac: "fractions" },
    subtraction: { dec: "decimals", frac: "fractions" },
    multiplication: { dec: "decimals", frac: "fractions" },
    division: { remainder: "decimals", fraction: "decimals", decimal: "decimals", "": "fractions" },
    graphing: { free: null }
  };
  // options for a tab ("page|tab") or a whole helper ("page"), first for every standard ("*"), then for one standard
  var BANK_OPTS = {
    "*": { "division|fraction": { ans: "fraction" }, "division|decimal": { ans: "decimal" } },
    "1.OA.A.1": { wordproblems: { mode: "addsub", size: "small" } },
    "2.OA.A.1": { wordproblems: { mode: "addsub" } },
    "3.OA.A.3": { wordproblems: { mode: "groups" } },
    "3.OA.D.8": { wordproblems: { mode: "twostep" } },
    "4.OA.A.2": { wordproblems: { mode: "times" } },
    "4.OA.A.3": { wordproblems: { mode: "remainder" }, "number-sense|estimate": { digits: "3" } },
    "6.RP.A.3": { wordproblems: { mode: "rate" }, "fractions|convert": { convertTo: "percent" } },
    "1.NBT.B.3": { "number-sense|compare": { numbers: "whole" } },
    "1.NBT.C.5": { "number-sense|place": { task: "more", size: "2" } },
    "1.MD.B.3": { "number-sense|time": { clock: "read", prec: "half" } },
    "2.NBT.A.1": { "number-sense|place": { task: "value", size: "3" } },
    "2.NBT.A.2": { "number-sense|skip": { skip: "count", by: "any" } },
    "2.NBT.A.3": { "number-sense|place": { size: "3" } },
    "2.NBT.A.4": { "number-sense|compare": { numbers: "whole" } },
    "2.NBT.B.5": { "addition|dec": { digits: 2, places: 0 }, "subtraction|dec": { digits: 2, places: 0 } },
    "2.NBT.B.7": { "addition|dec": { digits: 3, places: 0 }, "subtraction|dec": { digits: 3, places: 0 } },
    "2.NBT.B.8": { "number-sense|place": { task: "more", size: "3" } },
    "2.OA.C.3": { "number-sense|skip": { skip: "evenodd" } },
    "2.MD.C.7": { "number-sense|time": { clock: "read", prec: "five" } },
    "3.NBT.A.1": { "number-sense|round": { to: "ten" }, "number-sense|estimate": { digits: "2" } },
    "3.NBT.A.2": { "addition|dec": { digits: 3, places: 0 }, "subtraction|dec": { digits: 3, places: 0 } },
    "3.OA.C.7": { "multiplication|dec": { tables: true }, "division|remainder": { dividend: 2, divisor: 1, rem: "none" } },
    "3.MD.A.1": { "number-sense|time": { clock: "elapsed", prec: "minute" } },
    "3.MD.C.7": { "geometry|area": { shape: "area:rect" } },
    "3.MD.D.8": { "geometry|area": { shape: "area:rect" } },
    "4.NBT.A.1": { "number-sense|place": { task: "value", size: "6" } },
    "4.NBT.A.2": { "number-sense|place": { size: "6" }, "number-sense|compare": { numbers: "whole" } },
    "4.NBT.A.3": { "number-sense|round": { to: "thousand" } },
    "4.NBT.B.4": { "addition|dec": { digits: 4, places: 0 }, "subtraction|dec": { digits: 4, places: 0 } },
    "4.NBT.B.5": { "multiplication|dec": { a: 4, b: 1, places: 0 } },
    "4.NBT.B.6": { "division|remainder": { dividend: 4, divisor: 1 } },
    "4.NF.B.3": { "addition|frac": { denoms: "like" }, "subtraction|frac": { denoms: "like" }, "fractions|convert": { convertFrom: "mixed", convertTo: "improper" } },
    "4.NF.C.5": { "fractions|convert": { convertFrom: "fraction", convertTo: "decimal" } },
    "4.NF.C.6": { "fractions|convert": { convertFrom: "fraction", convertTo: "decimal" } },
    "4.MD.A.2": { "number-sense|money": { money: "change" } },
    "4.MD.A.3": { "geometry|area": { shape: "area:rect" } },
    "4.MD.C.7": { "geometry|angle": { shape: "angle:line" } },
    "5.NBT.A.1": { "number-sense|place": { task: "value", decimals: "2" } },
    "5.NBT.A.2": { "exponents|eval": { tens: true, negBase: false, negExp: false } },
    "5.NBT.A.3": { "number-sense|place": { decimals: "3" }, "number-sense|compare": { numbers: "decimals" }, "fractions|compare": { compareDecimals: true } },
    "5.NBT.A.4": { "number-sense|round": { to: "hundredth" } },
    "5.NBT.B.5": { "multiplication|dec": { a: 3, b: 2, places: 0 } },
    "5.NBT.B.6": { "division|remainder": { dividend: 4, divisor: 2 } },
    "5.NBT.B.7": { "addition|dec": { places: 2 }, "subtraction|dec": { places: 2 }, "multiplication|dec": { places: 1 }, "division|decimal": { dec: "dividend" } },
    "5.NF.B.3": { "fractions|convert": { convertFrom: "improper", convertTo: "mixed" } },
    "5.NF.B.6": { "multiplication|frac": { kind: "mixed" } },
    "5.MD.C.3": { "geometry|vol": { shape: "vol:box" } },
    "5.MD.C.5": { "geometry|vol": { shape: "vol:box" } },
    "6.NS.A.1": { division: { kind: "mixed" } },
    "6.NS.B.2": { "division|remainder": { dividend: 5, divisor: 2 } },
    "6.NS.B.3": { "addition|dec": { digits: 3, places: "mixed" }, "subtraction|dec": { digits: 3, places: "mixed" }, "multiplication|dec": { places: 2 }, "division|decimal": { dec: "divisor" } },
    "6.EE.A.1": { pemdas: { exp: true }, "exponents|eval": { negExp: false } },
    "6.EE.B.7": { "algebra|solve": { oneStep: true, twoStep: false, bothSides: false } },
    "6.EE.B.8": { "algebra|ineq": { oneStep: true, twoStep: false, flip: false } },
    "6.G.A.2": { "geometry|vol": { shape: "vol:box", dec: "dec" } },
    "7.G.B.4": { "geometry|area": { shape: "area:circle" } },
    "7.EE.B.4": { "algebra|solve": { oneStep: false, twoStep: true, bothSides: false }, "algebra|ineq": { oneStep: false, twoStep: true } },
    "7.NS.A.2": { "fractions|convert": { convertFrom: "fraction", convertTo: "decimal", convertRepeating: true } },
    "8.NS.A.1": { "fractions|convert": { convertFrom: "decimal", convertTo: "fraction", convertRepeating: true } },
    "8.EE.C.7": { "algebra|solve": { bothSides: true, parens: true } },
    "HSS-ID.A.2": { "stats|spread": { sd: "pop" } }
  };

  function bankOpts(code, page, tab) {
    var M = BANK_MODE[page],
      mode = M && Object.prototype.hasOwnProperty.call(M, tab) ? M[tab] : tab;
    if (mode === null) return null;
    var o = {},
      key = tab ? page + "|" + tab : page;
    if (mode) o.mode = mode;
    [BANK_OPTS["*"][key], (BANK_OPTS[code] || {})[key]].forEach(function(x) { if (x) Object.keys(x).forEach(function(k) { o[k] = x[k]; }); });
    return o;
  }

  function shortText(t, max) {
    var s = String(t || "").split(/,? e\.g\.,?|; |\. |: /)[0].replace(/\s*\([^)]*\)/g, "").replace(/[.\s]+$/, "");
    if (s.length <= max) return s;
    // cut at a comma, but not inside a list ("dimes, nickels, and pennies")
    var parts = s.split(", "),
      acc = parts[0],
      best = "";
    for (var i = 1; i < parts.length && acc.length <= max; i++) {
      if (acc.length >= 25 && parts[i].split(" ").length > 2 && !/^(and|or) /.test(parts[i])) best = acc;
      acc += ", " + parts[i];
    }
    if (best) return best;
    var c = s.lastIndexOf(" ", max - 1);
    return s.slice(0, c > 10 ? c : max - 1).replace(/(?:[,;:=]|\s+(?:and|or|the|a|an|of|to|in|on|by|for|with|from|as|at|that|is|are|=))+$/i, "") + "…";
  }

  function bank(codes, n, titleMax) {
    var HS = window.HelperStandards,
      out = { codes: [], unknown: [], secs: [], none: [], left: [], capped: false, notes: [], title: "" };
    if (!HS) return out;
    n = Math.max(1, Math.min(40, parseInt(n, 10) || 10));
    titleMax = titleMax || 80;
    String(codes || "").split(/[\s,]+/).filter(Boolean).forEach(function(c) {
      var s = HS.byCode(c) || HS.byCode(c.toUpperCase());
      if (!s) out.unknown.push(c);
      else if (out.codes.indexOf(s.code) < 0 && out.codes.length < 12) out.codes.push(s.code);
    });
    var per = Math.max(1, Math.floor(12 / Math.max(1, out.codes.length))),
      at = {};
    out.codes.forEach(function(code) {
      var pages = HS.pagesFor(code),
        cands = [];
      pages.forEach(function(p) {
        var o = bankOpts(code, p.page, p.mode);
        if (o) cands.push({ page: p.page, tab: p.mode, name: p.name, tabName: p.modeName, opts: o });
      });
      // Scratch Paper works the same sums as the arithmetic helpers, by hand: only when nothing else does
      if (cands.some(function(c) { return c.page !== "scratch"; })) cands = cands.filter(function(c) { return c.page !== "scratch"; });
      if (!cands.length) { out.none.push({ code: code, pages: pages }); return; }
      // a helper at a time: the first tab of each helper, then the second of each…
      var order = [],
        seen = {};
      cands.forEach(function(c) {
        if (!seen[c.page]) {
          seen[c.page] = 1;
          order.push(c.page);
        }
      });
      var picked = [];
      for (var round = 0; picked.length < cands.length; round++) {
        order.forEach(function(pg) {
          var mine = cands.filter(function(c) { return c.page === pg; });
          if (mine[round]) picked.push(mine[round]);
        });
      }
      var k = Math.min(per, n, picked.length),
        use = picked.slice(0, k);
      if (per < Math.min(n, picked.length)) out.capped = true;
      picked.slice(k).forEach(function(c) { out.left.push({ code: code, name: c.name, tab: c.tabName }); });
      use = cands.filter(function(c) { return use.indexOf(c) >= 0; }); // back in the helpers' order
      use.forEach(function(c, i) {
        // a helper's "beyond Common Core" note, when it's about most of the helper (not one tab the standards never pick)
        var note = HS.beyond(c.page),
          pg = HS.pages.filter(function(x) { return x.id === c.page; })[0],
          bare = pg ? pg.modes.filter(function(m) { return !m.codes.length; }).length : 0;
        if (note && (bare * 2 >= pg.modes.length || /\bmost\b/i.test(note)) && out.notes.indexOf(c.name + ": " + note) < 0) out.notes.push(c.name + ": " + note);
        var count = Math.floor(n / k) + (i < n % k ? 1 : 0),
          id = c.page + "|" + JSON.stringify(c.opts);
        if (at[id] !== undefined) { out.secs[at[id]].count = Math.min(40, out.secs[at[id]].count + count); return; }
        at[id] = out.secs.length;
        out.secs.push({ page: c.page + ".html", count: count, opts: c.opts, code: code, name: c.name, tab: c.tabName });
      });
    });
    var one = out.codes.length === 1 ? HS.byCode(out.codes[0]) : null;
    out.title = one ? one.code + ": " + shortText(one.text, titleMax - one.code.length - 2) :
      shortText(out.codes.join(", "), titleMax);
    return out;
  }
  // what bank() made, in words (HTML paragraphs), for the box at the top of the Worksheet Maker and the assignment builder;
  // made: "10 problems on the sheet"; tail: one more paragraph, before the link back
  function bankHtml(B, made, tail) {
    var HS = window.HelperStandards,
      many = B.codes.length > 1,
      out = [];

    function e(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

    function tabName(name, tab) { return name + (tab ? ": " + tab : ""); }

    function link(p) { return '<a href="' + e(HS.pageUrl(p.page, p.mode ? "mode=" + encodeURIComponent(p.mode) : "")) + '">' + e(tabName(p.name, p.modeName)) + "</a>"; }
    if (B.secs.length) {
      out.push("<b>" + e(B.title) + "</b> — " + e(made) + ", from " + B.secs.map(function(s) {
        return (many ? e(s.code) + " " : "") + e(tabName(s.name, s.tab)) + " (" + s.count + ")";
      }).join(", ") + ".");
    }
    B.none.forEach(function(x) {
      out.push("<b>" + e(x.code) + "</b>: " + (x.pages.length ? "the helpers can’t make problems for it (" + x.pages.map(link).join(", ") + "). Practice it on the helper instead." :
        "no helper practices this standard yet."));
    });
    if (B.unknown.length) out.push("Not a standard on the list: " + B.unknown.map(function(c) { return "<b>" + e(c) + "</b>"; }).join(", ") + ".");
    if (B.left.length) {
      var L = B.left.map(function(x) { return (many ? e(x.code) + " " : "") + e(tabName(x.name, x.tab)); });
      out.push("Also practiced in " + (L.length > 5 ? L.slice(0, 4).join(", ") + " and " + (L.length - 4) + " more" : L.join(", ")) + ": " +
        (B.capped ? "left out to keep to 12 sections." : "ask for more problems to take them in too."));
    }
    B.notes.forEach(function(n) { out.push(e(n)); });
    if (tail) out.push(tail);
    if (HS) out.push('<a href="' + e(B.codes.length === 1 ? HS.url(B.codes[0]) : HS.pageUrl("standards")) + '">' + (B.codes.length === 1 ? "Back to " + e(B.codes[0]) : "Back to the standards") + "</a>");
    return out.map(function(p) { return "<p>" + p + "</p>"; }).join("");
  }
  window.HelperAssign = { KEY: KEY, load: load, save: save, add: add, count: count, builder: builder, label: labelOf, bank: bank, bankHtml: bankHtml };

  /* ---- the button, on the helper pages only ---- */
  function here() { return (SITE && SITE.here) || ""; }

  function isHelper() {
    var h = here();
    if (!h || !SITE) return false;
    return /^helpers\//.test(SITE.path(h)) || h === "flashcards.html";
  }
  var btn = null,
    link = null,
    timer = 0;

  function paintCount() {
    if (!link) return;
    var n = count();
    link.hidden = !n;
    link.textContent = n + " in your assignment";
    link.href = builder();
    link.title = "Open the assignment builder: put the problems in order, add a due date and share one link";
  }

  function onAdd() {
    var page = here(),
      what = add(page, location.search);
    var txt = { added: "Added ✓", already: "Already in it ✓", full: "Assignment full (100)", error: "Couldn’t save it here" } [what] || "Added ✓";
    btn.textContent = txt;
    clearTimeout(timer);
    timer = setTimeout(function() { btn.textContent = "Add to assignment"; }, 2200);
    paintCount();
  }

  function setup() {
    if (!isHelper() || document.getElementById("htAssign")) return;
    var copy = document.getElementById("copyBtn");
    if (!copy) return;
    var st = document.createElement("style");
    st.textContent = "a.ha-count{font-size:13px;font-weight:600;color:var(--ink-2);text-decoration:underline;text-underline-offset:2px;white-space:nowrap;align-self:center}" +
      "a.ha-count:hover{color:var(--ink)}a.ha-count[hidden]{display:none}" +
      "@media print{#htAssign,a.ha-count{display:none !important}}";
    document.head.appendChild(st);
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "htAssign";
    btn.className = copy.className;
    btn.textContent = "Add to assignment";
    btn.title = "Add this problem, just as it is, to the assignment you’re building on this device";
    btn.addEventListener("click", onAdd);
    link = document.createElement("a");
    link.className = "ha-count";
    copy.parentNode.insertBefore(btn, copy.nextSibling);
    btn.parentNode.insertBefore(link, btn.nextSibling);
    paintCount();
    window.addEventListener("storage", function(e) { if (!e.key || e.key === KEY) paintCount(); });
    window.addEventListener("pageshow", paintCount);
  }
  try {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
    else setup();
  } catch (e) { if (window.console) console.warn("assign.js:", e); }
})();
