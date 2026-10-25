/* Photo of the problem: a camera button by the problem box on every helper page and by the home page's search box.
   Take a photo (phones), pick a picture or screenshot, paste one into the box, or drop one on it: the writing in it is
   read on this device and put into the box, where the page reads it as if it had been typed.
   - The picture never leaves the device. The reading engine (Tesseract.js and its English data, about 7 MB, from
     jsDelivr) is downloaded only the first time a picture is read; the browser keeps it after that. A page in another
     language reads with that language's data when its locale file names it ("photo.ocrLang": "spa" in es.js; it reads
     digits and math as well as the English data does, and the words with their accents and ¿ ¡).
   - The words it shows are in the visitor's language (assets/i18n.js, the photo.* keys); English when there is none.
   - If the browser has its own text reader (TextDetector, behind a flag in Chrome), that is tried first.
   - What was read is tidied up for math (× ÷ − ½, 1 for l, 0 for O inside numbers, question numbers like "3."), and
     shown in the box so it can be fixed.
   tools.js loads this file (not in embeds, worksheets, practice sets or the self-test). ES5, and wrapped so a problem
   here can never break the page. For the tests: HelperPhoto.clean(text, keepBreaks) is the tidying, .prepare(file) the
   picture as it is given to the reader, .last() what the reader made of the last one. */
(function() {
  "use strict";
  if (window.HelperPhoto) return;

  var TESS = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
  var TESS_SRI = "sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F";
  var ENGINE = {
    workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js",
    corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1",
    langPath: "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int"
  };
  /* the reading data: English, or the language of the page when its locale file names Tesseract's data for it
     ("photo.ocrLang": "spa"), from the same place (@tesseract.js-data/<code>) */
  function ocrLang() {
    var I = window.HelperI18n,
      c = foreign() && I.has && I.has("photo.ocrLang") ? String(I.raw("photo.ocrLang") || "") : "";
    return /^[a-z]{3}(_[a-z]{3,4})?$/.test(c) ? c : "eng";
  }

  function langPath(code) { return code === "eng" ? ENGINE.langPath : "https://cdn.jsdelivr.net/npm/@tesseract.js-data/" + code + "@1.0.0/4.0.0_best_int"; }
  var root = document.documentElement;

  function warn(e) { if (window.console) console.warn("photo.js:", e); }

  function safe(fn) { return function() { try { return fn.apply(this, arguments); } catch (e) { warn(e); } }; }

  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html) x.innerHTML = html; return x; }

  function fire(box, type) { box.dispatchEvent(new Event(type, { bubbles: true })); }

  /* ---- the words, in the visitor's language (assets/i18n.js): the photo.* keys, and en.js repeats the English for
     translators. English always shows the words written here; so does a page without i18n.js. ---- */
  function tr(key, en, vars) {
    var I = window.HelperI18n;
    if (I && I.lang !== "en" && I.t) {
      var s = I.t(key, vars);
      if (s !== key) return s;
    }
    return vars ? fillIn(en, vars) : en;
  }

  function fillIn(s, vars) { return String(s).replace(/\{(\w+)\}/g, function(m, k) { return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m; }); }

  function foreign() { return !!(window.HelperI18n && window.HelperI18n.lang && window.HelperI18n.lang !== "en"); }

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

  // a button's words as they read on screen ("Show the steps", without its arrow)
  function label(b) {
    if (!b) return "";
    var c = b.cloneNode(true);
    [].forEach.call(c.querySelectorAll('[aria-hidden="true"], svg'), function(x) { x.parentNode.removeChild(x); });
    return c.textContent.replace(/\s+/g, " ").trim();
  }

  function visible(x) { return !!x && x.offsetParent !== null; }
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  /* ===================== tidying what was read ===================== */
  var VULGAR = {
    "½": "1/2",
    "⅓": "1/3",
    "⅔": "2/3",
    "¼": "1/4",
    "¾": "3/4",
    "⅕": "1/5",
    "⅖": "2/5",
    "⅗": "3/5",
    "⅘": "4/5",
    "⅙": "1/6",
    "⅚": "5/6",
    "⅛": "1/8",
    "⅜": "3/8",
    "⅝": "5/8",
    "⅞": "7/8",
    "⅐": "1/7",
    "⅑": "1/9",
    "⅒": "1/10"
  };
  // a question number at the start of a line: "3.", "3)", "(3)", "#3", "Q3:", "Problem 3.", "b)"
  var QNUM = /^\s*(?:(?:problem|question|exercise|ex|no|q)\.?\s*#?\s*\d{1,3}\s*[.:)]?|#\s*\d{1,3}[.:)]?|\(?\d{1,3}\s*[.)]|\(?[a-h]\))(?=\s)\s*/i;
  var BAR = /^(?:[\s\-–—−_=~.·]{2,}|[\-–—−_])$/; // a line drawn under a sum, or a fraction bar
  var MATHWORDS = /^(solve|find|simplify|evaluate|factor|expand|graph|what|is|of|the|and|for|if|work|out|show|your|answer|calculate|compute|value|write|each|name|date)$/i;
  // in another language, its words too (a page in Spanish: "Problema 3.", "Resuelve", "¿Cuánto es…?"); photo.re.* keys
  function langRe(key, wrap) {
    if (!foreign()) return null;
    var I = window.HelperI18n;
    try {
      var src = I.has(key) ? I.raw(key) : "";
      return src && typeof src === "string" ? new RegExp(wrap.replace("@", function() { return src; }), "i") : null;
    } catch (e) { return null; }
  }
  var QNUM_L = null,
    MATH_L = null,
    QWORD_L = null;

  function langWords() {
    if (QNUM_L !== null || !foreign()) return;
    QNUM_L = langRe("photo.re.qnum", "^\\s*(?:(?:@)\\.?\\s*#?\\s*\\d{1,3}\\s*[.:)]?)(?=\\s)\\s*") || false;
    MATH_L = langRe("photo.re.mathWords", "^(?:@)$") || false;
    QWORD_L = langRe("photo.re.question", "^(?:¿|(?:@)(?![a-zà-ÿ]))") || false;
  }

  function isQnum(l) { return QNUM.test(l) || (!!QNUM_L && QNUM_L.test(l)); }

  function dropQnum(l) { return QNUM.test(l) ? l.replace(QNUM, "") : QNUM_L && QNUM_L.test(l) ? l.replace(QNUM_L, "") : l; }

  function nineFix(t) {
    return t.replace(/(^|[\s(])[gq](?=\s+[A-Za-z]{3,})/g, function(m, pre, at, all) {
      return /\d\s*$/.test(all.slice(0, at)) ? m : pre + "9"; // "5 g of salt" stays
    });
  }

  function numFix(t) {
    // inside a number: l, I and | are 1; O and o are 0; § is 5 ("1O5" → 105, "l2" → 12), but not the letters of a word
    // that runs on from it ("10lbs", "Pool 10")
    return t.replace(/[0-9OolI|§]+(?:[.,][0-9OolI|§]+)*/g, function(tok, at, all) {
      if (!/\d/.test(tok)) return tok;
      var head = "",
        tail = "";
      if (/[A-Za-z]/.test(all.charAt(at - 1))) {
        head = /^[OolI|]*/.exec(tok)[0];
        tok = tok.slice(head.length);
      }
      if (/[A-Za-z]/.test(all.charAt(at + head.length + tok.length))) {
        tail = /[OolI|]*$/.exec(tok)[0];
        tok = tok.slice(0, tok.length - tail.length);
      }
      return head + tok.replace(/[Oo]/g, "0").replace(/[lI|]/g, "1").replace(/§/g, "5") + tail;
    });
  }

  function isStory(lines) {
    var words = lines.join(" ").match(MATH_L ? /[A-Za-zÀ-ÖØ-öø-ÿ]{3,}/g : /[A-Za-z]{3,}/g) || [];
    return words.filter(function(w) { return !MATHWORDS.test(w) && !(MATH_L && MATH_L.test(w)); }).length >= 5;
  }

  function tidyMath(t) {
    t = numFix(t);
    t = t.replace(/[−–—‒]/g, "-")
      .replace(/(\d|\))\s+[xX×*]\s+(?=[\d(])/g, "$1 × ") // 125 x 12 → 125 × 12 (the letter x has no spaces around it)
      .replace(/(\d|\))\s*[×*]\s*(?=[\d(])/g, "$1 × ")
      .replace(/(\d)\s*÷\s*(?=[\d(])/g, "$1 ÷ ")
      .replace(/(^|[\s(+\-=\d])([xXy])([23])(?=[\s)+\-=]|$)/g, function(m, pre, v, p, at, all) { // x2 + 5x + 6 = 0: the small 2 read as a plain one
        return /=/.test(all) || (all.match(/[xy]/gi) || []).length > 1 ? pre + v.toLowerCase() + "^" + p : m;
      })
      .replace(/_{2,}/g, " ") // answer blanks
      .replace(/(\d)X(?![\dA-Za-z(])/g, function(m, d, i, all) { return /=/.test(all) ? d + "x" : m; }) // 5X + 6 = 0
      .replace(/\s*=\s*(?:\?|□|\.{2,}|…)?\s*$/, function(m, i, all) { return /=/.test(all.slice(0, i)) || /[a-z]/i.test(all.slice(0, i).replace(/\b(solve|find|simplify|evaluate)\b/ig, "")) ? m : ""; }) // 47 + 38 = ? → 47 + 38
      .replace(/\s+([,;])/g, "$1")
      .replace(/^[|!]\s+|\s+[|]$/g, "");
    return t.replace(/\s+/g, " ").trim();
  }

  function tidyStory(t) {
    // numbers in a story only: "l2 apples" → 12 apples, "$4.5O" → $4.50
    t = numFix(nineFix(t)).replace(/(\d)\s+[xX×]\s+(?=\d)/g, "$1 × ").replace(/[ \t]+/g, " ").replace(/ ([,.;:?!])/g, "$1").trim();
    // a question mark read as an apostrophe: "How many apples does she have now’"
    var q = /(?:^|[.!?]\s+)([^.!?]*)[’'`"”]$/.exec(t);
    if (q && (/^(how|what|which|who|when|where|why|can|could|does|do|did|is|are|was|will|would)\b/i.test(q[1]) || (QWORD_L && QWORD_L.test(q[1])))) t = t.slice(0, -1) + "?";
    return t;
  }
  /* raw text → { text, problems:[...] } (more than one when the picture holds a numbered list) */
  function cleanAll(raw, keepBreaks) {
    langWords();
    var t = String(raw || "").replace(/\r\n?/g, "\n")
      .replace(/[‘’‛]/g, "'").replace(/[“”]/g, "\"")
      .replace(/[⁄∕]/g, "/").replace(/[•∙⋅]/g, "·").replace(/[✕✖]/g, "×").replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl")
      .replace(/(\d)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅐⅑⅒])/g, "$1 $2")
      .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅐⅑⅒]/g, function(c) { return VULGAR[c]; })
      .replace(/\u00A0/g, " ");
    var lines = t.split("\n").map(function(l) { return l.replace(/[ \t]+/g, " ").trim(); });
    // a fraction set on three lines (3 / bar / 4) → 3/4; a bar under a sum is dropped
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (BAR.test(l) && l.replace(/\s/g, "").length >= 1) {
        var a = out.length ? out[out.length - 1] : "",
          b = lines[i + 1] || "";
        if (/^-?\d{1,6}$/.test(a) && /^\d{1,6}$/.test(b)) {
          out[out.length - 1] = a + "/" + b;
          i++;
          continue;
        }
        out.push(""); // keeps a paragraph break where the bar was
        continue;
      }
      if (l && !/[A-Za-z0-9½]/.test(l) && !/[+\-×÷=<>%$]/.test(l)) l = ""; // specks read as punctuation
      l = l.replace(/^(?:[:;,'"|`~_©®°•*«»‘’“”]|\.(?!\d)|\s)+/, ""); // and specks in front of a line
      out.push(l);
    }
    lines = out;
    var seq = [],
      LEAD = /^\(?(\d{1,2})[.)]\s*(?=\S)/;
    lines.forEach(function(l, j) { var m = LEAD.exec(l); if (m) seq.push({ j: j, n: +m[1] }); });
    if (seq.length >= 2 && seq.every(function(e, j) { return j === 0 || (e.n > seq[j - 1].n && e.n <= seq[j - 1].n + 2); })) // 1, 2, 3 (or 1, 3: a line not read)
      seq.forEach(function(e) { lines[e.j] = lines[e.j].replace(LEAD, "$1. "); });
    // a numbered list ("1. 47 + 38", "2. 56 + 27"): one problem each, with any lines that run on
    var nums = lines.filter(isQnum).length,
      groups = [];
    if (nums >= 2) {
      var cur = null;
      lines.forEach(function(l) {
        if (isQnum(l)) {
          cur = [dropQnum(l)];
          groups.push(cur);
        } else if (cur && l) cur.push(l);
        else if (cur && !l && cur[cur.length - 1] !== "") cur.push("");
      });
    } else {
      var all = lines.slice();
      var first = 0;
      while (first < all.length && !all[first]) first++;
      if (first < all.length) all[first] = dropQnum(all[first]);
      groups.push(all);
    }
    var problems = groups.map(function(g) {
      while (g.length && !g[g.length - 1]) g.pop();
      while (g.length && !g[0]) g.shift();
      var story = isStory(g);
      if (!story) return tidyMath(g.filter(Boolean).join(" "));
      // a story: lines that wrap are joined; a blank line (a new paragraph) stays a line break in a big box
      var paras = [],
        p = [];
      g.forEach(function(l) {
        if (l) p.push(l);
        else if (p.length) {
          paras.push(p);
          p = [];
        }
      });
      if (p.length) paras.push(p);
      return paras.map(function(pp) {
        return tidyStory(pp.join("\n").replace(/([A-Za-z])-\n(?=[a-z])/g, "$1").replace(/\n/g, " "));
      }).join(keepBreaks ? "\n" : " ");
    }).filter(function(s) { return /[A-Za-z0-9]/.test(s); });
    return { text: problems[0] || "", problems: problems };
  }

  function clean(raw, keepBreaks) { return cleanAll(raw, keepBreaks).text; }

  /* ===================== where the button goes on this page ===================== */
  // spot: box() → the box to fill (now), go → what to press after checking ("" when the page works it out as you type)
  function findSpot() {
    var ask = document.getElementById("askIn");
    if (ask) { // the home page
      var row = ask.closest(".ask-row") || ask.parentNode,
        form = ask.form || row;
      return {
        box: function() { return ask; },
        go: "Show the steps",
        goBtn: function() { return row.querySelector(".go-btn") || (form.querySelector ? form.querySelector('button[type="submit"]') : null); },
        drop: row,
        place: function(b) {
          row.insertBefore(b, row.querySelector(".go-btn"));
          row.classList.add("ht-cam-row");
        },
        status: function(s) { form.parentNode.insertBefore(s, form.nextSibling); }
      };
    }
    var prob = document.querySelector(".problem");
    if (!prob) return null;
    // Carry Column, Borrow Bank, Times Table, Division House: small boxes for each number, and a fractions mode;
    // a whole problem typed into the first box is read as one (the page's "change"), so that's where it goes
    var dec = document.getElementById("decEntry"),
      frac = document.getElementById("fracEntry");
    if (dec && frac && dec.querySelector("input")) {
      return {
        split: true,
        go: "",
        drop: prob,
        box: function() { return dec.querySelector("input"); },
        ready: function() { // in fractions mode: back to the first box (the page then
          if (visible(dec)) return; // goes to whichever mode the problem needs)
          var m = prob.querySelector('[data-mode="dec"], [data-nums="dec"]');
          if (m) m.click();
        },
        place: function(b) {
          var holders = [dec, frac].filter(Boolean);
          holders.forEach(function(h, i) {
            var bb = i === 0 ? b : cloneBtn(b);
            h.appendChild(bb);
            // the page redraws its boxes (adding a number); put the button back at the end
            new MutationObserver(function() { if (bb.parentNode !== h || h.lastElementChild !== bb) h.appendChild(bb); })
              .observe(h, { childList: true });
          });
        },
        status: function(s) {
          var last = frac || dec;
          last.parentNode.insertBefore(s, last.nextSibling);
        }
      };
    }
    var cands = [].filter.call(prob.querySelectorAll("textarea, input.q-in, input.expr-in"), function(x) {
      return !x.readOnly && !x.disabled && !/^ck/i.test(x.id || "") && !x.classList.contains("ck-in") && !x.closest(".maker, details, form[id^=ck]");
    });
    var box = cands[0];
    if (box) {
      var parent = box.parentNode,
        cs = getComputedStyle(parent),
        inRow = /flex/.test(cs.display) && !/column/.test(cs.flexDirection);
      var go = "";
      var start = parent.querySelector("button.go");
      if (start) go = start.textContent.trim(); // Scratch Paper: Start
      return {
        box: function() { return box; },
        go: go,
        goBtn: function() { return start && start.isConnected ? start : null; },
        drop: inRow ? parent : null,
        place: function(b) {
          if (inRow) { parent.insertBefore(b, box.nextSibling); return; }
          var w = el("span", "ht-cam-wrap" + (box.tagName === "TEXTAREA" ? " top" : ""));
          parent.insertBefore(w, box);
          w.appendChild(box);
          w.appendChild(b);
          this.drop = w;
        },
        status: function(s) {
          if (inRow) {
            var r = parent;
            r.parentNode.insertBefore(s, r.nextSibling);
          } else {
            var w = box.parentNode;
            w.parentNode.insertBefore(s, w.nextSibling);
          }
        }
      };
    }
    // no box for a typed problem here (the Area Box): the "Type any problem" box in the bar at the top
    var bar = document.querySelector(".ht-search input");
    if (!bar) return "wait";
    return {
      box: function() { return bar; },
      go: "Enter",
      drop: bar.parentNode,
      bar: true,
      place: function(b) { bar.parentNode.insertBefore(b, bar.nextSibling); },
      status: function(s) {
        var nav = document.querySelector(".sitenav");
        s.className += " ht-cam-float";
        if (nav) nav.parentNode.insertBefore(s, nav.nextSibling);
        else document.body.insertBefore(s, document.body.firstChild);
      }
    };
  }

  /* ===================== the button, the status line ===================== */
  var CAM = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.4-2h5.8l1.4 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.8" r="3.4"/></svg>';
  var CSS =
    ".ht-cam{flex:none;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;margin:0;" +
    "border:1px solid var(--rule);border-radius:10px;background:var(--surface);color:var(--ink-2);cursor:pointer;vertical-align:middle;" +
    "touch-action:manipulation}" +
    ".ht-cam:hover{color:var(--ink);border-color:var(--ink-3)}" +
    ".ht-cam:focus-visible{outline:2.5px solid var(--focus,var(--ink));outline-offset:2px}" +
    ".ht-cam svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
    ".ht-cam[aria-busy=\"true\"]{cursor:progress;opacity:.55}" +
    ".ht-search .ht-cam{width:30px;height:30px;border-radius:999px}.ht-search .ht-cam svg{width:17px;height:17px}" +
    ".ask-row .ht-cam{width:44px;height:44px;border-radius:12px}" +
    "@media (max-width:480px){.ht-cam-row>svg{display:none}.ask-row.ht-cam-row{padding-left:12px}}" + // room for the words in the box
    "#decEntry .ht-cam,#fracEntry .ht-cam{align-self:flex-end;margin:0 0 4px 6px}" +
    ".ht-cam-wrap{display:flex;align-items:center;gap:8px;min-width:0;width:100%}" +
    ".ht-cam-wrap>input,.ht-cam-wrap>textarea{flex:1 1 auto;min-width:0}" +
    ".ht-cam-wrap.top{align-items:flex-start}" +
    ".ht-cam-drop{outline:2px dashed var(--ink-3);outline-offset:4px;border-radius:8px}" +
    ".ht-cam-status{font-family:var(--f-body,\"IBM Plex Sans\",Arial,sans-serif);font-size:13.5px;line-height:1.45;color:var(--ink-2);margin:8px 0 0;text-align:left}" +
    ".ht-cam-status[hidden]{display:none}" +
    ".ht-cam-status.err{color:#B42318}" +
    ".ht-cam-status .ht-cam-pick{font:inherit;font-weight:600;color:var(--ink);background:var(--surface);border:1px solid var(--rule);" +
    "border-radius:999px;padding:2px 10px;margin:2px 4px 2px 0;cursor:pointer}" +
    ".ht-cam-status .ht-cam-pick[aria-pressed=\"true\"]{border-color:var(--ink-2);background:var(--surface-2,var(--surface))}" +
    ".ht-cam-float{max-width:min(560px,calc(100% - 32px));margin:8px auto 0;padding:8px 12px;border:1px solid var(--rule);border-radius:10px;background:var(--surface)}" +
    ".ht-cam-menu{position:absolute;z-index:90;display:flex;flex-direction:column;min-width:190px;padding:6px;background:var(--surface);" +
    "color:var(--ink);border:1px solid var(--rule);border-radius:12px;box-shadow:0 18px 36px -18px rgba(0,0,0,.55)}" +
    ".ht-cam-menu button{font-family:var(--f-body,Arial,sans-serif);font-size:15px;text-align:left;color:var(--ink);background:none;border:0;" +
    "border-radius:8px;padding:11px 12px;cursor:pointer}" +
    ".ht-cam-menu button:hover,.ht-cam-menu button:focus{background:var(--surface-2,rgba(127,127,127,.12));outline:none}" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]) .ht-cam-status.err{color:#FCA5A5}}" +
    ":root[data-theme=\"dark\"] .ht-cam-status.err{color:#FCA5A5}" +
    "html.embed .ht-cam,html.embed .ht-cam-status{display:none !important}" +
    "@media print{.ht-cam,.ht-cam-status,.ht-cam-menu{display:none !important}}";

  var spot = null,
    btns = [],
    statusEl = null,
    fileCam = null,
    filePick = null,
    busy = false,
    menu = null,
    hideTimer = null;

  function cloneBtn(b) {
    var c = b.cloneNode(true);
    c.removeAttribute("id");
    c.addEventListener("click", onButton);
    btns.push(c);
    return c;
  }

  function makeButton() {
    var b = el("button", "ht-cam", CAM);
    b.type = "button";
    b.setAttribute("aria-label", tr("photo.button", "Read the problem from a photo or picture"));
    b.title = coarse ? tr("photo.titleTouch", "Take a photo of the problem, or choose a picture") : tr("photo.title", "Read the problem from a picture or screenshot (you can also paste or drop one into the box)");
    b.addEventListener("click", onButton);
    btns.push(b);
    return b;
  }

  function fileInput(capture) {
    var f = el("input");
    f.type = "file";
    f.accept = "image/*";
    f.hidden = true;
    f.tabIndex = -1;
    f.setAttribute("aria-hidden", "true");
    if (capture) f.setAttribute("capture", "environment");
    f.addEventListener("change", safe(function() {
      var file = f.files && f.files[0];
      f.value = "";
      if (file) readFile(file);
    }));
    document.body.appendChild(f);
    return f;
  }

  var statusKind = ""; // "reading": the line that counts the percent up

  function setStatus(html, cls, keep) {
    if (!statusEl) return;
    statusKind = "";
    clearTimeout(hideTimer);
    statusEl.className = "ht-cam-status" + (spot && spot.bar ? " ht-cam-float" : "") + (cls ? " " + cls : "");
    statusEl.innerHTML = html;
    statusEl.hidden = !html;
    if (html && !keep && cls !== "busy") hideTimer = setTimeout(function() { statusEl.hidden = true; }, 20000);
  }

  function setBusy(on) {
    busy = on;
    btns.forEach(function(b) { b.setAttribute("aria-busy", String(on)); });
  }

  function closeMenu() {
    if (menu) {
      menu.remove();
      menu = null;
    }
  }

  function onButton(e) {
    if (e) e.stopPropagation();
    if (busy) {
      var kind = statusKind;
      setStatus(statusEl && !statusEl.hidden ? statusEl.innerHTML : tr("photo.still", "Still reading the last picture…"), "busy");
      if (statusEl && !statusEl.hidden) statusKind = kind;
      return;
    }
    var b = this;
    if (!coarse) { filePick.click(); return; }
    // phones and tablets: the camera, or a picture already on the device (a screenshot)
    if (menu) { closeMenu(); return; }
    menu = el("div", "ht-cam-menu");
    menu.setAttribute("role", "menu");
    menu.innerHTML = '<button type="button" role="menuitem" data-k="cam">' + tr("photo.take", "Take a photo") + '</button><button type="button" role="menuitem" data-k="pick">' + tr("photo.choose", "Choose a picture") + "</button>";
    document.body.appendChild(menu);
    var r = b.getBoundingClientRect(),
      w = menu.offsetWidth;
    menu.style.left = Math.max(8, Math.min(r.right + window.scrollX - w, window.scrollX + root.clientWidth - w - 8)) + "px";
    menu.style.top = (r.bottom + window.scrollY + 6) + "px";
    menu.addEventListener("click", function(ev) {
      var k = ev.target.closest("button");
      if (!k) return;
      closeMenu();
      (k.getAttribute("data-k") === "cam" ? fileCam : filePick).click();
    });
    menu.addEventListener("keydown", function(ev) {
      if (ev.key === "Escape") {
        closeMenu();
        b.focus();
      }
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault();
        var all = menu.querySelectorAll("button");
        (document.activeElement === all[0] ? all[1] : all[0]).focus();
      }
    });
    menu.querySelector("button").focus();
  }

  /* ===================== reading a picture ===================== */
  function bad(msg) {
    var e = new Error(msg);
    e.friendly = msg;
    return e;
  }

  function timeout(p, ms, msg) {
    return new Promise(function(res, rej) {
      var t = setTimeout(function() { rej(bad(msg)); }, ms);
      p.then(function(v) {
        clearTimeout(t);
        res(v);
      }, function(e) {
        clearTimeout(t);
        rej(e);
      });
    });
  }
  /* the picture, upright, in two versions, sized so a line of writing is between about 30 and 80 px
     tall (what the reader likes best; tiny writing is made bigger, a close-up photo smaller):
     gray: gray, contrast stretched, a dark background turned light (screenshots in dark mode)
     ink:  black writing on white, each spot compared with the light around it, so a shadow or uneven light on a
           photo doesn't turn into black blotches (Bradley's local threshold) */
  function prepare(file) {
    return new Promise(function(res, rej) {
      var url = URL.createObjectURL(file),
        img = new Image();
      img.onload = function() {
        try {
          var w = img.naturalWidth,
            h = img.naturalHeight,
            long = Math.max(w, h);
          if (!w || !h) throw new Error("empty");
          var k = long > 2000 ? 2000 / long : 1;
          var c = document.createElement("canvas");
          var W = c.width = Math.max(1, Math.round(w * k)),
            H = c.height = Math.max(1, Math.round(h * k));
          var x = c.getContext("2d");
          x.fillStyle = "#fff";
          x.fillRect(0, 0, W, H); // a see-through screenshot on white
          x.drawImage(img, 0, 0, W, H);
          URL.revokeObjectURL(url);
          var d = x.getImageData(0, 0, W, H),
            p = d.data,
            n = W * H,
            g = new Uint8ClampedArray(n),
            hist = [],
            i, sum = 0;
          for (i = 0; i < 256; i++) hist[i] = 0;
          for (i = 0; i < n; i++) {
            var v0 = (p[i * 4] * 299 + p[i * 4 + 1] * 587 + p[i * 4 + 2] * 114) / 1000 | 0;
            g[i] = v0;
            hist[v0]++;
            sum += v0;
          }
          var dark = sum / n < 110,
            lo = 0,
            hi = 255,
            acc = 0;
          for (i = 0; i < 256; i++) { acc += hist[i]; if (acc > n * 0.01) { lo = i; break; } }
          for (acc = 0, i = 255; i >= 0; i--) { acc += hist[i]; if (acc > n * 0.01) { hi = i; break; } }
          var span = Math.max(1, hi - lo);
          for (i = 0; i < n; i++) {
            var v = Math.max(0, Math.min(255, (g[i] - lo) * 255 / span | 0));
            g[i] = dark ? 255 - v : v;
          }
          // the sum of everything above and to the left of each point, for quick averages over any box
          var S = new Float64Array((W + 1) * (H + 1)),
            X, Y;
          for (Y = 1; Y <= H; Y++) {
            var row = 0;
            for (X = 1; X <= W; X++) {
              row += g[(Y - 1) * W + X - 1];
              S[Y * (W + 1) + X] = S[(Y - 1) * (W + 1) + X] + row;
            }
          }
          var box = function(x0, y0, x1, y1) { // the average over x0..x1, y0..y1 (inclusive, kept inside the picture)
            x0 = Math.max(0, x0);
            y0 = Math.max(0, y0);
            x1 = Math.min(W - 1, x1);
            y1 = Math.min(H - 1, y1);
            var a = (x1 - x0 + 1) * (y1 - y0 + 1);
            return (S[(y1 + 1) * (W + 1) + x1 + 1] - S[y0 * (W + 1) + x1 + 1] - S[(y1 + 1) * (W + 1) + x0] + S[y0 * (W + 1) + x0]) / a;
          };
          var r = Math.max(16, Math.round(Math.max(W, H) / 12)),
            q = new Uint8Array(n); // q: 1 where there's ink
          for (Y = 0; Y < H; Y++)
            for (X = 0; X < W; X++) {
              var near = box(X - 1, Y - 1, X + 1, Y + 1),
                around = box(X - r, Y - r, X + r, Y + r);
              q[Y * W + X] = near < around * 0.85 && near < 235 ? 1 : 0;
            }
          // the same quick sums over the ink
          var sumOf = function(a) {
            var T = new Float64Array((W + 1) * (H + 1));
            for (var yy = 1; yy <= H; yy++) {
              var rr = 0;
              for (var xx = 1; xx <= W; xx++) {
                rr += a[(yy - 1) * W + xx - 1];
                T[yy * (W + 1) + xx] = T[(yy - 1) * (W + 1) + xx] + rr;
              }
            }
            return function(x0, y0, x1, y1) {
              x0 = Math.max(0, x0);
              y0 = Math.max(0, y0);
              x1 = Math.min(W - 1, x1);
              y1 = Math.min(H - 1, y1);
              return (T[(y1 + 1) * (W + 1) + x1 + 1] - T[y0 * (W + 1) + x1 + 1] - T[(y1 + 1) * (W + 1) + x0] + T[y0 * (W + 1) + x0]) / ((x1 - x0 + 1) * (y1 - y0 + 1));
            };
          };
          // how tall a line of writing is: the runs of rows with clearly more ink than most rows (not the edge of the
          // paper or specks, which are in every row), the middle one of those
          var lineHeight = function(a) {
            var rowInk = [],
              yy, xx;
            for (yy = 0; yy < H; yy++) {
              var c2 = 0;
              for (xx = 0; xx < W; xx++) c2 += a[yy * W + xx];
              rowInk.push(c2);
            }
            var sorted = rowInk.slice().sort(function(u, v) { return u - v; }),
              base = sorted[Math.floor(H * 0.2)] || 0;
            var peak = sorted[Math.floor(H * 0.97)] || 0;
            var runs = [],
              run = 0,
              minInk = base + Math.max(2, W * 0.004, (peak - base) * 0.12);
            for (yy = 0; yy <= H; yy++) {
              if (yy < H && rowInk[yy] >= minInk) run++;
              else {
                if (run >= 5) runs.push(run);
                run = 0;
              }
            }
            runs.sort(function(u, v) { return u - v; });
            return runs.length ? runs[runs.length >> 1] : 48;
          };
          // specks: ink with hardly any ink around it
          var dens = sumOf(q),
            q2 = new Uint8Array(n);
          for (Y = 0; Y < H; Y++)
            for (X = 0; X < W; X++) q2[Y * W + X] = q[Y * W + X] && dens(X - 1, Y - 1, X + 1, Y + 1) >= 4 / 9 ? 1 : 0;
          // shadows, edges of the table, a thumb: solid dark areas, far more ink than any stroke of writing has
          var lh = lineHeight(q2),
            half = Math.max(7, Math.round(lh * 0.35));
          dens = sumOf(q2);
          var ink = new Uint8ClampedArray(n);
          for (Y = 0; Y < H; Y++)
            for (X = 0; X < W; X++) {
              var on = q2[Y * W + X] && dens(X - half, Y - half, X + half, Y + half) < 0.72;
              ink[Y * W + X] = on ? 0 : 255;
              q[Y * W + X] = on ? 1 : 0;
            }
          var lineH = lineHeight(q);
          // tiny writing made bigger (not past 1.6 times, and never a photo), big writing made smaller, the rest kept
          var z = lineH < 30 ? Math.max(1, Math.min(40 / lineH, 1.6, 2000 / Math.max(W, H))) : lineH > 80 ? Math.max(0.35, 64 / lineH) : 1;
          if (Math.abs(z - 1) < 0.15) z = 1;
          var canvasOf = function(arr) {
            var cc = document.createElement("canvas");
            cc.width = W;
            cc.height = H;
            var cx = cc.getContext("2d"),
              dd = cx.createImageData(W, H),
              pp = dd.data;
            for (var j = 0; j < n; j++) {
              pp[j * 4] = pp[j * 4 + 1] = pp[j * 4 + 2] = arr[j];
              pp[j * 4 + 3] = 255;
            }
            cx.putImageData(dd, 0, 0);
            if (z === 1) return cc;
            var zc = document.createElement("canvas");
            zc.width = Math.max(1, Math.round(W * z));
            zc.height = Math.max(1, Math.round(H * z));
            var zx = zc.getContext("2d");
            zx.imageSmoothingEnabled = true;
            if ("imageSmoothingQuality" in zx) zx.imageSmoothingQuality = "high";
            zx.drawImage(cc, 0, 0, zc.width, zc.height);
            return zc;
          };
          res({ gray: canvasOf(g), ink: canvasOf(ink), lineH: lineH, zoom: z });
        } catch (e) {
          warn(e);
          rej(bad(tr("photo.err.open", "This picture couldn’t be opened. Try a JPG or PNG, or a screenshot.")));
        }
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        rej(bad(tr("photo.err.kind", "This browser can’t open that kind of picture. Try a JPG or PNG, or take a screenshot of it.")));
      };
      img.src = url;
    });
  }
  // the browser's own reader, where there is one (Chrome with a flag); lines put back in reading order
  function nativeRead(canvas) {
    if (typeof window.TextDetector !== "function") return Promise.resolve("");
    var td;
    try { td = new window.TextDetector(); } catch (e) { return Promise.resolve(""); }
    return timeout(td.detect(canvas), 8000, "slow").then(function(found) {
      var items = (found || []).filter(function(f) { return f && f.rawValue; }).map(function(f) {
        var b = f.boundingBox || {};
        return { t: f.rawValue, y: (b.y || 0) + (b.height || 0) / 2, x: b.x || 0, h: b.height || 10 };
      }).sort(function(a, b) { return a.y - b.y; });
      var lines = [];
      items.forEach(function(it) {
        var L = lines[lines.length - 1];
        if (L && Math.abs(L.y - it.y) < Math.min(L.h, it.h) / 2) L.items.push(it);
        else lines.push({ y: it.y, h: it.h, items: [it] });
      });
      return lines.map(function(L) { return L.items.sort(function(a, b) { return a.x - b.x; }).map(function(i) { return i.t; }).join(" "); }).join("\n");
    })["catch"](function() { return ""; });
  }
  var engineWait = null,
    worker = null,
    workerWait = null,
    onProgress = null,
    idle = null;

  function offline() { return navigator.onLine === false; }

  function needNet() { return tr("photo.needNet", "Reading a picture needs an internet connection the first time, to download the reading engine (about 7 MB). Connect and try again. After that it works offline."); }

  function loadEngine() {
    if (window.Tesseract) return Promise.resolve();
    if (engineWait) return engineWait;
    engineWait = new Promise(function(res, rej) {
      var sc = document.createElement("script");
      sc.src = TESS;
      sc.async = true;
      sc.crossOrigin = "anonymous";
      sc.integrity = TESS_SRI;
      sc.onload = function() {
        if (window.Tesseract) res();
        else rej(bad(tr("photo.err.start", "The reading engine didn’t start. Try again, or type the problem.")));
      };
      sc.onerror = function() {
        sc.remove();
        rej(bad(offline() ? needNet() : tr("photo.err.download", "The reading engine couldn’t be downloaded. Check the connection and try again.")));
      };
      document.head.appendChild(sc);
    });
    engineWait["catch"](function() { engineWait = null; });
    return engineWait;
  }

  function getWorker() {
    if (worker) return Promise.resolve(worker);
    if (workerWait) return workerWait;
    var failed = null;
    workerWait = loadEngine().then(function() {
      var code = ocrLang();
      var opts = {
        workerPath: ENGINE.workerPath,
        corePath: ENGINE.corePath,
        langPath: langPath(code),
        logger: function(m) { if (onProgress) safe(onProgress)(m); },
        errorHandler: function(e) {
          failed = e;
          warn(e);
        }
      };
      return timeout(window.Tesseract.createWorker(code, 1, opts), 120000,
        offline() ? needNet() : tr("photo.err.slowSetup", "Getting the reading engine ready took too long. Check the connection and try again."));
    }).then(function(w) {
      if (failed) throw failed;
      worker = w;
      workerWait = null;
      return w;
    }, function(e) {
      workerWait = null;
      if (e && e.friendly) throw e;
      throw bad(offline() ? needNet() : tr("photo.err.setup", "The reading engine couldn’t be set up. Check the connection and try again."));
    });
    return workerWait;
  }

  function rest() { // free the engine's memory when it isn't being used
    clearTimeout(idle);
    idle = setTimeout(function() { if (worker && !busy) { try { worker.terminate(); } catch (e) {} worker = null; } }, 180000);
  }
  /* the reader often takes ÷ for +. A + has its upright stroke touching the bar; a ÷ has a gap, then a dot, above
     and below it: look at the ink around each + it found */
  function isDivide(canvas, bb) {
    var w = bb.x1 - bb.x0,
      h = bb.y1 - bb.y0;
    if (w < 5 || h < 3) return false;
    var top = Math.max(0, bb.y0 - h),
      bot = Math.min(canvas.height, bb.y1 + h),
      H = bot - top;
    if (H < 5) return false;
    var im = canvas.getContext("2d").getImageData(bb.x0, top, w, H).data,
      x, y;
    var full = [],
      mid = [],
      c0 = Math.floor(w * 0.3),
      c1 = Math.ceil(w * 0.7);
    for (y = 0; y < H; y++) {
      var f = 0,
        m = 0;
      for (x = 0; x < w; x++)
        if (im[(y * w + x) * 4] < 128) { f++; if (x >= c0 && x < c1) m++; }
      full.push(f / w);
      mid.push(m > 0);
    }
    var b0 = -1,
      b1 = -1; // the bar: rows inked most of the way across
    for (y = 0; y < H; y++)
      if (full[y] > 0.6) {
        if (b0 < 0) b0 = y;
        b1 = y;
      }
    if (b0 < 0 || b1 - b0 > h * 0.6) return false;
    var grow = Math.max(1, (b1 - b0 + 1) >> 1),
      k; // the bar's soft edges (a photo) belong to the bar
    for (k = 0; k < grow && b0 > 0 && full[b0 - 1] > 0.25; k++) b0--;
    for (k = 0; k < grow && b1 < H - 1 && full[b1 + 1] > 0.25; k++) b1++;

    function side(from, step, end) {
      var gap = 0,
        y2 = from;
      while (y2 !== end && !mid[y2]) {
        gap++;
        y2 += step;
      }
      if (y2 === end || gap === 0) return false; // nothing there, or a stroke touching the bar (+)
      var dot = 0;
      while (y2 !== end && mid[y2]) {
        dot++;
        y2 += step;
      }
      return dot > 0 && dot <= Math.max(3, (b1 - b0 + 1) * 4);
    }
    return side(b0 - 1, -1, -1) && side(b1 + 1, 1, H);
  }

  function wordText(wd, canvas) {
    var t = String(wd.text || "");
    if (t.indexOf("+") < 0 || !canvas || !wd.symbols) return t;
    return wd.symbols.map(function(sy) {
      return sy.text === "+" && sy.bbox && isDivide(canvas, sy.bbox) ? "÷" : sy.text;
    }).join("");
  }
  // a short, unsure bit of letters at either end of a line is a speck or the edge of something, not writing
  function speck(wd) {
    var t = String(wd.text || "");
    return wd.confidence < 60 && !/[0-9+\-×÷=<>%$\/()]/.test(t) && t.replace(/[^A-Za-z]/g, "").length <= 2;
  }

  function lineText(l, canvas) {
    var ws = l.words || [];
    if (!ws.length) return String(l.text || "");
    var a = 0,
      b = ws.length - 1;
    while (a <= b && speck(ws[a])) a++;
    while (b >= a && speck(ws[b])) b--;
    return ws.slice(a, b + 1).map(function(wd) { return wordText(wd, canvas); }).join(" ");
  }
  // what the reader found: the lines it was fairly sure of (specks and shadows come back as lines of nonsense it
  // isn't sure of), and how sure it was overall (0-100, weighted by letters)
  function linesOf(d, canvas) {
    var lines = (d && d.lines) || [];
    if (!lines.length) return { text: (d && d.text) || "", conf: d && typeof d.confidence === "number" ? d.confidence : 0 };
    var kept = lines.filter(function(l) {
      var t = String(l.text || ""),
        solid = t.replace(/\s/g, ""),
        dots = solid.replace(/[^.,:;~'"`*•°‘’“”_|\\]/g, "");
      return l.confidence >= 45 && (/\d/.test(t) || /[A-Za-z]{3,}/.test(t)) && dots.length <= solid.length * 0.3;
    });
    var chars = 0,
      wsum = 0,
      text = "",
      lastPara = null;
    kept.forEach(function(l) {
      var t = lineText(l, canvas);
      var m = t.replace(/\s/g, "").length;
      chars += m;
      wsum += m * l.confidence;
      var para = d.paragraphs && l.paragraph ? d.paragraphs.indexOf(l.paragraph) : -1;
      if (text && para >= 0 && lastPara !== null && para !== lastPara) text += "\n"; // a gap between paragraphs
      text += t.replace(/\s+$/, "") + "\n";
      lastPara = para;
    });
    return {
      text: text,
      conf: chars ? wsum / chars : 0,
      raw: lines.map(function(l) { return Math.round(l.confidence) + " " + String(l.text || "").trim(); })
    };
  }
  var last = null; // the last reading, for the tests
  function ocr(pic) {
    return nativeRead(pic.gray).then(function(t) {
      if (/[A-Za-z0-9]/.test(t)) return { text: t, conf: 90 };
      var w0;
      return getWorker().then(function(w) {
        w0 = w;
        setStatus(tr("photo.reading", "Reading the picture…") + " <span aria-hidden=\"true\">0%</span>", "busy");
        statusKind = "reading";
        return timeout(w.recognize(pic.ink), 90000, tr("photo.err.slow", "Reading the picture took too long. Try a smaller or clearer picture."));
      }).then(function(r) {
        var a = linesOf(r && r.data, pic.ink);
        last = { ink: a, lineH: pic.lineH, zoom: pic.zoom };
        if (a.conf >= 80) return a;
        // not sure: read the plain gray picture too, and keep the surer reading
        setStatus(tr("photo.readingAgain", "Reading the picture again, another way…") + " <span aria-hidden=\"true\">0%</span>", "busy");
        statusKind = "reading";
        return timeout(w0.recognize(pic.gray), 90000, tr("photo.err.slow", "Reading the picture took too long. Try a smaller or clearer picture.")).then(function(r2) {
          var b = linesOf(r2 && r2.data, pic.ink);
          last.gray = b;
          return b.conf > a.conf + 3 || (!/[A-Za-z0-9]/.test(a.text) && /[A-Za-z0-9]/.test(b.text)) ? b : a;
        });
      });
    });
  }
  var STAGES = { // what the engine is doing: [key, English]
    "loading tesseract core": ["photo.stage.engine", "Downloading the reading engine (first time only)…"],
    "initializing tesseract": ["photo.stage.ready", "Getting the reading engine ready…"],
    "loading language traineddata": ["photo.stage.data", "Downloading the English reading data (first time only)…"],
    "initializing api": ["photo.stage.ready", "Getting the reading engine ready…"]
  };

  function stage(st) { var x = STAGES[st]; return x ? tr(x[0], x[1]) : ""; }

  function readFile(file) {
    if (busy || !spot) return;
    closeMenu();
    if (!file || (file.type && !/^image\//i.test(file.type))) { setStatus(tr("photo.err.notPicture", "That isn’t a picture. Choose a photo or a screenshot (JPG or PNG)."), "err"); return; }
    setBusy(true);
    setStatus(tr("photo.opening", "Opening the picture…"), "busy");
    var lastPct = -1;
    onProgress = function(m) {
      if (!m || !statusEl) return;
      if (m.status === "recognizing text") {
        var pct = Math.round((m.progress || 0) * 100);
        if (pct === lastPct) return;
        lastPct = pct;
        var s = statusEl.querySelector("span");
        if (s && statusKind === "reading") s.textContent = pct + "%";
      } else if (STAGES[m.status] && statusEl.textContent.indexOf(stage(m.status)) !== 0) {
        setStatus(stage(m.status) + (m.progress > 0 && m.progress < 1 ? " <span aria-hidden=\"true\">" + Math.round(m.progress * 100) + "%</span>" : ""), "busy");
      } else if (STAGES[m.status] && m.progress > 0 && m.progress < 1) {
        var sp = statusEl.querySelector("span");
        if (sp) sp.textContent = Math.round(m.progress * 100) + "%";
      }
    };
    prepare(file).then(function(pic) {
      setStatus(window.Tesseract || worker ? tr("photo.reading", "Reading the picture…") : stage("loading tesseract core"), "busy");
      return ocr(pic);
    }).then(function(r) {
      setBusy(false);
      onProgress = null;
      rest();
      var box = spot.box();
      var res = cleanAll(r.text, !!box && box.tagName === "TEXTAREA");
      if (!res.text || r.conf < 50) { setStatus(tr("photo.err.nothing", "No writing could be read in the picture. Try again closer up, in good light, with the problem filling most of the picture. Printed problems work best."), "err"); return; }
      show(res, r.conf);
    })["catch"](function(e) {
      setBusy(false);
      onProgress = null;
      warn(e);
      setStatus((e && e.friendly) || tr("photo.err.other", "Something went wrong reading the picture. Try again, or type the problem."), "err", !!(e && e.friendly === needNet()));
    });
  }
  var lastRes = null,
    lastConf = 0;

  function show(res, conf) {
    lastRes = res;
    lastConf = conf;
    put(0);
  }

  function put(k) {
    if (spot.ready) spot.ready();
    var res = lastRes,
      box = spot.box();
    if (!box) return;
    var text = res.problems[k];
    box.value = text;
    fire(box, "input");
    if (!spot.go) fire(box, "change"); // a whole problem in the first box: the page reads it now
    if (!coarse || spot.go) { try { box.focus(); var n = box.value.length; if (box.setSelectionRange) box.setSelectionRange(n, n); } catch (e) {} }
    var msg = spot.go ? tr("photo.checkPress", "Check the text, then press {button}.", { button: goLabel() }) : tr("photo.check", "Check the text, and fix anything the picture got wrong.");
    if (lastConf < 65) msg = tr("photo.hard", "Parts of the picture were hard to read (printed problems work best). {msg}", { msg: msg });
    var picks = "";
    if (res.problems.length > 1) {
      picks = " " + tr("photo.many", "The picture has {n} problems. Showing:", { n: res.problems.length }) + " " + res.problems.slice(0, 12).map(function(p, i) {
        return '<button type="button" class="ht-cam-pick" data-p="' + i + '" aria-pressed="' + (i === k) + '" aria-label="' + escAttr(tr("photo.problemN", "Problem {i}: {problem}", { i: i + 1, problem: p })) + '">' + (i + 1) + "</button>";
      }).join("");
    }
    setStatus(msg + picks, "", res.problems.length > 1);
  }

  function escAttr(s) { return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

  // the button to press after checking, by its words now (in English: what spot.go says)
  function goLabel() {
    if (!foreign()) return spot.go;
    if (spot.go === "Enter") return tr("photo.enter", "Enter");
    return label(spot.goBtn && spot.goBtn()) || spot.go;
  }

  /* ===================== paste and drop ===================== */
  function imageFrom(dt) {
    if (!dt) return null;
    var i, f = dt.files || [];
    for (i = 0; i < f.length; i++)
      if (/^image\//i.test(f[i].type)) return f[i];
    var items = dt.items || [];
    for (i = 0; i < items.length; i++)
      if (items[i].kind === "file" && /^image\//i.test(items[i].type)) { var g = items[i].getAsFile(); if (g) return g; }
    return null;
  }

  function hasFiles(dt) { return !!dt && [].indexOf.call(dt.types || [], "Files") >= 0; }

  function wireBox() {
    var box = spot.box && !spot.split ? spot.box() : null,
      zone = spot.drop || (box && box.parentNode);
    // paste: a picture (and no text) pasted into the box is read
    document.addEventListener("paste", safe(function(e) {
      var b = spot.box && (spot.split ? document.getElementById("decEntry") : spot.box());
      if (!b || !(e.target === b || (b.contains && b.contains(e.target)) || (spot.split && e.target.closest && e.target.closest(".problem")))) return;
      var dt = e.clipboardData;
      if (!dt || (dt.getData && dt.getData("text/plain"))) return;
      var f = imageFrom(dt);
      if (f) {
        e.preventDefault();
        readFile(f);
      }
    }), true);
    if (!zone) return;
    var depth = 0;
    zone.addEventListener("dragenter", function(e) {
      if (hasFiles(e.dataTransfer)) {
        depth++;
        zone.classList.add("ht-cam-drop");
      }
    });
    zone.addEventListener("dragover", function(e) {
      if (hasFiles(e.dataTransfer)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    });
    zone.addEventListener("dragleave", function() {
      if (--depth <= 0) {
        depth = 0;
        zone.classList.remove("ht-cam-drop");
      }
    });
    zone.addEventListener("drop", safe(function(e) {
      depth = 0;
      zone.classList.remove("ht-cam-drop");
      var f = imageFrom(e.dataTransfer);
      if (f || hasFiles(e.dataTransfer)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (f) readFile(f);
      else if (hasFiles(e.dataTransfer)) setStatus(tr("photo.err.notPictureDrop", "That isn’t a picture. Drop a photo or a screenshot (JPG or PNG)."), "err");
    }));
  }

  /* ===================== start ===================== */
  var tries = 0;

  function start() {
    if (document.querySelector(".ht-cam")) return;
    var s = findSpot();
    if (s === "wait") { if (tries++ < 60) setTimeout(safe(start), 100); return; }
    if (!s) return;
    spot = s;
    var st = el("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    spot.place(makeButton());
    statusEl = el("div", "ht-cam-status");
    statusEl.setAttribute("role", "status");
    statusEl.setAttribute("aria-live", "polite");
    statusEl.hidden = true;
    spot.status(statusEl);
    statusEl.addEventListener("click", safe(function(e) {
      var p = e.target.closest(".ht-cam-pick");
      if (p) put(Number(p.getAttribute("data-p")));
    }));
    fileCam = fileInput(true);
    filePick = fileInput(false);
    wireBox();
    document.addEventListener("click", function(e) { if (menu && !menu.contains(e.target)) closeMenu(); });
    document.addEventListener("keydown", function(e) { if (e.key === "Escape" && menu) closeMenu(); });
  }

  window.HelperPhoto = { clean: clean, cleanAll: cleanAll, read: function(file) { readFile(file); }, spot: function() { return spot; }, last: function() { return last; }, prepare: prepare };
  var begin = function() { whenReady(safe(start)); }; // the button's words in the page's language
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", begin);
  else begin();
})();
