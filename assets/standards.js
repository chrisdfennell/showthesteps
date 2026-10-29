/* Common Core State Standards for Mathematics (CCSS Math), matched to the helpers: an unofficial alignment.
   One list feeds two things:
     1. a quiet "Common Core: 4.NBT.B.4 · 5.NBT.B.7" line under the heading on every helper page. Each code has a
        tooltip with the standard's wording and links to reference/standards.html. It follows the tab that is open
        (Fractions: Simplify, Add, ...), is hidden in embedded pages and in print;
     2. the Standards page (reference/standards.html), which lists every standard and the helpers that teach it.
   Safe to load on any page, any number of times: it never throws, and a page without it works the same.

   window.HelperStandards = {
     list                every standard, in order: { code, grade, domain, text, plus? }
                           code    "4.NBT.B.4", "HSA-SSE.B.3" (K-8: grade.domain.cluster.number)
                           grade   "K".."8" or "HS"      domain  "Number and Operations in Base Ten"
                           area    high school only: "Algebra", "Functions"...
                           plus    true for the (+) standards, the ones for students who go on to advanced courses
     pages               the helpers: { id:"fractions", name:"Fractions", beyond:"", modes:[{ key, name, codes:[...] }] }
                         key "" is the helper as a whole (not tied to one tab); beyond is a note for topics past Common Core
     byCode(code)        the standard object, or null
     forPage(short[, mode])  the standards a helper teaches, for one tab when mode is given and known, else for all of
                         it. short is a short name from site.js ("fractions", "pemdas", "stats"); returns [standard]
     beyond(short)       the "beyond Common Core" note of a helper, or ""
     pagesFor(code)      [{ page, name, mode, modeName }] where a standard is taught
     search(text)        [{ standard, pages:[...] }] for words like "4.NBT", "fractions", "grade 6", "high school"
     url(code)           the address of the Standards page showing just that standard

   This is NOT an official alignment. The wording is the standards' own (shortened where it is very long). */
(function() {
  "use strict";
  if (window.HelperStandards) return;

  /* ---- the words, in the visitor's language (assets/i18n.js): the standards.* keys, and en.js repeats the English for
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
  try { main(); } catch (e) { if (window.console) console.warn("standards.js:", e); }

  function main() {
    var G = window,
      D = document;

    /* ---------- the domains ---------- */
    var DOM = {
      "CC": "Counting and Cardinality",
      "OA": "Operations and Algebraic Thinking",
      "NBT": "Number and Operations in Base Ten",
      "NF": "Number and Operations—Fractions",
      "MD": "Measurement and Data",
      "G": "Geometry",
      "RP": "Ratios and Proportional Relationships",
      "NS": "The Number System",
      "EE": "Expressions and Equations",
      "F": "Functions",
      "SP": "Statistics and Probability"
    };
    var HSDOM = { // domain code → [area, domain]
      "N-RN": ["Number and Quantity", "The Real Number System"],
      "N-Q": ["Number and Quantity", "Quantities"],
      "N-CN": ["Number and Quantity", "The Complex Number System"],
      "N-VM": ["Number and Quantity", "Vector and Matrix Quantities"],
      "A-SSE": ["Algebra", "Seeing Structure in Expressions"],
      "A-APR": ["Algebra", "Arithmetic with Polynomials and Rational Expressions"],
      "A-CED": ["Algebra", "Creating Equations"],
      "A-REI": ["Algebra", "Reasoning with Equations and Inequalities"],
      "F-IF": ["Functions", "Interpreting Functions"],
      "F-BF": ["Functions", "Building Functions"],
      "F-LE": ["Functions", "Linear, Quadratic, and Exponential Models"],
      "F-TF": ["Functions", "Trigonometric Functions"],
      "G-CO": ["Geometry", "Congruence"],
      "G-SRT": ["Geometry", "Similarity, Right Triangles, and Trigonometry"],
      "G-GPE": ["Geometry", "Expressing Geometric Properties with Equations"],
      "G-GMD": ["Geometry", "Geometric Measurement and Dimension"],
      "S-ID": ["Statistics and Probability", "Interpreting Categorical and Quantitative Data"],
      "S-IC": ["Statistics and Probability", "Making Inferences and Justifying Conclusions"],
      "S-CP": ["Statistics and Probability", "Conditional Probability and the Rules of Probability"],
      "S-MD": ["Statistics and Probability", "Using Probability to Make Decisions"]
    };

    /* ---------- the standards used (code, wording) ---------- */
    var RAW = [
      ["1.OA.A.1", "Use addition and subtraction within 20 to solve word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions."],
      ["1.NBT.B.3", "Compare two two-digit numbers based on meanings of the tens and ones digits, recording the results of comparisons with the symbols >, =, and <."],
      ["1.NBT.C.5", "Given a two-digit number, mentally find 10 more or 10 less than the number, without having to count; explain the reasoning used."],
      ["1.MD.B.3", "Tell and write time in hours and half-hours using analog and digital clocks."],
      ["2.OA.A.1", "Use addition and subtraction within 100 to solve one- and two-step word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions."],
      ["2.OA.C.3", "Determine whether a group of objects (up to 20) has an odd or even number of members, e.g., by pairing objects or counting them by 2s."],
      ["2.NBT.A.1", "Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones."],
      ["2.NBT.A.2", "Count within 1000; skip-count by 5s, 10s, and 100s."],
      ["2.NBT.A.3", "Read and write numbers to 1000 using base-ten numerals, number names, and expanded form."],
      ["2.NBT.A.4", "Compare two three-digit numbers based on meanings of the hundreds, tens, and ones digits, using >, =, and < symbols to record the results of comparisons."],
      ["2.NBT.B.5", "Fluently add and subtract within 100 using strategies based on place value, properties of operations, and/or the relationship between addition and subtraction."],
      ["2.NBT.B.7", "Add and subtract within 1000, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction; relate the strategy to a written method."],
      ["2.NBT.B.8", "Mentally add 10 or 100 to a given number 100–900, and mentally subtract 10 or 100 from a given number 100–900."],
      ["2.MD.C.7", "Tell and write time from analog and digital clocks to the nearest five minutes, using a.m. and p.m."],
      ["2.MD.C.8", "Solve word problems involving dollar bills, quarters, dimes, nickels, and pennies, using $ and ¢ symbols appropriately."],
      ["3.OA.A.3", "Use multiplication and division within 100 to solve word problems in situations involving equal groups, arrays, and measurement quantities."],
      ["3.OA.C.7", "Fluently multiply and divide within 100, using strategies such as the relationship between multiplication and division or properties of operations. Know from memory all products of two one-digit numbers."],
      ["3.OA.D.8", "Solve two-step word problems using the four operations. Represent these problems using equations with a letter standing for the unknown quantity. Assess the reasonableness of answers using mental computation and estimation strategies including rounding."],
      ["3.OA.D.9", "Identify arithmetic patterns (including patterns in the addition table or multiplication table), and explain them using properties of operations."],
      ["3.NBT.A.1", "Use place value understanding to round whole numbers to the nearest 10 or 100."],
      ["3.NBT.A.2", "Fluently add and subtract within 1000 using strategies and algorithms based on place value, properties of operations, and/or the relationship between addition and subtraction."],
      ["3.NF.A.3", "Explain equivalence of fractions in special cases, and compare fractions by reasoning about their size."],
      ["3.MD.A.1", "Tell and write time to the nearest minute and measure time intervals in minutes. Solve word problems involving addition and subtraction of time intervals in minutes, e.g., by representing the problem on a number line diagram."],
      ["3.MD.B.3", "Draw a scaled picture graph and a scaled bar graph to represent a data set with several categories. Solve one- and two-step “how many more” and “how many less” problems using information presented in scaled bar graphs."],
      ["3.MD.C.7", "Relate area to the operations of multiplication and addition."],
      ["3.MD.D.8", "Solve real world and mathematical problems involving perimeters of polygons, including finding the perimeter given the side lengths, finding an unknown side length, and exhibiting rectangles with the same perimeter and different areas or with the same area and different perimeters."],
      ["4.OA.A.2", "Multiply or divide to solve word problems involving multiplicative comparison, e.g., by using drawings and equations with a symbol for the unknown number to represent the problem, distinguishing multiplicative comparison from additive comparison."],
      ["4.OA.A.3", "Solve multistep word problems posed with whole numbers and having whole-number answers using the four operations, including problems in which remainders must be interpreted. Represent these problems using equations with a letter standing for the unknown quantity. Assess the reasonableness of answers using mental computation and estimation strategies including rounding."],
      ["4.OA.B.4", "Find all factor pairs for a whole number in the range 1–100. Recognize that a whole number is a multiple of each of its factors. Determine whether a given whole number in the range 1–100 is a multiple of a given one-digit number. Determine whether a given whole number in the range 1–100 is prime or composite."],
      ["4.OA.C.5", "Generate a number or shape pattern that follows a given rule. Identify apparent features of the pattern that were not explicit in the rule itself."],
      ["4.NBT.A.1", "Recognize that in a multi-digit whole number, a digit in one place represents ten times what it represents in the place to its right."],
      ["4.NBT.A.2", "Read and write multi-digit whole numbers using base-ten numerals, number names, and expanded form. Compare two multi-digit numbers based on meanings of the digits in each place, using >, =, and < symbols to record the results of comparisons."],
      ["4.NBT.A.3", "Use place value understanding to round multi-digit whole numbers to any place."],
      ["4.NBT.B.4", "Fluently add and subtract multi-digit whole numbers using the standard algorithm."],
      ["4.NBT.B.5", "Multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers, using strategies based on place value and the properties of operations. Illustrate and explain the calculation by using equations, rectangular arrays, and/or area models."],
      ["4.NBT.B.6", "Find whole-number quotients and remainders with up to four-digit dividends and one-digit divisors, using strategies based on place value, the properties of operations, and/or the relationship between multiplication and division. Illustrate and explain the calculation by using equations, rectangular arrays, and/or area models."],
      ["4.NF.A.1", "Explain why a fraction a/b is equivalent to a fraction (n × a)/(n × b) by using visual fraction models, with attention to how the number and size of the parts differ even though the two fractions themselves are the same size. Use this principle to recognize and generate equivalent fractions."],
      ["4.NF.A.2", "Compare two fractions with different numerators and different denominators, e.g., by creating common denominators or numerators, or by comparing to a benchmark fraction such as 1/2. Recognize that comparisons are valid only when the two fractions refer to the same whole. Record the results of comparisons with symbols >, =, or <, and justify the conclusions."],
      ["4.NF.B.3", "Understand a fraction a/b with a > 1 as a sum of fractions 1/b. Add and subtract fractions and mixed numbers with like denominators, and solve word problems involving them."],
      ["4.NF.B.4", "Apply and extend previous understandings of multiplication to multiply a fraction by a whole number."],
      ["4.NF.C.5", "Express a fraction with denominator 10 as an equivalent fraction with denominator 100, and use this technique to add two fractions with respective denominators 10 and 100."],
      ["4.NF.C.6", "Use decimal notation for fractions with denominators 10 or 100."],
      ["4.MD.A.1", "Know relative sizes of measurement units within one system of units including km, m, cm; kg, g; lb, oz.; l, ml; hr, min, sec. Within a single system of measurement, express measurements in a larger unit in terms of a smaller unit. Record measurement equivalents in a two-column table."],
      ["4.MD.A.2", "Use the four operations to solve word problems involving distances, intervals of time, liquid volumes, masses of objects, and money, including problems involving simple fractions or decimals, and problems that require expressing measurements given in a larger unit in terms of a smaller unit."],
      ["4.MD.A.3", "Apply the area and perimeter formulas for rectangles in real world and mathematical problems."],
      ["4.MD.C.7", "Recognize angle measure as additive. When an angle is decomposed into non-overlapping parts, the angle measure of the whole is the sum of the angle measures of the parts. Solve addition and subtraction problems to find unknown angles on a diagram in real world and mathematical problems."],
      ["4.G.A.1", "Draw points, lines, line segments, rays, angles (right, acute, obtuse), and perpendicular and parallel lines. Identify these in two-dimensional figures."],
      ["5.OA.A.1", "Use parentheses, brackets, or braces in numerical expressions, and evaluate expressions with these symbols."],
      ["5.OA.B.3", "Generate two numerical patterns using two given rules. Identify apparent relationships between corresponding terms. Form ordered pairs consisting of corresponding terms from the two patterns, and graph the ordered pairs on a coordinate plane."],
      ["5.NBT.A.1", "Recognize that in a multi-digit number, a digit in one place represents 10 times as much as it represents in the place to its right and 1/10 of what it represents in the place to its left."],
      ["5.NBT.A.2", "Explain patterns in the number of zeros of the product when multiplying a number by powers of 10, and explain patterns in the placement of the decimal point when a decimal is multiplied or divided by a power of 10. Use whole-number exponents to denote powers of 10."],
      ["5.NBT.A.3", "Read, write, and compare decimals to thousandths."],
      ["5.NBT.A.4", "Use place value understanding to round decimals to any place."],
      ["5.NBT.B.5", "Fluently multiply multi-digit whole numbers using the standard algorithm."],
      ["5.NBT.B.6", "Find whole-number quotients of whole numbers with up to four-digit dividends and two-digit divisors, using strategies based on place value, the properties of operations, and/or the relationship between multiplication and division. Illustrate and explain the calculation by using equations, rectangular arrays, and/or area models."],
      ["5.NBT.B.7", "Add, subtract, multiply, and divide decimals to hundredths, using concrete models or drawings and strategies based on place value, properties of operations, and/or the relationship between addition and subtraction; relate the strategy to a written method and explain the reasoning used."],
      ["5.NF.A.1", "Add and subtract fractions with unlike denominators (including mixed numbers) by replacing given fractions with equivalent fractions in such a way as to produce an equivalent sum or difference of fractions with like denominators."],
      ["5.NF.B.3", "Interpret a fraction as division of the numerator by the denominator (a/b = a ÷ b). Solve word problems involving division of whole numbers leading to answers in the form of fractions or mixed numbers."],
      ["5.NF.B.4", "Apply and extend previous understandings of multiplication to multiply a fraction or whole number by a fraction."],
      ["5.NF.B.6", "Solve real world problems involving multiplication of fractions and mixed numbers, e.g., by using visual fraction models or equations to represent the problem."],
      ["5.NF.B.7", "Apply and extend previous understandings of division to divide unit fractions by whole numbers and whole numbers by unit fractions."],
      ["5.MD.A.1", "Convert among different-sized standard measurement units within a given measurement system (e.g., convert 5 cm to 0.05 m), and use these conversions in solving multi-step, real world problems."],
      ["5.MD.C.3", "Recognize volume as an attribute of solid figures and understand concepts of volume measurement."],
      ["5.MD.C.5", "Relate volume to the operations of multiplication and addition and solve real world and mathematical problems involving volume."],
      ["5.G.A.1", "Use a pair of perpendicular number lines, called axes, to define a coordinate system, with the intersection of the lines (the origin) arranged to coincide with the 0 on each line and a given point in the plane located by using an ordered pair of numbers, called its coordinates."],
      ["5.G.A.2", "Represent real world and mathematical problems by graphing points in the first quadrant of the coordinate plane, and interpret coordinate values of points in the context of the situation."],
      ["6.RP.A.1", "Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities."],
      ["6.RP.A.2", "Understand the concept of a unit rate a/b associated with a ratio a:b with b ≠ 0, and use rate language in the context of a ratio relationship."],
      ["6.RP.A.3", "Use ratio and rate reasoning to solve real-world and mathematical problems (tables of equivalent ratios, tape diagrams, double number lines, equations), including finding a percent of a quantity as a rate per 100 and converting measurement units."],
      ["6.NS.A.1", "Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions, e.g., by using visual fraction models and equations to represent the problem."],
      ["6.NS.B.2", "Fluently divide multi-digit numbers using the standard algorithm."],
      ["6.NS.B.3", "Fluently add, subtract, multiply, and divide multi-digit decimals using the standard algorithm for each operation."],
      ["6.NS.B.4", "Find the greatest common factor of two whole numbers less than or equal to 100 and the least common multiple of two whole numbers less than or equal to 12. Use the distributive property to express a sum of two whole numbers 1–100 with a common factor as a multiple of a sum of two whole numbers with no common factor."],
      ["6.NS.C.5", "Understand that positive and negative numbers are used together to describe quantities having opposite directions or values (e.g., temperature above/below zero, elevation above/below sea level, credits/debits); use positive and negative numbers to represent quantities in real-world contexts, explaining the meaning of 0 in each situation."],
      ["6.NS.C.6", "Understand a rational number as a point on the number line. Extend number line diagrams and coordinate axes familiar from previous grades to represent points on the line and in the plane with negative number coordinates."],
      ["6.NS.C.7", "Understand ordering and absolute value of rational numbers."],
      ["6.EE.A.1", "Write and evaluate numerical expressions involving whole-number exponents."],
      ["6.EE.A.2", "Write, read, and evaluate expressions in which letters stand for numbers."],
      ["6.EE.A.3", "Apply the properties of operations to generate equivalent expressions."],
      ["6.EE.A.4", "Identify when two expressions are equivalent (i.e., when the two expressions name the same number regardless of which value is substituted into them)."],
      ["6.EE.B.7", "Solve real-world and mathematical problems by writing and solving equations of the form x + p = q and px = q for cases in which p, q and x are all nonnegative rational numbers."],
      ["6.EE.B.8", "Write an inequality of the form x > c or x < c to represent a constraint or condition in a real-world or mathematical problem. Recognize that inequalities of the form x > c or x < c have infinitely many solutions; represent solutions of such inequalities on number line diagrams."],
      ["6.EE.C.9", "Use variables to represent two quantities in a real-world problem that change in relationship to one another; write an equation to express one quantity (the dependent variable) in terms of the other (the independent variable). Analyze the relationship between them using graphs and tables, and relate these to the equation."],
      ["6.G.A.1", "Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing into rectangles or decomposing into triangles and other shapes; apply these techniques in the context of solving real-world and mathematical problems."],
      ["6.G.A.2", "Find the volume of a right rectangular prism with fractional edge lengths by packing it with unit cubes of the appropriate unit fraction edge lengths, and show that the volume is the same as would be found by multiplying the edge lengths of the prism. Apply the formulas V = l w h and V = b h."],
      ["6.G.A.4", "Represent three-dimensional figures using nets made up of rectangles and triangles, and use the nets to find the surface area of these figures. Apply these techniques in the context of solving real-world and mathematical problems."],
      ["6.SP.A.2", "Understand that a set of data collected to answer a statistical question has a distribution which can be described by its center, spread, and overall shape."],
      ["6.SP.A.3", "Recognize that a measure of center for a numerical data set summarizes all of its values with a single number, while a measure of variation describes how its values vary with a single number."],
      ["6.SP.B.4", "Display numerical data in plots on a number line, including dot plots, histograms, and box plots."],
      ["6.SP.B.5", "Summarize numerical data sets in relation to their context, including giving quantitative measures of center (median and/or mean) and variability (interquartile range and/or mean absolute deviation), and describing the overall pattern of the data."],
      ["7.RP.A.1", "Compute unit rates associated with ratios of fractions, including ratios of lengths, areas and other quantities measured in like or different units."],
      ["7.RP.A.2", "Recognize and represent proportional relationships between quantities."],
      ["7.RP.A.3", "Use proportional relationships to solve multistep ratio and percent problems. Examples: simple interest, tax, markups and markdowns, gratuities and commissions, fees, percent increase and decrease, percent error."],
      ["7.NS.A.1", "Apply and extend previous understandings of addition and subtraction to add and subtract rational numbers; represent addition and subtraction on a horizontal or vertical number line diagram."],
      ["7.NS.A.2", "Apply and extend previous understandings of multiplication and division and of fractions to multiply and divide rational numbers (including converting a rational number to a decimal using long division)."],
      ["7.NS.A.3", "Solve real-world and mathematical problems involving the four operations with rational numbers."],
      ["7.EE.A.1", "Apply properties of operations as strategies to add, subtract, factor, and expand linear expressions with rational coefficients."],
      ["7.EE.B.3", "Solve multi-step real-life and mathematical problems posed with positive and negative rational numbers in any form (whole numbers, fractions, and decimals), using tools strategically. Apply properties of operations to calculate with numbers in any form; convert between forms as appropriate; and assess the reasonableness of answers using mental computation and estimation strategies."],
      ["7.EE.B.4", "Use variables to represent quantities in a real-world or mathematical problem, and construct simple equations and inequalities to solve problems by reasoning about the quantities."],
      ["7.G.A.1", "Solve problems involving scale drawings of geometric figures, including computing actual lengths and areas from a scale drawing and reproducing a scale drawing at a different scale."],
      ["7.G.B.4", "Know the formulas for the area and circumference of a circle and use them to solve problems; give an informal derivation of the relationship between the circumference and area of a circle."],
      ["7.G.B.5", "Use facts about supplementary, complementary, vertical, and adjacent angles in a multi-step problem to write and solve simple equations for an unknown angle in a figure."],
      ["7.G.B.6", "Solve real-world and mathematical problems involving area, volume and surface area of two- and three-dimensional objects composed of triangles, quadrilaterals, polygons, cubes, and right prisms."],
      ["7.SP.C.5", "Understand that the probability of a chance event is a number between 0 and 1 that expresses the likelihood of the event occurring. Larger numbers indicate greater likelihood. A probability near 0 indicates an unlikely event, a probability around 1/2 indicates an event that is neither unlikely nor likely, and a probability near 1 indicates a likely event."],
      ["7.SP.C.6", "Approximate the probability of a chance event by collecting data on the chance process that produces it and observing its long-run relative frequency, and predict the approximate relative frequency given the probability."],
      ["7.SP.C.7", "Develop a probability model and use it to find probabilities of events. Compare probabilities from a model to observed frequencies; if the agreement is not good, explain possible sources of the discrepancy."],
      ["7.SP.C.8", "Find probabilities of compound events using organized lists, tables, tree diagrams, and simulation."],
      ["8.NS.A.1", "Know that numbers that are not rational are called irrational. Understand informally that every number has a decimal expansion; for rational numbers show that the decimal expansion repeats eventually, and convert a decimal expansion which repeats eventually into a rational number."],
      ["8.NS.A.2", "Use rational approximations of irrational numbers to compare the size of irrational numbers, locate them approximately on a number line diagram, and estimate the value of expressions (e.g., π²)."],
      ["8.EE.A.1", "Know and apply the properties of integer exponents to generate equivalent numerical expressions."],
      ["8.EE.A.2", "Use square root and cube root symbols to represent solutions to equations of the form x² = p and x³ = p, where p is a positive rational number. Evaluate square roots of small perfect squares and cube roots of small perfect cubes. Know that √2 is irrational."],
      ["8.EE.A.3", "Use numbers expressed in the form of a single digit times an integer power of 10 to estimate very large or very small quantities, and to express how many times as much one is than the other."],
      ["8.EE.A.4", "Perform operations with numbers expressed in scientific notation, including problems where both decimal and scientific notation are used. Use scientific notation and choose units of appropriate size for measurements of very large or very small quantities. Interpret scientific notation that has been generated by technology."],
      ["8.EE.B.5", "Graph proportional relationships, interpreting the unit rate as the slope of the graph. Compare two different proportional relationships represented in different ways."],
      ["8.EE.B.6", "Use similar triangles to explain why the slope m is the same between any two distinct points on a non-vertical line in the coordinate plane; derive the equation y = mx for a line through the origin and the equation y = mx + b for a line intercepting the vertical axis at b."],
      ["8.EE.C.7", "Solve linear equations in one variable."],
      ["8.EE.C.8", "Analyze and solve pairs of simultaneous linear equations."],
      ["8.F.A.1", "Understand that a function is a rule that assigns to each input exactly one output. The graph of a function is the set of ordered pairs consisting of an input and the corresponding output."],
      ["8.F.A.3", "Interpret the equation y = mx + b as defining a linear function, whose graph is a straight line; give examples of functions that are not linear."],
      ["8.F.B.4", "Construct a function to model a linear relationship between two quantities. Determine the rate of change and initial value of the function from a description of a relationship or from two (x, y) values, including reading these from a table or from a graph. Interpret the rate of change and initial value of a linear function in terms of the situation it models."],
      ["8.G.A.1", "Verify experimentally the properties of rotations, reflections, and translations."],
      ["8.G.A.2", "Understand that a two-dimensional figure is congruent to another if the second can be obtained from the first by a sequence of rotations, reflections, and translations; given two congruent figures, describe a sequence that exhibits the congruence between them."],
      ["8.G.A.3", "Describe the effect of dilations, translations, rotations, and reflections on two-dimensional figures using coordinates."],
      ["8.G.A.4", "Understand that a two-dimensional figure is similar to another if the second can be obtained from the first by a sequence of rotations, reflections, translations, and dilations; given two similar two-dimensional figures, describe a sequence that exhibits the similarity between them."],
      ["8.G.A.5", "Use informal arguments to establish facts about the angle sum and exterior angle of triangles, about the angles created when parallel lines are cut by a transversal, and the angle-angle criterion for similarity of triangles."],
      ["8.G.B.6", "Explain a proof of the Pythagorean Theorem and its converse."],
      ["8.G.B.7", "Apply the Pythagorean Theorem to determine unknown side lengths in right triangles in real-world and mathematical problems in two and three dimensions."],
      ["8.G.C.9", "Know the formulas for the volumes of cones, cylinders, and spheres and use them to solve real-world and mathematical problems."],
      ["8.SP.A.1", "Construct and interpret scatter plots for bivariate measurement data to investigate patterns of association between two quantities. Describe patterns such as clustering, outliers, positive or negative association, linear association, and nonlinear association."],
      ["8.SP.A.2", "Know that straight lines are widely used to model relationships between two quantitative variables. For scatter plots that suggest a linear association, informally fit a straight line, and informally assess the model fit by judging the closeness of the data points to the line."],
      ["8.SP.A.3", "Use the equation of a linear model to solve problems in the context of bivariate measurement data, interpreting the slope and intercept."],
      ["HSN-RN.A.1", "Explain how the definition of the meaning of rational exponents follows from extending the properties of integer exponents to those values, allowing for a notation for radicals in terms of rational exponents."],
      ["HSN-RN.A.2", "Rewrite expressions involving radicals and rational exponents using the properties of exponents."],
      ["HSN-Q.A.1", "Use units as a way to understand problems and to guide the solution of multi-step problems; choose and interpret units consistently in formulas; choose and interpret the scale and the origin in graphs and data displays."],
      ["HSN-CN.A.1", "Know there is a complex number i such that i² = −1, and every complex number has the form a + bi with a and b real."],
      ["HSN-CN.A.2", "Use the relation i² = −1 and the commutative, associative, and distributive properties to add, subtract, and multiply complex numbers."],
      ["HSN-CN.A.3", "(+) Find the conjugate of a complex number; use conjugates to find moduli and quotients of complex numbers."],
      ["HSN-CN.B.4", "(+) Represent complex numbers on the complex plane in rectangular and polar form (including real and imaginary numbers), and explain why the rectangular and polar forms of a given complex number represent the same number."],
      ["HSN-CN.B.5", "(+) Represent addition, subtraction, multiplication, and conjugation of complex numbers geometrically on the complex plane; use properties of this representation for computation."],
      ["HSN-CN.B.6", "(+) Calculate the distance between numbers in the complex plane as the modulus of the difference, and the midpoint of a segment as the average of the numbers at its endpoints."],
      ["HSN-CN.C.7", "Solve quadratic equations with real coefficients that have complex solutions."],
      ["HSN-CN.C.9", "(+) Know the Fundamental Theorem of Algebra; show that it is true for quadratic polynomials."],
      ["HSN-VM.A.1", "(+) Recognize vector quantities as having both magnitude and direction. Represent vector quantities by directed line segments, and use appropriate symbols for vectors and their magnitudes."],
      ["HSN-VM.A.2", "(+) Find the components of a vector by subtracting the coordinates of an initial point from the coordinates of a terminal point."],
      ["HSN-VM.A.3", "(+) Solve problems involving velocity and other quantities that can be represented by vectors."],
      ["HSN-VM.B.4", "(+) Add and subtract vectors."],
      ["HSN-VM.B.5", "(+) Multiply a vector by a scalar."],
      ["HSN-VM.C.6", "(+) Use matrices to represent and manipulate data, e.g., to represent payoffs or incidence relationships in a network."],
      ["HSN-VM.C.7", "(+) Multiply matrices by scalars to produce new matrices, e.g., as when all of the payoffs in a game are doubled."],
      ["HSN-VM.C.8", "(+) Add, subtract, and multiply matrices of appropriate dimensions."],
      ["HSN-VM.C.9", "(+) Understand that, unlike multiplication of numbers, matrix multiplication for square matrices is not a commutative operation, but still satisfies the associative and distributive properties."],
      ["HSN-VM.C.10", "(+) Understand that the zero and identity matrices play a role in matrix addition and multiplication similar to the role of 0 and 1 in the real numbers. The determinant of a square matrix is nonzero if and only if the matrix has a multiplicative inverse."],
      ["HSN-VM.C.12", "(+) Work with 2 × 2 matrices as transformations of the plane, and interpret the absolute value of the determinant in terms of area."],
      ["HSA-SSE.A.2", "Use the structure of an expression to identify ways to rewrite it."],
      ["HSA-SSE.B.3", "Choose and produce an equivalent form of an expression to reveal and explain properties of the quantity represented by the expression (factor a quadratic to reveal its zeros; complete the square to reveal its maximum or minimum value)."],
      ["HSA-SSE.B.4", "Derive the formula for the sum of a finite geometric series (when the common ratio is not 1), and use the formula to solve problems. For example, calculate mortgage payments."],
      ["HSA-APR.A.1", "Understand that polynomials form a system analogous to the integers, namely, they are closed under the operations of addition, subtraction, and multiplication; add, subtract, and multiply polynomials."],
      ["HSA-APR.B.2", "Know and apply the Remainder Theorem: For a polynomial p(x) and a number a, the remainder on division by x − a is p(a), so p(a) = 0 if and only if (x − a) is a factor of p(x)."],
      ["HSA-APR.B.3", "Identify zeros of polynomials when suitable factorizations are available, and use the zeros to construct a rough graph of the function defined by the polynomial."],
      ["HSA-APR.D.6", "Rewrite simple rational expressions in different forms; write a(x)/b(x) in the form q(x) + r(x)/b(x), where a(x), b(x), q(x), and r(x) are polynomials with the degree of r(x) less than the degree of b(x), using inspection, long division, or, for the more complicated examples, a computer algebra system."],
      ["HSA-APR.D.7", "(+) Understand that rational expressions form a system analogous to the rational numbers, closed under addition, subtraction, multiplication, and division by a nonzero rational expression; add, subtract, multiply, and divide rational expressions."],
      ["HSA-CED.A.2", "Create equations in two or more variables to represent relationships between quantities; graph equations on coordinate axes with labels and scales."],
      ["HSA-REI.A.1", "Explain each step in solving a simple equation as following from the equality of numbers asserted at the previous step, starting from the assumption that the original equation has a solution. Construct a viable argument to justify a solution method."],
      ["HSA-REI.A.2", "Solve simple rational and radical equations in one variable, and give examples showing how extraneous solutions may arise."],
      ["HSA-REI.B.3", "Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters."],
      ["HSA-REI.B.4", "Solve quadratic equations in one variable (by inspection, taking square roots, completing the square, the quadratic formula, and factoring)."],
      ["HSA-REI.C.5", "Prove that, given a system of two equations in two variables, replacing one equation by the sum of that equation and a multiple of the other produces a system with the same solutions."],
      ["HSA-REI.C.6", "Solve systems of linear equations exactly and approximately (e.g., with graphs), focusing on pairs of linear equations in two variables."],
      ["HSA-REI.C.8", "(+) Represent a system of linear equations as a single matrix equation in a vector variable."],
      ["HSA-REI.C.9", "(+) Find the inverse of a matrix if it exists and use it to solve systems of linear equations (using technology for matrices of dimension 3 × 3 or greater)."],
      ["HSA-REI.D.10", "Understand that the graph of an equation in two variables is the set of all its solutions plotted in the coordinate plane, often forming a curve (which could be a line)."],
      ["HSA-REI.D.11", "Explain why the x-coordinates of the points where the graphs of the equations y = f(x) and y = g(x) intersect are the solutions of the equation f(x) = g(x); find the solutions approximately, e.g., using technology to graph the functions, make tables of values, or find successive approximations."],
      ["HSA-REI.D.12", "Graph the solutions to a linear inequality in two variables as a half-plane (excluding the boundary in the case of a strict inequality), and graph the solution set to a system of linear inequalities in two variables as the intersection of the corresponding half-planes."],
      ["HSF-IF.A.1", "Understand that a function from one set (the domain) to another set (the range) assigns to each element of the domain exactly one element of the range. If f is a function and x is an element of its domain, then f(x) denotes the output of f corresponding to the input x. The graph of f is the graph of the equation y = f(x)."],
      ["HSF-IF.A.2", "Use function notation, evaluate functions for inputs in their domains, and interpret statements that use function notation in terms of a context."],
      ["HSF-IF.A.3", "Recognize that sequences are functions, sometimes defined recursively, whose domain is a subset of the integers."],
      ["HSF-IF.B.5", "Relate the domain of a function to its graph and, where applicable, to the quantitative relationship it describes."],
      ["HSF-IF.B.6", "Calculate and interpret the average rate of change of a function (presented symbolically or as a table) over a specified interval. Estimate the rate of change from a graph."],
      ["HSF-IF.C.7", "Graph functions expressed symbolically and show key features of the graph, by hand in simple cases and using technology for more complicated cases (linear, quadratic, square root, piecewise, exponential, logarithmic, and trigonometric functions)."],
      ["HSF-IF.C.8", "Write a function defined by an expression in different but equivalent forms to reveal and explain different properties of the function."],
      ["HSF-BF.A.1", "Write a function that describes a relationship between two quantities (including combining functions by arithmetic operations and composing functions)."],
      ["HSF-BF.A.2", "Write arithmetic and geometric sequences both recursively and with an explicit formula, use them to model situations, and translate between the two forms."],
      ["HSF-BF.B.3", "Identify the effect on the graph of replacing f(x) by f(x) + k, k f(x), f(kx), and f(x + k) for specific values of k (both positive and negative); find the value of k given the graphs. Include recognizing even and odd functions from their graphs and algebraic expressions for them."],
      ["HSF-BF.B.4", "Find inverse functions."],
      ["HSF-BF.B.5", "(+) Understand the inverse relationship between exponents and logarithms and use this relationship to solve problems involving logarithms and exponents."],
      ["HSF-LE.A.1", "Distinguish between situations that can be modeled with linear functions and with exponential functions."],
      ["HSF-LE.A.2", "Construct linear and exponential functions, including arithmetic and geometric sequences, given a graph, a description of a relationship, or two input-output pairs (include reading these from a table)."],
      ["HSF-LE.A.4", "For exponential models, express as a logarithm the solution to ab^(ct) = d where a, c, and d are numbers and the base b is 2, 10, or e; evaluate the logarithm using technology."],
      ["HSF-LE.B.5", "Interpret the parameters in a linear or exponential function in terms of a context."],
      ["HSF-TF.A.1", "Understand radian measure of an angle as the length of the arc on the unit circle subtended by the angle."],
      ["HSF-TF.A.2", "Explain how the unit circle in the coordinate plane enables the extension of trigonometric functions to all real numbers, interpreted as radian measures of angles traversed counterclockwise around the unit circle."],
      ["HSF-TF.A.3", "(+) Use special triangles to determine geometrically the values of sine, cosine, tangent for π/3, π/4 and π/6, and use the unit circle to express the values of sine, cosine, and tangent for π−x, π+x, and 2π−x in terms of their values for x, where x is any real number."],
      ["HSF-TF.B.5", "Choose trigonometric functions to model periodic phenomena with specified amplitude, frequency, and midline."],
      ["HSF-TF.C.8", "Prove the Pythagorean identity sin²(θ) + cos²(θ) = 1 and use it to find sin(θ), cos(θ), or tan(θ) given sin(θ), cos(θ), or tan(θ) and the quadrant of the angle."],
      ["HSF-TF.C.9", "(+) Prove the addition and subtraction formulas for sine, cosine, and tangent and use them to solve problems."],
      ["HSG-CO.C.10", "Prove theorems about triangles. Theorems include: measures of interior angles of a triangle sum to 180°; base angles of isosceles triangles are congruent; the segment joining midpoints of two sides of a triangle is parallel to the third side and half the length; the medians of a triangle meet at a point."],
      ["HSG-SRT.A.1", "Verify experimentally the properties of dilations given by a center and a scale factor."],
      ["HSG-SRT.C.6", "Understand that by similarity, side ratios in right triangles are properties of the angles in the triangle, leading to definitions of trigonometric ratios for acute angles."],
      ["HSG-SRT.C.8", "Use trigonometric ratios and the Pythagorean Theorem to solve right triangles in applied problems."],
      ["HSG-SRT.D.9", "(+) Derive the formula A = 1/2 ab sin(C) for the area of a triangle by drawing an auxiliary line from a vertex perpendicular to the opposite side."],
      ["HSG-SRT.D.10", "(+) Prove the Laws of Sines and Cosines and use them to solve problems."],
      ["HSG-SRT.D.11", "(+) Understand and apply the Law of Sines and the Law of Cosines to find unknown measurements in right and non-right triangles (e.g., surveying problems, resultant forces)."],
      ["HSG-GPE.B.5", "Prove the slope criteria for parallel and perpendicular lines and use them to solve geometric problems (e.g., find the equation of a line parallel or perpendicular to a given line that passes through a given point)."],
      ["HSG-GMD.A.3", "Use volume formulas for cylinders, pyramids, cones, and spheres to solve problems."],
      ["HSS-ID.A.1", "Represent data with plots on the real number line (dot plots, histograms, and box plots)."],
      ["HSS-ID.A.2", "Use statistics appropriate to the shape of the data distribution to compare center (median, mean) and spread (interquartile range, standard deviation) of two or more different data sets."],
      ["HSS-ID.A.3", "Interpret differences in shape, center, and spread in the context of the data sets, accounting for possible effects of extreme data points (outliers)."],
      ["HSS-ID.A.4", "Use the mean and standard deviation of a data set to fit it to a normal distribution and to estimate population percentages. Recognize that there are data sets for which such a procedure is not appropriate. Use calculators, spreadsheets, and tables to estimate areas under the normal curve."],
      ["HSS-ID.B.6", "Represent data on two quantitative variables on a scatter plot, and describe how the variables are related."],
      ["HSS-ID.C.7", "Interpret the slope (rate of change) and the intercept (constant term) of a linear model in the context of the data."],
      ["HSS-ID.C.8", "Compute (using technology) and interpret the correlation coefficient of a linear fit."],
      ["HSS-ID.C.9", "Distinguish between correlation and causation."],
      ["HSS-IC.A.1", "Understand statistics as a process for making inferences about population parameters based on a random sample from that population."],
      ["HSS-IC.A.2", "Decide if a specified model is consistent with results from a given data-generating process, e.g., using simulation."],
      ["HSS-IC.B.4", "Use data from a sample survey to estimate a population mean or proportion; develop a margin of error through the use of simulation models for random sampling."],
      ["HSS-CP.A.1", "Describe events as subsets of a sample space (the set of outcomes) using characteristics (or categories) of the outcomes, or as unions, intersections, or complements of other events (“or,” “and,” “not”)."],
      ["HSS-CP.A.2", "Understand that two events A and B are independent if the probability of A and B occurring together is the product of their probabilities, and use this characterization to determine if they are independent."],
      ["HSS-CP.A.3", "Understand the conditional probability of A given B as P(A and B)/P(B), and interpret independence of A and B as saying that the conditional probability of A given B is the same as the probability of A."],
      ["HSS-CP.B.7", "Apply the Addition Rule, P(A or B) = P(A) + P(B) − P(A and B), and interpret the answer in terms of the model."]
    ];

    /* ---------- build the list ---------- */
    var BYCODE = {},
      LIST = [];
    RAW.forEach(function(r) {
      var code = r[0],
        text = r[1],
        plus = false,
        m, grade, area = "",
        domain = "";
      if (text.indexOf("(+) ") === 0) {
        plus = true;
        text = text.slice(4);
      }
      if ((m = /^(K|\d)\.([A-Z]+)\.[A-Z]\.\d+$/.exec(code))) {
        grade = m[1];
        domain = DOM[m[2]];
      } else if ((m = /^HS([NAFGS])-([A-Z]+)\.[A-Z]\.\d+$/.exec(code))) {
        grade = "HS";
        var hd = HSDOM[m[1] + "-" + m[2]];
        area = hd[0];
        domain = hd[1];
      }
      if (!domain) return; // a mistyped code: leave it out rather than break
      var s = { code: code, grade: grade, domain: domain, text: text };
      if (area) s.area = area;
      if (plus) s.plus = true;
      BYCODE[code] = s;
      LIST.push(s);
    });

    function gradeRank(g) { return g === "HS" ? 99 : g === "K" ? 0 : +g; }
    LIST.sort(function(a, b) {
      if (gradeRank(a.grade) !== gradeRank(b.grade)) return gradeRank(a.grade) - gradeRank(b.grade);
      var ka = a.code.replace(/\.[A-Z]\.\d+$/, ""),
        kb = b.code.replace(/\.[A-Z]\.\d+$/, "");
      if (ka !== kb) return ka < kb ? -1 : 1;
      var pa = a.code.match(/\.([A-Z])\.(\d+)$/),
        pb = b.code.match(/\.([A-Z])\.(\d+)$/);
      if (pa[1] !== pb[1]) return pa[1] < pb[1] ? -1 : 1;
      return +pa[2] - +pb[2];
    });

    /* ---------- which helper teaches what ----------
       page(id, name, common, beyond, [tab key, tab name, codes], ...)
       common: standards shown on every tab; key "" is a group that no single tab shows (it counts for the whole page).
       Codes are separated by spaces. */
    var PAGES = [];

    function page(id, name, common, beyond, modes) {
      var p = { id: id, name: name, beyond: beyond || "", common: split(common), modes: [] };
      modes.forEach(function(m) { p.modes.push({ key: m[0], name: m[1], codes: split(m[2]) }); });
      PAGES.push(p);
    }

    function split(s) { return s ? String(s).split(/\s+/).filter(Boolean) : []; }

    page("addition", "Addition", "", "", [
      ["dec", "Decimals", "2.NBT.B.5 2.NBT.B.7 3.NBT.A.2 4.NBT.B.4 5.NBT.B.7 6.NS.B.3"],
      ["frac", "Fractions", "4.NF.B.3 5.NF.A.1"]
    ]);
    page("subtraction", "Subtraction", "", "", [
      ["dec", "Decimals", "2.NBT.B.5 2.NBT.B.7 3.NBT.A.2 4.NBT.B.4 5.NBT.B.7 6.NS.B.3"],
      ["frac", "Fractions", "4.NF.B.3 5.NF.A.1"]
    ]);
    page("multiplication", "Multiplication", "", "", [
      ["dec", "Decimals", "3.OA.C.7 4.NBT.B.5 5.NBT.B.5 5.NBT.B.7 6.NS.B.3"],
      ["frac", "Fractions", "4.NF.B.4 5.NF.B.4 5.NF.B.6"]
    ]);
    page("division", "Division", "", "", [
      ["remainder", "Quotient and remainder", "3.OA.C.7 4.NBT.B.6 5.NBT.B.6 6.NS.B.2"],
      ["fraction", "Answer as a fraction", "5.NF.B.3"],
      ["decimal", "Answer as a decimal", "5.NBT.B.7 6.NS.B.3"],
      ["", "Fractions as the numbers", "5.NF.B.7 6.NS.A.1"]
    ]);
    page("fractions", "Fractions", "", "", [
      ["simplify", "Simplify", "3.NF.A.3 4.NF.A.1"],
      ["convert", "Convert", "4.NF.B.3 4.NF.C.5 4.NF.C.6 5.NF.B.3 6.RP.A.3 7.NS.A.2 8.NS.A.1"],
      ["compare", "Compare and order", "3.NF.A.3 4.NF.A.2 5.NBT.A.3 6.NS.C.7"],
      ["equiv", "Equivalent fractions", "3.NF.A.3 4.NF.A.1"]
    ]);
    page("percents", "Percents", "", "", [
      ["of", "Percent of a number", "6.RP.A.3"],
      ["what", "What percent", "6.RP.A.3"],
      ["whole", "Find the whole", "6.RP.A.3"],
      ["change", "Percent change", "7.RP.A.3 7.EE.B.3"],
      ["money", "Discounts, tax, tips, interest", "7.RP.A.3 7.EE.B.3"]
    ]);
    page("factors", "Factors and Primes", "", "", [
      ["factors", "Factors", "4.OA.B.4"],
      ["prime", "Prime factorization", "4.OA.B.4"],
      ["test", "Prime or composite?", "4.OA.B.4"],
      ["gcf", "GCF and LCM", "6.NS.B.4"],
      ["div", "Divisibility", "4.OA.B.4"]
    ]);
    page("integers", "Negative Numbers", "", "", [
      ["add", "Add", "6.NS.C.5 7.NS.A.1"],
      ["sub", "Subtract", "6.NS.C.5 7.NS.A.1"],
      ["muldiv", "Multiply and divide", "7.NS.A.2"],
      ["abs", "Absolute value and compare", "6.NS.C.5 6.NS.C.6 6.NS.C.7"],
      ["chain", "Several steps", "7.NS.A.1 7.NS.A.2 7.NS.A.3"]
    ]);
    page("ratios", "Ratios", "", "", [
      ["simplify", "Simplify and equivalent ratios", "6.RP.A.1 6.RP.A.3"],
      ["rate", "Unit rate", "6.RP.A.2 6.RP.A.3 7.RP.A.1"],
      ["prop", "Proportions", "6.RP.A.3 7.RP.A.2 7.RP.A.3"],
      ["share", "Share in a ratio", "6.RP.A.1 6.RP.A.3"],
      ["scale", "Scale", "7.RP.A.2 7.G.A.1"]
    ]);
    page("exponents", "Exponents", "", "", [
      ["eval", "Powers", "5.NBT.A.2 6.EE.A.1 8.EE.A.1"],
      ["laws", "Exponent laws", "8.EE.A.1 HSA-SSE.A.2"],
      ["sci", "Scientific notation", "5.NBT.A.2 8.EE.A.3 8.EE.A.4"],
      ["scicalc", "Scientific notation math", "8.EE.A.3 8.EE.A.4"],
      ["roots", "Roots", "8.EE.A.2 8.NS.A.2"]
    ]);
    page("pemdas", "Order of Operations", "5.OA.A.1 6.EE.A.1 6.EE.A.2", "", []);
    page("algebra", "Algebra", "", "", [
      ["simplify", "Simplify expressions", "6.EE.A.3 6.EE.A.4 7.EE.A.1"],
      ["solve", "Solve equations", "6.EE.B.7 7.EE.B.4 8.EE.C.7 HSA-REI.A.1 HSA-REI.B.3"],
      ["ineq", "Inequalities", "6.EE.B.8 7.EE.B.4 HSA-REI.B.3"],
      ["sys", "Systems of equations", "8.EE.C.8 HSA-REI.C.5 HSA-REI.C.6"]
    ]);
    page("lines", "Lines and Slope", "", "", [
      ["slope", "Slope", "8.EE.B.5 8.EE.B.6 8.F.B.4 HSF-IF.B.6"],
      ["equation", "Equation of a line", "8.EE.B.6 8.F.B.4 HSF-LE.A.2 HSA-CED.A.2"],
      ["convert", "Convert forms", "8.EE.B.6 8.F.A.3"],
      ["graph", "Graph it", "8.F.A.3 HSA-REI.D.10 HSF-IF.C.7"],
      ["parallel", "Parallel and perpendicular", "HSG-GPE.B.5"]
    ]);
    page("graphing", "Graphing", "", "", [
      ["points", "Points", "5.G.A.1 5.G.A.2 6.NS.C.6"],
      ["table", "Table of values", "5.OA.B.3 6.EE.C.9 8.F.A.1"],
      ["functions", "Functions", "8.F.A.3 HSF-IF.C.7"],
      ["systems", "Systems", "8.EE.C.8 HSA-REI.C.6 HSA-REI.D.11"],
      ["inequalities", "Inequalities", "6.EE.B.8 HSA-REI.D.12"],
      ["transform", "Transformations", "8.G.A.1 8.G.A.2 8.G.A.3 8.G.A.4 HSG-SRT.A.1"],
      ["scatter", "Scatter plots", "8.SP.A.1 8.SP.A.2 8.SP.A.3 HSS-ID.B.6 HSS-ID.C.7 HSS-ID.C.8 HSS-ID.C.9"],
      ["free", "Free plot", "HSF-IF.C.7"]
    ]);
    page("geometry", "Geometry", "", "", [
      ["area", "Area and perimeter", "3.MD.C.7 3.MD.D.8 4.MD.A.3 6.G.A.1 7.G.B.4 7.G.B.6"],
      ["vol", "Volume and surface area", "5.MD.C.3 5.MD.C.5 6.G.A.2 6.G.A.4 7.G.B.6 8.G.C.9 HSG-GMD.A.3"],
      ["right", "Right triangles", "8.G.B.6 8.G.B.7"],
      ["angle", "Angles", "4.MD.C.7 7.G.B.5 8.G.A.5 HSG-CO.C.10"],
      ["figures", "Figures", "4.G.A.1"]
    ]);
    page("stats", "Statistics", "", "", [
      ["center", "Mean, median, mode, range", "6.SP.A.2 6.SP.A.3 6.SP.B.5 HSS-ID.A.2"],
      ["box", "Box plot and quartiles", "6.SP.B.4 6.SP.B.5 HSS-ID.A.1 HSS-ID.A.3"],
      ["freq", "Frequency tables", "3.MD.B.3 6.SP.B.4 HSS-ID.A.1"],
      ["spread", "Spread", "6.SP.A.3 6.SP.B.5 HSS-ID.A.2"],
      ["missing", "Missing value", "6.SP.A.3 6.SP.B.5"]
    ]);
    page("probability", "Probability", "", "", [
      ["simple", "One event", "7.SP.C.5 7.SP.C.7"],
      ["complement", "Not happening", "7.SP.C.5 7.SP.C.7 HSS-CP.A.1"],
      ["compound", "Two events", "7.SP.C.8 HSS-CP.A.2 HSS-CP.A.3 HSS-CP.B.7"],
      ["space", "All the outcomes", "7.SP.C.7 7.SP.C.8"],
      ["expected", "Expected and experiments", "7.SP.C.6 7.SP.C.7"]
    ]);
    page("wordproblems", "Story Problems", "1.OA.A.1 2.OA.A.1 3.OA.A.3 3.OA.D.8 4.OA.A.2 4.OA.A.3 6.RP.A.3", "", []);
    page("scratch", "Scratch Paper", "2.NBT.B.5 3.NBT.A.2 4.NBT.B.4 4.NBT.B.5 4.NBT.B.6 5.NBT.B.5 5.NBT.B.6 5.NBT.B.7 6.NS.B.2 6.NS.B.3", "", []);
    page("trigonometry", "Trigonometry", "", "", [
      ["right", "Right triangles", "HSG-SRT.C.6 HSG-SRT.C.8"],
      ["special", "Special angles", "HSG-SRT.C.6 HSF-TF.A.3"],
      ["circle", "Unit circle", "HSF-TF.A.1 HSF-TF.A.2 HSF-TF.A.3"],
      ["laws", "Sines and cosines laws", "HSG-SRT.D.9 HSG-SRT.D.10 HSG-SRT.D.11"],
      ["graph", "Graphs", "HSF-IF.C.7 HSF-TF.B.5 HSF-BF.B.3"],
      ["identities", "Identities", "HSF-TF.C.8 HSF-TF.C.9"]
    ]);
    page("calculus", "Calculus", "", "Calculus is beyond Common Core. The nearest high school idea is rate of change.", [
      ["limit", "Limits", ""],
      ["derivative", "Derivatives", ""],
      ["tangent", "Tangent lines", ""],
      ["extrema", "Max and min", ""],
      ["integral", "Integrals", ""],
      ["rate", "Rates of change", "HSF-IF.B.6"]
    ]);
    page("number-sense", "Number Sense", "", "", [
      ["place", "Place value", "1.NBT.C.5 2.NBT.A.1 2.NBT.A.3 2.NBT.B.8 4.NBT.A.1 4.NBT.A.2 5.NBT.A.1 5.NBT.A.3"],
      ["round", "Rounding", "3.NBT.A.1 4.NBT.A.3 5.NBT.A.4"],
      ["estimate", "Estimating", "3.NBT.A.1 3.OA.D.8 4.OA.A.3"],
      ["compare", "Compare and order", "1.NBT.B.3 2.NBT.A.4 4.NBT.A.2 5.NBT.A.3 6.NS.C.7"],
      ["skip", "Skip counting", "2.NBT.A.2 2.OA.C.3 3.OA.D.9"],
      ["time", "Telling time", "1.MD.B.3 2.MD.C.7 3.MD.A.1"],
      ["money", "Money", "2.MD.C.8 4.MD.A.2"]
    ]);
    page("quadratics", "Quadratics", "", "", [
      ["expand", "Expand", "HSA-APR.A.1 HSA-SSE.A.2"],
      ["factor", "Factor", "HSA-SSE.A.2 HSA-SSE.B.3 HSA-APR.B.3"],
      ["solve", "Solve", "8.EE.A.2 HSA-REI.B.4 HSA-SSE.B.3 HSN-CN.C.7"],
      ["vertex", "Vertex", "HSA-SSE.B.3 HSF-IF.C.7 HSF-IF.C.8 HSF-BF.B.3"],
      ["divide", "Divide polynomials", "HSA-APR.B.2 HSA-APR.D.6"],
      ["operate", "Add and subtract", "HSA-APR.A.1"]
    ]);
    page("logarithms", "Logarithms", "", "", [
      ["meaning", "What a log is", "HSF-LE.A.4 HSF-BF.B.5"],
      ["laws", "Log laws", "HSF-BF.B.5"],
      ["change", "Change of base", "HSF-LE.A.4"],
      ["expeq", "Exponential equations", "HSF-LE.A.4"],
      ["logeq", "Log equations", "HSF-LE.A.4 HSF-BF.B.5"],
      ["growth", "Growth and interest", "HSF-LE.A.1 HSF-LE.A.4 HSF-LE.B.5"],
      ["graph", "Graphs", "HSF-IF.C.7 HSF-BF.B.3"]
    ]);
    page("sequences", "Sequences", "", "", [
      ["pattern", "What comes next?", "3.OA.D.9 4.OA.C.5 5.OA.B.3"],
      ["arith", "Arithmetic sequences", "HSF-IF.A.3 HSF-BF.A.2 HSF-LE.A.2"],
      ["geom", "Geometric sequences", "HSF-IF.A.3 HSF-BF.A.2 HSF-LE.A.2"],
      ["sum", "Series and sums", "HSA-SSE.B.4"],
      ["apply", "Word problems", "HSF-BF.A.1 HSF-BF.A.2 HSF-LE.B.5 HSA-SSE.B.4"]
    ]);
    page("unit-conversions", "Unit Conversions", "", "", [
      ["length", "Length", "4.MD.A.1 5.MD.A.1"],
      ["weight", "Weight and capacity", "4.MD.A.1 5.MD.A.1"],
      ["metric", "Metric", "4.MD.A.1 5.MD.A.1"],
      ["systems", "Between systems", "6.RP.A.3 HSN-Q.A.1"],
      ["time", "Time", "3.MD.A.1 4.MD.A.1 4.MD.A.2"],
      ["temp", "Temperature", "HSN-Q.A.1"],
      ["rates", "Rates, area and volume", "6.RP.A.3 7.RP.A.1 HSN-Q.A.1"]
    ]);
    page("money-math", "Money Math", "", "", [
      ["compound", "Compound interest", "7.RP.A.3 HSF-LE.A.1 HSF-LE.A.2 HSF-LE.B.5"],
      ["save", "Saving monthly", "HSA-SSE.B.4 HSF-LE.B.5"],
      ["loan", "Loans", "HSA-SSE.B.4 HSF-LE.B.5"],
      ["card", "Credit cards", "7.RP.A.3 HSF-LE.B.5"],
      ["pay", "Paychecks", "6.RP.A.3 7.RP.A.3"],
      ["budget", "Budgets", "6.RP.A.3 7.EE.B.3"],
      ["shop", "Shopping", "6.RP.A.2 6.RP.A.3 7.RP.A.3"]
    ]);
    page("functions", "Functions", "", "", [
      ["eval", "Evaluate", "8.F.A.1 HSF-IF.A.1 HSF-IF.A.2"],
      ["func", "Is it a function?", "8.F.A.1 HSF-IF.A.1"],
      ["domain", "Domain and range", "HSF-IF.A.1 HSF-IF.B.5"],
      ["combine", "Combine", "HSF-BF.A.1"],
      ["compose", "Compose", "HSF-BF.A.1"],
      ["inverse", "Inverse", "HSF-BF.B.4"],
      ["piece", "Piecewise", "HSF-IF.C.7"],
      ["parity", "Even or odd", "HSF-BF.B.3"]
    ]);
    page("radicals", "Radicals", "", "", [
      ["simplify", "Simplify roots", "8.EE.A.2 HSN-RN.A.2"],
      ["operate", "Add and multiply roots", "HSN-RN.A.2"],
      ["rationalize", "Rationalize", "HSN-RN.A.2"],
      ["exponents", "Fraction exponents", "HSN-RN.A.1 HSN-RN.A.2"],
      ["radeq", "Radical equations", "HSA-REI.A.2"],
      ["ratsimp", "Simplify rational expressions", "HSA-APR.D.6 HSA-APR.D.7"],
      ["ratmul", "Multiply and divide rational expressions", "HSA-APR.D.7"],
      ["ratadd", "Add and subtract rational expressions", "HSA-APR.D.7"],
      ["rateq", "Rational equations", "HSA-REI.A.2"]
    ]);
    page("complex-numbers", "Complex Numbers", "", "", [
      ["i", "What i is", "HSN-CN.A.1"],
      ["add", "Add and subtract", "HSN-CN.A.2"],
      ["mul", "Multiply", "HSN-CN.A.2"],
      ["div", "Divide", "HSN-CN.A.3"],
      ["plane", "The plane", "HSN-CN.B.4 HSN-CN.B.5 HSN-CN.B.6"],
      ["polar", "Polar form", "HSN-CN.B.4"],
      ["demoivre", "De Moivre", "HSN-CN.B.4 HSN-CN.B.5"],
      ["solve", "Solve", "HSN-CN.C.7 HSN-CN.C.9"]
    ]);
    page("college-statistics", "College Statistics", "", "Most of this helper goes past high school. The standards listed are the nearest ones.", [
      ["z", "z-scores", "HSS-ID.A.4"],
      ["normal", "Normal distribution", "HSS-ID.A.4"],
      ["binom", "Binomial", ""],
      ["sampling", "Sampling (CLT)", "HSS-IC.A.1 HSS-IC.B.4"],
      ["ci", "Confidence intervals", "HSS-IC.B.4"],
      ["test", "Hypothesis tests", "HSS-IC.A.2"],
      ["regress", "Regression", "HSS-ID.B.6 HSS-ID.C.7 HSS-ID.C.8"]
    ]);
    page("matrices-and-vectors", "Matrices and Vectors", "", "Dot and cross products go past Common Core.", [
      ["arith", "Add and scale", "HSN-VM.C.6 HSN-VM.C.7 HSN-VM.C.8"],
      ["mult", "Multiply", "HSN-VM.C.8 HSN-VM.C.9"],
      ["det", "Determinant", "HSN-VM.C.10 HSN-VM.C.12"],
      ["inv", "Inverse", "HSN-VM.C.10 HSA-REI.C.9"],
      ["sys", "Solve a system", "HSA-REI.C.6 HSA-REI.C.8 HSA-REI.C.9"],
      ["vec", "Vectors", "HSN-VM.A.1 HSN-VM.A.2 HSN-VM.A.3 HSN-VM.B.4 HSN-VM.B.5"],
      ["dot", "Dot and cross products", ""]
    ]);

    var PAGEBY = {};
    PAGES.forEach(function(p) { PAGEBY[p.id] = p; });

    /* ---------- the API ---------- */
    function objs(codes) {
      var seen = {},
        out = [];
      codes.forEach(function(c) {
        if (!seen[c] && BYCODE[c]) {
          seen[c] = 1;
          out.push(BYCODE[c]);
        }
      });
      out.sort(function(a, b) { return LIST.indexOf(a) - LIST.indexOf(b); });
      return out;
    }

    function shortOf(name) {
      var n = String(name || "").split(/[?#]/)[0].replace(/^.*\//, "").replace(/\.html$/i, "").toLowerCase();
      if (G.HelperSite && G.HelperSite.id) { var k = G.HelperSite.id(name); if (k) n = k.replace(/\.html$/, ""); }
      return n;
    }

    function forPage(name, mode) {
      var p = PAGEBY[shortOf(name)];
      if (!p) return [];
      var codes = p.common.slice(),
        found = false;
      if (mode) {
        p.modes.forEach(function(m) {
          if (m.key && m.key === mode) {
            codes = codes.concat(m.codes);
            found = true;
          }
        });
      }
      if (!found) {
        codes = p.common.slice();
        p.modes.forEach(function(m) { codes = codes.concat(m.codes); });
      }
      return objs(codes);
    }

    function beyond(name) { var p = PAGEBY[shortOf(name)]; return p ? p.beyond : ""; }

    function pagesFor(code) {
      var out = [];
      PAGES.forEach(function(p) {
        if (p.common.indexOf(code) >= 0) out.push({ page: p.id, name: p.name, mode: "", modeName: "" });
        p.modes.forEach(function(m) {
          if (m.codes.indexOf(code) >= 0) out.push({ page: p.id, name: p.name, mode: m.key, modeName: m.name });
        });
      });
      return out;
    }

    function gradeWords(s) {
      return s.grade === "HS" ? "high school hs" : s.grade === "K" ? "grade k kindergarten" : "grade " + s.grade + " grade" + s.grade + " " + s.grade + "th";
    }

    function search(text) {
      var q = String(text || "").toLowerCase().replace(/\s+/g, " ").trim(),
        gr = "";
      var gm = /\bgrade\s*(k|\d{1,2})\b/.exec(q);
      if (gm) {
        gr = gm[1];
        q = q.replace(gm[0], " ").trim();
      }
      if (/\b(high school|hs)\b/.test(q)) {
        gr = "hs";
        q = q.replace(/\b(high school|hs)\b/, " ").trim();
      }
      var toks = q ? q.split(" ").filter(Boolean) : [];
      var out = [];
      LIST.forEach(function(s) {
        if (gr && String(s.grade).toLowerCase() !== gr) return;
        var pg = pagesFor(s.code);
        var hay = (s.code + " " + gradeWords(s) + " " + s.domain + " " + (s.area || "") + " " + s.text + " " + (s.plus ? "plus advanced" : "") + " " +
          pg.map(function(x) { return x.name + " " + x.modeName; }).join(" ")).toLowerCase();
        for (var i = 0; i < toks.length; i++)
          if (hay.indexOf(toks[i]) < 0) return;
        out.push({ standard: s, pages: pg });
      });
      return out;
    }

    function pageUrl(name, params) {
      return G.HelperSite ? G.HelperSite.url(name, params) : (name === "standards" ? "../reference/standards.html" : name) + (params ? "?" + params : "");
    }

    function url(code) { return pageUrl("standards", code ? "q=" + encodeURIComponent(code) : ""); }

    var API = {
      list: LIST,
      pages: PAGES,
      byCode: function(c) { return BYCODE[c] || null; },
      forPage: forPage,
      beyond: beyond,
      pagesFor: pagesFor,
      search: search,
      url: url,
      pageUrl: pageUrl
    };
    G.HelperStandards = API;

    /* ---------- the line under the heading of a helper page ---------- */
    if (!D || !D.documentElement) return;
    var here = (G.HelperSite && G.HelperSite.here) || (G.location.pathname.split("/").pop() || "");
    var id = shortOf(here);
    if (!PAGEBY[id]) return; // the home page, the Standards page, practice pages: no line
    var root = D.documentElement,
      line = null,
      shown = "",
      timer = 0;

    var CSS = ".std-line{margin:.55em 0 0;font-size:12.5px;line-height:1.5;color:var(--ink-3,#7B8681);max-width:70ch}" +
      ".std-line b{font-family:var(--f-mono,Consolas,monospace);font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;margin-right:6px}" +
      ".std-line a{font-family:var(--f-mono,Consolas,monospace);font-size:11.5px;color:var(--ink-2,#4A5550);text-decoration:underline dotted;" +
      "text-underline-offset:.2em;white-space:nowrap}" +
      ".std-line a:hover,.std-line a:focus-visible{color:var(--ink,#18201C);text-decoration-style:solid}" +
      ".std-line a:focus-visible{outline:2px solid var(--focus,#33463F);outline-offset:2px;border-radius:2px}" +
      ".std-line .sep{margin:0 4px;opacity:.6}" +
      "html.embed .std-line{display:none !important}" +
      "@media print{.std-line{display:none !important}}";

    function embedded() { return /[?&]embed=1(&|$)/.test(G.location.search) || root.classList.contains("embed"); }

    function framed() { try { return G.top !== G.self; } catch (e) { return true; } }

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

    function currentMode() {
      var b = D.querySelector("[data-mode][aria-pressed=\"true\"]") || D.querySelector("[data-m][aria-pressed=\"true\"]");
      if (b) return b.getAttribute("data-mode") || b.getAttribute("data-m") || "";
      var m = /[?&]mode=([^&#]*)/.exec(G.location.search);
      return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : "";
    }

    function paint() {
      if (!line) return;
      var mode = currentMode(),
        key = id + "|" + mode;
      if (key === shown) return;
      shown = key;
      var list = forPage(id, mode),
        note = beyond(id);
      var html,
        head = "<b title=\"" + esc(tr("standards.unofficial", "An unofficial alignment to the Common Core State Standards for Mathematics")) + "\">" + tr("standards.cc", "Common Core") + "</b>";
      if (!list.length) {
        html = note ? head + tr("standards.beyond", "This part goes beyond Common Core.") :
          "";
      } else {
        html = head +
          list.map(function(s) {
            return "<a href=\"" + esc(url(s.code)) + "\" title=\"" + esc(s.code + (s.plus ? " (+)" : "") + ": " + s.text) + "\">" + esc(s.code) + "</a>";
          }).join("<span class=\"sep\" aria-hidden=\"true\">·</span> ");
        if (note) html += "<span class=\"sep\" aria-hidden=\"true\">·</span> " + esc(note);
      }
      line.innerHTML = html;
      line.hidden = !html;
    }

    function later() {
      clearTimeout(timer);
      timer = setTimeout(function() { try { paint(); } catch (e) {} }, 120);
    }

    function start() {
      try {
        if (framed() || embedded() || D.querySelector(".std-line")) return;
        var anchor = D.querySelector(".tagline") || D.querySelector("h1");
        var host = anchor ? anchor.parentNode : (D.querySelector("footer") || D.querySelector(".page"));
        if (!host) return;
        var st = D.createElement("style");
        st.textContent = CSS;
        D.head.appendChild(st);
        line = D.createElement("p");
        line.className = "std-line";
        line.setAttribute("aria-label", tr("standards.aria", "Common Core standards this page teaches (unofficial)"));
        if (anchor && anchor.nextSibling) host.insertBefore(line, anchor.nextSibling);
        else host.appendChild(line);
        paint();
        if (G.MutationObserver) new MutationObserver(later).observe(D.body, { attributes: true, subtree: true, attributeFilter: ["aria-pressed"] });
        G.addEventListener("popstate", later);
        G.addEventListener("hashchange", later);
        setTimeout(later, 600); // pages that open a tab from the address after they load
      } catch (e) { if (G.console) console.warn("standards.js:", e); }
    }
    if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", start);
    else start();
  }
})();
