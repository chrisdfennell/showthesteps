# Contributing

Thanks for helping! The most useful thing anyone can do is **tell us when a page gets a problem wrong, or explains a step in a confusing way**: use the ["Wrong answer or confusing step" form](https://github.com/chrisdfennell/arithmetic-helpers/issues/new/choose) and paste the page's link (every page's address holds the exact problem on screen, and **Copy link** copies it).

## Running it locally

There's nothing to install and no build step: every page is plain HTML and JavaScript.

```sh
git clone https://github.com/chrisdfennell/arithmetic-helpers.git
cd arithmetic-helpers
python -m http.server 8000
```

Then open <http://localhost:8000/>. (Opening the files straight from disk mostly works, but the self-test, practice sets and the worksheet maker need a local server, because they look inside other pages.)

## The self-test

Open <http://localhost:8000/tests/self-test.html> and press **Run**. It checks every helper: known answers, Check my answer, problems from each page's problem maker re-worked by separate code, and every made problem reopened from its link. **Thorough** tries every problem-maker option. `?run=1` starts it straight away, `&depth=thorough` runs the long version and `&pages=fractions,stats` tests just those. It must end with **0 failed** before a change goes in. The same self-test also runs by itself on every pull request (the **Self-test** check, `.github/workflows/test.yml`), and can be started by hand, quick or thorough, from the repository's Actions tab.

## How the code is written

- **One page, one file.** Each helper is a single self-contained HTML file in `helpers/`. Shared scripts are in `assets/`: `site.js` (where every page lives, and its readable address; every link between pages is made through it), `nav.js` (the bar), `tools.js` (settings, read aloud, math keys, QR button…), `search.js`, `progress.js`, `glossary.js`, `qr.js`.
- **ES5 JavaScript** (`var`, `function`), no frameworks, no build tools, so it runs anywhere and is easy to read.
- **Formatted code**: one statement per line, 2-space indent, CSS one property per line. After editing, run
  `python scripts/format.py` (it needs `pip install jsbeautifier cssbeautifier`); `--check` lists files that aren't formatted.
- **The README's numbers**: `python scripts/stats.py` recounts the pages, lines of code and characters for the
  "By the numbers" table (`--checks N` also sets the self-test count from a thorough run).
- **Exact math**: use the pages' BigInt fractions, not floating point, wherever an answer should be exact.
- **Every helper follows the same contracts**, which the worksheet maker, practice sets, progress and the self-test rely on:
  - the problem is in the address (`?q=…`, `mode=…`, `practice=all|step|check`) and kept in step with `history.replaceState`
  - the main answer is in `.answer .v`, and the first `[aria-live]` element is the Check my answer verdict
  - a `helper:checked` event (and a `postMessage` to a parent frame) after each check
  - `embed=1` for practice sets, and the `helper:options` / `helper:make` messages for the worksheet maker
  - light and dark themes from CSS variables, a print layout, and no sideways scrolling on a phone
- **Explain every step** in plain words, including *why* it comes next. The site is for learners from the early grades to first-year college.

## Commit messages set the version

Every push to `main` is released automatically, and the commit messages decide the new version number:

- a subject starting with **Add** ("Add a probability helper") → the next **minor** version
- **[major]** anywhere in the message → the next **major** version
- anything else ("Fix the carry in long multiplication") → the next **patch** version

Write the subject as a short, plain sentence about what changed for the person using the site; it becomes a line in the release notes.

## Pull requests

Keep a pull request to one change, describe what a student or teacher will notice, include a link that shows it, and run the self-test. The checklist in the pull request form covers the rest.

By contributing you agree that your work is shared under the project's [CC BY-NC 4.0 license](LICENSE), and to follow the [code of conduct](CODE_OF_CONDUCT.md).
