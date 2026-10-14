/* Interactive canvas: view transform, rendering with overlays, hit testing and all tools. */
(function (CS) {
  'use strict';
  var V = CS.V, D = CS.Doc, Chem = CS.Chem, state = CS.state;

  var svg, gPage, gContent, gOverlay, gGrid, wrap;
  var drag = null;          // active pointer interaction
  var spaceDown = false;
  var lastPointer = { x: 0, y: 0 };
  var editing = null;       // inline editor state

  // ------------------------------------------------------------ view
  function toPage(ev) {
    var r = svg.getBoundingClientRect();
    return { x: (ev.clientX - r.left) / state.zoom + state.pan.x, y: (ev.clientY - r.top) / state.zoom + state.pan.y };
  }
  function toScreen(p) {
    var r = svg.getBoundingClientRect();
    return { x: (p.x - state.pan.x) * state.zoom + r.left, y: (p.y - state.pan.y) * state.zoom + r.top };
  }
  function tol(px) { return (px || 6) / state.zoom; }

  function updateViewBox() {
    var r = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', [state.pan.x, state.pan.y, r.width / state.zoom, r.height / state.zoom].join(' '));
    CS.emit('zoom');
  }
  function setZoom(z, anchor) {
    z = CS.clamp(z, 0.1, 16);
    var r = wrap.getBoundingClientRect();
    anchor = anchor || { x: state.pan.x + r.width / state.zoom / 2, y: state.pan.y + r.height / state.zoom / 2 };
    var sx = (anchor.x - state.pan.x) * state.zoom, sy = (anchor.y - state.pan.y) * state.zoom;
    state.zoom = z;
    state.pan.x = anchor.x - sx / z;
    state.pan.y = anchor.y - sy / z;
    updateViewBox();
    render();
  }
  function fitPage() {
    var p = CS.page(), r = wrap.getBoundingClientRect();
    var z = Math.min((r.width - 40) / p.width, (r.height - 40) / p.height);
    state.zoom = CS.clamp(z, 0.1, 4);
    state.pan.x = -(r.width / state.zoom - p.width) / 2;
    state.pan.y = -Math.max(20, (r.height - p.height * state.zoom) / 2) / state.zoom;
    updateViewBox();
    render();
  }
  function fitWidth() {
    var p = CS.page(), r = wrap.getBoundingClientRect();
    state.zoom = CS.clamp((r.width - 60) / p.width, 0.1, 16);
    state.pan.x = -(r.width / state.zoom - p.width) / 2;
    state.pan.y = -20 / state.zoom;
    updateViewBox();
    render();
  }

  // ------------------------------------------------------------ rendering
  function render() {
    if (!svg) return;
    var page = CS.page(), st = state.doc.settings;
    if (CS.embed) {
      // drawing window: dotted canvas, the area in the document shown as a dashed guide
      var z = state.zoom;
      gPage.innerHTML = '<defs><pattern id="st-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="0.6" cy="0.6" r="' + CS.n(0.75 / z) + '" fill="#cdd4df"/></pattern></defs>' +
        '<rect x="-5000" y="-5000" width="' + (page.width + 10000) + '" height="' + (page.height + 10000) + '" fill="url(#st-dots)"/>' +
        '<rect class="page-guide" x="0" y="0" width="' + page.width + '" height="' + page.height + '" stroke-width="' + CS.n(1.2 / z) + '" stroke-dasharray="' + CS.n(6 / z) + ' ' + CS.n(4 / z) + '"/>' +
        '<text class="page-guide-t" x="' + CS.n(3 / z) + '" y="' + CS.n(-5 / z) + '" font-size="' + CS.n(11 / z) + '">area in the document (100%)</text>';
    } else {
      gPage.innerHTML = '<rect class="page-shadow" x="2" y="3" width="' + page.width + '" height="' + page.height + '"/>' +
        '<rect class="page" x="0" y="0" width="' + page.width + '" height="' + page.height + '"/>';
    }
    if (st.showGrid) {
      var gs = st.gridSize || 10, s = '';
      for (var x = gs; x < page.width; x += gs) s += 'M' + x + ',0V' + page.height;
      for (var y = gs; y < page.height; y += gs) s += 'M0,' + y + 'H' + page.width;
      gGrid.innerHTML = '<path d="' + s + '" class="grid"/>';
    } else gGrid.innerHTML = '';
    var cip = null;
    if (state.showCIP && Chem.oclReady() && page.atoms.length) {
      try { cip = Chem.cipLabels(page); } catch (e) { cip = null; }
    }
    gContent.innerHTML = CS.R.renderPage(page, { cip: cip });
    renderOverlay();
  }

  function handleList() {
    // handles for the current selection: [{id, x, y, cursor}]
    var page = CS.page(), keys = Array.from(state.sel), hs = [];
    if (!keys.length) return hs;
    var objs = D.selObjects(page, keys);
    var onlyObj = keys.length === 1 && objs.length === 1 ? objs[0] : null;
    if (onlyObj && (onlyObj.type === 'arrow' || onlyObj.type === 'line')) {
      hs.push({ id: 'p1', x: onlyObj.x1, y: onlyObj.y1 }, { id: 'p2', x: onlyObj.x2, y: onlyObj.y2 });
      if (onlyObj.type === 'arrow' && onlyObj.kind !== 'equilibrium' && onlyObj.kind !== 'retro') {
        var gm = CS.R.arrowGeom(onlyObj), m = CS.qPoint(gm.p0, gm.c, gm.p1, 0.5);
        hs.push({ id: 'bend', x: m.x, y: m.y, round: true });
      }
      return hs;
    }
    if (onlyObj && onlyObj.type === 'callout') {
      hs.push({ id: 'anchor', x: onlyObj.ax, y: onlyObj.ay, round: true });
      return hs;
    }
    if (onlyObj && onlyObj.type === 'connector') return hs;
    var bb = D.keysBBox(page, keys);
    if (!bb) return hs;
    var resizable = onlyObj && /^(rect|ellipse|step|image|bracket|orbital)$/.test(onlyObj.type) && !onlyObj.rot;
    var pad = 3 / state.zoom;
    var x0 = bb.x - pad, y0 = bb.y - pad, x1 = bb.x + bb.w + pad, y1 = bb.y + bb.h + pad;
    hs.push({ id: 'nw', x: x0, y: y0 }, { id: 'ne', x: x1, y: y0 }, { id: 'se', x: x1, y: y1 }, { id: 'sw', x: x0, y: y1 });
    if (resizable) hs.push({ id: 'n', x: (x0 + x1) / 2, y: y0 }, { id: 's', x: (x0 + x1) / 2, y: y1 }, { id: 'w', x: x0, y: (y0 + y1) / 2 }, { id: 'e', x: x1, y: (y0 + y1) / 2 });
    if (onlyObj && onlyObj.type === 'text') {
      hs = [{ id: 'wrap', x: x1, y: (y0 + y1) / 2 }];
    }
    if (!(onlyObj && onlyObj.type === 'step')) hs.push({ id: 'rot', x: (x0 + x1) / 2, y: y0 - 18 / state.zoom, round: true, stem: { x: (x0 + x1) / 2, y: y0 } });
    hs.bbox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    return hs;
  }

  function renderOverlay() {
    var page = CS.page(), z = state.zoom, s = '';
    var sw = 1 / z;
    var g = Chem.graph(page);
    // valence warnings
    page.atoms.forEach(function (a) {
      if (Chem.valenceError(g, a)) {
        var b = CS.R.atomBBox(a), p = 2 / z;
        s += '<rect x="' + (b.x - p) + '" y="' + (b.y - p) + '" width="' + (b.w + 2 * p) + '" height="' + (b.h + 2 * p) + '" class="val-err" stroke-width="' + sw + '"/>';
      }
    });
    // selection highlight
    state.sel.forEach(function (k) {
      var it = D.item(page, k);
      if (!it) return;
      if (k[0] === 'a') s += '<circle cx="' + it.x + '" cy="' + it.y + '" r="' + (4 / z + 2) + '" class="sel-atom" stroke-width="' + sw + '"/>';
      else if (k[0] === 'b') {
        var a = D.findAtom(page, it.a), b = D.findAtom(page, it.b);
        if (a && b) s += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" class="sel-bond" stroke-width="' + (6 / z + 2) + '"/>';
      } else {
        var bb = CS.R.objBBox(it);
        if (bb) s += '<rect x="' + bb.x + '" y="' + bb.y + '" width="' + bb.w + '" height="' + bb.h + '" class="sel-obj" stroke-width="' + sw + '" stroke-dasharray="' + 3 / z + ' ' + 2 / z + '"/>';
        if (it.type === 'connector') {
          var pts = CS.R.connectorPoints(page, it);
          if (pts) s += '<polyline points="' + pts.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '" class="sel-bond" fill="none" stroke-width="' + (6 / z) + '"/>';
        }
      }
    });
    // hover
    var h = state.hover;
    if (h && !drag) {
      var it2 = D.item(page, h);
      if (it2 && h[0] === 'a') s += '<circle cx="' + it2.x + '" cy="' + it2.y + '" r="' + (5 / z + 1.5) + '" class="hover" stroke-width="' + (1.5 / z) + '"/>';
      else if (it2 && h[0] === 'b') {
        var ha = D.findAtom(page, it2.a), hb = D.findAtom(page, it2.b);
        if (ha && hb) s += '<line x1="' + ha.x + '" y1="' + ha.y + '" x2="' + hb.x + '" y2="' + hb.y + '" class="hover-bond" stroke-width="' + (7 / z + 1) + '"/>';
      } else if (it2) {
        var hb2 = CS.R.objBBox(it2);
        if (hb2) s += '<rect x="' + hb2.x + '" y="' + hb2.y + '" width="' + hb2.w + '" height="' + hb2.h + '" class="hover" stroke-width="' + (1 / z) + '" fill="none"/>';
      }
    }
    // selection bbox + handles
    if (state.tool === 'select' || state.tool === 'lasso') {
      var hs = handleList();
      if (hs.bbox && state.sel.size > 1) {
        s += '<rect x="' + hs.bbox.x + '" y="' + hs.bbox.y + '" width="' + hs.bbox.w + '" height="' + hs.bbox.h + '" class="sel-box" stroke-width="' + sw + '"/>';
      }
      hs.forEach(function (hd) {
        var r = 4 / z;
        if (hd.stem) s += '<line x1="' + hd.stem.x + '" y1="' + hd.stem.y + '" x2="' + hd.x + '" y2="' + hd.y + '" class="handle-stem" stroke-width="' + sw + '"/>';
        s += hd.round ? '<circle cx="' + hd.x + '" cy="' + hd.y + '" r="' + r + '" class="handle" stroke-width="' + sw + '"/>' :
          '<rect x="' + (hd.x - r) + '" y="' + (hd.y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" class="handle" stroke-width="' + sw + '"/>';
      });
    }
    // tool previews
    if (drag && drag.preview) s += drag.preview;
    if (!drag && state.preview) s += state.preview;
    gOverlay.innerHTML = s;
  }

  // ------------------------------------------------------------ hit testing
  function hitAtom(p, exclude) {
    var page = CS.page(), best = null, bd = Math.max(tol(7), 4);
    page.atoms.forEach(function (a) {
      if (exclude && exclude.has(a.id)) return;
      var d = V.dist(p, a);
      var lb = CS.R.labels().get(a.id);
      if (lb && CS.bboxHit(CS.bboxUnion(lb.boxes), p, 1)) d = Math.min(d, bd * 0.5);
      if (d < bd) { bd = d; best = a; }
    });
    return best;
  }
  function hitBond(p) {
    var page = CS.page(), best = null, bd = Math.max(tol(5), 3);
    page.bonds.forEach(function (b) {
      var a1 = D.findAtom(page, b.a), a2 = D.findAtom(page, b.b);
      if (!a1 || !a2) return;
      var d = V.distToSeg(p, a1, a2);
      if (d < bd) { bd = d; best = b; }
    });
    return best;
  }
  function objHit(o, p) {
    var t = tol(5);
    switch (o.type) {
      case 'arrow': {
        var gm = CS.R.arrowGeom(o);
        if (!gm.curved) return V.distToSeg(p, gm.p0, gm.p1) < t + 2;
        var prev = gm.p0;
        for (var i = 1; i <= 20; i++) {
          var q = CS.qPoint(gm.p0, gm.c, gm.p1, i / 20);
          if (V.distToSeg(p, prev, q) < t + 2) return true;
          prev = q;
        }
        return false;
      }
      case 'line': return V.distToSeg(p, { x: o.x1, y: o.y1 }, { x: o.x2, y: o.y2 }) < t + 1;
      case 'callout': {
        if (V.distToSeg(p, { x: o.ax, y: o.ay }, { x: o.tx, y: o.ty }) < t) return true;
        return CS.bboxHit(CS.R.calloutTextBox(o), p, 2);
      }
      case 'connector': {
        var pts = CS.R.connectorPoints(CS.page(), o);
        if (!pts) return false;
        for (var j = 1; j < pts.length; j++) if (V.distToSeg(p, pts[j - 1], pts[j]) < t + 1) return true;
        return false;
      }
      case 'rect': case 'ellipse': case 'bracket': {
        var lp = local(o, p);
        var inside = lp.x >= o.x && lp.x <= o.x + o.w && lp.y >= o.y && lp.y <= o.y + o.h;
        if (o.fill && o.fill !== 'none' && inside) return true;
        if (o.type === 'ellipse') {
          var rx = o.w / 2, ry = o.h / 2, cx = o.x + rx, cy = o.y + ry;
          var v = Math.hypot((lp.x - cx) / rx, (lp.y - cy) / ry);
          return Math.abs(v - 1) * Math.min(rx, ry) < t;
        }
        var ob = { x: o.x - t, y: o.y - t, w: o.w + 2 * t, h: o.h + 2 * t }, ib = { x: o.x + t, y: o.y + t, w: o.w - 2 * t, h: o.h - 2 * t };
        return CS.bboxHit(ob, lp) && !(ib.w > 0 && ib.h > 0 && CS.bboxHit(ib, lp));
      }
      case 'step': return CS.bboxHit(o, p, t);
      default: {
        var bb = o.type === 'text' ? CS.R.objBBox(Object.assign({}, o, { rot: 0 })) : o;
        return CS.bboxHit(bb, local(o, p), 2);
      }
    }
  }
  function local(o, p) {
    if (!o.rot) return p;
    var bb = o.type === 'text' ? CS.R.objBBox(Object.assign({}, o, { rot: 0 })) : o;
    return V.rot(p, -o.rot * Math.PI / 180, { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 });
  }
  function hitObject(p, filter) {
    var page = CS.page();
    // front-to-back; steps are drawn behind everything, so test them last
    var list = page.objects.slice().reverse();
    var steps = list.filter(function (o) { return o.type === 'step' || o.behind; });
    var rest = list.filter(function (o) { return !(o.type === 'step' || o.behind); });
    var order = rest.concat(steps);
    for (var i = 0; i < order.length; i++) {
      if (filter && !filter(order[i])) continue;
      if (objHit(order[i], p)) return order[i];
    }
    return null;
  }
  function hitAny(p) {
    var a = hitAtom(p);
    if (a) return 'a:' + a.id;
    var b = hitBond(p);
    if (b) return 'b:' + b.id;
    var nonStep = hitObject(p, function (o) { return o.type !== 'step' && !o.behind; });
    if (nonStep) return 'o:' + nonStep.id;
    var o = hitObject(p);
    return o ? 'o:' + o.id : null;
  }
  function hitHandle(p) {
    var hs = handleList(), r = 6 / state.zoom;
    for (var i = 0; i < hs.length; i++) if (Math.abs(p.x - hs[i].x) <= r && Math.abs(p.y - hs[i].y) <= r) return hs[i];
    return null;
  }

  // ------------------------------------------------------------ structure building helpers
  function snapAngle(ang, step) {
    step = step || Math.PI / 12;
    return Math.round(ang / step) * step;
  }
  function newBondDirection(page, atom) {
    var g = Chem.graph(page), nbs = g.adj.get(atom.id).map(function (b) { return D.findAtom(page, Chem.other(b, atom.id)); });
    if (!nbs.length) return -Math.PI / 6;
    if (nbs.length === 1) {
      var n = nbs[0], base = Math.atan2(atom.y - n.y, atom.x - n.x);
      var bo = D.bondBetween(page, atom.id, n.id);
      if (bo && bo.order === 3) return base;
      // zig-zag: continue on the side opposite to the neighbour's other substituent
      var nn = g.adj.get(n.id).map(function (b) { return D.findAtom(page, Chem.other(b, n.id)); }).filter(function (x) { return x.id !== atom.id; });
      var c1 = base + Math.PI / 3, c2 = base - Math.PI / 3;
      if (nn.length) {
        var ref = nn[0];
        var p1 = V.add(atom, V.fromAngle(c1, 10)), p2 = V.add(atom, V.fromAngle(c2, 10));
        return V.dist(p1, ref) > V.dist(p2, ref) ? c1 : c2;
      }
      // prefer the upward-pointing choice for a lone bond
      return Math.sin(c1) < Math.sin(c2) ? c1 : c2;
    }
    var angs = nbs.map(function (n) { return Math.atan2(n.y - atom.y, n.x - atom.x); }).sort(function (a, b) { return a - b; });
    var bestGap = -1, best = 0;
    for (var i = 0; i < angs.length; i++) {
      var a0 = angs[i], a1 = i + 1 < angs.length ? angs[i + 1] : angs[0] + 2 * Math.PI;
      if (a1 - a0 > bestGap) { bestGap = a1 - a0; best = (a0 + a1) / 2; }
    }
    return best;
  }
  function atomAtOrNew(page, p, exclude) {
    var ex = hitAtomAt(page, p, exclude);
    return ex || D.addAtom(page, p.x, p.y, 'C');
  }
  function hitAtomAt(page, p, exclude) {
    var L = CS.settings().bondLength, best = null, bd = L * 0.22;
    page.atoms.forEach(function (a) {
      if (exclude && exclude.has(a.id)) return;
      var d = V.dist(a, p);
      if (d < bd) { bd = d; best = a; }
    });
    return best;
  }
  function applyBondType(b, bt) {
    b.order = bt.order;
    if (bt.style && bt.style !== 'plain') b.style = bt.style; else delete b.style;
  }
  function clickBond(page, b) {
    var bt = state.bondType;
    if (bt.order === 1 && (!bt.style || bt.style === 'plain')) {
      if ((b.style && b.style !== 'plain')) { delete b.style; b.order = 1; }
      else b.order = b.order === 1 ? 2 : b.order === 2 ? 3 : 1;
    } else if (bt.order === 2 && b.order === 2 && (b.style || 'plain') === (bt.style || 'plain')) {
      // cycle double bond position
      var seq = ['auto', 'left', 'center', 'right'], i = seq.indexOf(b.dbPos || 'auto');
      b.dbPos = seq[(i + 1) % seq.length];
      if (b.dbPos === 'auto') delete b.dbPos;
    } else if (b.order === bt.order && (b.style || 'plain') === (bt.style || 'plain') && /wedge|hash|hollow/.test(bt.style)) {
      var t = b.a; b.a = b.b; b.b = t; // flip stereo direction
    } else applyBondType(b, bt);
  }

  function ringPoints(n, center, startAngle, L) {
    var R = L / (2 * Math.sin(Math.PI / n)), pts = [];
    for (var i = 0; i < n; i++) pts.push(V.add(center, V.fromAngle(startAngle + i * 2 * Math.PI / n, R)));
    return pts;
  }
  // place ring of size n (aromatic?) at point / on atom / on bond
  function placeRing(page, n, aromatic, p, preview) {
    var L = CS.settings().bondLength, R = L / (2 * Math.sin(Math.PI / n));
    var a = hitAtom(p), b = !a && hitBond(p), pts, shared = [];
    if (b) {
      var A = D.findAtom(page, b.a), B = D.findAtom(page, b.b);
      var mid = V.mid(A, B), nrm = V.perp(V.norm(V.sub(B, A)));
      // put the ring on the side with fewer atoms (or towards the cursor)
      var g = Chem.graph(page), score = 0;
      page.atoms.forEach(function (x) {
        if (x.id === A.id || x.id === B.id) return;
        if (V.dist(x, mid) < L * 2) score += V.dot(V.sub(x, mid), nrm) > 0 ? 1 : -1;
      });
      var side = score > 0 ? -1 : score < 0 ? 1 : (V.dot(V.sub(p, mid), nrm) >= 0 ? 1 : -1);
      var apo = L / (2 * Math.tan(Math.PI / n));
      var c = V.add(mid, V.mul(nrm, side * apo));
      var angA = Math.atan2(A.y - c.y, A.x - c.x);
      var angB = Math.atan2(B.y - c.y, B.x - c.x);
      var dir = ((angB - angA + 3 * Math.PI) % (2 * Math.PI)) - Math.PI > 0 ? 1 : -1;
      pts = [];
      for (var i = 0; i < n; i++) pts.push(V.add(c, V.fromAngle(angA + dir * i * 2 * Math.PI / n, R)));
      shared = [A, B];
    } else if (a) {
      var dirA = newBondDirection(page, a);
      var gdeg = Chem.graph(page).adj.get(a.id).length;
      var c2 = gdeg ? V.add(a, V.fromAngle(dirA, R)) : V.add(a, V.fromAngle(Math.PI / 2, -R));
      var start = Math.atan2(a.y - c2.y, a.x - c2.x);
      pts = ringPoints(n, c2, start, L);
      shared = [a];
    } else {
      var st = n % 2 === 0 ? -Math.PI / 2 : -Math.PI / 2;
      if (n === 4 || n === 8) st = -Math.PI / 2 + Math.PI / n;
      pts = ringPoints(n, p, st, L);
    }
    if (preview) {
      var s = 'M' + pts.map(function (q) { return q.x + ',' + q.y; }).join(' L') + ' Z';
      return '<path d="' + s + '" class="preview" stroke-width="' + 1 / state.zoom + '"/>';
    }
    var ids = pts.map(function (q, i) {
      if (shared[0] && i === 0) return shared[0].id;
      if (shared[1] && i === 1) return shared[1].id;
      var ex = hitAtomAt(page, q);
      return ex ? ex.id : D.addAtom(page, q.x, q.y, 'C').id;
    });
    var bonds = [];
    for (var k = 0; k < n; k++) bonds.push(D.addBond(page, ids[k], ids[(k + 1) % n], 1));
    if (aromatic) {
      // alternate double bonds, avoiding atoms that already carry a double bond
      var g2 = Chem.graph(page);
      function hasDouble(id, except) {
        return g2.adj.get(id).some(function (x) { return x.order >= 2 && x !== except; });
      }
      var best = null;
      [0, 1].forEach(function (off) {
        var ok = 0;
        for (var j = off; j < n; j += 2) {
          var bd = bonds[j];
          if (bd.order === 2) ok += 2;
          else if (!hasDouble(bd.a, bd) && !hasDouble(bd.b, bd)) ok += 1;
          else ok -= 3;
        }
        if (!best || ok > best.ok) best = { off: off, ok: ok };
      });
      for (var j = best.off; j < n; j += 2) {
        var bd2 = bonds[j];
        if (!hasDouble(bd2.a, bd2) && !hasDouble(bd2.b, bd2)) bd2.order = 2;
      }
    }
    return ids;
  }

  function chainPoints(start, p, L, firstUp) {
    var d = V.sub(p, start), len = V.len(d);
    if (len < L * 0.5) return [start];
    var ang = snapAngle(Math.atan2(d.y, d.x), Math.PI / 6);
    var u = V.fromAngle(ang), n = V.perp(u);
    var stepX = L * Math.cos(Math.PI / 6), stepY = L * Math.sin(Math.PI / 6);
    var count = Math.max(1, Math.round(len / stepX));
    var side = V.cross(u, V.sub(p, start)) >= 0 ? 1 : -1;
    side = firstUp ? (n.y < 0 ? 1 : -1) : side;
    var pts = [start];
    for (var i = 1; i <= count; i++) {
      pts.push(V.add(V.add(start, V.mul(u, stepX * i)), V.mul(n, (i % 2) * stepY * side)));
    }
    return pts;
  }

  // ------------------------------------------------------------ templates
  function placeFragment(page, frag, p) {
    var bb = CS.bboxOfPoints(frag.atoms.length ? frag.atoms : [{ x: 0, y: 0 }]);
    var keys = D.insert(page, frag, p.x - (bb.x + bb.w / 2), p.y - (bb.y + bb.h / 2));
    return keys;
  }

  // ------------------------------------------------------------ pointer handling
  // two-finger pinch zoom / pan on touch screens
  var pointers = new Map(), pinch = null;
  function pinchState() {
    var pts = Array.from(pointers.values());
    return { d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, m: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } };
  }

  function onDown(ev) {
    pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pointers.size === 2) {
      if (drag && drag.moved) CS.History.restore(CS.History.stack[CS.History.idx]);
      drag = null;
      pinch = pinchState();
      render();
      return;
    }
    if (pointers.size > 2) return;
    if (editing) commitEdit();
    if (ev.button === 1 || (ev.button === 0 && (spaceDown || state.tool === 'pan'))) {
      drag = { mode: 'pan', sx: ev.clientX, sy: ev.clientY, pan: { x: state.pan.x, y: state.pan.y } };
      svg.setPointerCapture(ev.pointerId);
      wrap.classList.add('panning');
      return;
    }
    if (ev.button !== 0) return;
    svg.setPointerCapture(ev.pointerId);
    var p = toPage(ev), page = CS.page();
    lastPointer = p;
    var tool = state.tool;
    var handler = TOOLS[tool] || TOOLS.select;
    drag = { start: p, last: p, moved: false, shift: ev.shiftKey, alt: ev.altKey, ctrl: ev.ctrlKey || ev.metaKey };
    handler.down && handler.down(p, ev, page);
    render();
  }
  function onMove(ev) {
    if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch && pointers.size === 2) {
      var now = pinchState(), r = svg.getBoundingClientRect();
      state.pan.x -= (now.m.x - pinch.m.x) / state.zoom;
      state.pan.y -= (now.m.y - pinch.m.y) / state.zoom;
      setZoom(state.zoom * now.d / pinch.d, { x: (now.m.x - r.left) / state.zoom + state.pan.x, y: (now.m.y - r.top) / state.zoom + state.pan.y });
      pinch = now;
      return;
    }
    var p = toPage(ev);
    lastPointer = p;
    CS.emit('pointer', p);
    if (drag && drag.mode === 'pan') {
      state.pan.x = drag.pan.x - (ev.clientX - drag.sx) / state.zoom;
      state.pan.y = drag.pan.y - (ev.clientY - drag.sy) / state.zoom;
      updateViewBox();
      return;
    }
    var handler = TOOLS[state.tool] || TOOLS.select;
    if (drag) {
      if (!drag.moved && V.dist(p, drag.start) * state.zoom > 3) drag.moved = true;
      drag.shift = ev.shiftKey;
      if (drag.moved && handler.drag) handler.drag(p, ev, CS.page());
      drag.last = p;
      render();
      return;
    }
    // hover
    var h = state.tool === 'select' ? (hitHandle(p) ? null : hitAny(p)) : hoverFor(state.tool, p);
    state.preview = handler.hover ? handler.hover(p, CS.page()) : null;
    if (h !== state.hover || state.preview) {
      state.hover = h;
      renderOverlay();
    }
    updateCursor(p);
  }
  function hoverFor(tool, p) {
    if (/^(bond|chain|ring|element|charge|eraser|text|template|radical|lonepair|label)$/.test(tool)) {
      var a = hitAtom(p);
      if (a) return 'a:' + a.id;
      var b = hitBond(p);
      if (b) return 'b:' + b.id;
      if (tool === 'eraser' || tool === 'text') { var o = hitObject(p); return o ? 'o:' + o.id : null; }
    }
    if (tool === 'connector') { var o2 = hitObject(p); return o2 ? 'o:' + o2.id : null; }
    if (tool === 'callout') return null;
    return null;
  }
  function onUp(ev) {
    pointers.delete(ev.pointerId);
    if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
    if (!drag) return;
    if (drag.mode === 'pan') { drag = null; wrap.classList.remove('panning'); return; }
    var p = toPage(ev);
    var handler = TOOLS[state.tool] || TOOLS.select;
    var d = drag;
    if (handler.up) handler.up(p, ev, CS.page(), d);
    drag = null;
    render();
    CS.emit('selection');
    // the canvas is re-rendered on every click, so native dblclick never fires: detect it here
    if (!d.moved) {
      var now = Date.now();
      if (lastClick && now - lastClick.t < 450 && Math.hypot(ev.clientX - lastClick.x, ev.clientY - lastClick.y) < 6) {
        lastClick = null;
        if (state.tool === 'select') onDbl(ev);
      } else lastClick = { t: now, x: ev.clientX, y: ev.clientY };
    } else lastClick = null;
  }
  var lastClick = null;
  function onDbl(ev) {
    var p = toPage(ev), page = CS.page();
    var k = hitAny(p);
    if (!k) return;
    var it = D.item(page, k);
    if (k[0] === 'a') return editAtomLabel(it);
    if (k[0] === 'o') {
      if (it.type === 'text' || it.type === 'callout' || it.type === 'step') return editObjectText(it, p);
      if (it.type === 'apparatus' || it.groupId) {
        // double click on grouped item -> select only that item
        state.sel = new Set([k]);
        render();
        CS.emit('selection');
      }
    }
    if (k[0] === 'b') {
      state.sel = D.fragmentKeys(page, it.a);
      render();
      CS.emit('selection');
    }
  }
  function updateCursor(p) {
    var c = 'default';
    if (state.tool === 'select') {
      var hd = hitHandle(p);
      if (hd) c = hd.id === 'rot' ? 'grab' : /^(nw|se)$/.test(hd.id) ? 'nwse-resize' : /^(ne|sw)$/.test(hd.id) ? 'nesw-resize' : /^(n|s)$/.test(hd.id) ? 'ns-resize' : /^(e|w|wrap)$/.test(hd.id) ? 'ew-resize' : 'move';
      else if (state.hover) c = 'move';
    } else if (state.tool === 'text') c = 'text';
    else if (state.tool === 'pan') c = 'grab';
    else if (state.tool === 'eraser') c = 'cell';
    else c = 'crosshair';
    svg.style.cursor = c;
  }

  // ------------------------------------------------------------ tools
  var TOOLS = {};

  TOOLS.select = {
    down: function (p, ev, page) {
      var hd = hitHandle(p);
      if (hd) {
        drag.mode = 'handle';
        drag.handle = hd.id;
        drag.before = JSON.stringify(D.extract(page, state.sel));
        drag.snapshot = CS.clone(page);
        drag.keys = new Set(state.sel);
        drag.bbox = D.keysBBox(page, state.sel);
        var o = state.sel.size === 1 ? D.selObjects(page, state.sel)[0] : null;
        drag.obj = o;
        drag.objStart = o ? CS.clone(o) : null;
        return;
      }
      var k = hitAny(p);
      if (k) {
        var keys;
        if (k[0] !== 'o' && !ev.altKey) {
          // clicking a bond or atom grabs the whole fragment unless it is part of a larger selection
          keys = state.sel.has(k) ? null : D.fragmentKeys(page, k[0] === 'a' ? k.slice(2) : D.findBond(page, k.slice(2)).a);
        } else keys = state.sel.has(k) ? null : new Set([k]);
        if (keys) keys = D.expandGroups(page, keys);
        if (ev.shiftKey) {
          if (state.sel.has(k)) { (keys || new Set([k])).forEach(function (x) { state.sel.delete(x); }); drag.mode = 'none'; return; }
          keys.forEach(function (x) { state.sel.add(x); });
        } else if (keys) state.sel = keys;
        drag.mode = 'move';
        drag.carried = carriedBy(page, state.sel);
        if (ev.altKey && !ev.shiftKey) { drag.dup = true; }
        return;
      }
      if (!ev.shiftKey) state.sel.clear();
      drag.mode = 'marquee';
      drag.baseSel = new Set(state.sel);
    },
    drag: function (p, ev, page) {
      if (drag.mode === 'move') {
        if (drag.dup && !drag.dupDone) {
          var frag = D.extract(page, state.sel);
          state.sel = D.insert(page, frag, 0, 0);
          drag.dupDone = true;
          drag.carried = [];
        }
        var dx = p.x - drag.last.x, dy = p.y - drag.last.y;
        if (CS.state.doc.settings.snap && drag.carried) { /* free move; snapping happens on release */ }
        D.translate(page, state.sel, dx, dy, drag.carried);
      } else if (drag.mode === 'marquee') {
        var r = CS.bboxOfPoints([drag.start, p]);
        drag.preview = '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '" class="marquee" stroke-width="' + 1 / state.zoom + '"/>';
        var sel = new Set(drag.baseSel);
        page.atoms.forEach(function (a) { if (CS.bboxHit(r, a)) sel.add('a:' + a.id); });
        page.bonds.forEach(function (b) {
          if (sel.has('a:' + b.a) && sel.has('a:' + b.b)) sel.add('b:' + b.id);
        });
        page.objects.forEach(function (o) {
          var bb = CS.R.objBBox(o);
          if (bb && CS.bboxContains(r, bb)) sel.add('o:' + o.id);
        });
        state.sel = D.expandGroups(page, sel);
      } else if (drag.mode === 'handle') {
        handleDrag(p, ev, page);
      }
    },
    up: function (p, ev, page, d) {
      if (d.mode === 'move' && d.moved) {
        if (CS.state.doc.settings.snap) snapSelection(page);
        mergeMovedAtoms(page);
        CS.commit();
      } else if (d.mode === 'handle' && d.moved) CS.commit();
      else if (d.mode === 'move' && !d.moved && !ev.shiftKey) {
        // plain click: if the clicked item belongs to a group/fragment that was already selected keep it
      }
    }
  };

  function carriedBy(page, keys) {
    // step boxes carry the objects/atoms placed inside them
    var carried = [];
    D.selObjects(page, keys).forEach(function (o) {
      if (o.type !== 'step' && !(o.type === 'rect' && o.carry)) return;
      page.objects.forEach(function (x) {
        if (x === o || keys.has('o:' + x.id) || x.type === 'connector') return;
        var bb = CS.R.objBBox(x);
        if (bb && CS.bboxContains({ x: o.x - 1, y: o.y - 1, w: o.w + 2, h: o.h + 2 }, bb)) carried.push(x);
      });
      page.atoms.forEach(function (a) {
        if (!keys.has('a:' + a.id) && CS.bboxHit(o, a)) keys.add('a:' + a.id);
      });
    });
    return carried;
  }

  function snapSelection(page) {
    var gs = state.doc.settings.gridSize || 10, bb = D.keysBBox(page, state.sel);
    if (!bb) return;
    var dx = Math.round(bb.x / gs) * gs - bb.x, dy = Math.round(bb.y / gs) * gs - bb.y;
    D.translate(page, state.sel, dx, dy, carriedBy(page, new Set(state.sel)));
  }

  function mergeMovedAtoms(page) {
    var moved = D.selAtoms(page, state.sel);
    if (!moved.size || moved.size > 50) return;
    var L = CS.settings().bondLength;
    moved.forEach(function (id) {
      var a = D.findAtom(page, id);
      if (!a) return;
      var tgt = null;
      page.atoms.forEach(function (b) { if (!moved.has(b.id) && V.dist(a, b) < L * 0.15) tgt = b; });
      if (tgt) {
        D.mergeAtoms(page, tgt.id, a.id);
        state.sel.delete('a:' + a.id);
      }
    });
    // remove selection keys of bonds that no longer exist
    state.sel.forEach(function (k) { if (!D.item(page, k)) state.sel.delete(k); });
  }

  function handleDrag(p, ev, page) {
    var h = drag.handle, o = drag.obj;
    if (o && (o.type === 'arrow' || o.type === 'line') && (h === 'p1' || h === 'p2' || h === 'bend')) {
      if (h === 'bend') {
        var a = { x: o.x1, y: o.y1 }, b = { x: o.x2, y: o.y2 };
        var n = V.perp(V.norm(V.sub(b, a)));
        // the curve's midpoint is half-way to the control point
        delete o.cx; delete o.cy;
        o.bend = 2 * V.dot(V.sub(p, V.mid(a, b)), n);
        if (Math.abs(o.bend) < 2) o.bend = 0;
      } else {
        var other = h === 'p1' ? { x: o.x2, y: o.y2 } : { x: o.x1, y: o.y1 };
        var q = p;
        if (!ev.shiftKey) {
          var ang = snapAngle(Math.atan2(p.y - other.y, p.x - other.x), Math.PI / 12), l = V.dist(p, other);
          var snapped = V.add(other, V.fromAngle(ang, l));
          if (V.dist(snapped, p) < 8 / state.zoom) q = snapped;
        }
        if (h === 'p1') { o.x1 = q.x; o.y1 = q.y; } else { o.x2 = q.x; o.y2 = q.y; }
      }
      return;
    }
    if (o && o.type === 'callout' && h === 'anchor') { o.ax = p.x; o.ay = p.y; return; }
    if (o && o.type === 'text' && h === 'wrap') {
      o.wrap = Math.max(20, p.x - o.x);
      return;
    }
    var bb = drag.bbox;
    if (h === 'rot') {
      var c = { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 };
      var a0 = Math.atan2(drag.start.y - c.y, drag.start.x - c.x), a1 = Math.atan2(p.y - c.y, p.x - c.x);
      var deg = (a1 - a0) * 180 / Math.PI;
      if (!ev.shiftKey) deg = Math.round(deg / 15) * 15;
      restore(page);
      D.rotateKeys(page, drag.keys, deg, c);
      CS.emit('status', 'Rotate ' + Math.round(deg) + '°');
      return;
    }
    // resize
    var resizable = o && /^(rect|ellipse|step|image|bracket|orbital)$/.test(o.type);
    if (resizable && !o.rot) {
      var s0 = drag.objStart, x0 = s0.x, y0 = s0.y, x1 = s0.x + s0.w, y1 = s0.y + s0.h;
      if (/w/.test(h)) x0 = Math.min(p.x, x1 - 4);
      if (/e/.test(h)) x1 = Math.max(p.x, x0 + 4);
      if (/n/.test(h)) y0 = Math.min(p.y, y1 - 4);
      if (/s/.test(h)) y1 = Math.max(p.y, y0 + 4);
      if (ev.shiftKey && h.length === 2) {
        var r = s0.w / s0.h, w = x1 - x0, hh = w / r;
        if (/n/.test(h)) y0 = y1 - hh; else y1 = y0 + hh;
      }
      o.x = x0; o.y = y0; o.w = x1 - x0; o.h = y1 - y0;
      return;
    }
    // uniform scale around the opposite corner
    var anchor = { x: /w/.test(h) ? bb.x + bb.w : bb.x, y: /n/.test(h) ? bb.y + bb.h : bb.y };
    var corner = { x: /w/.test(h) ? bb.x : bb.x + bb.w, y: /n/.test(h) ? bb.y : bb.y + bb.h };
    var s = Math.max(0.05, V.dist(p, anchor) / (V.dist(corner, anchor) || 1));
    restore(page);
    D.scaleKeys(page, drag.keys, s, anchor);
    CS.emit('status', 'Scale ' + Math.round(s * 100) + '%');
  }
  function restore(page) {
    var snap = drag.snapshot;
    // restore geometry of selected items from snapshot
    var map = new Map();
    snap.atoms.forEach(function (a) { map.set('a:' + a.id, a); });
    snap.objects.forEach(function (o) { map.set('o:' + o.id, o); });
    page.atoms.forEach(function (a) { var s = map.get('a:' + a.id); if (s) { a.x = s.x; a.y = s.y; } });
    page.objects.forEach(function (o, i) {
      var s = map.get('o:' + o.id);
      if (s && drag.keys.has('o:' + o.id)) page.objects[i] = Object.assign(o, CS.clone(s));
    });
  }

  TOOLS.bond = {
    down: function (p, ev, page) {
      var a = hitAtom(p), b = !a && hitBond(p);
      drag.atom = a; drag.bond = b;
    },
    drag: function (p, ev, page) {
      if (drag.bond) return;
      var L = CS.settings().bondLength;
      var from = drag.atom || drag.start;
      var ang = Math.atan2(p.y - from.y, p.x - from.x);
      if (!ev.shiftKey) ang = snapAngle(ang, Math.PI / 12);
      var end = V.add(from, V.fromAngle(ang, L));
      var tgt = hitAtom(p, drag.atom ? new Set([drag.atom.id]) : null);
      if (tgt && V.dist(tgt, from) > 1) end = tgt;
      drag.end = end; drag.target = tgt;
      drag.preview = '<line x1="' + from.x + '" y1="' + from.y + '" x2="' + end.x + '" y2="' + end.y + '" class="preview" stroke-width="' + 1.5 / state.zoom + '"/>';
    },
    hover: function (p, page) { return null; },
    up: function (p, ev, page, d) {
      var L = CS.settings().bondLength, bt = state.bondType;
      if (d.bond && !d.moved) { clickBond(page, d.bond); CS.commit(); return; }
      var from = d.atom;
      if (!d.moved) {
        if (from) {
          var ang = newBondDirection(page, from);
          var end = V.add(from, V.fromAngle(ang, L));
          var to = atomAtOrNew(page, end, new Set([from.id]));
          var nb = D.addBond(page, from.id, to.id, bt.order, bt.style);
          if (nb) applyBondType(nb, bt);
        } else {
          var a1 = D.addAtom(page, p.x, p.y, 'C');
          var a2 = D.addAtom(page, p.x + L * Math.cos(-Math.PI / 6), p.y + L * Math.sin(-Math.PI / 6), 'C');
          D.addBond(page, a1.id, a2.id, bt.order, bt.style);
        }
        CS.commit();
        return;
      }
      if (!d.end) return;
      var A = from || atomAtOrNew(page, d.start);
      var B = d.target && d.target.id !== A.id ? d.target : atomAtOrNew(page, d.end, new Set([A.id]));
      if (A.id === B.id) return;
      var bd = D.addBond(page, A.id, B.id, bt.order, bt.style);
      if (bd) applyBondType(bd, bt);
      CS.commit();
    }
  };

  TOOLS.chain = {
    down: function (p, ev, page) { drag.atom = hitAtom(p); },
    drag: function (p, ev, page) {
      var L = CS.settings().bondLength, from = drag.atom || drag.start;
      var pts = chainPoints(from, p, L);
      drag.pts = pts;
      drag.preview = '<polyline points="' + pts.map(function (q) { return q.x + ',' + q.y; }).join(' ') + '" class="preview" fill="none" stroke-width="' + 1.5 / state.zoom + '"/>' +
        '<text x="' + (p.x + 8 / state.zoom) + '" y="' + (p.y - 8 / state.zoom) + '" class="preview-text" font-size="' + 11 / state.zoom + '">' + (pts.length - 1) + '</text>';
    },
    up: function (p, ev, page, d) {
      var L = CS.settings().bondLength;
      var pts = d.pts;
      if (!d.moved) {
        var from = d.atom;
        var ang = from ? newBondDirection(page, from) : -Math.PI / 6;
        var start = from || d.start;
        pts = chainPoints(start, V.add(start, V.fromAngle(ang, L * 3 * Math.cos(Math.PI / 6))), L, !from);
      }
      if (!pts || pts.length < 2) return;
      var prev = d.atom || atomAtOrNew(page, pts[0]);
      for (var i = 1; i < pts.length; i++) {
        var nx = atomAtOrNew(page, pts[i], new Set([prev.id]));
        D.addBond(page, prev.id, nx.id, 1);
        prev = nx;
      }
      CS.commit();
    }
  };

  TOOLS.ring = {
    hover: function (p, page) { return placeRing(page, state.ring.n || state.ring, state.ring.aromatic, p, true); },
    up: function (p, ev, page, d) {
      if (state.ring.chair) {
        var frag = CS.Templates.chair();
        placeFragment(page, frag, p);
      } else placeRing(page, state.ring.n, state.ring.aromatic, d.start);
      CS.commit();
    }
  };

  TOOLS.element = {
    up: function (p, ev, page, d) {
      var a = hitAtom(d.start);
      setElement(page, a, state.element, d.start);
      CS.commit();
    }
  };
  function setElement(page, a, el, p) {
    var lf = /^[A-Z][a-z]?$/.test(el) && Chem.isElement(el);
    if (!a) {
      a = D.addAtom(page, p.x, p.y, lf ? el : 'C');
      if (!lf) a.label = el;
      return a;
    }
    if (lf) { a.el = el; delete a.label; } else a.label = el;
    return a;
  }

  TOOLS.label = {
    up: function (p, ev, page, d) {
      var a = hitAtom(d.start);
      if (a) return editAtomLabel(a);
      var na = D.addAtom(page, d.start.x, d.start.y, 'C');
      render();
      editAtomLabel(na, true);
    }
  };

  TOOLS.charge = {
    up: function (p, ev, page, d) {
      var a = hitAtom(d.start);
      if (!a) return;
      var delta = state.chargeSign || 1;
      a.charge = (a.charge || 0) + delta;
      if (!a.charge) delete a.charge;
      CS.commit();
    }
  };
  TOOLS.radical = {
    up: function (p, ev, page, d) {
      var a = hitAtom(d.start);
      if (!a) return;
      a.radical = ((a.radical || 0) + 1) % 3;
      if (!a.radical) delete a.radical;
      delete a.lpCarbene;
      CS.commit();
    }
  };
  TOOLS.lonepair = {
    up: function (p, ev, page, d) {
      var a = hitAtom(d.start);
      if (!a) return;
      a.lonePairs = ((a.lonePairs || 0) + 1) % 4;
      if (!a.lonePairs) delete a.lonePairs;
      CS.commit();
    }
  };

  TOOLS.eraser = {
    down: function (p, ev, page) { eraseAt(page, p); },
    drag: function (p, ev, page) { eraseAt(page, p); },
    up: function () { CS.commit(); }
  };
  function eraseAt(page, p) {
    var a = hitAtom(p);
    if (a) { D.removeKeys(page, ['a:' + a.id]); return; }
    var b = hitBond(p);
    if (b) { D.removeKeys(page, ['b:' + b.id]); return; }
    var o = hitObject(p, function (x) { return x.type !== 'step'; }) || hitObject(p);
    if (o) D.removeKeys(page, ['o:' + o.id]);
  }

  TOOLS.text = {
    up: function (p, ev, page, d) {
      var k = hitAny(d.start);
      var it = k && D.item(page, k);
      if (it && k[0] === 'a') return editAtomLabel(it);
      if (it && (it.type === 'text' || it.type === 'callout' || (it.type === 'step' && !d.moved))) {
        if (it.type !== 'step') return editObjectText(it, d.start);
        // inside a step box: create a new text there
      }
      var o = { id: CS.uid(), type: 'text', x: d.start.x, y: d.start.y - 6, text: '', size: state.textSize || 10, font: state.textFont || 'ChemSans' };
      if (d.moved) { o.wrap = Math.max(20, Math.abs(p.x - d.start.x)); o.x = Math.min(p.x, d.start.x); }
      page.objects.push(o);
      render();
      editObjectText(o, d.start, true);
    },
    drag: function (p) {
      var r = CS.bboxOfPoints([drag.start, p]);
      drag.preview = '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + Math.max(r.h, 10) + '" class="marquee" stroke-width="' + 1 / state.zoom + '"/>';
    }
  };

  TOOLS.arrow = {
    drag: function (p, ev, page) {
      var q = p;
      if (!ev.shiftKey) {
        var ang = snapAngle(Math.atan2(p.y - drag.start.y, p.x - drag.start.x), Math.PI / 12);
        q = V.add(drag.start, V.fromAngle(ang, V.dist(p, drag.start)));
      }
      drag.end = q;
      var tmp = arrowObj(drag.start, q);
      drag.preview = '<g class="preview-obj">' + CS.R.renderObject(page, tmp) + '</g>';
    },
    up: function (p, ev, page, d) {
      var L = CS.settings().bondLength;
      var end = d.end || V.add(d.start, { x: L * 2.2, y: 0 });
      if (V.dist(end, d.start) < 3) end = V.add(d.start, { x: L * 2.2, y: 0 });
      var o = arrowObj(d.start, end);
      page.objects.push(o);
      state.sel = new Set(['o:' + o.id]);
      CS.commit();
    }
  };
  function arrowObj(a, b) {
    var k = state.arrowKind, o = { id: CS.uid(), type: 'arrow', x1: a.x, y1: a.y, x2: b.x, y2: b.y, kind: k, width: 0.75 };
    if (k === 'curved' || k === 'fishhook') {
      o.kind = k === 'fishhook' ? 'half' : 'forward';
      o.bend = V.dist(a, b) * 0.4;
    }
    if (k === 'dashed') { o.kind = 'forward'; o.dash = true; }
    if (k === 'line') { o.type = 'line'; delete o.kind; }
    return o;
  }

  TOOLS.shape = {
    drag: function (p, ev, page) {
      var tmp = shapeObj(drag.start, p, ev.shiftKey);
      drag.preview = '<g class="preview-obj">' + CS.R.renderObject(page, tmp) + '</g>';
    },
    up: function (p, ev, page, d) {
      var q = d.moved ? p : V.add(d.start, { x: 60, y: 40 });
      var o = shapeObj(d.start, q, ev.shiftKey);
      page.objects.push(o);
      state.sel = new Set(['o:' + o.id]);
      CS.commit();
    }
  };
  function shapeObj(a, b, square) {
    var r = CS.bboxOfPoints([a, b]);
    if (square) { var m = Math.max(r.w, r.h); r.w = m; r.h = m; if (b.x < a.x) r.x = a.x - m; if (b.y < a.y) r.y = a.y - m; }
    var k = state.shapeKind, o = { id: CS.uid(), x: r.x, y: r.y, w: Math.max(r.w, 2), h: Math.max(r.h, 2), width: 0.75 };
    if (k === 'rect' || k === 'roundrect') { o.type = 'rect'; if (k === 'roundrect') o.radius = Math.min(8, r.w / 4, r.h / 4); }
    else if (k === 'ellipse') o.type = 'ellipse';
    else if (k === 'step') { o.type = 'step'; o.num = nextStepNum(CS.page()) + '.'; o.caption = ''; o.size = 9.5; o.font = 'ChemSerif'; o.fill = '#fff'; if (r.w < 30) { o.w = 260; o.h = 170; } }
    else if (/^bracket/.test(k)) { o.type = 'bracket'; o.kind = k.split('-')[1] || 'square'; }
    else if (k === 'orbital') { o.type = 'orbital'; o.fill = '#bbb'; }
    return o;
  }
  function nextStepNum(page) {
    var n = 0;
    page.objects.forEach(function (o) { if (o.type === 'step') { var v = parseInt(o.num, 10); if (v > n) n = v; } });
    return n + 1;
  }

  TOOLS.callout = {
    drag: function (p, ev, page) {
      var tmp = { type: 'callout', ax: drag.start.x, ay: drag.start.y, tx: p.x, ty: ev.shiftKey ? p.y : drag.start.y + Math.round((p.y - drag.start.y)), text: 'label', size: 7 };
      drag.end = { x: tmp.tx, y: tmp.ty };
      drag.preview = '<g class="preview-obj">' + CS.R.renderObject(page, tmp) + '</g>';
    },
    up: function (p, ev, page, d) {
      var end = d.end || V.add(d.start, { x: 60, y: -10 });
      var o = { id: CS.uid(), type: 'callout', ax: d.start.x, ay: d.start.y, tx: end.x, ty: end.y, text: '', size: state.calloutSize || 7, font: 'ChemSans' };
      page.objects.push(o);
      state.sel = new Set(['o:' + o.id]);
      render();
      editObjectText(o, end, true);
    }
  };

  TOOLS.connector = {
    down: function (p, ev, page) {
      var o = hitObject(p, function (x) { return x.type !== 'connector' && x.type !== 'callout'; });
      drag.from = o;
    },
    drag: function (p, ev, page) {
      if (!drag.from) return;
      var bb = CS.R.objBBox(drag.from);
      drag.preview = '<line x1="' + (bb.x + bb.w / 2) + '" y1="' + (bb.y + bb.h / 2) + '" x2="' + p.x + '" y2="' + p.y + '" class="preview" stroke-width="' + 1.5 / state.zoom + '"/>';
    },
    up: function (p, ev, page, d) {
      var to = hitObject(p, function (x) { return x.type !== 'connector' && x.type !== 'callout' && x !== d.from; });
      if (!d.from || !to) { CS.emit('status', 'Drag from one box/object to another to connect them.'); return; }
      var gfrom = topGroupObj(page, d.from), gto = topGroupObj(page, to);
      var o = { id: CS.uid(), type: 'connector', from: gfrom.id, to: gto.id, route: 'auto', width: 0.75 };
      page.objects.push(o);
      CS.commit();
    }
  };
  function topGroupObj(page, o) {
    // connect step boxes rather than the apparatus inside them
    if (o.type === 'step') return o;
    var bb = CS.R.objBBox(o), best = o;
    page.objects.forEach(function (s) { if (s.type === 'step' && bb && CS.bboxContains(s, bb)) best = s; });
    return best;
  }

  TOOLS.template = {
    hover: function () { return null; },
    up: function (p, ev, page, d) {
      var t = state.template;
      if (!t) return;
      var frag = typeof t === 'function' ? t() : t;
      if (!frag) return;
      state.sel = placeFragment(page, frag, d.start);
      CS.commit();
    }
  };

  TOOLS.apparatus = {
    up: function (p, ev, page, d) {
      var sel = state.apparatus;
      if (!sel) return;
      var objs;
      if (sel.preset) {
        var pr = CS.Apparatus.preset(sel.preset);
        objs = CS.Apparatus.instantiate(pr, d.start.x, d.start.y, 1);
      } else {
        var def = CS.Apparatus.kind(sel.kind);
        objs = [{ id: CS.uid(), type: 'apparatus', kind: sel.kind, x: d.start.x - def.w / 2, y: d.start.y - def.h / 2, w: def.w, h: def.h, rot: 0, opts: CS.clone(def.defaults || {}) }];
      }
      objs.forEach(function (o) { page.objects.push(o); });
      state.sel = new Set(objs.map(function (o) { return 'o:' + o.id; }));
      CS.commit();
    }
  };

  TOOLS.pan = {};

  // ------------------------------------------------------------ inline editing
  function editAtomLabel(atom, isNew) {
    var page = CS.page();
    var g = Chem.graph(page);
    var cur = atom.label || (atom.el === 'C' && !atom.showC ? '' : atom.el + (function () { var h = Chem.implicitH(g, atom); return h ? 'H' + (h > 1 ? h : '') : ''; })());
    openEditor({ x: atom.x - 20, y: atom.y - 9 }, 60, cur, false, function (val) {
      val = val.trim();
      if (!val && isNew) { page.atoms = page.atoms.filter(function (x) { return x !== atom; }); return; }
      if (!val) { if (atom.label) delete atom.label; atom.el = 'C'; return; }
      var m = /^([A-Z][a-z]?)(?:H(\d*))?$/.exec(val);
      if (m && Chem.isElement(m[1])) {
        atom.el = m[1]; delete atom.label;
        var hInput = m[2] !== undefined ? (m[2] === '' ? 1 : +m[2]) : null;
        var hAuto = (function () { var tmp = Object.assign({}, atom); delete tmp.hCount; return Chem.implicitH(Chem.graph(page), tmp); })();
        if (/H/.test(val) && hInput !== hAuto) atom.hCount = hInput; else delete atom.hCount;
        if (m[1] === 'C' && !/H/.test(val)) atom.showC = true; else delete atom.showC;
      } else {
        atom.label = val;
        delete atom.hCount;
      }
    }, { atom: true, newAtom: isNew ? atom : null });
  }
  function editObjectText(o, p, isNew) {
    var field = o.type === 'step' ? 'caption' : 'text';
    var pos, width;
    if (o.type === 'text') { pos = { x: o.x, y: o.y }; width = o.wrap || 220; }
    else if (o.type === 'callout') { var tb = CS.R.calloutTextBox(o); pos = { x: tb.x, y: tb.y }; width = 160; }
    else {
      // step: edit number if clicking near the top, else caption
      if (p && p.y < o.y + 24 && p.x < o.x + 50) field = 'num';
      pos = field === 'num' ? { x: o.x + 8, y: o.y + 4 } : { x: o.x + 8, y: o.y + o.h - 60 };
      width = field === 'num' ? 60 : o.w - 16;
    }
    openEditor(pos, width, o[field] || '', field !== 'num', function (val) {
      o[field] = val;
    }, { obj: o, isNew: isNew, size: o.size });
  }
  function openEditor(pos, width, value, multiline, onCommit, info) {
    closeEditor();
    var sp = toScreen(pos), wr = wrap.getBoundingClientRect();
    var el = document.createElement(multiline ? 'textarea' : 'input');
    el.className = 'inline-editor';
    el.value = value;
    el.style.left = (sp.x - wr.left) + 'px';
    el.style.top = (sp.y - wr.top) + 'px';
    el.style.width = Math.max(80, width * state.zoom + 20) + 'px';
    el.style.fontSize = Math.max(11, Math.min(20, (info.size || 10) * state.zoom)) + 'px';
    if (multiline) el.rows = Math.max(2, value.split('\n').length + 1);
    wrap.appendChild(el);
    editing = { el: el, onCommit: onCommit, info: info };
    el.focus();
    el.select();
    el.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
      else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); commitEdit(); }
    });
    el.addEventListener('blur', function () { setTimeout(function () { if (editing && editing.el === el) commitEdit(); }, 0); });
    CS.emit('status', multiline ? 'Typing: Enter = new line, Ctrl+Enter = done, Esc = cancel.  H_2O → subscript, Na^+ → superscript (formulas like CaCl2 are auto-formatted)' : 'Type an element (N, O, Cl), a group (OMe, CO2Et, Ph) and press Enter');
  }
  function commitEdit() {
    if (!editing) return;
    var e = editing;
    editing = null;
    e.onCommit(e.el.value);
    e.el.remove();
    var page = CS.page();
    if (e.info.obj && e.info.obj.type === 'text' && !String(e.info.obj.text).trim()) {
      page.objects = page.objects.filter(function (x) { return x !== e.info.obj; });
    }
    if (e.info.obj && e.info.obj.type === 'callout' && !String(e.info.obj.text).trim()) {
      page.objects = page.objects.filter(function (x) { return x !== e.info.obj; });
    }
    CS.commit();
    render();
  }
  function cancelEdit() {
    if (!editing) return;
    var e = editing;
    editing = null;
    e.el.remove();
    var page = CS.page();
    if (e.info.isNew) page.objects = page.objects.filter(function (x) { return x !== e.info.obj; });
    if (e.info.newAtom) page.atoms = page.atoms.filter(function (x) { return x !== e.info.newAtom; });
    render();
  }
  function closeEditor() { if (editing) commitEdit(); }

  // ------------------------------------------------------------ keyboard
  var ELEMENT_KEYS = { c: 'C', n: 'N', o: 'O', s: 'S', p: 'P', f: 'F', h: 'H', i: 'I', b: 'Br', l: 'Cl', k: 'K', m: 'Me' };
  function onKey(ev) {
    if (editing) return;
    var t = ev.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    var page = CS.page(), ctrl = ev.ctrlKey || ev.metaKey, key = ev.key;
    if (key === ' ') { spaceDown = true; wrap.classList.add('can-pan'); ev.preventDefault(); return; }
    // hover shortcuts on atoms and bonds (ChemDraw style)
    var hv = state.hover && D.item(page, state.hover);
    if (!ctrl && !ev.altKey && hv && state.hover[0] === 'a') {
      var lk = key.length === 1 ? key.toLowerCase() : key;
      if (ELEMENT_KEYS[lk] && !(ev.shiftKey && lk === 'm')) {
        setElement(page, hv, ELEMENT_KEYS[lk]);
        CS.commit(); render(); ev.preventDefault(); return;
      }
      if (key === '+' || key === '=') { hv.charge = (hv.charge || 0) + 1; if (!hv.charge) delete hv.charge; CS.commit(); render(); ev.preventDefault(); return; }
      if (key === '-') { hv.charge = (hv.charge || 0) - 1; if (!hv.charge) delete hv.charge; CS.commit(); render(); ev.preventDefault(); return; }
      if (key === '.') { hv.radical = hv.radical ? 0 : 1; if (!hv.radical) delete hv.radical; CS.commit(); render(); ev.preventDefault(); return; }
      if (key === 'Enter') { editAtomLabel(hv); ev.preventDefault(); return; }
      if (/^[1-9]$/.test(key) && state.tool !== 'select') { /* fallthrough to tool keys */ }
      if (key === 'Delete' || key === 'Backspace') { D.removeKeys(page, [state.hover]); state.hover = null; CS.commit(); render(); ev.preventDefault(); return; }
    }
    if (!ctrl && !ev.altKey && hv && state.hover[0] === 'b') {
      var bmap = { '1': { order: 1 }, '2': { order: 2 }, '3': { order: 3 }, w: { order: 1, style: 'wedge' }, h: { order: 1, style: 'hash' }, y: { order: 1, style: 'wavy' }, d: { order: 1, style: 'dashed' }, b: { order: 1, style: 'bold' } };
      var bt = bmap[key.toLowerCase()];
      if (bt) { applyBondType(hv, bt); CS.commit(); render(); ev.preventDefault(); return; }
      if (key === 'Delete' || key === 'Backspace') { D.removeKeys(page, [state.hover]); state.hover = null; CS.commit(); render(); ev.preventDefault(); return; }
    }
    if (ctrl) {
      var lc = key.toLowerCase();
      if (lc === 'z' && !ev.shiftKey) { CS.Actions.undo(); ev.preventDefault(); }
      else if (lc === 'y' || (lc === 'z' && ev.shiftKey)) { CS.Actions.redo(); ev.preventDefault(); }
      else if (lc === 'c') { CS.Actions.copy(); ev.preventDefault(); }
      else if (lc === 'x') { CS.Actions.cut(); ev.preventDefault(); }
      else if (lc === 'd') { CS.Actions.duplicate(); ev.preventDefault(); }
      else if (lc === 'a') { CS.Actions.selectAll(); ev.preventDefault(); }
      else if (lc === 'g' && !ev.shiftKey) { CS.Actions.group(); ev.preventDefault(); }
      else if (lc === 'g' && ev.shiftKey) { CS.Actions.ungroup(); ev.preventDefault(); }
      else if (lc === 's') { CS.Actions.save(); ev.preventDefault(); }
      else if (lc === 'o') { CS.Actions.open(); ev.preventDefault(); }
      else if (lc === 'p') { CS.Actions.exportPDF(); ev.preventDefault(); }
      else if (lc === 'e') { CS.Actions.exportPDF(); ev.preventDefault(); }
      else if (key === '=' || key === '+') { setZoom(state.zoom * 1.25); ev.preventDefault(); }
      else if (key === '-') { setZoom(state.zoom / 1.25); ev.preventDefault(); }
      else if (key === '0') { fitPage(); ev.preventDefault(); }
      else if (key === '1') { setZoom(1); ev.preventDefault(); }
      else if (lc === 'k') { CS.Actions.cleanStructure(); ev.preventDefault(); }
      return;
    }
    if (key === 'Delete' || key === 'Backspace') { CS.Actions.del(); ev.preventDefault(); return; }
    if (key === 'Escape') { state.sel.clear(); CS.UI && CS.UI.setTool('select'); render(); CS.emit('selection'); return; }
    if (/^Arrow/.test(key) && state.sel.size) {
      var step = ev.shiftKey ? 10 : 1;
      var dx = key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0, dy = key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0;
      D.translate(page, state.sel, dx, dy, carriedBy(page, new Set(state.sel)));
      CS.commit(); render(); ev.preventDefault(); return;
    }
    CS.UI && CS.UI.toolKey && CS.UI.toolKey(key, ev);
  }
  function onKeyUp(ev) {
    if (ev.key === ' ') { spaceDown = false; wrap.classList.remove('can-pan'); }
  }

  function onWheel(ev) {
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) {
      var f = Math.exp(-ev.deltaY * 0.0025);
      setZoom(state.zoom * f, toPage(ev));
    } else {
      state.pan.x += (ev.shiftKey ? ev.deltaY : ev.deltaX) / state.zoom;
      state.pan.y += (ev.shiftKey ? 0 : ev.deltaY) / state.zoom;
      updateViewBox();
    }
  }

  function init(container) {
    wrap = container;
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'canvas');
    svg.innerHTML = '<g class="pagebg"></g><g class="gridl"></g><g class="content"></g><g class="overlay"></g>';
    wrap.appendChild(svg);
    gPage = svg.querySelector('.pagebg');
    gGrid = svg.querySelector('.gridl');
    gContent = svg.querySelector('.content');
    gOverlay = svg.querySelector('.overlay');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('wheel', onWheel, { passive: false });
    svg.addEventListener('pointerleave', function () { if (!drag) { state.hover = null; state.preview = null; renderOverlay(); } });
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', function () { updateViewBox(); });
    updateViewBox();
  }

  CS.Editor = {
    init: init, render: render, renderOverlay: renderOverlay, setZoom: setZoom, fitPage: fitPage, fitWidth: fitWidth,
    updateViewBox: updateViewBox, toPage: toPage, lastPointer: function () { return lastPointer; },
    placeFragment: placeFragment, editObjectText: editObjectText, editAtomLabel: editAtomLabel, closeEditor: closeEditor,
    carriedBy: carriedBy, isEditing: function () { return !!editing; },
    viewCenter: function () {
      var r = wrap.getBoundingClientRect();
      return { x: state.pan.x + r.width / state.zoom / 2, y: state.pan.y + r.height / state.zoom / 2 };
    }
  };
})(window.CS);
