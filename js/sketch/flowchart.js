/* Flowcharts for lab procedures: automatic grid layout of numbered step boxes with apparatus
   drawings, callout labels and elbow connectors, plus the step-by-step wizard. */
(function (CS) {
  'use strict';
  var A = CS.Apparatus;

  var PAD = 10;
  var DEFAULTS = { cols: 2, margin: 40, gapX: 26, gapY: 30, boxH: 147, font: 'ChemSerif', size: 9, header: true };

  function presetBBoxFull(preset, texts) {
    var objs = A.instantiate(preset, 0, 0, 1, texts);
    return CS.bboxUnion(objs.map(function (o) { return CS.R.objBBox(o); }));
  }

  function captionHeight(text, w, opt) {
    return CS.Text.layout(text || '', { font: opt.font, size: opt.size, width: w }).h;
  }

  // place a preset drawing inside a step box
  function fillBox(page, box, step, opt) {
    if (!step.preset || step.preset === 'none') return;
    var preset = A.preset(step.preset);
    if (!preset) return;
    var pad = PAD, capH = step.caption ? captionHeight(step.caption, box.w - 2 * pad, opt) : 0;
    var area = { x: box.x + pad, y: box.y + 22, w: box.w - 2 * pad, h: box.h - 22 - (capH ? capH + 18 : 10) };
    var texts = step.labels;
    var bb = presetBBoxFull(preset, texts);
    var s = Math.min(1.15, area.w / bb.w, area.h / bb.h);
    var x0 = area.x + (area.w - bb.w * s) / 2 - bb.x * s;
    var y0 = area.y + (area.h - bb.h * s) / 2 - bb.y * s;
    A.instantiate(preset, x0, y0, s, texts).forEach(function (o) {
      if (o.type === 'callout') o.size = 7;
      page.objects.push(o);
    });
  }

  function layoutParams(page, opt) {
    var cols = opt.cols || 2;
    var top = opt.header ? 84 : opt.margin;
    var boxW = (page.width - 2 * opt.margin - (cols - 1) * opt.gapX) / cols;
    return { cols: cols, top: top, boxW: boxW, boxH: opt.boxH, margin: opt.margin, gapX: opt.gapX, gapY: opt.gapY };
  }

  function addHeader(page, spec, opt) {
    var W = page.width, m = opt.margin;
    if (spec.title) page.objects.push({ id: CS.uid(), type: 'text', x: m, y: 38, text: spec.title, size: 14, bold: true, font: opt.font, chem: true });
    if (spec.author) {
      var lay = CS.Text.layout(spec.author, { font: opt.font, size: 10 });
      page.objects.push({ id: CS.uid(), type: 'text', x: W - m - lay.w, y: 41.5, text: spec.author, size: 10, font: opt.font, chem: false });
    }
    page.objects.push({ id: CS.uid(), type: 'line', x1: m, y1: 62, x2: W - m, y2: 62, width: 0.5 });
  }

  // spec: {title, author, cols, font, size, startNum, steps:[{caption, preset, labels}]}
  function build(spec, firstPage) {
    var opt = Object.assign({}, DEFAULTS, spec.options || {});
    if (spec.cols) opt.cols = spec.cols;
    if (spec.font) opt.font = spec.font;
    if (spec.size) opt.size = spec.size;
    opt.header = !!(spec.title || spec.author);
    // inside a ChemWord document the flowchart is a single drawing: no page margins, no page breaks
    var onePage = CS.embed;
    if (onePage) opt.margin = 4;
    var pages = [];
    var page = firstPage || CS.Doc.newPage('A4');
    pages.push(page);
    if (opt.header) addHeader(page, spec, opt);
    var L = layoutParams(page, opt);
    // box height: tall enough for the longest caption plus a drawing area
    var maxCap = 0;
    spec.steps.forEach(function (s) { maxCap = Math.max(maxCap, captionHeight(s.caption, L.boxW - 2 * PAD, opt)); });
    L.boxH = Math.max(opt.boxH, maxCap + 22 + 72 + 18);
    var rowsPerPage = Math.max(1, Math.floor((page.height - L.top - 24 + L.gapY) / (L.boxH + L.gapY)));
    var perPage = onePage ? Infinity : rowsPerPage * L.cols;
    var prevBox = null, num = spec.startNum || 1;
    page.flow = { cols: L.cols, top: L.top, boxW: L.boxW, boxH: L.boxH, margin: L.margin, gapX: L.gapX, gapY: L.gapY, font: opt.font, size: opt.size };
    spec.steps.forEach(function (step, i) {
      var k = i % perPage;
      if (i && k === 0) {
        page = CS.Doc.newPage('A4');
        pages.push(page);
        page.flow = Object.assign({}, pages[0].flow, { top: opt.margin });
        L.top = opt.margin;
        prevBox = null;
      }
      var onPage = Math.min(perPage, spec.steps.length - (i - k));
      var box = boxAt(page, L, k, onPage);
      box.num = (num + i) + '.';
      box.caption = step.caption || '';
      box.font = opt.font;
      box.size = opt.size;
      page.objects.push(box);
      fillBox(page, box, step, opt);
      if (prevBox) page.objects.push({ id: CS.uid(), type: 'connector', from: prevBox.id, to: box.id, route: 'auto', width: 0.75 });
      prevBox = box;
    });
    if (onePage) {
      var rows = Math.ceil(spec.steps.length / L.cols);
      page.height = Math.ceil(L.top + rows * L.boxH + (rows - 1) * L.gapY + opt.margin);
    }
    return pages;
  }

  // box k (0-based) of a page with `count` boxes; the last row is centred when incomplete
  function boxAt(page, L, k, count) {
    var row = Math.floor(k / L.cols), col = k % L.cols;
    var inRow = Math.min(L.cols, count - row * L.cols);
    var rowW = inRow * L.boxW + (inRow - 1) * L.gapX;
    var x0 = (page.width - rowW) / 2;
    return {
      id: CS.uid(), type: 'step', x: x0 + col * (L.boxW + L.gapX), y: L.top + row * (L.boxH + L.gapY),
      w: L.boxW, h: L.boxH, fill: '#fff', width: 0.75, pad: PAD
    };
  }

  function steps(page) {
    return page.objects.filter(function (o) { return o.type === 'step'; }).sort(function (a, b) {
      var na = parseFloat(a.num) || 0, nb = parseFloat(b.num) || 0;
      return na - nb || a.y - b.y || a.x - b.x;
    });
  }

  // Add the next step box to the current page's flowchart (and connect it)
  function addStep(page) {
    var list = steps(page);
    var flow = page.flow || layoutParams(page, Object.assign({}, DEFAULTS, { header: false }));
    var L = Object.assign({}, flow);
    var k = list.length;
    var box = boxAt(page, L, k, k + 1 + ((k + 1) % L.cols ? 0 : 0));
    // keep earlier rows where they are: compute position as if the row were complete
    var row = Math.floor(k / L.cols), col = k % L.cols;
    var fullW = L.cols * L.boxW + (L.cols - 1) * L.gapX, x0 = (page.width - fullW) / 2;
    box.x = x0 + col * (L.boxW + L.gapX);
    box.y = L.top + row * (L.boxH + L.gapY);
    box.num = (k + 1) + '.';
    box.caption = '';
    box.font = flow.font || 'ChemSerif';
    box.size = flow.size || 9.5;
    page.objects.push(box);
    if (list.length) page.objects.push({ id: CS.uid(), type: 'connector', from: list[list.length - 1].id, to: box.id, route: 'auto', width: 0.75 });
    if (!page.flow) page.flow = L;
    return box;
  }

  // Re-arrange all step boxes (with their contents) in reading order and rebuild the arrows
  function relayout(page) {
    var list = steps(page);
    if (!list.length) return;
    var flow = page.flow || Object.assign(layoutParams(page, Object.assign({}, DEFAULTS, { header: false })), { boxW: list[0].w, boxH: list[0].h });
    var L = Object.assign({}, flow);
    var contents = list.map(function (b) { return CS.Editor.carriedBy(page, new Set(['o:' + b.id])).concat(atomsIn(page, b)); });
    list.forEach(function (b, k) {
      var nb = boxAt(page, L, k, list.length);
      var dx = nb.x - b.x, dy = nb.y - b.y;
      b.x = nb.x; b.y = nb.y;
      b.num = (k + 1) + '.';
      contents[k].forEach(function (it) {
        if (it.el) { it.x += dx; it.y += dy; } else CS.Doc.moveObj(it, dx, dy);
      });
    });
    var ids = new Set(list.map(function (b) { return b.id; }));
    page.objects = page.objects.filter(function (o) { return !(o.type === 'connector' && ids.has(o.from) && ids.has(o.to)); });
    for (var i = 1; i < list.length; i++) page.objects.push({ id: CS.uid(), type: 'connector', from: list[i - 1].id, to: list[i].id, route: 'auto', width: 0.75 });
  }
  function atomsIn(page, box) {
    return page.atoms.filter(function (a) { return CS.bboxHit(box, a); });
  }

  // ------------------------------------------------------------ wizard
  function presetOptions(sel) {
    var s = '<option value="none"' + (sel === 'none' ? ' selected' : '') + '>— empty box (draw yourself) —</option>';
    A.presets.forEach(function (p) { s += '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + CS.esc(p.name) + '</option>'; });
    return s;
  }

  function openWizard(initial) {
    var model = CS.clone(initial || {
      title: '', author: '', cols: 2,
      steps: [{ preset: 'flask', caption: '', labels: ['round-bottom flask'] }, { preset: 'reflux', caption: '', labels: ['condenser', 'water bath'] }]
    });
    var body = document.createElement('div');
    body.className = 'wizard';
    function renderBody() {
      var s = '<div class="wz-head">' + (CS.embed ? '' :
        '<label>Title <input data-k="title" value="' + CS.esc(model.title || '') + '" placeholder="e.g. Synthesis of aspirin"></label>' +
        '<label>Author <input data-k="author" value="' + CS.esc(model.author || '') + '" placeholder="your name"></label>') +
        '<label>Columns <select data-k="cols">' + [1, 2, 3].map(function (n) { return '<option' + (model.cols === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
        '<label>Font <select data-k="font"><option value="ChemSerif"' + (model.font !== 'ChemSans' ? ' selected' : '') + '>Serif (Times-like)</option><option value="ChemSans"' + (model.font === 'ChemSans' ? ' selected' : '') + '>Sans (Arial-like)</option></select></label>' +
        '</div><div class="wz-hint">Each step becomes a numbered box with an apparatus drawing, labels and an arrow to the next step. Formulas such as NaHCO3 or CaCl2 are subscripted automatically. Everything stays editable afterwards.</div><div class="wz-steps">';
      model.steps.forEach(function (st, i) {
        s += '<div class="wz-step" data-i="' + i + '">' +
          '<div class="wz-num">' + (i + 1) + '.</div>' +
          '<div class="wz-thumb">' + (st.preset && st.preset !== 'none' ? A.presetThumb(A.preset(st.preset), 64) : '<div class="wz-empty">empty</div>') + '</div>' +
          '<div class="wz-fields"><select data-f="preset">' + presetOptions(st.preset || 'none') + '</select>' +
          '<textarea data-f="caption" rows="3" placeholder="Describe this step…">' + CS.esc(st.caption || '') + '</textarea>' +
          '<input data-f="labels" value="' + CS.esc((st.labels || []).join('; ')) + '" placeholder="labels on the drawing, separated by ;"></div>' +
          '<div class="wz-btns"><button data-a="up" title="Move up">↑</button><button data-a="down" title="Move down">↓</button><button data-a="del" title="Remove">✕</button></div>' +
          '</div>';
      });
      s += '</div><button class="wz-add" data-a="add">+ Add step</button>';
      body.innerHTML = s;
    }
    renderBody();
    body.addEventListener('input', function (e) {
      var t = e.target, k = t.getAttribute('data-k');
      if (k) { model[k] = k === 'cols' ? +t.value : t.value; return; }
      var f = t.getAttribute('data-f'), stepEl = t.closest('.wz-step');
      if (!f || !stepEl) return;
      var st = model.steps[+stepEl.getAttribute('data-i')];
      if (f === 'labels') st.labels = t.value.split(';').map(function (x) { return x.trim(); });
      else st[f] = t.value;
    });
    body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.getAttribute('data-k') === 'cols') model.cols = +t.value;
      if (t.getAttribute('data-f') === 'preset') {
        var st = model.steps[+t.closest('.wz-step').getAttribute('data-i')];
        st.preset = t.value;
        var p = A.preset(t.value);
        st.labels = p ? p.callouts.map(function (c) { return c.text; }) : [];
        renderBody();
      }
    });
    body.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (!a) return;
      var stepEl = e.target.closest('.wz-step'), i = stepEl ? +stepEl.getAttribute('data-i') : -1;
      if (a === 'add') model.steps.push({ preset: 'none', caption: '', labels: [] });
      if (a === 'del') model.steps.splice(i, 1);
      if (a === 'up' && i > 0) model.steps.splice(i - 1, 0, model.steps.splice(i, 1)[0]);
      if (a === 'down' && i < model.steps.length - 1) model.steps.splice(i + 1, 0, model.steps.splice(i, 1)[0]);
      renderBody();
    });
    CS.UI.dialog({
      title: 'Flowchart wizard', body: body, wide: true,
      buttons: [
        { label: 'Cancel' },
        {
          label: 'Create flowchart', primary: true, action: function () {
            if (!model.steps.length) return false;
            create(model);
          }
        }
      ]
    });
  }

  function create(model) {
    var doc = CS.state.doc, cur = CS.page();
    var empty = !cur.atoms.length && !cur.objects.length;
    var pages = build(model, empty ? cur : null);
    if (empty) {
      pages.slice(1).forEach(function (p, i) { doc.pages.splice(CS.state.pageIdx + 1 + i, 0, p); });
    } else {
      pages.forEach(function (p, i) { doc.pages.splice(CS.state.pageIdx + 1 + i, 0, p); });
      CS.state.pageIdx += 1;
    }
    if (model.title && (!doc.title || doc.title === 'Untitled')) doc.title = model.title;
    CS.state.sel.clear();
    CS.commit();
    CS.Editor.fitPage();
  }

  CS.Flow = { build: build, addStep: addStep, relayout: relayout, openWizard: openWizard, create: create };
})(window.CS);
