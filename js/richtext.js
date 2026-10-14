/* Rich text: tiny markup (sub/superscript + automatic chemical formula formatting),
   measuring with canvas and absolute layout into positioned runs. Every run becomes its
   own <text> element so the output renders identically in the browser and in the PDF. */
(function (CS) {
  'use strict';

  var FONTS = {
    ChemSans: 'ChemSans, Arial, Helvetica, sans-serif',
    ChemSerif: 'ChemSerif, "Times New Roman", Times, serif'
  };
  var ASCENT = 0.905, DESCENT = 0.212, CAP = 0.716;
  var ctx = document.createElement('canvas').getContext('2d');
  var cache = new Map();

  function cssFamily(f) { return FONTS[f] || FONTS.ChemSans; }

  function measure(str, font, size, bold, italic) {
    var key = font + '|' + (bold ? 1 : 0) + (italic ? 1 : 0) + '|' + str;
    var w = cache.get(key);
    if (w === undefined) {
      ctx.font = (italic ? 'italic ' : '') + (bold ? 'bold ' : '') + '100px ' + cssFamily(font);
      w = ctx.measureText(str).width / 100;
      if (cache.size > 20000) cache.clear();
      cache.set(key, w);
    }
    return w * size;
  }

  // Formula-looking word -> segments with subscripts/superscripts.
  function chemWord(word) {
    if (!/[A-Z]/.test(word) || !/^[A-Za-z0-9()\[\]·.,;:+\-−]+$/.test(word)) return null;
    // a word that is only an element-free number/letter mix like "Step2" is still formatted;
    // that is acceptable for a chemistry drawing tool.
    var out = [], m;
    var core = word, tail = '';
    m = /[.,;:]+$/.exec(core);
    if (m) { tail = m[0]; core = core.slice(0, m.index); }
    var charge = '';
    m = /[A-Za-z0-9)\]]([+\-−])$/.exec(core);
    if (m) {
      charge = m[1].replace('-', '−');
      core = core.slice(0, -1);
    }
    var re = /(\d+)/g, last = 0;
    while ((m = re.exec(core))) {
      var prev = core.charAt(m.index - 1);
      if (m.index > 0 && /[A-Za-z)\]]/.test(prev)) {
        if (m.index > last) out.push({ t: core.slice(last, m.index), s: 0 });
        out.push({ t: m[1], s: -1 });
        last = m.index + m[1].length;
      }
    }
    if (last < core.length) out.push({ t: core.slice(last), s: 0 });
    if (charge) out.push({ t: charge, s: 1 });
    if (tail) out.push({ t: tail, s: 0 });
    return out;
  }

  // Parse markup into paragraphs of segments {t, s} (s: 0 normal, 1 sup, -1 sub).
  //   H_2O  CO_{2}Et  Na^+  x^{2-}   \_ \^ for literal characters.
  function parse(src, chem) {
    var paras = [[]];
    var cur = paras[0];
    var buf = '';
    function flush(s) {
      if (!buf) return;
      if (s === 0 && chem) {
        buf.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          var segs = /\s/.test(w) ? null : chemWord(w);
          if (segs) segs.forEach(function (x) { cur.push(x); });
          else cur.push({ t: w, s: 0 });
        });
      } else cur.push({ t: buf, s: s });
      buf = '';
    }
    src = String(src == null ? '' : src);
    for (var i = 0; i < src.length; i++) {
      var c = src.charAt(i);
      if (c === '\\' && i + 1 < src.length && /[_^\\{}]/.test(src.charAt(i + 1))) {
        buf += src.charAt(++i);
      } else if (c === '\n') {
        flush(0);
        cur = [];
        paras.push(cur);
      } else if ((c === '_' || c === '^') && i + 1 < src.length && src.charAt(i + 1) !== ' ') {
        flush(0);
        var s = c === '_' ? -1 : 1, t;
        if (src.charAt(i + 1) === '{') {
          var j = src.indexOf('}', i + 2);
          if (j < 0) j = src.length;
          t = src.slice(i + 2, j);
          i = j;
        } else {
          t = src.charAt(i + 1);
          i++;
        }
        if (s === 1) t = t.replace(/-/g, '−');
        cur.push({ t: t, s: s });
      } else buf += c;
    }
    flush(0);
    return paras;
  }

  // Layout -> {w, h, runs:[{x,y,t,size}], lines}
  // opts: font, size, bold, italic, width (wrap), align, chem, lineHeight
  function layout(src, o) {
    var font = o.font || 'ChemSans', size = o.size || 10, bold = !!o.bold, italic = !!o.italic;
    var lh = size * (o.lineHeight || 1.2);
    var paras = parse(src, o.chem !== false);
    var spaceW = measure(' ', font, size, bold, italic);
    function segSize(s) { return s ? size * 0.7 : size; }
    function segW(seg) { return measure(seg.t, font, segSize(seg.s), bold, italic); }

    var lines = [];
    paras.forEach(function (segs) {
      // split into words (sequences of parts without whitespace)
      var words = [], cur = null;
      segs.forEach(function (seg) {
        seg.t.split(/(\s+)/).forEach(function (piece) {
          if (piece === '') return;
          if (/^\s+$/.test(piece)) { cur = null; return; }
          if (!cur) { cur = { parts: [] }; words.push(cur); }
          cur.parts.push({ t: piece, s: seg.s });
        });
      });
      words.forEach(function (w) { w.w = w.parts.reduce(function (a, p) { return a + segW(p); }, 0); });
      var line = [], lw = 0;
      words.forEach(function (w) {
        if (o.width && line.length && lw + spaceW + w.w > o.width) {
          lines.push({ words: line, w: lw });
          line = []; lw = 0;
        }
        lw += (line.length ? spaceW : 0) + w.w;
        line.push(w);
      });
      lines.push({ words: line, w: lw });
    });

    var maxW = 0;
    lines.forEach(function (l) { if (l.w > maxW) maxW = l.w; });
    var boxW = o.width ? Math.max(o.width, 1) : maxW;
    var runs = [];
    lines.forEach(function (l, li) {
      var x = 0;
      if (o.align === 'center') x = (boxW - l.w) / 2;
      else if (o.align === 'right') x = boxW - l.w;
      var base = size * ASCENT + li * lh;
      var run = null;
      l.words.forEach(function (w, wi) {
        w.parts.forEach(function (p, pi) {
          var lead = wi > 0 && pi === 0;
          if (run && run.s === p.s) {
            run.t += (lead ? ' ' : '') + p.t;
          } else {
            if (run) x = run.x + measure(run.t, font, segSize(run.s), bold, italic);
            if (lead) x += spaceW;
            run = { x: x, s: p.s, t: p.t };
            runs.push(run);
          }
        });
      });
      runs.forEach(function (r) {
        if (r.y === undefined) {
          r.y = base + (r.s === -1 ? size * 0.22 : r.s === 1 ? -size * 0.38 : 0);
          r.size = segSize(r.s);
        }
      });
    });
    var h = lines.length ? (lines.length - 1) * lh + size * (ASCENT + DESCENT) : size;
    return { w: boxW, h: h, runs: runs, font: font, size: size, bold: bold, italic: italic, lines: lines.length };
  }

  function toSVG(lay, x, y, fill, extra) {
    var fam = CS.esc(cssFamily(lay.font));
    var attrs = ' font-family="' + fam + '"' + (lay.bold ? ' font-weight="bold"' : '') + (lay.italic ? ' font-style="italic"' : '') +
      ' fill="' + (fill || '#000') + '"' + (extra || '');
    return lay.runs.map(function (r) {
      return '<text x="' + CS.n(x + r.x) + '" y="' + CS.n(y + r.y) + '" font-size="' + CS.n(r.size) + '"' + attrs + '>' + CS.esc(r.t) + '</text>';
    }).join('');
  }

  CS.Text = {
    FONTS: FONTS,
    ASCENT: ASCENT,
    DESCENT: DESCENT,
    CAP: CAP,
    cssFamily: cssFamily,
    measure: measure,
    parse: parse,
    layout: layout,
    toSVG: toSVG,
    clearCache: function () { cache.clear(); }
  };
})(window.CS);
