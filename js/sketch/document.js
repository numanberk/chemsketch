/* Document model, drawing styles, undo history, selection and editing operations. */
(function (CS) {
  'use strict';
  var V = CS.V;

  var STYLES = {
    default: { name: 'Default', bondLength: 20, lineWidth: 0.8, boldWidth: 2.6, wedgeWidth: 5.2, hashSpacing: 2.5, fontSize: 11, margin: 1.4 },
    acs: { name: 'ACS Document 1996', bondLength: 14.4, lineWidth: 0.6, boldWidth: 2, wedgeWidth: 4.3, hashSpacing: 2.5, fontSize: 10, margin: 1.6 },
    rsc: { name: 'RSC / Wiley', bondLength: 17, lineWidth: 0.7, boldWidth: 2.2, wedgeWidth: 4.8, hashSpacing: 2.5, fontSize: 10, margin: 1.4 },
    large: { name: 'Presentation (large)', bondLength: 32, lineWidth: 1.4, boldWidth: 4, wedgeWidth: 8.5, hashSpacing: 3.6, fontSize: 18, margin: 2 }
  };
  var PAGE_SIZES = {
    A4: [595.28, 841.89], Letter: [612, 792], A5: [419.53, 595.28], A3: [841.89, 1190.55], Legal: [612, 1008]
  };

  function newPage(size, landscape) {
    var s = PAGE_SIZES[size || 'A4'] || PAGE_SIZES.A4;
    return { id: CS.uid(), size: size || 'A4', width: landscape ? s[1] : s[0], height: landscape ? s[0] : s[1], atoms: [], bonds: [], objects: [] };
  }
  function newDoc() {
    var st = STYLES.default;
    return {
      app: 'ChemSketch', version: 1, title: 'Untitled',
      settings: Object.assign({ style: 'default', font: 'ChemSans', colorAtoms: false, showGrid: false, snap: false, gridSize: 10 }, st),
      pages: [newPage('A4')]
    };
  }

  var state = (CS.state = {
    doc: newDoc(), pageIdx: 0, sel: new Set(), tool: 'select', bondType: { order: 1, style: 'plain' }, ring: 6,
    element: 'C', arrowKind: 'forward', shapeKind: 'rect', zoom: 1.25, pan: { x: -40, y: -30 }, hover: null, showCIP: false
  });

  CS.page = function () { return state.doc.pages[state.pageIdx]; };
  CS.settings = function () {
    var s = state.doc.settings;
    return {
      bondLength: s.bondLength, lineWidth: s.lineWidth, boldWidth: s.boldWidth, wedgeWidth: s.wedgeWidth, hashSpacing: s.hashSpacing,
      spacing: s.bondLength * 0.18, font: s.font || 'ChemSans', fontSize: s.fontSize, margin: s.margin, colorAtoms: s.colorAtoms
    };
  };

  // ------------------------------------------------------------ history
  var H = (CS.History = {
    stack: [], idx: -1, limit: 300,
    snapshot: function () { return JSON.stringify({ doc: state.doc, pageIdx: state.pageIdx }); },
    reset: function () { this.stack = [this.snapshot()]; this.idx = 0; },
    push: function () {
      var s = this.snapshot();
      if (this.stack[this.idx] === s) return false;
      this.stack = this.stack.slice(0, this.idx + 1);
      this.stack.push(s);
      if (this.stack.length > this.limit) this.stack.shift();
      this.idx = this.stack.length - 1;
      return true;
    },
    restore: function (s) {
      var o = JSON.parse(s);
      state.doc = o.doc;
      state.pageIdx = Math.min(o.pageIdx, state.doc.pages.length - 1);
      state.sel.clear();
    },
    undo: function () { if (this.idx > 0) { this.idx--; this.restore(this.stack[this.idx]); return true; } return false; },
    redo: function () { if (this.idx < this.stack.length - 1) { this.idx++; this.restore(this.stack[this.idx]); return true; } return false; }
  });

  var autosave = CS.debounce(function () {
    if (CS.embed) return;
    CS.store.set('chemsketch.autosave', JSON.stringify(state.doc));
  }, 600);

  CS.commit = function () {
    pruneDangling(CS.page());
    if (H.push()) autosave();
    CS.emit('change');
  };

  // simple event bus
  var listeners = {};
  CS.on = function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); };
  CS.emit = function (ev, arg) { (listeners[ev] || []).forEach(function (fn) { fn(arg); }); };

  // ------------------------------------------------------------ lookups
  function findAtom(page, id) { for (var i = 0; i < page.atoms.length; i++) if (page.atoms[i].id === id) return page.atoms[i]; return null; }
  function findBond(page, id) { for (var i = 0; i < page.bonds.length; i++) if (page.bonds[i].id === id) return page.bonds[i]; return null; }
  function findObj(page, id) { for (var i = 0; i < page.objects.length; i++) if (page.objects[i].id === id) return page.objects[i]; return null; }
  function bondBetween(page, a, b) {
    for (var i = 0; i < page.bonds.length; i++) {
      var x = page.bonds[i];
      if ((x.a === a && x.b === b) || (x.a === b && x.b === a)) return x;
    }
    return null;
  }
  function item(page, key) {
    var t = key.charAt(0), id = key.slice(2);
    return t === 'a' ? findAtom(page, id) : t === 'b' ? findBond(page, id) : findObj(page, id);
  }

  // ------------------------------------------------------------ edits
  function addAtom(page, x, y, el) {
    var a = { id: CS.uid(), x: x, y: y, el: el || 'C' };
    page.atoms.push(a);
    return a;
  }
  function addBond(page, a, b, order, style) {
    if (a === b) return null;
    var ex = bondBetween(page, a, b);
    if (ex) return ex;
    var bd = { id: CS.uid(), a: a, b: b, order: order || 1 };
    if (style && style !== 'plain') bd.style = style;
    page.bonds.push(bd);
    return bd;
  }
  function removeKeys(page, keys) {
    var atoms = new Set(), bonds = new Set(), objs = new Set();
    keys.forEach(function (k) {
      var id = k.slice(2);
      if (k[0] === 'a') atoms.add(id); else if (k[0] === 'b') bonds.add(id); else objs.add(id);
    });
    page.bonds.forEach(function (b) { if (atoms.has(b.a) || atoms.has(b.b)) bonds.add(b.id); });
    // atoms left without bonds after deleting bonds disappear when they are plain carbons
    var touched = new Set();
    page.bonds.forEach(function (b) { if (bonds.has(b.id)) { touched.add(b.a); touched.add(b.b); } });
    page.bonds = page.bonds.filter(function (b) { return !bonds.has(b.id); });
    var deg = new Map();
    page.bonds.forEach(function (b) { deg.set(b.a, (deg.get(b.a) || 0) + 1); deg.set(b.b, (deg.get(b.b) || 0) + 1); });
    page.atoms.forEach(function (a) {
      if (touched.has(a.id) && !deg.get(a.id) && a.el === 'C' && !a.label && !a.charge) atoms.add(a.id);
    });
    page.atoms = page.atoms.filter(function (a) { return !atoms.has(a.id); });
    page.objects = page.objects.filter(function (o) { return !objs.has(o.id); });
    pruneDangling(page);
  }
  function pruneDangling(page) {
    if (!page) return;
    var ids = new Set(page.objects.map(function (o) { return o.id; }));
    page.objects = page.objects.filter(function (o) { return o.type !== 'connector' || (ids.has(o.from) && ids.has(o.to)); });
  }
  function mergeAtoms(page, keepId, dropId) {
    if (keepId === dropId) return;
    page.bonds.forEach(function (b) {
      if (b.a === dropId) b.a = keepId;
      if (b.b === dropId) b.b = keepId;
    });
    // remove self-bonds and duplicates
    var seen = new Set();
    page.bonds = page.bonds.filter(function (b) {
      if (b.a === b.b) return false;
      var k = b.a < b.b ? b.a + b.b : b.b + b.a;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    page.atoms = page.atoms.filter(function (a) { return a.id !== dropId; });
  }

  // ------------------------------------------------------------ selection helpers
  function expandGroups(page, keys) {
    var groups = new Set();
    keys.forEach(function (k) { var it = item(page, k); if (it && it.groupId) groups.add(it.groupId); });
    if (!groups.size) return keys;
    var out = new Set(keys);
    page.atoms.forEach(function (a) { if (groups.has(a.groupId)) out.add('a:' + a.id); });
    page.objects.forEach(function (o) { if (groups.has(o.groupId)) out.add('o:' + o.id); });
    page.bonds.forEach(function (b) { if (out.has('a:' + b.a) && out.has('a:' + b.b)) out.add('b:' + b.id); });
    return out;
  }
  function fragmentKeys(page, atomId) {
    var g = CS.Chem.graph(page), fr = CS.Chem.fragments(g, [atomId])[0], out = new Set();
    if (!fr) return out;
    fr.atoms.forEach(function (id) { out.add('a:' + id); });
    fr.bonds.forEach(function (id) { out.add('b:' + id); });
    return out;
  }
  // atoms affected by a selection (selected atoms + atoms of selected bonds)
  function selAtoms(page, keys) {
    var ids = new Set();
    keys.forEach(function (k) {
      if (k[0] === 'a') ids.add(k.slice(2));
      else if (k[0] === 'b') { var b = findBond(page, k.slice(2)); if (b) { ids.add(b.a); ids.add(b.b); } }
    });
    return ids;
  }
  function selObjects(page, keys) {
    var out = [];
    keys.forEach(function (k) { if (k[0] === 'o') { var o = findObj(page, k.slice(2)); if (o) out.push(o); } });
    return out;
  }
  function itemBBox(page, key) {
    var it = item(page, key);
    if (!it) return null;
    if (key[0] === 'a') return CS.R.atomBBox(it);
    if (key[0] === 'b') {
      var a = findAtom(page, it.a), b = findAtom(page, it.b);
      return a && b ? CS.bboxOfPoints([a, b], 1) : null;
    }
    return CS.R.objBBox(it);
  }
  function keysBBox(page, keys) {
    var list = [];
    keys.forEach(function (k) { list.push(itemBBox(page, k)); });
    return CS.bboxUnion(list.filter(Boolean));
  }

  // ------------------------------------------------------------ transforms
  // move atoms and objects of a selection
  function translate(page, keys, dx, dy, carried) {
    selAtoms(page, keys).forEach(function (id) { var a = findAtom(page, id); a.x += dx; a.y += dy; });
    var objs = selObjects(page, keys);
    (carried || []).forEach(function (o) { if (objs.indexOf(o) < 0) objs.push(o); });
    objs.forEach(function (o) { moveObj(o, dx, dy); });
  }
  function moveObj(o, dx, dy) {
    if (o.type === 'arrow' || o.type === 'line') {
      o.x1 += dx; o.y1 += dy; o.x2 += dx; o.y2 += dy;
      if (o.cx != null) { o.cx += dx; o.cy += dy; }
    }
    else if (o.type === 'callout') { o.ax += dx; o.ay += dy; o.tx += dx; o.ty += dy; }
    else if (o.type === 'connector') { /* derived */ }
    else { o.x += dx; o.y += dy; }
  }
  // generic affine-ish transform: fn maps points; info: {rot (deg), scale, flipX, flipY}
  function transform(page, keys, fn, info) {
    selAtoms(page, keys).forEach(function (id) { var a = findAtom(page, id), p = fn(a); a.x = p.x; a.y = p.y; });
    if (info.flipX || info.flipY) {
      page.bonds.forEach(function (b) {
        // nothing: wedge direction is defined by atom order and is preserved by mirroring
      });
    }
    selObjects(page, keys).forEach(function (o) {
      var s = info.scale || 1;
      if (o.type === 'arrow' || o.type === 'line') {
        var p1 = fn({ x: o.x1, y: o.y1 }), p2 = fn({ x: o.x2, y: o.y2 });
        o.x1 = p1.x; o.y1 = p1.y; o.x2 = p2.x; o.y2 = p2.y;
        if (o.cx != null) { var cp = fn({ x: o.cx, y: o.cy }); o.cx = cp.x; o.cy = cp.y; }
        if (o.bend) o.bend *= s * ((info.flipX ? -1 : 1) * (info.flipY ? -1 : 1));
        if (o.width && info.scaleStroke) o.width *= s;
      } else if (o.type === 'callout') {
        var a = fn({ x: o.ax, y: o.ay }), t = fn({ x: o.tx, y: o.ty });
        o.ax = a.x; o.ay = a.y; o.tx = t.x; o.ty = t.y;
        if (s !== 1) o.size = (o.size || 7) * s;
      } else if (o.type === 'connector') {
        // derived
      } else if (o.type === 'text') {
        var bb = CS.R.objBBox(Object.assign({}, o, { rot: 0 }));
        var c = fn({ x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 });
        if (s !== 1) { o.size = (o.size || 10) * s; if (o.wrap) o.wrap *= s; }
        var nb = CS.R.objBBox(Object.assign({}, o, { rot: 0 }));
        o.x = c.x - nb.w / 2; o.y = c.y - nb.h / 2;
        if (info.rot) o.rot = ((o.rot || 0) + info.rot) % 360;
      } else {
        var cc = fn({ x: o.x + o.w / 2, y: o.y + o.h / 2 });
        o.w *= s; o.h *= s;
        if (o.type === 'step') { if (s !== 1) o.size = (o.size || 9.5) * s; }
        o.x = cc.x - o.w / 2; o.y = cc.y - o.h / 2;
        if (info.rot && o.type !== 'step') o.rot = ((o.rot || 0) + info.rot) % 360;
        if (info.flipX && o.type !== 'step') { o.flip = !o.flip; if (o.rot) o.rot = -o.rot; }
        if (info.flipY && o.type !== 'step') { o.flip = !o.flip; o.rot = ((o.rot || 0) * -1 + 180) % 360; }
      }
    });
  }
  function rotateKeys(page, keys, deg, center) {
    var a = deg * Math.PI / 180;
    transform(page, keys, function (p) { return V.rot(p, a, center); }, { rot: deg });
  }
  function scaleKeys(page, keys, s, center) {
    transform(page, keys, function (p) { return { x: center.x + (p.x - center.x) * s, y: center.y + (p.y - center.y) * s }; }, { scale: s });
  }
  function flipKeys(page, keys, horizontal) {
    var bb = keysBBox(page, keys);
    if (!bb) return;
    var cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
    transform(page, keys, function (p) { return horizontal ? { x: 2 * cx - p.x, y: p.y } : { x: p.x, y: 2 * cy - p.y }; }, { flipX: horizontal, flipY: !horizontal });
  }

  // ------------------------------------------------------------ clipboard serialization
  function extract(page, keys) {
    var atomIds = selAtoms(page, keys);
    var atoms = page.atoms.filter(function (a) { return atomIds.has(a.id); });
    var bonds = page.bonds.filter(function (b) { return atomIds.has(b.a) && atomIds.has(b.b); });
    var objs = selObjects(page, keys);
    var objIds = new Set(objs.map(function (o) { return o.id; }));
    // keep connectors whose ends are both copied
    page.objects.forEach(function (o) {
      if (o.type === 'connector' && objIds.has(o.from) && objIds.has(o.to) && !objIds.has(o.id)) objs.push(o);
    });
    return CS.clone({ atoms: atoms, bonds: bonds, objects: objs });
  }
  // insert a fragment (with fresh ids) offset by dx,dy; returns the new selection keys
  function insert(page, frag, dx, dy) {
    var map = {}, keys = new Set(), gmap = {};
    function gid(g) { if (!g) return g; if (!gmap[g]) gmap[g] = CS.uid(); return gmap[g]; }
    frag = CS.clone(frag);
    frag.atoms.forEach(function (a) { map[a.id] = CS.uid(); });
    frag.objects.forEach(function (o) { map[o.id] = CS.uid(); });
    frag.atoms.forEach(function (a) {
      a.id = map[a.id]; a.x += dx; a.y += dy; a.groupId = gid(a.groupId);
      page.atoms.push(a); keys.add('a:' + a.id);
    });
    frag.bonds.forEach(function (b) {
      b.id = CS.uid(); b.a = map[b.a]; b.b = map[b.b];
      page.bonds.push(b); keys.add('b:' + b.id);
    });
    frag.objects.forEach(function (o) {
      o.id = map[o.id]; o.groupId = gid(o.groupId);
      if (o.type === 'connector') { o.from = map[o.from] || o.from; o.to = map[o.to] || o.to; }
      moveObj(o, dx, dy);
      page.objects.push(o); keys.add('o:' + o.id);
    });
    return keys;
  }

  CS.Doc = {
    STYLES: STYLES, PAGE_SIZES: PAGE_SIZES,
    newDoc: newDoc, newPage: newPage,
    findAtom: findAtom, findBond: findBond, findObj: findObj, bondBetween: bondBetween, item: item,
    addAtom: addAtom, addBond: addBond, removeKeys: removeKeys, mergeAtoms: mergeAtoms, pruneDangling: pruneDangling,
    expandGroups: expandGroups, fragmentKeys: fragmentKeys, selAtoms: selAtoms, selObjects: selObjects,
    itemBBox: itemBBox, keysBBox: keysBBox,
    translate: translate, moveObj: moveObj, transform: transform, rotateKeys: rotateKeys, scaleKeys: scaleKeys, flipKeys: flipKeys,
    extract: extract, insert: insert,
    load: function (doc) {
      if (!doc || !doc.pages || !doc.pages.length) throw new Error('Not a ChemSketch document');
      var base = newDoc();
      doc.settings = Object.assign(base.settings, doc.settings || {});
      doc.pages.forEach(function (p) { p.atoms = p.atoms || []; p.bonds = p.bonds || []; p.objects = p.objects || []; p.id = p.id || CS.uid(); });
      state.doc = doc;
      state.pageIdx = 0;
      state.sel.clear();
      H.reset();
      CS.emit('change');
      CS.emit('docloaded');
    }
  };
})(window.CS);
