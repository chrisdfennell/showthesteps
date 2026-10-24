"""Point every page at the site's own fonts (assets/fonts/fonts.css) instead of Google Fonts, so no visitor's browser
contacts Google. A page's three Google lines (two preconnects and the stylesheet) become one local stylesheet link,
with the right "../" for the page's folder. The page builders run it after writing a page.

    python scripts/fonts.py              every page
    python scripts/fonts.py FILE ...     just those
    python scripts/fonts.py --check      list pages that still load Google Fonts; change nothing"""
import io, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ("docs/", ".git/", ".github/", "scripts/")
PRE = re.compile(r'[ \t]*<link rel="preconnect" href="https://fonts\.(?:googleapis|gstatic)\.com"(?: crossorigin)?>\r?\n')
SHEET = re.compile(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2\?[^"]*">')


def fix(path, s):
    rel = os.path.relpath(path, ROOT).replace("\\", "/")
    up = "../" * rel.count("/")
    s = PRE.sub("", s)
    return SHEET.sub('<link rel="stylesheet" href="' + up + 'assets/fonts/fonts.css">', s)


def pages(args):
    if args: return [os.path.abspath(a) for a in args]
    out = []
    for f in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
        rel = os.path.relpath(f, ROOT).replace("\\", "/")
        if not rel.startswith(SKIP): out.append(f)
    return sorted(out)


def main(argv):
    check = "--check" in argv
    todo, left = pages([a for a in argv if a != "--check"]), []
    for f in todo:
        s = io.open(f, encoding="utf-8", newline="").read()
        new = fix(f, s)
        if new != s:
            left.append(os.path.relpath(f, ROOT))
            if not check: io.open(f, "w", encoding="utf-8", newline="").write(new)
    print(("still on Google Fonts: " if check else "moved to the site's fonts: ") + str(len(left)) + " of " + str(len(todo)) + " pages")
    for x in left[:20]: print("  " + x)
    return 1 if check and left else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
