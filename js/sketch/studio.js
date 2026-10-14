/* Studio: the compact drawing window used when ChemSketch runs inside ChemWord (?embed=1).
   Same layout as the original ChemWord drawing window: a top bar (Done, title, fit note, undo,
   zoom, PNG/SVG), a three-column tool palette, a dotted canvas with the page area as a dashed
   guide, a tip in the corner and a bottom bar with formula chips and actions for the selection.
   Templates, glassware and properties open in a drawer on the right. */
(function (CS) {
  'use strict';
  var state = CS.state, D = CS.Doc;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function svg(inner, vb) {
    return '<svg viewBox="' + (vb || '0 0 20 20') + '" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  function letter(t) {
    return '<svg viewBox="0 0 20 20" width="20" height="20"><text x="10" y="15" font-size="' + (t.length > 1 ? 12 : 14) + '" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="currentColor">' + t + '</text></svg>';
  }
  var I = CS.UI.ICON;
  var OWN = {
    label: letter('A'),
    glass: svg('<path d="M8 3v5.5a5 5 0 104 0V3M7 3h6"/><path d="M5.6 13h8.8" stroke-width="1"/>'),
    wizard: svg('<rect x="2" y="2.5" width="6.5" height="5"/><rect x="11.5" y="2.5" width="6.5" height="5"/><rect x="6.75" y="12.5" width="6.5" height="5"/><path d="M8.5 5h3M14.75 7.5v2.5H10v2.5"/>'),
    templates: svg('<path d="M10 2.8 16.2 6.4v7.2L10 17.2 3.8 13.6V6.4Z"/><path d="M7.2 8.5v3M12.8 8.5v3" stroke-width="1.2"/>'),
    props: svg('<path d="M4 5h12M4 10h12M4 15h12"/><circle cx="7" cy="5" r="1.6" fill="currentColor"/><circle cx="13" cy="10" r="1.6" fill="currentColor"/><circle cx="9" cy="15" r="1.6" fill="currentColor"/>'),
    analysis: svg('<path d="M3 16h14M5 13V9M9 13V5M13 13V8"/>')
  };
  function icon(k) { return OWN[k] || I[k] || ''; }

  // [tool id, icon, tooltip] ; 0 = separator
  var TOOLS = [
    ['select', 'select', 'Select and move (V). Click a bond to take the whole molecule; drag on empty space to box-select.'],
    ['pan', 'pan', 'Pan (hold Space)'], ['eraser', 'eraser', 'Eraser (E)'], ['label', 'label', 'Atom label: click an atom and type N, OH, OMe, CO2Et…'], 0,
    ['el:C', 'C'], ['el:H', 'H'], ['el:N', 'N'], ['el:O', 'O'], ['el:S', 'S'], ['el:P', 'P'], ['el:F', 'F'], ['el:Cl', 'Cl'], ['el:Br', 'Br'], ['el:I', 'I'], ['el:B', 'B'], ['el:Si', 'Si'], 0,
    ['bond:1:plain', 'single', 'Single bond (1)'], ['bond:2:plain', 'double', 'Double bond (2)'], ['bond:3:plain', 'triple', 'Triple bond (3)'],
    ['chain', 'chain', 'Chain'], ['bond:1:wedge', 'wedge', 'Wedge bond (W)'], ['bond:1:hash', 'hash', 'Hashed wedge bond (H)'],
    ['bond:1:wavy', 'wavy', 'Wavy bond'], ['bond:1:bold', 'bold', 'Bold bond'], ['bond:1:dashed', 'dashed', 'Dashed / partial bond'], ['text', 'text', 'Text (T)'], 0,
    ['ring:3', 'ring3', 'Cyclopropane'], ['ring:4', 'ring4', 'Cyclobutane'], ['ring:5', 'ring5', 'Cyclopentane'], ['ring:6', 'ring6', 'Cyclohexane'],
    ['ring:6:ar', 'benzene', 'Benzene (B)'], ['ring:7', 'ring7', 'Cycloheptane'], ['ring:8', 'ring8', 'Cyclooctane'], ['ring:chair', 'chair', 'Cyclohexane chair'],
    ['drawer:templates', 'templates', 'Templates: rings, amino acids, sugars, reagents… (or SMILES / name)'], 0,
    ['charge:+', 'plus', 'Positive charge (+)'], ['charge:-', 'minus', 'Negative charge (−)'], ['lonepair', 'lonepair', 'Lone pair'], ['radical', 'radical', 'Radical electron'], 0,
    ['arrow:forward', 'a-forward', 'Reaction arrow'], ['arrow:equilibrium', 'a-equilibrium', 'Equilibrium arrows'], ['arrow:both', 'a-both', 'Resonance arrow'],
    ['arrow:retro', 'a-retro', 'Retrosynthesis arrow'], ['arrow:curved', 'a-curved', 'Curved arrow, 2 electrons'], ['arrow:fishhook', 'a-fishhook', 'Fishhook arrow, 1 electron'],
    ['shape:bracket-square', 's-bracket-square', 'Brackets [ ]'], ['shape:bracket-round', 's-bracket-round', 'Parentheses ( )'], ['arrow:line', 'a-line', 'Line'], 0,
    ['drawer:lab', 'glass', 'Lab glassware and ready-made setups'], ['wizard', 'wizard', 'Flowchart wizard: numbered steps with glassware drawings'],
    ['shape:step', 'step', 'Step box'], ['callout', 'callout', 'Label with a line: drag from the item to where the text goes'], ['connector', 'connector', 'Arrow between two boxes'],
    ['shape:rect', 's-rect', 'Rectangle'], 0,
    ['drawer:props', 'props', 'Properties of the selection'], ['drawer:analysis', 'analysis', 'Formula, mass and properties']
  ];
  var TIPS = {
    select: 'Click to select, drag to move, drag on empty space to box-select. Double-click an atom to relabel it; double-click a bond to select the molecule.',
    pan: 'Drag to move around. Ctrl + scroll or pinch to zoom.',
    eraser: 'Click an atom, bond, arrow or text to delete it. Drag to erase several.',
    label: 'Click an atom, then type a label (N, OH, OMe, CO2Et…). Click empty space for a new label.',
    chain: 'Drag to draw a zigzag chain. Start on an atom to grow from it.',
    text: 'Click to type text. Click existing text to edit it. CaCl2 → CaCl₂ automatically.',
    'charge:+': 'Click an atom to add +. Click again for 2+.', 'charge:-': 'Click an atom to add −.',
    lonepair: 'Click an atom to add a lone pair. A fourth click clears them.', radical: 'Click an atom to add a radical electron; again for two.',
    'arrow:curved': 'Drag from the electron source to where the electrons go. Select it and drag the round handle to reshape.',
    'arrow:fishhook': 'Drag from the electron source to where the electron goes.',
    'shape:bracket-square': 'Drag a box around a structure to bracket it.', 'shape:bracket-round': 'Drag a box around a structure.',
    'shape:step': 'Drag to draw a numbered step box. Things drawn inside it move with it.',
    callout: 'Drag from the item to where its label should go, then type.', connector: 'Drag from one box to another to connect them with an arrow.'
  };
  TOOLS.forEach(function (t) {
    if (!t) return;
    if (/^el:/.test(t[0])) TIPS[t[0]] = 'Click an atom to make it ' + t[1] + ', or click empty space to place ' + t[1] + '. Hydrogens are added automatically.';
    if (/^bond:/.test(t[0])) TIPS[t[0]] = 'Click empty space or an atom to add a bond; drag to aim it. Click a bond to change it. Hover an atom and press N, O, L (Cl), B (Br)… to relabel.';
    if (/^ring:/.test(t[0])) TIPS[t[0]] = 'Click empty space, an atom (spiro) or a bond (fused) to add the ring.';
    if (/^arrow:(forward|equilibrium|both|retro|line)$/.test(t[0])) TIPS[t[0]] = 'Drag to draw the arrow. A click gives a standard length.';
  });

  var els = {};

  function build(title) {
    document.body.classList.add('embed', 'studio');
    CS.UI.TIPS = TIPS;
    // top bar
    var top = document.createElement('div');
    top.className = 'st-top';
    top.innerHTML =
      '<button class="b pri" data-st="done" title="Put the drawing into the document (Ctrl+Enter)">Done</button>' +
      '<span class="st-ttl" id="stTitle"></span><span class="st-note" id="stNote"></span><span class="sp"></span>' +
      '<button class="b" data-st="undo" title="Undo (Ctrl+Z)" aria-label="Undo">' + svg('<path d="M6.5 5 3 8.5 6.5 12M3 8.5h8a4.5 4.5 0 010 9H9"/>') + '</button>' +
      '<button class="b" data-st="redo" title="Redo (Ctrl+Y)" aria-label="Redo">' + svg('<path d="M13.5 5 17 8.5 13.5 12M17 8.5H9a4.5 4.5 0 000 9h2"/>') + '</button>' +
      '<button class="b" data-st="zout" aria-label="Zoom out">−</button><button class="b" data-st="fit">Fit</button><button class="b" data-st="zin" aria-label="Zoom in">+</button>' +
      '<button class="b" data-st="png" title="Download this drawing as PNG">PNG</button><button class="b" data-st="svg" title="Download this drawing as SVG">SVG</button>' +
      '<button class="b" data-st="cancel" title="Close without changes">Cancel</button>';
    document.body.insertBefore(top, document.body.firstChild);
    els.top = top;
    // palette
    var pal = $('#palette');
    pal.innerHTML = TOOLS.map(function (t) {
      if (!t) return '<span class="ps"></span>';
      var lbl = t[2] || (TIPS[t[0]] ? t[1] : t[1]);
      var ic = /^el:/.test(t[0]) ? letter(t[1]) : icon(t[1]);
      return '<button class="tool" data-tool="' + t[0] + '" title="' + CS.esc(t[2] || (/^el:/.test(t[0]) ? t[1] : lbl)) + '" aria-label="' + CS.esc(t[2] || t[1]) + '">' + ic + '</button>';
    }).join('');
    // tip in the corner of the canvas
    var tip = document.createElement('div');
    tip.className = 'st-tip';
    $('#canvas-wrap').appendChild(tip);
    els.tip = tip;
    // bottom bar
    var bar = document.createElement('div');
    bar.className = 'st-status';
    bar.innerHTML = '<div class="st-chips"></div><span class="sp"></span><div class="st-acts"></div>';
    $('#center').appendChild(bar);
    els.bar = bar;
    // drawer close button
    var side = $('#side');
    var x = document.createElement('button');
    x.className = 'st-close';
    x.title = 'Close';
    x.textContent = '×';
    side.insertBefore(x, side.firstChild);
    x.addEventListener('click', closeDrawer);

    top.addEventListener('click', onTop);
    bar.addEventListener('click', onBar);
    bar.addEventListener('input', onBarInput);
    bar.addEventListener('change', onBarInput);
    CS.on('change', update);
    CS.on('selection', update);
    CS.on('tip', function (m) { tip.textContent = m; tip.hidden = !m; });
    CS.on('drawer', function () { document.body.classList.add('drawer-open'); });
    CS.on('tool', function (id) { if (/^(template|apparatus)$/.test(state.tool)) closeDrawer(); });
    setTitle(title || 'Structure');
  }

  function closeDrawer() { document.body.classList.remove('drawer-open'); }
  function setTitle(t) { $('#stTitle').textContent = t; }

  function onTop(e) {
    var b = e.target.closest('[data-st]');
    if (!b) return;
    var a = b.getAttribute('data-st');
    if (a === 'done') CS.Studio.done();
    else if (a === 'cancel') CS.Studio.cancel();
    else if (a === 'undo') CS.Actions.undo();
    else if (a === 'redo') CS.Actions.redo();
    else if (a === 'zin') CS.Editor.setZoom(state.zoom * 1.25);
    else if (a === 'zout') CS.Editor.setZoom(state.zoom / 1.25);
    else if (a === 'fit') CS.Editor.fitPage();
    else if (a === 'png' || a === 'svg') exportDrawing(a);
  }

  function exportDrawing(kind) {
    var page = CS.page();
    if (!page.atoms.length && !page.objects.length) return CS.UI.toast('This drawing is empty');
    var name = CS.safeName(state.doc.title || 'drawing');
    if (kind === 'svg') {
      var r = CS.Export.pageSVG(page, { crop: true, margin: 4, embedFonts: true });
      return CS.download(new Blob([r.svg], { type: 'image/svg+xml' }), name + '.svg');
    }
    CS.Export.exportPNG(page, { crop: true, dpi: 300 }).then(function (b) { CS.download(b, name + '.png'); });
  }

  // fragments of the selection (or of everything) -> formula chips
  function chips() {
    var page = CS.page(), g = CS.Chem.graph(page);
    var ids = state.sel.size ? Array.from(D.selAtoms(page, state.sel)) : page.atoms.map(function (a) { return a.id; });
    var frs = CS.Chem.fragments(g, ids);
    if (!frs.length) return '<span class="hint">Formula and molecular weight show here.</span>';
    var cap = window.innerWidth < 760 ? 2 : 4;
    var html = frs.slice(0, cap).map(function (fr) {
      var an = CS.Chem.analysis(page, fr.atoms);
      var f = an.formulaMarkup.replace(/_\{(\d+)\}/g, '<sub>$1</sub>');
      var q = an.charge ? '<sup>' + (Math.abs(an.charge) > 1 ? Math.abs(an.charge) : '') + (an.charge > 0 ? '+' : '−') + '</sup>' : '';
      var mw = isNaN(an.mw) ? '—' : an.mw.toFixed(2);
      var copy = an.formula + (isNaN(an.mw) ? '' : ' ' + mw);
      return '<button class="chip" data-copy="' + CS.esc(copy) + '" title="MW ' + mw + (isNaN(an.exact) ? '' : ' · exact mass ' + an.exact.toFixed(4)) + ' · click to copy">' + f + q + (an.unknown.length ? '?' : '') + ' · ' + mw + '</button>';
    }).join('');
    if (frs.length > cap) html += '<span class="hint">+' + (frs.length - cap) + '</span>';
    return html;
  }

  function actions() {
    var page = CS.page(), n = state.sel.size;
    if (!n) return '<button class="b" data-a="selectAll">Select all</button><button class="b" data-a="paste">Paste</button>';
    var objs = D.selObjects(page, Array.from(state.sel));
    var h = '';
    var one = objs.length === 1 && n === 1 ? objs[0] : null;
    if (one && one.type === 'apparatus') {
      var def = CS.Apparatus.kinds[one.kind], opts = Object.assign({}, def.defaults || {}, one.opts || {});
      (def.params || []).forEach(function (p) {
        var lab = CS.Apparatus.PARAM_LABELS[p] || p;
        if (p === 'level' || p === 'level2' || p === 'clamp') h += '<label class="st-ctl">' + lab + ' <input type="range" min="0" max="1" step="0.02" data-opt="' + p + '" value="' + (opts[p] || 0) + '"></label>';
        else if (p !== 'color') h += '<label class="st-ctl"><input type="checkbox" data-opt="' + p + '"' + (opts[p] ? ' checked' : '') + '> ' + lab + '</label>';
      });
    }
    if (objs.some(function (o) { return o.type === 'arrow' && CS.R.arrowGeom(o).curved; })) h += '<button class="b" data-a="bend">Bend other way</button>';
    if (objs.some(function (o) { return /^(text|callout|step)$/.test(o.type); })) h += '<button class="b" data-a="smaller" aria-label="Smaller text">A−</button><button class="b" data-a="larger" aria-label="Larger text">A+</button>';
    h += '<button class="b" data-a="duplicate">Duplicate</button><button class="b" data-a="copy">Copy</button>' +
      '<button class="b" data-a="flipH" title="Mirror left–right (gives the enantiomer)">Flip ↔</button><button class="b" data-a="flipV" title="Mirror top–bottom">Flip ↕</button>' +
      '<button class="b" data-a="rotL" title="Rotate 15° left" aria-label="Rotate left">⟲</button><button class="b" data-a="rotR" title="Rotate 15° right" aria-label="Rotate right">⟳</button>' +
      '<button class="b" data-a="more" title="All properties">More…</button><button class="b dng" data-a="del">Delete</button>';
    return h;
  }

  function onBar(e) {
    var c = e.target.closest('[data-copy]');
    if (c) {
      var v = c.getAttribute('data-copy');
      try { navigator.clipboard.writeText(v).then(function () { CS.UI.toast('Copied ' + v); }, function () { CS.UI.toast(v); }); } catch (x) { CS.UI.toast(v); }
      return;
    }
    var b = e.target.closest('[data-a]');
    if (!b) return;
    var a = b.getAttribute('data-a'), A = CS.Actions, page = CS.page();
    if (a === 'selectAll') A.selectAll();
    else if (a === 'paste') A.paste();
    else if (a === 'duplicate') A.duplicate();
    else if (a === 'copy') A.copy();
    else if (a === 'flipH') A.flip(true);
    else if (a === 'flipV') A.flip(false);
    else if (a === 'rotL') A.rotate(-15);
    else if (a === 'rotR') A.rotate(15);
    else if (a === 'del') A.del();
    else if (a === 'more') CS.UI.setTool('drawer:props');
    else if (a === 'bend' || a === 'smaller' || a === 'larger') {
      D.selObjects(page, Array.from(state.sel)).forEach(function (o) {
        if (a === 'bend' && o.type === 'arrow') {
          if (o.cx != null) {
            // mirror the control point across the chord
            var p0 = { x: o.x1, y: o.y1 }, p1 = { x: o.x2, y: o.y2 }, d = CS.V.sub(p1, p0), l2 = CS.V.dot(d, d) || 1;
            var t = CS.V.dot(CS.V.sub({ x: o.cx, y: o.cy }, p0), d) / l2, foot = CS.V.add(p0, CS.V.mul(d, t));
            o.cx = 2 * foot.x - o.cx; o.cy = 2 * foot.y - o.cy;
          } else o.bend = -(o.bend || 0);
        }
        if (a !== 'bend' && /^(text|callout|step)$/.test(o.type)) {
          var def = o.type === 'callout' ? 7 : o.type === 'step' ? 9 : 10;
          o.size = Math.max(4, Math.min(48, Math.round((o.size || def) * (a === 'larger' ? 1.15 : 1 / 1.15) * 10) / 10));
        }
      });
      CS.commit();
    }
  }
  var commitSoon = CS.debounce(function () { CS.commit(); }, 300);
  function onBarInput(e) {
    var t = e.target, k = t.getAttribute('data-opt');
    if (!k) return;
    D.selObjects(CS.page(), Array.from(state.sel)).forEach(function (o) {
      if (o.type !== 'apparatus') return;
      o.opts = o.opts || {};
      o.opts[k] = t.type === 'checkbox' ? t.checked : +t.value;
    });
    CS.Editor.render();
    commitSoon();
  }

  function update() {
    if (!els.bar) return;
    // keep sliders alive while they are being dragged
    if (els.bar.contains(document.activeElement) && document.activeElement.type === 'range') return;
    els.bar.querySelector('.st-chips').innerHTML = chips();
    els.bar.querySelector('.st-acts').innerHTML = actions();
    var page = CS.page(), bb = CS.Export.contentBBox(page), note = '';
    if (bb) {
      var s = Math.min(1, page.width / (bb.w + 4), page.height / (bb.h + 4));
      note = s >= 0.995 ? 'Fits the page area at full size' : 'Shrinks to ' + Math.round(s * 100) + '% in the document. Enlarge the area there for full size.';
    }
    $('#stNote').textContent = note;
    var hasSteps = page.objects.some(function (o) { return o.type === 'step'; });
    if (hasSteps) setTitle('Flowchart');
    var u = els.top.querySelector('[data-st="undo"]'), r = els.top.querySelector('[data-st="redo"]');
    u.disabled = CS.History.idx <= 0;
    r.disabled = CS.History.idx >= CS.History.stack.length - 1;
  }

  CS.Studio = { build: build, update: update, setTitle: setTitle, closeDrawer: closeDrawer, done: null, cancel: null };
})(window.CS);
