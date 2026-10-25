/* Embed a helper on another website: a class website, Google Sites, Canvas, a blog. tools.js fetches this file only
   when it's needed, in two cases:

   1. The Embed button (key E) on a helper: HelperEmbed.open() shows a dialog to choose what the visitor sees
      (practice=all|step|check), the layout, the height and the colors, with a live preview and the code to paste:
      an <iframe> (with a few lines of script that size it, when it should grow to fit), or the address alone for
      Google Sites (Insert → Embed → By URL) and the code for Canvas.

   2. A helper opened with embed=site or embed=site-full in its address (it is in an iframe on someone else's page):
      HelperEmbed.site() trims it down.
        embed=site       just this problem: no site bar, title, problem maker, examples, mode buttons or footer
        embed=site-full  the whole helper (problem maker, examples, mode buttons), without the site bar and footer
        practice=…       as linked (the helper reads it, as on any link)
        theme=light|dark the colors; without it, the visitor's own light or dark setting
      A small "Show The Steps ↗" link opens the full page in a new tab, every link to another page opens in a new tab,
      and the height is posted to the host page after every change: postMessage({ type:"helper:height", h:<px> }, "*"),
      the same message the helpers send inside practice sets, so the host page can size the iframe (snippet()).

   Outside embeds are marked embed=site, never embed=1: embed=1 is the site's own practice sets, problem of the day and
   worksheet maker (Check my answer only, the problem read-only, nothing saved in the browser), and every helper only
   takes embed=1 (or true/yes) for that, so embed=site opens the helper as an ordinary page and this file does the rest.
   Each helper rewrites its address as it starts, dropping embed and theme, so the address as the page was opened
   (the navigation entry) is the one read.

   HelperEmbed.mode([href])  "site", "site-full" or "" for an address (the one this page was opened with, by default)
   HelperEmbed.build(o)      { src, preview, html, snippet, code, title } for the choices o: { page, params, practice,
                             layout:"simple"|"full", height:"auto"|"fixed", px, theme:""|"light"|"dark", fit }
   HelperEmbed.snippet()     the few lines of script that size the iframes marked data-fit-height from their helper:height
                             messages (a fixed-height embed on the same page is left alone)
   HelperEmbed.open()        the dialog, for the problem on screen; HelperEmbed.close() closes it
   HelperEmbed.site()        the embedded page's own changes (tools.js calls it on a page opened with embed=site…)
   ES5, and wrapped so a problem here can never break a helper page. */
(function() {
  "use strict";
  if (window.HelperEmbed) return;

  /* ---- the words, in the visitor's language (assets/i18n.js): the embed.* keys, and en.js repeats the English for
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

  var root = document.documentElement;
  var LIVE = "https://showthesteps.org/"; // where the code points when this copy isn't the published site
  var MAXH = 5000;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function safe(fn) { return function() { try { return fn.apply(this, arguments); } catch (e) { if (window.console) console.warn("embed.js:", e); } }; }

  function framed() { try { return window.top !== window.self; } catch (e) { return true; } }

  function pageName() { return ((window.HelperSite && window.HelperSite.here) || location.pathname.split("/").pop() || "index.html").toLowerCase(); }

  // the address this page was opened with: each helper rewrites its own address as it starts
  function firstHref() {
    var href = location.href;
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      if (nav && nav.name) href = nav.name;
    } catch (e) {}
    return href;
  }

  function mode(href) {
    var m = /[?&]embed=(site(?:-full)?)(?=&|#|$)/i.exec(href === undefined ? firstHref() : String(href));
    return m ? m[1].toLowerCase() : "";
  }

  function param(href, name) {
    var m = new RegExp("[?&]" + name + "=([^&#]*)").exec(href);
    if (!m) return null;
    try { return decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { return m[1]; }
  }

  // the problem's own part of an address: everything but practice, embed and theme
  function problemParams(search) {
    return String(search || "").replace(/^\?/, "").split("&").filter(function(kv) { return kv && !/^(practice|embed|theme)=/i.test(kv); }).join("&");
  }

  function heading() {
    var h1 = document.querySelector(".page h1") || document.querySelector("h1");
    if (!h1) return document.title.replace(/\s*[|·–-]\s*Show The Steps\s*$/, "");
    h1 = h1.cloneNode(true);
    [].forEach.call(h1.querySelectorAll("sup, sub"), function(x) { x.parentNode.removeChild(x); });
    return h1.textContent.replace(/\s+/g, " ").trim();
  }

  /* ===================== the code ===================== */
  // the published site: this copy, when it is one (a real web address), or showthesteps.org (opened as a file, or on
  // this computer while testing)
  function liveRoot() { return window.HelperSite && window.HelperSite.pretty ? window.HelperSite.root : LIVE; }

  function liveAddress(page, query) {
    var path = window.HelperSite ? window.HelperSite.path(page) : "helpers/" + page;
    return liveRoot() + path.replace(/\.html$/, "") + (query ? "?" + query : "");
  }

  function originOf(u) { var m = /^(https?:\/\/[^\/?#]+)/i.exec(u); return m ? m[1] : "*"; }

  function snippet(origin) {
    origin = origin || originOf(liveRoot());
    return "<script>\n" +
      "/* Show The Steps: an embedded helper says how tall it is; a frame marked data-fit-height is made that tall */\n" +
      "window.addEventListener(\"message\", function (e) {\n" +
      "  if (e.origin !== \"" + origin + "\" || !e.data || e.data.type !== \"helper:height\") return;\n" +
      "  var f = document.getElementsByTagName(\"iframe\");\n" +
      "  for (var i = 0; i < f.length; i++)\n" +
      "    if (f[i].contentWindow === e.source && f[i].hasAttribute(\"data-fit-height\")) f[i].style.height = Math.max(150, Math.min(" + MAXH + ", Math.ceil(e.data.h))) + \"px\";\n" +
      "});\n" +
      "<\/script>";
  }

  function build(o) {
    o = o || {};
    var page = o.page || pageName(),
      practice = /^(all|step|check)$/.test(o.practice) ? o.practice : "all",
      theme = o.theme === "light" || o.theme === "dark" ? o.theme : "",
      auto = o.height !== "fixed",
      px = Math.max(150, Math.min(MAXH, Math.round(Number(o.px) || 640))),
      fit = Math.max(150, Math.min(MAXH, Math.round(Number(o.fit) || 0) || 640)); // how tall it came out in the preview
    var q = problemParams(o.params === undefined ? location.search : o.params);
    q = (q ? q + "&" : "") + "practice=" + practice + "&embed=" + (o.layout === "full" ? "site-full" : "site") + (theme ? "&theme=" + theme : "");
    var src = liveAddress(page, q),
      title = (o.title || heading()) + " · Show The Steps",
      h = auto ? Math.min(fit, 1000) : px; // grows to fit: it starts as tall as the preview, at most 1000 px, until the script sizes it
    var frame = '<iframe src="' + esc(src) + '" title="' + esc(title) + '"' + (auto ? " data-fit-height" : "") + ' width="100%" height="' + h + '" ' +
      'style="border:0;width:100%;max-width:100%;height:' + h + 'px" loading="lazy"></iframe>';
    return {
      src: src,
      preview: window.HelperSite ? window.HelperSite.url(page, q) : page + "?" + q,
      html: frame,
      snippet: auto ? snippet(originOf(src)) : "",
      code: frame + (auto ? "\n" + snippet(originOf(src)) : ""),
      title: title,
      height: h
    };
  }

  /* ===================== the embedded page (embed=site, embed=site-full) ===================== */
  var siteOn = false;

  function siteCSS() {
    var S = "html.ht-site:not(.ht-site-full) ";
    return "html.ht-site body{margin:0}" +
      "html.ht-site .page{padding:12px 12px 8px;gap:14px}" +
      "html.ht-site .sitenav,html.ht-site .footnote,html.ht-site .theme-btn,html.ht-site .ht-byhand{display:none !important}" +
      S + ".masthead," + S + ".maker," + S + ".examples," + S + ".hint," + S + ".keys," + S + "#modeTabs," + S + ".problem > .modes," +
      S + ".ht-site-off{display:none !important}" +
      ".ht-site-by{display:flex;justify-content:flex-end;margin:2px 0 0;font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-size:12px;line-height:1.4}" +
      ".ht-site-by a{color:var(--ink-3,#7C8781);text-decoration:none;border-radius:6px;padding:3px 6px}" +
      ".ht-site-by a:hover,.ht-site-by a:focus-visible{color:var(--ink,#19211D);text-decoration:underline;text-underline-offset:2px}" +
      ".ht-site-by b{font-weight:600}" +
      "@media print{.ht-site-by{display:none !important}}";
  }

  // the link to the full page: the problem on screen now, without embed and theme
  function fullHref() {
    var q = problemParams(location.search),
      pr = /(?:^|&)practice=/.test(location.search.replace(/^\?/, "")) ? param(location.search, "practice") : param(firstHref(), "practice");
    if (pr && /^(all|step|check|tutor)$/.test(pr)) q = (q ? q + "&" : "") + "practice=" + pr;
    return location.href.split(/[?#]/)[0] + (q ? "?" + q : "");
  }

  var lastH = 0;

  function postHeight() {
    if (!framed()) return;
    var pg = document.querySelector(".page") || document.body,
      by = document.querySelector(".ht-site-by"),
      y = window.pageYOffset || 0,
      bottom = pg.getBoundingClientRect().bottom;
    if (by) bottom = Math.max(bottom, by.getBoundingClientRect().bottom);
    var h = Math.ceil(bottom + y + 2);
    if (h === lastH || h <= 0) return;
    lastH = h;
    try { window.parent.postMessage({ type: "helper:height", h: h }, "*"); } catch (e) {}
  }

  // the practice buttons (Show all work / One step at a time / Check my answer): hidden in the simple layout
  function hidePracticeButtons() {
    [].forEach.call(document.querySelectorAll('[role="group"]'), function(g) {
      var step = [].some.call(g.querySelectorAll("button"), function(b) { return /^one step at a time$/i.test(b.textContent.trim()); });
      if (step)(g.closest(".practice") || g).classList.add("ht-site-off");
    });
  }

  function attribution() {
    if (document.querySelector(".ht-site-by")) return;
    var host = document.querySelector(".page") || document.body,
      box = document.createElement("div"),
      a = document.createElement("a");
    box.className = "ht-site-by";
    a.target = "_blank";
    a.rel = "noopener";
    a.href = fullHref();
    a.title = tr("embed.openTitle", "Open this problem on Show The Steps, in a new tab");
    a.innerHTML = (root.classList.contains("ht-site-full") ? "" : esc(heading()) + " · ") + "<b>Show The Steps</b> ↗";
    a.addEventListener("click", function() { a.href = fullHref(); }); // the problem on screen when it's pressed
    box.appendChild(a);
    host.appendChild(box);
  }

  // inside someone else's page, a link to another page opens in a new tab rather than inside the frame
  function onClick(e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target || a.hasAttribute("download")) return;
    var h = a.getAttribute("href") || "";
    if (!h || h.charAt(0) === "#" || /^(javascript|mailto|tel):/i.test(h)) return;
    if (a.origin === location.origin && a.pathname === location.pathname && a.search === location.search) return;
    a.target = "_blank";
    a.rel = "noopener";
  }

  function site() {
    var m = mode();
    if (!m || siteOn) return !!m;
    siteOn = true;
    root.classList.add("ht-site");
    if (m === "site-full") root.classList.add("ht-site-full");
    var th = param(firstHref(), "theme");
    if (th === "light" || th === "dark") root.setAttribute("data-theme", th);
    else root.removeAttribute("data-theme"); // the visitor's own setting, not one saved in this browser
    var st = document.createElement("style");
    st.textContent = siteCSS();
    document.head.appendChild(st);
    root.classList.remove("ht-site-wait"); // tools.js hides the page for the moment this file takes to load
    var go = safe(function() {
      if (m === "site") {
        hidePracticeButtons();
        setTimeout(safe(hidePracticeButtons), 400); // Tutor me (tutor.js) adds its button a little later
      }
      attribution();
      document.addEventListener("click", safe(onClick), true);
      if (!framed()) return;
      if (window.ResizeObserver) new ResizeObserver(safe(postHeight)).observe(document.querySelector(".page") || document.body);
      setInterval(safe(postHeight), 500); // and a slow check, as the helpers do, in case something resizes unobserved
      window.addEventListener("load", safe(postHeight));
      window.addEventListener("resize", safe(postHeight));
      postHeight();
    });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
    else go();
    return true;
  }

  /* ===================== the dialog ===================== */
  var CSS =
    "html.he-open{overflow:hidden}" +
    ".he-ov{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto;" +
    "background:rgba(10,14,12,.62);font-family:var(--f-body,\"IBM Plex Sans\",\"Segoe UI\",Arial,sans-serif)}" +
    ".he-card{background:var(--surface,#fff);color:var(--ink,#111);border:1px solid var(--rule,#ccc);border-radius:16px;width:100%;" +
    "max-width:720px;margin:auto 0;padding:16px 18px 18px;display:flex;flex-direction:column;gap:14px;box-shadow:0 24px 60px -24px rgba(0,0,0,.7)}" +
    ".he-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}" +
    ".he-title{font-family:var(--f-display,\"Archivo\",Arial,sans-serif);font-stretch:112%;font-weight:800;font-size:20px;line-height:1.15;margin:0}" +
    ".he-sub{font-size:13.5px;color:var(--ink-2,#444);margin-top:3px;overflow-wrap:anywhere}" +
    ".he-x{flex:none;font:600 14px/1 var(--f-body,Arial,sans-serif);color:var(--ink-2,#444);background:transparent;" +
    "border:1px solid var(--rule,#ccc);border-radius:999px;padding:7px 11px;cursor:pointer}" +
    ".he-x:hover{color:var(--ink,#111);border-color:var(--ink-3,#777)}" +
    ".he-opts{display:grid;grid-template-columns:auto 1fr;gap:10px 14px;align-items:center;margin:0}" +
    ".he-opts > .he-k{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-size:11px;font-weight:600;letter-spacing:.12em;" +
    "text-transform:uppercase;color:var(--ink-3,#666)}" +
    "@media (max-width:560px){.he-opts{grid-template-columns:1fr;gap:4px}.he-opts > .he-k{margin-top:8px}}" +
    ".he-pills{display:flex;flex-wrap:wrap;gap:6px;align-items:center;border:0;margin:0;padding:0;min-width:0}" +
    ".he-pills label{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--ink-2,#444);border:1px solid var(--rule,#ccc);" +
    "border-radius:999px;padding:5px 12px 5px 9px;cursor:pointer;background:var(--surface,#fff)}" +
    ".he-pills label:hover{border-color:var(--ink-3,#777)}" +
    ".he-pills label.on{color:var(--ink,#111);border-color:var(--ink-2,#444);font-weight:600}" +
    ".he-pills input[type=radio]{margin:0;accent-color:var(--key,#33463F)}" +
    ".he-pills input[type=number]{width:5.5em;font:inherit;font-size:14px;color:var(--ink,#111);background:var(--paper,#fff);" +
    "border:1px solid var(--rule,#ccc);border-radius:8px;padding:3px 6px}" +
    ".he-pills .he-px{font-size:13px;color:var(--ink-3,#666)}" +
    ".he-h{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;" +
    "color:var(--ink-3,#666);margin:0 0 6px;display:flex;justify-content:space-between;gap:10px}" +
    ".he-h span{letter-spacing:0;text-transform:none;font-weight:400}" +
    ".he-prev{border:1px dashed var(--rule,#ccc);border-radius:12px;overflow:hidden;background:var(--paper,#f4f4f4)}" +
    ".he-prev iframe{display:block;width:100%;height:320px;border:0;background:transparent}" +
    ".he-tabs{display:flex;gap:4px;border-bottom:1px solid var(--rule,#ccc);margin:0 0 10px}" +
    ".he-tabs button{font:600 13.5px/1.2 var(--f-body,Arial,sans-serif);color:var(--ink-2,#444);background:none;border:0;" +
    "border-bottom:2.5px solid transparent;padding:7px 10px;margin-bottom:-1px;cursor:pointer}" +
    ".he-tabs button[aria-selected=\"true\"]{color:var(--ink,#111);border-bottom-color:var(--key,#33463F)}" +
    ".he-code{display:block;width:100%;box-sizing:border-box;min-height:84px;resize:vertical;font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);" +
    "font-size:12.5px;line-height:1.45;color:var(--ink,#111);background:var(--paper,#f4f4f4);border:1px solid var(--rule,#ccc);" +
    "border-radius:10px;padding:10px 12px;white-space:pre-wrap;overflow-wrap:anywhere}" +
    ".he-row{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-top:8px}" +
    ".he-btn{font:600 14px/1.2 var(--f-body,Arial,sans-serif);color:var(--surface,#fff);background:var(--key,#33463F);border:1px solid transparent;" +
    "border-radius:9px;padding:8px 14px;cursor:pointer}" +
    ".he-btn:hover{filter:brightness(1.08)}" +
    ".he-note{font-size:13.5px;color:var(--ink-2,#444);margin:8px 0 0;line-height:1.5}" +
    ".he-note b{color:var(--ink,#111)}" +
    ".he-note a,.he-foot a{color:var(--key,#33463F)}" +
    ".he-ok{font-size:13px;color:var(--ink-2,#444)}" +
    ".he-foot{font-size:13px;color:var(--ink-3,#666);margin:0}" +
    ".he-ov button:focus-visible,.he-ov a:focus-visible,.he-ov input:focus-visible,.he-ov textarea:focus-visible{outline:2.5px solid var(--focus,var(--key,#33463F));outline-offset:2px}" +
    "@media print{.he-ov{display:none !important}}";
  var styled = false,
    cur = null;

  function addStyle() {
    if (styled) return;
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    styled = true;
  }

  // the practice mode the page is showing now
  function currentPractice() {
    var on = "all";
    [].forEach.call(document.querySelectorAll('[role="group"] button[aria-pressed="true"]'), function(b) {
      var t = b.textContent.trim(),
        lt = t.toLowerCase(); // (in the page's language too)
      if (/^one step at a time$/i.test(t) || lt === tr("common.oneStep", "One step at a time").toLowerCase()) on = "step";
      else if (/^check my answer$/i.test(t) || lt === tr("common.checkMine", "Check my answer").toLowerCase()) on = "check";
    });
    if (window.HelperTutor && window.HelperTutor.active && window.HelperTutor.active()) on = "step";
    return on;
  }

  function radios(name, list, value) {
    return '<div class="he-pills" role="radiogroup" aria-labelledby="he-k-' + name + '">' + list.map(function(x) {
      var on = x[0] === value;
      return '<label' + (on ? ' class="on"' : "") + '><input type="radio" name="he-' + name + '" value="' + x[0] + '"' + (on ? " checked" : "") + ">" + esc(x[1]) + "</label>";
    }).join("") + "</div>";
  }

  // what the preview frame writes into this browser (a helper saves its problem and mode) is put back on closing
  function snapStorage() {
    var s = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        s[k] = localStorage.getItem(k);
      }
    } catch (e) { return null; }
    return s;
  }

  function restoreStorage(s) {
    if (!s) return;
    try {
      var now = [];
      for (var i = 0; i < localStorage.length; i++) now.push(localStorage.key(i));
      now.forEach(function(k) { if (!Object.prototype.hasOwnProperty.call(s, k)) localStorage.removeItem(k); });
      Object.keys(s).forEach(function(k) { if (localStorage.getItem(k) !== s[k]) localStorage.setItem(k, s[k]); });
    } catch (e) {}
  }

  function copyText(text, btn, label) {
    function show(t) {
      btn.textContent = t;
      clearTimeout(btn._t);
      btn._t = setTimeout(function() { btn.textContent = label; }, 2000);
    }

    function fallback() {
      var ta = document.createElement("textarea"),
        ok = false;
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      cur.ov.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      show(ok ? tr("embed.copied", "Copied ✓") : tr("embed.copyFail", "Couldn’t copy: select it and copy"));
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function() { show(tr("embed.copied", "Copied ✓")); }, fallback);
    else fallback();
  }

  function focusables() {
    return [].filter.call(cur.ov.querySelectorAll("button, a[href], input, textarea"), function(b) {
      return !b.disabled && (b.offsetParent !== null || b === document.activeElement) && !(b.type === "radio" && !b.checked);
    });
  }

  function onKey(e) {
    if (!cur) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === "Tab") {
      var f = focusables();
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0].focus();
      } else if (i < 0) {
        e.preventDefault();
        f[0].focus();
      }
    }
    e.stopPropagation(); // the page's own shortcuts wait until the dialog is closed
  }

  function onMessage(e) {
    if (!cur || !e.data || e.data.type !== "helper:height" || typeof e.data.h !== "number") return;
    var fr = cur.ov.querySelector(".he-prev iframe");
    if (!fr || e.source !== fr.contentWindow) return;
    cur.fit = Math.ceil(e.data.h);
    paintPreviewHeight();
    paintCode();
  }

  function paintPreviewHeight() {
    var fr = cur.ov.querySelector(".he-prev iframe"),
      o = cur.o,
      want = o.height === "fixed" ? Math.max(150, Math.min(MAXH, Number(o.px) || 640)) : cur.fit || 320,
      cap = Math.max(240, Math.min(440, window.innerHeight - 320));
    fr.style.height = Math.min(want, cap) + "px";
    cur.ov.querySelector(".he-ph").textContent = want > cap ? tr("embed.shortened", "shortened here: {h} px tall on your page", { h: want }) : tr("embed.tall", "{h} px tall", { h: want });
  }

  function paintCode() {
    var o = cur.o,
      b = build({ practice: o.practice, layout: o.layout, height: o.height, px: o.px, theme: o.theme, fit: cur.fit, page: cur.page, params: cur.params });
    cur.b = b;
    var ta = cur.ov.querySelector(".he-code");
    if (cur.tab === "html") {
      ta.value = b.code;
      cur.ov.querySelector(".he-tnote").innerHTML = o.height === "fixed" ?
        tr("embed.noteFixed", "Paste it where your page editor takes HTML: an <b>HTML</b>, <b>Code</b> or <b>Embed</b> block. The frame stays {h} px tall; anything longer scrolls inside it.", { h: b.height }) :
        tr("embed.noteAuto", "Paste it where your page editor takes HTML: an <b>HTML</b>, <b>Code</b> or <b>Embed</b> block. The few lines of script make the frame as tall as the steps; if your site removes scripts, the frame keeps the height it starts with ({h} px) and anything longer scrolls inside it.", { h: b.height });
    } else {
      ta.value = b.src;
      cur.ov.querySelector(".he-tnote").innerHTML =
        tr("embed.noteUrl", "<b>Google Sites:</b> Insert → Embed → <b>By URL</b>, paste this address (if it asks, choose <b>Whole page</b>), then Insert and drag the box as tall as you want it.<br><b>Canvas:</b> in a page, assignment or quiz, open the HTML editor (<b>&lt;/&gt;</b>) and paste the HTML code (the other tab). Canvas removes scripts, so the frame keeps its height: choose <b>Fixed</b>, or check the height the preview shows.<br><b>Anywhere else:</b> a link to this address opens the same thing full size.");
    }
    var copy = cur.ov.querySelector('[data-a="copy"]');
    copy.textContent = copy._label = cur.tab === "html" ? tr("embed.copyCode", "Copy code") : tr("embed.copyAddress", "Copy address");
  }

  var reloadT = null;

  function reloadPreview() {
    clearTimeout(reloadT);
    reloadT = setTimeout(safe(function() {
      if (!cur) return;
      var fr = cur.ov.querySelector(".he-prev iframe"),
        src = build({ practice: cur.o.practice, layout: cur.o.layout, theme: cur.o.theme, page: cur.page, params: cur.params }).preview;
      if (fr.getAttribute("src") !== src) {
        cur.fit = 0;
        fr.setAttribute("src", src);
      }
    }), 150);
  }

  function close() {
    if (!cur) return;
    var c = cur;
    cur = null;
    c.ov.remove();
    root.classList.remove("he-open");
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("message", onMessage);
    setTimeout(function() { restoreStorage(c.snap); }, 0);
    if (c.back && c.back.focus) try { c.back.focus(); } catch (e) {}
  }

  // info/embed.html (by its short name once site.js knows it)
  function helpPage() {
    var H = window.HelperSite;
    if (!H) return "../info/embed.html";
    return H.id("embed.html") ? H.url("embed.html") : H.url("info/embed.html");
  }

  function open(opts) {
    opts = opts || {};
    close();
    addStyle();
    var page = opts.page || pageName(),
      params = problemParams(opts.params === undefined ? location.search : opts.params),
      label = String(opts.label || "");
    var o = {
      practice: /^(all|step|check)$/.test(opts.practice) ? opts.practice : currentPractice(),
      layout: "simple",
      height: "auto",
      px: 640,
      theme: ""
    };
    var ov = document.createElement("div");
    ov.className = "he-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-labelledby", "heTitle");
    ov.innerHTML = '<div class="he-card">' +
      '<div class="he-top"><div><h2 class="he-title" id="heTitle">' + tr("embed.title", "Put this on your website") + "</h2>" +
      '<div class="he-sub">' + esc(heading()) + (label ? " · " + tr("embed.thisProblem", "this problem: {p}", { p: esc(label.slice(0, 80)) }) : " · " + tr("embed.onScreen", "the problem on screen now")) + "</div></div>" +
      '<button type="button" class="he-x" aria-label="' + esc(tr("embed.close", "Close")) + '">✕</button></div>' +
      '<div class="he-opts">' +
      '<span class="he-k" id="he-k-practice">' + tr("embed.visitors", "Visitors see") + "</span>" +
      radios("practice", [
        ["all", tr("embed.allSteps", "All the steps")],
        ["step", tr("common.oneStep", "One step at a time")],
        ["check", tr("common.checkMine", "Check my answer")]
      ], o.practice) +
      '<span class="he-k" id="he-k-layout">' + tr("embed.layout", "Layout") + "</span>" +
      radios("layout", [
        ["simple", tr("embed.simple", "Just this problem")],
        ["full", tr("embed.whole", "The whole helper")]
      ], o.layout) +
      '<span class="he-k" id="he-k-height">' + tr("embed.height", "Height") + "</span>" +
      '<div class="he-pills" role="radiogroup" aria-labelledby="he-k-height">' +
      '<label class="on"><input type="radio" name="he-height" value="auto" checked>' + tr("embed.grows", "Grows to fit") + "</label>" +
      '<label><input type="radio" name="he-height" value="fixed">' + tr("embed.fixed", "Fixed") + "</label>" +
      '<input type="number" min="150" max="' + MAXH + '" step="10" value="640" aria-label="' + esc(tr("embed.px", "Height in pixels")) + '" disabled><span class="he-px">px</span></div>' +
      '<span class="he-k" id="he-k-theme">' + tr("embed.colors", "Colors") + "</span>" +
      radios("theme", [
        ["", tr("embed.device", "Follow the visitor’s device")],
        ["light", tr("embed.light", "Light")],
        ["dark", tr("embed.dark", "Dark")]
      ], o.theme) +
      "</div>" +
      '<div><p class="he-h">' + tr("embed.preview", "Preview") + ' <span class="he-ph"></span></p><div class="he-prev"><iframe title="' + esc(tr("embed.previewTitle", "Preview of the embedded helper")) + '"></iframe></div></div>' +
      '<div><div class="he-tabs" role="tablist" aria-label="' + esc(tr("embed.where", "Where it goes")) + '">' +
      '<button type="button" role="tab" aria-selected="true" data-tab="html">' + tr("embed.htmlTab", "HTML code") + "</button>" +
      '<button type="button" role="tab" aria-selected="false" data-tab="url">Google Sites / Canvas</button></div>' +
      '<textarea class="he-code" readonly rows="5" spellcheck="false" aria-label="' + esc(tr("embed.codeLabel", "The code to paste")) + '"></textarea>' +
      '<div class="he-row"><button type="button" class="he-btn" data-a="copy">' + tr("embed.copyCode", "Copy code") + "</button></div>" +
      '<p class="he-note he-tnote"></p></div>' +
      '<p class="he-foot">' + tr("embed.foot", "The embed shows the problem that’s on screen now, with a small link back to Show The Steps.") + " " +
      '<a href="' + esc(helpPage()) + '" target="_blank" rel="noopener">' + tr("embed.how", "How embedding works, with examples") + "</a></p>" +
      "</div>";
    document.body.appendChild(ov);
    cur = { ov: ov, o: o, page: page, params: params, tab: "html", fit: 0, back: document.activeElement, snap: snapStorage() };
    root.classList.add("he-open");

    var num = ov.querySelector('input[type="number"]');
    ov.addEventListener("change", safe(function(e) {
      var t = e.target;
      if (t.type === "radio") {
        var k = t.name.replace(/^he-/, "");
        o[k] = t.value;
        [].forEach.call(ov.querySelectorAll('input[name="' + t.name + '"]'), function(r) { r.parentNode.classList.toggle("on", r.checked); });
        if (k === "height") {
          num.disabled = t.value !== "fixed";
          if (!num.disabled) num.focus();
        }
        if (k === "practice" || k === "layout" || k === "theme") reloadPreview();
        paintPreviewHeight();
        paintCode();
      }
    }));
    num.addEventListener("input", safe(function() {
      var v = Math.round(Number(num.value));
      if (v >= 150 && v <= MAXH) {
        o.px = v;
        paintPreviewHeight();
        paintCode();
      }
    }));
    ov.addEventListener("click", safe(function(e) {
      if (e.target === ov) { close(); return; }
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b) return;
      if (b.classList.contains("he-x")) close();
      else if (b.getAttribute("data-tab")) {
        cur.tab = b.getAttribute("data-tab");
        [].forEach.call(ov.querySelectorAll("[data-tab]"), function(x) { x.setAttribute("aria-selected", String(x === b)); });
        paintCode();
      } else if (b.getAttribute("data-a") === "copy") copyText(ov.querySelector(".he-code").value, b, b._label);
    }));
    ov.querySelector(".he-code").addEventListener("focus", function() { this.select(); });
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("message", onMessage);
    paintPreviewHeight();
    paintCode();
    reloadPreview();
    ov.querySelector('input[name="he-practice"]:checked').focus();
    return { close: close };
  }

  window.HelperEmbed = { mode: mode, build: build, snippet: snippet, open: open, close: close, site: site };
})();
