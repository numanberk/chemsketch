/* SVG rendering of a page: structures (ChemDraw-style bond/label drawing), arrows, shapes,
   text, lab apparatus, flowchart boxes, callouts and connectors. Also bounding boxes. */
(function (CS) {
  'use strict';
  var V = CS.V, Chem = CS.Chem, T = CS.Text;

  function S() { return CS.settings(); }

  // ---------------------------------------------------------------- atom labels
  function splitTok(tok) {
    var m = /^(.*?)(\d*)$/.exec(tok);
    return { letters: m[1], digits: m[2] };
  }

  function atomLabel(g, atom, st) {
    var nbs = g.adj.get(atom.id).map(function (b) { return g.atoms.get(Chem.other(b, atom.id)); });
    var deg = nbs.length, fs = st.fontSize, font = st.font, L = st.bondLength;
    var tokens, anchor = 0, left = false;
    var sumdx = 0;
    nbs.forEach(function (n) { sumdx += n.x - atom.x; });
    if (atom.label) {
      tokens = Chem.labelTokens(atom.label);
      left = deg > 0 && sumdx > 0.2 * L && tokens.length > 1;
    } else {
      var visible = atom.el !== 'C' || deg === 0 || atom.showC || atom.isotope;
      if (!visible) return null;
      var h = Chem.implicitH(g, atom);
      tokens = [(atom.isotope ? '' : '') + atom.el];
      if (h) tokens.push('H' + (h > 1 ? h : ''));
      if (deg === 0) left = h > 0 && /^(O|S|Se|Te|F|Cl|Br|I)$/.test(atom.el);
      else left = h > 0 && sumdx > 0.2 * L;
    }
    if (left) { tokens = tokens.slice().reverse(); anchor = tokens.length - 1; }
    // measure
    var parts = tokens.map(function (t) {
      var sp = splitTok(t);
      var lw = T.measure(sp.letters, font, fs), dw = sp.digits ? T.measure(sp.digits, font, fs * 0.7) : 0;
      return { letters: sp.letters, digits: sp.digits, lw: lw, dw: dw, w: lw + dw };
    });
    var a = parts[anchor];
    var firstW = T.measure(a.letters.charAt(0) || ' ', font, fs);
    var x = atom.x - firstW / 2;
    for (var i = 0; i < anchor; i++) x -= parts[i].w;
    var cap = T.CAP * fs, base = atom.y + cap / 2;
    var runs = [], boxes = [], pad = st.margin;
    parts.forEach(function (p, i) {
      runs.push({ x: x, y: base, t: p.letters, size: fs });
      if (p.digits) runs.push({ x: x + p.lw, y: base + fs * 0.22, t: p.digits, size: fs * 0.7 });
      // the box of the anchor letter is centred on the atom
      var top = atom.y - cap / 2 - pad, bot = atom.y + cap / 2 + pad + (p.digits ? fs * 0.18 : 0);
      boxes.push({ x: x - pad, y: top, w: p.w + 2 * pad, h: bot - top });
      x += p.w;
    });
    return { runs: runs, boxes: boxes, left: left, right: x, leftX: runs[0].x, color: atom.color || (st.colorAtoms && Chem.COLORS[atom.el]) || '#000' };
  }

  // largest angular gap direction around an atom (radians)
  function freeDirections(g, atom, count, avoidRight) {
    var angs = g.adj.get(atom.id).map(function (b) {
      var o = g.atoms.get(Chem.other(b, atom.id));
      return Math.atan2(o.y - atom.y, o.x - atom.x);
    });
    if (avoidRight) angs.push(0);
    var cands = [];
    for (var k = 0; k < 16; k++) cands.push(-Math.PI / 2 + k * Math.PI / 8);
    var out = [];
    for (var n = 0; n < count; n++) {
      var best = null, bestScore = -1;
      cands.forEach(function (c) {
        var all = angs.concat(out);
        var m = all.length ? Math.min.apply(null, all.map(function (x) {
          var d = Math.abs(((c - x) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
          return d;
        })) : Math.PI;
        // prefer up/right slightly
        var score = m + (c === -Math.PI / 2 ? 0.01 : 0);
        if (score > bestScore + 1e-6) { bestScore = score; best = c; }
      });
      out.push(best);
    }
    return out;
  }

  function bondAngles(g, atom) {
    return g.adj.get(atom.id).map(function (b) {
      var o = g.atoms.get(Chem.other(b, atom.id));
      return Math.atan2(o.y - atom.y, o.x - atom.x);
    });
  }
  function angDist(a, b) { return Math.abs(((a - b) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); }
  function bondNear(g, atom, ang) {
    return bondAngles(g, atom).some(function (x) { return angDist(x, ang) < Math.PI / 3; });
  }
  // free direction around an atom, preferring `pref` (radians)
  function bestDirection(g, atom, pref, extra) {
    var angs = bondAngles(g, atom).concat(extra || []), best = pref, bestScore = -Infinity;
    for (var k = 0; k < 24; k++) {
      var c = -Math.PI + k * Math.PI / 12;
      var m = angs.length ? Math.min.apply(null, angs.map(function (x) { return angDist(c, x); })) : Math.PI;
      var score = Math.min(m, Math.PI * 0.45) - 0.12 * angDist(c, pref);
      if (score > bestScore) { bestScore = score; best = c; }
    }
    return best;
  }

  // ---------------------------------------------------------------- bonds
  function clipSeg(p, q, bp, bq) {
    var t0 = 0, t1 = 1;
    (bp || []).forEach(function (r) {
      var h = CS.segRectHit(p, q, r);
      if (h) t0 = Math.max(t0, h[1]);
    });
    (bq || []).forEach(function (r) {
      var h = CS.segRectHit(p, q, r);
      if (h) t1 = Math.min(t1, h[0]);
    });
    if (t1 - t0 < 0.02) return null;
    return [V.lerp(p, q, t0), V.lerp(p, q, t1)];
  }

  function line(p, q, w, color, extra) {
    return '<line x1="' + CS.n(p.x) + '" y1="' + CS.n(p.y) + '" x2="' + CS.n(q.x) + '" y2="' + CS.n(q.y) +
      '" stroke="' + color + '" stroke-width="' + CS.n(w) + '" stroke-linecap="round"' + (extra || '') + '/>';
  }
  function poly(pts, fill, stroke, w) {
    return '<polygon points="' + pts.map(function (p) { return CS.n(p.x) + ',' + CS.n(p.y); }).join(' ') + '" fill="' + fill + '"' +
      (stroke ? ' stroke="' + stroke + '" stroke-width="' + CS.n(w) + '" stroke-linejoin="round"' : ' stroke="none"') + '/>';
  }

  function doubleSide(g, bond, A, B) {
    if (bond.dbPos === 'center') return 0;
    if (bond.dbPos === 'left') return 1;
    if (bond.dbPos === 'right') return -1;
    var ab = V.sub(B, A);
    var ring = Chem.ringThrough(g, bond);
    if (ring) {
      // try a second ring on the other side and prefer the one with more double bonds
      var avoid = new Set(ring.slice(1, -1));
      var ring2 = Chem.ringThrough(g, bond, avoid);
      function center(r) {
        var c = { x: 0, y: 0 };
        r.forEach(function (id) { var a = g.atoms.get(id); c.x += a.x; c.y += a.y; });
        return V.mul(c, 1 / r.length);
      }
      function dbl(r) {
        var n = 0, set = new Set(r);
        g.bonds.forEach(function (b) { if (b.order === 2 && set.has(b.a) && set.has(b.b)) n++; });
        return n;
      }
      var use = ring;
      if (ring2 && ring2.length <= ring.length + 1) {
        if (dbl(ring2) > dbl(ring) || (dbl(ring2) === dbl(ring) && ring2.length < ring.length)) use = ring2;
      }
      var c = center(use);
      return V.cross(ab, V.sub(c, A)) >= 0 ? 1 : -1;
    }
    function sides(id, from, skip) {
      var s = [];
      g.adj.get(id).forEach(function (b) {
        if (b.id === skip) return;
        var o = g.atoms.get(Chem.other(b, id));
        var c = V.cross(ab, V.sub(o, from));
        s.push(c > 0 ? 1 : c < 0 ? -1 : 0);
      });
      return s;
    }
    var sa = sides(bond.a, A, bond.id), sb = sides(bond.b, A, bond.id);
    if (!sa.length && !sb.length) return 0;
    function oneSide(s) { return s.length === 1 ? s[0] : 0; }
    if (!sa.length) return sb.length === 1 ? oneSide(sb) : 0;
    if (!sb.length) return sa.length === 1 ? oneSide(sa) : 0;
    var sum = sa.concat(sb).reduce(function (x, y) { return x + y; }, 0);
    if (sum > 0) return 1;
    if (sum < 0) return -1;
    return sa[0] || 1;
  }

  function renderBond(g, bond, labels, st) {
    var a = g.atoms.get(bond.a), b = g.atoms.get(bond.b);
    if (!a || !b) return '';
    var A = { x: a.x, y: a.y }, B = { x: b.x, y: b.y };
    var la = labels.get(a.id), lb = labels.get(b.id);
    var ba = la && la.boxes, bb = lb && lb.boxes;
    var color = bond.color || '#000', lw = st.lineWidth, L = st.bondLength;
    var sp = st.spacing, u = V.norm(V.sub(B, A)), n = V.perp(u);
    var order = bond.order || 1, style = bond.style || 'plain', out = '';
    var seg = clipSeg(A, B, ba, bb);
    if (!seg) return '';
    var len = V.dist(seg[0], seg[1]);

    if (order === 1) {
      if (style === 'wedge' || style === 'hollow') {
        var ww = st.wedgeWidth / 2;
        var p0 = seg[0], p1 = seg[1];
        var pts = [V.add(p0, V.mul(n, lw * 0.3)), V.add(p1, V.mul(n, ww)), V.sub(p1, V.mul(n, ww)), V.sub(p0, V.mul(n, lw * 0.3))];
        return style === 'hollow' ? poly(pts, 'none', color, lw) : poly(pts, color, color, lw * 0.5);
      }
      if (style === 'hash') {
        var cnt = Math.max(3, Math.round(len / st.hashSpacing)), s = '';
        for (var i = 0; i <= cnt; i++) {
          var t = i / cnt, c = V.lerp(seg[0], seg[1], t), hw = lw * 0.6 + (st.wedgeWidth / 2 - lw * 0.6) * t;
          s += line(V.add(c, V.mul(n, hw)), V.sub(c, V.mul(n, hw)), lw, color, ' stroke-linecap="butt"');
        }
        return s.replace(/ stroke-linecap="round" stroke-linecap="butt"/g, ' stroke-linecap="butt"');
      }
      if (style === 'wavy') {
        var waves = Math.max(2, Math.round(len / 3.2)), amp = L * 0.07, step = len / waves, d = 'M' + CS.n(seg[0].x) + ',' + CS.n(seg[0].y);
        for (var k = 0; k < waves; k++) {
          var m = V.add(seg[0], V.mul(u, step * (k + 0.5))), e = V.add(seg[0], V.mul(u, step * (k + 1)));
          var ctl = V.add(m, V.mul(n, (k % 2 ? -1 : 1) * amp * 2));
          d += ' Q' + CS.n(ctl.x) + ',' + CS.n(ctl.y) + ' ' + CS.n(e.x) + ',' + CS.n(e.y);
        }
        return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + CS.n(lw) + '" stroke-linecap="round"/>';
      }
      if (style === 'bold') return line(seg[0], seg[1], st.boldWidth, color, '').replace('stroke-linecap="round"', 'stroke-linecap="butt"');
      if (style === 'dashed') return line(seg[0], seg[1], lw, color, ' stroke-dasharray="' + CS.n(L * 0.12) + ' ' + CS.n(L * 0.1) + '"');
      return line(seg[0], seg[1], lw, color);
    }

    if (order === 2) {
      var side = doubleSide(g, bond, A, B);
      var dashInner = style === 'dashed' ? ' stroke-dasharray="' + CS.n(L * 0.1) + ' ' + CS.n(L * 0.08) + '"' : '';
      if (side === 0) {
        var off = V.mul(n, sp / 2);
        var s1 = clipSeg(V.add(A, off), V.add(B, off), ba, bb), s2 = clipSeg(V.sub(A, off), V.sub(B, off), ba, bb);
        if (s1) out += line(s1[0], s1[1], lw, color);
        if (s2) out += line(s2[0], s2[1], lw, color, dashInner);
        return out;
      }
      out += style === 'bold' ? line(seg[0], seg[1], st.boldWidth, color) : line(seg[0], seg[1], lw, color);
      var o2 = V.mul(n, sp * side);
      var ia = V.add(A, o2), ib = V.add(B, o2);
      var degA = g.adj.get(a.id).length, degB = g.adj.get(b.id).length;
      var shorten = sp * 0.95;
      if (!la && degA > 1) ia = V.add(ia, V.mul(u, shorten));
      if (!lb && degB > 1) ib = V.sub(ib, V.mul(u, shorten));
      var s3 = clipSeg(ia, ib, ba, bb);
      if (s3) out += line(s3[0], s3[1], lw, color, dashInner);
      return out;
    }

    if (order === 3) {
      out += line(seg[0], seg[1], lw, color);
      [1, -1].forEach(function (sd) {
        var o3 = V.mul(n, sp * sd);
        var s4 = clipSeg(V.add(A, o3), V.add(B, o3), ba, bb);
        if (s4) out += line(s4[0], s4[1], lw, color);
      });
      return out;
    }
    return line(seg[0], seg[1], lw, color);
  }

  function renderMolecule(page, opts) {
    opts = opts || {};
    var st = S(), g = Chem.graph(page), labels = new Map(), out = [];
    page.atoms.forEach(function (a) {
      var l = atomLabel(g, a, st);
      if (l) labels.set(a.id, l);
    });
    page.bonds.forEach(function (b) { out.push(renderBond(g, b, labels, st)); });
    var fam = CS.esc(T.cssFamily(st.font)), fs = st.fontSize;
    function txt(x, y, t, size, color) {
      return '<text x="' + CS.n(x) + '" y="' + CS.n(y) + '" font-family="' + fam + '" font-size="' + CS.n(size) + '" fill="' + color + '">' + CS.esc(t) + '</text>';
    }
    page.atoms.forEach(function (a) {
      var l = labels.get(a.id), color = l ? l.color : (a.color || '#000');
      if (l) {
        // white knock-out behind labels so crossing lines never run through text
        l.runs.forEach(function (r) { out.push(txt(r.x, r.y, r.t, r.size, color)); });
      }
      var ch = a.charge || 0;
      if (ch) {
        var sign = (Math.abs(ch) > 1 ? Math.abs(ch) : '') + (ch > 0 ? '+' : '−');
        if (a.chargeCircle) sign = ch > 0 ? '+' : '−';
        var cs = fs * 0.8, cw = T.measure(sign, st.font, cs), cx, cy;
        if (l && !l.left && l.runs.length > 1 && !bondNear(g, a, -Math.PI / 4)) {
          // "NH3+": superscript after the whole label
          cx = l.right + 0.4;
          cy = a.y - T.CAP * fs / 2 + cs * 0.25;
        } else {
          var avoid = l && l.left && l.runs.length > 1 ? [Math.PI] : (l && !l.left && l.runs.length > 1 ? [0] : []);
          var dir = bestDirection(g, a, -Math.PI / 4, avoid);
          var box = l ? { x: l.leftX - cw / 2 - 0.8, y: a.y - T.CAP * fs / 2 - cs * 0.42, w: (l.right - l.leftX) + cw + 1.6, h: T.CAP * fs + cs * 0.84 } :
            { x: a.x - cw / 2 - fs * 0.25, y: a.y - T.CAP * cs / 2 - fs * 0.25, w: cw + fs * 0.5, h: T.CAP * cs + fs * 0.5 };
          var far = V.add(a, V.fromAngle(dir, 200)), hit = CS.segRectHit(a, far, box);
          var rr = hit ? hit[1] * 200 : fs * 0.6;
          var cp0 = V.add(a, V.fromAngle(dir, rr));
          cx = cp0.x - cw / 2;
          cy = cp0.y + T.CAP * cs / 2;
        }
        if (a.chargeCircle) {
          var r = cs * 0.48, ccx = cx + cw / 2, ccy = cy - T.CAP * cs / 2;
          out.push('<circle cx="' + CS.n(ccx) + '" cy="' + CS.n(ccy) + '" r="' + CS.n(r) + '" fill="none" stroke="' + color + '" stroke-width="' + CS.n(st.lineWidth * 0.8) + '"/>');
          var hl = r * 0.6;
          out.push(line({ x: ccx - hl, y: ccy }, { x: ccx + hl, y: ccy }, st.lineWidth * 0.8, color));
          if (ch > 0) out.push(line({ x: ccx, y: ccy - hl }, { x: ccx, y: ccy + hl }, st.lineWidth * 0.8, color));
        } else out.push(txt(cx, cy, sign, cs, color));
      }
      var dots = [];
      var nl = (a.lonePairs || 0), nr = a.lpCarbene ? 0 : (a.radical || 0);
      if (nl || nr) {
        var dirs = freeDirections(g, a, nl + nr, !!(l && !l.left && l.runs.length > 1));
        var rad = l ? Math.max(fs * 0.62, 0) : fs * 0.4;
        dirs.forEach(function (d, i) {
          var c = V.add(a, V.fromAngle(d, rad + (Math.abs(Math.cos(d)) > 0.7 && l ? T.measure(a.el, st.font, fs) / 2 - fs * 0.3 : 0)));
          var pp = V.fromAngle(d + Math.PI / 2, 1.5);
          if (i < nr) dots.push(c);
          else { dots.push(V.add(c, pp)); dots.push(V.sub(c, pp)); }
        });
        dots.forEach(function (p) { out.push('<circle cx="' + CS.n(p.x) + '" cy="' + CS.n(p.y) + '" r="' + CS.n(Math.max(0.75, st.lineWidth * 1.1)) + '" fill="' + color + '"/>'); });
      }
      if (opts.cip && opts.cip.has(a.id)) {
        var cd = freeDirections(g, a, 1)[0], cp = V.add(a, V.fromAngle(cd, fs * 0.9));
        out.push('<text x="' + CS.n(cp.x - fs * 0.3) + '" y="' + CS.n(cp.y + fs * 0.3) + '" font-family="' + fam + '" font-size="' + CS.n(fs * 0.75) + '" font-style="italic" fill="#555">(' + opts.cip.get(a.id) + ')</text>');
      }
    });
    if (!opts.noCache) lastLabels = labels;
    return out.join('');
  }
  var lastLabels = new Map();

  // ---------------------------------------------------------------- arrows
  function arrowHead(tip, d, st, half, open) {
    var n = V.perp(d), len = st.len, hw = st.hw;
    var back = V.sub(tip, V.mul(d, len)), inner = V.sub(tip, V.mul(d, len * 0.72));
    if (open) {
      return '<polyline points="' + [V.add(back, V.mul(n, hw * 1.2)), tip, V.sub(back, V.mul(n, hw * 1.2))].map(function (p) { return CS.n(p.x) + ',' + CS.n(p.y); }).join(' ') +
        '" fill="none" stroke="' + st.color + '" stroke-width="' + CS.n(st.w) + '" stroke-linejoin="miter"/>';
    }
    var pts = half === 1 ? [tip, V.add(back, V.mul(n, hw)), inner] :
      half === -1 ? [tip, inner, V.sub(back, V.mul(n, hw))] :
        [tip, V.add(back, V.mul(n, hw)), inner, V.sub(back, V.mul(n, hw))];
    return poly(pts, st.color, st.color, st.w * 0.5);
  }

  // curved arrows are quadratic curves; the control point is either explicit (cx, cy) or
  // `bend` pt away from the middle of the chord
  function arrowGeom(o) {
    var p0 = { x: o.x1, y: o.y1 }, p1 = { x: o.x2, y: o.y2 };
    if (o.cx != null && o.cy != null) {
      var cc = { x: o.cx, y: o.cy };
      return { p0: p0, p1: p1, c: cc, curved: V.distToSeg(cc, p0, p1) > 0.5 };
    }
    var d = V.norm(V.sub(p1, p0)), bend = o.bend || 0;
    var c = V.add(V.mid(p0, p1), V.mul(V.perp(d), bend));
    return { p0: p0, p1: p1, c: c, curved: Math.abs(bend) > 0.5 };
  }

  function renderArrow(o) {
    var w = o.width || 0.75, color = o.color || '#000';
    var st = { len: o.headLen || Math.max(6, w * 7), hw: o.headWidth || Math.max(2.2, w * 3), w: w, color: color };
    var gm = arrowGeom(o), p0 = gm.p0, p1 = gm.p1, kind = o.kind || 'forward';
    var dash = o.dash ? ' stroke-dasharray="' + CS.n(w * 4) + ' ' + CS.n(w * 3) + '"' : '';
    var out = '';
    var headEnd = kind !== 'line', headStart = kind === 'both';
    var halfSide = kind === 'half' ? (o.flipHead ? -1 : 1) : 0;
    if (kind === 'equilibrium' || kind === 'retro') {
      var d = V.norm(V.sub(p1, p0)), n = V.perp(d), gap = kind === 'retro' ? Math.max(1.8, w * 2.4) : Math.max(1.6, w * 2.2);
      if (kind === 'retro') {
        var a1 = V.add(p0, V.mul(n, gap)), a2 = V.sub(p0, V.mul(n, gap));
        var e = V.sub(p1, V.mul(d, gap * 1.6));
        out += line(a1, V.add(e, V.mul(n, gap)), w, color, dash) + line(a2, V.sub(e, V.mul(n, gap)), w, color, dash);
        var back = V.sub(p1, V.mul(d, gap * 3.2));
        out += '<polyline points="' + [V.add(back, V.mul(n, gap * 2.6)), p1, V.sub(back, V.mul(n, gap * 2.6))].map(function (p) { return CS.n(p.x) + ',' + CS.n(p.y); }).join(' ') +
          '" fill="none" stroke="' + color + '" stroke-width="' + CS.n(w) + '" stroke-linejoin="miter"/>';
        return out;
      }
      var q0 = V.add(p0, V.mul(n, -gap)), q1 = V.add(p1, V.mul(n, -gap));
      var r0 = V.add(p0, V.mul(n, gap)), r1 = V.add(p1, V.mul(n, gap));
      var shortL = (o.unequal ? V.dist(p0, p1) * 0.25 : 0);
      out += line(q0, V.sub(q1, V.mul(d, st.len * 0.6)), w, color, dash) + arrowHead(q1, d, st, -1);
      var rs = V.add(r0, V.mul(d, shortL)), re = V.sub(r1, V.mul(d, shortL));
      out += line(V.add(rs, V.mul(d, st.len * 0.6)), re, w, color, dash) + arrowHead(rs, V.mul(d, -1), st, -1);
      return out;
    }
    if (gm.curved) {
      var c = gm.c, P0 = p0, P1 = p1, C1 = c;
      var chord = V.dist(p0, p1) + 1e-6;
      if (headEnd) {
        var t1 = Math.max(0.5, 1 - st.len * 0.65 / chord);
        var sp = CS.qSplit(P0, C1, P1, t1);
        P1 = sp.p1; C1 = sp.c;
      }
      if (headStart) {
        var t0 = Math.min(0.5, st.len * 0.65 / chord);
        var sp2 = CS.qSplit(P0, C1, P1, t0).rest;
        P0 = sp2.p0; C1 = sp2.c;
      }
      out += '<path d="M' + CS.n(P0.x) + ',' + CS.n(P0.y) + ' Q' + CS.n(C1.x) + ',' + CS.n(C1.y) + ' ' + CS.n(P1.x) + ',' + CS.n(P1.y) +
        '" fill="none" stroke="' + color + '" stroke-width="' + CS.n(w) + '" stroke-linecap="round"' + dash + '/>';
      if (headEnd) out += arrowHead(p1, V.norm(V.sub(p1, CS.qPoint(p0, c, p1, 0.93))), st, halfSide);
      if (headStart) out += arrowHead(p0, V.norm(V.sub(p0, CS.qPoint(p0, c, p1, 0.07))), st, 0);
    } else {
      var dd = V.norm(V.sub(p1, p0));
      var s0 = headStart ? V.add(p0, V.mul(dd, st.len * 0.6)) : p0, s1 = headEnd ? V.sub(p1, V.mul(dd, st.len * 0.6)) : p1;
      out += line(s0, s1, w, color, dash);
      if (headEnd) out += arrowHead(p1, dd, st, halfSide);
      if (headStart) out += arrowHead(p0, V.mul(dd, -1), st, 0);
    }
    if (kind === 'noreaction' || o.cross) {
      var m = gm.curved ? CS.qPoint(p0, gm.c, p1, 0.5) : V.mid(p0, p1), cr = st.len * 0.8;
      var d1 = V.norm(V.sub(p1, p0));
      var a = V.rot(d1, Math.PI / 4), b = V.rot(d1, -Math.PI / 4);
      out += line(V.add(m, V.mul(a, cr)), V.sub(m, V.mul(a, cr)), w, color) + line(V.add(m, V.mul(b, cr)), V.sub(m, V.mul(b, cr)), w, color);
    }
    return out;
  }

  // ---------------------------------------------------------------- shapes & text
  function rotAttr(o) {
    if (!o.rot) return '';
    return ' transform="rotate(' + CS.n(o.rot) + ' ' + CS.n(o.x + o.w / 2) + ' ' + CS.n(o.y + o.h / 2) + ')"';
  }
  function strokeAttrs(o, defFill) {
    var w = o.width == null ? 0.75 : o.width;
    return ' fill="' + (o.fill || defFill || 'none') + '" stroke="' + (w > 0 ? (o.stroke || '#000') : 'none') + '" stroke-width="' + CS.n(w) + '"' +
      (o.dash ? ' stroke-dasharray="' + CS.n(Math.max(w, 0.5) * 4) + ' ' + CS.n(Math.max(w, 0.5) * 3) + '"' : '');
  }

  function textLayout(o) {
    return T.layout(o.text, {
      font: o.font || 'ChemSans', size: o.size || 10, bold: o.bold, italic: o.italic, width: o.wrap || null,
      align: o.align || 'left', chem: o.chem !== false
    });
  }

  function renderText(o) {
    var lay = textLayout(o);
    o.w = lay.w; o.h = lay.h;
    var s = '';
    if (o.fill) s += '<rect x="' + CS.n(o.x - 2) + '" y="' + CS.n(o.y - 1) + '" width="' + CS.n(lay.w + 4) + '" height="' + CS.n(lay.h + 2) + '" fill="' + o.fill + '"/>';
    s += T.toSVG(lay, o.x, o.y, o.color || '#000');
    return o.rot ? '<g' + rotAttr(o) + '>' + s + '</g>' : s;
  }

  function renderBracket(o) {
    var w = o.width || 0.75, c = o.stroke || '#000', x = o.x, y = o.y, W = o.w, H = o.h, k = o.kind || 'square';
    var t = Math.min(W * 0.25, Math.max(3, H * 0.08)), d;
    if (k === 'square') {
      d = 'M' + CS.n(x + t) + ',' + CS.n(y) + ' L' + CS.n(x) + ',' + CS.n(y) + ' L' + CS.n(x) + ',' + CS.n(y + H) + ' L' + CS.n(x + t) + ',' + CS.n(y + H) +
        ' M' + CS.n(x + W - t) + ',' + CS.n(y) + ' L' + CS.n(x + W) + ',' + CS.n(y) + ' L' + CS.n(x + W) + ',' + CS.n(y + H) + ' L' + CS.n(x + W - t) + ',' + CS.n(y + H);
    } else if (k === 'round') {
      d = 'M' + CS.n(x + t) + ',' + CS.n(y) + ' Q' + CS.n(x - t * 0.6) + ',' + CS.n(y + H / 2) + ' ' + CS.n(x + t) + ',' + CS.n(y + H) +
        ' M' + CS.n(x + W - t) + ',' + CS.n(y) + ' Q' + CS.n(x + W + t * 0.6) + ',' + CS.n(y + H / 2) + ' ' + CS.n(x + W - t) + ',' + CS.n(y + H);
    } else {
      var m = y + H / 2;
      d = 'M' + CS.n(x + t) + ',' + CS.n(y) + ' Q' + CS.n(x) + ',' + CS.n(y) + ' ' + CS.n(x) + ',' + CS.n(y + t) + ' L' + CS.n(x) + ',' + CS.n(m - t) +
        ' Q' + CS.n(x) + ',' + CS.n(m) + ' ' + CS.n(x - t * 0.8) + ',' + CS.n(m) + ' Q' + CS.n(x) + ',' + CS.n(m) + ' ' + CS.n(x) + ',' + CS.n(m + t) +
        ' L' + CS.n(x) + ',' + CS.n(y + H - t) + ' Q' + CS.n(x) + ',' + CS.n(y + H) + ' ' + CS.n(x + t) + ',' + CS.n(y + H);
      var X = x + W;
      d += ' M' + CS.n(X - t) + ',' + CS.n(y) + ' Q' + CS.n(X) + ',' + CS.n(y) + ' ' + CS.n(X) + ',' + CS.n(y + t) + ' L' + CS.n(X) + ',' + CS.n(m - t) +
        ' Q' + CS.n(X) + ',' + CS.n(m) + ' ' + CS.n(X + t * 0.8) + ',' + CS.n(m) + ' Q' + CS.n(X) + ',' + CS.n(m) + ' ' + CS.n(X) + ',' + CS.n(m + t) +
        ' L' + CS.n(X) + ',' + CS.n(y + H - t) + ' Q' + CS.n(X) + ',' + CS.n(y + H) + ' ' + CS.n(X - t) + ',' + CS.n(y + H);
    }
    var s = '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + CS.n(w) + '" stroke-linejoin="miter"/>';
    if (o.label) {
      var lay = T.layout(o.label, { font: 'ChemSans', size: (o.labelSize || 8) });
      s += T.toSVG(lay, x + W + 2, y + H - lay.h * 0.4, c);
    }
    if (o.supLabel) {
      var lay2 = T.layout(o.supLabel, { font: 'ChemSans', size: (o.labelSize || 8) });
      s += T.toSVG(lay2, x + W + 2, y - lay2.h * 0.5, c);
    }
    return s;
  }

  function stepLayouts(o) {
    var pad = o.pad == null ? 12 : o.pad;
    var num = T.layout(o.num || '', { font: o.font || 'ChemSerif', size: (o.numSize || o.size * 1.1 || 10.5), bold: true });
    var cap = T.layout(o.caption || '', { font: o.font || 'ChemSerif', size: o.size || 9.5, width: Math.max(10, o.w - 2 * pad), chem: o.chem !== false });
    return { pad: pad, num: num, cap: cap };
  }
  function renderStep(o) {
    var l = stepLayouts(o), s = '';
    s += '<rect x="' + CS.n(o.x) + '" y="' + CS.n(o.y) + '" width="' + CS.n(o.w) + '" height="' + CS.n(o.h) + '"' + (o.radius ? ' rx="' + o.radius + '"' : '') + strokeAttrs(o, o.fill || '#fff') + '/>';
    s += T.toSVG(l.num, o.x + l.pad, o.y + l.pad * 0.85, o.color || '#000');
    if (o.caption) s += T.toSVG(l.cap, o.x + l.pad, o.y + o.h - l.pad * 0.9 - l.cap.h, o.color || '#000');
    return s;
  }

  function calloutLayout(o) {
    return T.layout(o.text || '', { font: o.font || 'ChemSans', size: o.size || 7, chem: o.chem !== false });
  }
  function renderCallout(o) {
    var lay = calloutLayout(o), w = o.width || 0.5, color = o.color || '#000';
    var leftSide = o.tx < o.ax;
    var tx = leftSide ? o.tx - lay.w : o.tx;
    var ty = o.ty - (o.size || 7) * (T.ASCENT - T.CAP / 2) - 0; // first line centred on ty
    var end = { x: leftSide ? o.tx + 1.5 : o.tx - 1.5, y: o.ty };
    var s = line({ x: o.ax, y: o.ay }, end, w, color).replace('stroke-linecap="round"', 'stroke-linecap="butt"');
    if (o.dot) s += '<circle cx="' + CS.n(o.ax) + '" cy="' + CS.n(o.ay) + '" r="1.1" fill="' + color + '"/>';
    s += T.toSVG(lay, tx, ty, color);
    return s;
  }
  function calloutTextBox(o) {
    var lay = calloutLayout(o);
    var leftSide = o.tx < o.ax;
    var tx = leftSide ? o.tx - lay.w : o.tx;
    var ty = o.ty - (o.size || 7) * (T.ASCENT - T.CAP / 2);
    return { x: tx, y: ty, w: lay.w, h: lay.h };
  }

  // connector between two objects -> polyline points
  function connectorPoints(page, o, bboxFn) {
    var A = findObj(page, o.from), B = findObj(page, o.to);
    if (!A || !B) return null;
    var a = bboxFn(A), b = bboxFn(B);
    if (!a || !b) return null;
    var acx = a.x + a.w / 2, acy = a.y + a.h / 2, bcx = b.x + b.w / 2, bcy = b.y + b.h / 2;
    var route = o.route || 'auto';
    if (route === 'straight') {
      var p = { x: acx, y: acy }, q = { x: bcx, y: bcy };
      var ha = CS.segRectHit(p, q, a), hb = CS.segRectHit(p, q, b);
      var t0 = ha ? ha[1] : 0, t1 = hb ? hb[0] : 1;
      return [V.lerp(p, q, t0), V.lerp(p, q, t1)];
    }
    var gapV = b.y - (a.y + a.h), gapVup = a.y - (b.y + b.h), gapH = b.x - (a.x + a.w), gapHl = a.x - (b.x + b.w);
    var horizontal = (gapH > 0 || gapHl > 0) && (Math.max(gapH, gapHl) >= Math.max(gapV, gapVup) || (gapV <= 0 && gapVup <= 0));
    if (route === 'vertical') horizontal = false;
    if (route === 'horizontal') horizontal = true;
    if (!horizontal) {
      var down = bcy >= acy;
      var y0 = down ? a.y + a.h : a.y, y1 = down ? b.y : b.y + b.h;
      if (Math.abs(acx - bcx) < 0.5) return [{ x: acx, y: y0 }, { x: acx, y: y1 }];
      var ym = (y0 + y1) / 2;
      return [{ x: acx, y: y0 }, { x: acx, y: ym }, { x: bcx, y: ym }, { x: bcx, y: y1 }];
    }
    var right = bcx >= acx;
    var x0 = right ? a.x + a.w : a.x, x1 = right ? b.x : b.x + b.w;
    if (Math.abs(acy - bcy) < 0.5) return [{ x: x0, y: acy }, { x: x1, y: acy }];
    var xm = (x0 + x1) / 2;
    return [{ x: x0, y: acy }, { x: xm, y: acy }, { x: xm, y: bcy }, { x: x1, y: bcy }];
  }
  function renderConnector(page, o) {
    var pts = connectorPoints(page, o, objBBox);
    if (!pts) return '';
    var w = o.width || 0.75, color = o.color || '#000';
    var st = { len: Math.max(6, w * 8), hw: Math.max(2.4, w * 3.2), w: w, color: color };
    var last = pts[pts.length - 1], prev = pts[pts.length - 2];
    var d = V.norm(V.sub(last, prev));
    var draw = pts.slice(0, -1).concat([V.sub(last, V.mul(d, st.len * 0.6))]);
    var s = '<polyline points="' + draw.map(function (p) { return CS.n(p.x) + ',' + CS.n(p.y); }).join(' ') + '" fill="none" stroke="' + color +
      '" stroke-width="' + CS.n(w) + '" stroke-linejoin="miter"' + (o.dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    if (o.head !== 'none') s += arrowHead(last, d, st, 0);
    return s;
  }

  function findObj(page, id) {
    for (var i = 0; i < page.objects.length; i++) if (page.objects[i].id === id) return page.objects[i];
    return null;
  }

  function renderObject(page, o) {
    switch (o.type) {
      case 'text': return renderText(o);
      case 'arrow': return renderArrow(o);
      case 'line': {
        var w = o.width || 0.75;
        return line({ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }, w, o.stroke || '#000', o.dash ? ' stroke-dasharray="' + CS.n(w * 4) + ' ' + CS.n(w * 3) + '"' : '');
      }
      case 'rect':
        return '<rect x="' + CS.n(o.x) + '" y="' + CS.n(o.y) + '" width="' + CS.n(o.w) + '" height="' + CS.n(o.h) + '"' + (o.radius ? ' rx="' + CS.n(o.radius) + '"' : '') + strokeAttrs(o) + rotAttr(o) + '/>';
      case 'ellipse':
        return '<ellipse cx="' + CS.n(o.x + o.w / 2) + '" cy="' + CS.n(o.y + o.h / 2) + '" rx="' + CS.n(o.w / 2) + '" ry="' + CS.n(o.h / 2) + '"' + strokeAttrs(o) + rotAttr(o) + '/>';
      case 'bracket': return renderBracket(o);
      case 'apparatus': return CS.Apparatus.render(o);
      case 'step': return renderStep(o);
      case 'callout': return renderCallout(o);
      case 'connector': return renderConnector(page, o);
      case 'image':
        return '<image href="' + o.href + '" x="' + CS.n(o.x) + '" y="' + CS.n(o.y) + '" width="' + CS.n(o.w) + '" height="' + CS.n(o.h) + '" preserveAspectRatio="none"' + rotAttr(o) + '/>';
      case 'orbital': {
        var cx = o.x + o.w / 2, top = o.y, bot = o.y + o.h, cy = o.y + o.h / 2, rw = o.w / 2;
        var lobe = function (y0, y1, fill) {
          return '<path d="M' + CS.n(cx) + ',' + CS.n(cy) + ' C' + CS.n(cx - rw * 1.3) + ',' + CS.n(y0) + ' ' + CS.n(cx + rw * 1.3) + ',' + CS.n(y0) + ' ' + CS.n(cx) + ',' + CS.n(cy) + ' Z" fill="' + fill + '" stroke="' + (o.stroke || '#000') + '" stroke-width="' + CS.n(o.width || 0.75) + '"/>';
        };
        return '<g' + rotAttr(o) + '>' + lobe(top - o.h * 0.05, cy, o.fill || '#bbb') + lobe(bot + o.h * 0.05, cy, '#fff') + '</g>';
      }
    }
    return '';
  }

  // ---------------------------------------------------------------- bounding boxes
  function objBBox(o) {
    switch (o.type) {
      case 'text': {
        var lay = textLayout(o);
        return CS.rotatedBBox({ x: o.x, y: o.y, w: lay.w, h: lay.h }, o.rot);
      }
      case 'arrow': {
        var gm = arrowGeom(o), pts = [gm.p0, gm.p1];
        if (gm.curved) for (var t = 0.1; t < 1; t += 0.1) pts.push(CS.qPoint(gm.p0, gm.c, gm.p1, t));
        return CS.bboxOfPoints(pts, 3);
      }
      case 'line': return CS.bboxOfPoints([{ x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }], 1);
      case 'callout': {
        var tb = calloutTextBox(o);
        return CS.bboxUnion([tb, CS.bboxOfPoints([{ x: o.ax, y: o.ay }], 0.5)]);
      }
      case 'connector': {
        var page = CS.page && CS.page();
        var pts2 = page ? connectorPoints(page, o, objBBox) : null;
        return pts2 ? CS.bboxOfPoints(pts2, 3) : null;
      }
      case 'bracket': return { x: o.x - 3, y: o.y, w: o.w + 6 + (o.label || o.supLabel ? 12 : 0), h: o.h };
      default:
        return CS.rotatedBBox({ x: o.x, y: o.y, w: o.w, h: o.h }, o.rot);
    }
  }

  // tight bounding box of everything on a page (label boxes for atoms, not a fixed margin)
  function contentBBox(page) {
    var st = S(), g = Chem.graph(page), list = [], lw = st.lineWidth;
    page.atoms.forEach(function (a) {
      var l = atomLabel(g, a, st);
      list.push(l ? CS.bboxUnion(l.boxes) : { x: a.x - lw, y: a.y - lw, w: 2 * lw, h: 2 * lw });
      if (a.charge || a.radical || a.lonePairs) {
        var r = st.fontSize * 0.95;
        list.push({ x: a.x - r, y: a.y - r, w: 2 * r, h: 2 * r });
      }
    });
    page.bonds.forEach(function (b) {
      if (b.style === 'wedge' || b.style === 'hollow' || b.style === 'hash' || b.style === 'wavy') {
        var x = g.atoms.get(b.b) || g.atoms.get(b.a), r = st.wedgeWidth / 2;
        if (x) list.push({ x: x.x - r, y: x.y - r, w: 2 * r, h: 2 * r });
      }
    });
    page.objects.forEach(function (o) { var b = objBBox(o); if (b) list.push(b); });
    return CS.bboxUnion(list);
  }

  function atomBBox(a) {
    var l = lastLabels.get(a.id);
    if (l) return CS.bboxUnion(l.boxes);
    return { x: a.x - 2, y: a.y - 2, w: 4, h: 4 };
  }

  function renderPage(page, opts) {
    opts = opts || {};
    var parts = [];
    var mol = renderMolecule(page, opts);
    // objects with "behind" flag (and steps/rects) are drawn first, structures after
    var behind = [], front = [];
    page.objects.forEach(function (o) {
      (o.type === 'step' || o.behind ? behind : front).push(o);
    });
    behind.forEach(function (o) { parts.push('<g data-id="' + o.id + '">' + renderObject(page, o) + '</g>'); });
    front.forEach(function (o) { parts.push('<g data-id="' + o.id + '">' + renderObject(page, o) + '</g>'); });
    parts.push('<g class="mol">' + mol + '</g>');
    return parts.join('');
  }

  CS.R = {
    renderPage: renderPage,
    renderObject: renderObject,
    renderMolecule: renderMolecule,
    objBBox: objBBox,
    contentBBox: contentBBox,
    atomBBox: atomBBox,
    arrowGeom: arrowGeom,
    textLayout: textLayout,
    stepLayouts: stepLayouts,
    calloutTextBox: calloutTextBox,
    connectorPoints: function (page, o) { return connectorPoints(page, o, objBBox); },
    labels: function () { return lastLabels; },
    freeDirections: freeDirections
  };
})(window.CS);
