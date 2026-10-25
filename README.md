<p align="center">
  <a href="https://showthesteps.org/"><img src="assets/icons/icon-192.png" width="96" height="96" alt="Show The Steps icon: the four operation signs on colored tiles"></a>
</p>

<h1 align="center">Show The Steps</h1>

<p align="center">
  Type in a math problem and see every step written out, the way it's done on paper, with the reason for each move.
</p>

<p align="center">
  <a href="https://showthesteps.org/"><strong>Open the site &rarr;</strong></a>
</p>

<p align="center">
  <a href="https://showthesteps.org/"><img src="https://img.shields.io/badge/live%20site-showthesteps.org-2f6f5e" alt="Live site"></a>
  <a href="https://github.com/chrisdfennell/showthesteps/releases"><img src="https://img.shields.io/github/v/release/chrisdfennell/showthesteps?label=version" alt="Latest version"></a>
  <a href="https://github.com/chrisdfennell/showthesteps/actions/workflows/release.yml"><img src="https://github.com/chrisdfennell/showthesteps/actions/workflows/release.yml/badge.svg" alt="Release and deploy workflow status"></a>
  <a href="https://github.com/chrisdfennell/showthesteps/actions/workflows/test.yml"><img src="https://github.com/chrisdfennell/showthesteps/actions/workflows/test.yml/badge.svg" alt="Self-test workflow status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-CC%20BY--NC%204.0-lightgrey" alt="License: CC BY-NC 4.0"></a>
  <br>
  <a href="#how-its-built"><img src="https://img.shields.io/badge/build%20step-none-brightgreen" alt="No build step"></a>
  <a href="#install-it-as-an-app"><img src="https://img.shields.io/badge/works%20offline-installable-5a4fcf" alt="Works offline and installs as an app"></a>
  <a href="#how-its-built"><img src="https://img.shields.io/badge/vanilla%20JS-ES5-f0db4f" alt="Vanilla JavaScript (ES5)"></a>
  <a href="https://showthesteps.org/tests/self-test"><img src="https://img.shields.io/badge/self--test-22%2C000%2B%20checks-success" alt="Self-test: more than 22,000 checks"></a>
  <a href="https://github.com/chrisdfennell/showthesteps/commits/main"><img src="https://img.shields.io/github/last-commit/chrisdfennell/showthesteps" alt="Last commit"></a>
</p>

<p align="center">
  <img src="docs/order-stack-steps.gif" width="800" alt="The Order Stack working 2 × (3 + 5)² − 18 ÷ 3 one step at a time: parentheses, then the exponent, multiply, divide and subtract, with the reason for each step and an expression tree filling in, ending at 122">
</p>

---

## Contents

- [What it is and who it's for](#what-it-is-and-who-its-for)
- [The helpers](#the-helpers)
- [For students](#for-students)
- [For teachers](#for-teachers)
- [Features on every page](#features-on-every-page)
- [Links to a problem](#links-to-a-problem)
- [Install it as an app](#install-it-as-an-app)
- [Testing](#testing)
- [How it's built](#how-its-built)
- [By the numbers](#by-the-numbers)
- [Versioning and releases](#versioning-and-releases)
- [Privacy](#privacy)
- [License](#license)

## What it is and who it's for

Show The Steps is a free website for math from the early grades through first-year college. **Twenty helper pages**, from carrying in addition to derivatives, work through a problem step by step the way it's done on paper; **the Scratch Paper** lets students do the working by hand, line by line or on squared paper; and there are tools for practice and for the classroom. Each step comes with a plain-English reason, including why it comes next, and a picture of the problem.

| Level | What's here |
| --- | --- |
| **Early grades (K–5)** | Place value, rounding and estimating, comparing numbers, skip counting, telling time, measurement and unit conversions, counting money, addition and subtraction facts, carrying and borrowing, times tables to 20 × 20, long division, hundred charts, flash cards |
| **Middle school (6–8)** | Fractions, decimals and percents, ratios and rates, negative numbers, order of operations, exponents, equations, geometry, statistics, probability, story problems |
| **High school (9–12)** | Money math (compound interest, loans and payments, budgets), algebra and systems, lines, graphing functions, transformations, inequalities, functions (domain and range, composition, inverses, piecewise), quadratics and polynomials (factoring, the quadratic formula, completing the square, the vertex, polynomial division), radicals and rational expressions, complex numbers, logarithms and exponential equations, sequences and series, trigonometry (the unit circle, the laws of sines and cosines, sine and cosine graphs) |
| **First-year college** | Calculus basics: limits, derivatives with every rule named, tangent lines, maximum and minimum, integrals and the area under a curve; statistics (the normal curve, z-scores, the binomial, confidence intervals, hypothesis tests, regression); matrices and vectors (determinants, inverses, row reduction, dot and cross products) |

- **Students** type in a problem and see how it's done, step through it one move at a time, or check their own answer and get told what probably went wrong.
- **Teachers** make worksheets with answer keys, share practice sets as one link or QR code, read the class's results, print reference sheets and graph paper, and put any problem on the projector.

There are no accounts and nothing to sign up for: it's plain web pages. It also installs like an app and works offline.

<p align="center">
  <img src="docs/screenshots/home.png" width="900" alt="The home page: Show The Steps in big letters over one search box; x^2 − 5x + 6 = 0 is typed in and the suggestion under it says Show the steps on the Area Box, a quadratic. Example problems and links to browse all topics, worksheets, practice sets and flash cards sit underneath">
</p>

## The helpers

Each helper is one page. Type a problem (or pick one, or have the page make one) and the answer, the work and the reasons appear straight away.

| Page | What it does |
| --- | --- |
| [The Place Value Chart](https://showthesteps.org/helpers/number-sense) | Number sense for the early grades: place value with base-ten blocks, expanded form and number words, rounding on a number line, estimating, comparing and ordering, skip counting and even or odd, telling time and elapsed time, and counting money and making change |
| [The Carry Column](https://showthesteps.org/helpers/addition) | Addition of whole numbers, decimals (2–4 numbers) and fractions, with every carry shown |
| [The Borrow Bank](https://showthesteps.org/helpers/subtraction) | Subtraction with every borrow crossed out and written above |
| [The Product Ladder](https://showthesteps.org/helpers/multiplication) | Multiplication with partial products, then placing the decimal point |
| [The Division House](https://showthesteps.org/helpers/division) | Long division with remainders, fractions or decimals (including repeating) |
| [The Scratch Paper](https://showthesteps.org/helpers/scratch-paper) | Do it by hand: work + − × ÷ yourself on squared paper (carries, borrowing with cross-outs, partial products, long division), checked square by square with a hint for each mistake |
| [The Fraction Bar](https://showthesteps.org/helpers/fractions) | Fractions: simplifying, converting to decimals and percents, comparing and ordering, equivalent fractions |
| [The Hundred Grid](https://showthesteps.org/helpers/percents) | Percents: percent of a number, what percent, finding the whole, percent change, discounts, tax, tips and interest |
| [The Factor Tree](https://showthesteps.org/helpers/factors-and-primes) | Factors and primes: factor pairs, prime factorization, prime or composite, GCF and LCM, divisibility rules |
| [The Number Line](https://showthesteps.org/helpers/negative-numbers) | Integers: adding, subtracting, multiplying and dividing negative numbers, absolute value and ordering |
| [The Ratio Table](https://showthesteps.org/helpers/ratios) | Ratios: simplifying, unit rates and better buys, proportions, sharing in a ratio, and scale |
| [The Measuring Tape](https://showthesteps.org/helpers/unit-conversions) | Unit conversions: inches, feet, yards and miles (and mixed measures like 5 ft 7 in), customary weight and capacity, the metric staircase, converting between systems, time, °F, °C and K, and rates with units canceled (60 mph → 88 ft/s), including area and volume units |
| [The Money Jar](https://showthesteps.org/helpers/money-math) | Money math: compound interest (and APY), saving every month, loan payments with an amortization schedule, credit card interest and payoff, paychecks with overtime, budgets and the 50/30/20 rule, and shopping math (stacked discounts, tax and tip, unit prices, inflation) |
| [The Flight Computer](https://showthesteps.org/helpers/aviation) | Aviation math, the first "Math at work" page: the wind triangle (wind correction angle, true heading, ground speed, drawn to scale), runway crosswind and headwind, time, speed, distance and fuel with reserves, pressure and density altitude, true airspeed, true → magnetic → compass headings, descent planning, weight and balance with a CG check and the CG envelope chart (takeoff and landing points, utility category), standard-rate turns, turn radius, glide distance and aviation units. For learning only, not flight planning. |
| [The Dose Calculator](https://showthesteps.org/helpers/nursing) | Nursing and medication math (Math at work): doses by weight (mg/kg, mg/kg/day divided, mcg/kg/min, pounds to kg) with a maximum or safe-range check, tablets and liquids by D/H × Q (halves only when scored), IV rates in mL/hr from a volume and time or from a dose and the bag, gravity drip rates in gtt/min, infusion time and finish time, concentrations, percent and ratio (1:1000) strengths, dilutions (C1V1 = C2V2) and reconstitution, heparin and insulin units, conversions (metric, household, lb/kg, °F/°C) and body surface area (Mosteller) with dose per m². Every step says why, and which rounding rule it uses. For learning only, not patient care. |
| [The Pill Counter](https://showthesteps.org/helpers/pharmacy) | Pharmacy technician math (Math at work): reading a sig with a table of the common abbreviations (BID, TID, q8h, PRN with a maximum, PO, SL, gtt, OU), days’ supply for tablets, liquids, inhalers, insulin pens and vials and eye drops (20 drops/mL as a stated assumption), the quantity to dispense rounded up to whole units and packages, alligation, concentrations (% w/v, w/w, v/v, mg/mL, ratio strengths like 1:1000) and dilutions (C1V1 = C2V2), scaling a compounding formula (with qs), metric and household conversions and Roman numerals, markup, AWP minus a percent plus a dispensing fee, gross profit and margin, copays, inventory turnover, and °F/°C storage ranges checked against the USP definitions. Every step says why, and which rounding rule it uses. For learning and exam practice only. |
| [The Framing Square](https://showthesteps.org/helpers/carpentry) | Carpentry and construction math (Math at work): feet, inches and fractions on a tape measure kept exact (add, subtract, halve, decimal ↔ nearest 1/16), board feet and lumber cost with nominal and actual sizes, stairs (risers, treads, total run, stringer, checked against typical code), roof pitch ↔ angle and rafter length with overhang, squaring with 3-4-5 and diagonals, studs, joists and balusters evenly spaced, flooring, tile, 4×8 sheets and paint with waste, concrete in cubic yards and bags, and miter, crown and slope angles, each drawn to scale. For learning and planning practice; check local codes and the manufacturer's numbers. |
| [The Circuit Board](https://showthesteps.org/helpers/electrical) | Electrical math (Math at work): Ohm's law with the triangle and unit prefixes, power (P = VI = I²R = V²/R, W ↔ kW ↔ hp), series and parallel resistor networks with exact fractions and each resistor's share, voltage drop from the NEC Table 8 AWG resistances (copper and aluminum, single- and three-phase, against the 3% guideline), circuit loads and the 80% rule, energy cost (kWh to dollars), the resistor color code both ways, capacitors and RC time constants, and AC (peak/RMS, frequency/period, three-phase power). Circuit drawings throughout. For learning and checking coursework only; follow your local electrical code. |
| [The Pipe Wrench](https://showthesteps.org/helpers/hvac-plumbing) | HVAC and plumbing math (Math at work) for trade students: BTU/hr ↔ watts, kW and tons of cooling, therms and kWh; sensible heat 1.08 × CFM × ΔT solved for any one, and air changes per hour; duct velocity (CFM ÷ area) for round and rectangular ducts, the duct size for a target velocity, round ↔ rectangular; heat loss Q = U × A × ΔT with layers' R-values added; gallons in a run of pipe or a tank and the water's weight; fill and drain times, gpm and pipe velocity; water pressure from feet of head (0.433 psi per foot) and up a building; drain fall and slope, inches per foot ↔ percent, with the typical code minimum; and water heater BTU, heat-up time and recovery — each worked step by step and drawn. For learning and trade-school practice; size a real system with a full load calculation (Manual J) and your local code. |
| [The Machine Shop](https://showthesteps.org/helpers/machining) | Machining and welding math (Math at work): spindle speed from SFM (and the 3.82 shortcut) or metric m/min, feed rate and chip load, lathe and drill feed per revolution, tap drills from major − pitch with the nearest fraction, number or letter drill and its % thread, pitch ↔ TPI and metric tap drills, taper per foot and the angle per side and the tailstock offset, bolt circle hole coordinates, sine bar gauge block heights and angles, the weight of plate, bar and tube in six metals (lb and kg), weld heat input, fillet throat ↔ leg and filler metal with deposition efficiency, and limits and fits (clearance, interference, transition). Decimals and fractions kept exact; each tab drawn where it helps. For learning and shop practice; follow the tool maker’s speeds and feeds and your WPS. |
| [The Gear Box](https://showthesteps.org/helpers/automotive) | Auto shop math (Math at work) for mechanics and automotive students: gear ratios from teeth (kept exact, 41/11) and gear × final drive, with output rpm and torque; road speed from engine rpm, gears and the tire (and the rpm at a speed), checked with the 336 shortcut; tire sizes (P225/60R16, 33x12.50R15) to sidewall, diameter and revolutions per mile, and speedometer error after a change; displacement from bore, stroke and cylinders (cubic inches, cc, liters); compression ratio from swept and clearance volumes; horsepower ↔ torque (÷ 5,252) in hp, kW, lb-ft and N·m; mpg, L/100 km and trip fuel cost; 2-stroke oil (50:1) and coolant mixes, drain-and-refill; and shop invoices with labor, parts markup and tax, with drawings to scale. For learning and shop practice; follow the manufacturer's specs. |
| [The Recipe Card](https://showthesteps.org/helpers/cooking) | Kitchen math (Math at work) for cooks, bakers and culinary students: scale a recipe by servings or a factor (a whole ingredient list at once, exact fractions, turned into cups and spoons you can measure), cups, spoons, pints and mL, grams ↔ cups for common ingredients, baker's percentages and hydration, recipe cost, cost per serving and food cost %, oven temperatures (°F, °C, gas mark, convection), cooking time by weight and when to start, pan sizes, and brine, rice, coffee and vinaigrette ratios. For learning and kitchen practice; use a thermometer for doneness. |
| [The Cash Register](https://showthesteps.org/helpers/business) | Retail and small-business math (Math at work) for store workers, managers and business students: markup and margin from cost and price (and why a 40% margin is a 66.67% markup), the price for a target margin, stacked discounts (20% then 10% is 28% off), the original price before a sale, a markup then a markdown, change due with the fewest bills and coins and counting it back, counting a cash drawer and the over/short, sales tax on a receipt with untaxed lines, tax-included prices back to pre-tax, hours from a time card with an unpaid lunch, overtime at time and a half, flat and tiered commission, break-even units and sales, profit and loss with gross and net margin, unit and average cost, inventory turnover and days on hand, reorder points, and unit prices with bulk deals. Money is kept exact and rounded to the cent at the end. For learning; tax rules and labor laws vary by place. |
| [The Floor Plan](https://showthesteps.org/helpers/real-estate) | Real estate math (Math at work) for agents, licensing students and home buyers: square footage from a floor plan (rooms added up, L-shapes minus cut-outs, drawn to scale) and price per square foot, acres ↔ square feet, lots, price per acre and per front foot and the government survey, commission splits and tiers, the seller’s net and the price to net a target, mortgage down payment, LTV, P&I by the standard formula, PITI and how much house a payment buys (full schedules on the Money Jar), property tax as a percent, in mills or per $100 with exemptions, prorations by the 365-day and 360-day year, cap rate, GRM, cash-on-cash and rental yield, and appreciation and depreciation. Money kept exact to the cent. For learning and licensing-exam practice; real loan terms, taxes and closing costs come from your lender, title company and local rules. |
| [The Power Tower](https://showthesteps.org/helpers/exponents) | Exponents: powers (zero, negative, negative bases), the exponent laws with the reason for each, scientific notation both ways, calculating and comparing with it, and square and cube roots |
| [The Order Stack](https://showthesteps.org/helpers/order-of-operations) | Order of operations (PEMDAS) for long problems with + − × ÷, parentheses and exponents |
| [The Balance Scale](https://showthesteps.org/helpers/algebra) | Algebra: simplifying expressions, solving equations and inequalities (compound and absolute value ones too), systems of two equations, and solving a formula for one letter (A = lw for w) |
| [The Slope Grid](https://showthesteps.org/helpers/lines-and-slope) | Lines: slope, the equation of a line, converting forms, graphing, and parallel or perpendicular lines |
| [The Graph Paper](https://showthesteps.org/helpers/graphing) | Graphing: plot and read points (tap the grid), distance, midpoint and area, tables of values, several functions at once with their key features, systems by graphing, inequalities, optimization (linear programming: the best corner of the feasible region, story problems too), transformations, scatter plots with a trend line, and a Free plot sheet of graph paper to draw on; tap or hover any point to see what it is |
| [The Function Machine](https://showthesteps.org/helpers/functions) | Functions: evaluating f(x) (and f(a + 1)), is it a function, domain and range in interval notation, adding and multiplying functions, composition f(g(x)), inverse functions, piecewise functions, and even or odd |
| [The Area Box](https://showthesteps.org/helpers/quadratics) | Quadratics and polynomials: multiplying brackets with the box method (FOIL and the special products named), factoring (GCF, factor pairs, grouping, difference of squares, cubes), solving quadratics by factoring, square roots, completing the square or the formula, the vertex and vertex form, and long and synthetic division |
| [The Root Cellar](https://showthesteps.org/helpers/radicals) | Radicals and rational expressions: simplifying roots (√72 = 6√2), adding and multiplying roots, rationalizing the denominator (with the conjugate), fraction exponents, radical equations with the check for extraneous answers, and simplifying, multiplying, adding and solving rational expressions with their excluded values |
| [The Complex Plane](https://showthesteps.org/helpers/complex-numbers) | Complex numbers: powers of i, square roots of negatives, adding, multiplying and dividing (by the conjugate), the complex plane, modulus and argument, polar form, De Moivre's powers and roots, and quadratics with complex solutions |
| [The Log Ladder](https://showthesteps.org/helpers/logarithms) | Logarithms: what a log means (it's the exponent), the log laws to expand and condense, change of base, exponential and log equations (with the check for extraneous answers), growth, decay, half-life and compound interest, and the graphs of bˣ and log_b x |
| [The Number Staircase](https://showthesteps.org/helpers/sequences) | Sequences and series: spot the rule in a list, arithmetic and geometric sequences (any term, the nth-term rule, is it in the list?), sums of series and sigma notation, infinite geometric series, and word problems |
| [The Shape Shop](https://showthesteps.org/helpers/geometry) | Geometry: area and perimeter (Heron's formula for a triangle from three sides), volume and surface area, the Pythagorean theorem, and angles |
| [The Dot Plot](https://showthesteps.org/helpers/statistics) | Statistics: mean, median, mode and range, box plots, frequency tables, spread, and missing values |
| [The Chance Spinner](https://showthesteps.org/helpers/probability) | Probability: one event, "not", two events (and, or, with and without putting it back), sample spaces as lists, tree diagrams and dice tables, and expected vs experimental results |
| [The Counting Tree](https://showthesteps.org/helpers/counting) | Counting: multiply the choices (outfits, PINs, license plates), arrangements where order matters (nPr, the letters of a word, round tables), groups where it doesn't (nCr, committees from two groups, at least / at most), handshakes, games and diagonals, factorials, and probability worked out by counting. It shows a tree or the choices as slots, and says when a problem's condition is beyond it. |
| [The Unit Circle](https://showthesteps.org/helpers/trigonometry) | Trigonometry: right triangles with SOH-CAH-TOA (and angle-of-elevation stories), exact values of the special angles, the unit circle with reference angles, quadrants and radians, the laws of sines and cosines (the ambiguous case too), reading and writing sine and cosine graphs, and the Pythagorean and sum identities |
| [The Rate Machine](https://showthesteps.org/helpers/calculus) | Calculus: limits (0/0, one-sided, at infinity), derivatives with each rule named (power, product, quotient, chain, trig, eˣ and ln), tangent lines, local and absolute maximum and minimum, antiderivatives and definite integrals (u-substitution too), average and instantaneous rates of change, and word problems: optimization (boxes, fences, cans, best price) and related rates (ladders, balloons, cone tanks, shadows) |
| [The Bell Curve](https://showthesteps.org/helpers/college-statistics) | College statistics: z-scores, normal probabilities and percentiles (shaded on the curve), the binomial distribution, sampling distributions and the central limit theorem, confidence intervals, hypothesis tests with p-values, and correlation and regression |
| [The Matrix Grid](https://showthesteps.org/helpers/matrices-and-vectors) | Matrices and vectors: adding and multiplying matrices (row times column), determinants, inverses, solving systems by row reduction (Gaussian and Gauss-Jordan, Cramer's rule), vectors, magnitude, dot and cross products, and projections |
| [The Story Problem](https://showthesteps.org/helpers/story-problems) | Word problems: paste or type one and see what it tells you, what it asks, which operation the words point to, a picture of the story, the working and a check |

The Story Problem reads a story as it's typed: it finds the numbers and the question, says what kind of story it looks like, and works it out.

<p align="center">
  <img src="docs/story-problem-typing.gif" width="880" alt="Typing “Mia bakes 4 trays of cookies with 6 cookies on each tray. How many cookies does she bake?” into the Story Problem: once the question is typed it reads it as equal groups, answers 24 cookies, and shows the work with a bar model of 4 trays of 6">
</p>

### What the helpers look like

<table>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/order-of-operations?q=20%20%E2%88%92%2012%20%C3%B7%204%20%C3%97%202%20%2B%201"><img src="docs/screenshots/order-of-operations.png" width="100%" alt="The Order Stack: 20 − 12 ÷ 4 × 2 + 1 worked line by line to 15, each operation boxed and tagged with its PEMDAS letter, an expression tree, and the reasons in plain English"></a>
      <br><b>The Order Stack</b>: one operation per line, with an expression tree
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/multiplication?q=47*23"><img src="docs/screenshots/multiplication.png" width="100%" alt="The Product Ladder: 47 × 23 with partial products 141 and 940 adding to 1081, a tape diagram and an area model"></a>
      <br><b>The Product Ladder</b>: partial products, a tape diagram and an area model
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/division?q=847%C3%B712&ans=remainder"><img src="docs/screenshots/division.png" width="100%" alt="The Division House: 847 ÷ 12 by long division, answer 70 R 7, with a tape diagram and an area model"></a>
      <br><b>The Division House</b>: divide, multiply, subtract, bring down
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/fractions?q=3%2F4%2C5%2F8%2C2%2F3"><img src="docs/screenshots/fractions.png" width="100%" alt="The Fraction Bar: putting 3/4, 5/8 and 2/3 in order using a common denominator of 24, with fraction bars and a number line"></a>
      <br><b>The Fraction Bar</b>: comparing with a common denominator
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/percents?q=20%25%20off%2045"><img src="docs/screenshots/percents.png" width="100%" alt="The Hundred Grid: 20% off $45, worked two ways to $36.00, with a bar and a hundred grid"></a>
      <br><b>The Hundred Grid</b>: a discount worked two ways
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/algebra?mode=solve&q=5x%20-%204%20%3D%202x%20%2B%208"><img src="docs/screenshots/algebra-solve.png" width="100%" alt="The Balance Scale: solving 5x − 4 = 2x + 8 to x = 4, doing the same thing to both sides, with balance-scale pictures and a check"></a>
      <br><b>The Balance Scale</b>: solving an equation, both sides at once
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/story-problems?q=Ana%20has%2012%20shells.%20That%20is%205%20more%20than%20Ben%20has.%20How%20many%20shells%20does%20Ben%20have%3F"><img src="docs/screenshots/story-problem.png" width="100%" alt="The Story Problem: Ana has 12 shells, that is 5 more than Ben has; the page finds what is asked, picks subtract, draws a bar model and answers Ben has 7 shells"></a>
      <br><b>The Story Problem</b>: “more” that means subtract, with a bar model
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/probability?q=draw%202%20without%20replacement%20from%204%20red%206%20blue%2C%20both%20red"><img src="docs/screenshots/probability.png" width="100%" alt="The Chance Spinner: drawing 2 marbles without replacement from 4 red and 6 blue, both red, 2/15, with marble pictures and a tree diagram"></a>
      <br><b>The Chance Spinner</b>: two picks without putting it back
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/graphing?q=y%20%3D%20x%5E2%20-%204x%20%2B%203%3B%20y%20%3D%20x%20-%201"><img src="docs/screenshots/graphing-functions.png" width="100%" alt="The Graph Paper: y = x² − 4x + 3 and y = x − 1 on one grid, with the vertex, intercepts and crossing points labeled"></a>
      <br><b>The Graph Paper</b>: two functions with their key features
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/graphing?q=rotate%20triangle%20(1%2C1)%20(3%2C1)%20(1%2C4)%2090%20clockwise"><img src="docs/screenshots/graphing-transform.png" width="100%" alt="The Graph Paper: rotating triangle (1,1) (3,1) (1,4) 90° clockwise with the rule (x, y) → (y, −x), the image drawn dashed on the grid"></a>
      <br><b>The Graph Paper</b>: a rotation and its rule
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/trigonometry?q=a%20%3D%207%2C%20b%20%3D%2010%2C%20C%20%3D%2040%C2%B0"><img src="docs/screenshots/trigonometry.png" width="100%" alt="The Unit Circle: solving a triangle with a = 7, b = 10 and C = 40° by the law of cosines, c ≈ 6.46, then the other angles, with the triangle drawn to scale"></a>
      <br><b>The Unit Circle</b>: two sides and the angle between them, by the law of cosines
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/calculus?q=tangent%20line%20to%20x%5E3%20-%203x%20at%20x%20%3D%202"><img src="docs/screenshots/calculus.png" width="100%" alt="The Rate Machine: the tangent line to x³ − 3x at x = 2 is y = 9x − 16, found from the point (2, 2) and the slope f′(2) = 9, each derivative rule named"></a>
      <br><b>The Rate Machine</b>: a tangent line, each rule of the derivative named
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/number-sense?q=round%203%2C456%20to%20the%20nearest%20hundred"><img src="docs/screenshots/number-sense.png" width="100%" alt="The Place Value Chart: rounding 3,456 to the nearest hundred, with the hundreds digit ringed, the digit to its right in green, and a number line from 3,400 to 3,500 with the halfway mark at 3,450"></a>
      <br><b>The Place Value Chart</b>: rounding on a number line
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/quadratics?q=(2x%2B3)(x-4)"><img src="docs/screenshots/quadratics.png" width="100%" alt="The Area Box: multiplying (2x + 3)(x − 4) in a box, the four cells 2x², 3x, −8x and −12 marked F, I, O and L, giving 2x² − 5x − 12"></a>
      <br><b>The Area Box</b>: multiplying brackets with the box method
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/logarithms?q=3%5E(2x-1)%20%3D%2027"><img src="docs/screenshots/logarithms.png" width="100%" alt="The Log Ladder: solving 3^(2x − 1) = 27 by writing 27 as 3³ so the exponents match, 2x − 1 = 3, x = 2"></a>
      <br><b>The Log Ladder</b>: an exponential equation, same base on both sides
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/sequences?q=nth%20term%20of%205%2C%208%2C%2011"><img src="docs/screenshots/sequences.png" width="100%" alt="The Number Staircase: the nth-term rule of 5, 8, 11, with the common difference 3 found first"></a>
      <br><b>The Number Staircase</b>: the nth-term rule of an arithmetic sequence
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/functions?q=f(x)%20%3D%20x%5E2%2C%20g(x)%20%3D%20x%20%2B%201%2C%20find%20f(g(x))"><img src="docs/screenshots/functions.png" width="100%" alt="The Function Machine: with f(x) = x² and g(x) = x + 1, f(g(x)) is worked inside first, giving (x + 1)² = x² + 2x + 1"></a>
      <br><b>The Function Machine</b>: a composition, inside first
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/radicals?q=rationalize%204%2F(3%20-%20%E2%88%9A5)"><img src="docs/screenshots/radicals.png" width="100%" alt="The Root Cellar: rationalizing 4/(3 − √5) by multiplying top and bottom by the conjugate 3 + √5, giving 3 + √5"></a>
      <br><b>The Root Cellar</b>: rationalizing with the conjugate
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/complex-numbers?q=(2%2B3i)%2F(1-i)"><img src="docs/screenshots/complex-numbers.png" width="100%" alt="The Complex Plane: dividing (2 + 3i) by (1 − i) by multiplying by the conjugate 1 + i, giving −1/2 + (5/2)i"></a>
      <br><b>The Complex Plane</b>: dividing by the conjugate
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/college-statistics?q=P(X%20%3C%2085)%20mean%2070%20sd%2010"><img src="docs/screenshots/college-statistics.png" width="100%" alt="The Bell Curve: P(X < 85) for a normal distribution with mean 70 and standard deviation 10, z = 1.5, the area shaded under the curve, about 0.9332"></a>
      <br><b>The Bell Curve</b>: a normal probability, shaded
    </td>
  </tr>
  <tr>
    <td width="100%" valign="top" colspan="2">
      <a href="https://showthesteps.org/helpers/matrices-and-vectors?q=x%20%2B%20y%20%2B%20z%20%3D%206%3B%202x%20-%20y%20%2B%20z%20%3D%203%3B%20x%20%2B%202y%20-%20z%20%3D%202"><img src="docs/screenshots/matrices-and-vectors.png" width="50%" alt="The Matrix Grid: a system of three equations written as an augmented matrix and solved by Gauss-Jordan elimination, every row operation named, giving x = 1, y = 2, z = 3"></a>
      <br><b>The Matrix Grid</b>: three equations by row reduction, each row operation named
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/unit-conversions?q=60%20mph%20to%20ft%2Fs"><img src="docs/screenshots/unit-conversions.png" width="100%" alt="The Measuring Tape: 60 miles per hour changed to feet per second by multiplying unit fractions, with miles and hours canceled, giving 88 ft/s"></a>
      <br><b>The Measuring Tape</b>: a rate, with the units canceled
    </td>
    <td width="50%" valign="top">
      <a href="https://showthesteps.org/helpers/money-math?q=%2420000%20car%20loan%206%25%205%20years%20monthly%20payment"><img src="docs/screenshots/money-math.png" width="100%" alt="The Money Jar: the monthly payment on a $20,000 car loan at 6% for 5 years from the amortization formula, with the total interest and the first rows of the schedule"></a>
      <br><b>The Money Jar</b>: a loan payment and its schedule
    </td>
  </tr>
</table>

## For students

### Check my answer, with a hint for the mistake

Every helper has four ways to work: **Show all work**, **One step at a time**, **Check my answer** and **Tutor me**, which asks what you'd do next before it shows each step. In Check my answer the work stays hidden until you've answered. Any equivalent answer counts (3/4, 0.75, 6/8); when a problem asks for simplest form, an unsimplified answer is told to simplify; and a wrong answer gets told what probably went wrong. **Show a hint** opens the work one step at a time.

<p align="center">
  <img src="docs/screenshots/check-my-answer.png" width="760" alt="Check my answer on the Order Stack: the answer 5 is marked Not quite, that's what you get going straight left to right, and the hint has opened the first steps of the work">
</p>

### Practice sets, flash cards and the problem of the day

- **[Practice sets](https://showthesteps.org/practice/sets):** open the link (or scan the QR code) your teacher shares and work through the problems one at a time with Check my answer. At the end you get a score and a line to send back.
- **[The Flash Cards](https://showthesteps.org/practice/flash-cards):** times tables up to 20 × 20 (any of them, mixed together), division, addition and subtraction facts, negatives, ×10/×100/×1000, doubles and halves, primes, powers, easy percents, fractions, squares, cubes, fraction–decimal–percent pairs and math words. Study, Quiz, a Speed round, and a **Learn** mode that brings back the ones you miss. A mastery chart colors each fact by how well you know it, and the cards print as cut-outs.
- **[Problem of the Day](https://showthesteps.org/practice/problem-of-the-day):** one problem a day, the same for everyone on that date (no sign-up, nothing to set up): easier on Monday, a challenge on Friday, a puzzle at the weekend, with a streak kept on the device.

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/flash-cards.png" width="100%" alt="The Flash Cards in Quiz mode: 8 × 6 answered 48 and marked right, with the deck picker for times tables 6, 7 and 8">
      <br><b>Flash cards</b>: pick the facts, then study, quiz, race or learn
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/problem-of-the-day.png" width="100%" alt="Problem of the Day: write the equation of the line with slope 1 through (5, 0), answered y = x − 5 and marked correct, with the work below and a one-day streak">
      <br><b>Problem of the Day</b>: the same problem for the whole class, with a streak
    </td>
  </tr>
</table>

### The Scratch Paper: do it by hand

On **[The Scratch Paper](https://showthesteps.org/helpers/scratch-paper)** you do the written method yourself on squared paper: tap above a digit to write the carry, tap a digit to cross it out and borrow, write each row, bring down in long division. It checks each square as you go (or at the end) with a hint when something's off, and **Show me the next step** fills in one square at a time when you're stuck. The four written-method helpers (+ − × ÷) have a **Now try it by hand** button that opens the same problem here.

<p align="center">
  <img src="docs/scratch-paper-steps.gif" width="784" alt="The Scratch Paper filling in 5003 − 1278 one square at a time with Show me the next step: borrowing across the zeros (5 becomes 4, each 0 becomes 10 then 9, the 3 becomes 13), then writing 5, 2, 7 and 3 under the line, ending Solved with the answer 3,725">
</p>

<details>
<summary>The finished sheet</summary>
<br>
<img src="docs/screenshots/scratch-paper.png" width="760" alt="The Scratch Paper with 5003 − 1278 filled in: the borrows written above, crossed-out digits, and the answer 3,725">
</details>

### Your progress

**[Your progress](https://showthesteps.org/practice/progress)** is a private record, kept on the device, of what's been practiced, right first time per topic, and mistakes to revisit, each with a **Try again** link. The home page shows a short "Your practice" summary too.

<details>
<summary>Screenshot: Your progress</summary>
<br>
<img src="docs/screenshots/progress.png" width="760" alt="Your progress: streak, days practiced, problems tried and right-first-time percentage, a calendar of practice days, a table by topic, mistakes to revisit and recent problems">
</details>

### The Word List

**[The Word List](https://showthesteps.org/reference/definitions)** has definitions of the math words the site uses, with examples and pictures. On every page those words link to their definition, with a popup on hover, focus or tap.

## For teachers

| Tool | What it does |
| --- | --- |
| [The Worksheet Maker](https://showthesteps.org/practice/worksheets) | Printable worksheets mixing any of the topics, with an answer key on its own page where every answer links to its worked steps (or turn the sheet into a practice link) |
| [Practice sets](https://showthesteps.org/practice/sets) | Build a set of problems from any helpers and share it as one link or QR code; students work through it with Check my answer and get a score to hand in |
| [Assignments](https://showthesteps.org/practice/sets?assignment) | No accounts: press **Add to assignment** on any helper to collect exact problems, put them in order, add instructions and a due date, choose whether students see the steps and get more than one try, and share one link (with a QR code and text for Google Classroom). Class results shows right or wrong and the tries on every problem, and who handed in late. |
| [Class results](https://showthesteps.org/practice/class-results) | Paste the lines students hand in after a practice set and see scores, a heat map of who got which problem, the hardest problems and who needs help, with CSV export; nothing is uploaded |
| [Reference sheets](https://showthesteps.org/reference/sheets) | Forty one-page sheets to print, plus a graph paper maker |
| [Lessons](https://showthesteps.org/learn/) | 46 short lessons (long division to the power rule), each with the steps, a worked example, common mistakes and links to try your own problem. |
| [Standards](https://showthesteps.org/reference/standards) | The Common Core standards (grades 1–8 and high school), each with the helpers and tabs that practice it; every helper shows its standards under the heading. An unofficial match. |
| [Problem of the Day](https://showthesteps.org/practice/problem-of-the-day?view=week) | The week's problems in one list, with links and a printable answer key, so a whole class can do the same problem each day |

### Worksheets and practice sets

The Worksheet Maker builds a sheet from sections (any helper, with that helper's own problem settings), in one to three columns with a little, some or lots of room to work, name and date lines, an answer key, and an optional QR code to practice the sheet on screen. A practice set is the same idea on screen: the whole set lives in the link, so there's nothing to sign up for, and the **QR code** button puts it on the projector for phones to scan.

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/worksheet.png" width="100%" alt="The Worksheet Maker: sections for addition and order of operations on the left, a print preview of the worksheet and its answer key on the right">
      <br><b>The Worksheet Maker</b>: preview, then print with an answer key
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/practice-sets.png" width="100%" alt="Practice sets: topics chosen on the left, the practice link with Copy link, QR code and Start it now buttons, and the ten problems listed">
      <br><b>Practice sets</b>: one link holds the whole set
    </td>
  </tr>
</table>

<details>
<summary>Screenshot: the practice set's QR code</summary>
<br>
<img src="docs/screenshots/practice-qr.png" width="420" alt="A QR code for a practice set of 10 problems, with Show full screen, Print and Download SVG buttons">
</details>

### Class results

At the end of a practice set each student copies a short result line and sends it to you (by email or in a comment, say). Paste all the lines into Class results to see the whole class at once. Each line carries a check, so a changed score, name or mark shows up as **Edited**. It all happens in your browser: nothing is uploaded. **Show me with an example class** tries it with made-up students.

<p align="center">
  <img src="docs/screenshots/class-results.png" width="860" alt="Class results for an example class: 8 students, class average 67%, a sortable table with verified and edited lines, and a heat map of right, retried, wrong and skipped answers per problem">
</p>

### Reference sheets and graph paper

Forty one-page sheets to print: times tables to 12, 15 and 20 (and blank ones), table strips, addition, hundred charts, primes to 200, prime factorizations, squares, cubes and powers, fractions–decimals–percents, ratios and percents, place value, divisibility, order of operations, exponents, geometry, angles, units, algebra, graphing, integers, statistics, probability, money and time, word problems, math words and Roman numerals. Tick the ones you want and print them together, open any sheet full size, or follow its **Practice this** link to the helper.

The **graph paper maker** (`reference/sheets#paper`) prints square grids, coordinate planes, dot paper, isometric dots and number lines, on Letter or A4, with your spacing, margins and title, as a page or a downloadable SVG.

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/reference-sheets.png" width="100%" alt="Reference sheets: a pick-which-to-print bar and the first row of sheet previews, multiplication table, times tables to 15 and 20, and times tables 1 to 20">
      <br><b>Reference sheets</b>: pick, print, or open full size
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/graph-paper.png" width="100%" alt="The graph paper maker set to four coordinate planes per letter page, with type, page, spacing, axes, lines and margin settings">
      <br><b>Graph paper maker</b>: four coordinate planes to a page
    </td>
  </tr>
</table>

## Features on every page

Every helper page has:

- a plain-English explanation of each step, including why it comes next; math words in it link to their definition, with a popup on hover, focus or tap
- **Tutor me**: before each step it asks "What would you do next?" with three or four choices, gives a hint after a wrong pick, keeps the answer hidden to the end, and gives a score
- **One step at a time** and **Check my answer** practice modes; checking accepts any equivalent answer (3/4, 0.75, 6/8) and points out common mistakes
- a **problem maker** in plain language, with a live "Makes problems like: …" preview
- a picture of the problem: tape diagrams, area models, fraction bars, hundred grids, factor trees, number lines, ratio tables, expression trees, balance scales, graphs, dot plots and shapes drawn to scale
- answers that aren't whole numbers shown as both fractions and decimals
- a link to the exact problem on screen (**Copy link**), light and dark themes, and a print layout
- **Next problem** straight after a right answer, using the same problem-maker settings

And across the whole site:

- light/dark and text size are remembered on every page, not one page at a time
- a **Type any problem** search box in the bar at the top of every page; on the home page it suggests as you type: which helper a problem belongs to, the topics that match a word ("frac", "slope", "time"), and the Word List for "what is a denominator"; arrow keys and Enter pick one
- **Big screen** mode for a projector or smartboard, and **Read aloud** for the step-by-step explanation, in the most natural voice the device has (**Voice** picks another voice or speed)
- **Recent** problems on each page, and keyboard shortcuts (press `?` to see them)
- a **QR code** for the page on screen (the `QR` button or `Q`), big enough for a projector; practice sets and worksheets have one too
- a row of **math keys** (×, ÷, −, /, ( ), x, π …) above the phone keyboard when typing an answer, picked for each page (press `K` to turn it on or off on a computer)
- link previews when a page is shared, and a friendly page for broken links

<p align="center">
  <img src="docs/screenshots/phone.png" width="900" alt="Three phone screens: the home page, the Fraction Bar ordering 5/8, 2/3 and 3/4, and Check my answer on the Balance Scale with the math keys (x, y, + − × ÷, brackets, powers) showing above the keyboard">
</p>

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/dark-home.png" width="100%" alt="The home page in dark mode">
      <br><b>Dark mode</b>: follows the device, or pick it with the button
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/dark-graphing.png" width="100%" alt="The Graph Paper in dark mode, rotating a triangle 90° clockwise">
      <br>The pictures and graphs switch too
    </td>
  </tr>
</table>

## Links to a problem

Every helper reads its problem from the address, so a link opens with that problem worked out. Add `practice=step` or `practice=check` to open it in a practice mode. Some examples:

| Link | Opens |
| --- | --- |
| [`helpers/addition?q=2 3/4+1 5/6`](https://showthesteps.org/helpers/addition?q=2%203%2F4%2B1%205%2F6) | adding mixed numbers |
| [`helpers/division?q=847÷12&ans=fraction`](https://showthesteps.org/helpers/division?q=847%C3%B712&ans=fraction) | long division, answer as a fraction |
| [`helpers/algebra?mode=sys&q=2x+y=7;x-y=2`](https://showthesteps.org/helpers/algebra?mode=sys&q=2x%2By%3D7%3Bx-y%3D2) | a system of two equations |
| [`helpers/percents?q=15% of 80`](https://showthesteps.org/helpers/percents?q=15%25%20of%2080) | percent of a number |
| [`helpers/ratios?q=share 60 in 2:3`](https://showthesteps.org/helpers/ratios?q=share%2060%20in%202%3A3) | sharing in a ratio |
| [`helpers/lines-and-slope?q=(1,2) (5,4)`](https://showthesteps.org/helpers/lines-and-slope?q=(1%2C2)%20(5%2C4)) | the slope between two points |
| [`helpers/graphing?q=y = x^2 - 4x + 3; y = x - 1`](https://showthesteps.org/helpers/graphing?q=y%20%3D%20x%5E2%20-%204x%20%2B%203%3B%20y%20%3D%20x%20-%201) | two functions on one grid |
| [`helpers/statistics?q=4, 8, 6, 5, 7`](https://showthesteps.org/helpers/statistics?q=4%2C%208%2C%206%2C%205%2C%207) | mean, median, mode and range |
| [`helpers/exponents?q=(2x^2)^3`](https://showthesteps.org/helpers/exponents?q=(2x%5E2)%5E3) | an exponent law |
| [`helpers/probability?q=draw 2 without replacement from 4 red 6 blue, both red`](https://showthesteps.org/helpers/probability?q=draw%202%20without%20replacement%20from%204%20red%206%20blue%2C%20both%20red) | two events without putting it back |
| [`helpers/number-sense?q=round 3,456 to the nearest hundred`](https://showthesteps.org/helpers/number-sense?q=round%203%2C456%20to%20the%20nearest%20hundred) | rounding on a number line |
| [`helpers/quadratics?q=2x^2+3x-2=0`](https://showthesteps.org/helpers/quadratics?q=2x%5E2%2B3x-2%3D0) | solving a quadratic (the page picks the best method and says why) |
| [`helpers/logarithms?q=3^(2x-1) = 27`](https://showthesteps.org/helpers/logarithms?q=3%5E(2x-1)%20%3D%2027) | an exponential equation |
| [`helpers/sequences?q=nth term of 5, 8, 11`](https://showthesteps.org/helpers/sequences?q=nth%20term%20of%205%2C%208%2C%2011) | the nth-term rule of an arithmetic sequence |
| [`helpers/functions?q=f(x) = x^2, g(x) = x + 1, find f(g(x))`](https://showthesteps.org/helpers/functions?q=f(x)%20%3D%20x%5E2%2C%20g(x)%20%3D%20x%20%2B%201%2C%20find%20f(g(x))) | a composition of functions |
| [`helpers/radicals?q=rationalize 4/(3 - √5)`](https://showthesteps.org/helpers/radicals?q=rationalize%204%2F(3%20-%20%E2%88%9A5)) | rationalizing with the conjugate |
| [`helpers/complex-numbers?q=(2+3i)/(1-i)`](https://showthesteps.org/helpers/complex-numbers?q=(2%2B3i)%2F(1-i)) | dividing complex numbers |
| [`helpers/college-statistics?q=95% confidence interval mean 52 s 8 n 25`](https://showthesteps.org/helpers/college-statistics?q=95%25%20confidence%20interval%20mean%2052%20s%208%20n%2025) | a confidence interval with t |
| [`helpers/matrices-and-vectors?q=x + y + z = 6; 2x - y + z = 3; x + 2y - z = 2`](https://showthesteps.org/helpers/matrices-and-vectors?q=x%20%2B%20y%20%2B%20z%20%3D%206%3B%202x%20-%20y%20%2B%20z%20%3D%203%3B%20x%20%2B%202y%20-%20z%20%3D%202) | a system of three equations by row reduction |
| [`helpers/geometry?q=circle radius 5`](https://showthesteps.org/helpers/geometry?q=circle%20radius%205) | a circle with radius 5 |
| [`helpers/story-problems?q=Ana has 12 shells. …`](https://showthesteps.org/helpers/story-problems?q=Ana%20has%2012%20shells.%20That%20is%205%20more%20than%20Ben%20has.%20How%20many%20shells%20does%20Ben%20have%3F) | a story problem |
| [`helpers/scratch-paper?op=sub&q=5003-1278`](https://showthesteps.org/helpers/scratch-paper?op=sub&q=5003-1278) | a subtraction to do by hand |
| [`practice/flash-cards?deck=times&t=6,7,8&mode=quiz`](https://showthesteps.org/practice/flash-cards?deck=times&t=6,7,8&mode=quiz) | a times-table quiz |
| [`practice/problem-of-the-day?view=week`](https://showthesteps.org/practice/problem-of-the-day?view=week) | this week's problems with an answer key |
| [`reference/sheets#geometry`](https://showthesteps.org/reference/sheets#geometry) | one reference sheet (or `reference/sheets?print=times,geometry` to pick sheets to print) |

Each page lists the parameters it accepts in a `URL parameters` comment at the top of its script. `embed=1` shows just the problem and the answer box (practice sets use this).

<details>
<summary>A note on <code>+</code> in links</summary>
<br>

In a web address a raw `+` can mean a space. The helpers read it as a plus sign when that's the only sensible reading, but the safe way is to send it as `%2B` (for example `helpers/addition?q=25.4%2B3.75`).
</details>

## Install it as an app

The site is a progressive web app: it has a manifest and icons, and a service worker keeps every page for offline use once it has been opened online.

- **Phone or tablet:** open the site, then use the browser's **Add to Home Screen** (Safari: the Share menu; Chrome: the ⋮ menu, **Install app**).
- **Computer:** in Chrome or Edge, use the install icon in the address bar, or the **Install the app** button on the home page where the browser offers it.

It opens in its own window, works without a connection, and updates itself when a new version is published.

## Testing

[`tests/self-test.html`](tests/self-test.html) checks every helper in the browser: each page loads with all its parts, a list of problems with known answers, **Check my answer** (right, equivalent, needs simplifying, wrong), problems from each page's problem maker re-worked by separate code on the test page, and each made problem reopened from its link. It also checks the flash cards (each card opens from its link, answers in any form are marked right, the problem maker's facts are re-worked), the reference sheets (every square of the times table, a few formulas, and every link), class results (a handed-in line is verified, and a changed score, name or mark is caught) and the math keys (they come up, type where the cursor is, and go away on Done). **Thorough** tries every problem-maker option (about 12,200 checks).

Run it from the [live site](https://showthesteps.org/tests/self-test) or a local server:

```sh
python -m http.server
# then open http://localhost:8000/tests/self-test.html
```

Opened as a plain file, the browser won't let it look inside the other pages.

| Parameter | Does |
| --- | --- |
| `?run=1` | starts it straight away |
| `&depth=thorough` | runs the long version |
| `&pages=ratios,stats` | tests just those pages |

Your saved settings on each page are put back afterwards.

## How it's built

Each page is one self-contained HTML file in plain HTML, CSS and ES5 JavaScript, with no framework, no dependencies and no build step: open a page in a browser, or serve the folder as it is. Only the home page, `404.html` and the service worker sit at the top; the pages are in folders (`helpers/`, `practice/`, `reference/`, `tests/`) and the shared files in `assets/`:

| File | What it does |
| --- | --- |
| `assets/site.js` | where every page and file lives: the one list of pages (`PAGES`), from the short name a page is known by inside the site (`pemdas`, which practice sets, progress and saved worksheets store) to its file (`helpers/order-of-operations.html`). Each page loads it first, and every link from one page to another is made through it (`HelperSite.url("fractions", "mode=simplify&q=18%2F24")`). On the live site the links are readable, without `.html` (`helpers/order-of-operations?q=…`); opened as a file or from a local `python -m http.server`, they keep `.html`. |
| `assets/nav.js` | adds the bar across the top of every page, makes the site installable (`assets/manifest.webmanifest`, `assets/icons/`) and offline (`sw.js`), and loads the definitions popups. To add a page, put it in its folder, add it to `PAGES` in `site.js`, to the list in `nav.js` and to `PAGES` in `sw.js`. |
| `assets/glossary.js` | holds every definition, and finds and links the math words on each page |
| `assets/progress.js` | records each Check my answer result in the browser and draws the "Your practice" panel |
| `assets/tools.js` | adds the site-wide settings, big screen, read aloud, recent problems, keyboard shortcuts, the math keys and Next problem |
| `assets/qr.js` | makes QR codes in the browser (no library, works offline), loaded only when one is asked for |
| `assets/search.js` | works out which helper a typed problem belongs to (used by the home page, the bar and `404.html`) |
| `sw.js` | the service worker: keeps the pages for offline use. It stays at the top, because a service worker only looks after the pages in its own folder and below. |
| `404.html` | the page GitHub Pages shows for a missing address. It also sends every older address (`pemdas.html?q=…`, `practice.html?set=…`, `helpers/pemdas`, `icons/og.png`) on to the page's address now, with the problem kept, so old links, bookmarks and QR codes still work. |
| `tests/self-test.html` | the self-test (see [Testing](#testing)) |

Each helper reports each check with a `helper:checked` event, and answers worksheet and practice-set requests through `postMessage` (`helper:options` and `helper:make`), so every worksheet and practice answer is worked out by the same code as the helper page.

<details>
<summary>All the files</summary>
<br>

| Folder | Files |
| --- | --- |
| (top) | `index.html` (the home page) `404.html` `sw.js` |
| `helpers/` | `addition.html` `subtraction.html` `multiplication.html` `division.html` `scratch-paper.html` `fractions.html` `percents.html` `factors-and-primes.html` `negative-numbers.html` `ratios.html` `exponents.html` `order-of-operations.html` `algebra.html` `lines-and-slope.html` `graphing.html` `geometry.html` `statistics.html` `probability.html` `trigonometry.html` `calculus.html` `story-problems.html` |
| `practice/` | `sets.html` `worksheets.html` `flash-cards.html` `problem-of-the-day.html` `progress.html` `class-results.html` |
| `reference/` | `sheets.html` `definitions.html` |
| `assets/` | `site.js` `nav.js` `tools.js` `glossary.js` `progress.js` `qr.js` `search.js` `manifest.webmanifest` `icons/` |
| `tests/` | `self-test.html` |
| Repository | `README.md` and `docs/` (its screenshots and demos), `LICENSE`, `.github/workflows/release.yml` |
</details>

## By the numbers

How big the site is, counted from the files themselves (the code is kept formatted: one statement per line). `scripts/stats.py` keeps this table up to date.

<!-- stats:start -->

| | |
| --- | ---: |
| Helpers | 44 |
| Lessons | 66 |
| Pages and scripts | 129 pages, 31 scripts |
| Lines of code | 377,232 |
| &nbsp;&nbsp;JavaScript | 248,047 |
| &nbsp;&nbsp;CSS | 115,076 |
| &nbsp;&nbsp;HTML | 14,109 |
| Characters | 18,014,879 |
| Size | 17.3 MB |
| Self-test checks | 32,222 (the last thorough run) |

<sub>Counted by `scripts/stats.py` on 2026-10-25; blank lines left out.</sub>

<!-- stats:end -->

## Versioning and releases

Every push to `main` is versioned automatically by GitHub Actions ([`release.yml`](https://github.com/chrisdfennell/showthesteps/actions/workflows/release.yml)):

| The commit | Bumps |
| --- | --- |
| subject starts with **Add** | the minor version (1.**4**.0) |
| anything else | the patch version (1.4.**1**) |
| **`[major]`** in the commit body | the major version (**2**.0.0) |

Each version gets a git tag `vX.Y.Z`, a [GitHub Release](https://github.com/chrisdfennell/showthesteps/releases) listing the commit subjects, and is stamped into the site: the footer shows the version, and the offline cache renews itself so installed copies pick up the new pages.

## Privacy

The full details are on the site's [privacy page](https://showthesteps.org/info/privacy) (and there's an [About page](https://showthesteps.org/info/about)). There are no accounts and no cookies. Visits are counted with [GoatCounter](https://www.goatcounter.com/) (no cookies, nothing personal); pages shown inside other pages and local testing aren't counted. Everything else stays in the browser: settings, recent problems, progress, flash-card records, streaks and pasted class results are kept on the device only, and clearing the browser's site data clears them.

## License

[CC BY-NC 4.0](LICENSE): you're free to share and adapt it, with credit, but not for commercial use. See [`LICENSE`](LICENSE) for the full terms.
