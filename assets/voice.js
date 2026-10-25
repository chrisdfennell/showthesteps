/* Say the problem: a microphone button beside the camera button (photo.js) by the problem box on every helper page and
   by the home page's search box. Press it, say the problem, and what was said is put in the box, the way the box reads
   it ("three fourths of twenty" → 3/4 of 20), and the page works it out.
   - It uses the browser's own speech recognition (SpeechRecognition; Chrome, Edge and Safari have it, Firefox doesn't,
     and then there is no button). Chrome and Edge send the sound to Google's or Microsoft's speech service, Safari to
     Apple's: a one-time notice says so, and the microphone is only used after it has been OK'd (kept in localStorage).
     Where the browser can do it on the device (SpeechRecognition.available / processLocally), that is used instead, and
     the notice says so.
   - HelperVoice.toMath(text) turns spoken math into what the boxes read: number words into digits, "plus" into +,
     "x squared" into x^2, "the square root of 72" into sqrt(72), money, percents, times of day. A sentence (a story
     problem) keeps its words: only the numbers become digits, and it is split into sentences.
   tools.js loads this file (not in embeds, worksheets, practice sets or the self-test). ES5, and wrapped so a problem
   here can never break the page. */
(function() {
  "use strict";
  if (window.HelperVoice) return;

  var root = document.documentElement;
  var KEY = "helpers-voice";
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  function warn(e) { if (window.console) console.warn("voice.js:", e); }

  function safe(fn) { return function() { try { return fn.apply(this, arguments); } catch (e) { warn(e); } }; }

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html) x.innerHTML = html; return x; }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ===================== spoken math → what the boxes read ===================== */
  var ONES = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  var TEENS = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
  var TENS = { twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var SCALE = { thousand: 1e3, million: 1e6, billion: 1e9 };
  var ORD = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    ninth: 9,
    tenth: 10,
    eleventh: 11,
    twelfth: 12,
    thirteenth: 13,
    fourteenth: 14,
    fifteenth: 15,
    sixteenth: 16,
    seventeenth: 17,
    eighteenth: 18,
    nineteenth: 19,
    twentieth: 20,
    thirtieth: 30,
    fortieth: 40,
    fiftieth: 50,
    sixtieth: 60,
    seventieth: 70,
    eightieth: 80,
    ninetieth: 90,
    hundredth: 100,
    thousandth: 1000
  };
  // words that belong to a math problem; a sentence with three or more other words is a story problem
  var MATHWORDS = {};
  ("what whats is are was the of a an and or to by from for in if then than as at with into on its it be let me my you can could would please so ok okay um uh " +
    "find solve simplify factor factorise factorize expand evaluate calculate compute work out show steps step how much many tell give equals equal " +
    "plus minus times multiplied divided over add subtract multiply divide sum difference product quotient total square squared cube cubed " +
    "root roots power raised negative positive point percent per cent half halves quarter quarters number numbers dollar dollars cents cent " +
    "degree degrees sine cosine tangent sin cos tan sec csc cot secant cosecant cotangent inverse arc arcsine arccosine arctangent log logs " +
    "logarithm base natural ln derivative integral limit approaches choose factorial greater less more fewer least most not open close closed " +
    "left right end parenthesis parentheses paren parens bracket brackets quantity comma slash pi ex why mean median mode range average gcf gcd " +
    "lcm lcd prime primes factors multiples value answer decimal fraction fractions mixed remainder simplest form lowest terms convert round " +
    "nearest whole sqrt cbrt equation expression x y z n f g h i e table tables percentage which bigger smaller larger compare order " +
    "standard expanded scientific notation slope line intercept through point points distance midpoint ratio proportion rate unit nth term terms " +
    "sequence series graph vertex system matrix determinant vector exponent exponents base digit digits place tens ones hundreds thousands " +
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen " +
    "twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion first second third fourth fifth sixth seventh " +
    "eighth ninth tenth thirds fourths fifths sixths sevenths eighths ninths tenths hundredths thousandths probability chance odds " +
    "variable variables solving rounded doubled tripled twice double triple again also now").split(" ").forEach(function(w) { MATHWORDS[w] = 1; });
  var KEEP_ONE = /^(which|each|no|any|every|some|this|that|the|another|last|next|other|only|little|big|new|old|right|wrong|such)$/;
  var OPWORD = /^(plus|minus|times|over|divided|multiplied|of|equals|equal|is|and|[+\-×÷\/=*^%:,)])$/;

  function isNumWord(l) { return has(ONES, l) || has(TEENS, l) || has(TENS, l); }

  function num(s) { return Number(String(s).replace(/,/g, "")); }

  function denOf(w) { // "thirds" → 3, "half" → 2, "quarter" → 4 ("first", "second" aren't fractions)
    if (w === "half" || w === "halves") return 2;
    if (w === "quarter" || w === "quarters") return 4;
    var d = ORD[w.replace(/s$/, "")];
    return d && d > 2 ? d : 0;
  }

  function suffix(n) {
    var t = n % 100;
    if (t >= 11 && t <= 13) return "th";
    return ["th", "st", "nd", "rd"][n % 10] || "th";
  }

  var TOK = /\d+(?:,\d{3})*(?:\.\d+)?|\.\d+|[A-Za-z]+(?:'[A-Za-z]+)?|[^\sA-Za-z\d]/g;

  function tokens(s) {
    var out = [],
      m, last = 0;
    TOK.lastIndex = 0;
    while ((m = TOK.exec(s))) {
      var w = m[0];
      out.push({ w: w, l: w.toLowerCase(), sp: m.index > last ? " " : "", k: /^[\d.]/.test(w) && /\d/.test(w) ? "d" : /^[A-Za-z]/.test(w) ? "w" : "p" });
      last = m.index + w.length;
    }
    return out;
  }

  function tk(w, sp, k) { return { w: w, l: String(w).toLowerCase(), sp: sp, k: k || "n" }; }

  // "three hundred and forty-two" → { n: 342, end, last }; "47 thousand" → 47000; "a hundred" → 100
  function cardinal(T, i) {
    var total = 0,
      cur = 0,
      last = null,
      j = i,
      big = Infinity,
      any = false;
    var t0 = T[i];
    if (!t0) return null;
    if ((t0.l === "a" || t0.l === "an") && T[i + 1] && (T[i + 1].l === "hundred" || has(SCALE, T[i + 1].l))) {
      cur = 1;
      last = "ones";
      j++;
      any = true;
    } else if (t0.k === "d" && /^\d/.test(t0.w)) {
      cur = num(t0.w);
      last = "digit";
      j++;
      any = true;
    }
    for (;;) {
      var t = T[j];
      if (!t) break;
      var l = t.l;
      if (l === "-" && any && !t.sp && T[j + 1] && !T[j + 1].sp && isNumWord(T[j + 1].l)) { // forty-seven
        j++;
        continue;
      }
      if (has(ONES, l)) {
        if (last && last !== "tens" && last !== "hundred" && last !== "scale") break;
        if (last === "tens" && cur % 10 !== 0) break;
        cur += ONES[l];
        last = "ones";
      } else if (has(TEENS, l)) {
        if (last && last !== "hundred" && last !== "scale") break;
        cur += TEENS[l];
        last = "teens";
      } else if (has(TENS, l)) {
        if (last && last !== "hundred" && last !== "scale") break;
        cur += TENS[l];
        last = "tens";
      } else if (l === "hundred") {
        if (!any || last === "hundred" || last === "scale" || cur <= 0 || cur >= 100 || cur !== Math.floor(cur)) break;
        cur *= 100;
        last = "hundred";
      } else if (has(SCALE, l)) {
        if (!any || cur <= 0 || SCALE[l] >= big || cur >= 1000) break;
        total += cur * SCALE[l];
        if (total !== Math.round(total)) { total -= cur * SCALE[l]; break; }
        big = SCALE[l];
        cur = 0;
        last = "scale";
      } else if (l === "and" && (last === "hundred" || last === "scale") && T[j + 1] && isNumWord(T[j + 1].l) && !(T[j + 2] && denOf(T[j + 2].l))) {
        j++; // "a hundred and five" (but "two hundred and three fourths" is a mixed number)
        continue;
      } else break;
      any = true;
      j++;
    }
    if (!any) return null;
    return { n: total + cur, end: j, last: last };
  }
  // the digits after "point": "point five" → "5", "point oh five" → "05", "point 25" → "25", "point twenty five" → "25"
  function decimals(T, j) {
    var t = T[j];
    if (!t) return null;
    if (t.k === "d" && /^\d+$/.test(t.w)) return { d: t.w, end: j + 1 };
    if (has(TEENS, t.l) || has(TENS, t.l)) {
      var c = cardinal(T, j);
      if (c && c.n < 100 && c.last !== "hundred") return { d: String(c.n), end: c.end };
    }
    var d = "",
      k = j;
    while (T[k] && (has(ONES, T[k].l) || T[k].l === "oh" || T[k].l === "o")) {
      d += has(ONES, T[k].l) ? ONES[T[k].l] : "0";
      k++;
    }
    return d ? { d: d, end: k } : null;
  }

  var COINS = /\b(dimes?|nickels?|pennies|penny|cents?|coins?)\b/i;

  // a fraction word at j can be read as the bottom of a fraction ("three fourths", "a third of 12")
  function fracWord(T, j, aNum, ctx) {
    var t = T[j];
    if (!t || t.k !== "w") return 0;
    var d = denOf(t.l);
    if (!d) return 0;
    if (d === 4 && /^quarters?$/.test(t.l) && ctx.coins && !(T[j + 1] && T[j + 1].l === "of")) return 0; // 4 quarters and 3 dimes
    if (aNum && t.l !== "half") { // "a third of", "a fifth plus a half" (not "a fifth grader")
      var nx = T[j + 1];
      if (nx && nx.l !== "of" && !OPWORD.test(nx.l) && nx.k !== "p") return 0;
    }
    return d;
  }

  function hourOf(T, j) { // 1 to 12, said as a word or digits
    var t = T[j];
    if (!t) return 0;
    var v = t.k === "d" && /^\d{1,2}$/.test(t.w) ? Number(t.w) : has(ONES, t.l) ? ONES[t.l] : has(TEENS, t.l) ? TEENS[t.l] : 0;
    return v >= 1 && v <= 12 ? v : 0;
  }

  function minutesOf(T, j) { // "thirty", "oh five", "fifteen", "45" → { m, end }
    var t = T[j];
    if (!t) return null;
    if (t.k === "d" && /^\d{2}$/.test(t.w) && Number(t.w) < 60) return { m: Number(t.w), end: j + 1 };
    if ((t.l === "oh" || t.l === "o") && T[j + 1] && has(ONES, T[j + 1].l) && ONES[T[j + 1].l] > 0) return { m: ONES[T[j + 1].l], end: j + 2 };
    if (has(TEENS, t.l) || has(TENS, t.l)) {
      var c = cardinal(T, j);
      if (c && c.n >= 10 && c.n < 60 && c.last !== "hundred") return { m: c.n, end: c.end };
    }
    return null;
  }

  function two(n) { return (n < 10 ? "0" : "") + n; }

  /* one number at T[i], read as far as it goes: whole numbers, decimals, fractions, mixed numbers, ordinals, times of
     day and years. → { w: "2 1/2", end } or null */
  function readNumber(T, i, ctx) {
    var t = T[i];
    if (!t) return null;
    var prev = T[i - 1];
    if (prev && prev.l === "nearest") return null; // "round to the nearest ten"
    // a time of day: "three thirty pm", "nine oh five a.m.", "seven o'clock"
    var h = hourOf(T, i);
    if (h && !(prev && prev.l === "point")) {
      if (T[i + 1] && T[i + 1].l === "o'clock") return { w: h + ":00", end: i + 2 };
      var mm = minutesOf(T, i + 1);
      if (mm && T[mm.end] && /^(am|pm)$/.test(T[mm.end].l)) return { w: h + ":" + two(mm.m), end: mm.end };
    }
    // a year: "nineteen eighty four", "twenty twenty four", "twenty oh five"
    var hi = t.l === "nineteen" ? 19 : t.l === "twenty" ? 20 : 0;
    if (hi && T[i + 1] && (has(TENS, T[i + 1].l) || ((T[i + 1].l === "oh" || T[i + 1].l === "o") && T[i + 2] && has(ONES, T[i + 2].l)))) {
      var lo = (T[i + 1].l === "oh" || T[i + 1].l === "o") ? { n: ONES[T[i + 2].l], end: i + 3 } : cardinal(T, i + 1);
      if (lo && lo.n < 100 && !(T[lo.end] && (T[lo.end].l === "hundred" || has(SCALE, T[lo.end].l) || denOf(T[lo.end].l)))) return { w: String(hi * 100 + lo.n), end: lo.end };
    }
    // ".5": "point five"
    if (t.l === "point" && !(prev && (prev.k === "d" || prev.k === "n"))) {
      var d0 = decimals(T, i + 1);
      if (d0) return { w: "0." + d0.d, end: d0.end };
      return null;
    }
    // "a half", "a third of 12"
    if (t.l === "a" || t.l === "an") {
      var da = fracWord(T, i + 1, true, ctx);
      if (da) return { w: "1/" + da, end: i + 2 };
      if (!(T[i + 1] && (T[i + 1].l === "hundred" || has(SCALE, T[i + 1].l)))) return null;
    }
    if (t.l === "one") { // "which one", "one of them" stay words; "the one hundred" doesn't
      var n1 = T[i + 1],
        more = n1 && (n1.l === "hundred" || has(SCALE, n1.l) || denOf(n1.l) || n1.l === "point" || n1.l === "and" || /^(dollars?|percent|o'clock)$/.test(n1.l));
      if (!more && ((prev && KEEP_ONE.test(prev.l)) || (n1 && /^(of|another|day|time|way|by|at|after)$/.test(n1.l)))) return null;
    }
    var c = cardinal(T, i);
    if (!c) return null;
    var w = String(c.n),
      end = c.end,
      whole = /^\d+$/.test(w);
    if (c.last === "digit" && end === i + 1) w = t.w; // as it was said ("1,000", "3.50")
    var nx = T[end];
    // "four point five", "3 point 1 4"
    if (nx && nx.l === "point" && whole) {
      var dd = decimals(T, end + 1);
      if (dd) return { w: String(c.n) + "." + dd.d, end: dd.end };
    }
    if (!whole) return { w: w, end: end };
    // "twenty first" → 21st; "one hundredth"/"three fourths" → a fraction
    if (nx && nx.k === "w") {
      var ov = ORD[nx.l];
      if (ov && ov < 10 && (c.last === "tens" || c.last === "hundred" || c.last === "scale")) return { w: (c.n + ov) + suffix(c.n + ov), end: end + 1 };
      var d = fracWord(T, end, false, ctx);
      if (d) return { w: c.n + "/" + d, end: end + 1 };
      // "3 over 4"
      if (nx.l === "over" && T[end + 1]) {
        var bot = cardinal(T, end + 1);
        if (bot && /^\d+$/.test(String(bot.n)) && !(T[bot.end] && denOf(T[bot.end].l))) return { w: c.n + "/" + bot.n, end: bot.end };
      }
      // "two and a half", "one and three fourths"
      if (nx.l === "and" && T[end + 1]) {
        var a = T[end + 1];
        if (a.l === "a" || a.l === "an" || a.l === "one") {
          var d1 = fracWord(T, end + 2, false, ctx);
          if (d1) return { w: c.n + " 1/" + d1, end: end + 3 };
        }
        var top = cardinal(T, end + 1);
        if (top && /^\d+$/.test(String(top.n)) && top.last !== "digit") {
          var d2 = fracWord(T, top.end, false, ctx);
          if (d2) return { w: c.n + " " + top.n + "/" + d2, end: top.end + 1 };
        }
      }
    }
    return { w: w, end: end };
  }

  // number words → digits, in place; then $, %, times of day and "negative"
  function numberPass(T) {
    var ctx = { coins: COINS.test(T.map(function(x) { return x.w; }).join(" ")) },
      out = [],
      i = 0;
    while (i < T.length) {
      var t = T[i];
      var r = t.k === "w" || t.k === "d" ? readNumber(T, i, ctx) : null;
      if (r && !(r.end === i + 1 && t.k === "d" && r.w === t.w)) {
        out.push(tk(r.w, t.sp, "n"));
        i = r.end;
        continue;
      }
      if (t.k === "d") t.k = "n";
      out.push(t);
      i++;
    }
    T = out;
    out = [];
    for (i = 0; i < T.length; i++) {
      var p0 = T[i],
        p1 = T[i + 1];
      if (p0.k === "n" && p1 && !p1.sp && /^(st|nd|rd|th)$/.test(p1.l) && /^\d+$/.test(p0.w)) { // "4th" as digits and letters
        out.push(tk(p0.w + p1.l, p0.sp, "n"));
        i++;
      } else if (p0.w === "$" && p1 && p1.k === "n" && /^[\d.,]+$/.test(p1.w)) { // "$" and a number
        out.push(tk("$" + p1.w, p0.sp, "n"));
        i++;
      } else out.push(p0);
    }
    T = out;
    out = [];
    for (i = 0; i < T.length; i++) {
      var a = T[i],
        b = T[i + 1],
        c = T[i + 2],
        last = out[out.length - 1];
      // percent
      if (a.k === "n" && b && (b.l === "percent" || b.w === "%" || (b.l === "per" && c && c.l === "cent"))) {
        out.push(tk(a.w + "%", a.sp, "n"));
        i += b.l === "per" ? 2 : 1;
        continue;
      }
      // "negative seven"
      if (a.l === "negative" && b && b.k === "n" && /^[\d.$]/.test(b.w)) {
        out.push(tk("-" + b.w, a.sp, "n"));
        i++;
        continue;
      }
      // times of day: "7 o'clock", "half past 3", "quarter to 8", "3 30 pm"
      if (a.k === "n" && /^\d{1,2}$/.test(a.w) && b && b.l === "o'clock" && Number(a.w) >= 1 && Number(a.w) <= 12) {
        out.push(tk(a.w + ":00", a.sp, "n"));
        i++;
        continue;
      }
      if ((a.l === "half" || a.l === "quarter") && b && /^(past|after|to|till|til|before|of)$/.test(b.l) && c && c.k === "n" && /^\d{1,2}$/.test(c.w) && Number(c.w) >= 1 && Number(c.w) <= 12 &&
        !(b.l === "of" && a.l === "half")) {
        var H = Number(c.w),
          past = /^(past|after)$/.test(b.l);
        if (a.l === "half" && !past) { out.push(a); continue; }
        var m = a.l === "half" ? 30 : past ? 15 : 45,
          sp0 = a.sp;
        if (!past) H = H === 1 ? 12 : H - 1;
        if (last && last.l === "a") sp0 = out.pop().sp; // "a quarter past 3"
        out.push(tk(H + ":" + two(m), sp0, "n"));
        i += 2;
        continue;
      }
      if (a.k === "n" && /^\d{1,2}$/.test(a.w) && b && b.k === "n" && /^\d{2}$/.test(b.w) && c && /^(am|pm)$/.test(c.l) && Number(a.w) <= 12 && Number(b.w) < 60) {
        out.push(tk(a.w + ":" + b.w, a.sp, "n"));
        i++;
        continue;
      }
      // money: "three dollars and fifty cents", "$3 and 50 cents", "a dollar fifty", "5 dollars"
      var isDollar = function(x) { return x && /^(dollars?|bucks?)$/.test(x.l); };
      var dollars = null,
        j = i;
      if (a.k === "n" && /^\$?\d+(\.\d+)?$/.test(a.w.replace(/,/g, "")) && isDollar(b)) {
        dollars = a.w.replace(/^\$/, "");
        j = i + 2;
      } else if ((a.l === "a" || a.l === "one") && isDollar(b) && b.l.charAt(b.l.length - 1) !== "s") {
        dollars = "1";
        j = i + 2;
      } else if (a.k === "n" && /^\$\d+$/.test(a.w.replace(/,/g, "")) && b) {
        dollars = a.w.slice(1);
        j = i + 1;
      }
      if (dollars !== null) {
        var k = j,
          cents = null;
        if (T[k] && T[k].l === "and") k++;
        var ct = T[k];
        if (ct && ct.k === "n" && /^\d{1,2}$/.test(ct.w) && /^\d+$/.test(dollars)) {
          var after = T[k + 1];
          if (after && /^cents?$/.test(after.l)) cents = { v: Number(ct.w), end: k + 2 };
          else if (j > i + 1 && k === j && (!after || after.k === "p" || OPWORD.test(after.l) || /^(each|for|per|a|an|in|on|at|every)$/.test(after.l)) && ct.w.length === 2) cents = { v: Number(ct.w), end: k + 1 }; // "a dollar fifty"
        }
        if (cents) {
          out.push(tk("$" + dollars + "." + two(cents.v), a.sp, "n"));
          i = cents.end - 1;
          continue;
        }
        if (j > i + 1) {
          out.push(tk("$" + dollars, a.sp, "n"));
          i = j - 1;
          continue;
        }
      }
      // "5 and 3/4" said with digits: a mixed number
      if (a.k === "n" && /^\d+$/.test(a.w) && b && b.l === "and" && c && c.k === "n" && !(last && /^(add|and|between|of)$/.test(last.l))) {
        var sl = T[i + 3],
          bot = T[i + 4];
        if (/^\d+\/\d+$/.test(c.w)) {
          out.push(tk(a.w + " " + c.w, a.sp, "n"));
          i += 2;
          continue;
        }
        if (/^\d+$/.test(c.w) && sl && sl.w === "/" && bot && bot.k === "n" && /^\d+$/.test(bot.w)) {
          out.push(tk(a.w + " " + c.w + "/" + bot.w, a.sp, "n"));
          i += 4;
          continue;
        }
      }
      // "the 7 times table" keeps its words
      if (a.l === "times" && last && last.k === "n" && b && /^tables?$/.test(b.l)) {
        out.push({ w: a.w, l: a.l, sp: a.sp, k: "w", keep: true });
        continue;
      }
      out.push(a);
    }
    return out;
  }

  // a story problem: three or more words that aren't math words (two in a longer sentence with no signs), and more of
  // them than signs ("x squared plus 5x plus 6 equals 0 using the quadratic formula" is still math)
  var SIGNWORD = /^(plus|minus|times|divided|multiplied|equals|equal|squared|cubed|over|root|power|[+\-×÷=^\/<>*])$/;

  function isStory(T, opts) {
    var other = 0,
      words = 0,
      signs = 0;
    T.forEach(function(t) {
      if (SIGNWORD.test(t.l) && !t.keep) signs++;
      if (t.k !== "w") return;
      words++;
      if (t.l.length > 1 && !has(MATHWORDS, t.l.replace(/'s$/, "")) && !t.keep) other++;
    });
    if (opts && opts.story) return true; // the story box: always a story
    return (other >= 3 || (other >= 2 && !signs && words >= 6)) && other > signs * 1.5;
  }

  /* ---------- a story problem: keep the words; split it into sentences ---------- */
  var QSTART = /^(how|what|which|who|find|calculate|determine|estimate)$/;
  var QNEXT = { how: /^(many|much|far|long|old|fast|tall|big|heavy|wide|deep|high|often|tall)$/, what: /^(is|was|will|are|were|did|does|do|would|percent|fraction)$/ };
  var NOBREAK = /^(and|or|but|to|know|tell|out|figure|wonder|wonders|ask|asks|asked|see|of|is|about|on|that|find|show|decide|explain|so|then|when|if|calculate|determine|estimate|exactly)$/;

  function storyText(T) {
    var s = "",
      since = 0,
      cap = true, // a capital at the start of each sentence
      first = "";
    for (var i = 0; i < T.length; i++) {
      var t = T[i],
        prev = T[i - 1],
        nx = T[i + 1];
      var brk = false;
      if (prev && t.k === "w" && QSTART.test(t.l) && since >= 3 && prev.k !== "p" && !NOBREAK.test(prev.l)) {
        if (t.l === "how" || t.l === "what") brk = !!(nx && QNEXT[t.l].test(nx.l));
        else if (t.l === "which" || t.l === "who") brk = !!(nx && /^(is|was|has|had|one|of|will|did|does)$/.test(nx.l));
        else brk = !!(nx && /^(the|how|her|his|their|each|out)$/.test(nx.l));
      }
      if (brk) {
        if (/^(if|when|after|before|since|suppose)$/i.test(first)) s += ","; // "If a train goes 60 miles an hour for 3 hours, how far …"
        else {
          s += ".";
          cap = true;
        }
        since = 0;
        first = t.l;
      }
      var w = t.w;
      if (cap && /[A-Za-z0-9$]/.test(w)) {
        w = w.charAt(0).toUpperCase() + w.slice(1);
        cap = false;
        first = t.l;
      }
      s += (s ? t.sp : "") + w;
      if (t.k === "p" && /^[.!?]$/.test(t.w)) {
        since = 0;
        cap = true;
      } else since++;
    }
    // a question mark at the end of a question
    s = s.replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim();
    var lastS = s.replace(/[.!?]+$/, "").split(/[.!?]\s+/).pop() || "";
    if (!/[.!?]$/.test(s)) s += /^(how|what|which|who|where|when|why|can|could|does|do|did|is|are|was|were|will|would|should|if)\b/i.test(lastS) ? "?" : "";
    return s;
  }

  /* ---------- a math problem: words → signs ---------- */
  var PH = [ // [words, what they become]
    ["plus or minus", "op:±"],
    ["is greater than or equal to", "op:≥"],
    ["greater than or equal to", "op:≥"],
    ["is more than or equal to", "op:≥"],
    ["is at least", "op:≥"],
    ["is less than or equal to", "op:≤"],
    ["less than or equal to", "op:≤"],
    ["is at most", "op:≤"],
    ["is not equal to", "op:≠"],
    ["not equal to", "op:≠"],
    ["does not equal", "op:≠"],
    ["doesn't equal", "op:≠"],
    ["is greater than", "op:>"],
    ["is more than", "op:>"],
    ["is bigger than", "op:>"],
    ["is less than", "op:<"],
    ["is smaller than", "op:<"],
    ["greater than", "cmp:>"],
    ["less than", "cmp:<"],
    ["is equal to", "op:="],
    ["equal to", "op:="],
    ["equals to", "op:="],
    ["equals", "op:="],
    ["equal", "op:="],
    ["multiplied by", "op:×"],
    ["multiplied with", "op:×"],
    ["divided by", "op:÷"],
    ["plus", "op:+"],
    ["minus", "op:-"],
    ["negative", "neg"],
    ["times", "times"],
    ["over", "over"],
    ["open parenthesis", "lp"],
    ["open parentheses", "lp"],
    ["open paren", "lp"],
    ["open parens", "lp"],
    ["open bracket", "lp"],
    ["open brackets", "lp"],
    ["left parenthesis", "lp"],
    ["left paren", "lp"],
    ["left bracket", "lp"],
    ["begin parenthesis", "lp"],
    ["parenthesis open", "lp"],
    ["close parenthesis", "rp"],
    ["close parentheses", "rp"],
    ["close paren", "rp"],
    ["close parens", "rp"],
    ["close bracket", "rp"],
    ["close brackets", "rp"],
    ["closed parenthesis", "rp"],
    ["closed parentheses", "rp"],
    ["closed paren", "rp"],
    ["closed bracket", "rp"],
    ["right parenthesis", "rp"],
    ["right paren", "rp"],
    ["right bracket", "rp"],
    ["end parenthesis", "rp"],
    ["end paren", "rp"],
    ["parenthesis close", "rp"],
    ["end of the quantity", "rp"],
    ["end of quantity", "rp"],
    ["end quantity", "rp"],
    ["close quantity", "rp"],
    ["the quantity", "lpq"],
    ["quantity", "lpq"],
    ["squared", "pow:2"],
    ["cubed", "pow:3"],
    ["raised to the power of", "pow"],
    ["to the power of", "pow"],
    ["raised to the", "pow"],
    ["raised to", "pow"],
    ["to the", "powq"],
    ["the square root of", "fn:sqrt"],
    ["square root of", "fn:sqrt"],
    ["square root", "fn:sqrt"],
    ["the cube root of", "fn:cbrt"],
    ["cube root of", "fn:cbrt"],
    ["cube root", "fn:cbrt"],
    ["root", "fnq:sqrt"],
    ["inverse sine of", "fn:arcsin"],
    ["inverse sine", "fn:arcsin"],
    ["arc sine of", "fn:arcsin"],
    ["arc sine", "fn:arcsin"],
    ["arcsine of", "fn:arcsin"],
    ["arcsine", "fn:arcsin"],
    ["inverse cosine of", "fn:arccos"],
    ["inverse cosine", "fn:arccos"],
    ["arc cosine of", "fn:arccos"],
    ["arc cosine", "fn:arccos"],
    ["arccosine of", "fn:arccos"],
    ["arccosine", "fn:arccos"],
    ["inverse tangent of", "fn:arctan"],
    ["inverse tangent", "fn:arctan"],
    ["arc tangent of", "fn:arctan"],
    ["arc tangent", "fn:arctan"],
    ["arctangent of", "fn:arctan"],
    ["arctangent", "fn:arctan"],
    ["sine of", "fn:sin"],
    ["sine", "fnq:sin"],
    ["sin of", "fn:sin"],
    ["sin", "fnq:sin"],
    ["cosine of", "fn:cos"],
    ["cosine", "fnq:cos"],
    ["cos of", "fn:cos"],
    ["cos", "fnq:cos"],
    ["tangent of", "fn:tan"],
    ["tangent", "fnq:tan"],
    ["tan of", "fn:tan"],
    ["tan", "fnq:tan"],
    ["secant of", "fn:sec"],
    ["secant", "fnq:sec"],
    ["sec of", "fn:sec"],
    ["cosecant of", "fn:csc"],
    ["cosecant", "fnq:csc"],
    ["csc of", "fn:csc"],
    ["cotangent of", "fn:cot"],
    ["cotangent", "fnq:cot"],
    ["cot of", "fn:cot"],
    ["natural log of", "fn:ln"],
    ["natural log", "fn:ln"],
    ["natural logarithm of", "fn:ln"],
    ["natural logarithm", "fn:ln"],
    ["ln of", "fn:ln"],
    ["l n of", "fn:ln"],
    ["l n", "fnq:ln"],
    ["ln", "fnq:ln"],
    ["log base", "logb"],
    ["logarithm base", "logb"],
    ["log of", "fn:log"],
    ["logarithm of", "fn:log"],
    ["log", "fnq:log"],
    ["factorial", "post:!"],
    ["degrees", "deg"],
    ["degree", "deg"],
    ["comma", "comma"],
    ["slash", "sl"],
    ["cents", "cents"],
    ["cent", "cents"]
  ].map(function(p) { return { w: p[0].split(" "), a: p[1] }; });
  var FILLER_START = [
    ["um"],
    ["uh"],
    ["so"],
    ["okay"],
    ["ok"],
    ["hey"],
    ["please"],
    ["can", "you", "tell", "me"],
    ["can", "you"],
    ["could", "you"],
    ["tell", "me"],
    ["what", "is"],
    ["what's"],
    ["whats"],
    ["what", "are"],
    ["how", "much", "is"],
    ["calculate"],
    ["compute"],
    ["work", "out"],
    ["figure", "out"],
    ["show", "me"]
  ];
  var VARS = /^[b-hj-z]$/;

  function matchAt(T, i, words) {
    for (var k = 0; k < words.length; k++)
      if (!T[i + k] || T[i + k].l !== words[k]) return false;
    return true;
  }

  function operandStart(T, j) { // could an operand start at T[j]?
    var t = T[j];
    if (!t) return false;
    if (t.k === "n") return true;
    if (t.k === "p") return /^[(\[√∛π-]$/.test(t.w);
    return VARS.test(t.l) || /^(negative|minus|open|left|the|quantity|square|cube|root|sqrt|pi|ex|why|sine|sin|cosine|cos|tangent|tan|log|ln|natural|e|a|i|x)$/.test(t.l);
  }

  function isOperand(o) { return !!o && (o.k === "n" || o.k === "v" || o.k === "rp" || o.k === "post" || o.k === "pw"); }

  function mathText(T) {
    // fillers at the start ("what is", "please") and the end ("please", "equals what", "?")
    var changed = true;
    while (changed && T.length) {
      changed = false;
      for (var f = 0; f < FILLER_START.length; f++) {
        var fw = FILLER_START[f];
        if (matchAt(T, 0, fw) && T.length > fw.length) {
          var nx0 = T[fw.length],
            nx1 = T[fw.length + 1];
          if (fw[0] === "what" && nx0 && VARS.test(nx0.l) && nx1 && /^(if|when|in)$/.test(nx1.l)) continue; // "what is x if …" keeps its words
          T = T.slice(fw.length);
          changed = true;
          break;
        }
      }
    }
    T = T.filter(function(t) { return !/^(um+|uh+|erm|hmm+)$/.test(t.l); });
    while (T.length && (/^[.?!,;]$/.test(T[T.length - 1].w) || T[T.length - 1].l === "please" || (T[T.length - 1].l === "what" && T.length > 1))) T = T.slice(0, -1);
    while (T.length > 1 && /^(equals|equal|is|=)$/.test(T[T.length - 1].l)) T = T.slice(0, -1); // "47 plus 38 equals"
    var hasVar = T.some(function(t) { return (t.k === "w" && (VARS.test(t.l) || t.l === "ex")) || (t.k === "n" && /\d[a-z]$/i.test(t.w)); }) || T.some(function(t) { return t.w === "="; });
    var O = [],
      i = 0;

    function push(t, k, sp) { O.push({ t: t, k: k, sp: sp }); }
    while (i < T.length) {
      var t = T[i],
        last = O[O.length - 1],
        hit = null;
      if (t.k === "w" && !t.keep) {
        for (var p = 0; p < PH.length; p++)
          if (matchAt(T, i, PH[p].w)) { hit = PH[p]; break; }
      }
      if (hit) {
        var a = hit.a,
          n = hit.w.length,
          after = i + n;
        if (a.indexOf("op:") === 0) {
          push(a.slice(3), "op");
          i = after;
          continue;
        }
        if (a.indexOf("cmp:") === 0) {
          if (hasVar && isOperand(last)) {
            push(a.slice(4), "op");
            i = after;
            continue;
          }
        } else if (a === "neg") {
          push("-", "neg");
          i = after;
          continue;
        } else if (a === "times") {
          if (isOperand(last) && operandStart(T, after)) {
            push("×", "op");
            i = after;
            continue;
          }
        } else if (a === "over") {
          if (isOperand(last) && operandStart(T, after)) {
            push("/", "sl");
            i = after;
            continue;
          }
        } else if (a === "lp" || a === "lpq") {
          push("(", "lp");
          O[O.length - 1].auto = a === "lpq";
          i = after;
          continue;
        } else if (a === "rp") {
          push(")", "rp");
          i = after;
          continue;
        } else if (a.indexOf("pow:") === 0) {
          if (isOperand(last)) {
            push("^", "pw");
            push(a.slice(4), "n");
            i = after;
            continue;
          }
        } else if (a === "pow" || a === "powq") {
          // "to the fourth (power)", "to the power of 3", "to the negative 2", "to the x", "to the one half"
          var x = T[after],
            ex = null,
            e2 = after;
          if (isOperand(last) && x) {
            var neg = "";
            if (x.l === "negative" || x.l === "minus" || x.w === "-") {
              neg = "-";
              e2++;
              x = T[e2];
            }
            if (x && x.k === "n" && /^-?(\d+(st|nd|rd|th)?|\d+\/\d+|\d*\.\d+)$/.test(x.w)) ex = x.w.replace(/(st|nd|rd|th)$/, "");
            else if (x && has(ORD, x.l) && x.l !== "first") ex = String(ORD[x.l]);
            else if (x && (x.l === "nth" || x.l === "n")) ex = "n";
            else if (x && (VARS.test(x.l) || x.l === "ex")) ex = x.l === "ex" ? "x" : x.l;
            if (ex !== null) {
              e2++;
              if (T[e2] && T[e2].l === "power") e2++;
              push("^", "pw");
              push(/\//.test(ex) ? "(" + neg + ex + ")" : neg + ex, "n");
              i = e2;
              continue;
            }
          }
        } else if (a.indexOf("fn:") === 0 || a.indexOf("fnq:") === 0) {
          if (a.indexOf("fn:") === 0 || operandStart(T, after)) {
            push(a.replace(/^fnq?:/, ""), "fn");
            i = after;
            continue;
          }
        } else if (a === "logb") {
          var b = T[after];
          if (b && (b.k === "n" || b.l === "e" || b.l === "ten")) {
            var bs = b.l === "ten" ? "10" : b.w;
            var e3 = after + 1;
            if (T[e3] && T[e3].l === "of") e3++;
            push("log_" + bs, "fn");
            i = e3;
            continue;
          }
        } else if (a.indexOf("post:") === 0) {
          if (isOperand(last)) {
            push(a.slice(5), "post");
            i = after;
            continue;
          }
        } else if (a === "deg") {
          var u = T[after];
          if (last && last.k === "n" && !(u && /^(fahrenheit|celsius|centigrade|kelvin|f|c|k)$/.test(u.l))) {
            push("°", "post");
            i = after;
            continue;
          }
        } else if (a === "comma") {
          push(",", "comma");
          i = after;
          continue;
        } else if (a === "sl") {
          push("/", "sl");
          i = after;
          continue;
        } else if (a === "cents") {
          if (last && last.k === "n" && /^\d{1,2}$/.test(last.t)) {
            last.t = "$0." + two(Number(last.t));
            i = after;
            continue;
          }
        }
      }
      // one token
      var l = t.l;
      if (t.k === "n") push(t.w, "n", t.sp);
      else if (t.k === "p") {
        var w = t.w;
        if (/^[+×÷=<>≤≥≠±]$/.test(w)) push(w, "op");
        else if (w === "*") push("×", "op");
        else if (w === "-") push("-", "op");
        else if (w === "/") push("/", "sl");
        else if (w === "^") push("^", "pw");
        else if (w === "(" || w === "[") push(w, "lp");
        else if (w === ")" || w === "]") push(w, "rp");
        else if (w === ",") push(",", "comma");
        else if (w === ";") push(";", "semi");
        else if (w === ":") push(":", "colon");
        else if (/^[!%°]$/.test(w)) push(w, "post");
        else if (w === "√") push("sqrt", "fn");
        else if (w === "∛") push("cbrt", "fn");
        else if (w === "π") push("π", "v");
        else if (/^[.?]$/.test(w)) {} else push(w, "w", t.sp);
      } else if (l === "the" && T[i + 1] && /^(square|cube|quantity)$/.test(T[i + 1].l)) {} // "the square root of"
      else if (l === "ex") push("x", "v");
      else if (l === "why" && ((i > 0 && isOperand(last)) || (last && last.k === "op") || (T[i + 1] && /^(equals|equal|=|squared)$/.test(T[i + 1].l)))) push("y", "v");
      else if (l === "pi") push("π", "v");
      else if (/^[a-z]$/.test(l) && l !== "a") {
        // f of x → f(x)
        if (/^[fgh]$/.test(l) && T[i + 1] && T[i + 1].l === "of" && operandStart(T, i + 2)) {
          push(l, "fn");
          i += 2;
          continue;
        }
        push(l, "v");
      } else if (l === "a" && isOperand(last) && last.k === "n" && !(T[i + 1] && T[i + 1].k === "w" && T[i + 1].l.length > 1)) push("a", "v");
      else push(t.w.toLowerCase() === t.w || t.w.length === 1 ? t.w : t.l, "w");
      i++;
    }
    return assemble(O);
  }

  // the signs and numbers put together the way the boxes read them
  function assemble(O) {
    var i, o;
    // "5 x 6" said for times
    var eq = O.some(function(x) { return x.k === "op" && x.t === "="; }),
      vars = O.filter(function(x) { return x.k === "v" && x.t !== "π"; }).length;
    for (i = 1; i < O.length - 1; i++)
      if (O[i].k === "v" && O[i].t === "x" && O[i - 1].k === "n" && O[i + 1].k === "n" && /^\$?[\d.,]+$/.test(O[i + 1].t) && !eq && vars === 1) O[i] = { t: "×", k: "op" };
    // a minus with nothing before it to take away from is a negative sign
    for (i = 0; i < O.length; i++) {
      var pv = O[i - 1];
      if (O[i].k === "op" && O[i].t === "-" && (!pv || /^(op|lp|comma|pw|neg|semi|fn|colon|sl)$/.test(pv.k) || (pv.k === "w" && !/^(and|or)$/.test(pv.t)))) O[i] = { t: "-", k: "neg" };
    }
    // a function takes the next term: sqrt 72 → sqrt(72), sin 30° → sin(30°)
    var R = [];
    for (i = 0; i < O.length; i++) {
      o = O[i];
      R.push(o);
      if (o.k !== "fn") continue;
      var j = i + 1;
      if (O[j] && O[j].k === "lp") continue;
      var start = j;
      if (O[j] && (O[j].k === "neg" || (O[j].k === "op" && O[j].t === "-"))) j++;
      if (!O[j] || (O[j].k !== "n" && O[j].k !== "v")) continue;
      j++;
      while (O[j] && O[j].k === "v" && O[j - 1].k !== "op") j++; // 2x
      if (O[j] && O[j].k === "pw" && O[j + 1]) j += 2;
      while (O[j] && O[j].k === "post") j++;
      R.push({ t: "(", k: "lp" });
      for (var q = start; q < j; q++) R.push(O[q]);
      R.push({ t: ")", k: "rp" });
      i = j - 1;
    }
    O = R;
    // brackets left open: "the quantity x plus 3" closes before = or at the end
    var open = [];
    R = [];
    O.forEach(function(x) {
      if (x.k === "op" && x.t === "=") {
        while (open.length && open[open.length - 1].auto) {
          open.pop();
          R.push({ t: ")", k: "rp" });
        }
      }
      if (x.k === "lp") open.push(x);
      if (x.k === "rp") {
        if (!open.length) return; // a closing bracket with nothing open
        open.pop();
      }
      R.push(x);
    });
    while (open.length) {
      var op = open.pop();
      R.push({ t: op.t === "[" ? "]" : ")", k: "rp" });
    }
    O = R;
    // a list of numbers said one after another: "3 5 7 and 9" → 3, 5, 7, 9
    R = [];
    for (i = 0; i < O.length; i++) {
      var run = [i],
        k = i;
      if (O[i].k === "n" && !(O[i - 1] && /^(op|pw|sl|neg|colon)$/.test(O[i - 1].k))) {
        for (;;) {
          var s1 = O[k + 1],
            s2 = O[k + 2];
          if (s1 && s1.k === "n") {
            k = k + 1;
            run.push(k);
          } else if (s1 && (s1.k === "comma" || (s1.k === "w" && s1.t === "and")) && s2 && s2.k === "n") {
            k = k + 2;
            run.push(k);
          } else break;
        }
      }
      var nextK = O[k + 1];
      if (run.length >= 3 && !(nextK && /^(op|pw|sl|post|v)$/.test(nextK.k))) {
        run.forEach(function(r, ri) {
          if (ri) R.push({ t: ",", k: "comma" });
          R.push(O[r]);
        });
        i = k;
      } else R.push(O[i]);
    }
    O = R;
    // put it together
    var s = "";
    for (i = 0; i < O.length; i++) {
      o = O[i];
      var p = O[i - 1],
        sp = " ";
      if (!p) sp = "";
      else if (o.k === "rp" || o.k === "post" || o.k === "comma" || o.k === "semi" || o.k === "pw" || o.k === "sl" || o.k === "colon") sp = "";
      else if (p.k === "lp" || p.k === "fn" || p.k === "pw" || p.k === "sl" || p.k === "neg" || p.k === "colon") sp = "";
      else if (o.k === "lp" && (p.k === "n" || p.k === "v" || p.k === "rp")) sp = ""; // 2(x + 3), (x + 1)(x - 1)
      else if (o.k === "v" && p.k === "n" && /^-?[\d.]+$|^\d+\/\d+$/.test(p.t) && !/\//.test(p.t)) sp = ""; // 5x
      else if (o.k === "v" && p.k === "v" && O[i - 2] && O[i - 2].k === "n" && /^\d/.test(O[i - 2].t) && O[i - 1].t !== "π") sp = ""; // 3xy
      s += sp + o.t;
    }
    return s.replace(/\s+/g, " ").trim();
  }

  function toMath(raw, opts) {
    var s = String(raw == null ? "" : raw)
      .replace(/[   ]/g, " ")
      .replace(/[’‘]/g, "'").replace(/[“”]/g, "\"")
      .replace(/[−–—]/g, "-").replace(/[⁄∕]/g, "/").replace(/[·⋅∙]/g, "×")
      .replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/½/g, " 1/2").replace(/¼/g, " 1/4").replace(/¾/g, " 3/4").replace(/⅓/g, " 1/3").replace(/⅔/g, " 2/3")
      .replace(/(\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirty|fifteen|forty|fourty|fifty|twenty|o'clock|oh \w+))\s*([ap])\.?\s?m\.?(?=\s|$|[,;!?])/gi, function(m, a, b) { return a + " " + b.toLowerCase() + "m"; })
      .replace(/\b(\d+)\s*-\s*(st|nd|rd|th)\b/g, "$1$2")
      .replace(/\s+/g, " ").trim();
    if (!s) return "";
    var T = numberPass(tokens(s));
    if (!T.length) return "";
    var mode = opts && opts.mode ? opts.mode : isStory(T, opts) ? "story" : "math";
    return mode === "story" ? storyText(T) : mathText(T);
  }

  /* ===================== the button, the notice, the status line ===================== */
  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.8M8.6 20.8h6.8"/></svg>';
  var CSS =
    ".ht-mic{flex:none;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;padding:0;margin:0;" +
    "border:1px solid var(--rule);border-radius:10px;background:var(--surface);color:var(--ink-2);cursor:pointer;vertical-align:middle;" +
    "touch-action:manipulation;position:relative}" +
    ".ht-mic:hover{color:var(--ink);border-color:var(--ink-3)}" +
    ".ht-mic:focus-visible{outline:2.5px solid var(--focus,var(--ink));outline-offset:2px}" +
    ".ht-mic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}" +
    ".ht-mic[aria-pressed=\"true\"]{color:#fff;background:#B42318;border-color:#B42318}" +
    ".ht-mic[aria-pressed=\"true\"] svg rect{fill:currentColor}" +
    ".ht-mic[aria-pressed=\"true\"]::after{content:\"\";position:absolute;inset:-5px;border-radius:inherit;border:2px solid #B42318;opacity:.5;" +
    "animation:htMicPulse 1.3s ease-out infinite}" +
    "@keyframes htMicPulse{from{transform:scale(.92);opacity:.6}to{transform:scale(1.12);opacity:0}}" +
    "@media (prefers-reduced-motion:reduce){.ht-mic[aria-pressed=\"true\"]::after{animation:none;opacity:.45}}" +
    ".ht-search .ht-mic{width:30px;height:30px;border-radius:999px}.ht-search .ht-mic svg{width:17px;height:17px}" +
    ".ask-row .ht-mic{width:44px;height:44px;border-radius:12px}" +
    "@media (max-width:480px){.ask-row .ht-mic,.ask-row .ht-cam{width:40px;height:40px}}" +
    "#decEntry .ht-mic,#fracEntry .ht-mic{align-self:flex-end;margin:0 0 4px 6px}" +
    "#decEntry .ht-mic+.ht-cam,#fracEntry .ht-mic+.ht-cam{margin-left:6px}" +
    ".ht-mic-status{font-family:var(--f-body,\"IBM Plex Sans\",Arial,sans-serif);font-size:13.5px;line-height:1.45;color:var(--ink-2);margin:8px 0 0;text-align:left}" +
    ".ht-mic-status[hidden],.ht-mic-note[hidden]{display:none}" +
    ".ht-mic-status.err{color:#B42318}" +
    ".ht-mic-status .ht-mic-heard{color:var(--ink);font-style:italic}" +
    ".ht-mic-note{font-family:var(--f-body,\"IBM Plex Sans\",Arial,sans-serif);font-size:14px;line-height:1.5;color:var(--ink);text-align:left;" +
    "margin:10px 0 0;padding:12px 14px;border:1px solid var(--rule);border-radius:12px;background:var(--surface);max-width:560px}" +
    ".ht-mic-note p{margin:0 0 8px}.ht-mic-note .small{font-size:13px;color:var(--ink-2)}" +
    ".ht-mic-note a{color:var(--ink);text-decoration:underline;text-underline-offset:2px}" +
    ".ht-mic-note button{font:inherit;font-size:14px;font-weight:600;color:var(--ink);background:var(--surface-2,var(--surface));" +
    "border:1px solid var(--ink-3);border-radius:999px;padding:6px 14px;margin:4px 8px 0 0;cursor:pointer;min-height:36px}" +
    ".ht-mic-note button.ok{background:var(--ink);color:var(--surface);border-color:var(--ink)}" +
    ".ht-mic-note button:focus-visible{outline:2.5px solid var(--focus,var(--ink));outline-offset:2px}" +
    ".ht-mic-float{max-width:min(560px,calc(100% - 32px));margin:8px auto 0;padding:8px 12px;border:1px solid var(--rule);border-radius:10px;background:var(--surface)}" +
    ".ht-mic-note.ht-mic-float{padding:12px 14px}" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]) .ht-mic-status.err{color:#FCA5A5}}" +
    ":root[data-theme=\"dark\"] .ht-mic-status.err{color:#FCA5A5}" +
    "html.embed .ht-mic,html.embed .ht-mic-status,html.embed .ht-mic-note{display:none !important}" +
    "@media print{.ht-mic,.ht-mic-status,.ht-mic-note{display:none !important}}";

  var spot = null,
    btns = [],
    statusEl = null,
    msgEl = null,
    heardEl = null,
    noteEl = null,
    rec = null,
    listening = false,
    heard = "",
    errored = null,
    hideTimer = null,
    quietTimer = null,
    capTimer = null,
    stopping = false,
    cancelled = false,
    localState = "unknown", // what the browser says about speech recognition on this device
    localMode = null; // "processLocally" | "ondevice" | null

  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }

  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var memOK = null; // when localStorage can't be used, the OK lasts for this page

  function consent() { return memOK || load().ok || null; }

  function lang() {
    var n = String(navigator.language || "");
    return /^en-/i.test(n) ? n : "en-US";
  }

  function offline() { return navigator.onLine === false; }

  function maker() { // whose speech service the browser sends the sound to
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "Apple";
    if (/Edg\//.test(ua)) return "Microsoft";
    if (/Chrome\/|Chromium\//.test(ua)) return "Google";
    if (/Safari\//.test(ua)) return "Apple";
    return "";
  }

  function setStatus(html, cls, keep, heardText) {
    if (!statusEl) return;
    clearTimeout(hideTimer);
    statusEl.className = "ht-mic-status" + (spot && spot.bar ? " ht-mic-float" : "") + (cls ? " " + cls : "");
    msgEl.innerHTML = html || "";
    heardEl.textContent = heardText ? " “" + heardText + "”" : "";
    statusEl.hidden = !html;
    if (html && !keep && cls !== "busy") hideTimer = setTimeout(function() { statusEl.hidden = true; }, 20000);
  }

  function setListening(on) {
    listening = on;
    btns.forEach(function(b) {
      b.setAttribute("aria-pressed", String(on));
      b.title = on ? "Stop listening" : "Say the problem (speech to text)";
    });
  }

  function makeButton() {
    var b = el("button", "ht-mic", MIC);
    b.type = "button";
    b.setAttribute("aria-label", "Say the problem");
    b.setAttribute("aria-pressed", "false");
    b.title = "Say the problem (speech to text)";
    b.addEventListener("click", onButton);
    btns.push(b);
    return b;
  }

  /* ---------- speech on this device, where the browser offers it ---------- */
  function checkLocal() {
    if (!SR) return Promise.resolve("unavailable");
    var p = null;
    try {
      if (typeof SR.available === "function") {
        p = SR.available({ langs: [lang()], processLocally: true });
        localMode = "processLocally";
      } else if (typeof SR.availableOnDevice === "function") {
        p = SR.availableOnDevice(lang());
        localMode = "ondevice";
      }
    } catch (e) { p = null; }
    if (!p || typeof p.then !== "function") return Promise.resolve("unavailable");
    return p.then(function(s) { return /^(available|downloadable|downloading)$/.test(s) ? s : "unavailable"; }, function() { return "unavailable"; });
  }

  function installLocal() {
    try {
      var p = localMode === "ondevice" && typeof SR.installOnDevice === "function" ? SR.installOnDevice(lang()) :
        typeof SR.install === "function" ? SR.install({ langs: [lang()], processLocally: true }) : null;
      if (p && typeof p.then === "function") return p.then(function(ok) { return ok !== false; }, function() { return false; });
    } catch (e) {}
    return Promise.resolve(false);
  }

  /* ---------- the one-time notice ---------- */
  function closeNote(focusBtn) {
    if (noteEl) noteEl.hidden = true;
    if (focusBtn && btns[0]) try { btns[0].focus(); } catch (e) {}
  }

  function showNote() {
    if (!noteEl) return;
    setStatus("");
    var local = localState === "available",
      who = maker(),
      html;
    if (local) {
      html = "<p><b>Say the problem.</b> This browser turns what you say into text <b>on this device</b>: the recording isn’t sent anywhere, " +
        "and Show The Steps doesn’t receive or keep it.</p>";
    } else {
      html = "<p><b>Say the problem.</b> Your browser will send what you say to its speech service (Google, Microsoft or Apple) to turn it into text. " +
        "Show The Steps doesn’t receive or keep the recording.</p>" +
        (who ? '<p class="small">In this browser that is ' + who + "’s speech service. Only the words come back, into the box.</p>" : "");
    }
    html += '<button type="button" class="ok" data-k="ok">OK, use the microphone</button>' +
      (localState === "downloadable" ? '<button type="button" data-k="local">Keep it on this device (one-time download)</button>' : "") +
      '<button type="button" data-k="no">Not now</button>' +
      '<p class="small" style="margin:8px 0 0">More on the <a href="' + esc(privacyLink()) + '">Privacy</a> page.</p>';
    noteEl.innerHTML = html;
    noteEl.className = "ht-mic-note" + (spot && spot.bar ? " ht-mic-float" : "");
    noteEl.hidden = false;
    noteEl.setAttribute("data-mode", local ? "local" : "cloud");
    var ok = noteEl.querySelector("button.ok");
    if (ok) try { ok.focus(); } catch (e) {}
  }

  function privacyLink() {
    try { if (window.HelperSite && window.HelperSite.url) return window.HelperSite.url("privacy.html#voice"); } catch (e) {}
    var path = location.pathname;
    return (/\/helpers\//.test(path) ? "../" : "") + "info/privacy.html#voice";
  }

  function onNote(e) {
    var b = e.target.closest && e.target.closest("button");
    if (!b) return;
    var k = b.getAttribute("data-k");
    if (k === "no") {
      closeNote(true);
      return;
    }
    if (k === "ok") {
      var mode = noteEl.getAttribute("data-mode");
      memOK = mode;
      var v = load();
      v.ok = mode;
      save(v);
      closeNote(false);
      start();
      return;
    }
    if (k === "local") {
      b.disabled = true;
      setStatus("Downloading the speech model for this device (once)…", "busy");
      installLocal().then(function(ok) {
        if (ok) {
          localState = "available";
          setStatus("");
          showNote(); // now it says "on this device"
        } else {
          b.disabled = false;
          setStatus("The speech model couldn’t be downloaded. You can use the browser’s speech service instead, or type the problem.", "err");
        }
      });
    }
  }

  /* ---------- listening ---------- */
  var ERRORS = {
    "not-allowed": "The microphone is blocked for this site. Allow it in the browser’s site settings (the icon at the left of the address bar, or Settings › Safari › Microphone on an iPhone), then press the microphone again.",
    "service-not-allowed": "This browser won’t turn speech into text here. On an iPhone, iPad or Mac, turn on Dictation (Settings › General › Keyboard) and Siri, then try again; or type the problem.",
    "audio-capture": "No microphone was found. Check that one is plugged in and turned on, then try again.",
    "no-speech": "No speech was heard. Press the microphone and say the problem, a little closer to it.",
    "language-not-supported": "This browser can’t turn English speech into text. Type the problem instead.",
    "network": "The browser’s speech service couldn’t be reached. Check the internet connection and try again, or type the problem. (Some browsers, like Brave, don’t include a speech service.)"
  };
  var NEED_NET = "Turning speech into text needs an internet connection in this browser (its speech service is online). Connect and try again, or type the problem.";

  function onButton(e) {
    if (e) e.stopPropagation();
    if (listening) {
      stop();
      return;
    }
    start();
  }

  function start() {
    if (listening || !SR || !spot) return;
    var ok = consent();
    var local = localState === "available";
    if (!ok || (ok === "local" && !local)) {
      if (localState === "unknown") {
        checkLocal().then(function(s) {
          localState = s;
          showNote();
        });
        return;
      }
      showNote();
      return;
    }
    closeNote(false);
    if (!local && offline()) {
      setStatus(NEED_NET, "err", true);
      return;
    }
    var r;
    try {
      r = new SR();
      r.lang = lang();
      r.interimResults = true;
      r.continuous = true;
      r.maxAlternatives = 1;
      if (local) {
        if (localMode === "ondevice") r.mode = "ondevice-only";
        else r.processLocally = true;
      }
    } catch (err) {
      warn(err);
      setStatus("The microphone couldn’t be started. Try again, or type the problem.", "err");
      return;
    }
    rec = r;
    heard = "";
    errored = null;
    stopping = false;
    cancelled = false;
    r.onresult = safe(function(ev) {
      if (rec !== r) return;
      var parts = [];
      for (var i = 0; i < ev.results.length; i++) {
        var res = ev.results[i],
          t = res && res[0] ? String(res[0].transcript || "").trim() : "";
        if (!t) continue;
        // some browsers repeat what came before in the next result: keep the longer one
        var pv = parts[parts.length - 1];
        if (pv && t.toLowerCase().indexOf(pv.toLowerCase()) === 0) parts[parts.length - 1] = t;
        else if (!(pv && pv.toLowerCase().indexOf(t.toLowerCase()) === 0)) parts.push(t);
      }
      heard = parts.join(" ").replace(/\s+/g, " ").trim();
      if (heard && !stopping) {
        setStatus("Listening… press the microphone again when you’re done.", "busy", true, heard);
        clearTimeout(quietTimer);
        quietTimer = setTimeout(function() { if (rec === r) stop(); }, 2600); // a pause: done
      }
    });
    r.onerror = safe(function(ev) {
      if (rec !== r) return;
      errored = (ev && ev.error) || "error";
      if (local && /^(language-not-supported|service-not-allowed)$/.test(errored)) localState = "unavailable";
    });
    r.onend = safe(function() { if (rec === r) finish(); });
    try { r.start(); } catch (err2) {
      warn(err2);
      rec = null;
      setStatus("The microphone couldn’t be started. Try again, or type the problem.", "err");
      return;
    }
    setListening(true);
    var ps = document.querySelector(".ht-cam-status");
    if (ps) ps.hidden = true;
    setStatus("Listening… say the problem." + (local ? " (Turned into text on this device.)" : ""), "busy", true);
    clearTimeout(quietTimer);
    quietTimer = setTimeout(function() { if (rec === r && !heard) stop(); }, 9000); // nothing said
    clearTimeout(capTimer);
    capTimer = setTimeout(function() { if (rec === r) stop(); }, 60000);
  }

  function stop(abort) {
    if (!rec) return;
    stopping = true;
    if (abort) cancelled = true;
    try {
      if (abort) rec.abort();
      else rec.stop();
    } catch (e) { finish(); }
    // in case the browser never says it has ended
    var r = rec;
    setTimeout(function() { if (rec === r) finish(); }, 3000);
  }

  function finish() {
    var r = rec;
    rec = null;
    clearTimeout(quietTimer);
    clearTimeout(capTimer);
    setListening(false);
    if (r) { r.onresult = r.onerror = r.onend = null; }
    if (cancelled) { setStatus("Stopped. Nothing was put in the box.", "", false); return; }
    if (errored === "aborted" && !heard) { setStatus(""); return; }
    if (heard) { put(heard); return; }
    if (errored === "network" && offline()) { setStatus(NEED_NET, "err", true); return; }
    if (errored && (errored === "service-not-allowed" || errored === "language-not-supported") && localState === "unavailable" && consent() === "local") {
      memOK = null;
      showNote(); // on-device didn't work: ask about the browser's service
      return;
    }
    setStatus(ERRORS[errored] || ERRORS["no-speech"], "err", errored === "not-allowed");
  }

  function fire(box, type) { box.dispatchEvent(new Event(type, { bubbles: true })); }
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var lastPut = null;

  function put(said) {
    var box = spot.box();
    if (!box) return;
    var story = box.tagName === "TEXTAREA" && /story/.test(box.className + " " + box.id);
    var text = toMath(said, story ? { story: true } : null);
    lastPut = { said: said, text: text };
    if (!text) {
      setStatus(ERRORS["no-speech"], "err");
      return;
    }
    if (spot.ready) spot.ready();
    box = spot.box();
    box.value = text;
    fire(box, "input");
    if (!spot.go) fire(box, "change"); // a whole problem in the first box: the page reads it now
    if (!coarse || spot.go) { try { box.focus(); var n = box.value.length; if (box.setSelectionRange) box.setSelectionRange(n, n); } catch (e) {} }
    setStatus("Heard “" + esc(said) + "”. " + (spot.go ? "Working it out…" : "Check the box, and fix anything that was misheard."), "", false);
    if (spot.go) setTimeout(safe(function() { go(box); }), 450);
  }

  function go(box) { // press the page's own button (Start, Show the steps), or Enter in the search box
    var scope = box.parentNode && box.parentNode.parentNode ? box.parentNode.parentNode : document;
    var b = [].filter.call(scope.querySelectorAll("button"), function(x) { return x.textContent.replace(/\s+/g, " ").trim().indexOf(spot.go) === 0; })[0];
    if (b) { b.click(); return; }
    var form = box.form;
    if (form) {
      if (form.requestSubmit) form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  }

  /* ===================== start ===================== */
  function shownElsewhere() { // framed, embedded (embed=1, embed=site) or the self-test: no button
    var framed = true;
    try { framed = window.top !== window.self; } catch (e) {}
    var href = location.href;
    try { var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0]; if (nav && nav.name) href += " " + nav.name; } catch (e) {}
    return framed || /[?&]embed=(1|site)/i.test(href) || root.classList.contains("embed") || /self-test|tests\.html/i.test(location.pathname);
  }

  function keepBeside(mic, cam) { // the page redraws its boxes (adding a number): put the microphone back beside the camera
    var holder = cam.parentNode;
    if (!holder) return;
    new MutationObserver(function() {
      if (cam.parentNode && (mic.nextElementSibling !== cam || mic.parentNode !== cam.parentNode)) cam.parentNode.insertBefore(mic, cam);
    }).observe(holder, { childList: true });
  }
  var tries = 0;

  function init() {
    if (!SR || document.querySelector(".ht-mic") || shownElsewhere()) return;
    var cams = document.querySelectorAll(".ht-cam"),
      s = window.HelperPhoto && window.HelperPhoto.spot && window.HelperPhoto.spot();
    if (!cams.length || !s) { if (tries++ < 100) setTimeout(safe(init), 150); return; }
    spot = s;
    var st = el("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    [].forEach.call(cams, function(cam) {
      var mic = makeButton();
      cam.parentNode.insertBefore(mic, cam);
      keepBeside(mic, cam);
    });
    statusEl = el("div", "ht-mic-status");
    msgEl = el("span");
    msgEl.setAttribute("role", "status");
    msgEl.setAttribute("aria-live", "polite");
    heardEl = el("span", "ht-mic-heard");
    statusEl.appendChild(msgEl);
    statusEl.appendChild(heardEl);
    statusEl.hidden = true;
    noteEl = el("div", "ht-mic-note");
    noteEl.setAttribute("role", "group");
    noteEl.setAttribute("aria-label", "Before you use the microphone");
    noteEl.hidden = true;
    noteEl.addEventListener("click", safe(onNote));
    noteEl.addEventListener("keydown", function(e) { if (e.key === "Escape") closeNote(true); });
    var ps = [].filter.call(document.querySelectorAll(".ht-cam-status"), function(x) { return !x.classList.contains("ht-mic-status"); })[0];
    if (ps && ps.parentNode) {
      ps.parentNode.insertBefore(statusEl, ps.nextSibling);
      ps.parentNode.insertBefore(noteEl, statusEl);
    } else {
      spot.status(statusEl);
      statusEl.parentNode.insertBefore(noteEl, statusEl);
    }
    document.addEventListener("keydown", function(e) { if (e.key === "Escape" && listening) stop(true); });
    document.addEventListener("visibilitychange", function() { if (document.hidden && listening) stop(true); });
    window.addEventListener("pagehide", function() { if (listening) stop(true); });
    checkLocal().then(function(st2) { localState = st2; });
  }

  window.HelperVoice = {
    toMath: toMath,
    supported: !!SR,
    start: safe(start),
    stop: safe(function() { stop(); }),
    listening: function() { return listening; },
    spot: function() { return spot; },
    last: function() { return lastPut; },
    local: function() { return localState; }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", safe(init));
  else safe(init)();
})();
