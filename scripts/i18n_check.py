"""Check the translations (assets/i18n/) against the English, which is the source of truth.

    python scripts/i18n_check.py            report
    python scripts/i18n_check.py --check    the same, and exit 1 when something is wrong (for CI)
    python scripts/i18n_check.py es         just one language

For every language in the list in assets/i18n.js it compares assets/i18n/<lang>.js and assets/i18n/<lang>/<page>.js
with the English files (en.js, en/<page>.js):
  - missing keys (in English, not translated)            → error
  - unused keys (translated, but not in English)          → error
  - {placeholders} that don't match, plural forms in a {n|…} that name another variable, HTML tags that differ → error
And over the site's own code:
  - keys used with a literal key — t("…"), T("…"), tr("…"), tx("…"), data-i18n="…", data-i18n-attr="…=…" —
    that English doesn't have                           → error
  - code that keeps its own English beside the key (tr("key", "English")): the two must be the same → error
  - nav.js's lists (the bar's English) and the nav.* keys in en.js must say the same → error
  - English keys no code names literally (most are built from a name, like nav.tab.<page>.<tab>)  → listed with -v
It needs nothing but Python."""
import io, os, re, sys, glob, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
I18N = os.path.join(ROOT, "assets", "i18n")
SKIP = ("docs/", ".git/", ".github/", "scripts/", "tests/")


# ---------------- a small reader for the locale files' object literals ----------------
class Reader:
    def __init__(self, s, i):
        self.s, self.i = s, i

    def ws(self):
        s = self.s
        while self.i < len(s):
            if s[self.i].isspace(): self.i += 1
            elif s.startswith("//", self.i): self.i = s.find("\n", self.i) if s.find("\n", self.i) >= 0 else len(s)
            elif s.startswith("/*", self.i): self.i = s.index("*/", self.i) + 2
            else: break

    def comma(self, close):
        """after an entry: a comma, or the closing bracket. A browser stops at anything else (a comma lost inside a
        // comment), and the whole file's strings are gone"""
        self.ws()
        c = self.s[self.i]
        if c == ",": self.i += 1
        elif c != close:
            line = self.s.count("\n", 0, self.i) + 1
            raise ValueError("line %d: a comma is missing before %r (the file wouldn't load)" % (line, self.s[self.i:self.i + 30]))

    def string(self):
        q = self.s[self.i]
        self.i += 1
        out = []
        while True:
            c = self.s[self.i]
            if c == "\\":
                n = self.s[self.i + 1]
                if n == "u":
                    out.append(chr(int(self.s[self.i + 2:self.i + 6], 16)))
                    self.i += 6
                    continue
                out.append({"n": "\n", "t": "\t", "r": "\r", "b": "\b", "0": "\0"}.get(n, n))
                self.i += 2
                continue
            if c == q:
                self.i += 1
                return "".join(out)
            out.append(c)
            self.i += 1

    def value(self):
        self.ws()
        c = self.s[self.i]
        if c in "\"'": return self.string()
        if c == "{": return self.obj()
        if c == "[":
            self.i += 1
            arr = []
            while True:
                self.ws()
                if self.s[self.i] == "]":
                    self.i += 1
                    return arr
                arr.append(self.value())
                self.comma("]")
        m = re.compile(r"-?\d+(?:\.\d+)?(?:e-?\d+)?|true|false|null").match(self.s, self.i)
        if m:
            self.i = m.end()
            t = m.group(0)
            return {"true": True, "false": False, "null": None}.get(t, float(t) if re.search(r"[.e]", t) else int(t))
        raise ValueError("can't read a value at %d: %r" % (self.i, self.s[self.i:self.i + 40]))

    def obj(self):
        self.i += 1
        out = {}
        while True:
            self.ws()
            if self.s[self.i] == "}":
                self.i += 1
                return out
            if self.s[self.i] in "\"'": k = self.string()
            else:
                m = re.compile(r"[\w$]+").match(self.s, self.i)
                k = m.group(0)
                self.i = m.end()
            self.ws()
            assert self.s[self.i] == ":", "expected : at %d" % self.i
            self.i += 1
            out[k] = self.value()
            self.comma("}")


def strings_of(path):
    """{key: value} from every HelperI18n.add(lang, {...}) in a file"""
    s = io.open(path, encoding="utf-8").read()
    out = {}
    for m in re.finditer(r"HelperI18n\.add\(\s*[\"'](\w+)[\"']\s*,", s):
        r = Reader(s, m.end())
        r.ws()
        try:
            out.update(r.obj())
        except (ValueError, AssertionError, IndexError) as e:
            raise SystemExit("%s: %s" % (os.path.relpath(path, ROOT).replace("\\", "/"), e))
    return out


def langs():
    s = io.open(os.path.join(ROOT, "assets", "i18n.js"), encoding="utf-8").read()
    block = s[s.index("var LANGS = ["):s.index("];", s.index("var LANGS = ["))]
    return re.findall(r'code:\s*"([\w-]+)"', block)


# ---------------- comparing two strings ----------------
PH = re.compile(r"\{([A-Za-z_][\w.]*)(\|[^{}]*)?\}")
TAG = re.compile(r"</?([a-zA-Z][\w-]*)")


def parts(v):
    if isinstance(v, dict): return " ".join(str(x) for x in v.values())
    return v if isinstance(v, str) else json.dumps(v)


def shape(v):
    t = parts(v)
    return (sorted(set(m.group(1) for m in PH.finditer(t))), sorted(TAG.findall(t)))


# ---------------- the site's code ----------------
def code_files():
    out = []
    for f in glob.glob(os.path.join(ROOT, "**", "*"), recursive=True):
        rel = os.path.relpath(f, ROOT).replace("\\", "/")
        if os.path.isfile(f) and rel.endswith((".html", ".js")) and not rel.startswith(SKIP) and not rel.startswith("assets/i18n"):
            out.append((rel, f))
    return sorted(out)


# t("key") with a whole key (not one built with +), and, when the code keeps its own English beside it, that English
CALL = re.compile(r"""(?<![\w.$])(?:HelperI18n\.t|I18N\.t|I\.t|t|T|tr|tx|L)\(\s*"([a-z][\w-]*\.[\w.-]+)"(?=\s*[,)])\s*(?:,\s*"((?:[^"\\]|\\.)*)"(?=\s*[,)]))?""")
# a translation may add keys English hasn't got when they are the language's own data, not words to translate: word
# lists and patterns for reading answers (…Words, ….re.…, ….skip…), its speech table (….speech), its OCR language (…Lang),
# its own examples (…List)
OPTIONAL = re.compile(r"(Words|Lang|List|\.speech|\.skip\w*)$|\.re\.")
ATTR = re.compile(r'data-i18n="([\w.-]+)"')
ATTR2 = re.compile(r'data-i18n-attr="([^"]+)"')


def js_unescape(s):
    return Reader('"' + s + '"', 0).string()


def main(argv):
    check = "--check" in argv
    verbose = "-v" in argv
    only = [a for a in argv if not a.startswith("-")]
    errors, notes, warn = [], [], []
    en = strings_of(os.path.join(I18N, "en.js"))
    pages = sorted(os.path.splitext(os.path.basename(p))[0] for p in glob.glob(os.path.join(I18N, "en", "*.js")))
    en_all = dict(en)
    en_page = {}
    for p in pages:
        en_page[p] = strings_of(os.path.join(I18N, "en", p + ".js"))
        for k in en_page[p]:
            if k in en_all: errors.append("en: %s is in en.js and en/%s.js" % (k, p))
        en_all.update(en_page[p])
    print("English: %d shared keys, %d pages (%s), %d keys in all" % (len(en), len(pages), ", ".join(pages), len(en_all)))

    for code in langs():
        if code == "en" or (only and code not in only): continue
        files = [("%s.js" % code, os.path.join(I18N, code + ".js"), en)] + [("%s/%s.js" % (code, p), os.path.join(I18N, code, p + ".js"), en_page[p]) for p in pages]
        n_miss = n_bad = 0
        for name, path, ref in files:
            if not os.path.exists(path):
                errors.append("%s: missing file (copy en/%s)" % (name, name.split("/", 1)[-1]))
                continue
            tr = strings_of(path)
            miss = [k for k in ref if k not in tr]
            extra = [k for k in tr if k not in ref]
            n_miss += len(miss)
            for k in miss: errors.append("%s: missing %s  (en: %s)" % (name, k, parts(ref[k])[:70]))
            for k in extra:
                if OPTIONAL.search(k): notes.append("%s: %s is the language's own data (not in English)" % (name, k))
                else: errors.append("%s: unused %s  (not in English)" % (name, k))
            for k in ref:
                if k not in tr: continue
                a, b = ref[k], tr[k]
                if isinstance(a, dict) != isinstance(b, dict) and not (isinstance(a, str) and isinstance(b, dict)):
                    errors.append("%s: %s is %s in English but %s here" % (name, k, type(a).__name__, type(b).__name__)); n_bad += 1
                    continue
                if not isinstance(a, (str, dict)) or not isinstance(b, (str, dict)): continue
                pa, ta = shape(a)
                pb, tb = shape(b)
                if pa != pb:
                    # a translation may need a variable English doesn't use (an article, a gender) or leave one out; the
                    # code has to pass them all, which the pages show (a "{name}" left in the text): a note, not an error
                    warn.append("%s: %s placeholders %s, English has %s" % (name, k, pb, pa))
                if sorted(set(ta)) != sorted(set(tb)):
                    errors.append("%s: %s HTML tags %s, English has %s" % (name, k, sorted(set(tb)), sorted(set(ta)))); n_bad += 1
        print("%s: %d files, %d missing, %d that don't match" % (code, len(files), n_miss, n_bad))

    # the code
    used = set()
    for rel, f in code_files():
        s = io.open(f, encoding="utf-8").read()
        for m in CALL.finditer(s):
            k = m.group(1)
            used.add(k)
            if k not in en_all and not OPTIONAL.search(k):
                errors.append("%s: uses %s, which English doesn't have" % (rel, k))
            elif m.group(2) is not None and k in en_all and isinstance(en_all[k], str):
                inline = js_unescape(m.group(2))
                if inline != en_all[k]:
                    errors.append("%s: %s says %r beside the key, en has %r" % (rel, k, inline[:60], en_all[k][:60]))
        for m in ATTR.finditer(s):
            used.add(m.group(1))
            if m.group(1) not in en_all: errors.append("%s: data-i18n=%s isn't in English" % (rel, m.group(1)))
        for m in ATTR2.finditer(s):
            for pair in m.group(1).split(";"):
                if "=" not in pair: continue
                k = pair.split("=", 1)[1].strip()
                used.add(k)
                if k not in en_all: errors.append("%s: data-i18n-attr %s isn't in English" % (rel, k))

    # nav.js's own English
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    nav = io.open(os.path.join(ROOT, "assets", "nav.js"), encoding="utf-8").read()
    for k, v in navlists(nav):
        if k not in en: errors.append("en.js: nav.js has %r, but no %s" % (v, k))
        elif en[k] != v: errors.append("en.js: %s is %r, nav.js says %r" % (k, en[k], v))

    unnamed = sorted(k for k in en_all if k not in used and not k.startswith("nav."))
    if verbose:
        print("English keys no code names literally (built from a name, or unused): %d" % len(unnamed))
        for k in unnamed: print("   ", k)
    for w in warn: print("  ~ " + w)
    if verbose:
        for x in notes: print("  · " + x)
    for e in errors: print("  ✗ " + e)
    print("%d problem%s; %d placeholder note%s (the pages must show no {name} left)" % (len(errors), "" if len(errors) == 1 else "s", len(warn), "" if len(warn) == 1 else "s"))
    return 1 if (check and errors) else 0


# ---------------- nav.js's lists, as keys (the same names nav.js's tr() calls use) ----------------
def navlists(src):
    out = []
    short = lambda href: re.sub(r"\.html$", "", href).rstrip("/") or "index"
    body = lambda name, end="];": src[src.index("var %s = " % name):src.index(end, src.index("var %s = " % name))]
    for m in re.finditer(r'\{ href: "([^"]+)", sign: "[^"]*", name: "([^"]+)", title: "([^"]+)"', body("PAGES")):
        out.append(("nav.page.%s" % short(m.group(1)), m.group(2)))
    keys = re.findall(r'var SEC_KEYS = \[([^\]]*)\]', src)
    keys = re.findall(r'"(\w+)"', keys[0]) if keys else []
    for k, m in zip(keys, re.finditer(r'name: "([^"]+)",\s*sign: "[^"]*",\s*c: "[^"]*",(?:\s*italic: true,)?\s*title: "([^"]+)"', body("SECTIONS"))):
        out.append(("nav.sec.%s" % k, m.group(1)))
        out.append(("nav.sec.%s.title" % k, m.group(2)))
    for m in re.finditer(r'"([^"]+\.html)": "([^"]+)"', body("FULL", "};")):
        out.append(("nav.full.%s" % short(m.group(1)), m.group(2)))
    for blk in re.finditer(r'"([^"]+\.html)": \[(.*?)\n    \]', body("TABS", "};"), re.S):
        for t in re.finditer(r'\["(\w+)=([\w-]+)", "([^"]+)"\]', blk.group(2)):
            out.append(("nav.tab.%s.%s" % (short(blk.group(1)), t.group(2)), t.group(3)))
    for m in re.finditer(r'\{ href: "([^"]+)", name: "([^"]+)", title: "([^"]+)" \}', body("TOOLS")):
        out.append(("nav.tool.%s" % short(m.group(1)), m.group(2)))
        out.append(("nav.tool.%s.title" % short(m.group(1)), m.group(3)))
    work = src[src.index("var WORK = "):src.index("var LIGHT")]
    for g in re.finditer(r'href: "([^"]+)",\s*path: "[^"]+",\s*sign: "[^"]*",\s*name: "([^"]+)",\s*title: "([^"]+)",\s*c: "[^"]+",\s*tabs: \[(.*?)\n    \]', work, re.S):
        k = short(g.group(1))
        out.append(("nav.work.%s" % k, g.group(2)))
        for t in re.finditer(r'\["(\w+)", "([^"]+)", "((?:[^"\\]|\\.)*)"\]', g.group(4)):
            out.append(("nav.work.%s.%s" % (k, t.group(1)), t.group(2)))
            if t.group(3): out.append(("nav.work.%s.%s.hint" % (k, t.group(1)), js_unescape(t.group(3))))
    return out


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
