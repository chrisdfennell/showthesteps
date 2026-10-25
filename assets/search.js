/* Works out which helper a typed problem belongs to ("47 + 38" → The Carry Column, "15% of 80" → The Hundred Grid,
   "what is a denominator" → the Word List) and builds the link that opens it there. Used by the home page's
   "Type any problem" box and by the search box in the bar across the top of every page.
   HelperSearch.route(text) → { page, params, what, alt } (or { none:true }); HelperSearch.PAGE[file] → [name, color class];
   HelperSearch.href(result) → the full address to open (for result.alt too), wherever the page that asks is */
(function() {
  "use strict";
  var PAGE = {
    "addition.html": ["The Carry Column", "c-add"],
    "subtraction.html": ["The Borrow Bank", "c-sub"],
    "multiplication.html": ["The Product Ladder", "c-mul"],
    "division.html": ["The Division House", "c-div"],
    "fractions.html": ["The Fraction Bar", "c-fra"],
    "percents.html": ["The Hundred Grid", "c-pct"],
    "factors.html": ["The Factor Tree", "c-fac"],
    "integers.html": ["The Number Line", "c-int"],
    "pemdas.html": ["The Order Stack", "c-ord"],
    "algebra.html": ["The Balance Scale", "c-alg"],
    "geometry.html": ["The Shape Shop", "c-geo"],
    "glossary.html": ["the Word List", "c-ink"],
    "ratios.html": ["The Ratio Table", "c-rat"],
    "lines.html": ["The Slope Grid", "c-lin"],
    "stats.html": ["The Dot Plot", "c-sta"],
    "graphing.html": ["The Graph Paper", "c-gra"],
    "exponents.html": ["The Power Tower", "c-exp"],
    "probability.html": ["The Chance Spinner", "c-pro"],
    "counting.html": ["The Counting Tree", "c-cnt"],
    "trigonometry.html": ["The Unit Circle", "c-tri"],
    "calculus.html": ["The Rate Machine", "c-cal"],
    "number-sense.html": ["The Place Value Chart", "c-num"],
    "quadratics.html": ["The Area Box", "c-qua"],
    "logarithms.html": ["The Log Ladder", "c-log"],
    "sequences.html": ["The Number Staircase", "c-seq"],
    "wordproblems.html": ["The Story Problem", "c-wrd"],
    "flashcards.html": ["The Flash Cards", "c-fla"],
    "reference.html": ["the reference sheets", "c-ink"],
    "daily.html": ["the problem of the day", "c-day"],
    "scratch.html": ["The Scratch Paper", "c-scr"],
    "aviation.html": ["The Flight Computer", "c-avi"],
    "nursing.html": ["The Dose Calculator", "c-nur"],
    "carpentry.html": ["The Framing Square", "c-crp"],
    "electrical.html": ["The Circuit Board", "c-ele"],
    "cooking.html": ["The Recipe Card", "c-rcp"],
    "pharmacy.html": ["The Pill Counter", "c-pha"],
    "hvac-plumbing.html": ["The Pipe Wrench", "c-hvp"],
    "machining.html": ["The Machine Shop", "c-mch"],
    "automotive.html": ["The Gear Box", "c-aut"],
    "business.html": ["The Cash Register", "c-biz"],
    "real-estate.html": ["The Floor Plan", "c-rea"]
  };

  function go(page, params, what, alt) { return { page: page, params: params, what: what || "", alt: alt || null }; }

  function qp(s) { return "q=" + encodeURIComponent(s); }

  // a story problem: words around the numbers, and a question about them ("Ana has 12 shells. … How many …?")
  function isStory(s, low) {
    // the numbers may be written as words ("Omar had thirty-three stickers …")
    if (!/\d/.test(s) && !/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|(?:thir|four|fif|six|seven|eigh|nine)teen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|dozen|twice)\b/.test(low)) return false;
    var words = low.match(/[a-z']{2,}/g) || [];
    if (words.length < 7) return false;
    var asks = /\b(how (many|much|far|long|old|fast|tall|heavy|big)|what (is|was|will|time|did|does)|who|when|which|find)\b/.test(low) || /\?\s*$/.test(s);
    // one sentence can be a whole story too: "Find three consecutive even integers whose sum is 48.", "If 5 apples cost $45, how much do 13 cost?"
    return asks && (/[.!?]\s+\S/.test(s) || words.length >= 12 || /^\s*(?:if|find|how|what)\b/.test(low) && !/[=^<>]|\d[a-z]\b/.test(low) && /\b(?:consecutive|numbers?|integers?|cost|costs|old|apart|each|per)\b/.test(low));
  }

  // numbers and operators, or null if it isn't plain arithmetic
  function tokens(s) {
    var out = [],
      i = 0,
      m;
    while (i < s.length) {
      var rest = s.slice(i);
      if ((m = /^\s+/.exec(rest))) { i += m[0].length; continue; }
      // a mixed number (2 3/4), a fraction (3/4) or a decimal; only when it isn't a division sign between two numbers
      if ((m = /^\d[\d,]*\s+\d+\/\d+/.exec(rest)) || (m = /^\d+\/\d+/.exec(rest)) || (m = /^(\d[\d,]*(\.\d*)?|\.\d+)/.exec(rest))) {
        out.push({ t: "n", s: m[0].replace(/\s+/g, " "), frac: /\//.test(m[0]), dec: /\./.test(m[0]) });
        i += m[0].length;
        continue;
      }
      var c = s[i];
      if ("+-−–×*x÷:^()²³|".indexOf(c) >= 0) {
        out.push({ t: "o", s: c });
        i++;
        continue;
      }
      if (c === "/" && out.length && out[out.length - 1].t !== "o") {
        out.push({ t: "o", s: "÷" });
        i++;
        continue;
      } // "847 / 12"
      return null;
    }
    return out;
  }
  /* ===================== a problem typed in words ===================== */
  /* readTyped("what is forty-seven plus 38?") -> { q:"47 + 38", ans:null }; readTyped("subtract 5 from 12") -> { q:"12 - 5" }.
     Reads homework phrasing (what is, solve, show me how to do, = ?, step by step, please), number words (forty-seven,
     three fourths, two and a half, four point five), operator words (plus, take away, times, multiplied by, divided by,
     squared, to the power of), phrases (subtract 5 from 12, 5 less than 12, the sum of 4, 5 and 6, the product of 3 and 4,
     divide 12 by 3, how many times does 3 go into 12, 3 groups of 4), ½ ¼ ¾ …, $ and one shared unit (5 cm + 7 cm).
     Every word has to be used up, or it returns null and the page reads the text the way it always did. A phrase has to
     end the problem ("the sum of 2 and 3 times 4" could be read two ways, so it isn't read). ans: "remainder" | "decimal" |
     "fraction" when the words ask for one ("as a decimal"). The same reader is on the + − × ÷ pages, the Scratch Paper
     and the Order Stack; here search uses it to see which page a worded problem belongs on.
     TYPED.plain(text): the same text with the homework words gone and the numbers in digits, for routing only
     ("Problem 4: can you find the GCF of twelve and eighteen?" -> "gcf of 12 and 18"). */
  var TYPED = (function() {
    var ONE = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
      twenty: 20,
      thirty: 30,
      forty: 40,
      fourty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90
    };
    var SCALE = { hundred: 100, thousand: 1000, million: 1000000 };
    var DEN = {
      half: 2,
      halves: 2,
      third: 3,
      thirds: 3,
      fourth: 4,
      fourths: 4,
      quarter: 4,
      quarters: 4,
      fifth: 5,
      fifths: 5,
      sixth: 6,
      sixths: 6,
      seventh: 7,
      sevenths: 7,
      eighth: 8,
      eighths: 8,
      ninth: 9,
      ninths: 9,
      tenth: 10,
      tenths: 10,
      twelfth: 12,
      twelfths: 12,
      hundredth: 100,
      hundredths: 100
    };
    var VULG = {
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
      "⅐": "1/7",
      "⅛": "1/8",
      "⅜": "3/8",
      "⅝": "5/8",
      "⅞": "7/8",
      "⅑": "1/9",
      "⅒": "1/10"
    };
    var FRW = "halves|half|thirds?|fourths?|quarters?|fifths?|sixths?|sevenths?|eighths?|ninths?|tenths?|twelfths?|hundredths?";
    var W = "(?:" + Object.keys(ONE).concat(Object.keys(SCALE)).join("|") + ")";
    var NUM = "-?(?:\\d+ \\d+/\\d+|\\d+/\\d+|\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?|\\.\\d+)";
    var LIST = NUM + "(?:\\s*,\\s*" + NUM + ")*\\s*,?\\s+and\\s+" + NUM;
    var UNITS = "mm|cm|km|m|meters?|metres?|centimeters?|millimeters?|kilometers?|ft|feet|foot|inch(?:es)?|yd|yards?|mi|miles?|g|kg|mg|grams?|kilograms?|" +
      "lbs?|pounds?|oz|ounces?|ml|l|liters?|litres?|milliliters?|gal|gallons?|cups?|quarts?|pints?|cents?|¢|minutes?|mins?|hours?|hrs?|" +
      "seconds?|secs?|days?|weeks?|years?|degrees?|°|points?|pts|units?";
    var SEP = "(?:\\s*[:,]\\s*|\\s+)";
    var LEAD = new RegExp("^(?:please|pls|plz|hey|hi|hello|ok(?:ay)?|so|um+|hmm+|can (?:you|u|i|we)|could (?:you|u)|would (?:you|u)|will (?:you|u)|help(?: me)?(?: with)?|" +
      "i need help(?: with)?|i need to|i want to|i have to|i'?m trying to|how (?:do|would|can|should) (?:i|you|we)|how to|show me how to|show (?:me )?(?:the |your |all (?:the )?)?(?:work|steps|working)(?: for| of| to| on| in)?|(?:the )?steps (?:for|to|of)|show me|show|teach me(?: how)? to|" +
      "explain(?: how to)?|tell me|what(?:'s| is| are|s)?(?: the)? (?:answer|solution|result)(?: to| for| of)?|what(?:'s| is| are|s)|what does|what do (?:you|i) get(?: (?:when|if) (?:you|i))?|" +
      "how much (?:is|are)|solve|calculate|compute|evaluate|figure out|work out|find out|find|simplify|do|answer|the value of|value of|the|exactly|just|" +
      "quick(?:ly)?|question|problem|q|math|me|out|it|this|with|true or false|is|are|let me (?:do|try|work)(?: out)?|i'?ll do|" +
      "(?:use|using) (?:the )?(?:order of operations|pemdas|bodmas|bidmas|bedmas|long division|the standard algorithm|column (?:addition|subtraction)|regrouping)(?: to(?: solve| evaluate| simplify| find| do| work out)?)?|" +
      "order of operations|pemdas|bodmas|bidmas|bedmas|by hand|on paper|in columns)" + SEP);
    var TRAIL = new RegExp("(?:\\s*(?:[?.!]+|=\\s*(?:\\?+|_+|□|blank|what)?)|(?:^|\\s+)(?:please|pls|thanks|thank you|thx|for me|for my homework|step[- ]by[- ]step|" +
      "with (?:the |all (?:the )?)?(?:steps|work)|(?:and )?show(?:ing)? (?:me )?(?:the |your |my |all (?:the )?)?(?:work|steps)|by hand|on paper|in columns|vertically|myself|" +
      "(?:using |with |by )(?:the )?(?:order of operations|pemdas|bodmas|bidmas|bedmas|long division|the standard algorithm|regrouping|carrying|borrowing)|" +
      "long division|column (?:addition|subtraction|method)|(?:the )?standard algorithm|equals? what|is what|equals?|is equal to|equal to|come to|make|exactly|now|again|is|are|answer|real quick|quickly|asap))$");
    var ANS = /(?:\s*,\s*|\s+)(?:with (?:a |the )?remainders?|(?:and )?(?:give |write |show )?(?:the answer |it |your answer )?(?:as|in) (?:an? )?(decimals?|fractions?|mixed numbers?|remainders?)(?: form)?)$/;

    function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

    function wordsToNum(toks) { // ["three","hundred","forty","two"] -> 342, or null
      var total = 0,
        cur = 0,
        seen = false,
        last = "";
      for (var i = 0; i < toks.length; i++) {
        var t = toks[i];
        if (t === "and") {
          if (!/^(?:hundred|thousand|million)$/.test(last)) return null;
          last = t;
          continue;
        }
        if (t === "a" || t === "an") {
          if (i + 1 < toks.length && has(SCALE, toks[i + 1])) {
            cur = 1;
            seen = true;
            last = t;
            continue;
          }
          return null;
        }
        if (has(ONE, t)) {
          var v = ONE[t];
          if (v < 10 && cur % 10 !== 0) return null; // "five six"
          if (v >= 10 && cur % 100 !== 0) return null; // "forty twenty"
          cur += v;
          seen = true;
        } else if (t === "hundred") {
          if (!cur || cur >= 100) return null;
          cur *= 100;
        } else if (t === "thousand" || t === "million") {
          if (!cur) return null;
          total += cur * SCALE[t];
          cur = 0;
        } else return null;
        last = t;
      }
      return seen ? total + cur : null;
    }

    function numWords(s) {
      // "four point five" -> 4.5
      s = s.replace(new RegExp("\\b(" + W + "(?:[\\s-]+(?:" + W + "|and|an?))*)\\s+point\\s+(" + W + "(?:[\\s-]+" + W + ")*)\\b", "g"), function(x, a, b) {
        var w = wordsToNum(a.split(/[\s-]+/)),
          ds = b.split(/[\s-]+/),
          f = "";
        for (var i = 0; i < ds.length; i++) {
          var d = ONE[ds[i]];
          if (d === undefined || d > 9) return x;
          f += d;
        }
        return w === null ? x : w + "." + f;
      });
      var A = "(?:an?\\s+(?=(?:hundred|thousand|million)\\b))?";
      return s.replace(new RegExp("\\b" + A + W + "(?:(?:[\\s-]+|\\s+and\\s+(?=" + W + "\\b|an?\\s+(?:hundred|thousand)\\b))" + A + W + ")*\\b", "g"), function(x) {
        var n = wordsToNum(x.split(/[\s-]+/));
        if (n !== null) return String(n);
        var parts = x.split(/\s+and\s+/),
          out = []; // "forty-seven and thirty-eight": two numbers
        if (parts.length < 2) return x;
        for (var i = 0; i < parts.length; i++) {
          var v = wordsToNum(parts[i].split(/[\s-]+/));
          if (v === null) return x;
          out.push(v);
        }
        return out.join(" and ");
      });
    }

    function val(t) { // a number's value, to tell which is bigger
      t = String(t).replace(/,/g, "");
      var m;
      if ((m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(t))) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
      if ((m = /^(-?\d+)\/(\d+)$/.exec(t))) return Number(m[1]) / Number(m[2]);
      return Number(t);
    }

    function grp(list, op) { return "⟨" + list.join(" " + op + " ") + "⟩"; }

    function listOf(x) { return x.match(new RegExp(NUM, "g")); }

    function tidy(s) {
      var prev;
      do {
        prev = s;
        s = s.replace(LEAD, "").replace(TRAIL, "").replace(/^["']+|["']+$/g, "").trim();
      } while (s !== prev && s);
      return s;
    }

    function read(raw) {
      var s = String(raw == null ? "" : raw),
        ans = null,
        bad = false,
        m, prev;
      s = s.replace(/[   ]/g, " ").replace(/[−–—‒﹣－]/g, "-").replace(/[×✕✖⋅·∙]/g, "×").replace(/＋/g, "+").replace(/[⁄∕]/g, "/")
        .replace(/[’‘]/g, "'").replace(/[“”]/g, "\"")
        .replace(/(\d)?\s?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])/g, function(x, d, v) { return (d ? d + " " : " ") + VULG[v]; })
        .toLowerCase().replace(/\s+/g, " ").trim();
      if (!s || s.length > 300) return null;
      // a name tag like "(Lead Engineer)" says nothing about the math
      s = s.replace(/\(\s*[a-z][a-z .,'&\/-]*[a-z]\s*\)/g, " ").replace(/\s+/g, " ").trim();
      do {
        prev = s;
        s = tidy(s);
        if ((m = ANS.exec(s))) {
          var k = m[1] || "remainder";
          ans = /^dec/.test(k) ? "decimal" : /^(?:frac|mixed)/.test(k) ? "fraction" : "remainder";
          s = s.slice(0, m.index).trim();
        }
        // "47 + 38 = 95?": the problem, not the claim
        if (/\d\s*(?:[+×*÷\/:^-]|plus|minus|times|divided|over)\s*\.?\d/.test(s.replace(/=.*$/, "")) && /=\s*-?[\d.,\/ ]+$/.test(s)) s = s.replace(/\s*=\s*-?[\d.,\/ ]+$/, "");
      } while (s !== prev && s);
      if (!s) return null;
      // number words: "two and three fourths" is a mixed number, "one and a half" too
      s = s.replace(new RegExp("\\b(\\w+)\\s+and\\s+(?:a\\s+(half)|(\\w+\\s+(?:" + FRW + ")))\\b", "g"), function(x, w, h, f) { return w + " & " + (h ? "one half" : f); });
      s = numWords(s).replace(/\b(\d+(?:\.\d+)?) (hundred|thousand|million)\b/g, function(x, n, k) { var v = Number(n) * SCALE[k]; return Math.floor(v) === v ? String(v) : x; });
      s = s.replace(new RegExp("\\b(\\d+|an?)\\s+(" + FRW + ")\\b", "g"), function(x, n, d) {
        var nn = /^an?$/.test(n) ? 1 : Number(n);
        if (nn > 1 && !/s$/.test(d)) return x; // "three fourth"
        return nn + "/" + DEN[d];
      });
      s = s.replace(/(\d+) & (\d+\/\d+)\b/g, "$1 $2").replace(/ & /g, " and ");
      if (new RegExp("\\b(?:" + FRW + ")\\b").test(s.replace(/\bhalf of\b/g, ""))) return null;
      // money and units: "$" goes; a unit word goes when every number that has one has the same one
      if (/\$/.test(s) && /¢|\bcents?\b/.test(s)) return null;
      if (/\$|\d\s*(?:dollars?|bucks)\b/.test(s) && !ans) ans = "decimal"; // money divides into dollars and cents
      s = s.replace(/\$\s*/g, "").replace(/(\d)\s*(?:dollars?|bucks)\b/g, "$1");
      var ur = new RegExp("(" + NUM + ")\\s*(" + UNITS + ")(?![a-z])", "g"),
        seen = {},
        nu = 0;
      s.replace(ur, function(x, n, u) {
        seen[u.replace(/(?:es|s)$/, "").replace(/^(?:feet|foot)$/, "ft")] = 1;
        nu++;
        return x;
      });
      if (nu && Object.keys(seen).length > 1) return null;
      if (nu) s = s.replace(ur, "$1");
      // phrases
      s = s.replace(/\b(?:the\s+)?(?:sum|total)\s+of\s+/g, "Σ ").replace(/\b(?:the\s+)?product\s+of\s+/g, "Π ")
        .replace(/\b(?:the\s+)?difference\s+(?:of|between)\s+/g, "Δ ").replace(/\b(?:the\s+)?quotient\s+of\s+/g, "Ø ");
      s = s.replace(new RegExp("Σ (" + LIST + ")", "g"), function(x, l) { return grp(listOf(l), "+"); })
        .replace(new RegExp("Π (" + LIST + ")", "g"), function(x, l) { return grp(listOf(l), "×"); })
        .replace(new RegExp("Δ (" + NUM + ") and (" + NUM + ")", "g"), function(x, a, b) { if (val(a) < val(b)) bad = true; return grp([a, b], "-"); })
        .replace(new RegExp("Ø (" + NUM + ") and (" + NUM + ")", "g"), function(x, a, b) { return grp([a, b], "÷"); })
        .replace(new RegExp("\\badd (?:up |together )?(" + LIST + ")(?: together)?", "g"), function(x, l) { return grp(listOf(l), "+"); })
        .replace(new RegExp("\\badd (" + NUM + ") to (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "+"); })
        .replace(new RegExp("\\b(" + NUM + ") added to (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "+"); })
        .replace(new RegExp("\\bsubtract (" + NUM + ") from (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "-"); })
        .replace(new RegExp("\\b(" + NUM + ") subtracted from (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "-"); })
        .replace(new RegExp("\\btake (?:away )?(" + NUM + ") (?:away )?from (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "-"); })
        .replace(new RegExp("\\b(" + NUM + ") (?:less|fewer) than (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "-"); })
        .replace(new RegExp("\\b(" + NUM + ") more than (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "+"); })
        .replace(new RegExp("\\bmultiply (" + NUM + ") (?:by|and|times|with) (" + NUM + ")", "g"), function(x, a, b) { return grp([a, b], "×"); })
        .replace(new RegExp("\\bmultiply (?:together )?(" + LIST + ")", "g"), function(x, l) { return grp(listOf(l), "×"); })
        .replace(new RegExp("\\bdivide (" + NUM + ") by (" + NUM + ")", "g"), function(x, a, b) { return grp([a, b], "÷"); })
        .replace(new RegExp("\\bdivide (" + NUM + ") into (" + NUM + ") (?:equal )?(?:groups|parts|pieces|piles|teams|shares)", "g"), function(x, a, b) { return grp([a, b], "÷"); })
        .replace(new RegExp("\\bhow many times (?:does|do|will|can|would) (" + NUM + ") (?:go|goes|fit) into (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "÷"); })
        .replace(new RegExp("\\b(" + NUM + ") (?:goes|go|fits) into (" + NUM + ")(?: how many times)?", "g"), function(x, a, b) { return grp([b, a], "÷"); })
        .replace(new RegExp("\\bhow many (\\d+)'?s (?:are )?(?:there )?in (" + NUM + ")", "g"), function(x, a, b) { return grp([b, a], "÷"); })
        .replace(new RegExp("\\b(" + NUM + ") (?:groups|sets|rows|lots) of (" + NUM + ")", "g"), function(x, a, b) { return grp([a, b], "×"); })
        .replace(new RegExp("\\b(?:twice|double) (" + NUM + ")", "g"), function(x, a) { return grp(["2", a], "×"); })
        .replace(new RegExp("\\bhalf of (" + NUM + ")", "g"), function(x, a) { return grp(["1/2", a], "×"); })
        .replace(new RegExp("(\\d+/\\d+) of (" + NUM + ")", "g"), function(x, a, b) { return a + " × " + b; })
        .replace(new RegExp("\\b(?:the )?(square|cube) of (" + NUM + ")", "g"), function(x, k, a) { return a + "^" + (k === "square" ? 2 : 3); });
      // "add 4 + 5", "multiply 4 × 5", "divide 12 ÷ 4": the word and the sign say the same thing
      s = s.replace(new RegExp("\\badd (?=" + NUM + "\\s*\\+\\s*\\.?\\d)", "g"), "").replace(new RegExp("\\bmultiply (?=" + NUM + "\\s*[×*x]\\s*\\.?\\d)", "g"), "")
        .replace(new RegExp("\\bdivide (?=" + NUM + "\\s*÷\\s*\\.?\\d)", "g"), "");
      if (bad || /[ΣΠΔØ]/.test(s)) return null;
      // the words for the signs
      s = s.replace(/\bsquared\b/g, "^2").replace(/\bcubed\b/g, "^3")
        .replace(/\b(?:to the|raised to(?: the)?)\s+(?:power of\s+)?(\d+)(?:st|nd|rd|th)?(?:\s+power)?\b/g, "^$1")
        .replace(/\bplus\b|\badded to\b|\bincreased by\b/g, "+")
        .replace(/\btake ?away\b|\bminus\b|\bdecreased by\b|\bless\b/g, "-")
        .replace(/\bmultiplied (?:by|with)\b|\btimes\b/g, "×").replace(/\bdivided by\b/g, "÷")
        .replace(/(\d)\s+over\s+(?=\d)/g, "$1/").replace(/\bnegative\s+(?=\d|\.)/g, "-")
        .replace(/([\d)⟩])\s*x\s*(?=[\d.(⟨])/g, "$1 × ");
      s = tidy(s.replace(/\s+/g, " ").trim());
      if (!s || !/\d/.test(s) || !/^[\d\s.,+\-×*÷\/:^()\[\]{}²³⟨⟩]+$/.test(s)) return null;
      // "the sum of 2 and 3 times 4": (2 + 3) × 4 or 2 + 3 × 4? A phrase has to end the problem
      if (/⟩\s*\S/.test(s)) return null;
      if (/^⟨[^⟨⟩]*⟩$/.test(s)) s = s.slice(1, -1);
      s = s.replace(/⟨/g, "(").replace(/⟩/g, ")").replace(/\s+/g, " ").trim();
      return { q: s, ans: ans };
    }

    function plain(raw) {
      var s = String(raw == null ? "" : raw),
        prev;
      s = s.replace(/[−–—‒﹣－]/g, "-").replace(/[✕✖⋅·∙]/g, "×").replace(/[⁄∕]/g, "/").replace(/[’‘]/g, "'")
        .replace(/(\d)?\s?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅐⅛⅜⅝⅞⅑⅒])/g, function(x, d, v) { return (d ? d + " " : " ") + VULG[v]; })
        .toLowerCase().replace(/\s+/g, " ").trim();
      if (!s || s.length > 300) return s;
      // name tags and asides: "(Lead Engineer)", "(show your work)"
      s = s.replace(/\(\s*[a-z][a-z.,'&\/-]*(?:\s+[a-z.,'&\/-]+)+\s*\)|\(\s*[a-z]{4,}\s*\)/g, " ").replace(/\s+/g, " ").trim();
      // problem labels: "Problem 4:", "Q3)", "1)", "a)", "hw:", "4. Find …"; "Ms. Lee asks:"
      s = s.replace(/^(?:(?:problem|question|exercise|example|ex|hw|homework|q|#)\s*\d*[a-z]?\s*[:.)-]|\d{1,2}[a-z]?\s*\)|[a-z]\)|\d{1,2}\.\s+(?=[a-z]))\s*/, "")
        .replace(/^[a-z .']{1,40}\b(?:asks|says|wants to know)\s*:\s*/, "");
      do {
        prev = s;
        s = tidy(s);
      } while (s !== prev && s);
      s = s.replace(new RegExp("\\b(\\w+)\\s+and\\s+(?:a\\s+(half)|(\\w+\\s+(?:" + FRW + ")))\\b", "g"), function(x, w, h, f) { return w + " & " + (h ? "one half" : f); });
      s = numWords(s).replace(/\b(\d+(?:\.\d+)?) (hundred|thousand|million)\b/g, function(x, n, k) { var v = Number(n) * SCALE[k]; return Math.floor(v) === v ? String(v) : x; });
      s = s.replace(new RegExp("\\b(\\d+|an?)\\s+(" + FRW + ")\\b", "g"), function(x, n, d) {
        var nn = /^an?$/.test(n) ? 1 : Number(n);
        return nn > 1 && !/s$/.test(d) ? x : nn + "/" + DEN[d];
      }).replace(/(\d+) & (\d+\/\d+)\b/g, "$1 $2").replace(/ & /g, " and ");
      // the words for the signs, between numbers only ("7 times table" stays as it is)
      s = s.replace(/\bnegative\s+(?=\d|\.)/g, "-")
        .replace(/([\d)]|\b[a-z](?:\^\d+)?)\s*\bplus\s+(?=[\d(.-]|[a-z]\b)/g, "$1 + ").replace(/([\d)]|\b[a-z](?:\^\d+)?)\s*\bminus\s+(?=[\d(.-]|[a-z]\b)/g, "$1 - ")
        .replace(/([\d)])\s*\b(?:times|multiplied by)\s+(?=[\d(.-])/g, "$1 × ").replace(/([\d)])\s*\bdivided by\s+(?=[\d(.-])/g, "$1 ÷ ")
        .replace(/(\d|\b[a-z])\s+over\s+(?=\d|[a-z]\b)/g, "$1/").replace(/\s+(?:equals|is equal to)\s+/g, " = ");
      // powers in words: "10 to the sixth power", "3 to the power of -1", "i squared", "x to the 4th times x squared"; "f of x" is f(x)
      var ORD = { second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
      s = s.replace(/\s*\b(?:to\s+the\s+power\s+of|to\s+the\s+power|raised\s+to(?:\s+the)?(?:\s+power\s+of)?)\s+(-?\d+|[a-z]\b)(?:st|nd|rd|th)?(?:\s+power)?/g, "^$1")
        .replace(/\s*\bto\s+the\s+(second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|-?\d+(?:st|nd|rd|th))(?:\s+power)?\b/g, function(x, o) { return "^" + (ORD[o] || parseInt(o, 10)); })
        .replace(/([\d)]|\b[a-z])\s+squared\b/g, "$1^2").replace(/([\d)]|\b[a-z])\s+cubed\b/g, "$1^3")
        .replace(/((?:\d|\)|\b[a-z])(?:\^-?\d+)?)\s+times\s+(?=\b[a-z]\b|[\d(])/g, "$1 × ")
        .replace(/\b([fgh])\s+of\s+(-?\d+|[a-z])\b/g, "$1($2)");
      return s.replace(/\s+/g, " ").trim();
    }
    return { read: read, plain: plain };
  })();

  // a problem with homework words around it ("please solve 47+38", "what does 1000 / 8 equal", "Problem 4: GCF of twelve and
  // eighteen") goes where its plain form goes; the page gets the words as typed, since every page reads them now
  var WEAK = { "algebra.html": 1, "glossary.html": 1, "pemdas.html": 1, "exponents.html": 1, "fractions.html": 1, "ratios.html": 1, "wordproblems.html": 1, "percents.html": 1, "factors.html": 1 },
    LAST = { "algebra.html": 1, "glossary.html": 1, "pemdas.html": 1 };

  function route(raw) {
    var r = route0(raw),
      s = String(raw).replace(/\s+/g, " ").trim(),
      r2;
    if (!r || r.none) return r;
    // a story with sentences is read as it is ("Ms." doesn't end one)
    if (r.page === "wordproblems.html" && /[.!?]\s+\S/.test(s.replace(/\b(?:mr|mrs|ms|dr|st|vs)\.\s/gi, "x "))) return r;
    if (!WEAK[r.page]) return r;
    var t = TYPED.read(s),
      p = TYPED.plain(s);
    if (r.page === "glossary.html" && !/\d/.test(p)) return r; // "what is likely": a word to look up
    // "three thousand seven hundred forty-two": a number written in words
    if (!/\d/.test(s) && /^-?\d[\d,]*(?:\.\d+)?$/.test(p)) return go("number-sense.html", qp(s), "number sense");
    // "0.75 as a fraction", "7/4 as a decimal": one number in another form
    if (t && t.ans && /^-?[\d.,]+(?: \d+\/\d+|\/\d+)?$/.test(t.q)) return go("fractions.html", qp(s), "a number in another form");
    if (t && t.q !== s && (r2 = route0(t.q)) && r2.page !== r.page) return go(r2.page, qp(s), r2.what, r2.alt);
    // (never from a page that has the problem's kind to one that only catches what's left)
    if (p && p !== s.toLowerCase() && (r2 = route0(p)) && r2.page !== r.page && (!LAST[r2.page] || LAST[r.page])) return go(r2.page, qp(s), r2.what, r2.alt);
    return r;
  }

  function route0(raw) {
    // rows or equations typed one per line keep their breaks as "; " (a 3 × 3 matrix, a system of equations)
    var lines = String(raw).split(/\s*\n\s*/).filter(Boolean);
    raw = lines.length > 1 && lines.filter(function(l) { return /\d/.test(l); }).length >= 2 ? lines.join("; ") : String(raw);
    var s = raw.replace(/\s+/g, " ").replace(/∶/g, ":").replace(/⟨/g, "<").replace(/⟩/g, ">").replace(/％/g, "%")
      .replace(/\bper\s+cent\b/gi, "percent").replace(/(\d)\s*pct\b/gi, "$1%")
      .replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, function(x) { return /[⁻⁰¹⁴-⁹]/.test(x) || x.length > 1 ? "^" + x.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function(c) { return "-0123456789".charAt("⁻⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)); }) : x; }).trim();
    if (!s) return null;
    var low = s.toLowerCase();

    // a weather report, pasted: a METAR, SPECI or TAF goes to the Flight Computer's Weather tab ("KSEA 241753Z 18012KT 10SM
    // FEW040 BKN250 14/08 A3012"). It starts with METAR, SPECI or TAF, or has a station and a DDHHMMZ time, or three kinds of
    // METAR group (a wind like 18012KT, a cloud layer like BKN040, a temperature like 14/08, an altimeter like A3012 or
    // Q1013, a visibility like 10SM). A weather code asked about ("what does -SHRA mean") goes there too.
    var wxUp = " " + s.toUpperCase().replace(/;/g, " ") + " ",
      wxCode = /^\s*what\s+(?:does|do|is)\s+(?:the\s+)?(?:code\s+)?([+-]|VC)?(MI|PR|BC|DR|BL|SH|TS|FZ)?((?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)*)\s+mean\s*\??\s*$/.exec(s);
    if (/^\s*(?:METAR|SPECI|TAF)\s+[A-Z0-9]/.test(wxUp) || /\s[A-Z][A-Z0-9]{3}\s+\d{6}Z\s/.test(wxUp) || [/\s(?:\d{3}|VRB)\d{2,3}(?:G\d{2,3})?(?:KT|MPS)\s/, /\s(?:(?:FEW|SCT|BKN|OVC)\d{3}(?:CB|TCU)?|VV\d{3}|CLR|SKC|NSC|NCD|CAVOK)\s/, /\sM?\d{2}\/M?\d{2}\s/, /\s[AQ]\d{4}\s/,
        /\s[PM]?(?:\d{1,2}|\d\/\d{1,2}|\d \d\/\d{1,2})SM\s/
      ].filter(function(r) { return r.test(wxUp); }).length >= 3 ||
      wxCode && (wxCode[2] || wxCode[3]) && (wxCode[1] || wxCode[2] || wxCode[3].length >= 4))
      return go("aviation.html", "mode=metar&" + qp(s), "a weather report (METAR or TAF)");
    // winds aloft: an FB forecast (its heading, or a station's row like "SEA 2714 2725+05 2635+00 …"), or "winds aloft",
    // goes to the Flight Computer's Winds aloft tab. A row needs a sign or six digits in it (2725+05, 257743), so a list
    // of plain four-digit numbers doesn't count.
    var fbRow = /(?:^|\s)(?=[A-Z0-9]{3}\s)[A-Z0-9]*[A-Z][A-Z0-9]*\s+((?:(?:\d{4}(?:[+-]\d\d)?|\d{6})\s+){2,}(?:\d{4}(?:[+-]\d\d)?|\d{6}))(?=\s|;|$)/.exec(s);
    if (/\bwinds?\s+(?:and\s+temp(?:erature)?s?\s+)?aloft\b/i.test(s) || /\bFB(?:US|AK|HW|OC)3[123]\b|\bTEMPS\s+NEG\s+ABV\b|\bDATA\s+BASED\s+ON\s+\d{6}Z\b/.test(s) ||
      fbRow && /[+-]\d\d|\d{6}/.test(fbRow[1]))
      return go("aviation.html", "mode=windsaloft&" + qp(s), "winds aloft (an FB forecast)");

    // flash cards: "7 times table", "6, 7 and 8 times tables", "times tables 2 to 5", "division facts"
    if (/\b(flash ?cards?|times ?tables?|multiplication (?:tables?|facts)|(?:math|number|division|addition|subtraction) facts)\b/.test(low)) {
      var deck = /division/.test(low) ? "div" : /addition/.test(low) ? "add" : /subtraction/.test(low) ? "sub" : "times";
      var span = /\b(\d+)\s*(?:-|–|to|through)\s*(\d+)\b/.exec(low);
      var tables = span && +span[1] <= 20 && +span[2] <= 20 && +span[1] < +span[2] ? span[1] + "-" + span[2] :
        (low.match(/\d+/g) || []).filter(function(n) { return +n <= 20; }).map(Number).join(",");
      var big = (tables.match(/\d+/g) || []).some(function(n) { return +n > 12; }); // the teens: facts up to × 20
      return go("flashcards.html", "deck=" + deck + (tables && (deck === "times" || deck === "div") ? "&t=" + tables + (big ? "&max=20" : "") : ""), "flash cards");
    }
    // doing it by hand on the scratch paper: "by hand 478 + 356", "scratch paper", "let me do 47 × 23 myself"
    if (/\b(?:by\s+hand|scratch\s+paper|on\s+paper|myself|let\s+me\s+(?:do|try|work))\b/.test(low)) {
      var sum = s.replace(/\b(?:by\s+hand|scratch\s+paper|on\s+paper|myself|let\s+me\s+(?:do|try|work)(?:\s+it)?|do|work\s+out|i\s+want\s+to|can\s+i|please)\b/gi, " ").replace(/[?.!:]/g, " ").trim();
      var opm = /^[\d.,\s]+([+\-−×x*÷\/])[\d.,\s+\-−×x*÷\/]*$/.exec(sum),
        opk = opm && { "+": "add", "-": "sub", "−": "sub", "×": "mul", "x": "mul", "*": "mul", "÷": "div", "/": "div" } [opm[1]];
      return go("scratch.html", opk ? "op=" + opk + "&" + qp(sum.replace(/\s+/g, "").replace(/[x×]/g, "*").replace(/÷/g, "/").replace(/−/g, "-")) : "", "doing it by hand");
    }
    // the problem of the day
    if (/^\s*(?:today'?s\s+problem|problem\s+of\s+the\s+day|daily(?:\s+problem|\s+challenge)?|daily\s+math)\s*$/.test(low))
      return go("daily.html", "", "the problem of the day");
    // reference sheets: "formula sheet", "cheat sheet", "multiplication chart"
    if (/\b(reference(?!\s+angles?)|cheat ?sheets?|formula sheets?|formulas|(?:multiplication|times table|addition|hundreds?|prime) (?:chart|grid|table|square)s?|hundreds? chart|roman numerals?|primes? (?:to|up to|under) \d+|list of primes|prime factori[sz]ations? (?:chart|list|to \d+))\b/.test(low)) {
      var big = Math.max.apply(null, (low.match(/\d+/g) || ["0"]).map(Number));
      return go("reference.html",
        /roman/.test(low) ? "#roman" : /prime factori/.test(low) ? "#factorizations" : /prime/.test(low) ? "#primes" : /hundred/.test(low) ? "#hundreds" :
        /addition/.test(low) ? "#addition" : /multiplication|times/.test(low) ? (big > 15 ? "#times20" : big > 12 ? "#times15" : "#times") :
        /\b(area|perimeter|volume|geometry|shapes?)\b/.test(low) ? "#geometry" : "", "the reference sheets");
    }
    // paper to print: graph paper, grid paper, dot paper, number lines (the maker), or a blank grid to draw on
    if (/\b(?:graph|grid|dot|isometric|coordinate|squared?)\s+paper\b|\bnumber\s+lines?\s+(?:to\s+print|paper|sheet)|\bblank\s+(?:coordinate\s+(?:plane|grid)|graph|grid)\b/.test(low))
      return /\b(?:draw|plot|online|virtual|on screen)\b/.test(low) ? go("graphing.html", "mode=free", "a blank sheet of graph paper") :
        go("reference.html", "#paper", "graph paper to print", { page: "graphing.html", params: "mode=free" });
    // calculus: derivatives, limits, integrals, tangent lines, maximum and minimum ("d/dx x^3", "lim x->3 …", "∫ 2x dx")
    var hasX = /(?:^|[^a-z])[xt](?![a-z])/.test(low.replace(/\b(?:d\s*\/\s*d[xt]|d[xt])\b/g, " "));
    if (/\bd\s*\/\s*d[xt]\b|\bd²\s*\/\s*d[xt]²|\bderivatives?\b|\bdifferentiate\b|\b[fgy]\s*(?:'+|′+|″)\s*(?:\(|$|\s)/.test(low) ||
      /\blim(?:its?)?\b|\b[xt]\s*(?:→|->)\s*[−-]?\s*(?:\d|∞|inf|π|pi)|\b[xt]\s+approaches\b/.test(low) && hasX ||
      /\bintegra(?:l|ls|te)\b|∫|\bantiderivatives?\b|\bint_|\bint\b.*\bd[xt]\b|\bdy\s*\/\s*d[xt]\b|\bddx\b|\barea\s+under\b|\bincreasing\s+(?:and|or)\s+decreasing\b/.test(low) ||
      /\b(?:velocity|acceleration)\b/.test(low) && /\b[sh]\s*\(\s*t\s*\)/.test(low) ||
      /\baverage\s+rate\s+of\s+change\b/.test(low) && /\b(?:from|between)\s+[xt]\s*=/.test(low) ||
      /\btangent\s+(?:to|at)\b/.test(low) && hasX ||
      /\btangent\s+lines?\b|\bhorizontal\s+tangents?\b|\binstantaneous\s+rate\b|\bcritical\s+(?:points?|numbers?|values?)\b|\bextrem(?:a|um)\b|\binflection\b/.test(low) ||
      /\b(?:local|absolute|relative)?\s*(?:max(?:imum|ima)?|min(?:imum|ima)?)s?\b/.test(low) && (/x\s*(?:\^|\*\*|²|³)/.test(low) || /\[\s*[−-]?[\d.π]+\s*,\s*[−-]?[\d.π]+\s*\]/.test(s) && hasX) ||
      /\baverage\s+rate\s+of\s+change\b/.test(low) && /\[\s*[−-]?[\d.π]+\s*,\s*[−-]?[\d.π]+\s*\]/.test(s) && hasX)
      return go("calculus.html", /\d/.test(s) ? qp(s) : "mode=" + (/\blim/.test(low) ? "limit" : /integra|∫|antideriv/.test(low) ? "integral" : /tangent/.test(low) ? "tangent" :
        /max|min|critical|extrem|inflection/.test(low) ? "extrema" : /rate/.test(low) ? "rate" : "derivative"), "calculus");
    // a curve with sin, cos, tan, e^x or ln in it: graph it ("y = 3 sin(2x) + 1")
    if (/^\s*(?:graph\s*:?\s*)?(?:y|f\s*\(\s*x\s*\))\s*=/.test(low) && (s.match(/=/g) || []).length === 1 && /(?:^|[^a-z])x(?![a-z])/.test(low.replace(/^\s*f\s*\(\s*x\s*\)/, "")) &&
      /(?:^|[^a-z])(?:sin|cos|tan|ln|log)(?![a-z])|(?:^|[^a-z])e\s*(?:\^|\*\*)/.test(low) && !/\b(?:amplitude|period|midline|phase)\b/.test(low))
      return go("graphing.html", qp(s.replace(/^\s*graph\s*:?\s*/i, "")), "graphing");
    // "what is a logarithm", "define place value": the Word List (below), not the helper
    var asksWord = /^\s*(?:what\s+(?:is|are|does)|define|definition|meaning)\b/i.test(s) && !/\d/.test(s);
    var story = isStory(s, low);
    // auto shop, the Gear Box: gear ratios from teeth or gear × final drive, road speed ↔ rpm with gears and a tire, tire
    // sizes (P225/60R16, 33x12.50R15) and speedometer error, bore-and-stroke displacement, compression ratio, horsepower ↔
    // torque at an rpm, mpg and L/100 km and trip fuel cost, 2-stroke oil and coolant mixes, shop invoices (labor, parts
    // markup, tax). Plain unit changes ("350 cubic inches to liters", "1500 W to hp") stay with the Measuring Tape and the
    // Circuit Board, markups and tax with no shop words with the Hundred Grid, and story problems with the Story Problem.
    if (!asksWord && !story && (
        /\bgear\s+ratio\b[^?]*\d|\b\d+\s*-?\s*(?:teeth|tooth)\b|\b(?:ring\s+gear|pinion)\s*\d|\b\d+\s*(?:-\s*tooth\s+)?(?:pinion|ring\s+gear)\b|\bfinal\s+drive\b|\b(?:rear\s*end|axle)\s+(?:ratio|gears?)\b|\b\d\.\d+\s+(?:rear\s*end|gears)\b|\boverall\s+(?:gear\s+)?ratio\b|\b\d+(?:\.\d+)?\s+(?:first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th)\s+gear\b|\b\d(?:\.\d+)?\s+overdrive\b/.test(low) ||
        /\d\s*rpm\b/.test(low) && /\btires?\b|\bwheels?\b|\b[pt]?\d{3}\s*\/\s*\d{2}\s*z?r\s*\d{2}\b/.test(low) ||
        /\b(?:p|lt|st)?\d{3}\s*\/\s*\d{2}\s*z?r\s*\d{2}(?:\.\d)?\b|\b(?:lt)?\d{2}(?:\.\d+)?\s*x\s*\d{1,2}(?:\.\d+)?\s*r\s*\d{2}\b|\bspeedometer\b|\brevolutions\s+per\s+mile\b/.test(low) ||
        /\bbore\b[^?]*\bstroke\b|\bstroke\b[^?]*\bbore\b|\b(?:engine\s+)?displacement\b[^?]*\b(?:cylinders?|v\d{1,2})\b|\bcompression\s+ratio\b|\bclearance\s+volume\b|\bswept\s+volume\b|\bcombustion\s+chamber\b/.test(low) ||
        /\d\s*(?:lb\s*-?\s*ft|ft\s*-?\s*lbs?|pound\s*-?\s*feet|foot\s*-?\s*pounds|n\s*[·.\-]?\s*m|newton\s*-?\s*met(?:er|re)s?)\b[^?]*\b(?:rpm|hp|horsepower|kw)\b|\d\s*(?:hp|horsepower|kw)\b[^?]*\d\s*rpm\b|\btorque\b[^?]*\d\s*rpm\b|\d\s*rpm\b[^?]*\btorque\b/.test(low) ||
        /\bmpg\b|\bmiles\s+per\s+gallon\b|\bl\s*\/\s*100\s*km\b|\bliters?\s+per\s+100\s*km\b|\bfuel\s+economy\b|\bgas\s+mileage\b|\bodometer\b/.test(low) ||
        /\b\d+\s*:\s*1\b[^?]*\b(?:oil|gas|gasoline|fuel|premix|mix)\b|\b(?:oil|gas)\b[^?]*\b\d+\s*:\s*1\b|\b(?:2|two)\s*-?\s*(?:stroke|cycle)\b[^?]*\d|\b(?:antifreeze|anti-freeze|coolant)\b[^?]*\d|\d[^?]*\b(?:antifreeze|coolant)\b|\b(?:fl\.?\s*)?oz\s+(?:of\s+)?oil\b/.test(low) ||
        /\blabou?r\b[^?]*\d[^?]*\bparts?\b|\bparts?\b[^?]*\blabou?r\b|\b\d+(?:\.\d+)?\s*(?:hours?|hrs?)\s+(?:at|@)\s*\$\s*\d[^?]*\bparts?\b|\bparts?\b[^?]*\bmark\s*-?\s*up\b|\$\s*\d[\d.,]*\s+parts?\b[^?]*\b(?:mark\s*-?\s*up|margin)\b|\binvoice\b[^?]*\d/.test(low)))
      return go("automotive.html", qp(s), "auto shop math");
    // counting (counting.html): nCr / nPr / factorials, and "in how many ways…", arrangements, codes, outfits, handshakes, games,
    // diagonals; a chance worked out by counting (a committee chosen at random, a lottery) too — other probability stays with the
    // Chance Spinner. A point like P(1, 2) next to another point ("from P(1, 2) to Q(4, 6)") isn't P(n, r).
    var countFormula = (/\b\d+\s*[cp]\s*\d+\b|\b[cp]\s*\(\s*\d+\s*,\s*\d+\s*\)|\bn\s*[cp]\s*r\b|\b\d+\s+choose\s+\d+\b|\bbinom\s*\(|\d\s*!(?!=)|\bfactorial\b|[₀-₉]+\s*[CP]\s*[₀-₉]+/i.test(s)) &&
      (!/[=<>]/.test(s) || /\bn\s*=\s*\d+[^=<>]*\br\s*=\s*\d+\s*$|\bn\s*=\s*\d+\s*(?:,|and)\s*r\s*=\s*\d+/i.test(s)) && !/\b[a-z]\s*\(\s*[−-]?\d+\s*,\s*[−-]?\d+\s*\)[^.?]*\b(?:to|and)\s+[a-z]\s*\(/i.test(s);
    var countWords = /\bin\s+how\s+many\s+(?:different\s+|distinct\s+)?(?:ways|orders)\b|\bhow\s+many\s+(?:different\s+|distinct\s+|possible\s+|distinguishable\s+)?(?:ways|arrangements|combinations|permutations|outfits|handshakes|diagonals|line-ups|lineups|seatings|subsets)\b|\bshak(?:e|es|ing)\s+hands\b|\bhandshakes?\b|\bround[-\s]robin\b|\bnumber\s+of\s+(?:different\s+|distinct\s+)?(?:ways|arrangements|combinations|permutations|diagonals|handshakes|subsets)\b|\bpermutations?\b|\btaken\s+\d+\s+at\s+a\s+time\b|\barrangements?\s+of\s+the\s+(?:letters|word)\b|\bletters\s+(?:of|in)\s+(?:the\s+word\s+)?\w+[^.?]*\barrange|\b(?:arrange|arranged)\b[^.?]*\bletters\b|\bplays?\s+(?:each|every)\s+other\s+(?:team|player)\b|\bsends?\b[^.?]*\b(?:each|every)\s+other\b|\bhow\s+many\s+(?:different\s+)?(?:committees|teams|subsets|hands|license\s+plates|plates|codes|passwords|pins)\s+(?:have|has|contain|include)\b|\bhow\s+many\s+(?:different\s+)?[\w-]+\s+(?:with|consisting\s+of)\s+(?:one|1|a)\s+\w+\s*(?:,|and)\s+(?:one|1|a)\b|\bsequences\s+of\s+heads\b/i.test(s) ||
      /\bhow\s+many\s+(?:different\s+|distinct\s+|possible\s+|unique\s+)?(?:\d+[-\s](?:digit|letter|character|person|member|card|topping|scoop)\s+)?(?:numbers|codes|passwords|words|initials|zip\s+codes|pins|license\s+plates|plates|committees|teams|groups|outcomes|answer\s+keys|necklaces|bracelets|triangles|quadrilaterals|lines|line\s+segments|chords|games|cards|dinners|lunches|meals|sandwiches|pizzas|outfits|tickets|subsets|arrangements|hands|choices)\b[^.?]*\b(?:can\s+(?:be|you|she|he|they|we)\s+(?:made|formed|drawn|chosen|selected|created|written|arranged|played|dealt|ordered|make|form|choose|pick|order)|are\s+(?:possible|there|played|sent)|possible|is\s+it\s+possible|does\s+(?:the|a|an)\s+\w+\s+have)\b/i.test(s);
    var countChance = /\bprobability\b|\bchances?\b|\bodds\b/.test(low) && (/\bcommittee\b|\bteam\s+of\s+\d+\b|\b(?:chosen|selected|picked)\s+at\s+random\s+from\s+\d+\s+[a-z]+\s+and\s+\d+\s+[a-z]+/.test(low) || /\blotter(?:y|ies)\b/.test(low));
    if (!asksWord && (countFormula || countWords && !/\bprobability\b|\bchances?\b|\bodds\b/.test(low) || countChance))
      return go("counting.html", qp(s), "counting");
    // pharmacy first, before the Dose Calculator: a sig given for so many days ("500 mg TID x 10 days"), a days' supply,
    // or a quantity to dispense is the Pill Counter's even with mg, mL or insulin units in it (the nursing pages give one dose)
    if (!asksWord && (
        /\b(?:bid|tid|qid|qd|qhs|qod|q\s*\d+(?:\s*-\s*\d+)?\s*h(?:rs?)?|(?:once|twice)\s+(?:a\s+)?daily|daily)\b[^.?]*\b(?:x|for)\s*\d+\s*(?:days?|d|wks?|weeks?|months?)\b/.test(low) && /\d\s*(?:tabs?|tablets?|caps?|capsules?|tsps?|teaspoons?|tbsps?|puffs?|gtts?|drops?|sprays?|ml|mg|mcg|g|units?)\b/.test(low) ||
        /\bdays?['’]?\s*supply\b|\bquantity\s+to\s+dispense\b|\bhow\s+(?:many|much)\b[^.?]*\bto\s+dispense\b/.test(low)))
      return go("pharmacy.html", qp(s), "pharmacy math");
    // nursing, the Dose Calculator: doses by weight (mg/kg, mcg/kg/min), ordered and available (D/H × Q), IV rates (mL/hr), drip
    // rates (drop factor, gtt/min), infusion time, percent and 1:1000 strengths, dilutions, reconstitution, heparin and insulin
    // units, body surface area, and changes to or from mcg; other unit changes (lb to kg, °F to °C, tsp to mL) stay with the
    // Measuring Tape, and "units" alone (50 units an hour from a factory) stays with the rates
    if (!asksWord && (
        /\d\s*(?:mcg|micrograms?|mg|milligrams?|meq|units?)\s*(?:\/|per)\s*(?:kg|kilograms?)\b|\d\s*(?:mcg|micrograms?|mg|milligrams?)\s*(?:\/|per)\s*(?:min|minute|hr|hour)\b/.test(low) ||
        /\bdrop\s*factor\b|\bgtts?\s*(?:\/|per)\s*(?:ml|min)\b|\b(?:micro|macro)\s*-?\s*drip\b|\bdrops?\s+(?:per|a|\/)\s+min(?:ute)?\b/.test(low) ||
        /\d\s*(?:ml|cc)\s*(?:\/|per)\s*(?:hr|h|hour)\b/.test(low) ||
        /^\s*[\d.,]+\s*(?:ml|l|liters?|litres?)\s+(?:of\s+\S+\s+)?(?:over|in)\s+[\d.]+\s*(?:hours?|hrs?|h|minutes?|mins?)\b/.test(low) ||
        /\d\s*(?:ml|l)\b[^.?]*\b(?:over|in)\s+[\d.]+\s*(?:hours?|hrs?|minutes?|mins?)\b/.test(low) && /\b(?:infuse[ds]?|infusion|iv|bag|drip|pump|hang|ns|d5w|saline|ringer'?s?)\b/.test(low) ||
        /\b(?:order(?:ed|s)?|give|prescribed|desired)\b[^?]*\d\s*(?:mcg|mg|g|grams?|units?|meq)\b[^?]*\b(?:available|on\s+hand|have|has|supplied|tablets?|tabs?|capsules?|scored)\b/.test(low) ||
        /\d\s*(?:mcg|mg|g|units?|meq)\s*(?:per|\/|in)\s*[\d.]*\s*(?:ml|cc|tabs?|tablets?)\b/.test(low) && /\b(?:order|give|available|on\s+hand|how\s+many\s+(?:ml|tablets?|tabs?)|draw\s+up|bag|concentration|infus|vial|dose)/.test(low) ||
        /\b1\s*:\s*\d{1,3}(?:,?\d{3})+\b/.test(low) && /\b(?:epinephrine|adrenaline|mg|ml|solution|strength|dose)\b/.test(low) ||
        /\b(?:heparin|insulin|u-?100)\b/.test(low) && /\d/.test(low) ||
        /\bbsa\b|\bbody\s+surface\s+area\b|\bmosteller\b|\d\s*(?:mg|mcg|units?)\s*(?:\/|per)\s*(?:m2|m²|square\s+met(?:er|re))\b/.test(low) ||
        /\b(?:d5w|d10w|d5\s*1\/2\s*ns|normal\s+saline|nacl)\b|\d\s*%\s*(?:dextrose|ns|nacl|sodium\s+chloride|saline)\b/.test(low) && /\d/.test(low) ||
        /\breconstitut\w*\b|\bdiluent\b|\bc1\s*v1\b/.test(low) ||
        // a drug in a bag over a time ("cefazolin 1 g in 50 mL over 30 minutes")
        /\d\s*(?:mcg|mg|g|grams?|units?|meq)\s+in\s+[\d.,]+\s*(?:ml|cc|l)\b[^.?]*\bover\s+[\d.]+\s*(?:hours?|hrs?|h|minutes?|mins?)\b/.test(low) ||
        /^\s*[\d.,]+\s*(?:mcg|micrograms?)\s+(?:to|in|into)\s+\S|^\s*[\d.,]+\s*(?:mg|milligrams?|g|grams?)\s+(?:to|in|into)\s+(?:mcg|micrograms?)\b/.test(low)))
      return go("nursing.html", qp(s), "nursing math");
    // pharmacy, the Pill Counter: reading a sig (1 tab PO BID x 10 days), days' supply, quantity to dispense, alligation,
    // concentrations in % w/v, w/w and v/v, dilutions of a stock, scaling a compounding formula, Roman numerals on a
    // prescription (XIV tablets, #XC), AWP pricing, dispensing fees, copays, inventory turnover, and storage temperatures.
    // It comes after the Dose Calculator, so anything with a nursing cue (mg/kg, mL/hr, IV, D5W, epinephrine, heparin,
    // insulin units, ordered/available, 1:1000 with mg or mL) stays there. Plain unit changes (2 tsp to mL, 40 °F to °C)
    // stay with the Measuring Tape, "24 in Roman numerals" with the reference sheets, and a plain markup or profit
    // ("cost $40 markup 25%") with the Hundred Grid and the Money Jar: only a pharmacy word brings those here.
    var RXU = "(?:tabs?|tablets?|caps?|capsules?|tsps?|teaspoons?|tbsps?|tablespoons?|puffs?|gtts?|drops?|sprays?|ml)";
    if (!asksWord && (
        new RegExp("\\d\\s*" + RXU + "\\s+(?:[a-z.]+\\s+){0,3}?(?:p\\.?o\\.?|s\\.?l\\.?|o\\.?u\\.?|inh\\s+)?\\s*(?:bid|tid|qid|qd|qhs|qod|q\\s*\\d+(?:\\s*-\\s*\\d+)?\\s*h(?:rs?)?|prn)\\b").test(low) ||
        /\b(?:tabs?|caps?|gtts?)\s+(?:i{1,3}|iv|v|ss|iss)\s+(?:p\.?o\.?|s\.?l\.?|o\.?u\.?)\b/.test(low) ||
        new RegExp("\\d\\s*" + RXU + "\\s+(?:p\\.?o\\.?|s\\.?l\\.?|by\\s+mouth|orally|under\\s+the\\s+tongue)\\s+(?:daily|once|twice|three\\s+times|four\\s+times|every|at\\s+bedtime|q\\s*am|q\\s*pm)\\b").test(low) ||
        !story && /\b\d[\d,]*\s*(?:tabs?|tablets?|caps?|capsules?|vials?|inhalers?)\s+(?:are\s+|is\s+)?(?:on\s+hand|in\s+stock)\b/.test(low) ||
        /\bdays?['’]?\s*supply\b/.test(low) ||
        /\bhow\s+(?:many|much)\b[^.?]*\bto\s+dispense\b|\bquantity\s+to\s+dispense\b|\bdispense\s*#\s*[\divxlc]+/.test(low) ||
        /\balligation\b/.test(low) ||
        !story && /^\s*(?:mix|mixing|combine)\s+(?:a\s+)?\d[\d.]*\s*%[^.?]*\band\s+(?:a\s+)?(?:\d[\d.]*\s*%|water|petrolatum|(?:a\s+)?(?:diluent|base))[^.?]*\bto\s+(?:make|get|prepare)\s+(?:a\s+)?\d[\d.]*\s*%/.test(low) ||
        /\bhow\s+much\s+(?:\d[\d.]*\s*%|water|diluent|petrolatum)[^.?]*\b(?:add|added|mix)\b[^.?]*\d[\d.]*\s*(?:g|ml)\s+of\s+(?:a\s+|the\s+)?\d[\d.]*\s*%[^.?]*\bto\s+make\s+(?:a\s+)?\d[\d.]*\s*%/.test(low) ||
        /\b(?:w\s*\/\s*w|w\s*\/\s*v|v\s*\/\s*v)\b/.test(low) && /\d\s*%/.test(low) ||
        /\bhow\s+many\s+(?:grams?|g|mg|milligrams?|ml)\b[^.?]*\bin\s+[\d.,]+\s*(?:ml|g|grams?)\s+of\s+(?:a\s+|an\s+)?[\d.]+\s*%\s*(?:\w+\s+)?(?:solution|cream|ointment|gel|lotion|suspension|powder)\b/.test(low) ||
        /\bdilut\w*\s+[\d.,]+\s*ml\s+of\s+(?:a\s+|the\s+)?[\d.]+\s*%\s*(?:\w+\s+)?to\s+(?:a\s+)?[\d.]+\s*%/.test(low) ||
        /\bhow\s+much\s+(?:of\s+(?:the\s+|a\s+)?)?[\d.]+\s*%\s*(?:\w+\s+)?(?:stock\s+)?(?:solution\s+)?(?:is\s+needed\s+|do\s+you\s+need\s+)?to\s+make\s+[\d.,]+\s*ml\s+of\s+(?:a\s+)?[\d.]+\s*%/.test(low) ||
        /\d\s*%\s*(?:\w+\s+)?(?:to|in|as)\s+mg\s*\/\s*ml\b|\d\s*mg\s*\/\s*ml\s+(?:to|as|in)\s+(?:a\s+)?(?:percent|%)/.test(low) ||
        /\bformula\s+(?:is\s+)?(?:for|makes|to\s+make|that\s+makes)\s+[\d.,]+\s*(?:g|grams?|ml|kg|l)\b/.test(low) ||
        /\bq\.?s\.?\s+(?:ad\s+)?(?:to\s+)?[\d.]+\s*(?:g|ml)\b|\bcompound(?:ing|ed)?\b[^.?]*\b(?:scale|make|prepare)\b/.test(low) ||
        /^\s*(?:#|disp(?:ense)?\s*#?\s*)?[ivxlcdm]+(?:ss)?\s+(?:tabs?|tablets?|caps?|capsules?)\s*$|^\s*(?:disp(?:ense)?\s*)?#\s*[ivxlcdm]+(?:ss)?\s*$/.test(low) ||
        /\bawp\b|\baverage\s+wholesale\s+price\b|\bdispensing\s+fee\b/.test(low) || !/\b(?:beginning|ending|average)\s+inventory\b|\bcost\s+of\s+goods\s+sold\b|\bcogs\b|\breorder\s+point\b|\bsafety\s+stock\b/.test(low) && /\binventory\s+turnover\b|\bdays?\s+(?:of\s+)?(?:inventory|on\s+hand)\b/.test(low) ||
        /\bco-?\s*pays?\b[^.?]*\b(?:insurance|plan|third[-\s]party|reimburs\w*)\b|\b(?:insurance|plan)\b[^.?]*\bco-?\s*pays?\b/.test(low) ||
        !/\b(?:beginning|ending|average)\s+inventory\b|\bcost\s+of\s+goods\s+sold\b|\bcogs\b/.test(low) && /\binventory\b[^.?]*\bcost\s+of\s+goods\b|\bcost\s+of\s+goods\b[^.?]*\binventory\b/.test(low) ||
        /\bmark\s*-?\s*up\b|\bgross\s+(?:profit|margin)\b/.test(low) && /\b(?:pharmacy|pharmacist|prescriptions?|rx|drugs?|medications?|tablets?|capsules?|inhalers?)\b/.test(low) ||
        /\d\s*°?\s*[fc]\b|\d\s*degrees?\b/.test(low) && /\b(?:refrigerat\w*|fridge|freezer|vaccines?|controlled\s+room|room\s+temp\w*|storage\s+(?:range|temp\w*)|stored?\s+(?:at|between)\b|usp)\b/.test(low)))
      return go("pharmacy.html", qp(s), "pharmacy math");
    // HVAC and plumbing, the Pipe Wrench: BTU, BTU/hr, MBH, therms and tons of cooling (watts or kW only next to one of those),
    // CFM and air changes, ducts, heat loss through a wall or window (R-13, U-factor), gallons in a pipe or a tank, gpm and
    // fill times, feet of head and psi up a building, drain slope and fall, water heaters and recovery. Before aviation (fpm,
    // gph), carpentry (1/4" per foot), electrical (watts) and the unit changes (gallons); plain unit changes without a trade
    // word ("5 gallons to quarts", "1500 W to kW", "50 psi to kPa") stay where they were
    if (!asksWord && !story && /\d/.test(low) && !/\/\s*kwh\b|\bper\s+kwh\b|(?:¢|\bcents?\b)\s*(?:a|an)\s+kwh\b/.test(low) && (
        /\bbtu(?:'?s|h)?\b|\bmbh\b|\btherms?\b|\btons?\s+of\s+(?:cooling|refrigeration|air\s+conditioning)\b|\b\d+(?:\.\d+)?\s*-?\s*tons?\s+(?:ac|a\/c|air\s+conditioner|unit|system|heat\s+pump|condenser|rtu)\b/.test(low) ||
        /\bcfm\b|\bair\s+changes?\b|\b\d+(?:\.\d+)?\s*ach\b/.test(low) ||
        /\bducts?\b|\bductwork\b/.test(low) ||
        /\br\s*-\s*\d+(?:\.\d+)?\b/.test(low) && /\b(?:walls?|windows?|ceilings?|attics?|roofs?|floors?|doors?|insulation|sq\.?\s*ft|square\s+feet|heat\s+loss)\b/.test(low) ||
        /\bu\s*-?\s*(?:values?|factors?)\b|\bheat\s+(?:loss|gain)\b/.test(low) ||
        /\b(?:windows?|doors?|skylights?|glass|walls?)\b/.test(low) && /\bu\s*-?\s*(?:=\s*)?0?\.\d+\b/.test(low) ||
        /\b(?:pipes?|tubing|pex|copper\s+line)\b/.test(low) && /\bgal(?:lon)?s?\b|\bgpm\b|\bfeet\s+per\s+second\b|\bft\/s\b/.test(low) ||
        /\btanks?\b/.test(low) && /\b(?:diameter|across|tall|high|deep|by|x)\b/.test(low) && /\b(?:gal(?:lon)?s?|tall|high|deep)\b/.test(low) && !/\b(?:liters?|litres?|ml)\b/.test(low) ||
        /\bgpm\b|\bgallons?\s+(?:per|a|an)\s+minute\b/.test(low) ||
        /\b(?:feet|ft|foot)\s+of\s+(?:head|water)\b|\bhead\b.*\bpsi\b|\bpsi\b.*\b(?:floor|stor(?:y|ey)|(?:feet|ft)\s+(?:up|above|below|higher|lower))\b|\bwater\s+tower\b/.test(low) ||
        /\bdrain(?:s|age|\s+line|\s+pipe)?\b.*\b(?:per\s+(?:foot|ft)|slope|fall|grade)\b|\b(?:slope|fall|grade)\b.*\bdrain|\b(?:drop|fall)\s+of\s+[\d.\/ ]+\s*(?:"|in(?:ch(?:es)?)?)\s+(?:over|in|across)\s+[\d.]+\s*(?:'|ft|feet)\b/.test(low) ||
        /\bwater\s+heaters?\b|\brecovery\b.*\b(?:gph|btu|gallons?|rise)\b|\bgph\b.*\b(?:rise|degrees?)\b|\b\d+\s*(?:w|watts?|kw)\s+(?:heating\s+)?elements?\b/.test(low)))
      return go("hvac-plumbing.html", qp(s), "HVAC and plumbing");
    // aviation, the Flight Computer: wind triangle, runway winds, time/speed/fuel in knots and nautical miles, pressure and
    // density altitude, true airspeed, headings with variation and deviation, descent, weight and balance, turns, glide,
    // and aviation units (knots, nm, inHg, hPa, gallons of avgas or Jet A); plain unit changes stay with the Measuring Tape
    if (!asksWord && !story && (
        /\bwinds?\b/.test(low) && /\b(?:course|tc|crs)\b/.test(low) && /\b(?:tas|ktas|airspeed|air\s+speed)\b/.test(low) ||
        /\b(?:runway|rwy)\s*\d|\bcrosswind\b|\b(?:head|tail)wind\s+components?\b/.test(low) ||
        /\b(?:pressure|density)\s+altitude\b|\baltimeter\s+(?:setting\s+)?\d|\b(?:kias|kcas|ktas)\b|\btrue\s+air\s*speed\b/.test(low) ||
        /\b(?:tc|th|mh|ch)\s*\d{1,3}\b.*\b(?:variation|deviation)\b|\b(?:variation|deviation)\s+\d+(?:\.\d+)?\s*°?\s*(?:e|w|east|west)\b/.test(low) ||
        /\bdescen\w*\b.*\b(?:knots?|kts?|kt)\b|\btop\s+of\s+descent\b|\d\s*fpm\b/.test(low) ||
        /\bweight\s+and\s+balance\b|\bcenter\s+of\s+gravity\b|\bcg\s+limits?\b|\d\s*(?:lbs?|gal)?\s*@\s*\d+(?:\.\d+)?\s*,/.test(low) ||
        /\bstandard[-\s]*rate\s+turn\b|\bturn\s+radius\b|\bglide\s+ratio\b|\bdegrees?\s+of\s+bank\b|\d\s*°\s*bank\b/.test(low) ||
        /\d\s*(?:nm|nautical\s+miles?)\b.*\b(?:knots?|kts?|kt)\b|\b(?:knots?|kts?|kt)\s+for\s+\d|\bgph\b|\bfuel\b.*\bgal(?:lons)?\s*(?:\/|per|an?)\s*h(?:ou)?r\b/.test(low) ||
        /^\s*-?\d[\d,.]*\s*(?:knots?|kts?|kt|nm|nautical\s+miles?|inhg|in\s*hg|hpa|millibars?|mb)\s+(?:to|in|into)\s+\S/.test(low) ||
        /\d\s*(?:gal(?:lons)?|lbs?|pounds?)\s+(?:of\s+)?(?:avgas|jet\s*a|100\s*ll)\b/.test(low)))
      return go("aviation.html", qp(s), "aviation");
    // carpentry, the Framing Square: tape-measure sums with fractions of an inch (5' 7 3/8" + 2' 9 5/8"), a decimal to the
    // nearest 1/16, board feet, stairs, rafters and roof pitch, squaring (is it square, 3-4-5, out of square), studs, joists and
    // balusters on center, flooring/tile/sheets/paint with waste, concrete slabs, footings and post holes, miters and slopes;
    // feet-and-inches sums with no fraction of an inch ("5 ft 7 in + 3 ft 8 in") stay with the Measuring Tape
    if (!asksWord && !story && (
        /\d+\s*\/\s*(?:2|4|8|16|32|64)\b\s*(?:"|''|in\b|inch)|['′]\s*-?\s*\d+\s+\d+\s*\/\s*(?:2|4|8|16|32|64)\b/.test(low) &&
        (/\d\s*(?:"|''|in\b|inch(?:es)?\b|'|ft\b|feet\b)\s*(?:\+|-|−|plus|minus|less)\s*\d/.test(low) || /\b(?:half\s+of|halve|cent(?:er|re)\s+of|divided\s+into|into\s+\d+\s+equal)\b/.test(low)) ||
        /\bnearest\s+(?:1\s*\/\s*(?:8|16|32|64)|sixteenth|eighth|thirty-?second)s?\b/.test(low) ||
        /\bboard[-\s]*(?:feet|foot|ft)\b|\bbd\.?\s*ft\b/.test(low) ||
        // lumber by its nominal size and length ("4x4 10 ft", "10 2x4 8 ft at $3.98 each")
        /\b[1246]\s*x\s*(?:2|3|4|6|8|10|12)\b(?:\s*x\s*|\s+)\d+\s*(?:ft|feet|foot|')(?![a-z])/.test(low) ||
        // feet-and-inch marks with a diagonal, or a deck/slab/frame diagonal ("sides 9' and 12' diagonal 15' 1/2"")
        /\d\s*['′][^.?]*\bdiagonal\b|\bdiagonal\b[^.?]*\d\s*['′]|\bdiagonal\s+of\s+(?:a|the)\s+[^.?]*\b(?:deck|slab|foundation|patio|frame|wall)\b/.test(low) ||
        // a tape-measure reading to a decimal ("3 11/16" to decimal")
        /\d+\s+\d+\s*\/\s*(?:2|4|8|16|32|64)\s*(?:"|''|in(?:ch(?:es)?)?\b)\s*(?:to|as|in)\s+(?:a\s+)?decimals?\b/.test(low) ||
        /\btotal\s+rise\b|\b(?:stairs?|staircase|stairway)\b.*\b(?:rise|risers?|treads?|stringers?)\b|\bstringers?\b.*\b(?:rise|stairs?)\b|\b\d+\s+risers\b/.test(low) ||
        /\brafters?\b|\broof\s+pitch\b|\b\d+(?:\.\d+)?\s*(?:\/|:|\s+in\s+)\s*12\s+(?:pitch|roof)\b|\bpitch\b.*\b(?:run|span|rafters?|overhang)\b/.test(low) ||
        /\bis\s+(?:it|this|the\s+\w+)\s+square\b|\bout\s+of\s+square\b|\b3\s*-\s*4\s*-\s*5\b|\bsquar(?:e|ing)\s+(?:up\s+)?(?:a|the)\s+(?:corner|wall|deck|foundation|slab|frame|form)\b|\bdiagonals\s+\d/.test(low) ||
        /\b(?:studs?|joists?|trusses?)\b.*\b(?:on\s*-?\s*cent(?:er|re)|o\.?c\.?)(?![a-z])|\b\d+\s*(?:"|in(?:ch(?:es)?)?)?\s*(?:on\s*-?\s*cent(?:er|re)|o\.?c\.?)(?![a-z]).*\b(?:wall|floor|deck|studs?|joists?)\b|\bbalusters?\b|\bspindles?\b.*\bgap\b/.test(low) ||
        (/\d\s*%\s*(?:waste|extra|overage)\b|\bwaste\b.*\d\s*%/.test(low) || /\bpaint\b.*\b(?:coats?|walls?)\b/.test(low)) && /\d\s*(?:'|"|ft|feet|in)?\s*(?:by|x)\s*\d/.test(low) ||
        /\b4\s*x\s*8\s+sheets?\b|\bsheets?\s+of\s+(?:plywood|osb|drywall|sheathing)\b/.test(low) ||
        /\bconcrete\b|\bslab\b.*(?:\bthick\b|\binch|\d\s*in\b|")|\bfootings?\b.*\d.*\b(?:wide|deep)\b|\bpost\s*holes?\b|\bsonotubes?\b|\bbags?\s+of\s+(?:concrete|quikrete|sakrete|premix)\b/.test(low) ||
        /\bmiter|\bmitre|\bbevel\s+(?:angle|cut)|\bcrown\s+mo(?:u)?lding\b|\bcrown\b.*\b(?:corner|spring)\b|\bbaseboard\b.*\bcorner\b|\b\d+\s*-?\s*sided\s+frame\b|\b(?:hexagon|octagon|pentagon)(?:al)?\s+frame\b/.test(low) ||
        /\b\d+(?:\.\d+)?\s*(?:%|percent)\s+(?:slope|grade)\b.*\b(?:degrees?|angle)\b|\b(?:slope|grade|ramp)\b.*\b\d+(?:\.\d+)?\s*(?:degrees?|°).*\bpercent\b|\b\d+\s*\/\s*\d+\s*(?:"|in(?:ch)?)\s+per\s+(?:foot|ft)\b|\bramp\b.*\b1\s*:\s*\d+\b/.test(low)))
      return go("carpentry.html", qp(s), "carpentry");
    // machining and welding, the Machine Shop: spindle speed from SFM (or m/min), feeds and chip load, tap drills, TPI and
    // metric threads, tapers and the tailstock offset, bolt circles, sine bars and gauge blocks, the weight of a metal plate,
    // bar or tube, weld heat input, fillet throats and filler metal, and tolerances and fits. Every test needs a shop word
    // (SFM, chip load, tap drill, TPI, taper per foot, bolt circle, sine bar, a metal and a shape, weld, limits with ±,
    // hole and shaft); plain trig, circles and ± stay where they were. Volts and amps with a weld word come here, not to
    // the Circuit Board (below).
    if (!asksWord && !story && (
        /\bs\.?f\.?m\b|\bsurface\s+(?:feet|foot)\b|\bspindle\s+speeds?\b|\bcutting\s+speed\b/.test(low) ||
        /\brpm\b/.test(low) && /\b(?:drills?|end\s*-?\s*mills?|cutters?|lathe|reamers?|bar\s+stock|m\s*\/\s*min)\b|\bm\s*\/\s*min\b.*\b(?:drill|mill|cutter|lathe)\b/.test(low) ||
        /\bchip\s*-?\s*load\b|\bipt\b|\bipr\b|\bflutes?\b.*\brpm\b|\brpm\b.*\bflutes?\b|\bfeed\s+(?:rate\s+)?per\s+(?:tooth|rev(?:olution)?)\b|\b(?:mm|in(?:ch(?:es)?)?)\s*(?:\/|per)\s*(?:tooth|rev(?:olution)?)\b/.test(low) ||
        /\btap\s*-?\s*drills?\b|\btpi\b|\bthreads?\s+per\s+inch\b|\bun[cf]\b|#\s*\d+\s*-\s*\d+\b|\b\d+\s*\/\s*\d+\s*-\s*\d+\b[^?]*\b(?:taps?|threads?|drill)\b|\b(?:taps?|threads?|drill)\b[^?]*\b\d+\s*\/\s*\d+\s*-\s*\d+\b|\bpercent\s+(?:of\s+)?thread\b|\d\s*%\s*(?:of\s+)?thread\b|\bm\d+(?:\.\d+)?\s*[x×]\s*\d*\.?\d+\b[^?]*\b(?:tap|thread|drill|pitch|tpi)\b/.test(low) ||
        /\btaper\b[^?]*\d[^?]*\b(?:over|per\s+(?:foot|inch)|long)\b|\btapers?\s+per\s+(?:foot|inch)\b|\btailstock\s+(?:offset|set\s*-?\s*over)\b|\bmorse\s+taper\b/.test(low) ||
        /\bbolt\s*-?\s*(?:hole\s*)?circles?\b|\bpitch\s+circle\s+diameter\b|\bpcd\b/.test(low) ||
        /\bsine\s*-?\s*(?:bar|plate)s?\b|\bga(?:u)?ge\s+blocks?\b/.test(low) ||
        /\b(?:steel|alumin(?:um|ium)|stainless|brass|copper|cast\s+iron|bronze)\b/.test(low) && /\b(?:plates?|round\s+bar|square\s+bar|flat\s+bar|hex(?:\s+bar)?|bar\s+stock|tube|tubing|pipe|rod|sheet)\b/.test(low) && /\d/.test(low) &&
        /\bweigh(?:s|t)?\b|\bhow\s+heavy\b|\b(?:lbs?|kg|pounds?)\b|\d\s*(?:x|×|by)\s*\d|\blong\b|\b(?:od|dia(?:meter)?|across\s+flats)\b|\d\s*(?:ft|feet|foot|in(?:ch(?:es)?)?|mm|")(?![a-z])/.test(low) ||
        /\bweld(?:s|ing|ed)?\b|\bheat\s+input\b|\barc\s+energy\b|\b(?:smaw|gmaw|fcaw|gtaw)\b|\bfiller\s+(?:metal|wire|rod)\b|\bfiller\b[^?]*\bfillet\b|\bdeposition\s+efficiency\b|\bfillet\b[^?]*\b(?:throat|leg)\b|\bthroat\b[^?]*\bfillet\b|\bv\s*-?\s*groove\b/.test(low) ||
        /\b(?:hole|bore)\b[^?]*\b(?:shaft|pin)\b[^?]*\b(?:fit|clearance|interference)\b|\b(?:clearance|interference|transition)\s+fit\b|\d\s*(?:±|\+\s*\/\s*-)\s*\d*\.\d+[^?]*\blimits?\b|\d\s*\+\s*\d*\.\d+\s*-\s*\d*\.\d+[^?]*\b(?:limits?|tolerance)\b/.test(low)))
      return go("machining.html", qp(s), "machine shop math");
    // electrical, the Circuit Board: Ohm's law, power, series and parallel resistors, voltage drop, loads and breakers, energy
    // cost, the resistor color code, capacitors and RC, AC and three-phase. It needs an electrical unit or word next to the
    // numbers ("12 V across 4 ohms", "100 W bulb on 120 V", "brown black red gold", "1500 W to kW"); a story with ohms, kWh
    // or AWG in it comes here too. Single-letter units count only as capitals (2v + 3w stays algebra). Plain unit changes stay
    // with the Measuring Tape and money with the Money Jar.
    var COLR = "(?:black|brown|red|orange|yellow|green|blue|violet|purple|gr[ae]y|white|gold|silver)";
    var elStrong = /Ω|\d\s*(?:k|m|meg|kilo|mega)?\s*-?\s*ohms?\b|\bohm'?s\s+law\b|\bkwh\b|\bkilowatt[-\s]?hours?\b|\bawg\b|\d\s*(?:µ|μ|u|n|p)f\b|\b(?:micro|nano|pico)farads?\b|\bresistors?\b|\bcapacitors?\b|\bcapacitance\b|\bvoltage\s+drop\b|\btime\s+constant\b|\b(?:three|3)[-\s]?phase\b|\bpower\s+factor\b|\bhorsepower\b|\bcolou?r\s+code\b|\bpeak[-\s]to[-\s]peak\b|\brms\b|\bbreakers?\b|\b(?:4|5|four|five)[-\s]band\b|\d\s*(?:k|M)?Hz\b/i;
    var elV = /\d\s*(?:k|m|µ|μ|u)?V(?![A-Za-z])/.test(s) || /\d\s*(?:milli|kilo)?volts?\b/i.test(s),
      elA = /\d\s*(?:m|µ|μ|u)?A(?![A-Za-z])/.test(s) || /\d\s*(?:milli)?amp(?:ere)?s?\b/i.test(s),
      elW = /\d\s*(?:k|M|m)?W(?![A-Za-z])/.test(s) || /\d\s*(?:kilo|mega|milli)?watts?\b/i.test(s),
      elUnits = (elV ? 1 : 0) + (elA ? 1 : 0) + (elW ? 1 : 0);
    // resistors written as numbers: "100, 220 and 470 in series", "10k | 10k | 10k", "(1k | 2.2k) + 470", a period to a frequency
    var elNums = /\d(?:\.\d+)?\s*[km]?\s*(?:ohms?)?\s+in\s+(?:series|parallel)\b/i.test(s) ||
      /\d(?:\.\d+)?\s*k\s*\|\|?\s*\(?\s*\d|\d\s*\|\|\s*\d|^\s*\(?\s*\d+(?:\.\d+)?\s*[km]?\s*\|\s*\d+(?:\.\d+)?\s*[km]?\s*\|\s*\d/i.test(s) ||
      /\bfrequency\b[^.?]*\b\d+(?:\.\d+)?\s*(?:ms|µs|μs|us|seconds?)\b[^.?]*\bperiod\b|\bperiod\s+of\s+[\d.]+\s*(?:ms|µs|μs|us)\b/i.test(s);
    if (!asksWord && (elStrong.test(s) && /\d/.test(s) || elUnits >= 2 || elNums ||
        elUnits === 1 && /\b(?:volts?|amps?|watts?|voltage|current|resistance|power|bulbs?|lamps?|heaters?|circuit|battery|wire|appliances?|across|through|supply|draws?|outlet)\b/i.test(s) && !/[=<>]\s*[a-z]|\b[a-z]\s*[=<>]/i.test(s) ||
        /^\s*-?\d[\d,.]*\s*(?:k?W|watts?|kilowatts?|hp|horsepower)\s+(?:to|in|into)\s+(?:k?W|watts?|kilowatts?|hp|horsepower)\s*\??\s*$/i.test(s) ||
        new RegExp("^\\s*(?:(?:the\\s+)?(?:bands?|colou?rs?|resistor)\\s*:?\\s*)?(?:" + COLR + "[\\s,]+){2,4}" + COLR + "\\s*(?:bands?)?\\s*\\??\\s*$", "i").test(s)))
      return go("electrical.html", qp(s), "electrical math");
    // kitchen math, the Recipe Card: scaling a recipe (servings, double/halve, "2/3 cup sugar times 3", a pasted list),
    // grams ↔ cups for an ingredient, baker's percentages, food cost, oven settings (gas mark, convection), cooking time
    // per pound, pan sizes, brines and kitchen ratios. Plain unit changes ("1 1/2 cups to tablespoons", "350 F to C",
    // "how many cups in a gallon") stay with the Measuring Tape: only an ingredient, a recipe or a kitchen word brings them here.
    var KV = "(?:cups?|c\\.|tbsps?|tablespoons?|tsps?|teaspoons?|sticks?)",
      KW = "(?:g|grams?|kg|oz|ounces?|lbs?|pounds?)",
      FOOD = "(?:all[-\\s]purpose\\s+flour|flour|sugar|brown\\s+sugar|butter|rice|milk|honey|salt|water|oil|olive\\s+oil|vinegar|yeast|baking\\s+(?:soda|powder)|vanilla|cinnamon|cocoa|oats|broth|stock|cream|eggs?|cheese|chocolate\\s+chips)",
      kitchenLines = String(raw).split(/\s*(?:\n|;)\s*/).filter(function(l) { return new RegExp("^\\s*(?:\\d[\\d\\s\\/.]*|[½¼¾⅓⅔⅛])\\s*" + KV + "\\b", "i").test(l); }).length;
    if (!asksWord && !story && (
        /\b\d+\s+(?:servings?|portions?|people)\s+(?:to|into|for)\s+\d+\b|\bserves\s+\d+\b[^.?]*\b(?:to|make|need|feed)\s+\d+\b|\bscale\s+(?:a\s+|the\s+|this\s+)?(?:recipe|\d+\s+servings?)\b|\b(?:double|triple|halve|half)\s+(?:a|the|this)\s+recipe\b/.test(low) ||
        new RegExp("\\d\\s*" + KV + "\\s+(?:of\\s+)?[a-z][a-z\\s]*?\\s*(?:times|×|x|\\*)\\s*\\d|\\b(?:double|triple|halve)\\b[^.?]*\\d\\s*" + KV + "\\b").test(low) || kitchenLines >= 2 ||
        new RegExp("\\d\\s*" + KW + "\\s+(?:of\\s+)?" + FOOD + "\\b[^.?]*\\b(?:to|in|into|as)\\s+" + KV + "\\b|\\d\\s*" + KV + "\\s+(?:of\\s+)?" + FOOD + "\\b[^.?]*\\b(?:to|in|into|as)\\s+" + KW + "\\b|\\bhow\\s+many\\s+(?:grams|ounces)\\s+(?:is|are|in)\\s+(?:a|an|one|\\d[\\d\\s\\/.]*)\\s*" + KV + "\\s+(?:of\\s+)?" + FOOD + "\\b").test(low) ||
        /\bhydration\b|\bbaker'?s?\s+(?:percent|percentages?|%)|\b\d+\s*(?:g|kg)\s+(?:of\s+)?dough\b/.test(low) ||
        // a dough or recipe written in grams ("500 g flour, 350 g water, 10 g salt, 5 g yeast")
        (low.match(new RegExp("\\d\\s*(?:g|grams?|kg)\\s+(?:of\\s+)?" + FOOD + "\\b", "g")) || []).length >= 2 ||
        // eggs scaled, a fan oven, loaf pans ("3 eggs times 1/2", "200 C fan", "9x5 loaf to 8x4 loaf")
        /\b\d+\s+eggs?\s+(?:times|×|x|\*)\s*[\d½¼¾]/.test(low) || /\d{2,3}\s*°?\s*[cf]\s+(?:fan|convection)\b/.test(low) ||
        /\d+\s*(?:x|×)\s*\d+\s*(?:-?\s*(?:inch|in|"))?\s*loaf\b[^.?]*\b(?:to|into|for|vs\.?)\b/.test(low) ||
        /\bfood\s+cost\b|\bplate\s+cost\b|\bmenu\s+price\b|\bcost\s+per\s+serving\b|\brecipe\s+cost\b|\bper\s+recipe\b/.test(low) ||
        /\bgas\s+mark\b|\bconvection\b|\bfan\s+oven\b|\boven\b[^.?]*\d{3}\s*°?\s*[fc]\b|\d{3}\s*°?\s*[fc]\b[^.?]*\boven\b/.test(low) ||
        /\d\s*(?:-\s*)?(?:minutes?|mins?)\s*(?:per|a|\/|each)\s*(?:lb|pound|kg|kilo)\b/.test(low) ||
        /\d\s*(?:-\s*|\s)?(?:inch(?:es)?|in\.?|"|cm)?\s*-?\s*(?:round|square)s?\s+(?:cake\s+)?(?:pans?\s+)?(?:to|into|for|vs\.?|versus)\s+(?:a\s+|an\s+|two\s+|\d\s+)?\d|\d+\s*(?:x|×)\s*\d+\s*(?:-?\s*(?:inch|in|"))?\s*(?:pans?|dish)?\s+(?:to|into|for|vs\.?)\s+(?:a\s+|two\s+|\d\s+)?\d+(?:\s*(?:x|×)\s*\d+|\s*(?:-?\s*(?:inch|in|"|cm))?\s*(?:round|square))|\b(?:cake|baking|loaf|bundt|sheet)\s+pans?\b/.test(low) ||
        /\bbrine\b|\bvinaigrette\b|\bcoffee\b[^.?]*\d\s*:\s*\d|\brice\b[^.?]*\b(?:\d\s*:\s*\d|water)\b|\d\s*%\s*salt\b|\bsalt\b[^?]*\d\s*%[^?]*\b(?:meat|pork|chicken|beef|turkey|fish|water)\b/.test(low)))
      return go("cooking.html", qp(s), "kitchen math");
    // real estate, the Floor Plan: commission splits, the seller's net and loan payoff, PITI, LTV and how much house, property
    // tax in mills or per $100 on an assessed value, prorations at closing, cap rate / NOI / GRM / cash-on-cash, front feet and
    // price per acre or per square foot, the survey (NE 1/4 of the SW 1/4), rooms added up from a plan, and a home's
    // appreciation. Plain loans and payments ("$300,000 home, 20% down, 6.5% for 30 years") stay with the Money Jar, plain
    // percents with the Hundred Grid, one rectangle's area with the Shape Shop and acres to square feet with the Measuring Tape.
    var reBig = /\$\s*\d{1,3}(?:,\d{3}){1,}|\$\s*\d{5,}|\$\s*\d+(?:\.\d+)?\s*(?:k|m|million)\b/i.test(s);
    if (!asksWord && !story && (
        /\bcommissions?\b/.test(low) && !/\bsales\b/.test(low) && (/\bsplits?\b|\bbrokers?\b|\bbrokerages?\b|\blisting\b|\bhomes?\b|\bhouses?\b|\bproperty\b|\breal\s+estate\b|\brealtors?\b|\bon\s+the\s+first\s+\$/.test(low) || reBig) ||
        /\b(?:listing|selling|buyer'?s|cooperating|co-?op)\s+(?:side|broker(?:age)?)\b|\bco-?broke\b/.test(low) ||
        /\bpayoff\b|\bseller'?s\s+net\b|\bnet\s+(?:to|for)\s+(?:the\s+)?seller\b|\bnet\s+sheet\b|\bto\s+net\s+\$/.test(low) ||
        /\bpiti\b|\bltv\b|\bloan[-\s]to[-\s]value\b|\bhow\s+much\s+(?:house|home)\b/.test(low) ||
        /\bmills?\b|\bmill\s+(?:rate|levy)\b|\bassessed\b[^.?]*\$|\$[^.?]*\bassessed\b|\bproperty\s+tax(?:es)?\b|\bhomestead\s+exemption\b|\$\s*\d+(?:\.\d+)?\s+per\s+\$\s*100\b(?![\d,])/.test(low) ||
        /\bprorat(?:e|ed|ion|ions|ing)\b|\bday\s+of\s+closing\b/.test(low) ||
        /\bcap(?:italization)?\s+rate\b|\bnoi\b|\bnet\s+operating\s+income\b|\bgross\s+(?:rent|income)\s+multiplier\b|\bgrm\b|\bcash[-\s]on[-\s]cash\b|\brental\s+yield\b/.test(low) ||
        /\bfront\s+(?:feet|foot)\b|\bfrontage\b|\bprice\s+per\s+(?:an?\s+)?acre\b|\$\s*\d[\d,.]*\s*(?:per|an?|\/)\s*acre\b|\bprice\s+per\s+(?:square\s+foot|sq\.?\s*ft)\b/.test(low) && reBig ||
        /\b(?:ne|nw|se|sw)\s*1\s*\/\s*4\s+of\s+(?:the\s+)?(?:ne|nw|se|sw|n|s|e|w)\s*1\s*\/\s*[24]\b|\b(?:n|s|e|w)\s*1\s*\/\s*2\s+of\s+(?:the\s+)?(?:ne|nw|se|sw)\s*1\s*\/\s*4\b/.test(low) ||
        (low.match(/\d\s*(?:'|ft)?\s*(?:x|by)\s*\d/g) || []).length >= 2 && /\b(?:bed(?:room)?s?|kitchen|living\s+room|dining\s+room|family\s+room|floor\s+plan)\b/.test(low) ||
        reBig && /\b(?:homes?|houses?|property|condo|building)\b[^.?]*\b(?:apprecia|deprecia)\w*|\b(?:apprecia|deprecia)\w*\b[^.?]*\b(?:homes?|houses?|property)\b/.test(low) ||
        /\b(?:economic|useful)\s+life\b/.test(low) && reBig ||
        reBig && /\bbought\b[^.?]*\$[^.?]*\bsold\b[^.?]*\$/.test(low) && /\bpercent\b|%|\bgain\b|\bloss\b|\bappreciation\b/.test(low)))
      return go("real-estate.html", qp(s), "real estate");
    // business math, the Cash Register: markup vs margin and a price for a target margin (a markup then a markdown is the Money
    // Jar's); counting a cash drawer and the over/short, cash rounding to 5¢; tax-included prices and taxable lines; time cards
    // (in 8:45 out 5:15 with lunch), commission; break-even, profit and loss, inventory turnover and reorder points; buy N get M
    // free. Only business words bring a problem here: plain change ("change from $5 for $3.65"), overtime, stacked discounts,
    // tax with a tip, unit prices and story problems stay where they were.
    if (!asksWord && !story && (
        /\bmargins?\b(?!\s+of\s+error)/.test(low) && /\$|\d\s*%|\bmark-?\s*ups?\b|\bcost\b|\bprice\b/.test(low) && !/\bconfidence\b|\bsample\b/.test(low) ||
        /\bmark-?\s*ups?\b|\bmarked\s+up\b/.test(low) && /\bcost\b/.test(low) && /\bprice\b|\bsells?\b|\bmargin\b|\d\s*%/.test(low) && !/\bmark(?:ed|s)?\s*-?\s*down\b|\bmarkdown\b/.test(low) ||
        /\bcash\s+drawer\b|\b(?:count(?:ing)?\s+(?:the\s+)?)(?:till|drawer|register)\b|\bover\s*(?:\/|or)\s*short\b|\bfewest\s+(?:bills|coins)\b|\bcash\s+rounding\b|\bstart(?:ing)?\s+(?:cash|bank|float)\b|\bcash\s+sales\b/.test(low) ||
        /\btax[-\s]?(?:included|inclusive)\b|\bincluding\s+(?:\d+(?:\.\d+)?\s*%\s+)?(?:sales\s+)?tax\b|\bincludes\s+(?:\d+(?:\.\d+)?\s*%\s+)?(?:sales\s+)?tax\b|\bnon-?taxable\b|\btaxable\b|\breceipt\b.*\btax\b/.test(low) && !/\btip\b/.test(low) || /\bno\s+tax\b/.test(low) && (low.match(/\$\s*\d/g) || []).length >= 2 && /\d\s*%\s*(?:sales\s+)?tax\b|\btax\s+\d/.test(low) ||
        /\bclock(?:ed)?\s+(?:in|out)\b|\btime\s*cards?\b|\btimesheets?\b|\bin\s+\d{1,2}(?::\d\d)?\s*(?:am|pm)?\s+out\s+\d|\d(?::\d\d)?\s*(?:am|pm)?\s*(?:to|-)\s*\d{1,2}(?::\d\d)?\s*(?:am|pm)?\b[^?]*\b(?:unpaid\s+)?(?:lunch|break)\b|\bcommissions?\b[^?]*\$|\$[^?]*\bcommissions?\b/.test(low) ||
        /\bbreak[-\s]?even\b|\bfixed\s+costs?\b[^?]*\bvariable\s+costs?\b|\bcontribution\s+margin\b/.test(low) ||
        /\bcogs\b|\bcost\s+of\s+goods(?:\s+sold)?\b|\bgross\s+profit\b|\bnet\s+profit\s+margin\b|\boperating\s+expenses\b|\bprofit\s+and\s+loss\b|\bincome\s+statement\b/.test(low) ||
        /\binventory\s+turnover\b|\b(?:beginning|ending|average)\s+inventory\b|\bdays?\s+(?:on\s+hand|of\s+inventory)\b|\breorder\s+point\b|\bsafety\s+stock\b|\bweighted\s+average\s+cost\b|\baverage\s+cost\b[^?]*\d\s+(?:units?\s+)?(?:at|@)\s+\$[^?]*\d\s+(?:units?\s+)?(?:at|@)\s+\$|\d\s+(?:units?\s+)?(?:at|@)\s+\$[^?]*\d\s+(?:units?\s+)?(?:at|@)\s+\$[^?]*\baverage\s+cost\b|\blanded\s+cost\b/.test(low) || /\bunit\s+cost\b/.test(low) && /\b(?:case\s+of|cases\s+of|cartons?|pallets?|shipping|freight)\b/.test(low) ||
        /\bbuy\s+\d+\s*,?\s*get\s+\d+\s+free\b/.test(low)))
      return go("business.html", qp(s), "business math");
    // unit conversions: a measure to another unit ("5 ft 7 in to inches", "3.2 km to m", "60 mph to ft/s", "98.6 F to C",
    // "how many cups in a gallon"); "convert 7/4 to a decimal" stays with the fractions, below
    var UNIT = "(?:in(?:ch(?:es)?)?|ft|feet|foot|yd|yards?|mi|miles?|mm|cm|km|m|meters?|metres?|millimeters?|centimeters?|kilometers?|millimetres?|centimetres?|kilometres?|kgs|kms|kilos?|dm|decimeters?|decimetres?|hrs|mins|deg(?:rees?)?\\s*[fck]\\b|fluid\\s+(?:ounces?|oz)|mg|g|kg|grams?|milligrams?|kilograms?|oz|ounces?|lbs?|pounds?|tons?|tsp|tbsp|teaspoons?|tablespoons?|cups?|pt|pints?|qt|quarts?|gal|gallons?|ml|l|liters?|litres?|milliliters?|fl\\.?\\s*oz|sec(?:onds?)?|s|min(?:utes?)?|h|hr|hours?|days?|weeks?|years?|yr|°\\s*[fck]|[fck]|degrees?\\s+(?:fahrenheit|celsius)|fahrenheit|celsius|kelvin|mph|km\\/h|kph|ft\\/s|m\\/s|acres?|hectares?|ha|(?:square|sq\\.?|cubic|cu\\.?)\\s+(?:inch(?:es)?|feet|foot|yards?|miles?|meters?|centimeters?|ft|in|yd|mi|m|cm|mm|km)|(?:ft|in|yd|mi|m|cm|mm|km)\\s*(?:\\^\\s*[23]|[²³])|(?:feet|foot|inch(?:es)?|yards?|miles?|meters?|metres?|centimeters?|cm|m|ft|in)\\s+(?:squared|cubed))";
    var unitTo = new RegExp("(?:\\d[\\d.,\\/ ]*|\\b(?:half\\s+)?an?\\s+)\\s*" + UNIT + "(?![a-z])\\.?(?:[\\s\\d.,]*" + UNIT + "(?![a-z])\\.?)*\\s*(?:to|in|into|=\\s*(?:\\?+|_+)?|→|->|(?:is|are|equals?|makes?)\\s+how\\s+many)\\s*(?:how\\s+many\\s+|an?\\s+)?" + UNIT + "(?![a-z])", "i");
    var unitHowMany = new RegExp("\\bhow\\s+many\\s+" + UNIT + "\\s+(?:are\\s+)?(?:in|make|makes|is|are|equals?)\\b", "i");
    var unitMixed = /\d\s*(?:ft|feet|foot)\.?\s*\d+(?:\.\d+)?\s*(?:in\b|inch)|\d\s*(?:yd|yards?)\s*\d+\s*(?:ft|feet|foot)\b|\d\s*(?:lbs?|pounds?)\s*\d+\s*(?:oz|ounces?)\b|\d\s*(?:gal|gallons?)\s*\d+\s*(?:qt|quarts?)\b|\d\s*(?:pt|pints?)\s*\d+\s*cups?\b|\d+\s*['′]\s*\d+\s*(?:"|''|″|”)|\d\s*(?:h|hrs?|hours?)\s*\d+\s*(?:m|mins?|minutes?)\b(?![^.?!]*\b(?:after|before|from|until|till|later|past)\b)(?![^.?!]*\d:\d)/i;
    var unitRate = /\bper\s+[a-z]+\s+(?:to|in|into)\s+(?:[a-z]+\s+)?[a-z]+\s+per\s+[a-z]+/i;
    if (!asksWord && !story && (unitTo.test(low) || unitHowMany.test(low) || unitMixed.test(low) || unitRate.test(low) || /\bconvert\b[^%$]*\d[\d.,]*\s*(?:°|degrees?)\s*[fc]\b/.test(low)))
      return go("unit-conversions.html", qp(s), "unit conversions");
    // money math: compound interest, saving monthly, loans and payments, credit cards, paychecks, budgets, stacked discounts,
    // tax and tip, inflation; "how long until it doubles" stays with the Log Ladder and one plain percent with the Hundred Grid
    if (!asksWord && (/\bcompound(?:ed|ing)?\b/.test(low) && !/\bhow\s+(?:long|many\s+years)\b|\bdoubl|\btripl|\bhalf-?\s*life/.test(low) ||
        /\bloans?\b|\bmortgage\b|\bmonthly\s+payments?\b|\bamortiz|\bapr\b|\bapy\b|\bcredit\s+cards?\b|\bpaychecks?\b|\bsalary\b|\bovertime\b|\btime\s+and\s+a\s+half\b|\bbudget\b(?!\s+of\s+(?:at\s+most\s+)?\$)(?![^.?!]*\bline\b)|\b50\s*\/\s*30\s*\/\s*20\b|\binflation\b|\bpurchasing\s+power\b|\bgross\s+pay\b|\bnet\s+pay\b|\b401\s*\(?k\)?/.test(low) ||
        /\d+\s*(?:hours?|hrs?)\s+(?:at|@)\s+\$?\d/.test(low) ||
        /\bmonthly\s+deposits?\b|\bdeposits?\s+(?:needed|each|every|per)\b|\bsave\s+(?:each|every|per|a)\s+month\b|\bsave\s+for\s+an?\s+\$|\bborrow\w*\s+\$|\d\s*%\s+down\b|\bbi-?weekly\b|\btake-?\s*home\b|\bpay\s+(?:it\s+)?off\b|\b50\s*[-–]\s*30\s*[-–]\s*20\b/.test(low) ||
        /\b(?:put|invest|deposit|save)\w*\s+\$?\d[\d,.]*\s+(?:a|per|each|every)\s+month\b/.test(low) || /\brent\b.*\bincome\b|\bincome\b.*\brent\b/.test(low) ||
        /\d\s*%\s*off\b.*\b(?:then|and\s+then|plus|another|extra)\b.*\d\s*%\s*off/.test(low) ||
        /\btax\b.*\btip\b|\btip\b.*\btax\b/.test(low) && /\d/.test(low) ||
        /\bmarkup\b.*\bmarkdown\b|\bmark(?:ed)?\s+up\b.*\bmark(?:ed)?\s+down\b/.test(low) ||
        /\b(?:save|saving|deposit(?:ing)?)\s+\$?\d[\d,.]*\s+(?:a|per|each|every)\s+month\b/.test(low)))
      return go("money-math.html", qp(s), "money math");
    // college statistics: the normal curve, z-scores, binomial, intervals, tests, regression ("P(X < 85) mean 70 sd 10")
    // ("line of best fit" and "scatter" stay on the Graph Paper, above)
    if (!asksWord && (/\bz[-\s]?(?:scores?|tests?)\b|\bnormal(?:ly)?\s+distribut|\bbell\s+curve\b|\bbinomial\b|\bconfidence\s+intervals?\b|\bmargin\s+of\s+error\b|\bhypothes[ie]s\b|\bnull\b|\bp-?values?\b|\bt-?tests?\b|\bregression\b|\bcorrelation\b|\bleast[-\s]squares\b|\bcentral\s+limit\b|\bsampling\s+distribution\b|\bstandard\s+error\b|\bempirical\s+rule\b|\b68\s*[-–]\s*95\s*[-–]\s*99/.test(low) ||
        /\bp\s*\(\s*[x-z]?\s*[<>≤≥=]/.test(low) && /\b(?:mean|sd|standard\s+deviation|μ|σ|mu|sigma)\b|[μσ]/.test(low) ||
        /\bstandard\s+normal\b|\bstandardi[sz]e\b|\bstandard\s+deviations?\s+(?:above|below|from)\b|\bz\s+(?:for|of|when)\s+(?:x\s*=\s*)?[−-]?\d|\b(?:area|proportion|percent)\s+(?:to\s+the\s+(?:left|right)\s+of|between|above|below)\s+z\b|\bp\s*\(\s*[−-]?[\d.]+\s*<\s*[xz]\s*<|\bp\s*\(\s*z\s*[<>≤≥]/.test(low) ||
        /\bn\s*=\s*\d+\b.*\bp\s*=\s*0?\.\d/.test(low) || /\bci\b|\d\s*%\s*(?:confidence|c\.i\.)/.test(low) ||
        /\bt\s+tests?\b|\bproportion\s+tests?\b|\bh[0₀a]\s*:|\bha\s*:/.test(low) ||
        /\b(?:mean|mu|average)\b|μ/.test(low) && /\b(?:sd|s\.d\.|sigma|standard\s+deviation)\b|σ|\bs\.d\./.test(low) &&
        /\b(?:above|below|between|greater|less|more|fewer|top|bottom|percent|proportion|probability|percentile|within|at\s+(?:least|most)|standardi[sz]e|z)\b|\bp\s*\(/.test(low)))
      return go("college-statistics.html", qp(s), "statistics");
    // matrices and vectors: [[1,2],[3,4]], det, row reduce, <3, 4>, dot and cross products, three or more equations at once
    var eqList = s.split(/\s*(?:;|\band\b)\s*/i).filter(function(x) { return /=/.test(x); });
    if (!asksWord && (/\[\s*\[|\bmatri(?:x|ces)\b|\bdeterminants?\b|\bdet\s*[\[(]|\brref\b|\brow[-\s]?(?:reduc|echelon|operations?)|\baugmented\b|\bgauss(?:ian|-jordan)?\b|\bcramer|\bvectors?\b|\bdot\s+product\b|\bcross\s+product\b|\bunit\s+vector\b|\bprojection\s+of\b|\borthogonal\b/.test(low) ||
        /\[\s*[−-]?\d[\d\s.,−-]*;/.test(s) || /\|\s*[−-]?\d[\d\s.−-]*;[^|]*\|/.test(s) || /\|\s*[a-z]\s*\|\s*(?:for|of|where|if|when)\b/i.test(s) ||
        /\b(?![fgh]\b)[a-z]\s*(?:\^\s*\(?\s*[−-]\s*1\s*\)?|⁻¹)\s+(?:for|of|where|if|when)\b/i.test(s) ||
        /\binverse\s+of\s+(?:the\s+matrix\s+)?(?:\[|[−-]?\d[\d\s.,−-]*;)/.test(low) || /\bdet(?:erminant)?\s*(?:of\s+)?[−-]?\d+\s+[−-]?\d/.test(low) ||
        /<\s*[−-]?\d+(?:\.\d+)?\s*,\s*[−-]?\d+(?:\.\d+)?(?:\s*,\s*[−-]?\d+(?:\.\d+)?)?\s*>/.test(s) || /\b\d*\s*i\s*[+−-]\s*\d*\s*j\b/.test(low) ||
        eqList.length >= 3 && eqList.every(function(x) { return /^[\s\d.a-z+\-−*×=\/()]+$/i.test(x) && !/[a-z]\s*\^/i.test(x); })))
      return go("matrices-and-vectors.html", qp(s), "matrices and vectors");
    // complex numbers: 3 + 2i, i^23, √−48, the conjugate, polar form, De Moivre
    var iOnly = low.replace(/\ba\s*\+\s*bi\b/g, " ").replace(/\b(?:from|plus|minus|times|squared|cubed|over|by|power|expand|evaluate|calculate|compute|solve|simplify|divide|multiply|add|subtract|find|write|in|as|form|the|of|and|polar|rectangular|standard|trig(?:onometric)?|modulus|argument|conjugate|plot|by|cos|sin|cis|to|what|is|degrees?|radians?|pi|e|sqrt|cbrt|square|cube|root)\b/g, " ");
    if (!asksWord && (/\bcomplex\b|\bimaginary\b|\bde\s*moivre\b|\bconjugate\b|\bcis\b|\bpolar\s+form\b|\bmodulus\b|\ba\s*\+\s*bi\b/.test(low) ||
        /\bsquare\s+root\s+of\s+[−-]\s*\d/.test(low) || /\b(?:absolute\s+value|magnitude|modulus)\s+of\b[^a-hj-z]*\d\s*i\b/.test(low) ||
        /\b(?:square|cube|fourth|fifth|sixth|\d+(?:st|nd|rd|th))\s+roots\s+of\s+[−-]?\d/.test(low) || /\be\s*\^\s*\(?\s*\d*\s*i/.test(low) || /\d\s*\/\s*\(?\s*\d*i\s*\)?\s*$/.test(low) && !/[a-hj-z]/.test(iOnly) ||
        /(?:\d|\))\s*i(?![a-z])|[+−-]\s*i(?![a-z])|(?:^|[^a-z])i\s*(?:\^|\*\*)\s*[−-]?\d|(?:√|sqrt\s*\(?)\s*\(?\s*[−-]\s*\d/.test(low) && !/[a-hj-z]/.test(iOnly) ||
        /(?:^|[^a-z])i\s+sin\b/.test(low)))
      return go("complex-numbers.html", qp(s), "complex numbers");
    // functions: f(4) with the rule given, f(g(x)), domain and range of a formula, inverses, piecewise, even or odd
    var hasRule = /\b[fgh]\s*\(\s*x\s*\)\s*=/.test(low),
      anyRule = /\b[fgh]\s*\(\s*([a-z])\s*\)\s*=/.exec(low);
    if (!asksWord && !story && (/\bdomain\b|\bcompositions?\b|\bcompos(?:e|ite)\b(?=.*(?:[fgh]\s*\(|(?:^|[^a-z])x(?![a-z])))|\bpiecewise\b|(?:\beven\s+or\s+odd\b|\bodd\s+or\s+even\b)(?=.*(?:x|[fgh]\s*\())|\bone[-\s]to[-\s]one\b|\bis\s+(?:it|this|that)\s+a\s+function\b|\bvertical\s+line\s+test\b|\bmapping\b/.test(low) ||
        /\b[fgh]\s*\(\s*[fgh]\s*\(/.test(low) || /\(\s*[fgh]\s*[∘o]\s*[fgh]\s*\)/.test(low) || /\(\s*[fgh]\s*[+\-−*·\/]?\s*[fgh]\s*\)\s*\(/.test(low) ||
        anyRule && (/\b(?:at|when|for|and|if|where)\s+[a-z]\s*=\s*[−-]?\d/.test(low) || /\bplug\b|\bsubstitute\b/.test(low) ||
          /\b[fgh]\s*\(\s*[−-]?\d/.test(low.replace(/\b[fgh]\s*\(\s*[a-z]\s*\)\s*=/g, " "))) || /\b[fgh]\s*(?:\^\s*\(?\s*[−-]\s*1\s*\)?|⁻¹)/.test(low) ||
        /\binverse\b/.test(low) && /x/.test(low) ||
        /\brange\b/.test(low) && /x/.test(low) ||
        hasRule && /\b[fgh]\s*\(\s*(?:[−-]?\d|[a-wyz]\b|[a-z]\s*[+−-])/.test(low.replace(/\b[fgh]\s*\(\s*x\s*\)\s*=/g, " "))))
      return go("functions.html", qp(s), "functions");
    // radicals and rational expressions: rationalize, √ with letters, √12 + √27, radical and rational equations, 8^(2/3)
    // (a plain √50 or cube root of 64 stays on the Power Tower, below)
    var nRad = (s.match(/√|∛|sqrt|cbrt|square\s+root|cube\s+root|\broot\b(?=\s+(?:of\s+)?\d)/gi) || []).length;
    // a letter on the bottom of a fraction (2/(x+1), 3/x), but not a unit like km/h, m/s or ft/s
    var ratTerms = (s.replace(/\b(?:mi|km|m|ft|in|cm|mm|gal|l|lb|kg|g|oz|\$)\s*\/\s*(?:h|hr|hour|s|sec|min|day|week|yr|year|gal|l|lb|kg|g|oz|ft|in|m|mi|km|unit|each)\b/gi, " ")
      .match(/\/\s*\(\s*[^()]*[a-z][^()]*\)|\/\s*[a-z]\b|\/\s*\d*[a-z]\s*(?:\^|²)/gi) || []).length;
    if (!asksWord && !story && (/\brationali[sz]e\b|\brational\s+(?:expressions?|equations?|exponents?)\b|\bradicals?\b|\bsurds?\b|\bextraneous\b/.test(low) ||
        nRad >= 2 && /[+−\-×*·]|\)\s*\(/.test(s) ||
        nRad >= 1 && (/√\s*\(?[\d\s.]*[a-z](?![a-z])/.test(low.replace(/square\s+root\s+of|cube\s+root\s+of|sqrt|cbrt|square\s+root|cube\s+root|∛/g, "√")) ||
          /\/\s*(?:√|sqrt)|(?:√|sqrt)[^\/]*\/|\/\s*\([^)]*(?:√|sqrt)/.test(low) || /\bsimplif\w*|\bsimplest\b|\breduce\b/.test(low)) ||
        /^\s*\(?[−-]?\d+\)?\s*(?:\^|\*\*)\s*\(\s*[−-]?\d+\s*\/\s*\d+\s*\)\s*$/.test(s) ||
        ratTerms >= 1 && (/\bsimplify\b/.test(low) || ratTerms >= 2 || /=/.test(s) && !/^\s*y\s*=/.test(low))))
      return go("radicals.html", qp(s), "radicals and rational expressions");
    // sequences and series: "3, 7, 11, 15, …", "nth term of 5, 8, 11", "a1=4 d=3 n=10", "sum of the first 50 terms of …", "Σ"
    if (!asksWord && (/\b(?:sequences?|series|n-?th\s+term|\d+(?:st|nd|rd|th)\s+term|next\s+(?:terms?|numbers?)|common\s+(?:difference|ratio)|sigma|(?:arithmetic|geometric)\s+progressions?|terms?\s+of|first\s+\d+\s+terms|infinite\s+(?:sum|series))\b/.test(low) || /[Σ∑]/.test(s) ||
        /\d\s*,\s*(?:\.\.\.|…)/.test(s) ||
        /\bwhat(?:'s|\s+is|s)?\s+(?:the\s+)?next\b|\bcontinue\s+the\s+(?:pattern|sequence|list)\b|\bnext\s+\d+\s+(?:terms?|numbers?)\b|\bterm\s+\d+\s+of\b|\ba_?\{?\d+\}?\s+of\b|\b(?:explicit|recursive)\s+(?:formula|rule|equation)\b/.test(low) && /\d\s*,\s*[−-]?\d/.test(s) || // is 100 in 3, 7, 11, …
        /\ba_?\{?1\}?\s*=\s*[−-]?\d/.test(low) && /\b[dr]\s*=\s*[−-]?\d/.test(low) || (low.match(/\ba_?\{?\d+\}?\s*=\s*[−-]?\d/g) || []).length >= 2 ||
        /^\s*[−-]?\d[\d.\/]*(?:\s*,\s*[−-]?\d[\d.\/]*){2,}\s*,?\s*(?:\.\.\.|…|_+|\?)\s*$/.test(s) || // 3, 7, 11, ...
        /^\s*\d+\s*\+\s*\d+\s*\+\s*\d+\s*\+\s*(?:\.\.\.|…)/.test(s))) // 1 + 2 + 3 + ... + 100
      return go("sequences.html", qp(s), "a sequence");
    // logarithms, and equations with x in the exponent: "log2 32", "ln e^3", "3^(2x-1) = 27", "half-life", "compounded monthly"
    if (!asksWord && (/(?:^|[^a-z])(?:log|ln)(?![a-z])(?!\s+than\b)|\blogarithm(?:s|ic)?\b|\bhalf-?\s*life\b|\bcompound(?:ed|ing)?\b|\bexponential\s+(?:growth|decay|equations?)\b|\bdoubling\s+time\b|\bph\s+of\b/.test(low) ||
        (s.match(/=/g) || []).length === 1 && !/(?:^|[^a-z])y(?![a-z])/.test(low) && /(?:[\d)]|(?:^|[^a-z])e)\s*(?:\^|\*\*)\s*\(?[−-]?[\d.]*x/.test(low)))
      return go("logarithms.html", qp(s), "logarithms");
    // quadratics and polynomials: "(x+3)(x-5)", "factor x^2+5x+6", "x^2-5x+6=0", "vertex of y=2x^2-8x+3", "(x^3-8)/(x-2)"
    var sq = low.replace(/²/g, "^2").replace(/³/g, "^3").replace(/\*\*/g, "^").replace(/\b[fgh]\s*\(\s*x\s*\)/g, "y"); // f(x) = … is y = …
    var polyVars = sq.replace(/\bx-intercepts?\b/g, " ").replace(/\b(?:expression|out|please|how|do|can|you|step|equation|solutions?|if|are|the|i(?=\s+(?:factor|solve|expand|find|do)))\b/g, " ").replace(/\ba\b(?!\s*\^)/g, " ").replace(/\b(?:factor\w*|solve|expand|simplify|multiply|divide|by|and|the|of|vertex|form|find|completely|fully|using|use|quadratics?|formula|completing|complete|square|synthetic|long|division|roots?|zeros?|polynomials?|trinomials?|binomials?|foil|discriminant|parabola|add|subtract|from|to|axis|symmetry|for|with|method|what|is|are|an)\b/g, " ")
      .match(/[a-z]/g) || [];
    polyVars = polyVars.filter(function(c) { return c !== "y"; }); // y = … is the same one
    var oneVar = polyVars.length > 0 && polyVars.every(function(c) { return c === polyVars[0]; });
    var squared = /[a-z]\s*\^\s*[2-9]|\([^()]*[a-z][^()]*\)\s*\^\s*[2-9]/.test(sq),
      sciNote = /\d\s*[x×*]\s*10\s*\^/.test(sq);
    if (!asksWord && !sciNote && oneVar && (
        /\b(?:quadratics?|polynomials?|trinomials?|binomials?|foil|discriminant|complet(?:e|ing)\s+the\s+square|synthetic\s+division|quadratic\s+formula)\b/.test(low) ||
        /\b(?:vertex|parabola|zeros|roots\s+of|axis\s+of\s+symmetry|x-intercepts?|solutions?\s+of)\b/.test(low) && squared ||
        /(?:^|[^a-z^])\d*[a-z]\s*(?:×|\*|times)?\s*\(\s*[^()]*[a-z][^()]*\)\s*$/.test(sq) ||
        /\bfactor(?:i[sz]e|ing)?\b/.test(low) || // factor 6x^2+7x-3 (letters: not a number to factor)
        /\([^()]*[a-z][^()]*\)\s*\(\s*[^()]*[a-z]/.test(sq) || /\([^()]*[a-z][^()]*[+−-][^()]*\)\s*\^\s*[2-9]/.test(sq) || // (x+3)(x-5), (2x-1)^2
        /\([^()]*[a-z]\s*\^\s*\d[^()]*\)\s*(?:\/|÷|[+−-])\s*\(/.test(sq) || /\bdivide\b[^=]*[a-z]\s*\^\s*\d[^=]*\bby\b/.test(sq) || // (x^3-8)/(x-2), (3x^2+1) - (x^2-4)
        squared && !/[<>≤≥;,]/.test(s) && !/(?:^|[^a-z])y(?![a-z])/.test(sq) && /[a-z\d)]\s*[+−-]\s*[\d(a-z]|=/.test(sq))) // x^2-5x+6=0, x^2 = 49, 3x^2 + 2x
      return go("quadratics.html", qp(s), "a quadratic");
    // fractions to compare: "which is bigger 3/4 or 5/8", "3/4 vs 5/8", "put 3/4, 5/8 and 2/3 in order"
    if (!asksWord && !story && /\d\s*\/\s*\d/.test(s) && !/[a-z]\s*[=<>+]|[=+×*÷^]/.test(low) &&
      /\bwhich\s+(?:is|one\s+is|number\s+is)?\s*(?:greater|bigger|larger|smaller|less|more)\b|\bis\s+[\d\/.\s]+\s+(?:greater|bigger|larger|smaller|less|more)\s+than\b|\d\s+vs\.?\s+[\d.]|\bin\s+order\b|\bfrom\s+(?:least|greatest|smallest|largest)\s+to\b|^\s*(?:order|compare)\b/.test(low))
      return go("fractions.html", qp(s), "fractions to compare");
    // negative numbers: "absolute value of -15", "abs(-12)", "the opposite of 8", "which is greater, -8 or -3", "(-3)(4)", "-15 / (3)"
    if (!asksWord && !story && !/\di\b|[+−-]\s*\d*\s*i\b/.test(low) && (/\babsolute\s+value\s+of\s+[−-]?\d|\babs\s*\(\s*[−-]?\d|^\s*(?:the\s+)?opposite\s+of\s+[−-]?\d+\s*\??\s*$/.test(low) ||
        /\b(?:which\s+is\s+(?:greater|bigger|larger|smaller|less|more)|compare|order)\b/.test(low) && /(?:^|[\s,(])[−-]\d/.test(low) && !/[\/.]\d|[a-z]\s*[=<>]/.test(low) ||
        /^\s*(?:is\s+)?[−-]?\d+\s*(?:[<>≤≥]|(?:greater|bigger|larger|smaller|less|more)\s+than)\s*[−-]?\d+\s*\??\s*$/.test(low) && /[−-]\d/.test(low) ||
        /^\s*\(?[−-]\d+\)?\s*[x×*]\s*\(?[−-]?\d+\)?\s*$|^\s*\(?[−-]?\d+\)?\s*[x×*]\s*\(?[−-]\d+\)?\s*$/.test(low) ||
        /^\s*\(?\s*[−-]?\d+\s*\)?\s*(?:[\/×*÷]|\)\s*\()\s*\(?\s*[−-]?\d+\s*\)?\s*$/.test(s) && /[−-]\d/.test(s) && /[()]/.test(s)))
      return go("integers.html", qp(s), "negative numbers");
    // the early grades: place value, rounding, estimating, comparing, skip counting, telling time and money ("round 3,456 to the
    // nearest hundred", "45 minutes after 1:30", "3 quarters 2 dimes"); a story about them stays a story problem
    if (!asksWord && !story && /\d|\bo'?clock\b/.test(low) && !/%|\bpercent/.test(low) && (
        /\bround(?:ed|ing)?\b(?!\s+trip)|\bestimat(?:e|ing|ion)\b|\breasonable\b|\b(?:about|roughly|approximately)\s+(?:how\s+much|what)\b/.test(low) && !/\bprobab/.test(low) ||
        !/\//.test(s) && (/\bwhich\s+(?:is|number\s+is)\s+(?:greater|bigger|larger|smaller|less|more|the\s+(?:greatest|biggest|largest|smallest|least))\b|^\s*is\s+[\d.,]+\s+(?:greater|bigger|larger|smaller|less|more)\s+than\s+[\d.,]+\s*\??\s*$|\d\s+vs\.?\s+\d|\d\s+_{2,}\s+\d|\bin\s+order\b|\bfrom\s+(?:least|greatest|smallest|largest)\s+to\b/.test(low)) ||
        /^\s*is\s+[−-]?\d+\s+(?:an?\s+)?(?:even|odd)(?:\s+number)?\s*\??\s*$/.test(low) || /\b\d+\s+(?:thousands|hundreds|tens|ones)\b/.test(low) ||
        /\b\d+\s+(?:minutes\s+)?(?:past|after|till)\s+\d{1,2}\b(?!\s*:)/.test(low) && !/\b(?:hours?|days?|years?)\b/.test(low) ||
        /\bthe\s+\d\s+in\s+[\d,.]+\s+(?:worth|stand|mean|represent)|\bin\s+(?:word|written)\s+form\b|\bspell\b|\b(?:as\s+a\s+number|in\s+(?:numbers|digits|numerals))\b|^\s*what\s+number\s+is\b/.test(low) ||
        /\bin\s+standard\s+form\b/.test(low) && !/\d\s*(?:x|×|\*)\s*10|\de[+−-]?\d|[a-z]\s*[=+]/.test(low.replace(/\b(?:in|standard|form|write|what|is|the|number)\b/g, "")) ||
        /\bplace\s+value\b|\bexpanded\s+form\b|\bin\s+words\b|\bvalue\s+of\s+(?:the\s+)?(?:digit\s+)?\d\s+in\b|\bwhich\s+digit\b|\b(?:ones|tens|hundreds|thousands|millions|tenths|hundredths|thousandths)\s+place\b|\b(?:1|10|100|1,?000)\s+(?:more|less)\s+than\b/.test(low) ||
        /\bskip\s*-?\s*count\w*|\bcount(?:ing)?\s+(?:back\s+)?by\b|\beven\s+or\s+odd\b|\bodd\s+or\s+even\b/.test(low) ||
        /\b\d{1,2}:\d{2}(?!\d)/.test(low) && /\b(?:a\.?m\b\.?|p\.?m\b\.?|minutes?|hours?|time|clock|hands)|\d(?:am|pm)\b/.test(low) ||
        /\bo'?clock\b|\bquarter\s+(?:to|past|after)\s+\d|\bhalf\s+past\s+\d|\belapsed\s+time\b|\bfrom\s+\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?\s+(?:to|until)\s+\d{1,2}:\d{2}/.test(low) ||
        /\b(?:quarters?|dimes?|nickels?|pennies|penny|coins?|cents?)\b|¢|\bchange\s+from\s+\$/.test(low) && !/\b(?:heads?|tails?|toss\w*|flip\w*|roll\w*|probability|chances?)\b/.test(low) ||
        /^\s*(?:compare|order)\b/.test(low) && !/\//.test(s) && !/[a-z]\s*[=<>]/.test(low)))
      return go("number-sense.html", qp(s), "number sense");
    // trigonometry: sin, cos and tan of an angle, degrees and radians, the unit circle, the laws of sines and cosines,
    // right triangles with SOH-CAH-TOA, angles of elevation, and identities ("sin 30", "cos 135°", "a=7 b=10 C=40")
    var noXY = !/(?:^|[^a-z])[xy](?![a-z])/.test(low);
    var trigLaw = /\blaws?\s+of\s+(?:sines?|cosines?)\b/.test(low),
      sohcah = /\bsoh\s*-?\s*cah\s*-?\s*toa\b/.test(low);
    var abcSet = (s.match(/\b[ABCabc]\s*=\s*\d/g) || []).length,
      abcLetters = (s.match(/\b[A-Za-z]\s*=/g) || []).length;
    if (trigLaw || sohcah || /\bunit\s+circle\b|\breference\s+angles?\b|\bcoterminal\b|\btrig(?:onometric)?\s+(?:identit|ratio|function)|\bpythagorean\s+identit/.test(low) ||
      /\bangles?\s+of\s+(?:elevation|depression)\b/.test(low) || /\bpoint\s+(?:at|for)\s+[−-]?\d+(?:\.\d+)?\s*°/.test(low) ||
      /\b(?:amplitude|midline|phase\s+shift)\b/.test(low) && /\b(?:sin|cos|sine|cosine)\b/.test(low) ||
      /\b(?:opposite|adjacent)\s+(?:side\s+)?(?:is\s+|of\s+|=\s*)?\d|\bfind\s+(?:the\s+)?(?:opposite|adjacent)\b/.test(low) ||
      /\bradians?\b/.test(low) && /\d|π|\bpi\b/.test(low) ||
      /(?:\d|π|\bpi\b)\s*(?:°|degrees?|deg)?\s+(?:to|in|into)\s+(?:radians?|degrees?)\b/.test(low) && /π|\bpi\b|radians?/.test(low) ||
      abcSet >= 3 && abcSet === abcLetters && /\b[ABC]\s*=\s*\d/.test(s) && /\b[abc]\s*=\s*\d/.test(s) ||
      abcSet >= 3 && /\b(?:triangle|angles?|sides?)\b/.test(low) || /\bincluded\s+angle\b/.test(low) ||
      abcSet === 3 && abcLetters === 3 && /^[\sabc=\d.,;]+$/.test(low.replace(/\b(?:and|find|solve|the|angles?|with)\b/g, "")) && !/[−-]\s*\d/.test(s) ||
      /\b(?:period|amplitude|midline|phase\s+shift)\b/.test(low) && /(?:^|[^a-z])(?:sin|cos|tan|sine|cosine)(?![a-z])/.test(low) ||
      /\barc(?:sin|cos|tan)\b|(?:^|[^a-z])(?:sin|cos|tan)\s*(?:\^\s*\(?\s*[−-]\s*1\s*\)?|⁻¹)|\binverse\s+(?:sin|cos|tan|sine|cosine|tangent)\b/.test(low) ||
      /^\s*(?:sin|cos|tan)\s*\(?\s*[xθ]\s*\)?\s*=\s*[−-]?[\d.\/√]+/.test(low) ||
      /(?:\d|π|\bpi\b)\s*(?:\/\s*\d+\s*)?\brad\b/.test(low) ||
      /\b\d+(?:\.\d+)?\s*(?:°|degrees?)\s*angle\b|\bangle\s+of\s+\d+(?:\.\d+)?\s*(?:°|degrees?)/.test(low) && /\b(?:ladder|kite|ramp|string|shadow|wire|rope|wall|ground|high|tall|height|elevation)\b/.test(low) ||
      /\b(?:opposite|adjacent|hypotenuse)\s*=\s*\?/.test(low) ||
      noXY && /(?:^|[^a-z])(?:sin|cos|tan|csc|sec|cot|sine|cosine|tangent|secant|cosecant|cotangent)(?![a-z])\s*(?:of\s+|\(\s*)?[−-]?\s*(?:\d|π|\bpi\b|θ|theta)/.test(low) ||
      noXY && /\b(?:sin|cos|tan)\s*(?:,|and)\s*(?:cos|tan)\b.*\d/.test(low))
      return go("trigonometry.html", s.replace(/[^a-z]/gi, "") && !/\d/.test(s) ? "mode=" + (trigLaw ? "laws" : sohcah ? "right" : /unit\s+circle|reference|coterminal/.test(low) ? "circle" : /identit/.test(low) ? "identities" : "right") : qp(s), "trigonometry");
    // exponents: roots, scientific notation, one power on its own, and the exponent laws
    if (/\b(?:sqrt|square\s+root|cube\s+root)\b|[√∛]\s*\(?\s*\d|\broot\s+(?:of\s+)?\d/.test(low))
      return go("exponents.html", qp(s), "a root");
    if (/scientific\s+notation|\d(?:\.\d+)?\s*(?:x|×|\*)\s*10\s*(?:\^|\*\*)|^\s*[−-]?\d+(?:\.\d+)?e[+−-]?\d+\s*$/.test(low) ||
      (/standard\s+form/.test(low) && !/[a-z]\s*[=+]|=/.test(low.replace(/standard\s+form|to|in|write|as/g, ""))))
      return go("exponents.html", qp(s), "scientific notation");
    if (/^\s*(?:\(\s*[−-]?[\d.\/]+\s*\)|[−-]?[\d.]+)\s*(?:(?:\^|\*\*)\s*\(?[−-]?\d+\)?|[²³])\s*$/.test(s))
      return go("exponents.html", qp(s), "a power");
    var noNegExp = s.replace(/(\^|\*\*)\s*\(?[−-]/g, "$1");
    if (/[a-z]\s*(?:\^|\*\*|[²³])|\)\s*(?:\^|\*\*|[²³])/i.test(s) && /[a-z]/i.test(s) && !/[+=<>]|[−-]/.test(noNegExp) && !/\b(?:simplify|solve)\b.*[+=]/i.test(s))
      return go("exponents.html", qp(s.replace(/^\s*simplify\s*:?\s*/i, "")), "the exponent laws");
    // graphing: points on a grid, moving shapes, scatter plots, tables, curves, two lines to graph, shaded inequalities
    var PT = /\(\s*[−-]?\d+(?:\.\d+)?\s*,\s*[−-]?\d+(?:\.\d+)?\s*\)/;
    if (/\b(?:scatter|trend\s+line|line\s+of\s+best\s+fit)\b/.test(low) ||
      (PT.test(s) && /\b(?:plot|distance|midpoint|area|perimeter|quadrant|reflect|reflection|rotate|rotation|translate|translation|dilate|dilation|transform|linear|apart|slide|move|shift|flip)\b|\bgraph\s+the\s+points?\b|\bwhere\s+is\b|\bhow\s+far\b/.test(low)) ||
      /\btable\b/.test(low) && /\by\s*=/.test(low) || /\by\s*=[^;]*\b(?:for|when)\s+x\s*=\s*[−-]?\d+\s*(?:,|\.\.|to\b)/.test(low) || /^\s*x\s*:\s*[−-]?\d[^;]*\by\s*:\s*[−-]?\d/.test(low) ||
      /^\s*table\b.*=/.test(low))
      return go("graphing.html", qp(s), "graphing");
    var eqCount = (s.match(/=/g) || []).length,
      ineqCount = (s.match(/[<>≤≥]/g) || []).length;
    if ((/(?:^|[^a-z])y(?![a-z])/i.test(s) && /x/i.test(s) && ineqCount >= 1 && !/[;,]|\band\b/i.test(s)) || // y < 2x + 1: shade it
      ineqCount >= 2 && !/y/i.test(s) || // −2 < x ≤ 3: a number line
      (/^\s*y\s*=/.test(low) && eqCount === 1 && /x\s*(?:\^|\*\*|²|³)|\|[^|]*x[^|]*\||\bsqrt|√|\d\s*(?:\^|\*\*)\s*x|\/\s*\(?\s*x/.test(low)) || // curves
      (/\b(?:graph|sketch|draw)\b/.test(low) && (eqCount >= 2 || /x\s*(?:\^|\*\*|²)/.test(low))) ||
      eqCount >= 2 && /\bintersect\w*|\bgraphically\b/.test(low) ||
      ineqCount === 1 && /\b(?:graph|number\s+line|show)\b/.test(low) && /^[^a-wyz]*$/.test(low.replace(/\b(?:graph|show|on|a|the|number|line|please|it|and)\b/g, "")))
      return go("graphing.html", qp(s.replace(/^\s*graph\s*:?\s*/i, "")), "graphing");
    // probability: "P(rolling a 4)", "probability of red from 3 red 5 blue", "two coins both heads", "roll a die 60 times"
    var chanceThing = /\b(?:coins?|dice|die|cards?|deck|marbles?|spinner)\b/.test(low);
    if (!asksWord && /\b(?:two|2|three|3|a|one)\s+dice\b|\bdice\b.*\b(?:sum|total|product|doubles)\b|\bheads\b.*\bflips?\b|\bflips?\b.*\bheads\b|\bcards?\b.*\b(?:hearts?|spades?|diamonds?|clubs?|face|kings?|queens?|jacks?|aces?)\b|\b(?:hearts?|spades?)\s+or\s+an?\s+face\s+card\b|\btwice\s+in\s+a\s+row\b|\b\d+\s+times\s+in\s+a\s+row\b/.test(low) && !story)
      return go("probability.html", qp(s), "probability");
    if ((!(/^\s*(?:what\s+(?:is|are|does)|define|definition|meaning)\b/i.test(s) && !/\d/.test(s)) || chanceThing) && // "what is likely": the Word List
      /\bprobability\b|\bchances?\b|\bodds\b|\bp\s*\(|\b(?:un)?likely\b|without replacement|\bspinner\b|\b(?:roll|rolls|rolling|toss|tosses|flip|flips|flipping)\b[^.?]*\b(?:die|dice|coins?)\b|\b(?:two|2|three|3)\s+coins\b|\bdeck\b|\b(?:pick|picks|draw|draws|drawn)\b[^.?]*\bmarbles?\b/.test(low))
      return go("probability.html", qp(s), "probability");
    // a story problem, unless it's about shapes (other than a rectangle's area), statistics, a ratio or a line
    var algebraAngles = /\bangles?\b/.test(low) && /\b(?:twice|times|more than|less than)\s+(?:as\s+\w+\s+as\s+)?(?:the\s+)?(?:first|second|smallest)\b/.test(low);
    if (isStory(s, low) && (algebraAngles || !/\b(circles?|triangles?|trapezoids?|parallelograms?|cylinders?|cones?|spheres?|prisms?|pyramids?|hypotenuse|angles?|polygons?|radius|diameter|circumference|volume|surface|mean|median|modes?|average|range|box ?plots?|quartiles?|outliers?|ratios?|proportion|scale|slope|intercepts?|graph)\b/.test(low)))
      return go("wordproblems.html", qp(s), "a story problem",
        /%|percent/.test(low) ? { page: "percents.html", params: qp(s) } : /\barea\b/.test(low) ? { page: "geometry.html", params: qp(s) } : null);
    // "7 times 8", "12 divided by 4": the words for the signs
    if (/^[\d\s.,\/]+(\s*\b(times|plus|minus|divided by)\b\s*[\d\s.,\/]+)+$/.test(low))
      s = low = low.replace(/\s*\btimes\b\s*/g, " × ").replace(/\s*\bplus\b\s*/g, " + ").replace(/\s*\bminus\b\s*/g, " − ").replace(/\s*\bdivided by\b\s*/g, " ÷ ").trim();

    if (/\brise\s+[−-]?\d+\s*(?:,|and)?\s*run\b|\b(?:up|down)\s+\d+\s*(?:,|and)?\s*(?:to\s+the\s+)?(?:right|left)\s+\d|\bm\s*=\s*[−-]?[\d.\/]+\s*,?\s*(?:and\s+)?(?:b\s*=|(?:the\s+|a\s+)?point|through|passing|\()|\b(?:horizontal|vertical)\s+line\s+(?:through|at|passing)\b|\by\s*=\s*mx\s*\+\s*b\b|\bax\s*\+\s*by\s*=\s*c\b|\bplot\s+[^=]*\bx\b[^=]*\by\s*=/.test(low))
      return go("lines.html", qp(s), "a line");
    if (/\bpythagor|πr|\bpi\s*r\b/.test(low) || /\bfind\s+[abc]\b/.test(low) && (low.match(/\b[abc]\s*=\s*\d/g) || []).length >= 2 ||
      /\b(area|perimeter|circumference|volume|surface|circle|rectangle|square|triangle|trapezoid|trapezium|parallelogram|cylinder|cone|sphere|cube|box(?!\s*-?\s*(?:plots?|and))|prism|pyramid|hypotenuse|legs?|angles?|supplement\w*|complement\w*|polygon|pentagon|hexagon|heptagon|octagon|nonagon|decagon|sided|radius|diameter|vertical)\b/.test(low))
      return go("geometry.html", qp(s));
    // "what is a denominator", "define slope", "meaning of median": the Word List
    var defn = /^\s*(?:what\s+(?:is|are|does)\s+(?:an?\s+|the\s+)?|define\s+|definition\s+of\s+|meaning\s+of\s+|what\s+does\s+)(.+?)(?:\s+mean)?\s*\??\s*$/i.exec(s);
    if (defn && !/\d/.test(defn[1])) return go("glossary.html", qp(defn[1]), "what “" + defn[1] + "” means");
    // statistics words
    if (/\b(mean|median|modes?|average|averages|range|box ?plots?|box-and-whisker|box\s+and\s+whiskers?|five[-\s]number\s+summary|q[13]|variance|quartiles?|iqr|mad|deviation|frequency|outliers?)\b|x̄/.test(low))
      return go("stats.html", qp(s), "statistics");
    // lines: slope words, or two points like (1, 2) and (5, 4)
    if (/\b(slope|intercepts?|parallel|perpendicular|graph|point-slope|slope-intercept|standard form)\b/.test(low) ||
      /\(\s*[−-]?\d+([.\/]\d+)?\s*,\s*[−-]?\d+([.\/]\d+)?\s*\)[^()]*\(\s*[−-]?\d+([.\/]\d+)?\s*,\s*[−-]?\d+([.\/]\d+)?\s*\)/.test(s))
      return go("lines.html", qp(s), "a line");
    if (/\b(?:gcf|gcd|hcf|lcm|lcd|greatest\s+common\s+(?:factor|divisor)|least\s+common\s+(?:multiple|denominator)|factor\s+tree|prime\s+factori[sz]ation|prime\s+or\s+composite|composite|divisors?\s+of|divisibility)\b/.test(low) && /\d/.test(s))
      return go("factors.html", qp(s), "factors");
    // ratios: a:b, rates, sharing, scale drawings (percent problems go to the Hundred Grid instead)
    if (!/%|percent/.test(low) && (/\d\s*:\s*\d/.test(s) || /\bfor\s+\$?\d/.test(low) ||
        /\b\d[\d.]*\s+to\s+\d[\d.]*\b/.test(low) && /\b(?:lowest|simplest|simplif\w*|reduce|ratio)\b|=/.test(low) ||
        /^\s*\d+\s+[a-z]+\s+to\s+\d+\s+[a-z]+\s*$/.test(low) || /^\s*[\d.]+\s+to\s+[\d.]+\s*$/.test(low) ||
        /\b1\s*(?:cm|mm|m|in|inch|ft|foot)\b\.?\s*(?:=|:|represents|stands\s+for|is|(?:on\s+the\s+)?(?:map|drawing|blueprint|plan|model)\s+(?:is|=|represents))\s*\d/.test(low) ||
        /\b\d[\d.,]*\s+[a-z]+\s+(?:in|on)\s+\d[\d.,]*\s+(?:hours?|minutes?|seconds?|days?|weeks?|gallons?|liters?|litres?)\b/.test(low) && !/\bto\b/.test(low) ||
        /\b\d+(?:-\s*pack|\s+[a-z]+)\s+costs?\s+\$\s*\d/.test(low) ||
        /\b(ratios?|unit rate|rate|per|better buy|best buy|share|shared|split|scale|proportion|recipe|batch(es)?)\b/.test(low)))
      return go("ratios.html", qp(s), "ratios");
    // a proportion with one letter in it: 3/4 = x/20
    if (/^\s*[\d.a-z]+\s*\/\s*[\d.a-z]+\s*=\s*[\d.a-z]+\s*\/\s*[\d.a-z]+\s*$/i.test(s) && (s.match(/[a-z]/gi) || []).length === 1)
      return go("ratios.html", "mode=prop&" + qp(s), "a proportion");
    // one equation in x and y is a line to graph (two equations are a system, below)
    if ((s.match(/=/g) || []).length === 1 && /x/i.test(s) && /y/i.test(s) && !/[;,]|\band\b/i.test(s) && !/[a-wz]/i.test(s))
      return go("lines.html", qp(s), "a line");
    // a plain list of three or more numbers
    var listParts = s.replace(/^\s*\{|\}\s*$/g, "").split(/\s*[,;]\s*|\s+/).filter(Boolean);
    if (!/[\/a-z%=<>+×*÷^()]/i.test(s) && listParts.length >= 3 && listParts.every(function(x) { return /^[−-]?\d*\.?\d+$/.test(x); })) {
      var ints = listParts.every(function(x) { return /^[−-]?\d+$/.test(x); });
      return go("stats.html", qp(s), "a list of numbers",
        ints && listParts.length <= 8 ? { page: "integers.html", params: "mode=abs&" + qp(listParts.join(",")) } : null);
    }
    if (/^\s*[a-z](?:\s*[+\-−×*]\s*[a-z])+\s*$/i.test(s)) return go("algebra.html", "mode=simplify&" + qp(s), "an expression to simplify");
    if (!/\d/.test(s)) return go("glossary.html", qp(s.replace(/\?+$/, "")), "what “" + s.replace(/\?+$/, "") + "” means");
    if (/\b(gcf|gcd|hcf|lcm|factors?|prime|primes|factori[sz]ation|factori[sz]e|divisib\w*|multiples?|composite)\b/.test(low))
      return go("factors.html", qp(s));
    if (/%|\bpercent|\bdiscount|\boff\b|\btax\b|\btip\b|\bmarkup\b|\binterest\b|\bout of\b/.test(low) ||
      /\b(?:increased|decreased|rose|fell|dropped|grew)\s+(?:from\s+\$?\d[\d.,]*\s+)?to\s+\$?\d|\b(?:went|changed?|goes|going)\s+(?:up\s+|down\s+)?from\s+\$?\d[\d.,]*\s+to\s+\$?\d|^\s*(?:the\s+)?(?:change\s+)?from\s+\$?\d[\d.,]*\s+to\s+\$?\d[\d.,]*\s*\??\s*$/.test(low))
      return go("percents.html", qp(s));

    // letters left once "x" between two numbers is read as times → algebra
    var bare = low.replace(/\b(simplify|solve|for|expand|and)\b/g, " ")
      .replace(/(\d|\))\s*x\s*(?=[\d(.])/g, "$1×");
    if (/[a-z]/.test(bare) || /[=<>≤≥]/.test(s)) {
      if (/\b(simplify|reduce|convert|compare|order|equivalent)\b/.test(low) && !/[a-z]/.test(bare.replace(/\b(reduce|convert|compare|order|equivalent|to|as|a|decimal|percent|fraction|mixed|improper)\b/g, "")) &&
        !/=/.test(s.replace(/\?/g, ""))) {
        // "simplify 18/24", "convert 7/4 to a decimal": fractions, not algebra
      } else {
        if (/\d\s*\/\s*\d+\s*=\s*(?:_+|\?+|□|what)\s*\/\s*\d|\bequal\s+to\s+what\s+over\s+\d|\bequivalent\s+fractions?\b.*\bdenominator\s+of\s+\d/.test(low))
          return go("fractions.html", qp(s), "equivalent fractions");
        var pr = /(?:^|[^\w\/.])([\d.]+|[a-z])\s*\/\s*([\d.]+|[a-z])\s*=\s*([\d.]+|[a-z])\s*\/\s*([\d.]+|[a-z])(?![\w\/])/.exec(low.replace(/(\b[a-z]|\d)\s+over\s+(?=\d|[a-z]\b)/g, "$1/").replace(/\s+(?:equals|is\s+equal\s+to)\s+/g, " = "));
        if (pr && pr.slice(1).filter(function(x) { return /[a-z]/.test(x); }).length === 1 || /\bis\s+to\b.*\bas\b.*\bis\s+to\b/.test(low))
          return go("ratios.html", qp(s), "a proportion");
        // one fraction, mixed number or decimal to simplify or write another way ("36/48 in simplest form", "write 7/4 as a mixed
        // number", "0.6 as a fraction", "decimal form of 9/16"); percents stay with the Hundred Grid
        var oneNum = low.replace(/[−-]?(?:\d+\s+)?\d+\s*\/\s*\d+|[−-]?\d*\.\d+(?:\.\.\.|…)?|[−-]?\d+/g, " # ");
        if ((oneNum.match(/#/g) || []).length === 1 && !/[=%]|\bpercent/.test(low) && /\b(?:simplest|lowest|simplif\w*|reduc\w*|decimals?|fractions?|mixed|improper)\b/.test(oneNum) &&
          !/[a-z]/.test(oneNum.replace(/\b(?:what(?:'s|s)?|is|write|put|change|turn|express|convert|reduce[ds]?|simplif(?:y|ied)|completely|fully|the|fraction|an?|as|to|into|in|its?|simplest|lowest|terms|form|of|decimals?|mixed|numbers?|improper|equivalent|please)\b/g, "")))
          return go("fractions.html", qp(s), "a fraction");
        var eqs = s.replace(/^\s*(solve|simplify)\s*:?\s*/i, "");
        if ((eqs.match(/=/g) || []).length >= 2 && /[;,]|\band\b/i.test(eqs)) {
          var parts = eqs.split(/\s*(?:;|,|\band\b)\s*/i).filter(function(x) { return /=/.test(x); });
          if (parts.length === 2) return go("algebra.html", "mode=sys&" + qp(parts.join(";")), "a system of two equations");
        }
        eqs = eqs.replace(/\s*\(?\s*\b[a-z]\s*=\s*\?+\s*\)?\s*$/i, "").replace(/^\s*[a-z]\s*=\s*\?+\s*(?:if|when|for|given)\s+/i, "");
        if (/[<>≤≥]/.test(eqs)) return go("algebra.html", "mode=ineq&" + qp(eqs), "an inequality");
        if (/=/.test(eqs) && !/\?/.test(eqs)) return go("algebra.html", "mode=solve&" + qp(eqs), "an equation");
        if (!/=/.test(eqs)) return go("algebra.html", "mode=simplify&" + qp(eqs), "an expression to simplify");
      }
    }

    // fractions: one fraction on its own, a list to compare, a missing number, or a conversion
    var fw = /\b(simplify|reduce)\b/.test(low) ? "simplify" : /\b(convert|decimal|percent|improper|mixed)\b/.test(low) ? "convert" :
      /\b(compare|order)\b/.test(low) ? "compare" : /\bequivalent\b/.test(low) ? "equiv" : "";
    var core = s.replace(/^\s*(simplify|reduce|convert|compare|order|equivalent)\s*:?\s*/i, "")
      .replace(/\s+(to|as|into)\s+(an?\s+)?(decimal|percent|fraction|mixed number|improper fraction)s?\s*$/i, "");
    if (/=\s*\?|\?\s*\/|\/\s*\?/.test(core)) return go("fractions.html", "mode=equiv&" + qp(core.replace(/\s+/g, "")), "equivalent fractions");
    if (/,/.test(core) && core.split(",").every(function(x) { return /^\s*(\d+\s+)?\d+\/\d+\s*$|^\s*\d*\.\d+\s*$/.test(x); }))
      return go("fractions.html", "mode=compare&" + qp(core.replace(/\s*,\s*/g, ",")), "fractions to compare");
    if (/^\d*\.\d*\(\d+\)$/.test(core)) return go("fractions.html", "mode=convert&" + qp(core), "a repeating decimal");
    if (fw && /^\s*[−-]?(\d+\s+)?\d+\s*\/\s*\d+\s*$|^\s*\d*\.\d+\s*$/.test(core)) return go("fractions.html", "mode=" + fw + "&" + qp(core.trim().replace(/\s*\/\s*/, "/")));

    var tk = tokens(s);
    if (!tk) return go("pemdas.html", qp(s));
    var nums = tk.filter(function(t) { return t.t === "n"; });
    // a lone fraction: simplify it, or divide if the top is the bigger number
    if (tk.length === 1 && nums.length === 1) {
      if (nums[0].frac) {
        var ab = nums[0].s.split("/");
        if (!/ /.test(nums[0].s) && Number(ab[0]) >= Number(ab[1]))
          return go("division.html", qp(ab[0] + "÷" + ab[1]), "", { page: "fractions.html", params: "mode=simplify&" + qp(nums[0].s) });
        return go("fractions.html", "mode=simplify&" + qp(nums[0].s), "a fraction to simplify");
      }
      return go("factors.html", qp(nums[0].s.replace(/,/g, "")), "a number to factor");
    }
    // which signs are operations, and which make a number negative
    var ops = [],
      negs = 0,
      prev = null,
      other = false;
    tk.forEach(function(t) {
      if (t.t === "o") {
        var isMinus = "-−–".indexOf(t.s) >= 0;
        if (isMinus && (!prev || (prev.t === "o" && prev.s !== ")" && prev.s !== "²" && prev.s !== "³"))) negs++;
        else if ("()^²³|".indexOf(t.s) >= 0) other = true;
        else ops.push(isMinus ? "−" : t.s === "*" || t.s === "x" ? "×" : t.s === ":" ? "÷" : t.s);
      }
      prev = t;
    });
    var anyFrac = nums.some(function(t) { return t.frac; }),
      anyDec = nums.some(function(t) { return t.dec; });
    var ints = !anyFrac && !anyDec;
    if (/\|/.test(s) && ints) return go("integers.html", qp(s), "absolute value");
    if (negs && ints && ops.length >= 1 && (ops.length === 1 || ops.every(function(o) { return o === "+" || o === "−"; })) && !/\^|²|³/.test(s))
      return go("integers.html", qp(s), "negative numbers");
    if (other || negs || ops.length === 0 || ops.length > 1 && !ops.every(function(o) { return o === "+"; }))
      return go("pemdas.html", qp(s), "the order of operations");
    if (ops[0] === "+" && nums.length > (anyFrac ? 2 : 4)) return go("pemdas.html", qp(s), "the order of operations");
    var a = nums.map(function(t) { return t.s.replace(/,/g, ""); });
    if (ops[0] === "+") return go("addition.html", qp(a.join("+")));
    if (ops[0] === "−") return go("subtraction.html", qp(a.join("-")));
    if (ops[0] === "×") return go("multiplication.html", qp(a.join("*")));
    if (ops[0] === "÷") return go("division.html", qp(a.join("÷")));
    return go("pemdas.html", qp(s));
  }

  // the full address to open: site.js knows which folder each page is in (r.page stays the bare file name)
  function href(r) {
    if (!r || r.none) return null;
    return window.HelperSite ? window.HelperSite.url(r.page, r.params) : r.page + (r.params ? (/^#/.test(r.params) ? "" : "?") + r.params : "");
  }
  window.HelperSearch = { route: route, PAGE: PAGE, href: href };
})();
