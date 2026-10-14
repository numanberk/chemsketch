/* User interface: menu bar, tool palette, side panels (properties, lab equipment, templates,
   analysis), page tabs, dialogs and all menu actions. */
(function (CS) {
  'use strict';
  var state = CS.state, D = CS.Doc, Chem = CS.Chem;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function svgIcon(inner, vb) {
    return '<svg viewBox="' + (vb || '0 0 24 24') + '" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  var ICON = {
    select: svgIcon('<path d="M5 3l12 8-5.5 1.2L14.5 19l-2.6 1.2-3-6.8L5 17z" fill="currentColor" stroke="none"/>'),
    lasso: svgIcon('<rect x="4" y="4" width="16" height="14" stroke-dasharray="3 2"/>'),
    pan: svgIcon('<path d="M8 12V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6a1.5 1.5 0 013 0v7c0 4-2.5 7-6 7-3 0-4.5-1.5-6-4l-2-3.5a1.4 1.4 0 012.3-1.5L8 14"/>'),
    eraser: svgIcon('<path d="M4 16l9-9 6 6-7 7H8z"/><path d="M9 20h11"/>'),
    single: svgIcon('<path d="M4 18L20 6"/>'),
    double: svgIcon('<path d="M4 16L18 5.5M6 19L20 8.5"/>'),
    triple: svgIcon('<path d="M3.5 15L17 5M5 18L19 7.5M6.5 21L20.5 10.5"/>'),
    wedge: svgIcon('<path d="M4 19L20 7l-2-3z" fill="currentColor"/>'),
    hash: svgIcon('<path d="M5 18l1 1M7.6 15.4l1.6 2M10.2 12.8l2.2 2.8M12.8 10.2l2.8 3.6M15.4 7.6l3.4 4.4M18 5l4 5.2"/>'),
    hollow: svgIcon('<path d="M4 19L20 7l-2-3z"/>'),
    wavy: svgIcon('<path d="M3 18q2-4 4-1t4-1 4-1 4-1 4-4"/>'),
    bold: svgIcon('<path d="M4 18L20 6" stroke-width="4"/>'),
    dashed: svgIcon('<path d="M4 18L20 6" stroke-dasharray="2.5 2.5"/>'),
    arom: svgIcon('<path d="M4 16L18 5.5"/><path d="M6 19L20 8.5" stroke-dasharray="2 2"/>'),
    chain: svgIcon('<path d="M2 15l5-5 5 5 5-5 5 5"/>'),
    ring3: svgIcon('<path d="M12 4l8 14H4z"/>'),
    ring4: svgIcon('<rect x="5" y="5" width="14" height="14"/>'),
    ring5: svgIcon('<path d="M12 3l9 6.5-3.4 10.5H6.4L3 9.5z"/>'),
    ring6: svgIcon('<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/>'),
    ring7: svgIcon('<path d="M12 2.5l7.4 3.6 1.8 8-5.1 6.4H7.9l-5.1-6.4 1.8-8z"/>'),
    ring8: svgIcon('<path d="M8.5 2.5h7l5 5v7l-5 5h-7l-5-5v-7z"/>'),
    benzene: svgIcon('<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><path d="M12 5.6l5.6 3.2M17.6 15.2L12 18.4M6.4 15.2V8.8"/>'),
    chair: svgIcon('<path d="M2 12l6 3 7-2.5 7 3-6-3-7 2.5"/><path d="M2 12l7-3 6 3"/>'),
    element: svgIcon('<text x="12" y="17" font-size="14" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial" font-weight="bold">N</text>'),
    plus: svgIcon('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'),
    minus: svgIcon('<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>'),
    radical: svgIcon('<text x="9" y="17" font-size="13" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">C</text><circle cx="17" cy="7" r="2" fill="currentColor"/>'),
    lonepair: svgIcon('<text x="12" y="18" font-size="13" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial">O</text><circle cx="9.5" cy="4.5" r="1.4" fill="currentColor"/><circle cx="14.5" cy="4.5" r="1.4" fill="currentColor"/>'),
    text: svgIcon('<path d="M5 5h14M12 5v15M9 20h6"/>'),
    'a-forward': svgIcon('<path d="M3 12h15"/><path d="M14 8l6 4-6 4z" fill="currentColor"/>'),
    'a-equilibrium': svgIcon('<path d="M3 10h17l-5-3.5M21 14H4l5 3.5"/>'),
    'a-both': svgIcon('<path d="M7 12h10"/><path d="M8 8l-5 4 5 4zM16 8l5 4-5 4z" fill="currentColor"/>'),
    'a-retro': svgIcon('<path d="M3 10h14M3 14h14M15 6l6 6-6 6"/>'),
    'a-curved': svgIcon('<path d="M4 17C6 6 16 4 19 12"/><path d="M16 11l3.5 3 1-4.5z" fill="currentColor"/>'),
    'a-fishhook': svgIcon('<path d="M4 17C6 6 16 4 19 12l-4 -1.5"/>'),
    'a-dashed': svgIcon('<path d="M3 12h14" stroke-dasharray="3 2"/><path d="M15 8l6 4-6 4z" fill="currentColor"/>'),
    'a-noreaction': svgIcon('<path d="M3 12h15"/><path d="M14 8l6 4-6 4z" fill="currentColor"/><path d="M8 8l4 8M12 8l-4 8"/>'),
    'a-line': svgIcon('<path d="M4 19L20 5"/>'),
    's-rect': svgIcon('<rect x="4" y="6" width="16" height="12"/>'),
    's-roundrect': svgIcon('<rect x="4" y="6" width="16" height="12" rx="3"/>'),
    's-ellipse': svgIcon('<ellipse cx="12" cy="12" rx="8" ry="6"/>'),
    's-bracket-square': svgIcon('<path d="M8 4H5v16h3M16 4h3v16h-3"/>'),
    's-bracket-round': svgIcon('<path d="M8 4Q3 12 8 20M16 4q5 8 0 16"/>'),
    's-bracket-curly': svgIcon('<path d="M9 4q-3 0-3 3v3l-2 2 2 2v3q0 3 3 3M15 4q3 0 3 3v3l2 2-2 2v3q0 3-3 3"/>'),
    's-orbital': svgIcon('<path d="M12 12C6 2 18 2 12 12z" fill="currentColor"/><path d="M12 12C6 22 18 22 12 12z"/>'),
    step: svgIcon('<rect x="3" y="4" width="18" height="16"/><text x="7" y="10" font-size="6" fill="currentColor" stroke="none" font-weight="bold">1.</text><path d="M6 16h12M6 18h8" stroke-width="1"/>'),
    callout: svgIcon('<circle cx="5" cy="17" r="1.5" fill="currentColor"/><path d="M5 17L13 9"/><path d="M14.5 9h6" stroke-width="2.4"/>'),
    connector: svgIcon('<rect x="2" y="3" width="8" height="6"/><rect x="14" y="15" width="8" height="6"/><path d="M6 9v4h12v1"/><path d="M16 13l2 2 2-2" fill="currentColor"/>'),
    flask: svgIcon('<path d="M10 3v6.5a6 6 0 104 0V3M9 3h6"/>'),
    template: svgIcon('<path d="M7 4l5 3v6l-5 3-5-3V7zM17 8l5 3v6l-5 3-5-3"/>')
  };

  var TOOL_DEFS = [
    { h: 'Select' },
    { id: 'select', icon: 'select', tip: 'Select / move / rotate (V). Click a bond to grab the molecule, Alt-click for one atom, Alt-drag to duplicate.', key: 'v' },
    { id: 'pan', icon: 'pan', tip: 'Pan (hold Space)', key: '' },
    { id: 'eraser', icon: 'eraser', tip: 'Eraser (E)', key: 'e' },
    { id: 'text', icon: 'text', tip: 'Text (T). Click to type, drag to set a wrap width. H_2O, Na^+; formulas auto-format.', key: 't' },
    { h: 'Bonds' },
    { id: 'bond:1:plain', icon: 'single', tip: 'Single bond (1). Click a bond to cycle single/double/triple.', key: '1' },
    { id: 'bond:2:plain', icon: 'double', tip: 'Double bond (2). Click a double bond to move its second line.', key: '2' },
    { id: 'bond:3:plain', icon: 'triple', tip: 'Triple bond (3)', key: '3' },
    { id: 'bond:1:wedge', icon: 'wedge', tip: 'Wedge (stereo, up) (W). Click again to flip.', key: 'w' },
    { id: 'bond:1:hash', icon: 'hash', tip: 'Hashed wedge (stereo, down) (H)', key: 'h' },
    { id: 'bond:1:hollow', icon: 'hollow', tip: 'Hollow wedge' },
    { id: 'bond:1:wavy', icon: 'wavy', tip: 'Wavy bond (unknown stereo)' },
    { id: 'bond:1:bold', icon: 'bold', tip: 'Bold bond' },
    { id: 'bond:1:dashed', icon: 'dashed', tip: 'Dashed bond' },
    { id: 'bond:2:dashed', icon: 'arom', tip: 'Partial double / aromatic (1.5) bond' },
    { id: 'chain', icon: 'chain', tip: 'Chain: drag to draw a zig-zag carbon chain (C)', key: 'c' },
    { h: 'Rings' },
    { id: 'ring:3', icon: 'ring3', tip: 'Cyclopropane' },
    { id: 'ring:4', icon: 'ring4', tip: 'Cyclobutane' },
    { id: 'ring:5', icon: 'ring5', tip: 'Cyclopentane' },
    { id: 'ring:6', icon: 'ring6', tip: 'Cyclohexane (R)', key: 'r' },
    { id: 'ring:7', icon: 'ring7', tip: 'Cycloheptane' },
    { id: 'ring:8', icon: 'ring8', tip: 'Cyclooctane' },
    { id: 'ring:6:ar', icon: 'benzene', tip: 'Benzene (B). Click a bond to fuse.', key: 'b' },
    { id: 'ring:chair', icon: 'chair', tip: 'Cyclohexane chair' },
    { h: 'Atoms' },
    { id: 'element', icon: 'element', tip: 'Element / label tool – pick from the periodic table. Tip: hover an atom and press N, O, S, Cl (L), Br (B)…' },
    { id: 'charge:+', icon: 'plus', tip: 'Positive charge (click atom). Or hover + press +' },
    { id: 'charge:-', icon: 'minus', tip: 'Negative charge (click atom). Or hover + press -' },
    { id: 'radical', icon: 'radical', tip: 'Radical: click an atom for one dot, again for two (carbene/diradical), again to remove' },
    { id: 'lonepair', icon: 'lonepair', tip: 'Lone pair (click repeatedly to add more)' },
    { h: 'Arrows' },
    { id: 'arrow:forward', icon: 'a-forward', tip: 'Reaction arrow (A)', key: 'a' },
    { id: 'arrow:equilibrium', icon: 'a-equilibrium', tip: 'Equilibrium arrow' },
    { id: 'arrow:both', icon: 'a-both', tip: 'Resonance arrow' },
    { id: 'arrow:retro', icon: 'a-retro', tip: 'Retrosynthesis arrow' },
    { id: 'arrow:curved', icon: 'a-curved', tip: 'Curved arrow (electron pair). Drag the middle handle to bend.' },
    { id: 'arrow:fishhook', icon: 'a-fishhook', tip: 'Fishhook (single electron)' },
    { id: 'arrow:dashed', icon: 'a-dashed', tip: 'Dashed arrow' },
    { id: 'arrow:noreaction', icon: 'a-noreaction', tip: 'No reaction' },
    { id: 'arrow:line', icon: 'a-line', tip: 'Line (L)', key: 'l' },
    { h: 'Shapes' },
    { id: 'shape:rect', icon: 's-rect', tip: 'Rectangle' },
    { id: 'shape:roundrect', icon: 's-roundrect', tip: 'Rounded rectangle' },
    { id: 'shape:ellipse', icon: 's-ellipse', tip: 'Ellipse / circle (Shift = circle)' },
    { id: 'shape:bracket-square', icon: 's-bracket-square', tip: 'Square brackets' },
    { id: 'shape:bracket-round', icon: 's-bracket-round', tip: 'Parentheses' },
    { id: 'shape:bracket-curly', icon: 's-bracket-curly', tip: 'Braces' },
    { id: 'shape:orbital', icon: 's-orbital', tip: 'p-Orbital' },
    { h: 'Flowchart' },
    { id: 'shape:step', icon: 'step', tip: 'Step box (numbered). Drag to size it; contents move with the box.' },
    { id: 'callout', icon: 'callout', tip: 'Label with leader line: drag from the item to where the text goes' },
    { id: 'connector', icon: 'connector', tip: 'Connector arrow: drag from one box to another (re-routes automatically)' },
    { id: 'panel:lab', icon: 'flask', tip: 'Lab equipment library' },
    { id: 'panel:templates', icon: 'template', tip: 'Structure templates' }
  ];

  // ------------------------------------------------------------ tools
  function setTool(id) {
    var parts = id.split(':');
    var t = parts[0];
    if (t === 'panel') { showPanel(parts[1]); return; }
    state.tool = t;
    if (t === 'bond') state.bondType = { order: +parts[1], style: parts[2] };
    if (t === 'ring') {
      if (parts[1] === 'chair') state.ring = { chair: true };
      else state.ring = { n: +parts[1], aromatic: parts[2] === 'ar' };
    }
    if (t === 'arrow') state.arrowKind = parts[1];
    if (t === 'shape') state.shapeKind = parts[1];
    if (t === 'charge') state.chargeSign = parts[1] === '-' ? -1 : 1;
    state.toolId = id;
    $$('.tool').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tool') === id || (t === 'apparatus' && false) || (t === 'template' && false)); });
    if (t !== 'select') { state.sel.clear(); CS.emit('selection'); }
    state.preview = null;
    CS.Editor.render();
    var def = TOOL_DEFS.filter(function (d) { return d.id === id; })[0];
    status(def ? def.tip : (t === 'apparatus' ? 'Click on the page to place the equipment.' : t === 'template' ? 'Click on the page to place the structure.' : ''));
  }
  function toolKey(key, ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    var k = key.toLowerCase();
    var def = TOOL_DEFS.filter(function (d) { return d.key && d.key === k; })[0];
    if (def) { setTool(def.id); ev.preventDefault(); return; }
    if (k === 'f') { CS.Editor.fitPage(); ev.preventDefault(); }
  }

  function status(msg) { var s = $('#status-msg'); if (s) s.textContent = msg || ''; }

  // ------------------------------------------------------------ dialogs
  function dialog(o) {
    var back = document.createElement('div');
    back.className = 'modal-back';
    var box = document.createElement('div');
    box.className = 'modal' + (o.wide ? ' wide' : '');
    box.innerHTML = '<div class="modal-title">' + CS.esc(o.title || '') + '<button class="modal-x" title="Close">×</button></div><div class="modal-body"></div><div class="modal-foot"></div>';
    var body = box.querySelector('.modal-body');
    if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
    var foot = box.querySelector('.modal-foot');
    function close() { back.remove(); document.removeEventListener('keydown', esc, true); }
    function esc(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Enter' && o.enterSubmits && e.target.tagName !== 'TEXTAREA') {
        var pb = (o.buttons || []).filter(function (b) { return b.primary; })[0];
        if (pb) { e.preventDefault(); if (!pb.action || pb.action(body) !== false) close(); }
      }
    }
    (o.buttons || [{ label: 'Close', primary: true }]).forEach(function (b) {
      var btn = document.createElement('button');
      btn.textContent = b.label;
      if (b.primary) btn.className = 'primary';
      btn.addEventListener('click', function () {
        var r = b.action ? b.action(body, btn) : undefined;
        if (r && r.then) {
          btn.disabled = true;
          r.then(function (v) { btn.disabled = false; if (v !== false) close(); }, function (e) { btn.disabled = false; toast(e.message || String(e), true); });
        } else if (r !== false) close();
      });
      foot.appendChild(btn);
    });
    box.querySelector('.modal-x').addEventListener('click', close);
    back.addEventListener('pointerdown', function (e) { if (e.target === back) close(); });
    back.appendChild(box);
    document.body.appendChild(back);
    document.addEventListener('keydown', esc, true);
    var f = box.querySelector('input,textarea,select');
    if (f && !o.noFocus) setTimeout(function () { f.focus(); }, 0);
    return { close: close, body: body };
  }
  function prompt(title, label, value, cb, opts) {
    opts = opts || {};
    var html = '<label class="field">' + CS.esc(label) + (opts.multiline ? '<textarea rows="6" class="pval">' + CS.esc(value || '') + '</textarea>' : '<input class="pval" value="' + CS.esc(value || '') + '">') + '</label>' + (opts.hint ? '<div class="hint">' + opts.hint + '</div>' : '');
    dialog({
      title: title, body: html, enterSubmits: !opts.multiline,
      buttons: [{ label: 'Cancel' }, { label: opts.ok || 'OK', primary: true, action: function (b) { return cb(b.querySelector('.pval').value); } }]
    });
  }
  var toastTimer;
  function toast(msg, err) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'show' + (err ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = ''; }, err ? 5000 : 2600);
  }

  // ------------------------------------------------------------ actions
  var clipboard = null;
  var A = (CS.Actions = {
    undo: function () { if (CS.History.undo()) { CS.emit('change'); } },
    redo: function () { if (CS.History.redo()) { CS.emit('change'); } },
    copy: function () {
      if (!state.sel.size) return;
      clipboard = D.extract(CS.page(), state.sel);
      CS.store.set('chemsketch.clipboard', JSON.stringify(clipboard));
      // also put SMILES on the system clipboard when structures are copied
      try {
        if (clipboard.atoms.length && Chem.oclReady() && navigator.clipboard) {
          navigator.clipboard.writeText(Chem.smilesOf(CS.page(), Array.from(D.selAtoms(CS.page(), state.sel)))).catch(function () { });
        }
      } catch (e) { }
      toast('Copied');
    },
    cut: function () { A.copy(); A.del(); },
    paste: function (text) {
      var page = CS.page();
      if (text && looksLikeChem(text)) return importText(text);
      var cb = clipboard || (function () { try { return JSON.parse(CS.store.get('chemsketch.clipboard')); } catch (e) { return null; } })();
      if (!cb) return;
      state.sel = D.insert(page, cb, 15, 15);
      clipboard = D.extract(page, state.sel);
      CS.commit();
    },
    duplicate: function () {
      if (!state.sel.size) return;
      var page = CS.page();
      state.sel = D.insert(page, D.extract(page, state.sel), 15, 15);
      CS.commit();
    },
    del: function () {
      if (!state.sel.size) return;
      D.removeKeys(CS.page(), Array.from(state.sel));
      state.sel.clear();
      CS.commit();
    },
    selectAll: function () {
      var page = CS.page(), s = new Set();
      page.atoms.forEach(function (a) { s.add('a:' + a.id); });
      page.bonds.forEach(function (b) { s.add('b:' + b.id); });
      page.objects.forEach(function (o) { s.add('o:' + o.id); });
      state.sel = s;
      setTool('select');
      CS.Editor.render();
      CS.emit('selection');
    },
    group: function () {
      if (state.sel.size < 2) return;
      var g = CS.uid(), page = CS.page();
      state.sel.forEach(function (k) { var it = D.item(page, k); if (it && k[0] !== 'b') it.groupId = g; });
      CS.commit(); toast('Grouped');
    },
    ungroup: function () {
      var page = CS.page();
      state.sel.forEach(function (k) { var it = D.item(page, k); if (it) delete it.groupId; });
      CS.commit(); toast('Ungrouped');
    },
    order: function (where) {
      var page = CS.page(), sel = D.selObjects(page, state.sel);
      if (!sel.length) return;
      var rest = page.objects.filter(function (o) { return sel.indexOf(o) < 0; });
      page.objects = where === 'front' ? rest.concat(sel) : sel.concat(rest);
      sel.forEach(function (o) { if (where === 'back') o.behind = true; else delete o.behind; });
      CS.commit();
    },
    flip: function (h) { if (!state.sel.size) return; D.flipKeys(CS.page(), state.sel, h); CS.commit(); },
    rotate: function (deg) {
      if (!state.sel.size) return;
      var page = CS.page(), bb = D.keysBBox(page, state.sel);
      D.rotateKeys(page, state.sel, deg, { x: bb.x + bb.w / 2, y: bb.y + bb.h / 2 });
      CS.commit();
    },
    align: function (how) {
      var page = CS.page(), keys = Array.from(state.sel);
      // align top-level units: fragments/groups/objects
      var units = units_(page, keys);
      if (units.length < 2) return;
      var bbs = units.map(function (u) { return D.keysBBox(page, u); });
      var all = CS.bboxUnion(bbs);
      units.forEach(function (u, i) {
        var b = bbs[i], dx = 0, dy = 0;
        if (how === 'left') dx = all.x - b.x;
        if (how === 'right') dx = all.x + all.w - b.x - b.w;
        if (how === 'hcenter') dx = all.x + all.w / 2 - b.x - b.w / 2;
        if (how === 'top') dy = all.y - b.y;
        if (how === 'bottom') dy = all.y + all.h - b.y - b.h;
        if (how === 'vcenter') dy = all.y + all.h / 2 - b.y - b.h / 2;
        D.translate(page, u, dx, dy, CS.Editor.carriedBy(page, new Set(u)));
      });
      if (how === 'hdist' || how === 'vdist') {
        var idx = units.map(function (u, i) { return i; }).sort(function (a, b) { return how === 'hdist' ? bbs[a].x - bbs[b].x : bbs[a].y - bbs[b].y; });
        var total = 0;
        idx.forEach(function (i) { total += how === 'hdist' ? bbs[i].w : bbs[i].h; });
        var span = how === 'hdist' ? all.w : all.h, gap = (span - total) / (units.length - 1), pos = how === 'hdist' ? all.x : all.y;
        idx.forEach(function (i) {
          var b = bbs[i];
          if (how === 'hdist') { D.translate(page, units[i], pos - b.x, 0, []); pos += b.w + gap; }
          else { D.translate(page, units[i], 0, pos - b.y, []); pos += b.h + gap; }
        });
      }
      CS.commit();
    },
    cleanStructure: function () {
      var page = CS.page();
      if (!Chem.oclReady()) return toast('Structure engine not loaded', true);
      var ids = state.sel.size ? Array.from(D.selAtoms(page, state.sel)) : page.atoms.map(function (a) { return a.id; });
      if (!ids.length) return toast('Select a structure to clean up');
      var g = Chem.graph(page);
      Chem.fragments(g, ids).forEach(function (fr) {
        var r = Chem.toOCL(page, fr.atoms);
        var c = CS.bboxOfPoints(fr.atoms.map(function (id) { return g.atoms.get(id); }));
        var res = Chem.fromOCL(r.mol, c.x + c.w / 2, c.y + c.h / 2);
        // atoms keep identity: indices in r.map follow insertion order
        var idx = 0;
        r.map.forEach(function (i, id) {
          var a = g.atoms.get(id), na = res.atoms[i];
          a.x = na.x; a.y = na.y;
          idx++;
        });
      });
      CS.commit();
      toast('Structure cleaned up');
    },
    newDoc: function () {
      confirmDiscard(function () {
        D.load(D.newDoc());
        CS.Editor.fitPage();
      });
    },
    open: function () { $('#file-open').click(); },
    save: function () {
      var blob = new Blob([JSON.stringify(state.doc, null, 0)], { type: 'application/json' });
      CS.download(blob, CS.safeName(state.doc.title) + '.chemsketch.json');
      toast('Saved ' + CS.safeName(state.doc.title) + '.chemsketch.json');
    },
    exportPDF: function () { exportDialog('pdf'); },
    exportSVG: function () { exportDialog('svg'); },
    exportPNG: function () { exportDialog('png'); },
    exportMOL: function () {
      var page = CS.page();
      if (!Chem.oclReady()) return toast('Structure engine not loaded', true);
      var ids = state.sel.size ? Array.from(D.selAtoms(page, state.sel)) : page.atoms.map(function (a) { return a.id; });
      if (!ids.length) return toast('Nothing to export – draw or select a structure first', true);
      CS.download(new Blob([Chem.molfileOf(page, ids)], { type: 'chemical/x-mdl-molfile' }), CS.safeName(state.doc.title) + '.mol');
    },
    copySMILES: function () {
      var page = CS.page();
      var ids = state.sel.size ? Array.from(D.selAtoms(page, state.sel)) : page.atoms.map(function (a) { return a.id; });
      if (!ids.length) return toast('Select a structure first', true);
      var smi = Chem.smilesOf(page, ids);
      dialog({ title: 'SMILES', body: '<textarea class="code" rows="3" readonly>' + CS.esc(smi) + '</textarea>', buttons: [{ label: 'Copy', primary: true, action: function () { navigator.clipboard && navigator.clipboard.writeText(smi); toast('SMILES copied'); } }, { label: 'Close' }] });
    },
    importSMILES: function () {
      prompt('Insert structure from SMILES', 'SMILES string', '', function (v) {
        if (!v.trim()) return false;
        return importText(v) === false ? false : undefined;
      }, { hint: 'Example: <code>CC(=O)Oc1ccccc1C(=O)O</code> (aspirin). A MOL file can be pasted into the canvas with Ctrl+V.' });
    },
    nameToStructure: function () {
      prompt('Name → Structure', 'Chemical name (looked up on PubChem)', '', function (v) {
        v = v.trim();
        if (!v) return false;
        return fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' + encodeURIComponent(v) + '/SDF?record_type=2d')
          .then(function (r) { if (!r.ok) throw new Error('“' + v + '” was not found on PubChem'); return r.text(); })
          .then(function (sdf) {
            var mol = window.OCL.Molecule.fromMolfile(sdf);
            mol.stripSmallFragments && false;
            mol.removeExplicitHydrogens && mol.removeExplicitHydrogens();
            insertMol(mol, true);
            toast('Inserted ' + v);
          });
      }, { ok: 'Insert', hint: 'Needs an internet connection. Try “caffeine”, “cyclohexene”, “ibuprofen”.' });
    },
    structureToName: function () {
      var page = CS.page();
      var ids = state.sel.size ? Array.from(D.selAtoms(page, state.sel)) : page.atoms.map(function (a) { return a.id; });
      if (!ids.length) return toast('Select a structure first', true);
      var smi = Chem.smilesOf(page, ids);
      toast('Looking up name…');
      fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/property/IUPACName,Title/JSON', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'smiles=' + encodeURIComponent(smi)
      }).then(function (r) { if (!r.ok) throw new Error('Not found on PubChem'); return r.json(); }).then(function (j) {
        var p = j.PropertyTable.Properties[0];
        if (!p.IUPACName && !p.Title) throw new Error('Not found on PubChem');
        var name = p.IUPACName || p.Title;
        dialog({
          title: 'Structure → Name', body: '<p><b>IUPAC name:</b> ' + CS.esc(p.IUPACName || '—') + '</p>' + (p.Title ? '<p><b>Common name:</b> ' + CS.esc(p.Title) + '</p>' : '') + '<p class="hint">From PubChem.</p>',
          buttons: [{
            label: 'Insert as text below structure', primary: true, action: function () {
              var bb = D.keysBBox(page, new Set(ids.map(function (i) { return 'a:' + i; })));
              var lay = CS.Text.layout(name, { size: 10, chem: false });
              page.objects.push({ id: CS.uid(), type: 'text', x: bb.x + bb.w / 2 - lay.w / 2, y: bb.y + bb.h + 8, text: name, size: 10, chem: false });
              CS.commit();
            }
          }, { label: 'Close' }]
        });
      }).catch(function (e) { toast(e.message || 'Lookup failed (are you online?)', true); });
    },
    insertImage: function () { $('#file-image').click(); },
    addPage: function () {
      var cur = CS.page();
      var p = D.newPage(cur.size, cur.width > cur.height);
      state.doc.pages.splice(state.pageIdx + 1, 0, p);
      state.pageIdx++;
      state.sel.clear();
      CS.commit();
      CS.Editor.fitPage();
    },
    deletePage: function () {
      if (state.doc.pages.length < 2) return toast('A document needs at least one page');
      state.doc.pages.splice(state.pageIdx, 1);
      state.pageIdx = Math.max(0, state.pageIdx - 1);
      state.sel.clear();
      CS.commit();
    },
    duplicatePage: function () {
      var p = CS.clone(CS.page());
      p.id = CS.uid();
      var frag = { atoms: p.atoms, bonds: p.bonds, objects: p.objects };
      p.atoms = []; p.bonds = []; p.objects = [];
      D.insert(p, frag, 0, 0);
      state.doc.pages.splice(state.pageIdx + 1, 0, p);
      state.pageIdx++;
      CS.commit();
    },
    pageSetup: function () {
      var p = CS.page();
      var html = '<label class="field">Size <select id="ps-size">' + Object.keys(D.PAGE_SIZES).map(function (k) { return '<option' + (p.size === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></label>' +
        '<label class="field">Orientation <select id="ps-or"><option value="p">Portrait</option><option value="l"' + (p.width > p.height ? ' selected' : '') + '>Landscape</option></select></label>' +
        '<label class="check"><input type="checkbox" id="ps-all"> Apply to all pages</label>';
      dialog({
        title: 'Page setup', body: html, buttons: [{ label: 'Cancel' }, {
          label: 'Apply', primary: true, action: function (b) {
            var size = $('#ps-size', b).value, land = $('#ps-or', b).value === 'l', s = D.PAGE_SIZES[size];
            (b.querySelector('#ps-all').checked ? state.doc.pages : [p]).forEach(function (pg) {
              pg.size = size; pg.width = land ? s[1] : s[0]; pg.height = land ? s[0] : s[1];
            });
            CS.commit(); CS.Editor.fitPage();
          }
        }]
      });
    },
    docSettings: function () {
      var s = state.doc.settings;
      var html = '<label class="field">Drawing style <select id="ds-style">' + Object.keys(D.STYLES).map(function (k) { return '<option value="' + k + '"' + (s.style === k ? ' selected' : '') + '>' + D.STYLES[k].name + '</option>'; }).join('') + '</select></label>' +
        '<label class="check"><input type="checkbox" id="ds-rescale" checked> Rescale existing structures to the new bond length</label>' +
        '<div class="grid2"><label class="field">Bond length (pt)<input type="number" step="0.1" id="ds-bl" value="' + s.bondLength + '"></label>' +
        '<label class="field">Line width (pt)<input type="number" step="0.05" id="ds-lw" value="' + s.lineWidth + '"></label>' +
        '<label class="field">Label font size (pt)<input type="number" step="0.5" id="ds-fs" value="' + s.fontSize + '"></label>' +
        '<label class="field">Label font<select id="ds-font"><option value="ChemSans">Sans (Arial-like)</option><option value="ChemSerif"' + (s.font === 'ChemSerif' ? ' selected' : '') + '>Serif (Times-like)</option></select></label></div>' +
        '<label class="check"><input type="checkbox" id="ds-color"' + (s.colorAtoms ? ' checked' : '') + '> Colour heteroatoms</label>' +
        '<label class="field">Document title <input id="ds-title" value="' + CS.esc(state.doc.title || '') + '"></label>';
      var d = dialog({
        title: 'Document settings', body: html, buttons: [{ label: 'Cancel' }, {
          label: 'Apply', primary: true, action: function (b) {
            var oldL = s.bondLength;
            s.bondLength = +$('#ds-bl', b).value || s.bondLength;
            s.lineWidth = +$('#ds-lw', b).value || s.lineWidth;
            s.fontSize = +$('#ds-fs', b).value || s.fontSize;
            s.font = $('#ds-font', b).value;
            s.colorAtoms = $('#ds-color', b).checked;
            s.style = $('#ds-style', b).value;
            var st = D.STYLES[s.style];
            if (st && s.bondLength === st.bondLength) { s.boldWidth = st.boldWidth; s.wedgeWidth = st.wedgeWidth; s.hashSpacing = st.hashSpacing; s.margin = st.margin; }
            else { s.boldWidth = s.bondLength * 0.13; s.wedgeWidth = s.bondLength * 0.26; }
            state.doc.title = $('#ds-title', b).value || 'Untitled';
            if ($('#ds-rescale', b).checked && oldL !== s.bondLength) rescaleStructures(oldL, s.bondLength);
            CS.commit();
          }
        }]
      });
      d.body.querySelector('#ds-style').addEventListener('change', function (e) {
        var st = D.STYLES[e.target.value];
        $('#ds-bl', d.body).value = st.bondLength; $('#ds-lw', d.body).value = st.lineWidth; $('#ds-fs', d.body).value = st.fontSize;
      });
    },
    toggleGrid: function () { state.doc.settings.showGrid = !state.doc.settings.showGrid; CS.Editor.render(); refreshMenus(); },
    toggleSnap: function () { state.doc.settings.snap = !state.doc.settings.snap; refreshMenus(); toast('Snap to grid ' + (state.doc.settings.snap ? 'on' : 'off')); },
    toggleCIP: function () { state.showCIP = !state.showCIP; CS.Editor.render(); refreshMenus(); },
    flowWizard: function () { CS.Flow.openWizard(); },
    flowExample: function () {
      CS.Flow.openWizard(CS.Flow.EXAMPLE);
    },
    flowAddStep: function () {
      var b = CS.Flow.addStep(CS.page());
      state.sel = new Set(['o:' + b.id]);
      CS.commit();
      toast('Step ' + b.num + ' added – double-click it to write the caption');
    },
    flowRelayout: function () { CS.Flow.relayout(CS.page()); CS.commit(); toast('Flowchart re-arranged'); },
    openChemWord: function () { window.open('chemword/index.html', '_blank'); },
    shortcuts: function () { dialog({ title: 'Keyboard shortcuts', body: SHORTCUTS_HTML, wide: true }); },
    about: function () { dialog({ title: 'About ChemSketch', body: ABOUT_HTML }); }
  });

  function units_(page, keys) {
    // split selection keys into movable units (molecule fragments, groups, single objects)
    var seen = new Set(), out = [];
    keys.forEach(function (k) {
      if (seen.has(k)) return;
      var unit;
      if (k[0] === 'a' || k[0] === 'b') {
        var aid = k[0] === 'a' ? k.slice(2) : D.findBond(page, k.slice(2)).a;
        unit = Array.from(D.fragmentKeys(page, aid)).filter(function (x) { return state.sel.has(x); });
      } else unit = Array.from(D.expandGroups(page, new Set([k]))).filter(function (x) { return state.sel.has(x); });
      unit.forEach(function (x) { seen.add(x); });
      if (unit.length) out.push(new Set(unit));
    });
    return out;
  }

  function rescaleStructures(oldL, newL) {
    var s = newL / oldL;
    state.doc.pages.forEach(function (page) {
      var g = Chem.graph(page);
      Chem.fragments(g).forEach(function (fr) {
        var atoms = fr.atoms.map(function (id) { return g.atoms.get(id); });
        var bb = CS.bboxOfPoints(atoms), cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
        atoms.forEach(function (a) { a.x = cx + (a.x - cx) * s; a.y = cy + (a.y - cy) * s; });
      });
    });
  }

  function confirmDiscard(cb) {
    if (CS.History.idx <= 0) return cb();
    dialog({ title: 'New document', body: '<p>Start a new document? Unsaved changes in the current one will be lost (it is still kept in the browser’s autosave until you draw again).</p>', buttons: [{ label: 'Cancel' }, { label: 'New document', primary: true, action: cb }] });
  }

  function looksLikeChem(text) {
    text = text.trim();
    if (/V2000|V3000|M  END/.test(text)) return true;
    if (/\s/.test(text) || text.length > 400) return false;
    return /^[A-Za-z0-9@+\-\[\]\(\)=#$:.\/\\%*]+$/.test(text) && /[A-Za-z]/.test(text) && /[CNOScnos\]]/.test(text);
  }
  function insertMol(mol, keepCoords) {
    var c = CS.Editor.viewCenter();
    var r = Chem.fromOCL(mol, c.x, c.y, keepCoords && hasCoords(mol));
    var page = CS.page();
    // molfile coordinates are y-up
    if (keepCoords && hasCoords(mol)) {
      var bb0 = CS.bboxOfPoints(r.atoms), cy = bb0.y + bb0.h / 2;
      r.atoms.forEach(function (a) { a.y = 2 * cy - a.y; });
    }
    var spot = freeSpot(page, CS.bboxOfPoints(r.atoms, CS.settings().fontSize));
    state.sel = D.insert(page, { atoms: r.atoms, bonds: r.bonds, objects: [] }, spot.dx, spot.dy);
    setTool('select');
    CS.commit();
  }
  // shift a box (right, then down) until it no longer overlaps anything on the page
  function freeSpot(page, bb) {
    var boxes = [];
    page.atoms.forEach(function (a) { boxes.push({ x: a.x - 6, y: a.y - 6, w: 12, h: 12 }); });
    page.objects.forEach(function (o) { if (o.type !== 'step') { var b = CS.R.objBBox(o); if (b) boxes.push(b); } });
    var dx = 0, dy = 0, gap = 16, tries = 0;
    function hits() {
      var t = { x: bb.x + dx - gap / 2, y: bb.y + dy - gap / 2, w: bb.w + gap, h: bb.h + gap };
      return boxes.some(function (b) { return CS.bboxIntersects(t, b); });
    }
    var startX = bb.x;
    while (hits() && tries++ < 400) {
      dx += 20;
      if (bb.x + dx + bb.w > page.width - 20) { dx = Math.max(20, Math.min(startX, 40)) - bb.x; dy += 20; }
    }
    return { dx: dx, dy: dy };
  }
  function hasCoords(mol) {
    for (var i = 0; i < mol.getAllAtoms(); i++) if (mol.getAtomX(i) || mol.getAtomY(i)) return true;
    return false;
  }
  function importText(text) {
    if (!Chem.oclReady()) { toast('Structure engine not loaded', true); return false; }
    try {
      var mol;
      if (/V2000|V3000|M  END/.test(text)) {
        mol = window.OCL.Molecule.fromMolfile(text);
        insertMol(mol, true);
      } else {
        mol = Chem.smilesToMol(text);
        insertMol(mol, false);
      }
      return true;
    } catch (e) {
      toast('Could not read structure: ' + (e.message || e), true);
      return false;
    }
  }

  function exportDialog(kind) {
    var many = state.doc.pages.length > 1;
    var html = '';
    if (kind === 'pdf') {
      html += '<label class="field">Pages <select id="ex-pages"><option value="all">All pages (' + state.doc.pages.length + ')</option><option value="cur"' + (many ? '' : ' selected') + '>Current page</option></select></label>';
    }
    html += '<label class="field">Area <select id="ex-crop"><option value="page">Whole page</option><option value="crop">Fit to drawing (crop)</option></select></label>';
    if (kind === 'png') html += '<label class="field">Resolution <select id="ex-dpi"><option>150</option><option selected>300</option><option>600</option></select> dpi</label><label class="check"><input type="checkbox" id="ex-tr"> Transparent background</label>';
    html += '<label class="field">File name <input id="ex-name" value="' + CS.esc(CS.safeName(state.doc.title)) + '"></label>';
    if (kind === 'pdf') html += '<div class="hint">Vector PDF with embedded fonts – text stays sharp and selectable at any zoom.</div>';
    dialog({
      title: 'Export ' + kind.toUpperCase(), body: html, buttons: [{ label: 'Cancel' }, {
        label: 'Export', primary: true, action: function (b) {
          var crop = $('#ex-crop', b).value === 'crop', name = CS.safeName($('#ex-name', b).value);
          CS.Editor.closeEditor();
          if (kind === 'pdf') {
            var pages = $('#ex-pages', b).value === 'all' ? state.doc.pages : [CS.page()];
            toast('Creating PDF…');
            return CS.Export.exportPDF(pages, { crop: crop }).then(function (blob) {
              CS.download(blob, name + '.pdf');
              toast('PDF exported');
            });
          }
          if (kind === 'svg') {
            var r = CS.Export.pageSVG(CS.page(), { crop: crop, embedFonts: true });
            CS.download(new Blob([r.svg], { type: 'image/svg+xml' }), name + '.svg');
            return;
          }
          return CS.Export.exportPNG(CS.page(), { crop: crop, dpi: +$('#ex-dpi', b).value, transparent: $('#ex-tr', b).checked }).then(function (blob) {
            CS.download(blob, name + '.png');
          });
        }
      }]
    });
  }

  // ------------------------------------------------------------ menus
  var MENUS = [
    {
      name: 'File', items: [
        ['New', 'newDoc', 'Ctrl+Alt+N'], ['Open…', 'open', 'Ctrl+O'], ['Save', 'save', 'Ctrl+S'], '-',
        ['Export PDF…', 'exportPDF', 'Ctrl+P'], ['Export SVG…', 'exportSVG'], ['Export PNG…', 'exportPNG'], ['Export MOL file', 'exportMOL'], '-',
        ['Insert image…', 'insertImage'], ['Page setup…', 'pageSetup'], ['Document settings…', 'docSettings'], '-',
        ['Open ChemWord (documents with drawings)', 'openChemWord']
      ]
    },
    {
      name: 'Edit', items: [
        ['Undo', 'undo', 'Ctrl+Z'], ['Redo', 'redo', 'Ctrl+Y'], '-', ['Cut', 'cut', 'Ctrl+X'], ['Copy', 'copy', 'Ctrl+C'], ['Paste', 'paste', 'Ctrl+V'],
        ['Duplicate', 'duplicate', 'Ctrl+D'], ['Delete', 'del', 'Del'], '-', ['Select all', 'selectAll', 'Ctrl+A']
      ]
    },
    {
      name: 'Object', items: [
        ['Group', 'group', 'Ctrl+G'], ['Ungroup', 'ungroup', 'Ctrl+Shift+G'], '-', ['Bring to front', 'order:front'], ['Send to back', 'order:back'], '-',
        ['Flip horizontal', 'flip:h'], ['Flip vertical', 'flip:v'], ['Rotate 90° right', 'rotate:90'], ['Rotate 90° left', 'rotate:-90'], ['Rotate 180°', 'rotate:180'], '-',
        ['Align left', 'align:left'], ['Align centre', 'align:hcenter'], ['Align right', 'align:right'], ['Align top', 'align:top'], ['Align middle', 'align:vcenter'], ['Align bottom', 'align:bottom'],
        ['Distribute horizontally', 'align:hdist'], ['Distribute vertically', 'align:vdist']
      ]
    },
    {
      name: 'Structure', items: [
        ['Clean up structure', 'cleanStructure', 'Ctrl+K'], ['Show stereochemistry (R/S)', 'toggleCIP', '', function () { return state.showCIP; }], '-',
        ['Insert from SMILES…', 'importSMILES'], ['Name → Structure…', 'nameToStructure'], ['Structure → Name', 'structureToName'], ['Copy as SMILES', 'copySMILES'], '-',
        ['Templates…', 'panel:templates'], ['Analysis', 'panel:analysis']
      ]
    },
    {
      name: 'Flowchart', items: [
        ['Flowchart wizard…', 'flowWizard'], ['Open lab example (Carbenes)', 'flowExample'], '-', ['Add next step box', 'flowAddStep'], ['Re-arrange steps & arrows', 'flowRelayout'], '-',
        ['Lab equipment…', 'panel:lab']
      ]
    },
    {
      name: 'View', items: [
        ['Zoom in', 'zoom:in', 'Ctrl+='], ['Zoom out', 'zoom:out', 'Ctrl+-'], ['Fit page', 'zoom:fit', 'Ctrl+0'], ['Fit width', 'zoom:width'], ['Actual size', 'zoom:1', 'Ctrl+1'], '-',
        ['Show grid', 'toggleGrid', '', function () { return state.doc.settings.showGrid; }], ['Snap to grid', 'toggleSnap', '', function () { return state.doc.settings.snap; }]
      ]
    },
    {
      name: 'Page', items: [['Add page', 'addPage'], ['Duplicate page', 'duplicatePage'], ['Delete page', 'deletePage'], ['Page setup…', 'pageSetup']]
    },
    { name: 'Help', items: [['Keyboard shortcuts', 'shortcuts'], ['About', 'about']] }
  ];

  function runAction(id) {
    var p = id.split(':');
    if (p[0] === 'panel') return showPanel(p[1]);
    if (p[0] === 'zoom') {
      if (p[1] === 'in') CS.Editor.setZoom(state.zoom * 1.25);
      else if (p[1] === 'out') CS.Editor.setZoom(state.zoom / 1.25);
      else if (p[1] === 'fit') CS.Editor.fitPage();
      else if (p[1] === 'width') CS.Editor.fitWidth();
      else CS.Editor.setZoom(+p[1]);
      return;
    }
    if (p[0] === 'order') return A.order(p[1]);
    if (p[0] === 'flip') return A.flip(p[1] === 'h');
    if (p[0] === 'rotate') return A.rotate(+p[1]);
    if (p[0] === 'align') return A.align(p[1]);
    if (A[id]) A[id]();
  }

  function buildMenus() {
    var bar = $('#menubar');
    MENUS.forEach(function (m) {
      var el = document.createElement('div');
      el.className = 'menu';
      el.innerHTML = '<button class="menu-btn">' + m.name + '</button><div class="menu-list"></div>';
      var list = el.querySelector('.menu-list');
      m.items.forEach(function (it) {
        if (CS.embed && it[1] === 'openChemWord') return;
        if (it === '-') { list.insertAdjacentHTML('beforeend', '<div class="sep"></div>'); return; }
        var b = document.createElement('button');
        b.className = 'menu-item';
        b.setAttribute('data-act', it[1]);
        b.innerHTML = '<span class="chk"></span><span>' + it[0] + '</span><span class="kbd">' + (it[2] || '') + '</span>';
        if (it[3]) b._checked = it[3];
        b.addEventListener('click', function () {
          closeMenus();
          if (it[1] === 'paste' && navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function (t) { A.paste(t); }, function () { A.paste(); });
          } else runAction(it[1]);
        });
        list.appendChild(b);
      });
      el.querySelector('.menu-btn').addEventListener('click', function (e) {
        var open = el.classList.contains('open');
        closeMenus();
        if (!open) { refreshMenus(); el.classList.add('open'); }
        e.stopPropagation();
      });
      el.querySelector('.menu-btn').addEventListener('mouseenter', function () {
        if ($('.menu.open') && !el.classList.contains('open')) { closeMenus(); refreshMenus(); el.classList.add('open'); }
      });
      bar.appendChild(el);
    });
    document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.menu')) closeMenus(); });
  }
  function closeMenus() { $$('.menu.open').forEach(function (m) { m.classList.remove('open'); }); }
  function refreshMenus() {
    $$('.menu-item').forEach(function (b) { if (b._checked) b.querySelector('.chk').textContent = b._checked() ? '✓' : ''; });
  }

  function buildToolbar() {
    var pal = $('#palette'), html = '';
    TOOL_DEFS.forEach(function (d) {
      if (d.h) { html += '<div class="pal-h">' + d.h + '</div>'; return; }
      html += '<button class="tool" data-tool="' + d.id + '" title="' + CS.esc(d.tip) + '">' + ICON[d.icon] + '</button>';
    });
    pal.innerHTML = html;
    pal.addEventListener('click', function (e) {
      var b = e.target.closest('.tool');
      if (!b) return;
      var id = b.getAttribute('data-tool');
      if (id === 'element') { openPeriodicTable(); return; }
      setTool(id);
    });
    // quick element bar
    var eb = $('#elements');
    ['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I', 'Na', 'Li', 'Mg', 'B', 'Si'].forEach(function (el) {
      var b = document.createElement('button');
      b.textContent = el;
      b.title = 'Element tool: ' + el + ' (click an atom to change it)';
      b.addEventListener('click', function () { pickElement(el); });
      eb.appendChild(b);
    });
    var more = document.createElement('button');
    more.textContent = '…';
    more.title = 'Periodic table and groups';
    more.addEventListener('click', openPeriodicTable);
    eb.appendChild(more);
  }
  function pickElement(el) {
    state.element = el;
    setTool('element');
    $$('#elements button').forEach(function (b) { b.classList.toggle('active', b.textContent === el); });
    $$('.tool').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tool') === 'element'); });
    status('Element ' + el + ': click an atom to change it, or click empty space to place it.');
  }
  function openPeriodicTable() {
    var cells = '';
    Chem.SYMBOLS.forEach(function (s, i) {
      var pos = Chem.ptPos(i + 1);
      cells += '<button class="pt-el" style="grid-row:' + (pos[0] + 1 + (pos[0] >= 8 ? 0.5 : 0)) + ';grid-column:' + (pos[1] + 1) + '" data-el="' + s + '" title="' + s + ' (' + (i + 1) + ')"><small>' + (i + 1) + '</small>' + s + '</button>';
    });
    var groups = ['Me', 'Et', 'iPr', 'tBu', 'Ph', 'Bn', 'Ac', 'Ts', 'Boc', 'OMe', 'OEt', 'OAc', 'CO2H', 'CO2Me', 'CO2Et', 'CN', 'NO2', 'CF3', 'NH2', 'OH', 'SH', 'OTs', 'OTBS', 'TMS', 'R', 'X'];
    var html = '<div class="pt">' + cells + '</div><div class="pt-groups"><b>Groups / labels:</b> ' + groups.map(function (g) { return '<button class="pt-el grp" data-el="' + g + '">' + g + '</button>'; }).join('') +
      '<label class="field inline">Custom label <input id="pt-custom" placeholder="e.g. CH2OH"></label></div>';
    var d = dialog({ title: 'Periodic table', body: html, wide: true, buttons: [{ label: 'Close' }, { label: 'Use custom label', action: function (b) { var v = $('#pt-custom', b).value.trim(); if (!v) return false; pickElement(v); } }] });
    d.body.addEventListener('click', function (e) {
      var b = e.target.closest('.pt-el');
      if (!b) return;
      pickElement(b.getAttribute('data-el'));
      d.close();
    });
  }

  // ------------------------------------------------------------ side panels
  function showPanel(name) {
    $$('#side .tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-panel') === name); });
    $$('#side .panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + name); });
    state.panel = name;
    if (name === 'lab') buildLabPanel();
    if (name === 'templates') buildTemplatePanel();
    if (name === 'analysis') updateAnalysis();
    if (name === 'props') updateProps();
  }

  var labBuilt = false;
  function buildLabPanel() {
    if (labBuilt) return;
    labBuilt = true;
    var el = $('#panel-lab'), html = '<div class="panel-hint">Click an item, then click on the page to place it. Setups include ready-made labels. Liquid levels, stir bars etc. are in Properties.</div><h4>Ready-made setups</h4><div class="thumbs">';
    CS.Apparatus.presets.forEach(function (p) {
      html += '<button class="thumb" data-preset="' + p.id + '" title="' + CS.esc(p.name) + '">' + CS.Apparatus.presetThumb(p, 72) + '<span>' + CS.esc(p.name) + '</span></button>';
    });
    html += '</div>';
    var cats = {};
    Object.keys(CS.Apparatus.kinds).forEach(function (k) {
      var d = CS.Apparatus.kinds[k];
      (cats[d.cat] = cats[d.cat] || []).push(k);
    });
    Object.keys(cats).forEach(function (c) {
      html += '<h4>' + CS.esc(c) + '</h4><div class="thumbs">';
      cats[c].forEach(function (k) {
        html += '<button class="thumb" data-kind="' + k + '" title="' + CS.esc(CS.Apparatus.kinds[k].name) + '">' + CS.Apparatus.thumb(k, 56) + '<span>' + CS.esc(CS.Apparatus.kinds[k].name) + '</span></button>';
      });
      html += '</div>';
    });
    el.innerHTML = html;
    el.addEventListener('click', function (e) {
      var b = e.target.closest('.thumb');
      if (!b) return;
      $$('.thumb', el).forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      state.apparatus = b.getAttribute('data-preset') ? { preset: b.getAttribute('data-preset') } : { kind: b.getAttribute('data-kind') };
      setTool('apparatus');
    });
  }

  var tplBuilt = false;
  function buildTemplatePanel() {
    if (tplBuilt) return;
    var el = $('#panel-templates');
    if (!Chem.oclReady()) { el.innerHTML = '<div class="panel-hint">Structure engine not loaded.</div>'; return; }
    tplBuilt = true;
    var html = '<div class="panel-hint">Click a template, then click on the page. Or use <a href="#" data-act="importSMILES">SMILES</a> / <a href="#" data-act="nameToStructure">Name → Structure</a>.</div>';
    CS.Templates.GROUPS.forEach(function (g, gi) {
      html += '<h4>' + CS.esc(g.name) + '</h4><div class="thumbs">';
      g.items.forEach(function (it, ii) {
        var svg = '';
        try { svg = CS.Templates.thumbSVG(CS.Templates.fromSmiles(it[1]), 56); } catch (e) { svg = ''; }
        html += '<button class="thumb" data-g="' + gi + '" data-i="' + ii + '" title="' + CS.esc(it[0] + '  ' + it[1]) + '">' + svg + '<span>' + CS.esc(it[0]) + '</span></button>';
      });
      html += '</div>';
    });
    el.innerHTML = html;
    el.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]');
      if (a) { e.preventDefault(); runAction(a.getAttribute('data-act')); return; }
      var b = e.target.closest('.thumb');
      if (!b) return;
      $$('.thumb', el).forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      var it = CS.Templates.GROUPS[+b.getAttribute('data-g')].items[+b.getAttribute('data-i')];
      state.template = function () { return CS.Templates.fromSmiles(it[1]); };
      setTool('template');
    });
  }

  function updateAnalysis() {
    if (state.panel !== 'analysis') return;
    var el = $('#panel-analysis'), page = CS.page();
    var ids = state.sel.size ? Array.from(D.selAtoms(page, state.sel)) : page.atoms.map(function (a) { return a.id; });
    if (!ids.length) { el.innerHTML = '<div class="panel-hint">Draw or select a structure to see its formula, mass and properties.</div>'; return; }
    var g = Chem.graph(page), frs = Chem.fragments(g, ids), html = '';
    frs.slice(0, 6).forEach(function (fr, i) {
      var an = Chem.analysis(page, fr.atoms);
      var f = CS.Text.layout(an.formulaMarkup, { size: 13, chem: false });
      html += '<div class="an-card"><div class="an-formula"><svg width="' + (f.w + 4) + '" height="' + (f.h + 4) + '">' + CS.Text.toSVG(f, 2, 2, 'currentColor') + '</svg>' + (an.charge ? ' <span>(' + (an.charge > 0 ? '+' : '−') + Math.abs(an.charge) + ')</span>' : '') + '</div>' +
        '<table>' +
        '<tr><td>Molecular weight</td><td>' + (isNaN(an.mw) ? '—' : an.mw.toFixed(2)) + '</td></tr>' +
        '<tr><td>Exact mass</td><td>' + (isNaN(an.exact) ? '—' : an.exact.toFixed(4)) + '</td></tr>' +
        (an.charge ? '<tr><td>m/z</td><td>' + an.mz.toFixed(4) + '</td></tr>' : '') +
        '<tr><td>Elemental analysis</td><td>' + an.ea.map(function (e) { return e.el + ' ' + e.pct.toFixed(2) + '%'; }).join(', ') + '</td></tr>';
      if (Chem.oclReady()) {
        try {
          var p = Chem.properties(page, fr.atoms);
          html += '<tr><td>cLogP</td><td>' + p.logP.toFixed(2) + '</td></tr><tr><td>cLogS</td><td>' + p.logS.toFixed(2) + '</td></tr>' +
            '<tr><td>TPSA</td><td>' + p.psa.toFixed(1) + ' Å²</td></tr><tr><td>H-bond donors / acceptors</td><td>' + p.donors + ' / ' + p.acceptors + '</td></tr>' +
            '<tr><td>Rotatable bonds</td><td>' + p.rotatable + '</td></tr><tr><td>Stereocentres</td><td>' + p.stereocenters + '</td></tr>';
          html += '<tr><td>SMILES</td><td class="smi">' + CS.esc(Chem.smilesOf(page, fr.atoms)) + '</td></tr>';
        } catch (e) { }
      }
      if (an.unknown.length) html += '<tr><td colspan="2" class="warn">Unknown label(s) not counted: ' + CS.esc(an.unknown.join(', ')) + '</td></tr>';
      html += '</table><button class="small" data-ins="' + i + '">Insert formula & MW as text</button></div>';
    });
    if (frs.length > 6) html += '<div class="panel-hint">…and ' + (frs.length - 6) + ' more fragments.</div>';
    el.innerHTML = html;
    $$('[data-ins]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        var fr = frs[+b.getAttribute('data-ins')], an = Chem.analysis(page, fr.atoms);
        var bb = D.keysBBox(page, new Set(fr.atoms.map(function (x) { return 'a:' + x; })));
        var txt = an.formulaMarkup + '\nMW: ' + an.mw.toFixed(2);
        var lay = CS.Text.layout(txt, { size: 9, chem: false, align: 'center' });
        page.objects.push({ id: CS.uid(), type: 'text', x: bb.x + bb.w / 2 - lay.w / 2, y: bb.y + bb.h + 8, text: txt, size: 9, chem: false, align: 'center' });
        CS.commit();
      });
    });
  }

  // ------------------------------------------------------------ properties panel
  var COLORS = ['#000000', '#555555', '#999999', '#d42020', '#e07b00', '#c9a400', '#2a9d2a', '#1f7a8c', '#2747d6', '#7a2a9a', '#ffffff'];
  function colorRow(key, val, allowNone) {
    var s = '<div class="swatches" data-key="' + key + '">';
    if (allowNone) s += '<button class="sw none' + (!val || val === 'none' ? ' on' : '') + '" data-v="none" title="None">∅</button>';
    COLORS.forEach(function (c) { s += '<button class="sw' + (val === c ? ' on' : '') + '" data-v="' + c + '" style="background:' + c + '"></button>'; });
    var hex = val && val !== 'none' ? String(val) : '#000000';
    if (/^#[0-9a-f]{3}$/i.test(hex)) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    s += '<input type="color" value="' + hex + '" data-key="' + key + '" title="Custom colour"></div>';
    return s;
  }
  function field(label, inner) { return '<label class="field">' + label + inner + '</label>'; }
  function num(key, val, step, min) { return '<input type="number" data-key="' + key + '" value="' + (val == null ? '' : CS.n(val)) + '" step="' + (step || 0.5) + '"' + (min != null ? ' min="' + min + '"' : '') + '>'; }
  function sel(key, val, opts) {
    return '<select data-key="' + key + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(val) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
  }
  function chk(key, val, label) { return '<label class="check"><input type="checkbox" data-key="' + key + '"' + (val ? ' checked' : '') + '> ' + label + '</label>'; }

  function updateProps() {
    if (state.panel !== 'props') return;
    var el = $('#panel-props'), page = CS.page(), keys = Array.from(state.sel);
    var objs = D.selObjects(page, keys);
    var atoms = keys.filter(function (k) { return k[0] === 'a'; }).map(function (k) { return D.item(page, k); }).filter(Boolean);
    var bonds = keys.filter(function (k) { return k[0] === 'b'; }).map(function (k) { return D.item(page, k); }).filter(Boolean);
    var html = '';
    if (!keys.length) {
      html = '<div class="panel-hint"><b>Nothing selected.</b><br>Pick a tool on the left and click on the page. Use the <b>Select</b> tool to choose things and edit their properties here.<br><br>' +
        '<b>Quick start</b><ul><li>Bond tool: click to add bonds, drag to draw in a direction; click a bond to make it double/triple.</li><li>Hover an atom and type <kbd>O</kbd>, <kbd>N</kbd>, <kbd>L</kbd> (Cl)… to change it.</li><li>Double-click an atom to type a label like OMe or CO2Et.</li><li><b>Flowchart → Flowchart wizard</b> builds a lab procedure figure in seconds.</li><li><b>File → Export PDF</b> for a vector PDF.</li></ul></div>';
      el.innerHTML = html;
      return;
    }
    html += '<div class="props-sum">' + describeSel(atoms.length, bonds.length, objs) + '</div>';
    if (bonds.length) {
      var b0 = bonds[0];
      html += '<h4>Bond</h4>' + field('Type', sel('bond.type', (b0.order || 1) + ':' + (b0.style || 'plain'), [
        ['1:plain', 'Single'], ['2:plain', 'Double'], ['3:plain', 'Triple'], ['1:wedge', 'Wedge'], ['1:hash', 'Hashed wedge'], ['1:hollow', 'Hollow wedge'],
        ['1:wavy', 'Wavy'], ['1:bold', 'Bold'], ['1:dashed', 'Dashed'], ['2:dashed', 'Double (one dashed)'], ['2:bold', 'Double (bold)']])) +
        field('Double bond position', sel('bond.dbPos', b0.dbPos || 'auto', [['auto', 'Automatic'], ['center', 'Centred'], ['left', 'Left'], ['right', 'Right']])) +
        '<div class="row"><button class="small" data-do="swapBond">Flip direction</button></div>' +
        field('Colour', colorRow('bond.color', b0.color || '#000000'));
    }
    if (atoms.length) {
      var a0 = atoms[0];
      html += '<h4>Atom</h4>' + field('Element / label', '<input data-key="atom.label" value="' + CS.esc(a0.label || a0.el) + '">') +
        '<div class="grid2">' + field('Charge', num('atom.charge', a0.charge || 0, 1)) + field('Lone pairs', num('atom.lonePairs', a0.lonePairs || 0, 1, 0)) + '</div>' +
        chk('atom.radical', a0.radical, 'Radical') + chk('atom.chargeCircle', a0.chargeCircle, 'Circled charge') + chk('atom.showC', a0.showC, 'Show carbon label') +
        field('Colour', colorRow('atom.color', a0.color || '#000000'));
    }
    if (objs.length === 1) html += objProps(objs[0]);
    else if (objs.length > 1) {
      html += '<h4>Objects</h4>' + field('Line colour', colorRow('obj.stroke', '')) + field('Line width (pt)', num('obj.width', '', 0.25, 0));
    }
    html += '<h4>Arrange</h4><div class="row wrap">' +
      '<button class="small" data-act="flip:h">Flip ↔</button><button class="small" data-act="flip:v">Flip ↕</button>' +
      '<button class="small" data-act="rotate:-90">⟲ 90°</button><button class="small" data-act="rotate:90">⟳ 90°</button>' +
      '<button class="small" data-act="order:front">Front</button><button class="small" data-act="order:back">Back</button>' +
      '<button class="small" data-act="group">Group</button><button class="small" data-act="ungroup">Ungroup</button>' +
      '<button class="small" data-act="duplicate">Duplicate</button><button class="small danger" data-act="del">Delete</button></div>';
    if (keys.length > 1) {
      html += '<div class="row wrap"><button class="small" data-act="align:left">⇤ Left</button><button class="small" data-act="align:hcenter">Centre</button><button class="small" data-act="align:right">Right ⇥</button>' +
        '<button class="small" data-act="align:top">Top</button><button class="small" data-act="align:vcenter">Middle</button><button class="small" data-act="align:bottom">Bottom</button>' +
        '<button class="small" data-act="align:hdist">Distribute ↔</button><button class="small" data-act="align:vdist">Distribute ↕</button></div>';
    }
    el.innerHTML = html;
  }
  function describeSel(na, nb, objs) {
    var parts = [];
    if (na) parts.push(na + ' atom' + (na > 1 ? 's' : ''));
    if (nb) parts.push(nb + ' bond' + (nb > 1 ? 's' : ''));
    var counts = {};
    objs.forEach(function (o) { var n = o.type === 'apparatus' ? CS.Apparatus.kinds[o.kind].name : o.type; counts[n] = (counts[n] || 0) + 1; });
    Object.keys(counts).forEach(function (k) { parts.push(counts[k] + ' ' + k); });
    return parts.join(', ');
  }
  function objProps(o) {
    var h = '';
    var FONTS = [['ChemSans', 'Sans (Arial-like)'], ['ChemSerif', 'Serif (Times-like)']];
    if (o.type === 'text') {
      h += '<h4>Text</h4>' + field('Text', '<textarea data-key="obj.text" rows="3">' + CS.esc(o.text || '') + '</textarea>') +
        '<div class="hint">H_2O → subscript, Na^+ → superscript, CaCl2 auto-formats.</div>' +
        '<div class="grid2">' + field('Font', sel('obj.font', o.font || 'ChemSans', FONTS)) + field('Size (pt)', num('obj.size', o.size || 10, 0.5, 1)) + '</div>' +
        '<div class="row">' + chk('obj.bold', o.bold, '<b>Bold</b>') + chk('obj.italic', o.italic, '<i>Italic</i>') + chk('obj.chem', o.chem !== false, 'Auto formulas') + '</div>' +
        '<div class="grid2">' + field('Align', sel('obj.align', o.align || 'left', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']])) + field('Wrap width', num('obj.wrap', o.wrap || '', 5, 0)) + '</div>' +
        field('Colour', colorRow('obj.color', o.color || '#000000')) + field('Background', colorRow('obj.fill', o.fill || 'none', true));
    } else if (o.type === 'arrow') {
      h += '<h4>Arrow</h4>' + field('Kind', sel('obj.kind', o.kind || 'forward', [['forward', 'Forward'], ['both', 'Resonance (both ends)'], ['equilibrium', 'Equilibrium'], ['retro', 'Retrosynthetic'], ['half', 'Half head (fishhook)'], ['noreaction', 'No reaction'], ['line', 'No head']])) +
        '<div class="grid2">' + field('Line width', num('obj.width', o.width || 0.75, 0.25, 0.1)) + field('Curvature', num('obj.bend', o.bend || 0, 2)) + '</div>' +
        chk('obj.dash', o.dash, 'Dashed') + (o.kind === 'half' ? chk('obj.flipHead', o.flipHead, 'Barb on other side') : '') + (o.kind === 'equilibrium' ? chk('obj.unequal', o.unequal, 'Unequal (favoured right)') : '') +
        field('Colour', colorRow('obj.color', o.color || '#000000'));
    } else if (o.type === 'line') {
      h += '<h4>Line</h4>' + field('Line width', num('obj.width', o.width || 0.75, 0.25, 0.1)) + chk('obj.dash', o.dash, 'Dashed') + field('Colour', colorRow('obj.stroke', o.stroke || '#000000'));
    } else if (o.type === 'rect' || o.type === 'ellipse' || o.type === 'orbital') {
      h += '<h4>Shape</h4><div class="grid2">' + field('Line width', num('obj.width', o.width == null ? 0.75 : o.width, 0.25, 0)) + (o.type === 'rect' ? field('Corner radius', num('obj.radius', o.radius || 0, 1, 0)) : '') + '</div>' +
        chk('obj.dash', o.dash, 'Dashed') + chk('obj.carry', o.carry, 'Moves things inside it (frame)') +
        field('Line colour', colorRow('obj.stroke', o.stroke || '#000000')) + field('Fill', colorRow('obj.fill', o.fill || 'none', true)) + geom(o);
    } else if (o.type === 'bracket') {
      h += '<h4>Brackets</h4>' + field('Style', sel('obj.kind', o.kind || 'square', [['square', '[ ]'], ['round', '( )'], ['curly', '{ }']])) +
        '<div class="grid2">' + field('Subscript (n, etc.)', '<input data-key="obj.label" value="' + CS.esc(o.label || '') + '">') + field('Superscript (charge, ‡)', '<input data-key="obj.supLabel" value="' + CS.esc(o.supLabel || '') + '">') + '</div>' +
        field('Line width', num('obj.width', o.width || 0.75, 0.25, 0.1)) + field('Colour', colorRow('obj.stroke', o.stroke || '#000000'));
    } else if (o.type === 'apparatus') {
      var def = CS.Apparatus.kinds[o.kind], opts = Object.assign({}, def.defaults || {}, o.opts || {});
      h += '<h4>' + CS.esc(def.name) + '</h4>';
      (def.params || []).forEach(function (p) {
        var lab = CS.Apparatus.PARAM_LABELS[p] || p;
        if (p === 'level' || p === 'level2' || p === 'clamp') h += field(lab, '<input type="range" min="0" max="1" step="0.02" data-key="opt.' + p + '" value="' + (opts[p] == null ? 0 : opts[p]) + '">');
        else if (p === 'color') h += field(lab, colorRow('opt.color', opts.color || '#dcdcdc'));
        else h += chk('opt.' + p, opts[p], lab);
      });
      h += '<div class="grid2">' + field('Line width', num('obj.lineWidth', o.lineWidth || 0.75, 0.25, 0.1)) + field('Rotation (°)', num('obj.rot', o.rot || 0, 5)) + '</div>' +
        chk('obj.flip', o.flip, 'Mirror') + field('Line colour', colorRow('obj.stroke', o.stroke || '#000000')) + geom(o, true);
    } else if (o.type === 'step') {
      h += '<h4>Step box</h4>' + field('Number', '<input data-key="obj.num" value="' + CS.esc(o.num || '') + '">') + field('Caption', '<textarea data-key="obj.caption" rows="4">' + CS.esc(o.caption || '') + '</textarea>') +
        '<div class="grid2">' + field('Font', sel('obj.font', o.font || 'ChemSerif', FONTS)) + field('Size (pt)', num('obj.size', o.size || 9.5, 0.5, 1)) + field('Line width', num('obj.width', o.width == null ? 0.75 : o.width, 0.25, 0)) + field('Corner radius', num('obj.radius', o.radius || 0, 1, 0)) + '</div>' +
        field('Line colour', colorRow('obj.stroke', o.stroke || '#000000')) + field('Fill', colorRow('obj.fill', o.fill || '#ffffff', true)) + geom(o) +
        '<div class="row wrap"><button class="small" data-act="flowAddStep">Add next step</button><button class="small" data-act="flowRelayout">Re-arrange steps</button></div>';
    } else if (o.type === 'callout') {
      h += '<h4>Label</h4>' + field('Text', '<textarea data-key="obj.text" rows="2">' + CS.esc(o.text || '') + '</textarea>') +
        '<div class="grid2">' + field('Font', sel('obj.font', o.font || 'ChemSans', FONTS)) + field('Size (pt)', num('obj.size', o.size || 7, 0.5, 1)) + field('Line width', num('obj.width', o.width || 0.5, 0.25, 0.1)) + '</div>' +
        chk('obj.dot', o.dot, 'Dot at the end') + field('Colour', colorRow('obj.color', o.color || '#000000'));
    } else if (o.type === 'connector') {
      h += '<h4>Connector</h4>' + field('Route', sel('obj.route', o.route || 'auto', [['auto', 'Automatic (elbow)'], ['horizontal', 'Horizontal first'], ['vertical', 'Vertical first'], ['straight', 'Straight']])) +
        '<div class="grid2">' + field('Line width', num('obj.width', o.width || 0.75, 0.25, 0.1)) + field('Head', sel('obj.head', o.head || 'full', [['full', 'Arrow'], ['none', 'None']])) + '</div>' +
        chk('obj.dash', o.dash, 'Dashed') + field('Colour', colorRow('obj.color', o.color || '#000000'));
    } else if (o.type === 'image') {
      h += '<h4>Image</h4>' + geom(o, true);
    }
    return h;
  }
  function geom(o, lock) {
    return '<div class="grid2">' + field('X', num('obj.x', o.x, 1)) + field('Y', num('obj.y', o.y, 1)) + field('Width', num(lock ? 'obj.wl' : 'obj.w', o.w, 1, 1)) + field('Height', num(lock ? 'obj.hl' : 'obj.h', o.h, 1, 1)) + '</div>';
  }

  function applyProp(key, value) {
    var page = CS.page(), keys = Array.from(state.sel);
    var p = key.split('.'), scope = p[0], k = p[1];
    if (scope === 'bond') {
      keys.filter(function (x) { return x[0] === 'b'; }).forEach(function (x) {
        var b = D.item(page, x);
        if (!b) return;
        if (k === 'type') { var t = value.split(':'); b.order = +t[0]; if (t[1] === 'plain') delete b.style; else b.style = t[1]; }
        else if (k === 'dbPos') { if (value === 'auto') delete b.dbPos; else b.dbPos = value; }
        else if (k === 'color') b.color = value;
      });
    } else if (scope === 'atom') {
      keys.filter(function (x) { return x[0] === 'a'; }).forEach(function (x) {
        var a = D.item(page, x);
        if (!a) return;
        if (k === 'label') {
          var v = String(value).trim();
          if (Chem.isElement(v)) { a.el = v; delete a.label; } else if (v) a.label = v;
        } else if (k === 'charge' || k === 'lonePairs') { var n = parseInt(value, 10) || 0; if (n) a[k] = n; else delete a[k]; }
        else if (typeof value === 'boolean') { if (value) a[k] = k === 'radical' ? 1 : true; else delete a[k]; }
        else a[k] = value;
      });
    } else if (scope === 'obj' || scope === 'opt') {
      D.selObjects(page, keys).forEach(function (o) {
        if (scope === 'opt') { o.opts = o.opts || {}; o.opts[k] = value; return; }
        if (k === 'wl' || k === 'hl') {
          var v2 = +value;
          if (!(v2 > 0)) return;
          var r = o.w / o.h;
          if (k === 'wl') { o.w = v2; o.h = v2 / r; } else { o.h = v2; o.w = v2 * r; }
          return;
        }
        if (k === 'kind' && o.type === 'arrow' && value === 'line') { o.kind = 'line'; return; }
        if (value === 'none' && (k === 'fill')) { delete o[k]; return; }
        if (typeof value === 'string' && value !== '' && /^(x|y|w|h|size|width|bend|rot|radius|wrap|lineWidth)$/.test(k)) value = +value;
        if (k === 'wrap' && !value) { delete o.wrap; return; }
        o[k] = value;
      });
    }
    CS.Editor.render();
    commitSoon();
  }
  var commitSoon = CS.debounce(function () { CS.commit(); }, 350);

  function bindProps() {
    var el = $('#panel-props');
    function handler(e) {
      var t = e.target, key = t.getAttribute('data-key');
      if (!key) return;
      var v = t.type === 'checkbox' ? t.checked : t.value;
      if (t.type === 'range') v = +v;
      applyProp(key, v);
    }
    el.addEventListener('input', function (e) { if (e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') handler(e); });
    el.addEventListener('change', function (e) { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') { handler(e); updateProps(); } });
    el.addEventListener('click', function (e) {
      var sw = e.target.closest('.sw');
      if (sw) { applyProp(sw.parentNode.getAttribute('data-key'), sw.getAttribute('data-v')); updateProps(); return; }
      var a = e.target.closest('[data-act]');
      if (a) { runAction(a.getAttribute('data-act')); return; }
      var d = e.target.closest('[data-do]');
      if (d && d.getAttribute('data-do') === 'swapBond') {
        state.sel.forEach(function (k) { if (k[0] === 'b') { var b = D.item(CS.page(), k); var t = b.a; b.a = b.b; b.b = t; } });
        CS.commit();
      }
    });
  }

  // ------------------------------------------------------------ page tabs & status
  function updateTabs() {
    var el = $('#pages'), html = '';
    state.doc.pages.forEach(function (p, i) {
      html += '<button class="ptab' + (i === state.pageIdx ? ' active' : '') + '" data-p="' + i + '">Page ' + (i + 1) + '</button>';
    });
    html += '<button class="ptab add" data-p="add" title="Add page">+</button>';
    el.innerHTML = html;
  }
  function bindTabs() {
    $('#pages').addEventListener('click', function (e) {
      var b = e.target.closest('.ptab');
      if (!b) return;
      var p = b.getAttribute('data-p');
      if (p === 'add') return A.addPage();
      CS.Editor.closeEditor();
      state.pageIdx = +p;
      state.sel.clear();
      updateTabs();
      CS.Editor.render();
      CS.emit('selection');
    });
  }

  // ------------------------------------------------------------ files
  function bindFiles() {
    $('#file-open').addEventListener('change', function (e) {
      var f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var text = String(r.result);
        try {
          if (/\.(mol|sdf|mdl)$/i.test(f.name) || /M {2}END/.test(text)) { importText(text); return; }
          if (/\.(smi|smiles|txt)$/i.test(f.name)) { importText(text.split(/\s/)[0]); return; }
          D.load(JSON.parse(text));
          CS.Editor.fitPage();
          toast('Opened ' + f.name);
        } catch (err) { toast('Could not open file: ' + err.message, true); }
      };
      r.readAsText(f);
    });
    $('#file-image').addEventListener('change', function (e) {
      var f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var c = CS.Editor.viewCenter(), w = Math.min(img.width * 0.75, 300), h = w * img.height / img.width;
          var o = { id: CS.uid(), type: 'image', href: r.result, x: c.x - w / 2, y: c.y - h / 2, w: w, h: h };
          CS.page().objects.push(o);
          state.sel = new Set(['o:' + o.id]);
          setTool('select');
          CS.commit();
        };
        img.src = r.result;
      };
      r.readAsDataURL(f);
    });
    document.addEventListener('paste', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var text = e.clipboardData && e.clipboardData.getData('text/plain');
      e.preventDefault();
      A.paste(text);
    });
    // drag & drop files onto the canvas
    var wrap = $('#canvas-wrap');
    wrap.addEventListener('dragover', function (e) { e.preventDefault(); });
    wrap.addEventListener('drop', function (e) {
      e.preventDefault();
      var f = e.dataTransfer.files[0];
      if (!f) return;
      if (/^image\//.test(f.type)) { var dt = new DataTransfer(); dt.items.add(f); $('#file-image').files = dt.files; $('#file-image').dispatchEvent(new Event('change')); }
      else { var dt2 = new DataTransfer(); dt2.items.add(f); $('#file-open').files = dt2.files; $('#file-open').dispatchEvent(new Event('change')); }
    });
  }

  var SHORTCUTS_HTML = '<div class="shortcuts"><div><h4>Tools</h4><p><kbd>V</kbd> select · <kbd>E</kbd> eraser · <kbd>T</kbd> text · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> bonds · <kbd>W</kbd> wedge · <kbd>H</kbd> hash · <kbd>C</kbd> chain · <kbd>R</kbd> ring · <kbd>B</kbd> benzene · <kbd>A</kbd> arrow · <kbd>L</kbd> line · <kbd>F</kbd> fit page · <kbd>Esc</kbd> select tool</p>' +
    '<h4>Hover an atom and press</h4><p><kbd>C</kbd><kbd>N</kbd><kbd>O</kbd><kbd>S</kbd><kbd>P</kbd><kbd>F</kbd><kbd>H</kbd><kbd>I</kbd> element · <kbd>L</kbd> Cl · <kbd>B</kbd> Br · <kbd>M</kbd> Me · <kbd>+</kbd>/<kbd>-</kbd> charge · <kbd>.</kbd> radical · <kbd>Enter</kbd> type a label · <kbd>Del</kbd> delete</p>' +
    '<h4>Hover a bond and press</h4><p><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> order · <kbd>W</kbd> wedge · <kbd>H</kbd> hash · <kbd>Y</kbd> wavy · <kbd>B</kbd> bold · <kbd>D</kbd> dashed · <kbd>Del</kbd> delete</p></div>' +
    '<div><h4>Editing</h4><p><kbd>Ctrl+Z</kbd> undo · <kbd>Ctrl+Y</kbd> redo · <kbd>Ctrl+C/X/V</kbd> copy/cut/paste (paste SMILES or MOL text too) · <kbd>Ctrl+D</kbd> duplicate · <kbd>Ctrl+A</kbd> select all · <kbd>Ctrl+G</kbd> group · <kbd>Ctrl+Shift+G</kbd> ungroup · arrows nudge (Shift ×10) · Alt+drag copies · Shift+click adds to selection · double-click edits text/labels · <kbd>Ctrl+K</kbd> clean structure</p>' +
    '<h4>View & files</h4><p><kbd>Ctrl+wheel</kbd> zoom · wheel pans · <kbd>Space</kbd>+drag pan · <kbd>Ctrl+0</kbd> fit · <kbd>Ctrl+S</kbd> save · <kbd>Ctrl+O</kbd> open · <kbd>Ctrl+P</kbd> export PDF</p>' +
    '<h4>Text markup</h4><p><code>H_2O</code> subscript · <code>Na^+</code> superscript · <code>x_{10}</code> / <code>^{2-}</code> groups · formulas like CaCl2, NaHCO3, Na+ are formatted automatically</p></div></div>';
  var ABOUT_HTML = '<p><b>ChemSketch</b> – a free, browser-based chemical drawing editor and lab-procedure flowchart maker.</p>' +
    '<p>Draw structures, reactions and mechanisms; build illustrated lab procedures with the glassware library and the flowchart wizard; export vector PDF, SVG, PNG and MOL.</p>' +
    '<p class="hint">Uses OpenChemLib (BSD-3) for SMILES/MOL, 2D layout and properties, jsPDF + svg2pdf.js (MIT) for PDF export, and Liberation fonts (SIL OFL 1.1). Name ↔ structure lookups use PubChem.</p>';

  function init() {
    buildMenus();
    buildToolbar();
    bindProps();
    bindTabs();
    bindFiles();
    $$('#side .tab').forEach(function (t) { t.addEventListener('click', function () { showPanel(t.getAttribute('data-panel')); }); });
    $('#zoom-in').addEventListener('click', function () { CS.Editor.setZoom(state.zoom * 1.25); });
    $('#zoom-out').addEventListener('click', function () { CS.Editor.setZoom(state.zoom / 1.25); });
    $('#zoom-fit').addEventListener('click', function () { CS.Editor.fitPage(); });
    $$('[data-quick]').forEach(function (b) { b.addEventListener('click', function () { runAction(b.getAttribute('data-quick')); }); });
    CS.on('change', function () { updateTabs(); CS.Editor.render(); updateProps(); updateAnalysis(); $('#doc-title').textContent = state.doc.title || 'Untitled'; });
    CS.on('selection', function () { updateProps(); updateAnalysis(); });
    CS.on('zoom', function () { $('#zoom-val').textContent = Math.round(state.zoom * 100) + '%'; });
    CS.on('pointer', function (p) { $('#status-pos').textContent = Math.round(p.x) + ', ' + Math.round(p.y) + ' pt'; });
    CS.on('status', status);
    updateTabs();
    setTool('select');
    showPanel('props');
  }

  CS.UI = {
    init: init, setTool: setTool, toolKey: toolKey, dialog: dialog, prompt: prompt, toast: toast, showPanel: showPanel,
    runAction: runAction, importText: importText, updateProps: updateProps
  };
})(window.CS);
