"""Turns the problems visitors send ("Send this problem so we can teach the page") into GitHub issues.

The button counts a GoatCounter event "sent/<page>/<problem>" (tools.js). This reads those events and opens one issue
for each new problem, labeled sent-problem, with a link that opens it on the site. A problem sent again by more
visitors gets a comment on its issue instead of a second issue. The workflow .github/workflows/sent-problems.yml
runs it every hour.

    GOATCOUNTER_TOKEN=...  an API key with "Read statistics" (GoatCounter: your name in the top menu → API)
    GITHUB_TOKEN=...       a token that can write issues (the workflow's own; locally: GITHUB_TOKEN=$(gh auth token))
    python scripts/sent_to_issues.py              open and update the issues
    python scripts/sent_to_issues.py --dry-run    only say what it would do

GITHUB_REPOSITORY picks the repo (default chrisdfennell/showthesteps). Anyone can fake a GoatCounter event, so only
events for one of the site's pages count, and at most MAX_NEW issues are opened in one run. The keys are read only
from the environment; they're never written anywhere."""
import os, re, sys, json, datetime, urllib.request, urllib.parse, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from goatcounter_report import all_hits, page_paths

REPO = os.environ.get("GITHUB_REPOSITORY", "chrisdfennell/showthesteps")
SITE_URL = "https://showthesteps.org"
START = "2026-10-24T00:00:00Z"          # the day the Send button came in: every count is a total since then
LABEL = "sent-problem"
MAX_NEW = 10
LANGS = {"es": "Spanish"}               # the language in the event's title (tools.js) → its name in the issue
DRY = "--dry-run" in sys.argv


def gh(method, path, body=None):
    req = urllib.request.Request("https://api.github.com/" + path, method=method,
                                 data=json.dumps(body).encode("utf-8") if body is not None else None,
                                 headers={"Authorization": "Bearer " + os.environ["GITHUB_TOKEN"],
                                          "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
                                          "Content-Type": "application/json", "User-Agent": "showthesteps-sent-problems"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def known_issues():
    """the issues this script opened before: GoatCounter path id → (issue number, the count it last saw)"""
    out, n = {}, 1
    if not os.environ.get("GITHUB_TOKEN"): return out
    while True:
        page = gh("GET", "repos/%s/issues?labels=%s&state=all&per_page=100&page=%d" % (REPO, LABEL, n))
        for i in page:
            m = re.search(r"<!-- goatcounter-path-id: (\d+) -->", i.get("body") or "")
            c = re.search(r"<!-- sent-count: (\d+) -->", i.get("body") or "")
            if m: out[int(m.group(1))] = (i["number"], int(c.group(1)) if c else 1, i["body"])
        if len(page) < 100: return out
        n += 1


def ensure_label():
    try:
        gh("POST", "repos/%s/labels" % REPO, {"name": LABEL, "color": "fbca04",
                                               "description": "A problem a visitor sent from a page that couldn't read it"})
    except urllib.error.HTTPError as e:
        if e.code != 422: raise          # 422: the label is already there


def fence(text):
    """a ~~~ fence longer than any run of ~ in the text, so the problem shows as typed: no Markdown, links or @mentions"""
    run = max([len(r) for r in re.findall(r"~+", text)] + [2])
    return "~" * (run + 1)


def plural(n):
    return "%d visitor%s" % (n, "" if n == 1 else "s")


def issue(hit, short, address, text, lang):
    link = SITE_URL + address + "?" + urllib.parse.urlencode([("q", text)] + ([("lang", lang)] if lang else []))
    f = fence(text)
    title = "Couldn't read on %s: %s" % (address.rsplit("/", 1)[-1] or "the home page", text if len(text) <= 70 else text[:69] + "…")
    body = "\n".join([
        "A visitor pressed **Send this problem** on `%s` because the page couldn't read it%s:" % (address or "/", " (in %s)" % LANGS.get(lang, lang) if lang else ""),
        "", f + "text", text, f, "",
        "**Try it:** " + link, "",
        "Sent by %s so far. Opened by the hourly *Sent problems* workflow from the site's GoatCounter events; teach the "
        "page to read problems like this one, then close the issue." % plural(hit.get("count", 1)), "",
        "<!-- goatcounter-path-id: %d -->" % hit["path_id"],
        "<!-- sent-count: %d -->" % hit.get("count", 1)])
    return title.replace("@", "(at)"), body


def main():
    try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # sent problems can hold any character
    except Exception: pass
    token = os.environ.get("GOATCOUNTER_TOKEN")
    if not token:
        print("::warning::GOATCOUNTER_TOKEN isn't set: add it as a repository secret (Settings → Secrets → Actions).")
        return 0
    if not DRY and not os.environ.get("GITHUB_TOKEN"):
        print("Set GITHUB_TOKEN (locally: GITHUB_TOKEN=$(gh auth token)), or use --dry-run.")
        return 1
    end = datetime.datetime.now(datetime.timezone.utc).replace(minute=0, second=0, microsecond=0, tzinfo=None) + datetime.timedelta(hours=1)
    try:
        hits = all_hits(token, START, end.strftime("%Y-%m-%dT%H:%M:%SZ"))
    except urllib.error.HTTPError as e:
        print("::error::" + {401: "GoatCounter didn't accept the key (401): check the GOATCOUNTER_TOKEN secret.",
                             403: "The key can't read statistics (403): give it the \"Read statistics\" permission."}.get(e.code, "GoatCounter said %s" % e))
        return 1
    paths = page_paths()
    seen = known_issues()
    sent = sorted((h for h in hits if h["path"].lstrip("/").startswith("sent/")), key=lambda h: h["path_id"])
    opened = commented = skipped = 0
    if sent and not DRY: ensure_label()
    for h in sent:
        parts = h["path"].lstrip("/").split("/", 2)
        if len(parts) < 3 or not parts[2].strip() or parts[1] not in paths:
            skipped += 1                 # not one of the site's pages: a made-up event
            continue
        short, text, n = parts[1], parts[2].strip(), h.get("count", 1)
        lang = (re.search(r"\(([a-z]{2})\)\s*$", h.get("title") or "") or [None, None])[1]
        if h["path_id"] in seen:
            number, was, body = seen[h["path_id"]]
            if n <= was: continue
            print("#%d sent again: %s in all (%s)" % (number, plural(n), text[:60]))
            if not DRY:
                gh("POST", "repos/%s/issues/%d/comments" % (REPO, number),
                   {"body": "Sent again: %s in all have sent this problem." % plural(n)})
                gh("PATCH", "repos/%s/issues/%d" % (REPO, number),
                   {"body": re.sub(r"Sent by \d+ visitors? so far", "Sent by %s so far" % plural(n),
                                   re.sub(r"<!-- sent-count: \d+ -->", "<!-- sent-count: %d -->" % n, body))})
            commented += 1
            continue
        if opened >= MAX_NEW:
            print("::warning::More than %d new problems in one run; the rest wait for the next run." % MAX_NEW)
            break
        title, body = issue(h, short, paths[short], text, lang)
        if DRY:
            print("would open: " + title + "\n" + body + "\n")
        else:
            i = gh("POST", "repos/%s/issues" % REPO, {"title": title, "body": body, "labels": [LABEL]})
            print("opened #%d: %s" % (i["number"], title))
        opened += 1
    print("%d sent problems: %d new issues, %d updated, %d skipped" % (len(sent), opened, commented, skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main())
