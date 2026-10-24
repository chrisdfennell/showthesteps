"""Count the site (pages, lines of code, characters, bytes) and write the "By the numbers" table into README.md, between
the <!-- stats:start --> and <!-- stats:end --> lines. Run it before a commit that changes the code:

    python scripts/stats.py                      update README.md
    python scripts/stats.py --checks 24362       also set the number of self-test checks (from the last thorough run)
    python scripts/stats.py --check              say whether README.md is out of date; change nothing

Lines are counted as they are in the files (blank lines left out). In a page, the code inside <script> blocks counts as
JavaScript, inside <style> blocks as CSS, and the rest as HTML."""
import io, os, re, sys, glob, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
README = os.path.join(ROOT, "README.md")
SKIP = ("docs/", ".git/", ".github/", "scripts/")
START, END = "<!-- stats:start -->", "<!-- stats:end -->"
BLOCK = re.compile(r"(<(script|style)\b[^>]*>)(.*?)(</\2>)", re.S | re.I)


def nonblank(text):
    return sum(1 for line in text.split("\n") if line.strip())


def count():
    c = {"files": 0, "pages": 0, "js": 0, "css": 0, "html": 0, "chars": 0, "bytes": 0}
    for f in glob.glob(os.path.join(ROOT, "**", "*"), recursive=True):
        rel = os.path.relpath(f, ROOT).replace("\\", "/")
        if not os.path.isfile(f) or rel.startswith(SKIP) or not rel.endswith((".html", ".js")):
            continue
        raw = io.open(f, "rb").read()
        s = raw.decode("utf-8").replace("\r\n", "\n")
        c["files"] += 1
        c["bytes"] += len(raw)
        c["chars"] += len(s)
        if rel.endswith(".js"):
            c["js"] += nonblank(s)
            continue
        c["pages"] += 1
        rest = s
        for m in BLOCK.finditer(s):
            if m.group(2).lower() == "script" and "application/ld+json" not in m.group(1):
                c["js"] += nonblank(m.group(3))
            elif m.group(2).lower() == "style":
                c["css"] += nonblank(m.group(3))
            else:
                continue
            rest = rest.replace(m.group(3), "", 1)
        c["html"] += nonblank(rest)
    c["helpers"] = len(glob.glob(os.path.join(ROOT, "helpers", "*.html")))
    c["lessons"] = len([f for f in glob.glob(os.path.join(ROOT, "learn", "*.html")) if not f.endswith("index.html")])
    c["lines"] = c["js"] + c["css"] + c["html"]
    return c


def table(c, checks):
    n = lambda v: "{:,}".format(v)
    rows = [
        ("Helpers", n(c["helpers"])),
        ("Lessons", n(c["lessons"])),
        ("Pages and scripts", n(c["pages"]) + " pages, " + n(c["files"] - c["pages"]) + " scripts"),
        ("Lines of code", n(c["lines"])),
        ("&nbsp;&nbsp;JavaScript", n(c["js"])),
        ("&nbsp;&nbsp;CSS", n(c["css"])),
        ("&nbsp;&nbsp;HTML", n(c["html"])),
        ("Characters", n(c["chars"])),
        ("Size", "%.1f MB" % (c["bytes"] / 1048576.0)),
    ]
    if checks:
        rows.append(("Self-test checks", checks + " (the last thorough run)"))
    out = [START, "", "| | |", "| --- | ---: |"]
    out += ["| %s | %s |" % r for r in rows]
    out += ["", "<sub>Counted by `scripts/stats.py` on %s; blank lines left out.</sub>" % datetime.date.today().isoformat(), "", END]
    return "\n".join(out)


def main(argv):
    s = io.open(README, encoding="utf-8").read()
    nl = "\r\n" if "\r\n" in s else "\n"
    s = s.replace("\r\n", "\n")
    if START not in s or END not in s:
        print("README.md has no " + START + " … " + END + " section")
        return 1
    old = s[s.index(START):s.index(END) + len(END)]
    checks = None
    if "--checks" in argv:
        checks = "{:,}".format(int(argv[argv.index("--checks") + 1]))
    else:
        m = re.search(r"\| Self-test checks \| ([\d,]+)", old)      # keep the number from last time
        checks = m.group(1) if m else None
    new = table(count(), checks)
    same = re.sub(r"on \d{4}-\d{2}-\d{2}", "", old) == re.sub(r"on \d{4}-\d{2}-\d{2}", "", new)
    if "--check" in argv:
        print("README.md numbers are " + ("up to date" if same else "out of date: run python scripts/stats.py"))
        return 0 if same else 1
    if same:
        print("README.md numbers are up to date")
        return 0
    io.open(README, "w", encoding="utf-8", newline="").write(s.replace(old, new).replace("\n", nl))
    print(new)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
