/* QR codes, made right here in the browser (no library, no network), so a teacher can put a practice set or a
   problem on the projector and students open it on a phone.

   Byte mode, text as UTF-8 (no ECI header, as phone scanners expect), error correction L/M/Q/H (M unless asked),
   the smallest version 1–40 that fits, all 8 masks tried and the best kept by the standard penalty rules,
   format and version information as in ISO/IEC 18004.

   HelperQR.matrix(text, { ecc:"M" }) → { size, version, ecc, mask, get(x, y) → true for a dark module }
       (also { version:n } to ask for a version, at least that one, and { mask:0–7 } to force a mask)
   HelperQR.svg(text, { ecc:"M", margin:4, dark:"#000", light:"#fff", label:"QR code", size:px, logo:true, logoMono:false })
       → an SVG string: the modules as one path, shape-rendering="crispEdges", a <title> for screen readers; with size, a
       width and height. Unless logo:false, the site's tile sits in the middle: the code is then made at H (at Q with a
       smaller logo when the text is too long for H; with no logo, at the ecc asked for, when it's too long for Q too).
       logoMono draws the logo in black and white. logo:false gives exactly the plain code that matrix(text, opts) makes.
       With an ecc but no logo option, the caller may have sized the code for that level (the printed worksheet does),
       so the logo goes in only if the code stays within 10% of that many modules across; logo:true always prefers it.
   HelperQR.logoInfo(text, opts) → { ecc, version, size, plate, cleared, damage } for the code svg() would draw (size
       it from this to print a logo code: plate = logo modules across, damage = worst share of a block's correction)
   HelperQR.version(text, ecc) → the version it needs, 1–40, or 0 when it is too long for any QR code
   HelperQR.capacity(ecc[, version]) → how many bytes fit (version 40 unless given): 2953 at L, 2331 at M
   HelperQR.show(text, { title, sub, linkText, ecc, filename, full, tooLongHint, logo, logoMono }) → opens the QR dialog: a big code,
       the title, a short form of the link, Show full screen (for the projector; Esc to leave), Print and Download SVG.
       The logo is on unless logo:false (logoMono:true for a black-and-white one); the download has it too.
       If it doesn't fit at the asked level it drops to L; if it still doesn't fit, the dialog says so instead.
   HelperQR.close() closes it.
   Too long for any version: matrix() and svg() throw an Error with code "too-long", bytes and max, for callers to catch. */
(function() {
  "use strict";
  if (window.HelperQR) return;

  /* ---- the words, in the visitor's language (assets/i18n.js): the qr.* keys, and en.js repeats the English for
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

  /* ===================== the tables ===================== */
  var LEVELS = { L: 0, M: 1, Q: 2, H: 3 };
  var FORMAT_BITS = [1, 0, 3, 2]; // L M Q H as they are written in the format information
  // error correction codewords per block, and the number of blocks, for each level and version (index 0 unused)
  var ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  var BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];

  function level(e) { var k = String(e || "M").toUpperCase(); return LEVELS.hasOwnProperty(k) ? k : "M"; }
  // modules left for data and error correction once the function patterns are drawn
  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      var n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }

  function dataCodewords(ver, e) { return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[e][ver] * BLOCKS[e][ver]; }

  function countBits(ver) { return ver < 10 ? 8 : 16; }

  function capacity(ecc, ver) {
    ver = ver ? Math.max(1, Math.min(40, ver | 0)) : 40;
    return Math.floor((dataCodewords(ver, LEVELS[level(ecc)]) * 8 - 4 - countBits(ver)) / 8);
  }

  /* ===================== text to bytes ===================== */
  function utf8(s) {
    s = String(s);
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0xD800 && c < 0xDC00 && i + 1 < s.length) {
        var d = s.charCodeAt(i + 1);
        if (d >= 0xDC00 && d < 0xE000) {
          c = 0x10000 + ((c - 0xD800) << 10) + (d - 0xDC00);
          i++;
        }
      }
      if (c >= 0xD800 && c < 0xE000) c = 0xFFFD; // a lone surrogate
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | c >> 6, 0x80 | c & 63);
      else if (c < 0x10000) out.push(0xE0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
      else out.push(0xF0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    }
    return out;
  }

  function fits(n, ver, e) { return 4 + countBits(ver) + 8 * n <= dataCodewords(ver, e) * 8; }

  function pickVersion(n, e, from) {
    for (var v = Math.max(1, from || 1); v <= 40; v++)
      if (fits(n, v, e)) return v;
    return 0;
  }

  function tooLong(n, ecc) {
    var max = capacity(ecc),
      err = new Error("Too long for a QR code: " + n + " bytes, and a QR code holds at most " + max +
        " at error correction " + ecc + ".");
    err.code = "too-long";
    err.bytes = n;
    err.max = max;
    return err;
  }

  /* ===================== Reed–Solomon over GF(256) ===================== */
  var EXP = [],
    LOG = [];
  (function() {
    var x = 1,
      i;
    for (i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function gmul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }

  function rsDivisor(deg) {
    var r = [],
      root = 1,
      i, j;
    for (i = 0; i < deg; i++) r.push(0);
    r[deg - 1] = 1;
    for (i = 0; i < deg; i++) {
      for (j = 0; j < deg; j++) { r[j] = gmul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; }
      root = gmul(root, 2);
    }
    return r;
  }

  function rsRemainder(data, div) {
    var r = [],
      i, j;
    for (i = 0; i < div.length; i++) r.push(0);
    for (i = 0; i < data.length; i++) {
      var f = data[i] ^ r.shift();
      r.push(0);
      for (j = 0; j < div.length; j++) r[j] ^= gmul(div[j], f);
    }
    return r;
  }

  /* ===================== the codewords ===================== */
  function codewords(bytes, ver, e) {
    var bits = [],
      cap = dataCodewords(ver, e) * 8,
      i;

    function put(v, n) { for (var k = n - 1; k >= 0; k--) bits.push(v >>> k & 1); }
    put(4, 4); // byte mode
    put(bytes.length, countBits(ver));
    for (i = 0; i < bytes.length; i++) put(bytes[i], 8);
    put(0, Math.min(4, cap - bits.length)); // terminator
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = [];
    for (i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var k = 0; k < 8; k++) b = b << 1 | bits[i + k];
      data.push(b);
    }
    // split into blocks, add each block's error correction, then interleave
    var nb = BLOCKS[e][ver],
      el = ECC_PER_BLOCK[e][ver],
      raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - raw % nb,
      shortLen = Math.floor(raw / nb),
      div = rsDivisor(el),
      blocks = [],
      at = 0;
    for (i = 0; i < nb; i++) {
      var d = data.slice(at, at + shortLen - el + (i < nShort ? 0 : 1));
      at += d.length;
      var ec = rsRemainder(d, div);
      if (i < nShort) d.push(0);
      blocks.push(d.concat(ec));
    }
    var out = [];
    for (i = 0; i < blocks[0].length; i++)
      for (var j = 0; j < nb; j++)
        if (i !== shortLen - el || j >= nShort) out.push(blocks[j][i]);
    return out;
  }

  /* ===================== the symbol ===================== */
  function alignPositions(ver, size) {
    if (ver === 1) return [];
    var n = Math.floor(ver / 7) + 2,
      step = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2,
      out = [];
    for (var p = size - 7; out.length < n - 1; p -= step) out.unshift(p);
    out.unshift(6);
    return out;
  }

  function Grid(ver) {
    var size = ver * 4 + 17;
    this.size = size;
    this.m = new Array(size * size);
    this.f = new Array(size * size);
    for (var i = 0; i < size * size; i++) {
      this.m[i] = 0;
      this.f[i] = 0;
    }
  }
  Grid.prototype.fn = function(x, y, dark) {
    var i = y * this.size + x;
    this.m[i] = dark ? 1 : 0;
    this.f[i] = 1;
  };

  function drawFunctions(g, ver) {
    var size = g.size,
      i, dx, dy;
    for (i = 0; i < size; i++) {
      g.fn(6, i, i % 2 === 0);
      g.fn(i, 6, i % 2 === 0);
    }
    [
      [3, 3],
      [size - 4, 3],
      [3, size - 4]
    ].forEach(function(c) {
      for (dy = -4; dy <= 4; dy++)
        for (dx = -4; dx <= 4; dx++) {
          var x = c[0] + dx,
            y = c[1] + dy,
            d = Math.max(Math.abs(dx), Math.abs(dy));
          if (x >= 0 && x < size && y >= 0 && y < size) g.fn(x, y, d !== 2 && d !== 4);
        }
    });
    var al = alignPositions(ver, size),
      n = al.length;
    for (i = 0; i < n; i++)
      for (var j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (dy = -2; dy <= 2; dy++)
          for (dx = -2; dx <= 2; dx++)
            g.fn(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    drawFormat(g, 0, 0); // reserves the format area; written again once the mask is known
    if (ver >= 7) {
      var rem = ver;
      for (i = 0; i < 12; i++) rem = rem << 1 ^ (rem >>> 11) * 0x1F25;
      var bits = ver << 12 | rem;
      for (i = 0; i < 18; i++) {
        var bit = bits >>> i & 1,
          a = size - 11 + i % 3,
          b = Math.floor(i / 3);
        g.fn(a, b, bit);
        g.fn(b, a, bit);
      }
    }
  }

  function drawFormat(g, eBits, mask) {
    var data = eBits << 3 | mask,
      rem = data,
      i, size = g.size;
    for (i = 0; i < 10; i++) rem = rem << 1 ^ (rem >>> 9) * 0x537;
    var bits = (data << 10 | rem) ^ 0x5412;

    function bit(k) { return bits >>> k & 1; }
    for (i = 0; i <= 5; i++) g.fn(8, i, bit(i));
    g.fn(8, 7, bit(6));
    g.fn(8, 8, bit(7));
    g.fn(7, 8, bit(8));
    for (i = 9; i < 15; i++) g.fn(14 - i, 8, bit(i));
    for (i = 0; i < 8; i++) g.fn(size - 1 - i, 8, bit(i));
    for (i = 8; i < 15; i++) g.fn(8, size - 15 + i, bit(i));
    g.fn(8, size - 8, 1); // the dark module
  }

  function placeData(g, words) {
    var size = g.size,
      i = 0,
      total = words.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var v = 0; v < size; v++)
        for (var j = 0; j < 2; j++) {
          var x = right - j,
            up = (right + 1 & 2) === 0,
            y = up ? size - 1 - v : v,
            k = y * size + x;
          if (!g.f[k] && i < total) {
            g.m[k] = words[i >>> 3] >>> 7 - (i & 7) & 1;
            i++;
          }
        }
    }
  }
  var MASKS = [
    function(x, y) { return (x + y) % 2 === 0; },
    function(x, y) { return y % 2 === 0; },
    function(x, y) { return x % 3 === 0; },
    function(x, y) { return (x + y) % 3 === 0; },
    function(x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
    function(x, y) { return x * y % 2 + x * y % 3 === 0; },
    function(x, y) { return (x * y % 2 + x * y % 3) % 2 === 0; },
    function(x, y) { return ((x + y) % 2 + x * y % 3) % 2 === 0; }
  ];

  function masked(g, mask, eBits) {
    var size = g.size,
      out = { size: size, m: g.m.slice(), f: g.f },
      fn = MASKS[mask];
    for (var y = 0; y < size; y++)
      for (var x = 0; x < size; x++) {
        var k = y * size + x;
        if (!g.f[k] && fn(x, y)) out.m[k] ^= 1;
      }
    drawFormat({ size: size, m: out.m, f: [], fn: Grid.prototype.fn }, eBits, mask);
    return out;
  }
  // the penalty rules: runs of 5 or more, 2×2 blocks, finder-like 1:1:3:1:1 patterns with 4 light beside them, and balance
  function penalty(m, size) {
    var p = 0,
      x, y, run, c, k;
    for (var dir = 0; dir < 2; dir++) {
      for (y = 0; y < size; y++) {
        run = 0;
        c = -1;
        for (x = 0; x < size; x++) {
          k = dir ? x * size + y : y * size + x;
          if (m[k] === c) run++;
          else {
            if (run >= 5) p += run - 2;
            run = 1;
            c = m[k];
          }
        }
        if (run >= 5) p += run - 2;
      }
    }
    for (y = 0; y < size - 1; y++)
      for (x = 0; x < size - 1; x++) {
        k = y * size + x;
        c = m[k];
        if (c === m[k + 1] && c === m[k + size] && c === m[k + size + 1]) p += 3;
      }
    for (dir = 0; dir < 2; dir++) {
      var st = dir ? size : 1;
      for (y = 0; y < size; y++)
        for (x = 0; x + 10 < size; x++) {
          var b = dir ? x * size + y : y * size + x;
          if (!m[b + st] && m[b + 4 * st] && !m[b + 5 * st] && m[b + 6 * st] && !m[b + 9 * st] &&
            ((m[b] && m[b + 2 * st] && m[b + 3 * st] && !m[b + 7 * st] && !m[b + 8 * st] && !m[b + 10 * st]) ||
              (!m[b] && !m[b + 2 * st] && !m[b + 3 * st] && m[b + 7 * st] && m[b + 8 * st] && m[b + 10 * st]))) p += 40;
        }
    }
    var dark = 0;
    for (k = 0; k < m.length; k++) dark += m[k];
    p += Math.floor(Math.abs(dark / (size * size) * 100 - 50) / 5) * 10;
    return p;
  }

  function matrix(text, opts) {
    opts = opts || {};
    var ecc = level(opts.ecc),
      e = LEVELS[ecc],
      bytes = utf8(text);
    var ver = pickVersion(bytes.length, e, opts.version);
    if (!ver) throw tooLong(bytes.length, ecc);
    var g = new Grid(ver);
    drawFunctions(g, ver);
    placeData(g, codewords(bytes, ver, e));
    var eBits = FORMAT_BITS[e],
      best = null,
      bestMask = 0;
    if (opts.mask >= 0 && opts.mask <= 7) {
      bestMask = opts.mask | 0;
      best = masked(g, bestMask, eBits);
    } else {
      var low = Infinity;
      for (var mk = 0; mk < 8; mk++) {
        var t = masked(g, mk, eBits),
          s = penalty(t.m, t.size);
        if (s < low) {
          low = s;
          best = t;
          bestMask = mk;
        }
      }
    }
    var size = g.size,
      mods = best.m;
    return {
      size: size,
      version: ver,
      ecc: ecc,
      mask: bestMask,
      get: function(x, y) { return x >= 0 && y >= 0 && x < size && y < size && mods[y * size + x] === 1; }
    };
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  /* the logo in the middle: the site's tile (dark rounded square) with the four operations, on a white plate.
     With a logo the code is made at H (30% recovery) and the plate clears about 15% of the symbol; if the text is too
     long for H, at Q with a plate of about 9%; too long for Q, no logo (the level asked for, as without a logo).
     The area isn't the whole story (in small versions the fixed patterns take much of the symbol), so the plate is
     also made smaller until it spoils at most 60% of what any one Reed–Solomon block can correct; the rest is left
     for smudges, glare and a shaky camera.
     The plate is a whole number of modules, centered on the grid (the grid is odd, so is the plate), and stays clear
     of the finders and separators, the timing patterns, the format and version information and the corner
     alignment pattern. A centered plate that size can't miss the middle alignment pattern(s) from version 7 on;
     decoders find the grid from the finders and the bottom-right alignment pattern, so those are the ones kept. */
  // [level, the most of the symbol's area the plate may take, the most of any one block's correction it may use]
  var LOGO_LEVELS = [
      ["H", 0.15, 0.6],
      ["Q", 0.09, 0.6]
    ],
    LOGO_MIN_VERSION = 3,
    layouts = {};
  // which codeword (and so which Reed–Solomon block) each module belongs to, for one version and level
  function layout(ver, e) {
    var key = ver + "/" + e;
    if (layouts[key]) return layouts[key];
    var g = new Grid(ver),
      size = g.size,
      i, j;
    drawFunctions(g, ver);
    var nb = BLOCKS[e][ver],
      el = ECC_PER_BLOCK[e][ver],
      raw = Math.floor(rawModules(ver) / 8);
    var nShort = nb - raw % nb,
      shortLen = Math.floor(raw / nb),
      blockOf = [],
      cw = [];
    for (i = 0; i <= shortLen; i++)
      for (j = 0; j < nb; j++)
        if (i !== shortLen - el || j >= nShort) blockOf.push(j);
    for (i = 0; i < size * size; i++) cw.push(-1);
    var bit = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var v = 0; v < size; v++)
        for (j = 0; j < 2; j++) {
          var x = right - j,
            y = (right + 1 & 2) === 0 ? size - 1 - v : v,
            k = y * size + x;
          if (!g.f[k]) {
            if (bit < raw * 8) cw[k] = bit >>> 3;
            bit++;
          }
        }
    }
    return (layouts[key] = { size: size, cw: cw, blockOf: blockOf, nb: nb, fix: Math.floor(el / 2) });
  }
  // the worst share of one block's correction (it fixes up to half its error correction codewords) a centered plate uses
  function damage(L, p) {
    var p0 = (L.size - p) / 2,
      seen = {},
      per = [],
      worst = 0;
    for (var b = 0; b < L.nb; b++) per.push(0);
    for (var y = p0; y < p0 + p; y++)
      for (var x = p0; x < p0 + p; x++) {
        var c = L.cw[y * L.size + x];
        if (c >= 0 && !seen[c]) {
          seen[c] = 1;
          per[L.blockOf[c]]++;
        }
      }
    for (b = 0; b < L.nb; b++) worst = Math.max(worst, per[b] / L.fix);
    return worst;
  }

  function plateFor(ver, e, frac, most) {
    var size = ver * 4 + 17,
      p = Math.floor(Math.sqrt(frac * size * size)),
      L = layout(ver, e);
    if (p % 2 === 0) p--;
    p = Math.min(p, size - 18); // starts at module 9 or later: past the finder, its separator and the format bits
    while (p >= 5 && damage(L, p) > most) p -= 2;
    return p >= 5 ? p : 0;
  }

  function build(text, opts) {
    if (opts.logo !== false) {
      var n = utf8(text).length,
        most = Infinity;
      // a caller that names the level but doesn't ask for the logo may have sized the code for that level (the printed
      // worksheet does: a 2 cm code); the logo then only goes in if the modules stay within 10% of that size
      if (opts.logo === undefined && opts.ecc) {
        var own = pickVersion(n, LEVELS[level(opts.ecc)], opts.version);
        if (own) most = (own * 4 + 17 + 8) * 1.1;
      }
      for (var i = 0; i < LOGO_LEVELS.length; i++) {
        var lv = LOGO_LEVELS[i][0],
          v = pickVersion(n, LEVELS[lv], Math.max(LOGO_MIN_VERSION, opts.version | 0));
        if (!v || v * 4 + 17 + 8 > most) continue;
        var plate = plateFor(v, LEVELS[lv], LOGO_LEVELS[i][1], LOGO_LEVELS[i][2]);
        // in a few versions the blocks line up badly under the middle and the plate comes out small; one version up
        // is barely denser, so take it when its logo is half as big again
        if (v < 40 && v * 4 + 29 <= most) {
          var up = plateFor(v + 1, LEVELS[lv], LOGO_LEVELS[i][1], LOGO_LEVELS[i][2]),
            s0 = v * 4 + 17,
            s1 = s0 + 4;
          if (plate * plate / (s0 * s0) < 0.08 && up * up / (s1 * s1) >= 1.5 * plate * plate / (s0 * s0)) {
            v++;
            plate = up;
          }
        }
        if (plate) return { q: matrix(text, { ecc: lv, version: v, mask: opts.mask }), plate: plate };
      }
    }
    return { q: matrix(text, opts), plate: 0 };
  }

  function num(x) { return String(Math.round(x * 1000) / 1000); }

  function logoSVG(x0, p, mono, light) {
    // the tile's dark rim and the gap between the squares are kept thin: a dark rim, a light square and a dark
    // symbol in its middle at the icon's proportions look enough like a finder pattern to send a scanner the wrong way
    var ink = "#19211D",
      inset = p >= 9 ? 1 : 0.6,
      t = p - 2 * inset,
      tx = x0 + inset;
    var c = t * 0.45,
      gap = t * 0.03,
      m0 = (t - 2 * c - gap) / 2,
      sw = c * 0.15,
      a = c * 0.25,
      b = a * 0.86;
    var cols = mono ? ["#fff", "#fff", "#fff", "#fff"] : ["#4FCCB0", "#F08A6E", "#A99CF0", "#F2A85C"];
    var tile = mono ? "#000" : ink,
      sym = mono ? "#000" : ink;
    var out = '<g shape-rendering="geometricPrecision">' +
      '<rect x="' + num(x0) + '" y="' + num(x0) + '" width="' + p + '" height="' + p + '" rx="' + num(Math.min(1.2, p * 0.12)) + '" fill="' + esc(light) + '"/>' +
      '<rect x="' + num(tx) + '" y="' + num(tx) + '" width="' + num(t) + '" height="' + num(t) + '" rx="' + num(t * 112 / 512) + '" fill="' + tile + '"/>';
    var lines = "",
      dots = "";
    for (var k = 0; k < 4; k++) {
      var sx = tx + m0 + (k % 2) * (c + gap),
        sy = tx + m0 + Math.floor(k / 2) * (c + gap),
        cx = sx + c / 2,
        cy = sy + c / 2;
      out += '<rect x="' + num(sx) + '" y="' + num(sy) + '" width="' + num(c) + '" height="' + num(c) + '" rx="' + num(c * 20 / 88) + '" fill="' + cols[k] + '"/>';
      if (k === 0) lines += "M" + num(cx - a) + " " + num(cy) + "H" + num(cx + a) + "M" + num(cx) + " " + num(cy - a) + "V" + num(cy + a); // +
      if (k === 1 || k === 3) lines += "M" + num(cx - a) + " " + num(cy) + "H" + num(cx + a); // − and the bar of ÷
      if (k === 2) lines += "M" + num(cx - b) + " " + num(cy - b) + "L" + num(cx + b) + " " + num(cy + b) +
        "M" + num(cx + b) + " " + num(cy - b) + "L" + num(cx - b) + " " + num(cy + b); // ×
      if (k === 3) dots += '<circle cx="' + num(cx) + '" cy="' + num(cy - c * 0.22) + '" r="' + num(c * 0.08) + '"/>' +
        '<circle cx="' + num(cx) + '" cy="' + num(cy + c * 0.22) + '" r="' + num(c * 0.08) + '"/>';
    }
    return out + '<path d="' + lines + '" fill="none" stroke="' + sym + '" stroke-width="' + num(sw) + '" stroke-linecap="round"/>' +
      '<g fill="' + sym + '">' + dots + "</g></g>";
  }

  function draw(b, opts) {
    var q = b.q,
      mg = opts.margin === undefined ? 4 : Math.max(0, opts.margin | 0),
      n = q.size + mg * 2,
      d = [];
    var p0 = (q.size - b.plate) / 2,
      p1 = p0 + b.plate; // the modules under the plate are left out
    function on(x, y) { return q.get(x, y) && !(b.plate && x >= p0 && x < p1 && y >= p0 && y < p1); }
    for (var y = 0; y < q.size; y++) {
      for (var x = 0; x < q.size; x++) {
        if (!on(x, y)) continue;
        var run = 1;
        while (on(x + run, y)) run++;
        d.push("M" + (x + mg) + " " + (y + mg) + "h" + run + "v1h-" + run + "z");
        x += run - 1;
      }
    }
    var label = opts.label || tr("qr.code", "QR code");
    var wh = opts.size ? ' width="' + Math.round(opts.size) + '" height="' + Math.round(opts.size) + '"' : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + n + " " + n + '"' + wh +
      ' shape-rendering="crispEdges" role="img" aria-label="' + esc(label) + '"><title>' + esc(label) + "</title>" +
      '<rect width="' + n + '" height="' + n + '" fill="' + esc(opts.light || "#fff") + '"/>' +
      '<path fill="' + esc(opts.dark || "#000") + '" d="' + d.join("") + '"/>' +
      (b.plate ? logoSVG(p0 + mg, b.plate, !!opts.logoMono, opts.light || "#fff") : "") + "</svg>";
  }

  function svg(text, opts) {
    opts = opts || {};
    return draw(build(text, opts), opts);
  }
  // the code svg() would draw: { ecc, version, size, plate (modules across, 0 for none), cleared (share of the symbol) }
  function logoInfo(text, opts) {
    var b = build(text, opts || {});
    return {
      ecc: b.q.ecc,
      version: b.q.version,
      size: b.q.size,
      plate: b.plate,
      cleared: b.plate * b.plate / (b.q.size * b.q.size),
      damage: b.plate ? damage(layout(b.q.version, LEVELS[b.q.ecc]), b.plate) : 0
    };
  }

  function version(text, ecc) { return pickVersion(utf8(text).length, LEVELS[level(ecc)]); }

  /* ===================== the dialog, and full screen for the projector ===================== */
  var CSS =
    "html.hq-open{overflow:hidden}" +
    ".hq-ov{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;" +
    "background:rgba(10,14,12,.62);font-family:var(--f-body,\"IBM Plex Sans\",\"Segoe UI\",Arial,sans-serif)}" +
    ".hq-card{background:var(--surface,#fff);color:var(--ink,#111);border:1px solid var(--rule,#ccc);border-radius:16px;width:100%;" +
    "max-width:480px;max-height:100%;overflow:auto;padding:16px 18px 18px;display:flex;flex-direction:column;gap:12px;" +
    "box-shadow:0 24px 60px -24px rgba(0,0,0,.7)}" +
    ".hq-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}" +
    ".hq-title{font-family:var(--f-display,\"Archivo\",Arial,sans-serif);font-stretch:112%;font-weight:800;font-size:20px;line-height:1.15;" +
    "margin:0;overflow-wrap:anywhere}" +
    ".hq-sub{font-size:13.5px;color:var(--ink-2,#444);margin-top:3px;overflow-wrap:anywhere}" +
    ".hq-x{flex:none;font:600 14px/1 var(--f-body,Arial,sans-serif);color:var(--ink-2,#444);background:transparent;" +
    "border:1px solid var(--rule,#ccc);border-radius:999px;padding:7px 11px;cursor:pointer}" +
    ".hq-x:hover{color:var(--ink,#111);border-color:var(--ink-3,#777)}" +
    ".hq-code{align-self:center;width:min(400px,100%,calc(100vh - 290px));min-width:180px;background:#fff;border-radius:8px;line-height:0}" +
    ".hq-code svg{display:block;width:100%;height:auto}" +
    ".hq-link{font-family:var(--f-mono,\"IBM Plex Mono\",Consolas,monospace);font-size:12.5px;color:var(--ink-3,#666);text-align:center;" +
    "overflow-wrap:anywhere}" +
    ".hq-link a{color:var(--ink-2,#444)}" +
    ".hq-note{font-size:14px;color:var(--warm,#9A5410);background:var(--warm-bg,#F6E5D2);border-radius:10px;padding:12px 14px;margin:0}" +
    ".hq-acts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}" +
    ".hq-btn{font:600 14px/1.2 var(--f-body,Arial,sans-serif);color:var(--ink,#111);background:transparent;border:1px solid var(--rule,#ccc);" +
    "border-radius:9px;padding:8px 14px;cursor:pointer}" +
    ".hq-btn:hover{border-color:var(--ink-3,#777)}" +
    ".hq-btn.hq-main{background:var(--key,#33463F);color:var(--surface,#fff);border-color:transparent}" +
    ".hq-btn.hq-main:hover{filter:brightness(1.08)}" +
    ".hq-hint{font-size:12.5px;color:var(--ink-3,#666);text-align:center;margin:0}" +
    ".hq-ov button:focus-visible,.hq-ov a:focus-visible{outline:2.5px solid var(--focus,#33463F);outline-offset:2px}" +
    ".hq-exit{display:none}" +
    /* full screen: black on white, as big as the screen allows */
    ".hq-ov.hq-full{background:#fff;padding:2vmin}" +
    ".hq-full .hq-card{background:#fff;color:#000;border:0;box-shadow:none;max-width:none;height:100%;border-radius:0;padding:0;" +
    "justify-content:center;align-items:center;gap:1.4vmin;overflow:hidden}" +
    ".hq-full .hq-top{justify-content:center;text-align:center}" +
    ".hq-full .hq-title{color:#000;font-size:clamp(22px,4.2vmin,54px)}" +
    ".hq-full .hq-sub{color:#000;font-size:clamp(15px,2.4vmin,28px)}" +
    ".hq-full .hq-code{width:min(96vw,calc(100vh - 4vmin - 2 * clamp(22px,4.2vmin,54px) - 2 * clamp(15px,2.4vmin,28px) - 6vmin));min-width:0;border-radius:0}" +
    ".hq-full .hq-link{color:#000;font-size:clamp(13px,2vmin,24px)}" +
    ".hq-full .hq-link a{color:#000}" +
    ".hq-full .hq-x,.hq-full .hq-acts,.hq-full .hq-hint{display:none}" +
    ".hq-full .hq-exit{display:block;position:fixed;top:12px;right:12px;font:600 14px/1 Arial,sans-serif;color:#000;background:#fff;" +
    "border:1px solid #888;border-radius:999px;padding:8px 14px;cursor:pointer;opacity:.75}" +
    ".hq-full .hq-exit:hover,.hq-full .hq-exit:focus{opacity:1}" +
    "@media print{" +
    "html.hq-open{overflow:visible}" +
    "html.hq-open body>*:not(.hq-ov){display:none !important}" +
    "html.hq-open body{background:#fff !important}" +
    ".hq-ov,.hq-ov.hq-full{position:static;display:block;background:#fff;padding:0}" +
    ".hq-card{border:0;box-shadow:none;max-width:none;height:auto;color:#000;background:#fff;align-items:center;text-align:center;overflow:visible}" +
    ".hq-top{justify-content:center}.hq-title,.hq-sub,.hq-link,.hq-link a{color:#000}" +
    ".hq-code{width:110mm;min-width:0}" +
    ".hq-x,.hq-acts,.hq-hint,.hq-exit{display:none !important}" +
    "}";
  var styled = false,
    cur = null;

  function addStyle() {
    if (styled) return;
    var st = document.createElement("style");
    st.textContent = CSS;
    document.head.appendChild(st);
    styled = true;
  }

  function shortLink(t) {
    var s = String(t).replace(/^https?:\/\//i, "");
    return s.length > 64 ? s.slice(0, 46) + "…" + s.slice(-12) : s;
  }

  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }

  function setFull(on) {
    if (!cur) return;
    cur.ov.classList.toggle("hq-full", on);
    if (on) {
      var el = cur.ov,
        req = el.requestFullscreen || el.webkitRequestFullscreen;
      try { var p = req && req.call(el); if (p && p["catch"]) p["catch"](function() {}); } catch (e) {}
      cur.ov.querySelector(".hq-exit").focus();
    } else {
      if (fsElement() === cur.ov) {
        var ex = document.exitFullscreen || document.webkitExitFullscreen;
        try { var q = ex && ex.call(document); if (q && q["catch"]) q["catch"](function() {}); } catch (e) {}
      }
      var fb = cur.ov.querySelector('[data-a="full"]');
      if (fb) fb.focus();
    }
  }

  function onFsChange() { if (cur && !fsElement() && cur.ov.classList.contains("hq-full")) setFull(false); }

  function focusables() {
    return [].filter.call(cur.ov.querySelectorAll("button, a[href]"), function(b) { return b.offsetParent !== null || b === document.activeElement; });
  }

  function onKey(e) {
    if (!cur) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      e.stopPropagation();
      if (cur.ov.classList.contains("hq-full")) setFull(false);
      else close();
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

  function download(text, o, filename) {
    var b = build(text, o);
    var src = '<?xml version="1.0" encoding="UTF-8"?>\n' + draw(b, { label: o.label, logoMono: o.logoMono, size: (b.q.size + 8) * 8 }) + "\n";
    var a = document.createElement("a"),
      url = null;
    try { url = URL.createObjectURL(new Blob([src], { type: "image/svg+xml" })); } catch (e) {}
    a.href = url || "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
    a.download = filename || "qr-code.svg";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { a.remove(); if (url) URL.revokeObjectURL(url); }, 1500);
  }

  function close() {
    if (!cur) return;
    var c = cur;
    if (fsElement() === c.ov) { var ex = document.exitFullscreen || document.webkitExitFullscreen; try { var p = ex && ex.call(document); if (p && p["catch"]) p["catch"](function() {}); } catch (e) {} }
    cur = null;
    c.ov.remove();
    document.documentElement.classList.remove("hq-open");
    window.removeEventListener("keydown", onKey, true);
    document.removeEventListener("fullscreenchange", onFsChange);
    document.removeEventListener("webkitfullscreenchange", onFsChange);
    if (c.back && c.back.focus) try { c.back.focus(); } catch (e) {}
  }

  function show(text, opts) {
    opts = opts || {};
    close();
    addStyle();
    text = String(text);
    var title = opts.title || tr("qr.code", "QR code"),
      label = tr("qr.for", "QR code for {t}", { t: title }),
      ecc = level(opts.ecc),
      n = utf8(text).length;
    if (!version(text, ecc) && version(text, "L")) ecc = "L";
    var ok = version(text, ecc) > 0;
    var so = { ecc: ecc, label: label, logo: opts.logo !== false, logoMono: !!opts.logoMono },
      used = ecc;
    if (ok) try { used = build(text, so).q.ecc; } catch (e) {}
    var link = /^https?:\/\//i.test(text) ?
      '<a href="' + esc(text) + '">' + esc(opts.linkText || shortLink(text)) + "</a>" : esc(opts.linkText || shortLink(text));
    var ov = document.createElement("div");
    ov.className = "hq-ov";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-labelledby", "hqTitle");
    ov.innerHTML = '<div class="hq-card">' +
      '<div class="hq-top"><div><h2 class="hq-title" id="hqTitle">' + esc(title) + "</h2>" +
      (opts.sub ? '<div class="hq-sub">' + esc(opts.sub) + "</div>" : "") + "</div>" +
      '<button type="button" class="hq-x" aria-label="' + esc(tr("qr.close", "Close")) + '">✕</button></div>' +
      (ok ? '<div class="hq-code">' + svg(text, so) + "</div>" :
        '<p class="hq-note">' + tr("qr.tooLong", "<b>This link is too long for a QR code.</b> It has {n} characters, and a QR code holds at most {max}.", { n: n.toLocaleString(), max: capacity("L").toLocaleString() }) +
        " " + esc(opts.tooLongHint || tr("qr.tooLongHint", "Copy the link and send it instead.")) + "</p>") +
      '<div class="hq-link">' + link + (n > 64 ? " · " + tr("qr.chars", "{n} characters", { n: n.toLocaleString() }) : "") + "</div>" +
      (ok ? '<div class="hq-acts"><button type="button" class="hq-btn hq-main" data-a="full">' + tr("qr.full", "Show full screen") + "</button>" +
        '<button type="button" class="hq-btn" data-a="print">' + tr("qr.print", "Print") + "</button>" +
        '<button type="button" class="hq-btn" data-a="dl">' + tr("qr.download", "Download SVG") + "</button></div>" +
        '<p class="hq-hint">' + tr("qr.hint", "Point a phone’s camera at the code to open the link.") + "</p>" : "") +
      '<button type="button" class="hq-exit">' + tr("qr.exit", "Exit full screen ✕") + "</button></div>";
    document.body.appendChild(ov);
    cur = { ov: ov, back: document.activeElement };
    document.documentElement.classList.add("hq-open");
    ov.addEventListener("click", function(e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (e.target === ov && !ov.classList.contains("hq-full")) { close(); return; }
      if (!b) return;
      var a = b.getAttribute("data-a");
      if (b.classList.contains("hq-x")) close();
      else if (b.classList.contains("hq-exit")) setFull(false);
      else if (a === "full") setFull(true);
      else if (a === "print") window.print();
      else if (a === "dl") download(text, so, opts.filename);
    });
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    if (ok && opts.full) setFull(true);
    else ov.querySelector(ok ? '[data-a="full"]' : ".hq-x").focus();
    return { close: close, ecc: used, fits: ok };
  }

  window.HelperQR = { matrix: matrix, svg: svg, logoInfo: logoInfo, version: version, capacity: capacity, show: show, close: close, utf8: utf8 };
})();
