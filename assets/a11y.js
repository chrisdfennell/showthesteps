/* Math names for screen readers. tools.js loads this file.
   The helpers draw their math with markup a screen reader can't make sense of: a stacked fraction (.fr: .nu over .de)
   comes out as "3 4", x<sup>2</sup> as "x 2", i²³ as "i 2 3", 6√2 as "6 square root 2". After each render this gives
   the math a name in the words Read aloud uses (HelperTools.spoken in tools.js): role="img" and aria-label="3 quarters".
     - a short run of math as a whole: the answer band's values and labels (.answer .v, .answer .k), the bold math in
       the steps and facts (b, strong), a point (.pt), a vector (.vc), the work area's math lines (.bigline, .expr,
       .eqa, .frm …): "6 root 2", "f of 4", "the interval from 0 to infinity, including 0"
     - inside longer text, each piece on its own: a fraction ("and 3 quarters" after a whole number), a power
       ("squared"), a subscript ("sub n"), a root, a matrix, repeating digits, a log's base
   Only where the words say more than the symbols do; never on anything with a link or a button inside.
   Attributes only, no text added: textContent (which the pages and the self-test read) stays the same. Our labels are
   marked data-a11y="math", and taken off again when the math they named changes into something that needs none.
   Light: it runs once after the page settles (a debounced MutationObserver) and only reads what changed.
   window.HelperA11y = { refresh() } */
(function() {
  "use strict";
  if (window.HelperA11y || !window.MutationObserver || !document.querySelectorAll) return;

  function safe(fn) { return function() { try { return fn.apply(this, arguments); } catch (e) { if (window.console) console.warn("a11y.js:", e); } }; }

  function HT() { return window.HelperTools && window.HelperTools.spoken ? window.HelperTools : null; }

  var MARK = "data-a11y";
  // markup that is math, and symbols a screen reader says badly (powers, roots, subscripts, bounds, f(x), |x|, 3/4)
  var PIECES = ".fr, .frac, .fraction, sup, sub, .rad, .rt, .mx, .rep, .lg, .bnd";
  var HARD = /[√∛∜⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿˣʸᵗ₀₁₂₃₄₅₆₇₈₉ₙₐ₋∫∑Σ⟨⟩∞|′″∠△½¼¾⅓⅔⅛]|\d\s?\/\s?\d|\b[fghP]\(|\d:\d|\$\d|\d\s?(?:mL|gtt|mg|mcg|kg|lb|ft|in|cm|mm|km|mi|kWh|kW|Ω|kΩ|µF|μF|mA|mph|kt|nm|gal|tsp|tbsp|oz|°F|°C|A|V|W)\b|[\u0304\u0305\u0302]/;
  // the answer band's values: their parts sit side by side with no space between ("GCF" "6"), and a minus is "negative"
  var VMARK = PIECES + ", .sep, .wk, .op-s, .u, .ux, .r-mark, .ng, .word, .w";
  var RUNS = ".answer .v, .answer .k, .ht-tq b, b, strong, .pt, .vc, .bigline, .expr, .eqa, .frm, .pw, .val, .tm, .mpair, .vv";
  var SKIP = "textarea, input, select, option, [contenteditable], svg, script, style, nav, footer, h1, .masthead, .sitenav, .ht-pad, .ht-menu, .ht-bar, [aria-hidden=\"true\"]";
  var LIVE = "a[href], button, input, select, textarea, [tabindex], [role=\"button\"], [role=\"link\"]";
  var MAXRUN = 160; // longer than this is a sentence, not a piece of math: its pieces are named instead

  function norm(s) { return String(s).replace(/[\s\u00a0]+/g, " ").replace(/[−–]/g, "-").trim().toLowerCase(); }

  function ours(el) { return el.getAttribute(MARK) === "math"; }

  function free(el) { // not already named by the page itself
    return ours(el) || (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby") && !el.hasAttribute("role"));
  }

  function setName(el, name) {
    if (!/\.\s*$/.test(el.textContent)) name = name.replace(/[.\s]+$/, ""); // Read aloud's pause after a step label
    if (el.getAttribute("aria-label") !== name) el.setAttribute("aria-label", name);
    if (!ours(el)) {
      el.setAttribute("role", "img");
      el.setAttribute(MARK, "math");
    }
  }

  function clear(el) {
    if (!ours(el)) return;
    el.removeAttribute("role");
    el.removeAttribute("aria-label");
    el.removeAttribute(MARK);
  }

  // the text just before el, inside its line: the last few characters, and whether a space comes between
  function before(el) {
    var n = el;
    while (n && n.nodeType === 1 && !/^(LI|P|DIV|TD|TH|BODY)$/.test(n.tagName)) {
      var p = n.previousSibling,
        gap = false;
      while (p) {
        var t = p.textContent || "";
        if (/\S/.test(t)) return { tail: t.replace(/\s+$/, "").slice(-8), gap: gap || /\s$/.test(t) };
        if (t) gap = true;
        p = p.previousSibling;
      }
      n = n.parentNode;
    }
    return { tail: "", gap: false };
  }

  // what a piece says on its own, read as part of what's around it
  function pieceName(el, words) {
    var b = before(el),
      L = HT() && HT().speechWords ? HT().speechWords() : null; // the math words of the page's language (null: English)
    if (L) return pieceNameL(el, words, b, L);
    if (el.matches(".fr, .frac, .fraction") && /\d$/.test(b.tail) && !/[÷×+−=\/·*.,]\s*\d+$/.test(b.tail) && /^\d+ [a-z]/.test(words) && !/ over /.test(words)) return "and " + words; // 1 and 3 quarters, not "÷ 6" then 3/4
    if (el.matches(".rad, .rt") && !b.gap && /(\d|(^|[^A-Za-z])[A-Za-z]|\))$/.test(b.tail) && /^the square root of /.test(words) && !/ the quantity /.test(words)) return words.replace(/^the square root of /, "root "); // 6 root 2
    return words;
  }

  // the same in another language, with its speech table's words (tools.js, "tools.speech" in assets/i18n/<lang>.js):
  // "2 y 3 cuartos" (its "and"), "6 por la raíz cuadrada de 2" (its "times")
  function pieceNameL(el, words, b, L) {
    var over = String((L.fractions || {}).over || "").replace(/\{[ab]\}/g, "").trim(),
      root2 = String((L.roots || {})["2"] || ""),
      qty = String(L.quantity || "");
    if (el.matches(".fr, .frac, .fraction") && /\d$/.test(b.tail) && !/[÷×+−=\/·*.,]\s*\d+$/.test(b.tail) && /^(?:\d+|[^\s\d]+) [^\s\d]/.test(words) && !(over && (" " + words + " ").indexOf(" " + over + " ") >= 0)) return (L.and || "and") + " " + words;
    if (el.matches(".rad, .rt") && !b.gap && /(\d|(^|[^A-Za-z])[A-Za-z]|\))$/.test(b.tail) && root2 && words.indexOf(root2 + " ") === 0 && !(qty && words.indexOf(" " + qty + " ") >= 0)) return (L.times || "times") + " " + words;
    return words;
  }

  // an answer value read the way Play reads it: "40 cm²", not "40cm²"
  function spaced(el, ht) {
    var c = el.cloneNode(true);
    [].forEach.call(c.querySelectorAll("span, b, i, sub"), function(x) { if (!x.closest(".fr, .frac, .fraction, .rad, .rt, .mx") || x.matches(".fr, .frac, .fraction, .rad, .rt, .mx")) x.insertAdjacentText("beforebegin", " "); });
    return ht.spoken(c);
  }

  var done = 0;

  function run() {
    var ht = HT();
    if (!ht) return;
    var t0 = Date.now();
    // a run of math as a whole, the outside one first
    [].forEach.call(document.querySelectorAll(RUNS), function(el) {
      if (el.closest(SKIP) || !free(el)) return;
      var up = el.parentNode && el.parentNode.closest ? el.parentNode.closest("[" + MARK + "]") : null;
      if (up) {
        clear(el);
        el.__a11yText = null;
        return;
      } // said with what holds it
      var text = el.textContent;
      if (el.__a11yText === text) return;
      el.__a11yText = text;
      var v = el.matches(".answer .v, .answer .k"),
        math = text.length <= MAXRUN && /\S/.test(text) && !el.querySelector(LIVE) && (el.querySelector(v ? VMARK : PIECES) || HARD.test(text) || (v && /^\s*[−-]\s?[\d.a-z]/.test(text)));
      if (!math) { clear(el); return; }
      var name = v ? spaced(el, ht) : ht.spoken(el);
      if (!name || norm(name) === norm(text)) { clear(el); return; }
      setName(el, name);
    });
    // the pieces inside longer text
    [].forEach.call(document.querySelectorAll(PIECES), function(el) {
      if (el.closest(SKIP) || !free(el)) return;
      var text = el.textContent,
        up = el.parentNode && el.parentNode.closest ? el.parentNode.closest("[" + MARK + "]") : null;
      if (up || (el.matches("sup, sub, .fr, .frac, .fraction") && el.parentNode.closest(".rad, .rt, .mx, .bnd, .lg"))) {
        clear(el);
        el.__a11yText = null;
        return;
      } // said with what holds it
      var b = before(el),
        key = text + "|" + b.tail + b.gap;
      if (el.__a11yText === key) return;
      el.__a11yText = key;
      if (!/\S/.test(text) || el.querySelector(LIVE)) { clear(el); return; }
      var name = pieceName(el, ht.spoken(el));
      if (!name || norm(name) === norm(text)) { clear(el); return; }
      setName(el, name);
    });
    done++;
    if (window.HelperA11y) window.HelperA11y.ms = Date.now() - t0;
  }

  var timer = null;
  var later = safe(function() {
    clearTimeout(timer);
    timer = setTimeout(safe(run), 150);
  });

  function start() {
    later();
    // our own attributes don't count: only new or changed content (childList, characterData) starts another pass
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.HelperA11y = { refresh: safe(run), runs: function() { return done; }, ms: 0 };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", safe(start));
  else safe(start)();
})();
