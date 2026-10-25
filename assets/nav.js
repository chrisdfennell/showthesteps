/* The bar across the top of every helper page: back to the home page, and a link to each of the others.
   To add a page, add a line to PAGES (helpers) or TOOLS, and its folder to site.js. A page opened without this file
   still works; it just has no bar. Every link here is made by HelperSite (site.js, loaded first), so the bar works
   from any folder. This file also lets the site be installed as an app and work offline (manifest + sw.js). */
(function() {
  "use strict";
  var PAGES = [
    { href: "number-sense.html", sign: "#", name: "Place value", title: "The Place Value Chart: number sense", c: "num" },
    { href: "addition.html", sign: "+", name: "Add", title: "The Carry Column", c: "add" },
    { href: "subtraction.html", sign: "−", name: "Subtract", title: "The Borrow Bank", c: "sub" },
    { href: "multiplication.html", sign: "×", name: "Multiply", title: "The Product Ladder", c: "mul" },
    { href: "division.html", sign: "÷", name: "Divide", title: "The Division House", c: "div" },
    { href: "scratch.html", sign: "✍", name: "By hand", title: "The Scratch Paper: do + − × ÷ yourself", c: "scr" },
    { href: "fractions.html", sign: "½", name: "Fractions", title: "The Fraction Bar", c: "fra" },
    { href: "percents.html", sign: "%", name: "Percents", title: "The Hundred Grid", c: "pct" },
    { href: "money-math.html", sign: "$", name: "Money", title: "The Money Jar: interest, loans, paychecks and budgets", c: "mon" },
    { href: "factors.html", sign: "⋔", name: "Factors", title: "The Factor Tree", c: "fac" },
    { href: "integers.html", sign: "±", name: "Integers", title: "The Number Line", c: "int" },
    { href: "ratios.html", sign: "∶", name: "Ratios", title: "The Ratio Table", c: "rat" },
    { href: "unit-conversions.html", sign: "⇄", name: "Units", title: "The Measuring Tape: unit conversions", c: "uni" },
    { href: "exponents.html", sign: "xⁿ", name: "Powers", title: "The Power Tower", c: "exp" },
    { href: "pemdas.html", sign: "( )", name: "Order", title: "The Order Stack", c: "ord" },
    { href: "algebra.html", sign: "x", name: "Algebra", title: "The Balance Scale", c: "alg", italic: true },
    { href: "lines.html", sign: "↗", name: "Lines", title: "The Slope Grid", c: "lin" },
    { href: "graphing.html", sign: "⌗", name: "Graphing", title: "The Graph Paper", c: "gra" },
    { href: "functions.html", sign: "f(x)", name: "Functions", title: "The Function Machine: functions", c: "fun" },
    { href: "radicals.html", sign: "√", name: "Radicals", title: "The Root Cellar: radicals and rational expressions", c: "rad" },
    { href: "complex-numbers.html", sign: "i", name: "Complex", title: "The Complex Plane: complex numbers", c: "cpx" },
    { href: "quadratics.html", sign: "x²", name: "Quadratics", title: "The Area Box: quadratics and polynomials", c: "qua" },
    { href: "logarithms.html", sign: "log", name: "Logs", title: "The Log Ladder: logarithms", c: "log" },
    { href: "sequences.html", sign: "aₙ", name: "Sequences", title: "The Number Staircase: sequences and series", c: "seq" },
    { href: "geometry.html", sign: "△", name: "Geometry", title: "The Shape Shop", c: "geo" },
    { href: "stats.html", sign: "⁘", name: "Statistics", title: "The Dot Plot", c: "sta" },
    { href: "probability.html", sign: "◔", name: "Chance", title: "The Chance Spinner", c: "pro" },
    { href: "counting.html", sign: "n!", name: "Counting", title: "The Counting Tree: counting, arrangements (nPr) and combinations (nCr)", c: "cnt" },
    { href: "trigonometry.html", sign: "∠", name: "Trig", title: "The Unit Circle: trigonometry", c: "tri" },
    { href: "calculus.html", sign: "∫", name: "Calculus", title: "The Rate Machine: calculus", c: "cal" },
    { href: "college-statistics.html", sign: "σ", name: "Statistics II", title: "The Bell Curve: college statistics", c: "bel" },
    { href: "matrices-and-vectors.html", sign: "[ ]", name: "Matrices", title: "The Matrix Grid: matrices and vectors", c: "mat" },
    { href: "wordproblems.html", sign: "✎", name: "Stories", title: "The Story Problem", c: "wrd" }
  ];
  /* The bar's helper menus: one button for each section (the home page's groups), opening a panel of its helpers, each
     with links straight to its tabs. FULL is the name a helper goes by in the panels. TABS is each helper's tabs as
     [the query that opens it, its label], read off the helpers' own tab buttons (division picks its tab with ans=). */
  var SECTIONS = [{
    name: "Arithmetic",
    sign: "+",
    c: "add",
    title: "Counting and the four operations",
    pages: ["number-sense.html", "addition.html", "subtraction.html", "multiplication.html", "division.html", "scratch.html", "pemdas.html"]
  }, {
    name: "Fractions & money",
    sign: "½",
    c: "fra",
    title: "Fractions, ratios, measurement and money",
    pages: ["fractions.html", "percents.html", "factors.html", "unit-conversions.html", "money-math.html", "integers.html", "ratios.html", "exponents.html"]
  }, {
    name: "Algebra & graphs",
    sign: "x",
    c: "alg",
    italic: true,
    title: "Algebra and graphs",
    pages: ["algebra.html", "lines.html", "graphing.html", "functions.html", "quadratics.html", "radicals.html", "complex-numbers.html", "logarithms.html", "sequences.html"]
  }, {
    name: "Shapes, data & chance",
    sign: "△",
    c: "geo",
    title: "Shapes, data, chance and stories",
    pages: ["geometry.html", "stats.html", "probability.html", "counting.html", "wordproblems.html"]
  }, {
    name: "Trig & college",
    sign: "∫",
    c: "cal",
    title: "Trigonometry, calculus and college math",
    pages: ["trigonometry.html", "calculus.html", "college-statistics.html", "matrices-and-vectors.html"]
  }];
  var FULL = {
    "number-sense.html": "Place value",
    "addition.html": "Addition",
    "subtraction.html": "Subtraction",
    "multiplication.html": "Multiplication",
    "division.html": "Long division",
    "scratch.html": "Do it by hand",
    "pemdas.html": "Order of operations",
    "fractions.html": "Fractions",
    "percents.html": "Percents",
    "factors.html": "Factors and primes",
    "unit-conversions.html": "Unit conversions",
    "money-math.html": "Money math",
    "integers.html": "Negative numbers",
    "ratios.html": "Ratios and rates",
    "exponents.html": "Exponents and roots",
    "algebra.html": "Equations",
    "lines.html": "Lines and slope",
    "graphing.html": "Graphing",
    "functions.html": "Functions",
    "quadratics.html": "Quadratics",
    "radicals.html": "Radicals",
    "complex-numbers.html": "Complex numbers",
    "logarithms.html": "Logarithms",
    "sequences.html": "Sequences and series",
    "geometry.html": "Geometry",
    "stats.html": "Statistics",
    "probability.html": "Probability",
    "counting.html": "Counting",
    "wordproblems.html": "Story problems",
    "trigonometry.html": "Trigonometry",
    "calculus.html": "Calculus",
    "college-statistics.html": "College statistics",
    "matrices-and-vectors.html": "Matrices and vectors"
  };
  var TABS = {
    "number-sense.html": [
      ["mode=place", "Place value"],
      ["mode=round", "Rounding"],
      ["mode=estimate", "Estimating"],
      ["mode=compare", "Compare & order"],
      ["mode=skip", "Skip counting"],
      ["mode=time", "Telling time"],
      ["mode=money", "Money"]
    ],
    "addition.html": [
      ["mode=dec", "Decimals"],
      ["mode=frac", "Fractions"]
    ],
    "subtraction.html": [
      ["mode=dec", "Decimals"],
      ["mode=frac", "Fractions"]
    ],
    "multiplication.html": [
      ["mode=dec", "Decimals"],
      ["mode=frac", "Fractions"]
    ],
    "division.html": [
      ["ans=remainder", "Quotient & remainder"],
      ["ans=fraction", "Fraction"],
      ["ans=decimal", "Decimal"]
    ],
    "fractions.html": [
      ["mode=simplify", "Simplify"],
      ["mode=convert", "Convert"],
      ["mode=compare", "Compare & order"],
      ["mode=equiv", "Equivalent"]
    ],
    "percents.html": [
      ["mode=of", "Percent of"],
      ["mode=what", "What percent"],
      ["mode=whole", "Find the whole"],
      ["mode=change", "Percent change"],
      ["mode=money", "Money"]
    ],
    "factors.html": [
      ["mode=factors", "Factors"],
      ["mode=prime", "Prime factorization"],
      ["mode=test", "Prime or composite?"],
      ["mode=gcf", "GCF & LCM"],
      ["mode=div", "Divisibility"]
    ],
    "unit-conversions.html": [
      ["mode=length", "Length"],
      ["mode=weight", "Weight & capacity"],
      ["mode=metric", "Metric"],
      ["mode=systems", "Between systems"],
      ["mode=time", "Time"],
      ["mode=temp", "Temperature"],
      ["mode=rates", "Rates, area & volume"]
    ],
    "money-math.html": [
      ["mode=compound", "Compound interest"],
      ["mode=save", "Saving monthly"],
      ["mode=loan", "Loans"],
      ["mode=card", "Credit cards"],
      ["mode=pay", "Paychecks"],
      ["mode=budget", "Budgets"],
      ["mode=shop", "Shopping"]
    ],
    "integers.html": [
      ["mode=add", "Add"],
      ["mode=sub", "Subtract"],
      ["mode=muldiv", "Multiply & divide"],
      ["mode=abs", "Absolute value & compare"],
      ["mode=chain", "Several steps"]
    ],
    "ratios.html": [
      ["mode=simplify", "Simplify & equivalent"],
      ["mode=rate", "Unit rate"],
      ["mode=prop", "Proportions"],
      ["mode=share", "Share in a ratio"],
      ["mode=scale", "Scale"]
    ],
    "exponents.html": [
      ["mode=eval", "Powers"],
      ["mode=laws", "Exponent laws"],
      ["mode=sci", "Scientific notation"],
      ["mode=scicalc", "Sci. notation math"],
      ["mode=roots", "Roots"]
    ],
    "algebra.html": [
      ["mode=simplify", "Simplify"],
      ["mode=solve", "Solve"],
      ["mode=ineq", "Inequality"],
      ["mode=sys", "System"]
    ],
    "lines.html": [
      ["mode=slope", "Slope"],
      ["mode=equation", "Equation of a line"],
      ["mode=convert", "Convert forms"],
      ["mode=graph", "Graph it"],
      ["mode=parallel", "Parallel & perpendicular"]
    ],
    "graphing.html": [
      ["mode=points", "Points"],
      ["mode=table", "Table of values"],
      ["mode=functions", "Functions"],
      ["mode=systems", "Systems"],
      ["mode=inequalities", "Inequalities"],
      ["mode=transform", "Transformations"],
      ["mode=scatter", "Scatter plots"],
      ["mode=free", "Free plot"]
    ],
    "functions.html": [
      ["mode=eval", "Evaluate"],
      ["mode=func", "Function?"],
      ["mode=domain", "Domain & range"],
      ["mode=combine", "Combine"],
      ["mode=compose", "Compose"],
      ["mode=inverse", "Inverse"],
      ["mode=piece", "Piecewise"],
      ["mode=parity", "Even or odd"]
    ],
    "quadratics.html": [
      ["mode=expand", "Expand"],
      ["mode=factor", "Factor"],
      ["mode=solve", "Solve"],
      ["mode=vertex", "Vertex"],
      ["mode=divide", "Divide"],
      ["mode=operate", "Add & subtract"]
    ],
    "radicals.html": [
      ["mode=simplify", "Simplify roots"],
      ["mode=operate", "Add & multiply roots"],
      ["mode=rationalize", "Rationalize"],
      ["mode=exponents", "Fraction exponents"],
      ["mode=radeq", "Radical equations"],
      ["mode=ratsimp", "Simplify fractions"],
      ["mode=ratmul", "Multiply & divide"],
      ["mode=ratadd", "Add & subtract"],
      ["mode=rateq", "Rational equations"]
    ],
    "complex-numbers.html": [
      ["mode=i", "What i is"],
      ["mode=add", "Add & subtract"],
      ["mode=mul", "Multiply"],
      ["mode=div", "Divide"],
      ["mode=plane", "The plane"],
      ["mode=polar", "Polar form"],
      ["mode=demoivre", "De Moivre"],
      ["mode=solve", "Solve"]
    ],
    "logarithms.html": [
      ["mode=meaning", "What a log is"],
      ["mode=laws", "Log laws"],
      ["mode=change", "Change of base"],
      ["mode=expeq", "Exponential equations"],
      ["mode=logeq", "Log equations"],
      ["mode=growth", "Growth & interest"],
      ["mode=graph", "Graphs"]
    ],
    "sequences.html": [
      ["mode=pattern", "What comes next?"],
      ["mode=arith", "Arithmetic"],
      ["mode=geom", "Geometric"],
      ["mode=sum", "Series & sums"],
      ["mode=apply", "Word problems"]
    ],
    "geometry.html": [
      ["mode=area", "Area & perimeter"],
      ["mode=vol", "Volume & surface area"],
      ["mode=right", "Right triangles"],
      ["mode=angle", "Angles"]
    ],
    "stats.html": [
      ["mode=center", "Mean, median, mode"],
      ["mode=box", "Box plot"],
      ["mode=freq", "Frequency"],
      ["mode=spread", "Spread"],
      ["mode=missing", "Missing value"]
    ],
    "probability.html": [
      ["mode=simple", "One event"],
      ["mode=complement", "Not happening"],
      ["mode=compound", "Two events"],
      ["mode=space", "All the outcomes"],
      ["mode=expected", "Expected & experiments"]
    ],
    "counting.html": [
      ["mode=principle", "Multiply the choices"],
      ["mode=perm", "Order matters (nPr)"],
      ["mode=comb", "Choosing groups (nCr)"],
      ["mode=pairs", "Handshakes & diagonals"],
      ["mode=fact", "Factorials & chance"]
    ],
    "trigonometry.html": [
      ["mode=right", "Right triangles"],
      ["mode=special", "Special angles"],
      ["mode=circle", "Unit circle"],
      ["mode=laws", "Sines & cosines laws"],
      ["mode=graph", "Graphs"],
      ["mode=identities", "Identities"]
    ],
    "calculus.html": [
      ["mode=limit", "Limits"],
      ["mode=derivative", "Derivatives"],
      ["mode=tangent", "Tangent lines"],
      ["mode=extrema", "Max & min"],
      ["mode=integral", "Integrals"],
      ["mode=rate", "Rates of change"]
    ],
    "college-statistics.html": [
      ["mode=z", "z-scores"],
      ["mode=normal", "Normal"],
      ["mode=binom", "Binomial"],
      ["mode=sampling", "Sampling (CLT)"],
      ["mode=ci", "Confidence intervals"],
      ["mode=test", "Hypothesis tests"],
      ["mode=regress", "Regression"]
    ],
    "matrices-and-vectors.html": [
      ["mode=arith", "Add & scale"],
      ["mode=mult", "Multiply"],
      ["mode=det", "Determinant"],
      ["mode=inv", "Inverse"],
      ["mode=sys", "Solve a system"],
      ["mode=vec", "Vectors"],
      ["mode=dot", "Dot & cross"]
    ]
  };
  var TOOLS = [
    { href: "worksheet.html", name: "Worksheets", title: "The Worksheet Maker" },
    { href: "practice.html", name: "Practice", title: "Practice sets" },
    { href: "flashcards.html", name: "Flash cards", title: "The Flash Cards: times tables and other facts" },
    { href: "daily.html", name: "Daily", title: "Problem of the day" },
    { href: "progress.html", name: "Progress", title: "Your progress" },
    { href: "skills.html", name: "Skill map", title: "Your skill map: the Common Core standards you've practiced, and what's next" },
    { href: "review.html", name: "Review", title: "Your review: the problems you missed, back again 1, 3, 7 and 14 days later" },
    { href: "results.html", name: "Results", title: "Class results: a teacher's view of a practice set" },
    { href: "reference.html", name: "Reference", title: "Reference sheets to print" },
    { href: "glossary.html", name: "Definitions", title: "The Word List: what the math words mean" },
    { href: "learn/", name: "Lessons", title: "Step-by-step lessons: how to do each kind of problem" },
    { href: "standards.html", name: "Standards", title: "Common Core standards matched to the helpers (unofficial)" },
    { href: "help.html", name: "Help", title: "How to use the site, what each helper reads, and what's not done yet" }
  ];
  /* "Math at work": ONE entry in the bar (a button) that opens a small menu of the work-math pages, each with links
     straight to its tabs (page.html?mode=…). To add a field (nursing doses, carpentry, electrical …), add a group here:
     href = its short name, path = where it lives (used only until site.js knows the page), c = its --nv- color. */
  var WORK = [{
    href: "aviation.html",
    path: "helpers/aviation.html",
    sign: "✈",
    name: "Aviation",
    title: "The Flight Computer",
    c: "avi",
    tabs: [
      ["wind", "Wind triangle", "heading and ground speed"],
      ["runway", "Runway winds", "crosswind and headwind"],
      ["trip", "Time, speed & fuel", ""],
      ["altitude", "Altitude & airspeed", "pressure, density, TAS"],
      ["headings", "Headings", "true, magnetic, compass"],
      ["descent", "Descent", "top of descent, fpm"],
      ["weight", "Weight & balance", "moments and CG"],
      ["turns", "Turns & glide", ""],
      ["units", "Units", "kt, nm, inHg, gal ↔ lb"],
      ["metar", "Weather", "METAR, TAF, flight category"],
      ["windsaloft", "Winds aloft", "FB forecast, wind at altitude"]
    ]
  }, {
    href: "nursing.html",
    path: "helpers/nursing.html",
    sign: "✚",
    name: "Nursing",
    title: "The Dose Calculator",
    c: "nur",
    tabs: [
      ["weight", "Dose by weight", "mg/kg, mcg/kg/min"],
      ["dose", "Tablets & liquids", "D/H × Q"],
      ["rate", "IV rate", "mL/hr"],
      ["drip", "Drip rate", "gtt/min"],
      ["time", "Infusion time", "when it ends"],
      ["conc", "Concentrations", "%, 1:1000, dilutions"],
      ["units", "Units", "insulin, heparin"],
      ["convert", "Conversions", "mcg, mL, lb, °F"],
      ["bsa", "Body surface area", "dose per m²"]
    ]
  }, {
    href: "pharmacy.html",
    path: "helpers/pharmacy.html",
    sign: "℞",
    name: "Pharmacy",
    title: "The Pill Counter",
    c: "pha",
    tabs: [
      ["sig", "Reading a sig", "BID, TID, q8h, PRN"],
      ["days", "Days’ supply", "tablets, mL, puffs, units"],
      ["qty", "Quantity to dispense", "round up, packages"],
      ["allig", "Alligation", "mix two strengths"],
      ["conc", "Concentrations", "% w/v, 1:1000, C1V1"],
      ["comp", "Compounding", "scale a formula, qs"],
      ["convert", "Conversions", "tsp, mL, lb, Roman"],
      ["biz", "Business math", "markup, AWP, profit"],
      ["temp", "Temperature & storage", "°F ↔ °C, 2–8 °C"]
    ]
  }, {
    href: "carpentry.html",
    path: "helpers/carpentry.html",
    sign: "∟",
    name: "Carpentry",
    title: "The Framing Square",
    c: "crp",
    tabs: [
      ["tape", "Tape measure", "feet, inches, 16ths"],
      ["lumber", "Board feet", "lumber and cost"],
      ["stairs", "Stairs", "risers, treads, stringer"],
      ["roof", "Roof & rafters", "pitch, angle, length"],
      ["square", "Squaring", "3-4-5 and diagonals"],
      ["spacing", "Even spacing", "studs, joists, balusters"],
      ["area", "Area & materials", "tile, sheets, paint"],
      ["concrete", "Concrete", "yards and bags"],
      ["angles", "Angles & miters", "frames, corners, slope"]
    ]
  }, {
    href: "electrical.html",
    path: "helpers/electrical.html",
    sign: "⚡",
    name: "Electrical",
    title: "The Circuit Board",
    c: "ele",
    tabs: [
      ["ohm", "Ohm’s law", "V, I or R, with prefixes"],
      ["power", "Power", "VI, I²R, V²/R; kW, hp"],
      ["resistors", "Series & parallel", "resistor networks"],
      ["drop", "Voltage drop", "AWG table, 3%"],
      ["load", "Loads & breakers", "the 80% rule"],
      ["energy", "Energy cost", "kWh to dollars"],
      ["color", "Color code", "4- and 5-band"],
      ["rc", "Capacitors & RC", "time constant"],
      ["ac", "AC & three-phase", "RMS, Hz, √3·V·I·pf"]
    ]
  }, {
    href: "hvac-plumbing.html",
    path: "helpers/hvac-plumbing.html",
    sign: "❄",
    name: "HVAC & plumbing",
    title: "The Pipe Wrench",
    c: "hvp",
    tabs: [
      ["heat", "Heat units", "BTU/hr, watts, tons, therms"],
      ["air", "Airflow", "1.08 × CFM × ΔT, air changes"],
      ["duct", "Ducts", "velocity and duct size"],
      ["loss", "Heat loss", "U × A × ΔT, R-values"],
      ["pipe", "Pipe & tank volume", "gallons and pounds"],
      ["flow", "Flow & fill time", "gpm, time to fill"],
      ["pressure", "Water pressure", "feet of head ↔ psi"],
      ["drain", "Drain slope", "fall, 1/4\" per foot, %"],
      ["heater", "Water heater", "BTU, time, recovery"]
    ]
  }, {
    href: "machining.html",
    path: "helpers/machining.html",
    sign: "⌀",
    name: "Machining",
    title: "The Machine Shop",
    c: "mch",
    tabs: [
      ["rpm", "Spindle speed", "RPM from SFM"],
      ["feed", "Feed rate", "IPM, chip load"],
      ["thread", "Threads", "tap drills, TPI"],
      ["taper", "Tapers", "per foot, angle, offset"],
      ["bolt", "Bolt circles", "hole x, y"],
      ["sine", "Sine bar", "gauge block height"],
      ["weight", "Metal weight", "plate, bar, tube"],
      ["weld", "Welding", "heat input, fillets, filler"],
      ["fit", "Tolerances & fits", "limits, clearance"]
    ]
  }, {
    href: "automotive.html",
    path: "helpers/automotive.html",
    sign: "⚙",
    name: "Auto shop",
    title: "The Gear Box",
    c: "aut",
    tabs: [
      ["gear", "Gear ratios", "teeth, final drive, rpm out"],
      ["speed", "Speed ↔ RPM", "gears, tire, mph"],
      ["tire", "Tire size", "P225/60R16, speedometer"],
      ["disp", "Displacement", "bore, stroke, liters"],
      ["comp", "Compression", "swept and clearance cc"],
      ["power", "HP & torque", "lb-ft × rpm ÷ 5,252"],
      ["fuel", "Fuel & trip", "mpg, L/100 km, trip cost"],
      ["mix", "Mixtures", "50:1 oil, coolant %"],
      ["shop", "Shop money", "labor, markup, tax"]
    ]
  }, {
    href: "cooking.html",
    path: "helpers/cooking.html",
    sign: "♨",
    name: "Cooking",
    title: "The Recipe Card",
    c: "rcp",
    tabs: [
      ["scale", "Scale a recipe", "servings, double, a list"],
      ["volume", "Cups & spoons", "tsp, tbsp, cups, mL"],
      ["weight", "Grams ↔ cups", "flour, sugar, butter …"],
      ["bakers", "Baker’s %", "hydration, dough weight"],
      ["cost", "Cost", "per serving, food cost %"],
      ["oven", "Oven temps", "°F, °C, gas mark"],
      ["time", "Cooking time", "minutes per pound"],
      ["pans", "Pan sizes", "round, square, 9 × 13"],
      ["ratios", "Ratios & brines", "brine, rice, coffee, 3:1"]
    ]
  }, {
    href: "business.html",
    path: "helpers/business.html",
    sign: "¤",
    name: "Business",
    title: "The Cash Register",
    c: "biz",
    tabs: [
      ["markup", "Markup & margin", "and why they differ"],
      ["discount", "Discounts", "stacked, % off, original price"],
      ["till", "Change & the till", "fewest bills, over/short"],
      ["tax", "Sales tax", "receipts, tax included"],
      ["payroll", "Payroll", "time cards, overtime, commission"],
      ["breakeven", "Break-even", "units and sales"],
      ["pl", "Profit & loss", "gross and net margin"],
      ["inventory", "Inventory", "turnover, reorder point"],
      ["unit", "Unit price", "best buy, bulk deals"]
    ]
  }, {
    href: "real-estate.html",
    path: "helpers/real-estate.html",
    sign: "⌂",
    name: "Real estate",
    title: "The Floor Plan",
    c: "rea",
    tabs: [
      ["sqft", "Square footage", "rooms, L-shapes, $ per sq ft"],
      ["land", "Acreage & land", "acres, lots, front feet"],
      ["commission", "Commission", "splits and tiers"],
      ["net", "Seller’s net", "costs, payoff, price to net"],
      ["mortgage", "Mortgage", "P&I, PITI, LTV, afford"],
      ["tax", "Property tax", "mills, %, exemptions"],
      ["prorate", "Prorations", "365 and 360-day"],
      ["invest", "Investment", "cap rate, GRM, cash on cash"],
      ["value", "Appreciation", "growth, % change, depreciation"]
    ]
  }];

  var LIGHT = "--nv-add:#0D7361;--nv-sub:#A8412A;--nv-mul:#544696;--nv-div:#A85A0C;--nv-ord:#1F5E8C;--nv-alg:#9B2F6B;--nv-geo:#4F6A17;" +
    "--nv-fra:#0B6E83;--nv-pct:#8A6D00;--nv-fac:#7B3FA0;--nv-int:#46596E;--nv-rat:#B0263E;--nv-lin:#1E7A3C;--nv-sta:#3346A8;--nv-wrd:#0F766E;--nv-gra:#0369A1;--nv-exp:#BE185D;--nv-pro:#A21CAF;--nv-scr:#B45309;--nv-tri:#4D7C0F;--nv-cal:#7C3AED;--nv-num:#EA580C;--nv-qua:#B91C1C;--nv-log:#1D4ED8;--nv-seq:#15803D;--nv-fun:#0E7490;--nv-rad:#92400E;--nv-cpx:#4F46E5;--nv-bel:#047857;--nv-mat:#57534E;--nv-uni:#BE123C;--nv-mon:#A16207;--nv-avi:#0B5CAD;--nv-nur:#6E3D64;--nv-crp:#694321;--nv-ele:#611E05;--nv-rcp:#67311E;--nv-cnt:#6B5A2B;--nv-pha:#5E62B5;--nv-hvp:#134E4E;--nv-mch:#38543B;--nv-aut:#7E0135;--nv-biz:#8F538C;--nv-rea:#454A0D;";
  var DARK = "--nv-add:#4FCCB0;--nv-sub:#F08A6E;--nv-mul:#A99CF0;--nv-div:#F2A85C;--nv-ord:#7DB8E8;--nv-alg:#F08CC0;--nv-geo:#B5D06A;" +
    "--nv-fra:#5FC9DE;--nv-pct:#E3C04D;--nv-fac:#C9A0EE;--nv-int:#A9BDD2;--nv-rat:#F27D8F;--nv-lin:#6FD38E;--nv-sta:#93A2F2;--nv-wrd:#5EEAD4;--nv-gra:#7DD3FC;--nv-exp:#FDA4AF;--nv-pro:#F0ABFC;--nv-scr:#FCD34D;--nv-tri:#BEF264;--nv-cal:#C4B5FD;--nv-num:#FDBA74;--nv-qua:#FCA5A5;--nv-log:#93C5FD;--nv-seq:#86EFAC;--nv-fun:#67E8F9;--nv-rad:#FBBF24;--nv-cpx:#A5B4FC;--nv-bel:#6EE7B7;--nv-mat:#D6D3D1;--nv-uni:#FDA4AF;--nv-mon:#FDE047;--nv-avi:#8CC4F5;--nv-nur:#FAC8F0;--nv-crp:#CDA383;--nv-ele:#F9C4A0;--nv-rcp:#E4BDAF;--nv-cnt:#EED9A0;--nv-pha:#CCCFFF;--nv-hvp:#A6D9D4;--nv-mch:#9FB79A;--nv-aut:#BEA5AA;--nv-biz:#C79FC3;--nv-rea:#B3B47C;";
  var CSS =
    ":root{" + LIGHT + "}" +
    "@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){" + DARK + "}}" +
    ":root[data-theme=\"dark\"]{" + DARK + "}" +
    ".sitenav{display:flex;align-items:center;gap:8px 14px;flex-wrap:wrap;padding-bottom:14px;margin-bottom:-6px;" +
    "border-bottom:1px solid var(--rule);font-family:var(--f-body,\"IBM Plex Sans\",\"Segoe UI\",Helvetica,Arial,sans-serif)}" +
    ".sitenav a{text-decoration:none;color:var(--ink-2);border-radius:999px;white-space:nowrap}" +
    ".sitenav .sn-home{font-size:13.5px;font-weight:600;color:var(--ink);background:var(--surface);" +
    "border:1px solid var(--rule);padding:6px 14px 6px 11px;display:inline-flex;align-items:center;gap:6px}" +
    ".sitenav .sn-home:hover{border-color:var(--ink-3)}" +
    ".sitenav .sn-home span{font-size:15px;line-height:1}" +
    ".sitenav .sn-links{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}" +
    ".sitenav .sn-links a{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:500;" +
    "padding:5px 11px;border:1px solid transparent}" +
    ".sitenav .sn-links a b{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-weight:600;" +
    "font-size:14px;color:var(--nv);line-height:1}" +
    ".sitenav .sn-links a b.it{font-style:italic;font-family:Georgia,\"Times New Roman\",serif;font-size:15px}" +
    ".sitenav .sn-links a:hover{color:var(--ink);border-color:var(--rule);background:var(--surface)}" +
    ".sitenav .sn-links a[aria-current=\"page\"]{color:var(--ink);font-weight:600;background:var(--surface);" +
    "border-color:var(--nv);box-shadow:inset 0 0 0 1px var(--nv)}" +
    ".sitenav .sn-tools{display:flex;gap:4px 12px;flex-wrap:wrap;margin:0 0 0 auto;padding:0;list-style:none;font-size:13px}" +
    ".sitenav .sn-tools a{padding:5px 2px;color:var(--ink-3);font-weight:600}" +
    ".sitenav .sn-tools a:hover{color:var(--ink);text-decoration:underline}" +
    ".sitenav .sn-tools a[aria-current=\"page\"]{color:var(--ink)}" +
    ".sitenav a:focus-visible{outline:2.5px solid var(--focus,var(--ink));outline-offset:2px}" +
    // Math at work: the button and its menu
    ".sitenav .sn-work{position:relative}" +
    ".sitenav .sn-wbtn{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:13px;font-weight:500;color:var(--ink-2);" +
    "background:none;padding:5px 11px;border:1px solid transparent;border-radius:999px;cursor:pointer;white-space:nowrap}" +
    ".sitenav .sn-wbtn b{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-weight:600;font-size:14px;color:var(--nv);line-height:1}" +
    ".sitenav .sn-wbtn .sn-caret{font-size:10px;color:var(--ink-3)}" +
    ".sitenav .sn-wbtn:hover,.sitenav .sn-wbtn[aria-expanded=\"true\"]{color:var(--ink);border-color:var(--rule);background:var(--surface)}" +
    ".sitenav .sn-wbtn.on{color:var(--ink);font-weight:600;background:var(--surface);border-color:var(--nv);box-shadow:inset 0 0 0 1px var(--nv)}" +
    ".sitenav .sn-wbtn:focus-visible{outline:2.5px solid var(--focus,var(--ink));outline-offset:2px}" +
    ".sitenav .sn-wmenu{position:absolute;z-index:80;top:calc(100% + 6px);left:0;width:270px;max-width:calc(100vw - 24px);background:var(--surface);" +
    "color:var(--ink);border:1px solid var(--rule);border-radius:12px;box-shadow:0 18px 36px -18px rgba(0,0,0,.55);padding:6px}" +
    ".sitenav .sn-wgrp + .sn-wgrp{border-top:1px solid var(--rule);margin-top:4px;padding-top:4px}" +
    ".sitenav .sn-wmenu ul{list-style:none;margin:0;padding:0}" +
    ".sitenav .sn-wmenu a{display:block;padding:6px 10px;border-radius:8px;font-size:13.5px;color:var(--ink);white-space:normal}" +
    ".sitenav .sn-wmenu a:hover{background:var(--surface-2)}" +
    ".sitenav .sn-wmenu a small{color:var(--ink-3);font-size:12px;margin-left:4px}" +
    ".sitenav .sn-wmenu a.sn-wh{font-weight:600;padding-top:8px}" +
    ".sitenav .sn-wmenu a.sn-wh b{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);color:var(--nv);margin-right:6px}" +
    ".sitenav .sn-wmenu ul a{padding-left:30px}" +
    // a section's panel: its helpers side by side, each with its tabs under it; scrolls when taller than the screen
    ".sitenav .sn-wmenu{max-height:calc(100vh - 120px);overflow:auto;overscroll-behavior:contain}" +
    ".sitenav .sn-wmenu.sn-wide{width:740px;display:grid;grid-template-columns:repeat(auto-fill,minmax(205px,1fr));gap:2px 8px;padding:8px}" +
    ".sitenav .sn-wmenu.sn-wide[hidden]{display:none}" +
    ".sitenav .sn-wide .sn-wgrp + .sn-wgrp{border-top:0;margin-top:0;padding-top:0}" +
    ".sitenav .sn-wide .sn-wgrp{padding-bottom:6px}" +
    ".sitenav .sn-wide ul a{padding-top:4px;padding-bottom:4px;font-size:13px}" +
    // Math at work with several fields: a grid of fields that wraps (four across on a laptop, one on a phone), each with its
    // page's name on a line of its own; a tab's hint is its tooltip, so eleven fields stay as compact as a section's panel
    ".sitenav .sn-wmenu.sn-wwork{width:940px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 8px}" +
    ".sitenav .sn-wwork .sn-wgrp{padding-bottom:10px}" +
    ".sitenav .sn-wwork a.sn-wh small{display:block;margin:2px 0 0;font-weight:400}" +
    ".sitenav .sn-wwork ul a small{display:none}" +
    ".sitenav .sn-wmenu a[aria-current=\"page\"]{background:var(--surface-2);box-shadow:inset 3px 0 0 var(--nv)}" +
    ".sitenav .sn-wbtn b.it{font-style:italic;font-family:Georgia,\"Times New Roman\",serif;font-size:15px}" +
    ".sitenav .sn-wmenu a b.it{font-style:italic;font-family:Georgia,\"Times New Roman\",serif}" +
    "@media (max-width:560px){.sitenav .sn-links a{padding:5px 9px;font-size:12.5px}.sitenav .sn-tools{margin-left:0}.sitenav .sn-wbtn{padding:5px 9px;font-size:12.5px}" +
    // phones: one column, the page's name beside its field
    ".sitenav .sn-wmenu.sn-wwork{grid-template-columns:1fr}.sitenav .sn-wwork a.sn-wh small{display:inline;margin:0 0 0 4px}}" +
    // each helper's #statusLine is for screen readers only: the same message is already on screen
    "#statusLine{position:absolute !important;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}" +
    "@media print{.sitenav{display:none !important}}";

  // where a page or file lives (site.js); without it, a name is taken as a file in the same folder
  function U(name) { return window.HelperSite ? window.HelperSite.url(name) : name; }

  function loaded(file) { return !!document.querySelector('script[src$="' + file + '"], script[src*="' + file + '?"]'); }

  // inside a practice set: the page marks itself, because by now it may already have rewritten its address
  function embedded() { return /[?&]embed=1(&|$)/.test(location.search) || document.documentElement.classList.contains("embed"); }

  /* installable and offline: the app manifest, its icons, and the service worker that saves the pages */
  function appBits() {
    var head = document.head;
    if (!head.querySelector('link[rel="manifest"]')) {
      var m = document.createElement("link");
      m.rel = "manifest";
      m.href = U("manifest.webmanifest");
      head.appendChild(m);
    }
    if (!head.querySelector('link[rel="apple-touch-icon"]')) {
      var a = document.createElement("link");
      a.rel = "apple-touch-icon";
      a.href = U("icons/apple-touch-icon.png");
      head.appendChild(a);
    }
    if (!head.querySelector('link[rel="icon"]')) {
      var f = document.createElement("link");
      f.rel = "icon";
      f.type = "image/svg+xml";
      f.href = U("icons/favicon.svg");
      head.appendChild(f);
    }
    if (!head.querySelector('meta[name="theme-color"]')) {
      var t = document.createElement("meta");
      t.name = "theme-color";
      t.content = "#19211D";
      head.appendChild(t);
    }
    // the definitions popups: jargon in the explanations links to the Word List
    if (!window.HelperGlossary && !loaded("glossary.js")) {
      var g = document.createElement("script");
      g.src = U("glossary.js");
      g.defer = true;
      head.appendChild(g);
    }
    // the search box, settings that follow you, read aloud, recent problems, shortcuts, next problem
    ["search.js", "tools.js"].forEach(function(src) {
      if (loaded(src)) return;
      var sc = document.createElement("script");
      sc.src = U(src);
      sc.async = false;
      head.appendChild(sc);
    });
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener("load", function() { navigator.serviceWorker.register(U("sw.js")).catch(function() {}); });
    }
    countVisit();
  }

  /* Counting visits with GoatCounter (no cookies, no personal data). Only real visits count: not a page
     shown inside another one (worksheet problems, practice sets, the self-test), not the self-test page,
     and not local testing. Each page is counted by its name, without the problem in the address. */
  function countVisit() {
    var framed = true;
    try { framed = window.top !== window.self; } catch (e) {}
    var page = ((window.HelperSite && window.HelperSite.here) || location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (framed || embedded() || page === "tests.html" || !/^https?:$/.test(location.protocol) ||
      /^(localhost|127\.[0-9.]+|\[::1\])$/.test(location.hostname)) return;
    if (document.querySelector('script[data-goatcounter]')) return;
    window.goatcounter = window.goatcounter || {};
    window.goatcounter.path = function() { return location.pathname; };
    var gc = document.createElement("script");
    gc.async = true;
    gc.src = "https://gc.zgo.at/count.js";
    gc.setAttribute("data-goatcounter", "https://fennell.goatcounter.com/count");
    document.head.appendChild(gc);
  }

  function build() {
    if (embedded()) return; // a page shown inside a practice set gets no bar
    var page = document.querySelector(".page");
    if (!page || document.querySelector(".sitenav")) return;
    var here = ((window.HelperSite && window.HelperSite.here) || location.pathname.split("/").pop() || "index.html").toLowerCase();

    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var nav = document.createElement("nav");
    nav.className = "sitenav";
    nav.setAttribute("aria-label", "All the helpers");
    var html = '<a class="sn-home" href="' + U("index.html") + '"><span aria-hidden="true">←</span> All helpers</a><ul class="sn-links">';
    SECTIONS.forEach(function(s, i) { html += sectionItem(s, i, here); });
    html += workItem(here);
    html += '</ul><ul class="sn-tools" aria-label="Tools">';
    TOOLS.forEach(function(p) {
      html += '<li><a href="' + U(p.href) + '" title="' + p.title + '"' + (p.href === here ? ' aria-current="page"' : "") + ">" + p.name + "</a></li>";
    });
    nav.innerHTML = html + "</ul>";
    page.insertBefore(nav, page.firstChild);
    try { menus(nav); } catch (e) {}
  }

  /* ---- a section of helpers: a button in the bar, a panel of its helpers and their tabs ---- */
  // a page's address with a query, through site.js
  function UQ(name, query) { return window.HelperSite ? window.HelperSite.url(name, query) : name + "?" + query; }

  function sectionItem(s, i, here) {
    var by = {};
    PAGES.forEach(function(p) { by[p.href] = p; });
    var on = s.pages.indexOf(here) >= 0,
      id = "snSec" + i;
    var h = '<li class="sn-work"><button type="button" class="sn-wbtn' + (on ? " on" : "") + '" aria-expanded="false" aria-controls="' + id + '"' +
      ' title="' + s.title + '" style="--nv:var(--nv-' + s.c + ')"><b' + (s.italic ? ' class="it"' : "") + ' aria-hidden="true">' + s.sign + "</b>" +
      s.name + '<span class="sn-caret" aria-hidden="true">▾</span></button>' +
      '<div class="sn-wmenu sn-wide" id="' + id + '" hidden>';
    s.pages.forEach(function(href) {
      var p = by[href];
      if (!p) return;
      h += '<div class="sn-wgrp" style="--nv:var(--nv-' + p.c + ')"><a class="sn-wh" href="' + U(href) + '" title="' + p.title + '"' +
        (href === here ? ' aria-current="page"' : "") + '><b' + (p.italic ? ' class="it"' : "") + ' aria-hidden="true">' + p.sign + "</b>" +
        (FULL[href] || p.name) + "</a>";
      var tabs = TABS[href] || [];
      if (tabs.length) {
        h += "<ul>";
        tabs.forEach(function(t) { h += '<li><a href="' + UQ(href, t[0]) + '">' + t[1] + "</a></li>"; });
        h += "</ul>";
      }
      h += "</div>";
    });
    return h + "</div></li>";
  }

  /* ---- Math at work: one button in the bar, a menu of pages and their tabs ---- */
  // a work page's address: through site.js when it knows the page, else from its folder (until site.js lists it)
  function WU(g, params) {
    var HS = window.HelperSite;
    if (HS && HS.id && HS.id(g.href)) return HS.url(g.href, params);
    if (HS && HS.root) return HS.root + g.path + (params ? "?" + params : "");
    return g.href + (params ? "?" + params : "");
  }

  function workIsHere(g, here) {
    if (g.href === here) return true;
    var base = g.path.replace(/\.html$/, "");
    return new RegExp("/" + base.replace(/[.\/]/g, "\\$&") + "(?:\\.html)?$", "i").test(location.pathname);
  }

  function workItem(here) {
    if (!WORK.length) return "";
    var on = WORK.some(function(g) { return workIsHere(g, here); }),
      one = WORK.length === 1;
    var h = '<li class="sn-work"><button type="button" class="sn-wbtn' + (on ? " on" : "") + '" aria-expanded="false" aria-controls="snWorkMenu"' +
      ' title="Math at work: ' + WORK.map(function(g) { return g.name.toLowerCase(); }).join(", ") + '" style="--nv:var(--nv-' + WORK[0].c + ')"><b aria-hidden="true">'
      // named for its one field while there is just one ("✈ Aviation"); "Math at work" once there are more
      +
      (one ? WORK[0].sign : "⚒") + "</b>" + (one ? WORK[0].name : "Math at work") + '<span class="sn-caret" aria-hidden="true">▾</span></button>' +
      // one field: a small list; more: a panel like the sections', one field per column
      '<div class="sn-wmenu' + (one ? "" : " sn-wide sn-wwork") + '" id="snWorkMenu" hidden>';
    WORK.forEach(function(g) {
      var cur = workIsHere(g, here);
      h += '<div class="sn-wgrp" style="--nv:var(--nv-' + g.c + ')"><a class="sn-wh" href="' + WU(g) + '"' + (cur ? ' aria-current="page"' : "") + '><b aria-hidden="true">' +
        g.sign + "</b>" + g.name + " <small>" + g.title + "</small></a><ul>";
      g.tabs.forEach(function(t) {
        h += '<li><a href="' + WU(g, "mode=" + t[0]) + '"' + (t[2] && !one ? ' title="' + (t[1] + ": " + t[2]).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"' : "") + ">" + t[1] + (t[2] ? " <small>" + t[2] + "</small>" : "") + "</a></li>";
      });
      h += "</ul></div>";
    });
    return h + "</div></li>";
  }

  // every button in the bar with a menu (the sections, and Math at work); opening one closes the others
  function menus(nav) {
    var closers = [],
      escs = [];
    [].forEach.call(nav.querySelectorAll(".sn-work"), function(box) { menu1(box, closers, escs); });
    // Escape anywhere closes the open menu and goes back to its button: Safari doesn't focus a button when it's clicked,
    // so after a mouse click the button's and the menu's own Escape handlers never hear the key
    document.addEventListener("keydown", function(e) {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      escs.forEach(function(esc) { if (esc()) e.preventDefault(); });
    });
  }

  function menu1(box, closers, escs) {
    var btn = box.querySelector(".sn-wbtn"),
      menu = box.querySelector(".sn-wmenu");
    if (!btn || !menu) return;
    closers.push(function() { close(false); });
    escs.push(function() { // true when it was open
      if (menu.hidden) return false;
      close(true);
      return true;
    });

    function links() { return [].slice.call(menu.querySelectorAll("a")); }

    function place() { // keep the menu on the screen (phones)
      menu.style.left = "0px";
      var r = menu.getBoundingClientRect(),
        vw = document.documentElement.clientWidth,
        x = 0;
      if (r.right > vw - 8) x = vw - 8 - r.right;
      if (r.left + x < 8) x = 8 - r.left;
      menu.style.left = x + "px";
      // no taller than the screen below it (it scrolls inside)
      menu.style.maxHeight = Math.max(240, window.innerHeight - Math.max(0, r.top) - 12) + "px";
    }

    function open(focus) {
      closers.forEach(function(c) { c(); });
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      place();
      var l = links();
      if (focus && l.length) l[focus === "last" ? l.length - 1 : 0].focus();
    }

    function close(back) {
      if (menu.hidden) return;
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (back) btn.focus();
    }
    btn.addEventListener("click", function() {
      if (menu.hidden) open(false);
      else close(false);
    });
    btn.addEventListener("keydown", function(e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        open("first");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        open("last");
      } else if (e.key === "Escape" && !menu.hidden) {
        e.preventDefault();
        e.stopPropagation();
        close(true);
      }
    });
    menu.addEventListener("keydown", function(e) {
      var l = links(),
        i = l.indexOf(document.activeElement);
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        close(true);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        l[(i + 1) % l.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        l[(i - 1 + l.length) % l.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        l[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        l[l.length - 1].focus();
      }
    });
    document.addEventListener("click", function(e) { if (!menu.hidden && !box.contains(e.target)) close(false); });
    box.addEventListener("focusout", function(e) { if (e.relatedTarget && !box.contains(e.relatedTarget)) close(false); });
    window.addEventListener("resize", function() { if (!menu.hidden) place(); });
  }

  appBits();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
