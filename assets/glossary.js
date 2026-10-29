/* The word list: every math word the helpers use, with a short meaning and an example.
   One list (TERMS, below) feeds two things:
     1. glossary.html, the "Definitions" page, which draws every entry from it;
     2. the popups on every helper page. The first time a word from the list shows up in the explanations
        (the "Say it out loud" steps, the notes, captions, the answer's facts, the maker's labels), it becomes
        a quiet dotted link. Hover it, focus it with the keyboard, or tap it, and a small card says what it means.
   Safe to load on any page, any number of times: it never throws, and a page without it works the same.

   An entry:  id      the slug, also the entry's #anchor on glossary.html
              term    the name as it is shown
              aliases other spellings that should match in the text (plurals, abbreviations, other names).
                      Words in capitals (GCF, IQR, MAD…) only match when they are written in capitals.
              topic   Arithmetic | Fractions & decimals | Percents & ratios | Factors & primes | Integers |
                      Algebra | Lines & graphs | Geometry | Statistics
              short   the meaning, in 25 words or fewer, for an 11 to 13 year old
              example a tiny concrete example
              pages   the helper pages that use the word
              see     related entries (ids), optional
              forms   optional: related phrases that should link here too but are not other names for it
                      (they are matched like aliases, but glossary.html does not list them as "also called")
              strict  true for everyday words with a math meaning (run, rise, mode, tip, scale…): they are only
                      linked on the pages in `pages`, where they are sure to mean the math thing.
              manual  true for words that mean too many things to link on their own (point, line, plane, vertex…):
                      they are never linked automatically; a page links them itself where it means them, with
                      <a class="gl-term" data-gl="ray" href="…">ray</a> (the Shape Shop's Figures tab does)
   In another language the popup shows glossary.w.<id>.term / .short / .example when the locale file has them
   (en.js repeats the English for translators); without them it shows the English.

   window.HelperGlossary = { terms, byId(id), find(word), link(root[, {all:true}]), scan(text) }
     link(root)  links the first use of each word inside the explanations under root (default: the whole page),
                 counting words already linked anywhere on the page as used. {all:true} links any text under root.
                 Returns how many links it made.
     scan(text)  the ids of every word found in a piece of text, in order (for testing). */
(function() {
  "use strict";
  if (window.HelperGlossary) return; // loaded twice (the page and nav.js): the first copy does the work

  /* ---- the words, in the visitor's language (assets/i18n.js): the glossary.* keys, and en.js repeats the English for
     translators. English always shows the words written here; so does a page without i18n.js. ---- */
  function tr(key, en, vars) {
    var I = window.HelperI18n;
    if (I && I.lang && I.lang !== "en" && I.t) {
      var s = I.t(key, vars);
      if (s !== key) return s;
    }
    return vars ? String(en).replace(/\{(\w+)(\|[^{}]*)?\}/g, function(m, k, forms) { // {name}, and {n|one|other}
      if (!Object.prototype.hasOwnProperty.call(vars, k)) return m;
      if (!forms) return String(vars[k]);
      var f = forms.slice(1).split("|");
      return Number(vars[k]) === 1 ? f[0] : f[f.length - 1];
    }) : en;
  }
  try { main(); } catch (e) {} // a bug in here must never break a helper page

  function main() {
    var A = "Arithmetic",
      F = "Fractions & decimals",
      P = "Percents & ratios",
      K = "Factors & primes",
      I = "Integers",
      L = "Algebra",
      G = "Lines & graphs",
      M = "Geometry",
      S = "Statistics";
    var FILE = {
      add: "addition.html",
      sub: "subtraction.html",
      mul: "multiplication.html",
      div: "division.html",
      fra: "fractions.html",
      pct: "percents.html",
      fac: "factors.html",
      "int": "integers.html",
      rat: "ratios.html",
      ord: "pemdas.html",
      alg: "algebra.html",
      lin: "lines.html",
      geo: "geometry.html",
      sta: "stats.html"
    };

    var TERMS = [];

    function E(id, term, aliases, topic, short, example, pages, see, opts) {
      var t = {
        id: id,
        term: term,
        aliases: aliases || [],
        topic: topic,
        short: short,
        example: example,
        pages: (pages || "").split(" ").filter(Boolean).map(function(p) { return FILE[p] || p; })
      };
      if (see && see.length) t.see = see;
      if (opts === true || (opts && opts.strict)) t.strict = true;
      if (opts && opts.forms) t.forms = opts.forms;
      if (opts && opts.manual) t.manual = true;
      TERMS.push(t);
    }

    /* ============================== Arithmetic ============================== */
    E("sum", "Sum", ["sums"], A,
      "The answer you get when you add numbers together.",
      "In 8 + 5 = 13, the sum is 13.",
      "add geo sta", ["addend", "difference"]);
    E("addend", "Addend", ["addends"], A,
      "Each of the numbers being added together.",
      "In 8 + 5 = 13, the addends are 8 and 5.",
      "add", ["sum"]);
    E("difference", "Difference", ["differences"], A,
      "The answer you get when you subtract one number from another. It tells you how far apart the two numbers are.",
      "In 12 − 5 = 7, the difference is 7.",
      "sub mul rat sta", ["sum"]);
    E("product", "Product", ["products"], A,
      "The answer you get when you multiply numbers together.",
      "In 4 × 6 = 24, the product is 24.",
      "mul fac rat", ["factor", "partial-product"]);
    E("quotient", "Quotient", ["quotients"], A,
      "The answer you get when you divide one number by another.",
      "In 20 ÷ 4 = 5, the quotient is 5.",
      "div", ["dividend", "divisor", "remainder"]);
    E("dividend", "Dividend", ["dividends"], A,
      "The number being divided up: the amount you start with in a division.",
      "In 20 ÷ 4 = 5, the dividend is 20.",
      "div", ["divisor", "quotient"]);
    E("divisor", "Divisor", ["divisors"], A,
      "The number you divide by.",
      "In 20 ÷ 4 = 5, the divisor is 4.",
      "div fac", ["dividend", "quotient", "factor"]);
    E("remainder", "Remainder", ["remainders"], A,
      "What is left over when a number can’t be split into equal groups exactly.",
      "17 ÷ 5 = 3 R 2: three 5s make 15, and 2 is left over.",
      "add sub mul div fac", ["quotient", "divisible"]);
    E("long-division", "Long division", [], A,
      "A way to divide on paper one digit at a time: divide, multiply, subtract, bring down the next digit, and repeat.",
      "619 ÷ 5: 5 into 6 is 1, 5 into 11 is 2, 5 into 19 is 3 with 4 left, so 123 R 4.",
      "div", ["quotient", "remainder"]);
    E("place-value", "Place value", ["place values", "place-value"], A,
      "What a digit is worth because of where it sits in a number: ones, tens, hundreds, or tenths, hundredths and so on.",
      "In 352, the 5 is in the tens place, so it is worth 50.",
      "add sub mul", ["digit", "decimal-place"]);
    E("digit", "Digit", ["digits"], A,
      "One of the ten symbols 0, 1, 2, 3, 4, 5, 6, 7, 8 and 9 that we use to write every number.",
      "407 has three digits: 4, 0 and 7.",
      "add sub mul div fra fac", ["place-value"]);
    E("whole-number", "Whole number", ["whole numbers"], A,
      "One of the counting numbers or zero: 0, 1, 2, 3 and so on. No fractions, decimals or negatives.",
      "7 and 120 are whole numbers; 2.5 and ½ are not.",
      "sub mul div fra pct fac rat ord alg lin geo", ["integer"]);
    E("carry", "Carry", ["carries", "carried", "carrying"], A,
      "When a column adds up to 10 or more, write the ones digit and move the extra ten into the next column to the left.",
      "8 + 5 = 13 in the ones column: write 3 and carry 1 to the tens.",
      "add mul", ["borrow", "place-value"]);
    E("borrow", "Borrow (regroup)", ["borrows", "borrowed", "borrowing", "regroup", "regroups", "regrouped", "regrouping"], A,
      "When a top digit is too small to subtract from, take 1 from the column to its left and trade it for ten here.",
      "52 − 17: you can’t take 7 from 2, so 5 tens become 4 tens and 2 ones become 12 ones.",
      "sub", ["carry", "place-value"]);
    E("partial-product", "Partial product", ["partial products"], A,
      "The answer from multiplying by just one digit of a number. Add the partial products to get the whole answer.",
      "24 × 13: 24 × 3 = 72 and 24 × 10 = 240, then 72 + 240 = 312.",
      "mul", ["product", "area-model"]);
    E("estimate", "Estimate", ["estimates", "estimated", "estimating", "estimation"], A,
      "A quick, rough answer you can work out in your head, often by rounding first. Handy for checking an answer.",
      "48 + 31 is about 50 + 30 = 80, so 79 is believable.",
      "add geo", ["rounding"]);
    E("rounding", "Rounding", ["rounded"], A,
      "Swapping a number for a nearby simpler one, like the nearest ten or tenth. If the next digit is 5 or more, round up.",
      "47 rounded to the nearest ten is 50; 3.24 rounded to one decimal place is 3.2.",
      "add mul div fra pct geo sta", ["estimate", "decimal-place"], { forms: ["round to", "round it", "round up", "round down", "round off"] });
    E("order-of-operations", "Order of operations", [], A,
      "The agreed order for working out a calculation: parentheses, then exponents, then × and ÷ left to right, then + and − left to right.",
      "3 + 4 × 2 = 3 + 8 = 11, not 7 × 2 = 14.",
      "ord geo", ["pemdas", "parentheses", "exponent"]);
    E("pemdas", "PEMDAS", ["BODMAS", "BEDMAS", "BIDMAS", "GEMDAS"], A,
      "A memory word for the order of operations: Parentheses, Exponents, Multiplication and Division, Addition and Subtraction. BODMAS and BEDMAS mean the same.",
      "× and ÷ are partners, done left to right: 12 ÷ 4 × 2 = 3 × 2 = 6.",
      "ord", ["order-of-operations"]);
    E("parentheses", "Parentheses", ["parenthesis", "brackets", "bracket"], A,
      "The curved marks ( ) that group part of a problem. Work out what is inside them first.",
      "(3 + 4) × 2 = 7 × 2 = 14.",
      "div fra int ord alg lin geo", ["order-of-operations"]);
    E("exponent", "Exponent", ["exponents"], A,
      "The small raised number that says how many times to multiply the base by itself.",
      "In 2⁴ the exponent is 4: 2 × 2 × 2 × 2 = 16.",
      "fac ord", ["power", "base", "square"]);
    E("power", "Power", ["powers"], A,
      "A number written with an exponent, or the answer you get from it. Read 2⁴ as “2 to the power of 4”.",
      "2⁴ = 16, so 16 is a power of 2.",
      "ord geo", ["exponent", "base"]);
    E("square-root", "Square root", ["square roots"], A,
      "The number that gives your number when it is multiplied by itself. Written with the √ sign.",
      "√49 = 7, because 7 × 7 = 49.",
      "geo sta", ["square"]);
    E("tape-diagram", "Tape diagram", ["tape diagrams", "bar model", "bar models", "strip diagram"], A,
      "A drawing of strips, like pieces of tape, whose lengths show the amounts in a problem and how they fit together.",
      "For 25.4 + 3.75, a strip 25.4 long and a strip 3.75 long, end to end, make 29.15.",
      "add sub mul div rat", ["area-model"]);
    E("area-model", "Area model", ["area models"], A,
      "A rectangle split into boxes by place value. Each box is one easy multiplication; the boxes add up to the answer.",
      "23 × 4: boxes of 20 × 4 = 80 and 3 × 4 = 12, so 80 + 12 = 92.",
      "add sub mul div", ["partial-product", "distributive-property"]);

    /* ============================== Fractions & decimals ============================== */
    E("fraction", "Fraction", ["fractions"], F,
      "A number for part of a whole. The bottom number says how many equal parts, the top says how many of them you have.",
      "¾ means 3 of 4 equal parts.",
      "add sub mul div fra pct rat ord alg lin geo", ["numerator", "denominator"]);
    E("numerator", "Numerator", ["numerators"], F,
      "The top number of a fraction. It counts how many of the equal parts you have.",
      "In 3/4 the numerator is 3.",
      "add sub mul div", ["denominator", "fraction"]);
    E("denominator", "Denominator", ["denominators"], F,
      "The bottom number of a fraction. It says how many equal parts the whole is cut into.",
      "In 3/4 the denominator is 4.",
      "add sub mul div fra alg", ["numerator", "common-denominator"]);
    E("proper-fraction", "Proper fraction", ["proper fractions"], F,
      "A fraction whose top number is smaller than its bottom number, so it is less than 1.",
      "3/5 and 7/8 are proper fractions.",
      "mul div fra", ["improper-fraction"]);
    E("improper-fraction", "Improper fraction", ["improper fractions", "improper"], F,
      "A fraction whose top number is the same as or bigger than its bottom number, so it is worth 1 or more.",
      "7/4 is improper. As a mixed number it is 1 ¾.",
      "add sub mul div fra", ["mixed-number", "proper-fraction"]);
    E("mixed-number", "Mixed number", ["mixed numbers", "mixed fraction", "mixed fractions"], F,
      "A whole number and a proper fraction written side by side.",
      "2 ½ means 2 + ½. As an improper fraction it is 5/2.",
      "add sub mul div fra", ["improper-fraction"]);
    E("equivalent-fractions", "Equivalent fractions", ["equivalent fraction"], F,
      "Fractions that look different but are the same amount. Multiply or divide the top and bottom by the same number to make one.",
      "½ = 2/4 = 3/6 = 50/100.",
      "fra", ["simplest-form", "equivalent-ratios"]);
    E("simplest-form", "Simplest form", ["lowest terms", "simplest terms"], F,
      "A fraction is in simplest form when its top and bottom share no factor except 1.",
      "18/24 in simplest form is 3/4: divide the top and bottom by 6.",
      "add sub mul div fra rat", ["gcf", "equivalent-fractions"]);
    E("reciprocal", "Reciprocal", ["reciprocals"], F,
      "A fraction turned upside down. A number times its reciprocal is 1. (Zero has no reciprocal.)",
      "The reciprocal of 2/3 is 3/2, and 2/3 × 3/2 = 1.",
      "rat alg lin", ["fraction"]);
    E("cross-cancel", "Cross-cancel", ["cross-cancels", "cross-cancelled", "cross-canceled", "cross-cancelling",
        "cross-canceling", "cross-cancellation", "cross cancel"
      ], F,
      "Before multiplying fractions, divide a top number and the other fraction’s bottom number by the same factor. Smaller numbers, same answer.",
      "2/9 × 3/4: 2 and 4 share 2, 3 and 9 share 3, so it becomes 1/3 × 1/2 = 1/6.",
      "mul div", ["simplest-form", "gcf"]);
    E("common-denominator", "Common denominator (LCD)", ["common denominator", "common denominators", "like denominators",
        "same denominator", "least common denominator", "least common denominators", "lowest common denominator", "LCD"
      ], F,
      "A bottom number two or more fractions share. The least common denominator (LCD) is the smallest one: the LCM of the bottom numbers.",
      "½ + ⅓: the LCD is 6, so 3/6 + 2/6 = 5/6.",
      "add sub mul fra", ["denominator", "lcm"]);
    E("decimal", "Decimal", ["decimals"], F,
      "A number written with a decimal point, so it can show parts smaller than one: tenths, hundredths and so on.",
      "0.75 is 7 tenths and 5 hundredths, the same as ¾.",
      "add sub mul div fra pct rat ord lin geo sta", ["decimal-point", "decimal-place"]);
    E("decimal-point", "Decimal point", ["decimal points"], F,
      "The dot in a decimal. The whole-number part is to its left; the parts smaller than one are to its right.",
      "In 25.4 the decimal point sits between the 5 and the 4.",
      "add sub mul div fra pct", ["decimal", "place-value"]);
    E("decimal-place", "Decimal place", ["decimal places"], F,
      "Each digit after the decimal point fills one decimal place: tenths, then hundredths, then thousandths, and so on.",
      "3.142 has three decimal places.",
      "add sub mul div fra", ["decimal-point", "rounding"]);
    E("repeating-decimal", "Repeating decimal", ["repeating decimals", "recurring decimal", "recurring decimals"], F,
      "A decimal whose digits go on forever in a pattern. A bar over the repeating digits shows the pattern.",
      "1/3 = 0.333… and 1/11 = 0.0909…",
      "div fra", ["terminating-decimal"]);
    E("terminating-decimal", "Terminating decimal", ["terminating decimals"], F,
      "A decimal that comes to an end: it has a set number of digits after the point.",
      "3/8 = 0.375 terminates; 1/3 = 0.333… never does.",
      "fra", ["repeating-decimal"]);

    /* ============================== Percents & ratios ============================== */
    E("percent", "Percent", ["percents", "per cent", "percentage", "percentages"], P,
      "Percent means “out of 100”. A percent is a fraction with 100 on the bottom, written with the % sign.",
      "15% = 15/100 = 0.15.",
      "fra pct rat", ["percent-change", "decimal"]);
    E("percent-change", "Percent change", ["percent changes", "percentage change"], P,
      "How much an amount went up or down, as a percent of where it started: the change ÷ the starting amount × 100.",
      "80 to 92 is a change of 12, and 12 ÷ 80 = 0.15, so a 15% increase.",
      "pct", ["increase-decrease", "percent"]);
    E("increase-decrease", "Percent increase and decrease", ["percent increase", "percent decrease",
        "percentage increase", "percentage decrease", "increase", "increases", "increased", "decrease", "decreases",
        "decreased"
      ], P,
      "How much an amount went up (an increase) or down (a decrease), as a percent of the amount it started at.",
      "$40 to $50 is a 25% increase (10 ÷ 40); $50 to $40 is a 20% decrease (10 ÷ 50).",
      "pct", ["percent-change", "discount", "markup"], true);
    E("discount", "Discount", ["discounts"], P,
      "An amount taken off a price. A 20% discount means you pay 80% of the price.",
      "20% off $45: 0.20 × 45 = $9 off, so you pay $36.",
      "pct", ["markup", "increase-decrease"]);
    E("markup", "Markup", ["markups", "mark-up"], P,
      "An amount a store adds to what something cost it, to set the price it sells for.",
      "A 30% markup on $12: 0.30 × 12 = $3.60, so it sells for $15.60.",
      "pct", ["discount", "increase-decrease"]);
    E("sales-tax", "Sales tax", ["tax", "taxes"], P,
      "Extra money added to a price when you buy something, worked out as a percent of the price.",
      "8% tax on $45: 0.08 × 45 = $3.60, so you pay $48.60.",
      "pct", ["percent", "tip"], true);
    E("tip", "Tip", ["tips", "gratuity"], P,
      "Extra money you choose to give for good service, usually a percent of the bill.",
      "An 18% tip on $60: 0.18 × 60 = $10.80.",
      "pct", ["percent", "sales-tax"], true);
    E("simple-interest", "Simple interest", ["interest"], P,
      "Money paid for borrowing or saving money: principal × yearly rate × years, or I = P × r × t.",
      "$500 at 4% a year for 3 years: 500 × 0.04 × 3 = $60.",
      "pct", ["principal", "rate"], true);
    E("principal", "Principal", [], P,
      "The amount of money first saved or borrowed, before any interest is added.",
      "Put $500 in a savings account and the principal is $500.",
      "pct", ["simple-interest"], true);
    E("rate", "Rate", ["rates"], P,
      "A ratio comparing two different kinds of amounts, like miles and hours. An interest rate is a percent for each year.",
      "60 miles in 2 hours is a rate of 30 miles per hour.",
      "pct rat", ["unit-rate", "ratio"]);
    E("ratio", "Ratio", ["ratios"], P,
      "A comparison of two or more amounts, written like 2:3 or “2 to 3”: for every 2 of these there are 3 of those.",
      "3 cups of flour to 2 cups of milk is a ratio of 3:2.",
      "rat", ["equivalent-ratios", "rate", "proportion"]);
    E("equivalent-ratios", "Equivalent ratios", ["equivalent ratio"], P,
      "Ratios that make the same comparison. Multiply or divide every part by the same number to get one.",
      "2:3 = 4:6 = 12:18.",
      "rat", ["ratio", "ratio-table", "equivalent-fractions"]);
    E("ratio-table", "Ratio table", ["ratio tables"], P,
      "A table where every column shows the same ratio, made by multiplying or dividing all the numbers by the same amount.",
      "2:3, 4:6, 6:9, 8:12 all go in one ratio table.",
      "rat", ["equivalent-ratios"]);
    E("double-number-line", "Double number line", ["double number lines"], P,
      "Two number lines lined up side by side, so amounts in the same ratio sit across from each other.",
      "Top line 0, 3, 6, 9 cups of flour; bottom line 0, 2, 4, 6 eggs: always 3 cups for every 2 eggs.",
      "pct rat", ["ratio-table", "number-line"]);
    E("unit-rate", "Unit rate", ["unit rates"], P,
      "A rate for exactly one of something: how much per 1. The unit price is the cost of one item or unit.",
      "$6 for 3 pounds is $2 per pound.",
      "rat", ["rate"], { forms: ["unit price", "unit prices"] });
    E("proportion", "Proportion", ["proportions", "proportional"], P,
      "An equation that says two ratios are equal.",
      "3/4 = 15/20 is a proportion: both are the same ratio.",
      "rat", ["cross-multiply", "ratio"]);
    E("cross-multiply", "Cross-multiply", ["cross-multiplies", "cross-multiplied", "cross-multiplying",
        "cross-multiplication", "cross multiply", "cross multiplication", "cross products"
      ], P,
      "In a proportion, multiply each top number by the other fraction’s bottom number. The two answers are equal.",
      "3/4 = x/20, so 4 × x = 3 × 20 = 60, and x = 15.",
      "fra rat", ["proportion"]);
    E("scale", "Scale", ["scales"], P,
      "A ratio comparing sizes on a map, model or drawing with the real sizes.",
      "On a map with a scale of 1 cm : 5 km, 3 cm stands for 15 km.",
      "rat", ["scale-factor", "ratio"], true);
    E("scale-factor", "Scale factor", ["scale factors"], P,
      "The number you multiply every length by to make a bigger or smaller copy of a shape.",
      "A scale factor of 3 turns a 2 cm side into a 6 cm side.",
      "rat", ["scale"]);

    /* ============================== Factors & primes ============================== */
    E("factor", "Factor", ["factors"], K,
      "Two meanings: one of the numbers you multiply together, or a number that divides another exactly, with no remainder.",
      "4 × 6 = 24, so 4 and 6 are factors of 24. The factors of 12 are 1, 2, 3, 4, 6 and 12.",
      "mul div fra fac rat lin", ["product", "multiple", "gcf"]);
    E("multiple", "Multiple", ["multiples"], K,
      "What you get when you multiply a number by 1, 2, 3 and so on: the numbers in its times table.",
      "The multiples of 4 are 4, 8, 12, 16, 20 …",
      "add sub fra fac lin", ["lcm", "factor"]);
    E("prime", "Prime number", ["prime numbers", "prime", "primes"], K,
      "A whole number bigger than 1 whose only factors are 1 and itself.",
      "7 is prime: only 1 × 7 makes it. 9 is not, because 3 × 3 = 9.",
      "fra fac", ["composite", "prime-factorization"]);
    E("composite", "Composite number", ["composite numbers", "composite", "composites"], K,
      "A whole number bigger than 1 that has more factors than just 1 and itself. (1 is neither prime nor composite.)",
      "12 is composite: 1, 2, 3, 4, 6 and 12 all divide it.",
      "fac", ["prime"]);
    E("prime-factorization", "Prime factorization", ["prime factorizations", "prime factorisation", "prime factors",
        "prime factor"
      ], K,
      "A number written as a product of prime numbers only. Every whole number above 1 has exactly one.",
      "360 = 2 × 2 × 2 × 3 × 3 × 5 = 2³ × 3² × 5.",
      "fra fac", ["factor-tree", "prime"]);
    E("factor-tree", "Factor tree", ["factor trees"], K,
      "A drawing that splits a number into two factors, then splits those, until every branch ends in a prime.",
      "12 splits into 3 × 4, and 4 into 2 × 2, so 12 = 2 × 2 × 3.",
      "fac", ["prime-factorization"]);
    E("gcf", "Greatest common factor (GCF)", ["greatest common factor", "greatest common factors", "GCF",
        "greatest common divisor", "GCD", "highest common factor", "HCF"
      ], K,
      "The biggest number that divides two or more numbers exactly. Also called the GCD or HCF.",
      "18: 1, 2, 3, 6, 9, 18. 24: 1, 2, 3, 4, 6, 8, 12, 24. The GCF is 6.",
      "fra fac rat", ["lcm", "simplest-form"]);
    E("lcm", "Least common multiple (LCM)", ["least common multiple", "least common multiples",
        "lowest common multiple", "LCM"
      ], K,
      "The smallest number that is a multiple of two or more numbers.",
      "Multiples of 4: 4, 8, 12 … of 6: 6, 12 … The LCM is 12.",
      "add sub fac", ["gcf", "common-denominator"]);
    E("divisible", "Divisible", ["divisible by"], K,
      "One number is divisible by another when it divides exactly, with no remainder. Divisibility rules are shortcuts for checking.",
      "15 is divisible by 5. 351 is divisible by 3, because its digits add up to 9, a multiple of 3.",
      "div fac", ["factor", "remainder"], { forms: ["divides evenly", "divide evenly", "divisibility", "divisibility rule", "divisibility rules", "divisibility test", "divisibility tests"] });

    /* ============================== Integers ============================== */
    E("integer", "Integer", ["integers"], I,
      "A whole number or its opposite: … −3, −2, −1, 0, 1, 2, 3 … No fractions or decimals.",
      "−8, 0 and 15 are integers; 2.5 is not.",
      "int", ["whole-number", "negative-number"]);
    E("positive-number", "Positive number", ["positive numbers", "positive", "positives"], I,
      "A number greater than zero. On a number line it is to the right of 0.",
      "5, 0.3 and 12 are positive. Zero is neither positive nor negative.",
      "int alg lin sta", ["negative-number"]);
    E("negative-number", "Negative number", ["negative numbers", "negative", "negatives"], I,
      "A number less than zero, written with a minus sign. On a number line it is to the left of 0.",
      "−4 means 4 below zero, like a temperature of −4°.",
      "sub int alg lin sta", ["positive-number", "opposite"]);
    E("opposite", "Opposite", ["opposites", "additive inverse"], I,
      "The number the same distance from 0 on the other side. A number plus its opposite is 0.",
      "The opposite of 7 is −7, and 7 + (−7) = 0.",
      "int ord alg", ["absolute-value", "zero-pair"], true);
    E("absolute-value", "Absolute value", ["absolute values"], I,
      "How far a number is from 0, whichever side it is on. It is never negative. Written with bars: |−6|.",
      "|−6| = 6 and |6| = 6.",
      "int", ["opposite", "number-line"]);
    E("zero-pair", "Zero pair", ["zero pairs"], I,
      "A positive and a negative counter together. They add up to 0, so they cancel out.",
      "+1 and −1 make a zero pair: 1 + (−1) = 0.",
      "int", ["opposite"]);
    E("number-line", "Number line", ["number lines"], I,
      "A straight line with numbers marked at equal steps. Numbers get bigger to the right and smaller to the left.",
      "−3 is to the left of 2 on a number line, so −3 < 2.",
      "fra int rat alg sta", ["integer", "absolute-value"]);

    /* ============================== Algebra ============================== */
    E("expression", "Expression", ["expressions"], L,
      "Numbers, letters and operation signs put together, with no equals sign. You can simplify it or work it out.",
      "3x + 2 and 20 − 12 ÷ 4 are expressions.",
      "ord alg", ["equation", "term"]);
    E("equation", "Equation", ["equations"], L,
      "A math sentence with an equals sign, saying two things are worth the same.",
      "2x + 3 = 11 is an equation.",
      "pct alg lin", ["expression", "solution"]);
    E("inequality", "Inequality", ["inequalities"], L,
      "A math sentence that compares with <, >, ≤ or ≥ instead of =. Usually a whole range of numbers makes it true.",
      "x + 2 > 5 is true for every x bigger than 3.",
      "alg", ["equation"]);
    E("variable", "Variable", ["variables"], L,
      "A letter, like x or y, that stands for a number you don’t know yet or that can change.",
      "In 2x + 3 = 11, x is the variable (here x = 4).",
      "alg lin", ["coefficient", "constant"]);
    E("coefficient", "Coefficient", ["coefficients"], L,
      "The number multiplying a variable in a term.",
      "In 5x − 4, the coefficient of x is 5.",
      "alg", ["variable", "term"]);
    E("constant", "Constant", ["constants", "constant term"], L,
      "A number on its own, with no variable, so its value never changes.",
      "In 3x + 7, the constant is 7.",
      "alg lin", ["term", "variable"]);
    E("term", "Term", ["terms"], L,
      "One part of an expression, split off from the others by + or − signs.",
      "3x + 2y − 5 has three terms: 3x, 2y and −5.",
      "alg lin", ["like-terms", "expression"]);
    E("like-terms", "Like terms", ["like term"], L,
      "Terms with exactly the same variable part. Only like terms can be added or subtracted into one term.",
      "3x and 5x are like terms: 3x + 5x = 8x. 3x and 3y are not.",
      "alg", ["term", "coefficient"]);
    E("distributive-property", "Distributive property", ["distribute", "distributes", "distributed", "distributing",
        "distributive"
      ], L,
      "Multiplying a sum by a number is the same as multiplying each part and adding: a(b + c) = ab + ac.",
      "3(x + 2) = 3x + 6.",
      "alg", ["parentheses", "area-model"]);
    E("inverse-operation", "Inverse operation", ["inverse operations", "opposite operation", "opposite operations"], L,
      "An operation that undoes another. Adding and subtracting undo each other; so do multiplying and dividing.",
      "x + 5 = 12: undo the + 5 by subtracting 5 from both sides, so x = 7.",
      "alg lin", ["equation", "order-of-operations"]);
    E("solution", "Solution", ["solutions"], L,
      "A value of the variable that makes an equation or inequality true.",
      "x = 4 is the solution of 2x + 3 = 11, because 2(4) + 3 = 11.",
      "alg", ["equation", "identity", "no-solution"]);
    E("identity", "Identity", ["identities"], L,
      "An equation that is true for every value of the variable: both sides are always equal.",
      "3x + 6 = 3(x + 2) is an identity, so every x works.",
      "alg", ["no-solution", "solution"], { strict: true, forms: ["infinitely many solutions"] });
    E("no-solution", "No solution", [], L,
      "An equation that is never true, whatever number you try. The variables cancel and leave something false.",
      "2(x + 1) = 2x + 5 becomes 2 = 5, which is false, so there is no solution.",
      "alg", ["identity", "solution"]);
    E("system-of-equations", "System of equations", ["systems of equations"], L,
      "Two or more equations that share the same variables. Its solution makes every equation true at the same time.",
      "x + y = 7 and x − y = 1 are both true when x = 4 and y = 3.",
      "alg", ["elimination", "substitution"], { strict: true, forms: ["system of two equations", "systems of two equations", "system", "systems"] });
    E("elimination", "Elimination", ["eliminate", "eliminates", "eliminating"], L,
      "Solving a system by adding or subtracting the equations so that one variable cancels out.",
      "Add x + y = 7 and x − y = 1 to get 2x = 8, so x = 4.",
      "alg", ["system-of-equations", "substitution"], { strict: true, forms: ["elimination method"] });
    E("substitution", "Substitution", ["substitute", "substitutes", "substituted", "substituting"], L,
      "Putting a number or expression in place of a variable. In a system, solve one equation for a variable and put it into the other.",
      "y = 2x and x + y = 9: x + 2x = 9, so x = 3 and y = 6.",
      "alg", ["system-of-equations", "elimination"], { forms: ["substitution method"] });

    /* ============================== Lines & graphs ============================== */
    E("slope", "Slope", ["slopes", "gradient"], G,
      "How steep a line is: rise ÷ run, the change in y divided by the change in x. Often called m.",
      "From (1, 2) to (3, 8): rise 6, run 2, slope 6 ÷ 2 = 3.",
      "alg lin", ["rise", "run", "slope-intercept-form"]);
    E("rise", "Rise", ["rises"], G,
      "How far a line goes up between two points (a negative rise goes down): the change in y.",
      "From (1, 2) to (3, 8) the rise is 8 − 2 = 6.",
      "lin", ["run", "slope"], true);
    E("run", "Run", ["runs"], G,
      "How far a line goes across between two points, left to right: the change in x.",
      "From (1, 2) to (3, 8) the run is 3 − 1 = 2.",
      "lin", ["rise", "slope"], true);
    E("y-intercept", "y-intercept", ["y-intercepts", "y intercept"], G,
      "Where a line crosses the y-axis: the value of y when x = 0. It is b in y = mx + b.",
      "y = 2x + 5 crosses the y-axis at (0, 5).",
      "lin", ["x-intercept", "slope-intercept-form", "axes"]);
    E("x-intercept", "x-intercept", ["x-intercepts", "x intercept"], G,
      "Where a line crosses the x-axis: the value of x when y = 0.",
      "y = 2x − 6 crosses the x-axis at (3, 0), because 2(3) − 6 = 0.",
      "lin", ["y-intercept"]);
    E("slope-intercept-form", "Slope-intercept form", ["slope-intercept"], G,
      "Writing a line as y = mx + b, where m is the slope and b is the y-intercept.",
      "y = 3x − 1 has slope 3 and y-intercept −1.",
      "lin", ["point-slope-form", "standard-form"]);
    E("point-slope-form", "Point-slope form", ["point-slope"], G,
      "Writing a line as y − y₁ = m(x − x₁), using its slope m and one point (x₁, y₁) on it.",
      "Slope 2 through (1, 5): y − 5 = 2(x − 1).",
      "lin", ["slope-intercept-form", "standard-form"]);
    E("standard-form", "Standard form", [], G,
      "Writing a line as Ax + By = C: both variables on the same side, usually with whole numbers.",
      "y = 2x + 3 in standard form is 2x − y = −3.",
      "lin", ["slope-intercept-form", "point-slope-form"]);
    E("parallel", "Parallel", [], G,
      "Lines that go in the same direction and never meet. Parallel lines have the same slope.",
      "y = 2x + 1 and y = 2x − 4 are parallel.",
      "lin geo", ["perpendicular", "transversal"], { forms: ["parallel lines"] });
    E("perpendicular", "Perpendicular", [], G,
      "Lines that cross at a right angle (90°). Their slopes multiply to −1, unless one line is level and the other straight up.",
      "Slopes 2 and −½ are perpendicular: 2 × (−½) = −1.",
      "lin", ["parallel", "right-angle"], { forms: ["perpendicular lines"] });
    E("coordinates", "Coordinates", ["coordinate", "ordered pair", "ordered pairs"], G,
      "A pair of numbers (x, y) giving a point’s position: x says how far across, y how far up or down.",
      "(3, −2) is 3 to the right of the origin and 2 down.",
      "lin", ["coordinate-plane", "origin"]);
    E("coordinate-plane", "Coordinate plane", ["coordinate planes", "coordinate grid", "coordinate grids"], G,
      "A flat grid made by an x-axis and a y-axis crossing at the origin, for plotting points and lines.",
      "To plot (2, 3), start at the origin and go 2 right and 3 up.",
      "lin", ["coordinates", "axes", "origin"]);
    E("origin", "Origin", [], G,
      "The point (0, 0), where the x-axis and the y-axis cross.",
      "Start at the origin and move 3 right to reach (3, 0).",
      "lin", ["coordinates"], true);
    E("axes", "x-axis and y-axis", ["x-axis", "y-axis", "x axis", "y axis", "axis", "axes"], G,
      "The two number lines on a graph: the x-axis goes left to right, the y-axis up and down. They cross at the origin.",
      "(4, 0) is on the x-axis; (0, −2) is on the y-axis.",
      "lin", ["coordinates", "origin"]);

    /* ============================== Geometry ============================== */
    E("perimeter", "Perimeter", ["perimeters"], M,
      "The total distance around the outside of a flat shape.",
      "An 8 cm by 5 cm rectangle: 8 + 5 + 8 + 5 = 26 cm.",
      "geo", ["area", "circumference"]);
    E("area", "Area", ["areas"], M,
      "How much flat space a shape covers, counted in unit squares like cm².",
      "An 8 cm by 5 cm rectangle has an area of 8 × 5 = 40 cm².",
      "mul div geo", ["perimeter", "surface-area"]);
    E("volume", "Volume", ["volumes"], M,
      "How much space a solid takes up, counted in unit cubes like cm³.",
      "A box 4 cm by 3 cm by 2 cm has a volume of 4 × 3 × 2 = 24 cm³.",
      "geo", ["surface-area", "area"]);
    E("surface-area", "Surface area", ["surface areas"], M,
      "The total area of all the outside faces of a solid.",
      "A cube with 2 cm edges has 6 faces of 4 cm², so 24 cm².",
      "geo", ["area", "volume"]);
    E("square", "Square", ["squares", "squared", "squaring"], M,
      "Two meanings: a shape with four equal sides and four right angles, or a number multiplied by itself.",
      "5 squared is 5² = 5 × 5 = 25. A square with 3 cm sides has an area of 3² = 9 cm².",
      "add sub mul div pct fac ord lin geo", ["exponent", "square-root"]);
    E("base", "Base", ["bases"], M,
      "Two meanings: in a power, the number being multiplied (2 in 2⁴); in a shape, the side or face it stands on.",
      "In 5³ the base is 5. A triangle’s area is ½ × base × height.",
      "fac ord geo", ["exponent", "area"]);
    E("circumference", "Circumference", ["circumferences"], M,
      "The distance around a circle: π × the diameter, or 2 × π × the radius.",
      "A circle 10 cm across has a circumference of about 3.14 × 10 = 31.4 cm.",
      "geo", ["diameter", "radius", "pi"]);
    E("radius", "Radius", ["radii", "radiuses"], M,
      "The distance from the center of a circle to its edge. It is half the diameter.",
      "If the diameter is 10 cm, the radius is 5 cm.",
      "geo", ["diameter", "circumference"]);
    E("diameter", "Diameter", ["diameters"], M,
      "The distance straight across a circle through its center. It is twice the radius.",
      "A radius of 4 cm means a diameter of 8 cm.",
      "geo", ["radius", "circumference"]);
    E("pi", "Pi (π)", ["pi", "π"], M,
      "The number you get when you divide any circle’s circumference by its diameter: about 3.14. Written π.",
      "Circumference = π × diameter, so a 10 cm circle is about 31.4 cm around.",
      "geo", ["circumference", "radius"]);
    E("angle", "Angle", ["angles"], M,
      "The amount of turn between two lines that meet at a point, measured in degrees.",
      "A quarter turn is 90°; a straight line is 180°.",
      "geo", ["right-angle", "supplementary"]);
    E("right-angle", "Right angle", ["right angles"], M,
      "An angle of exactly 90°, like the corner of a square. It is marked with a small square.",
      "The corners of a sheet of paper are right angles.",
      "lin geo", ["hypotenuse", "perpendicular"]);
    E("hypotenuse", "Hypotenuse", ["hypotenuses"], M,
      "The longest side of a right triangle: the side across from the right angle.",
      "In a 3-4-5 right triangle the hypotenuse is 5.",
      "geo", ["leg", "pythagorean-theorem"]);
    E("leg", "Leg", ["legs"], M,
      "Either of the two shorter sides of a right triangle: the two sides that make the right angle.",
      "In a 3-4-5 right triangle the legs are 3 and 4.",
      "geo", ["hypotenuse", "pythagorean-theorem"], true);
    E("pythagorean-theorem", "Pythagorean theorem", ["Pythagoras’ theorem", "Pythagoras's theorem",
        "Pythagoras’s theorem", "Pythagoras theorem", "Pythagoras"
      ], M,
      "In a right triangle, leg² + leg² = hypotenuse². Written a² + b² = c².",
      "3² + 4² = 9 + 16 = 25 = 5².",
      "geo", ["pythagorean-triple", "hypotenuse"]);
    E("pythagorean-triple", "Pythagorean triple", ["Pythagorean triples"], M,
      "Three whole numbers that fit a² + b² = c², so they can be the sides of a right triangle.",
      "3, 4, 5 and 5, 12, 13 are Pythagorean triples.",
      "geo", ["pythagorean-theorem"]);
    E("supplementary", "Supplementary angles", ["supplementary", "supplement", "supplements"], M,
      "Two angles that add up to 180°, like the two angles side by side on a straight line.",
      "130° and 50° are supplementary.",
      "geo", ["complementary"]);
    E("complementary", "Complementary angles", ["complementary", "complement", "complements"], M,
      "Two angles that add up to 90°.",
      "35° and 55° are complementary.",
      "geo", ["supplementary"]);
    E("vertical-angles", "Vertical angles", ["vertical angle", "vertically opposite angles"], M,
      "The angles across from each other where two lines cross. They are always equal.",
      "Two lines cross making a 65° angle; the angle across from it is 65° too.",
      "geo", ["supplementary"]);
    E("transversal", "Transversal", ["transversals"], M,
      "A line that crosses two or more other lines, often two parallel lines.",
      "A road crossing two straight, parallel railway tracks is a transversal.",
      "geo", ["parallel", "corresponding-angles"]);
    E("corresponding-angles", "Corresponding angles", ["corresponding angle"], M,
      "Angles in the same position at each crossing when a transversal cuts two lines. If the lines are parallel, they are equal.",
      "Top-left at one crossing is 65°, so top-left at the other crossing is 65° too.",
      "geo", ["transversal", "alternate-interior-angles"]);
    E("alternate-interior-angles", "Alternate interior angles", ["alternate interior angle", "alternate interior"], M,
      "Angles between the two lines, on opposite sides of the transversal. If the lines are parallel, they are equal: a Z shape.",
      "If one is 65°, the one across the Z is 65° too.",
      "geo", ["co-interior-angles", "corresponding-angles"]);
    E("co-interior-angles", "Co-interior angles", ["co-interior angle", "co-interior", "same-side interior angles",
        "same-side interior angle", "same-side interior", "consecutive interior angles"
      ], M,
      "Angles between the two lines, on the same side of the transversal. If the lines are parallel, they add to 180°: a C shape.",
      "If one is 65°, the other is 180° − 65° = 115°.",
      "geo", ["alternate-interior-angles", "supplementary"]);
    E("polygon", "Polygon", ["polygons"], M,
      "A flat, closed shape made of straight sides.",
      "Triangles, squares and hexagons are polygons; a circle is not.",
      "geo", ["interior-angle", "exterior-angle"]);
    E("interior-angle", "Interior angle", ["interior angles"], M,
      "An angle inside a polygon, at one of its corners. A polygon with n sides has interior angles adding to (n − 2) × 180°.",
      "A hexagon’s interior angles add up to 4 × 180° = 720°.",
      "geo", ["exterior-angle", "polygon"]);
    E("exterior-angle", "Exterior angle", ["exterior angles"], M,
      "The angle between one side of a shape and the next side stretched outward. A polygon’s exterior angles add up to 360°.",
      "Each exterior angle of a regular hexagon is 360° ÷ 6 = 60°.",
      "geo", ["interior-angle", "polygon"]);
    // the figures of the Shape Shop's Figures tab: words like point, line and plane mean many things, so the page links
    // them itself (manual); the angle kinds and intersecting lines are phrases that only ever mean the math thing
    E("point", "Point", ["points"], M,
      "An exact spot. It has no size: it is drawn as a dot and named with a capital letter.",
      "Point A is drawn as a dot with the letter A next to it.",
      "geo", ["line", "line-segment", "ray"], { manual: true });
    E("line", "Line", ["lines"], M,
      "A straight path that goes on forever in both directions. It is drawn with an arrow at each end and named by any two of its points.",
      "Line AB (written AB with a two-headed arrow over it) is the same line as line BA.",
      "geo", ["line-segment", "ray", "point"], { manual: true });
    E("line-segment", "Line segment", ["line segments", "segment", "segments"], M,
      "Part of a line between two endpoints. It is drawn with a dot at each end and no arrows, and named by its endpoints.",
      "Segment AC (written AC with a bar over it) is the same as segment CA.",
      "geo", ["endpoint", "line", "ray"], { manual: true });
    E("ray", "Ray", ["rays"], M,
      "Part of a line that starts at one endpoint and goes on forever in one direction. It is named with its endpoint first.",
      "Ray BC starts at B and goes through C; ray CB would start at C and go the other way.",
      "geo", ["endpoint", "line", "line-segment"], { manual: true });
    E("endpoint", "Endpoint", ["endpoints", "end point", "end points"], M,
      "A point where a segment or a ray stops. A segment has two endpoints, a ray has one, a line has none.",
      "Segment AC has endpoints A and C.",
      "geo", ["line-segment", "ray"], { manual: true });
    E("plane", "Plane", ["planes"], M,
      "A flat surface that goes on forever in every direction, like a sheet of paper that never ends.",
      "Points, lines and angles drawn on a page are all in one plane.",
      "geo", ["point", "line"], { manual: true });
    E("collinear", "Collinear", ["collinear points"], M,
      "Points that lie on the same straight line.",
      "If B is on line AC, then A, B and C are collinear.",
      "geo", ["line", "point"], { manual: true });
    E("vertex", "Vertex", ["vertices", "vertexes"], M,
      "The point where the two sides of an angle meet, or a corner of a shape. (On a parabola, its turning point.)",
      "In ∠ABC the vertex is B, the letter in the middle.",
      "geo", ["angle", "ray"], { manual: true });
    E("acute-angle", "Acute angle", ["acute angles"], M,
      "An angle smaller than a right angle: less than 90°.",
      "A 45° angle is acute.",
      "geo", ["right-angle", "obtuse-angle"]);
    E("obtuse-angle", "Obtuse angle", ["obtuse angles"], M,
      "An angle bigger than a right angle but smaller than a straight angle: between 90° and 180°.",
      "A 120° angle is obtuse.",
      "geo", ["right-angle", "acute-angle", "straight-angle"]);
    E("straight-angle", "Straight angle", ["straight angles"], M,
      "An angle whose two sides point in opposite directions along one line: exactly 180°.",
      "If B is between A and C on a line, ∠ABC is a straight angle.",
      "geo", ["obtuse-angle", "supplementary"]);
    E("intersecting-lines", "Intersecting lines", ["intersecting line"], M,
      "Lines that cross each other at one point. If they cross at a right angle, they are perpendicular.",
      "The two lines of an X are intersecting lines.",
      "geo", ["perpendicular", "parallel", "vertical-angles"]);

    /* ============================== Statistics ============================== */
    E("mean", "Mean", ["average", "averages", "arithmetic mean"], S,
      "The usual average: add up all the numbers, then divide by how many numbers there are.",
      "4, 5, 6, 7, 8: they add up to 30, and 30 ÷ 5 = 6.",
      "sta", ["median", "mode"], true);
    E("median", "Median", ["medians"], S,
      "The middle number once the data is in order. With two middle numbers, it is halfway between them.",
      "3, 4, 7, 9: the middle two are 4 and 7, so the median is 5.5.",
      "sta", ["mean", "quartile"]);
    E("mode", "Mode", ["modes"], S,
      "The number that shows up most often. There can be more than one mode, or none at all.",
      "2, 5, 5, 8, 10: the mode is 5.",
      "sta", ["mean", "median"], true);
    E("range", "Range", ["ranges"], S,
      "How spread out the data is: the biggest number minus the smallest.",
      "4, 8, 6, 5, 7: the range is 8 − 4 = 4.",
      "sta", ["iqr"], true);
    E("quartile", "Quartile", ["quartiles"], S,
      "The numbers that split ordered data into four equal parts. Q1 is the middle of the lower half; Q3 of the upper half.",
      "1, 3, 5, 7, 9, 11, 13, 15: Q1 = 4, the median is 8, Q3 = 12.",
      "sta", ["iqr", "median", "box-plot"], { forms: ["lower quartile", "upper quartile", "first quartile", "third quartile", "Q1", "Q3", "Q₁", "Q₃"] });
    E("iqr", "Interquartile range (IQR)", ["interquartile range", "interquartile ranges", "inter-quartile range", "IQR"], S,
      "The spread of the middle half of the data: the upper quartile minus the lower quartile (Q3 − Q1).",
      "Q1 = 4 and Q3 = 12, so the IQR is 12 − 4 = 8.",
      "sta", ["quartile", "range", "outlier"]);
    E("outlier", "Outlier", ["outliers"], S,
      "A number far away from the rest of the data. A usual test: more than 1.5 × IQR below Q1 or above Q3.",
      "In 4, 5, 6, 7, 8, 30, the 30 is an outlier: Q1 = 5, Q3 = 8, and 30 is far above 8 + 1.5 × 3.",
      "sta", ["iqr", "box-plot"]);
    E("five-number-summary", "Five-number summary", ["five number summary", "five-number summaries"], S,
      "Five numbers that describe a data set: the smallest, the lower quartile, the median, the upper quartile and the largest.",
      "1, 3, 5, 7, 9, 11, 13, 15: 1, 4, 8, 12, 15.",
      "sta", ["box-plot", "quartile"]);
    E("box-plot", "Box plot", ["box plots", "box-plot", "box-and-whisker plot", "box-and-whisker plots",
        "box and whisker plot", "box-and-whisker"
      ], S,
      "A drawing of the five-number summary: a box from Q1 to Q3 with a line at the median, and whiskers out to the ends.",
      "For 1, 3, 5, 7, 9, 11, 13, 15: whiskers from 1 to 15, box from 4 to 12, a line at 8.",
      "sta", ["five-number-summary", "quartile"]);
    E("dot-plot", "Dot plot", ["dot plots", "line plot", "line plots"], S,
      "A number line with a dot above it for every value in the data. Repeated values stack up.",
      "2, 3, 3, 5: one dot over 2, two dots over 3, one over 5.",
      "sta", ["frequency", "histogram"]);
    E("frequency", "Frequency", ["frequencies"], S,
      "How many times a value, or a group of values, shows up in the data. A frequency table lists each value and its count.",
      "In 2, 5, 5, 8 the frequency of 5 is 2.",
      "sta", ["histogram", "dot-plot"], { forms: ["frequency table", "frequency tables", "tally chart", "tally charts"] });
    E("histogram", "Histogram", ["histograms"], S,
      "A bar graph of grouped numbers. Each bar covers a range of values and its height is the frequency. The bars touch.",
      "Bars for 10–19, 20–29 and 30–39, with heights 4, 7 and 2.",
      "sta", ["frequency", "dot-plot"]);
    E("mad", "Mean absolute deviation (MAD)", ["mean absolute deviation", "mean absolute deviations", "MAD"], S,
      "The average distance of the numbers from their mean. Find each number’s distance from the mean, then the mean of those.",
      "2, 4, 6, 8: the mean is 5, the distances are 3, 1, 1, 3, so MAD = 8 ÷ 4 = 2.",
      "sta", ["mean", "standard-deviation"]);
    E("standard-deviation", "Standard deviation", ["standard deviations"], S,
      "A measure of spread: square each distance from the mean, average the squares, then take the square root.",
      "2, 4, 4, 4, 5, 5, 7, 9: mean 5; the squared distances add to 32; 32 ÷ 8 = 4; √4 = 2.",
      "sta", ["mad", "mean"]);

    /* ============================== lookups ============================== */
    var BY_ID = {},
      KEYS = {},
      ALTS = [];

    function norm(s) {
      return String(s).toLowerCase().replace(/[\u2010\u2011\u2012\u2013]/g, "-").replace(/[\u2018\u2019]/g, "'")
        .replace(/[\s\u00a0]+/g, " ").trim();
    }

    function isCaps(s) { return /^[A-Z][A-Z0-9\u2081\u2083]+$/.test(s); } // GCF, IQR, Q1\u2026: only matches in capitals
    TERMS.forEach(function(t) {
      BY_ID[t.id] = t;
      var words = [t.term.replace(/\s*\([^)]*\)\s*$/, "")].concat(t.aliases, t.forms || []);
      words.forEach(function(w) {
        var k = norm(w);
        if (!k || KEYS[k]) return;
        KEYS[k] = { id: t.id, caps: isCaps(w) };
        ALTS.push(k);
      });
    });
    ALTS.sort(function(a, b) { return b.length - a.length; });

    function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    var RE = null;
    try {
      RE = new RegExp("(^|[^A-Za-z0-9])(" + ALTS.map(function(k) {
        return reEsc(k).replace(/ /g, "[\\s\\u00a0]+").replace(/-/g, "[-\\u2010\\u2011]").replace(/'/g, "['\\u2019]");
      }).join("|") + ")(?![A-Za-z0-9])", "gi");
    } catch (e) { RE = null; }

    function byId(id) { return BY_ID[id] || null; }

    function find(word) {
      var k = KEYS[norm(word || "")];
      if (!k) return null;
      if (k.caps && String(word).trim() !== String(word).trim().toUpperCase()) return null;
      return BY_ID[k.id];
    }

    /* every match in a string: [{index, length, id}] (the longest phrase wins at each spot) */
    function matches(text) {
      var out = [];
      if (!RE || !text) return out;
      RE.lastIndex = 0;
      var m;
      while ((m = RE.exec(text))) {
        var word = m[2],
          k = KEYS[norm(word)];
        if (k && !(k.caps && word !== word.toUpperCase())) out.push({ index: m.index + m[1].length, length: word.length, id: k.id });
        if (m[0].length === 0) RE.lastIndex++;
      }
      return out;
    }

    function scan(text) { return matches(String(text || "")).map(function(x) { return x.id; }); }

    /* ============================== linking ============================== */
    var ROOTS = ".log .txt, .log .aside, .aside, .tapecap, .cap, figcaption, .closer, .tagline, .answer .facts, .fact, " +
      ".hint, .maker .lbl, .maker label";
    var NEVER = "a, button, input, select, option, textarea, svg, code, pre, kbd, script, style, noscript, " +
      "[contenteditable], .answer .v, .expr, .crow, .fr, .gl-pop, .sitenav, h1, h2, h3";

    // the Word List's address (site.js knows its folder)
    function wordList(hash) { return window.HelperSite ? window.HelperSite.url("glossary.html", hash) : "glossary.html" + hash; }

    function here() { return ((window.HelperSite && window.HelperSite.here) || location.pathname.split("/").pop() || "index.html").toLowerCase(); }

    function isEmbed() {
      return document.documentElement.classList.contains("embed") || /[?&]embed=1(&|$)/.test(location.search);
    }

    function blocked(el, root) {
      if (el.closest(NEVER)) return true;
      var lab = el.closest("label");
      return !!(lab && lab.querySelector("input, select, textarea"));
    }

    function shown(el) {
      if (!el.getClientRects().length) return false;
      for (var d = el.closest("details"); d; d = d.parentElement && d.parentElement.closest("details")) {
        // a closed <details> hides everything but its <summary> (some browsers still report boxes for it)
        if (!d.open) { var s = el.closest("summary"); if (!s || !d.contains(s)) return false; }
      }
      return true;
    }

    function linkIn(scope, all) {
      var made = 0;
      if (!RE || !scope || !scope.querySelectorAll) return 0;
      var page = here(),
        embed = isEmbed(),
        seen = {};
      Array.prototype.forEach.call(document.querySelectorAll("a.gl-term[data-gl]"), function(a) { seen[a.getAttribute("data-gl")] = 1; });

      var roots;
      if (all || (scope.closest && scope.closest(ROOTS))) roots = [scope];
      else {
        roots = [];
        Array.prototype.forEach.call(scope.querySelectorAll(ROOTS), function(r) {
          // a root inside another root is walked with its parent, in page order
          if (r.parentElement && r.parentElement.closest(ROOTS)) return;
          roots.push(r);
        });
      }

      roots.forEach(function(root) {
        // not on screen (a closed "make a problem" box, a hidden answer): leave it for when it shows
        if (!all && !shown(root)) return;
        var nodes = [],
          w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false),
          n;
        while ((n = w.nextNode()))
          if (/[A-Za-z\u03c0]/.test(n.nodeValue)) nodes.push(n);
        nodes.forEach(function(node) {
          var parent = node.parentElement;
          if (!parent || blocked(parent, root)) return;
          var text = node.nodeValue,
            found = matches(text),
            pick = [];
          found.forEach(function(f) {
            var t = BY_ID[f.id];
            if (!t || seen[f.id] || t.manual) return;
            if (t.strict && t.pages.indexOf(page) < 0) return;
            seen[f.id] = 1;
            pick.push(f);
          });
          if (!pick.length) return;
          var frag = document.createDocumentFragment(),
            at = 0;
          pick.forEach(function(f) {
            if (f.index > at) frag.appendChild(document.createTextNode(text.slice(at, f.index)));
            var a = document.createElement("a");
            a.className = "gl-term";
            a.href = wordList("#" + f.id);
            a.setAttribute("data-gl", f.id);
            if (embed) {
              a.target = "_blank";
              a.rel = "noopener";
            }
            a.textContent = text.substr(f.index, f.length);
            frag.appendChild(a);
            at = f.index + f.length;
            made++;
          });
          if (at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
          parent.replaceChild(frag, node);
        });
      });
      return made;
    }

    var observer = null,
      watched = null,
      timer = 0,
      AUTO = false;

    function link(root, opts) {
      try {
        if (observer) observer.disconnect();
        return linkIn(root || document.body, !!(opts && opts.all));
      } catch (e) { return 0; } finally {
        try {
          if (observer && watched) {
            observer.takeRecords();
            // new text, and things being shown or hidden (an opened <details>, a revealed answer)
            observer.observe(watched, {
              childList: true,
              subtree: true,
              characterData: true,
              attributes: true,
              attributeFilter: ["hidden", "open", "class", "style"]
            });
          }
        } catch (e2) {}
      }
    }

    function relink() {
      timer = 0;
      try { if (popFor && !document.body.contains(popFor)) hide(); } catch (e) {}
      link(document.body);
    }

    /* ============================== the popup ============================== */
    var CSS =
      "a.gl-term{color:inherit;text-decoration:underline dotted;text-decoration-thickness:1px;text-underline-offset:.22em;" +
      "text-decoration-color:var(--ink-3,currentColor);cursor:help;border-radius:2px}" +
      "a.gl-term:hover,a.gl-term[aria-describedby]{text-decoration-color:currentColor}" +
      "a.gl-term:focus-visible{outline:2px solid var(--focus,currentColor);outline-offset:2px}" +
      ".gl-pop{position:absolute;left:0;top:0;z-index:2147483000;box-sizing:border-box;width:max-content;max-width:320px;" +
      "padding:10px 13px 11px;background:var(--surface,#fff);color:var(--ink,#18201C);border:1px solid var(--rule,#C8CFCA);" +
      "border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,.12),0 10px 28px -10px rgba(0,0,0,.45);" +
      "font-family:var(--f-body,\"IBM Plex Sans\",\"Segoe UI\",Helvetica,Arial,sans-serif);font-size:14px;line-height:1.45;" +
      "font-weight:400;font-style:normal;letter-spacing:normal;text-transform:none;text-align:left;white-space:normal;" +
      "overflow-wrap:break-word;pointer-events:auto}" +
      ".gl-pop[hidden]{display:none !important}" +
      ".gl-pop .gl-t{display:block;font-weight:700;font-size:15px;margin:0 0 2px;color:var(--ink,#18201C)}" +
      ".gl-pop .gl-d{display:block;margin:0}" +
      ".gl-pop .gl-x{display:block;margin:6px 0 0;font-size:13px;color:var(--ink-2,#4A5550)}" +
      ".gl-pop .gl-more{display:inline-block;margin-top:7px;font-size:13px;font-weight:600;color:var(--key,var(--ink,#18201C));" +
      "text-decoration:underline;text-underline-offset:.18em}" +
      "@media print{a.gl-term{text-decoration:none !important;color:inherit !important;cursor:auto}" +
      ".gl-pop{display:none !important}}";

    var pop = null,
      popFor = null,
      showT = 0,
      hideT = 0,
      last = { type: "", t: 0, el: null };

    function termOf(el) { return el && el.closest ? el.closest("a[data-gl]") : null; }

    function now() { return new Date().getTime(); }

    function ensurePop() {
      if (pop && pop.parentNode) return pop;
      pop = document.createElement("div");
      pop.id = "gl-pop";
      pop.className = "gl-pop";
      pop.setAttribute("role", "tooltip");
      pop.hidden = true;
      pop.addEventListener("mouseenter", function() { clearTimeout(hideT); });
      pop.addEventListener("mouseleave", function() { if (last.type === "mouse") later(); });
      document.body.appendChild(pop);
      return pop;
    }

    function fill(t) {
      var p = ensurePop();
      p.textContent = "";

      function bit(tag, cls, text) {
        var e = document.createElement(tag);
        e.className = cls;
        e.textContent = text;
        p.appendChild(e);
        return e;
      }
      var w = "glossary.w." + t.id + ".";
      bit("b", "gl-t", tr(w + "term", t.term));
      bit("span", "gl-d", tr(w + "short", t.short));
      if (t.example) bit("span", "gl-x", tr(w + "example", t.example));
      var more = bit("a", "gl-more", tr("glossary.more", "More \u2192"));
      more.href = wordList("#" + t.id);
      more.tabIndex = -1;
      more.setAttribute("aria-label", tr("glossary.moreAbout", "More about {t}", { t: tr(w + "term", t.term).replace(/\s*\([^)]*\)\s*$/, "") }));
      if (isEmbed()) {
        more.target = "_blank";
        more.rel = "noopener";
      }
    }

    function place(el) {
      var p = pop,
        rs = el.getClientRects(),
        r = rs.length ? rs[0] : el.getBoundingClientRect();
      var de = document.documentElement,
        vw = de.clientWidth || window.innerWidth,
        vh = window.innerHeight || de.clientHeight;
      p.style.maxWidth = Math.max(160, Math.min(320, vw - 16)) + "px";
      p.style.left = "0px";
      p.style.top = "0px";
      var pw = p.offsetWidth,
        ph = p.offsetHeight;
      var left = r.left + r.width / 2 - pw / 2;
      left = Math.max(8, Math.min(left, vw - pw - 8));
      var below = r.bottom + 8,
        above = r.top - 8 - ph,
        top;
      if (below + ph <= vh - 8) top = below;
      else if (above >= 8) top = above;
      else top = (vh - r.bottom > r.top) ? below : above; // neither fits: the roomier side
      var sx = window.pageXOffset || de.scrollLeft || 0,
        sy = window.pageYOffset || de.scrollTop || 0;
      p.style.left = Math.round(left + sx) + "px";
      p.style.top = Math.round(top + sy) + "px";
      p.setAttribute("data-side", top === below ? "below" : "above");
    }

    function show(el) {
      clearTimeout(showT);
      clearTimeout(hideT);
      var t = byId(el.getAttribute("data-gl"));
      if (!t || !document.body.contains(el)) return;
      if (popFor && popFor !== el) popFor.removeAttribute("aria-describedby");
      fill(t);
      pop.hidden = false;
      place(el);
      popFor = el;
      el.setAttribute("aria-describedby", "gl-pop");
    }

    function hide() {
      clearTimeout(showT);
      clearTimeout(hideT);
      if (pop) pop.hidden = true;
      if (popFor) popFor.removeAttribute("aria-describedby");
      popFor = null;
    }

    function later() {
      clearTimeout(hideT);
      hideT = setTimeout(hide, 220);
    }

    function safe(fn) { return function(e) { try { fn(e); } catch (x) {} }; }

    function wire() {
      var PE = !!window.PointerEvent;
      document.addEventListener(PE ? "pointerover" : "mouseover", safe(function(e) {
        if (PE && e.pointerType !== "mouse") return;
        var el = termOf(e.target);
        if (!el) return;
        last.type = "mouse";
        clearTimeout(hideT);
        if (popFor === el) return;
        clearTimeout(showT);
        showT = setTimeout(function() { try { show(el); } catch (x) {} }, 120);
      }));
      document.addEventListener(PE ? "pointerout" : "mouseout", safe(function(e) {
        if (PE && e.pointerType !== "mouse") return;
        var el = termOf(e.target);
        if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
        clearTimeout(showT);
        if (popFor === el && !(pop && e.relatedTarget && pop.contains(e.relatedTarget))) later();
      }));

      function down(e) {
        var type = e.pointerType || (e.type === "touchstart" ? "touch" : "mouse");
        var el = termOf(e.target);
        last = { type: type, t: now(), el: el };
        if (!popFor) return;
        if (el === popFor || (pop && pop.contains(e.target))) return;
        hide();
      }
      if (PE) document.addEventListener("pointerdown", safe(down), true);
      else {
        document.addEventListener("touchstart", safe(down), true);
        document.addEventListener("mousedown", safe(down), true);
      }
      document.addEventListener("click", safe(function(e) {
        var el = termOf(e.target);
        if (!el) return;
        var touch = (last.type === "touch" || last.type === "pen") && now() - last.t < 1500;
        if (!touch) return; // a mouse click or the Enter key goes straight to the entry
        if (popFor !== el) {
          e.preventDefault();
          show(el);
        }
      }), true);
      document.addEventListener("focusin", safe(function(e) {
        var el = termOf(e.target);
        if (!el) return;
        if (last.el === el && now() - last.t < 1000) return; // focus from a tap or click: the pointer decides
        show(el);
      }));
      document.addEventListener("focusout", safe(function(e) {
        if (!popFor) return;
        if (e.target !== popFor && !(pop && pop.contains(e.target))) return;
        var to = e.relatedTarget;
        if (to && (to === popFor || (pop && pop.contains(to)))) return; // e.g. a tap on "More"
        if (last.type === "mouse") later();
        else hide();
      }));
      document.addEventListener("keydown", safe(function(e) {
        if ((e.key === "Escape" || e.key === "Esc") && popFor) { hide(); }
      }));
      window.addEventListener("resize", safe(function() { if (popFor) hide(); }));
    }

    /* ============================== start ============================== */
    function start() {
      try {
        if (!document.getElementById("gl-style")) {
          var st = document.createElement("style");
          st.id = "gl-style";
          st.textContent = CSS;
          (document.head || document.documentElement).appendChild(st);
        }
        wire();
        var page = here();
        AUTO = page !== "glossary.html" && page !== "tests.html";
        if (!AUTO) return;
        watched = document.querySelector(".page") || document.body;
        if (window.MutationObserver) {
          observer = new MutationObserver(function(recs) {
            try {
              var real = recs.some(function(r) { return !(pop && (r.target === pop || pop.contains(r.target))); });
              if (!real) return;
              clearTimeout(timer);
              timer = setTimeout(relink, 150);
            } catch (e) {}
          });
        }
        link(document.body);
      } catch (e) {}
    }

    window.HelperGlossary = { terms: TERMS, byId: byId, find: find, link: link, scan: scan, topics: [A, F, P, K, I, L, G, M, S] };
    try {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
      else start();
    } catch (e) {}
  }
})();
