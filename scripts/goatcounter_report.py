"""What the pages couldn't read: pulls the site's GoatCounter counts and lists
  1. each helper's "couldn't read a typed problem" count next to its visits (the pages that need to learn most), and
  2. the problems visitors chose to send ("Send this problem so we can teach the page"), to turn into fixes.

    set GOATCOUNTER_TOKEN=...        an API key: in GoatCounter, your name in the top menu → API, with "Read statistics"
    python scripts/goatcounter_report.py              the last 30 days
    python scripts/goatcounter_report.py --days 90 --out sent.json

GOATCOUNTER_SITE picks the dashboard (default https://fennell.goatcounter.com). The key is read only from the
environment; it's never written anywhere."""
import io, os, re, sys, json, time, datetime, urllib.request, urllib.parse, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.environ.get("GOATCOUNTER_SITE", "https://fennell.goatcounter.com").rstrip("/")


def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def api(path, params, token):
    url = SITE + "/api/v0/" + path + "?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        left = r.headers.get("X-Rate-Limit-Remaining")
        body = json.load(r)
    if left is not None and int(left) < 2: time.sleep(1.1)        # GoatCounter allows 4 requests a second
    else: time.sleep(0.3)
    return body


def all_hits(token, start, end):
    hits, seen = [], []
    while True:
        b = api("stats/hits", {"start": start, "end": end, "limit": 100, "exclude_paths": seen}, token)
        hits += b.get("hits") or []
        seen = [h["path_id"] for h in hits]
        if not b.get("more"): return hits


def page_paths():
    """the short names the events use ("pemdas") → the page's address ("/helpers/order-of-operations"), from site.js"""
    s = io.open(os.path.join(ROOT, "assets", "site.js"), encoding="utf-8").read()
    block = s[s.index("var PAGES = {"):s.index("};", s.index("var PAGES = {"))]
    return {k.strip('"'): "/" + v for k, v in re.findall(r'("?[\w-]+"?)\s*:\s*"([^"]*)"', block)}


def main():
    try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # sent problems can hold any character
    except Exception: pass
    token = os.environ.get("GOATCOUNTER_TOKEN")
    if not token:
        print("Set GOATCOUNTER_TOKEN to a GoatCounter API key (your name in the top menu → API, \"Read statistics\").")
        return 1
    days = int(arg("--days", "30"))
    end = datetime.datetime.now(datetime.timezone.utc).replace(minute=0, second=0, microsecond=0, tzinfo=None) + datetime.timedelta(hours=1)
    start = end - datetime.timedelta(days=days)
    fmt = lambda t: t.strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        hits = all_hits(token, fmt(start), fmt(end))
    except urllib.error.HTTPError as e:
        print({401: "GoatCounter didn't accept the key (401): check GOATCOUNTER_TOKEN.",
               403: "The key can't read statistics (403): give it the \"Read statistics\" permission."}.get(e.code, "GoatCounter said %s" % e))
        return 1
    count = {h["path"]: h.get("count", 0) for h in hits}
    paths = page_paths()

    rows = []
    for p, n in count.items():
        if not p.startswith("couldnt-read/"): continue
        short = p.split("/", 1)[1]
        page = paths.get(short, "")
        visits = count.get(page, 0) + count.get(page + ".html", 0)
        rows.append((n, short, visits))
    rows.sort(reverse=True)
    print("Couldn't read a typed problem, the last %d days:" % days)
    print("  %-22s %8s %8s %7s" % ("page", "times", "visits", "share"))
    for n, short, visits in rows:
        print("  %-22s %8d %8d %6s" % (short, n, visits, ("%.0f%%" % (100.0 * n / visits)) if visits else "-"))
    if not rows: print("  (none)")

    sent = sorted(((h.get("count", 0), h["path"]) for h in hits if h["path"].startswith("sent/")), reverse=True)
    print("\nProblems visitors sent (%d):" % len(sent))
    out = []
    for n, p in sent:
        _, page, text = p.split("/", 2)
        out.append({"page": page, "text": text, "times": n})
        print("  %-14s x%-3d %s" % (page, n, text))
    if "--out" in sys.argv:
        io.open(arg("--out", "sent.json"), "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=1))
        print("\nwrote " + arg("--out", "sent.json"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
