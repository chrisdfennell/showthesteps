# Translating Show The Steps

The site can show itself in more than one language. English is the source of truth; every other language is a
copy of the English strings with the values translated. Spanish (`es`) is the first one: the bar, the tools on every
page, the home page, Play, Tutor me, voice and photo input, and all 44 helpers, from Addition to the Math at work
fields. Their worked steps, notices, the problem maker and Check my answer are included.

## How it works

- **`assets/i18n.js`** picks the language and looks strings up: `HelperI18n.t("addition.carry", { d: 5 })` gives the
  string in the visitor's language, else the English, else the key. Its header comment lists the whole API
  (`t`, `n`, `d`, `normalize`, `apply`, `set`, `link`, `ready`, …).
- **The strings** live in `assets/i18n/`:
  - `en.js`, `es.js`: what every page shares (`common.*`, `lang.*`, `nav.*`, `tools.*`, `play.*`, `tutor.*`,
    `voice.*`, `photo.*`, `home.*`, `help.*`).
  - `en/<page>.js`, `es/<page>.js`: one helper's own strings (keys `<page>.*`), loaded only on that page.
  Each file is one call: `HelperI18n.add("es", { "key": "value", … });`
- **Which language:** `?lang=es` in a link (kept in the page's own address and links, so Copy link, QR codes and
  embeds keep it), else the choice made earlier in this visit, else the one remembered on the device (localStorage
  `helpers-lang`), else English. A browser set to a language the site has, with nothing chosen, gets a small offer
  ("¿Ver esta página en español?") but is never switched without asking. `<html lang>` follows the choice, and
  Read aloud picks a voice for it.
- **Choosing:** the 文A button at the end of the bar, the Language row in the `?` list, or the links at the top of the
  home page. Pages inside the self-test always use English unless their own link asks for a language.
- **Loading:** a helper with its own strings loads `i18n.js` in its `<head>` (`<script src="../assets/i18n.js"
  data-strings="addition">`), which writes in the locale files at once, so the page's script can call `t()`
  anywhere. Every other page gets `i18n.js` and the shared files from `nav.js`, before `search.js` and `tools.js`.
  A helper's English lives only in `en/<page>.js`, so a locale file that doesn't arrive (a dropped request) is fetched
  once more before the page runs. Offline, `sw.js` has every locale file saved.

## Adding a language

1. **Copy the English:** `assets/i18n/en.js` → `assets/i18n/xx.js`, and the folder `assets/i18n/en/` →
   `assets/i18n/xx/`. In every file change `HelperI18n.add("en", …)` to `HelperI18n.add("xx", …)`.
2. **Translate the values** (never the keys). See *What to keep* below.
3. **Add it to the list** at the top of `assets/i18n.js` (one line):
   ```js
   { code: "pt", name: "Português", tag: "pt-BR", numbers: "pt-BR", dates: "pt-BR", offer: "Ver esta página em português?", yes: "Sim, em português", no: "Não, obrigado" }
   ```
   `name` is the language's name in itself (it's what the menus show). `tag` is for `<html lang>`, plural rules and
   speech. `numbers` / `dates` are the `Intl` locales used by `HelperI18n.n()` / `d()`. `offer`, `yes`, `no` are the
   words of the offer, shown before the language's own file is loaded.
4. **Add the files to `sw.js`** (the `PAGES` list) so they work offline, and change its `VERSION`.
5. **Run the checker:** `python scripts/i18n_check.py --check` (missing or extra keys, placeholders and HTML tags that
   don't match the English, keys the code uses that English lacks, nav.js's English vs. en.js).
6. **Try it** (see *Testing* below).

Optional, for typed and spoken problems: add `HelperI18n.typed("xx", { … })` at the end of `xx.js` (see
*Typed problems*), and the language's speech table `"tools.speech"` (see the one in `es.js`).

## What to keep as it is

- **Keys**, and the **`{placeholders}`** in a value: `"Write {d} under the line."` → `"Escribe {d} debajo de la línea."`.
  Move them wherever the sentence needs them. A translation may use a variable English doesn't (an article, `{art}`)
  only if the code passes it; the checker lists those differences as notes.
- **HTML tags** in a value (`<b>`, `<span class="u">`, `<kbd>`, links): keep the same tags, translate the words
  inside. Entities (`&mdash;`, `&nbsp;`) can stay or become the characters.
- **Math:** symbols and notation stay exactly (`+ − × ÷ = / % √ ^`, `3/4`, `2 3/4`, `70 R 7`). Numbers aren't
  translated.
- **Not text at all:** URLs, URL parameter names and values (`q=`, `mode=dec`, `practice=check`, `lang=`),
  `data-mode` and other data attributes, ids and classes, localStorage keys, the worksheet message API's `params`,
  `page` and option keys/values. The helpers' own names ("The Carry Column") stay as they are for now: they are the
  pages' titles.

## Plurals

`t()` picks the form with `Intl.PluralRules` for the language:

- in a value: `"{n} {n|problem|problems}"` (forms in the order *one | other*), or by name for languages with more
  forms: `"{n} {n|one:problema|other:problemas}"`, `"{n|one:…|few:…|many:…|other:…}"`; `=0` for an exact number;
- or the whole value as forms: `{ one: "{n} problem", other: "{n} problems", "=0": "no problems" }` (picked by `n`,
  or `count`).

Keep the plural variable's name as it is in English.

## Number formats

`HelperI18n.n(x)` and `HelperI18n.d(date)` write numbers and dates with `Intl` for the language's `numbers` /
`dates` locale. Spanish uses **es-US**: a decimal point and comma thousands (1,234.5), the way US schools write them
in both languages. A language whose schools use a decimal comma would set e.g. `numbers: "es-ES"` (1.234,5).

Today the helpers' worked steps still write their numbers themselves, with the decimal point; a decimal-comma
language needs those pages to write numbers through `HelperI18n.n()` (and to read a typed comma) first. That's a
setting of the language, not a translation: say so in the language's line rather than translating digits.

## Typed problems

`HelperI18n.normalize(text)` turns a problem typed (or said) in the language into what the problem readers know,
before they read it: `"tres cuartos de veinte"` → `"3/4 of 20"`, `"cuánto es 47 más 38"` → `"47 + 38"`. English, and
text it can't improve, come back unchanged. Every helper with its own strings calls it, and so does the search box.
Its data is the language's, in `xx.js`:

```js
HelperI18n.typed("es", {
  numbers: { units: { uno: 1, … veintinueve: 29 }, tens: { treinta: 30, … }, hundreds: { cien: 100, … },
             scales: { mil: 1000, millon: 1000000 }, join: ["y"] },   // treinta y ocho → 38
  denominators: { medio: 2, tercio: 3, cuarto: 4, … },                 // tres cuartos → 3/4
  denomSuffix: ["avos", "avo"],                                         // dieciochoavos → /18
  before: [[pattern, replacement], …],                                  // before the number words are read
  phrases: [[pattern, replacement], …]                                  // then, in order: words → the readers' English
});
```

Matching is done without accents and in lower case. Patterns are regular-expression strings (escape `\` as `\\`);
order matters (a specific phrase before a general one). Add a phrase to the test list in your test run, not just to
the data.

A helper's own words go in its own file, not the shared table: `<page>.typedWords` (its topic's phrases, e.g.
`{ before: [[pattern, replacement], …], after: […] }` around `normalize`) and `<page>.ck.answerWords` (answers typed
in Check my answer: "ninguno", "sí", "o"). They exist only in the translation (English needs none); the checker
accepts keys ending in `Words` as data that English doesn't have. Each helper's code says how it uses them.

Some readers aren't translated: a word problem typed in full sentences on Trigonometry, Calculus (optimization,
related rates), Graphing (optimization), Counting, College statistics and Matrices is still read in English, and the page says so ("por ahora, en
inglés"). The Story Problem page reads simple Spanish stories by turning them into English first; when a word is
new to it, it says so instead of guessing.

## Glossary (Spanish)

Latin American / US school Spanish, informal *tú*. Keep these the same everywhere:

| English | Español |
|---|---|
| Show all work · One step at a time · Check my answer | Ver todo el procedimiento · Un paso a la vez · Revisar mi respuesta |
| The work · Say it out loud · Show a hint · Show me the work | El procedimiento · Dilo en voz alta · Ver una pista · Ver el procedimiento |
| Tutor me · Play · New problem · Copy link | Guíame · Reproducir · Problema nuevo · Copiar enlace |
| Correct! · Not quite — try again. | ¡Correcto! · Todavía no — inténtalo otra vez. |
| sum · addend · difference · product · factor | suma · sumando · diferencia · producto · factor |
| quotient · remainder · dividend · divisor · long division | cociente · residuo · dividendo · divisor · división larga |
| carry · borrow · regroup | llevar ("se lleva 1") · pedir prestado · reagrupar |
| place value · ones, tens, hundreds, thousands | valor posicional · unidades, decenas, centenas, unidades de millar |
| tenths, hundredths, thousandths · decimal point | décimos, centésimos, milésimos · punto decimal |
| estimate · round | estimación · redondear |
| fraction · numerator · denominator · common denominator | fracción · numerador · denominador · denominador común |
| simplify · simplest form · equivalent | simplificar · mínima expresión · equivalente |
| mixed number · improper fraction · whole number · reciprocal | número mixto · fracción impropia · número entero · recíproco |
| GCF · LCM · prime · multiple | MCD (máximo común divisor) · mcm (mínimo común múltiplo) · primo · múltiplo |
| percent · percent change · increase / decrease · the whole | porcentaje, por ciento · cambio porcentual · aumento / disminución · el total |
| discount · sales tax · tip · markup · simple interest | descuento · impuesto sobre la venta · propina · recargo · interés simple |
| tape diagram · area model · number line | diagrama de cinta · modelo de área · recta numérica |
| hint · tip (advice) | pista · consejo |
| 1/2, 3/4, 5/6, 7/12 read aloud | un medio, tres cuartos, cinco sextos, siete doceavos |

## Testing

- `python scripts/i18n_check.py --check` must pass (0 problems).
- Open pages with `?lang=xx` (and `?lang=en` to get back): the bar, the tools (`?`), a few problems in each practice
  mode, the problem maker, Check my answer (a wrong answer, a hint, a right one), Read aloud, Play, Tutor me. Nothing
  English should be left, no `{placeholder}` or raw key (`addition.carry`) should show, and the answers must be the
  same numbers as in English.
- With no language chosen, every page must show exactly what it showed before: the site's self-test
  (`tests/self-test.html?run=1`) reads the English.
- Light and dark, and a phone-width window (390 px): longer words must still fit their buttons.

## Not translated yet

The lessons, reference sheets, practice pages, the standards' own wording (the Common Core line's tooltips) and the
definitions in the pop-ups (their "More →" link is translated; a word whose `glossary.w.<id>.term`, `.short` and
`.example` are in the language's file shows them, as the Figures tab's words do). The QR and Embed dialogs, Add to assignment, the Common
Core line, Your practice (`assign.*`, `qr.*`, `embed.*`, `standards.*`, `glossary.*`, `progress.*`) and the
screen-reader names of the math (from the speech table) follow the language. Page titles (`<title>`) and the helpers'
names stay English. A new helper: add `data-strings="<page>"` to its `i18n.js` tag, put its strings in
`en/<page>.js` with keys `<page>.*`, write `xx/<page>.js`, call `HelperI18n.normalize()` where it reads a typed
problem, and add both files to `sw.js`.
