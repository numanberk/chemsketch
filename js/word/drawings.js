'use strict';
/* Drawing areas in the document (Insert → Structure / Flowchart). Each area stores a ChemSketch document (one page the size of
   the area) and is edited in the full ChemSketch editor, which runs in a frame (sketch.html?embed=1).
   ChemWord renders the drawings itself with the same ChemSketch engine, so the page, the PDF and
   the Word file all show exactly what was drawn. Drawings saved by older ChemWord versions are
   converted on load. */

/* ---------- model ---------- */
function newDrawing(wPx, hPx) {
  const doc = CS.Doc.newDoc();
  Object.assign(doc.settings, CS.Doc.STYLES.acs, { style: 'acs' }); // journal (ACS 1996) proportions suit documents
  doc.title = 'Drawing';
  const page = doc.pages[0];
  page.size = 'Custom';
  page.width = Math.round((wPx || 360) * PX2PT);
  page.height = Math.round((hPx || 170) * PX2PT);
  return doc;
}
const isSketchDoc = (d) => !!(d && Array.isArray(d.pages) && d.settings);
const figPage = (doc) => doc.pages[Math.min(doc.figPage || 0, doc.pages.length - 1)];
function isEmptyDrawing(doc) {
  if (!isSketchDoc(doc)) return true;
  const p = figPage(doc);
  return !p.atoms.length && !p.objects.length;
}

// run fn with ChemSketch's renderer pointed at this drawing (settings + page)
function withDoc(doc, fn) {
  const st = CS.state, prevDoc = st.doc, prevIdx = st.pageIdx;
  st.doc = doc;
  st.pageIdx = Math.min(doc.figPage || 0, doc.pages.length - 1);
  try { return fn(st.doc.pages[st.pageIdx]); } finally { st.doc = prevDoc; st.pageIdx = prevIdx; }
}

// SVG of a drawing fitted into a w x h px box. Drawings are shown at natural size (1 pt = 4/3 px)
// and only shrink when they do not fit. opts.embedFonts makes the SVG self-contained for <img> use.
function figureSVG(doc, w, h, opts = {}) {
  return withDoc(doc, (page) => {
    const body = CS.R.renderPage(page, { noCache: true });
    const bb = CS.Export.contentBBox(page);
    const attrs = `xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}"`;
    if (!bb) return { svg: `<svg class="csvg" ${attrs} viewBox="0 0 ${w} ${h}"></svg>`, shrink: 1 };
    const pad = 2, bw = bb.w + 2 * pad, bh = bb.h + 2 * pad, natural = 1 / PX2PT;
    const s = Math.min(natural, w / bw, h / bh);
    const vw = w / s, vh = h / s, cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
    const style = opts.embedFonts ? `<defs><style>${CS.Export.fontFaceCSS(body)}</style></defs>` : '';
    const bg = opts.background ? `<rect x="${cx - vw / 2}" y="${cy - vh / 2}" width="${vw}" height="${vh}" fill="#fff"/>` : '';
    return {
      svg: `<svg class="csvg" ${attrs} viewBox="${CS.n(cx - vw / 2)} ${CS.n(cy - vh / 2)} ${CS.n(vw)} ${CS.n(vh)}">${style}${bg}${body}</svg>`,
      shrink: s / natural
    };
  });
}

/* ---------- drawings from ChemWord 1 (own drawing model) ---------- */
function migrateDrawing(old, wPx, hPx) {
  if (isSketchDoc(old)) return old;
  const doc = newDrawing(wPx, hPx);
  if (!old || !Array.isArray(old.atoms)) return doc;
  const page = doc.pages[0];
  const K = 0.48; // old units: bond = 30, shown at 0.64 px per unit -> 14.4 pt bonds
  const VAL = { C: 4, Si: 4, N: 3, P: 3, B: 3, O: 2, S: 2, Se: 2, F: 1, Cl: 1, Br: 1, I: 1, H: 1 };
  const ids = new Set();
  for (const a of old.atoms) {
    const t = a.t || 'C';
    const atom = { id: String(a.id), x: a.x * K, y: a.y * K, el: 'C' };
    if (CS.Chem.isElement(t)) atom.el = t; else atom.label = t;
    if (a.charge) atom.charge = a.charge;
    if (a.lp) atom.lonePairs = a.lp;
    if (a.rad) atom.radical = a.rad;
    if (a.showC) atom.showC = true;
    page.atoms.push(atom);
    ids.add(atom.id);
  }
  for (const b of old.bonds || []) {
    if (!ids.has(String(b.a)) || !ids.has(String(b.b))) continue;
    const bond = { id: String(b.id), a: String(b.a), b: String(b.b), order: b.order || 1 };
    const st = b.style === 'dash' ? 'dashed' : b.style;
    if (st && st !== 'plain') { bond.style = st; bond.order = 1; }
    page.bonds.push(bond);
  }
  // keep the old hydrogen counts (carbenes, typed H counts) where ChemSketch would differ
  const g = CS.Chem.graph(page);
  for (const a of old.atoms) {
    const atom = g.atoms.get(String(a.id));
    if (!atom || atom.label || VAL[atom.el] == null) continue;
    const t = atom.el, q = a.charge || 0;
    let v = VAL[t];
    if (t === 'C' || t === 'Si') v -= q ? Math.abs(q) : 2 * (a.lp || 0);
    else if (t === 'B') v -= q;
    else if (t === 'H') v -= Math.abs(q);
    else v += q;
    v -= a.rad || 0;
    const bo = g.adj.get(atom.id).reduce((s, b) => s + (b.style === 'dashed' ? 1 : b.order || 1), 0);
    const oldH = Math.max(0, v - bo + (a.hOff || 0));
    if (oldH !== CS.Chem.implicitH(g, atom)) atom.hCount = oldH;
  }
  const KIND = { rxn: 'forward', res: 'both', eq: 'equilibrium', retro: 'retro', curve2: 'forward', curve1: 'half' };
  for (const r of old.arrows || []) {
    if (r.kind === 'brk' || r.kind === 'par') {
      const x = Math.min(r.x1, r.x2) * K, y = Math.min(r.y1, r.y2) * K;
      page.objects.push({ id: CS.uid(), type: 'bracket', kind: r.kind === 'par' ? 'round' : 'square', x, y,
        w: Math.abs(r.x2 - r.x1) * K, h: Math.abs(r.y2 - r.y1) * K, width: 0.6 });
      continue;
    }
    const o = { id: CS.uid(), type: 'arrow', kind: KIND[r.kind] || 'forward', x1: r.x1 * K, y1: r.y1 * K, x2: r.x2 * K, y2: r.y2 * K, width: 0.6 };
    if (r.cx != null) {
      const dx = o.x2 - o.x1, dy = o.y2 - o.y1, l = Math.hypot(dx, dy) || 1;
      const mx = (o.x1 + o.x2) / 2, my = (o.y1 + o.y2) / 2;
      o.bend = (r.cx * K - mx) * (-dy / l) + (r.cy * K - my) * (dx / l);
    }
    page.objects.push(o);
  }
  for (const t of old.texts || []) {
    const size = 10 * (t.size || 1);
    const text = String(t.text || '').replace(/<=>/g, '⇌').replace(/->/g, '→').replace(/\*/g, '');
    const lay = CS.Text.layout(text, { font: 'ChemSans', size });
    const align = t.align || 'center';
    const x = t.x * K - (align === 'center' ? lay.w / 2 : align === 'right' ? lay.w : 0);
    page.objects.push({ id: CS.uid(), type: 'text', x, y: t.y * K - 0.545 * size, text, size, font: 'ChemSans', align });
  }
  centerContent(doc);
  return doc;
}

// move everything so the drawing sits in the middle of its page
function centerContent(doc) {
  withDoc(doc, (page) => {
    const bb = CS.Export.contentBBox(page);
    if (!bb) return;
    const keys = new Set([...page.atoms.map((a) => 'a:' + a.id), ...page.objects.map((o) => 'o:' + o.id)]);
    CS.Doc.translate(page, keys, page.width / 2 - (bb.x + bb.w / 2), page.height / 2 - (bb.y + bb.h / 2));
  });
}

/* ---------- drawing areas in the document ---------- */
function figBox(f) {
  return { w: parseFloat(f.style.width) || 300, h: parseFloat(f.style.height) || 150, ml: parseFloat(f.style.marginLeft) || 0 };
}
function drawingFor(f) {
  const { w, h } = figBox(f);
  let d = DRAW[f.dataset.id];
  if (!isSketchDoc(d)) d = DRAW[f.dataset.id] = migrateDrawing(d, w, h);
  return d;
}
function buildFig(f) {
  const d = drawingFor(f);
  const { w, h } = figBox(f);
  const r = figureSVG(d, w, h);
  f.classList.toggle('empty', isEmptyDrawing(d));
  const shrunk = r.shrink < 0.995;
  f.innerHTML = r.svg +
    '<span class="clab">Drawing area · click to draw</span>' +
    `<span class="cnote${shrunk ? ' on' : ''}">Shown at ${Math.round(r.shrink * 100)}% — enlarge the area for full size</span>` +
    '<div class="cui"><button data-c="edit" title="Open in ChemSketch">Edit</button><button data-c="al" title="Align left" aria-label="Align left">⇤</button><button data-c="ac" title="Centre" aria-label="Centre">↔</button><button data-c="ar" title="Align right" aria-label="Align right">⇥</button><button data-c="del" class="dl" title="Delete this area (Ctrl+Z restores it)">Delete</button></div>' +
    '<div class="crs" title="Drag to resize"></div>';
}
function refreshFigSVG(f) {
  const old = f.querySelector('svg.csvg');
  const { w, h } = figBox(f);
  const t = document.createElement('template');
  const r = figureSVG(drawingFor(f), w, h);
  t.innerHTML = r.svg;
  if (old) old.replaceWith(t.content.firstChild);
  const note = f.querySelector('.cnote');
  if (note) {
    note.classList.toggle('on', r.shrink < 0.995);
    note.textContent = `Shown at ${Math.round(r.shrink * 100)}% — enlarge the area for full size`;
  }
}
function rebuildFigures() {
  $$('figure.chem', ed).forEach((f) => {
    f.setAttribute('contenteditable', 'false');
    if (!DRAW[f.dataset.id]) DRAW[f.dataset.id] = newDrawing(figBox(f).w, figBox(f).h);
    buildFig(f);
  });
}

// Insert a drawing area at the caret (like Word's Insert tab) and open the editor in it.
// kind: 'structure' or 'flowchart' (opens the flowchart wizard in a page-tall area)
function insertDrawing(kind) {
  const w = CW, h = kind === 'flowchart' ? CH - 40 : 200;
  const id = 'c' + Math.random().toString(36).slice(2, 9);
  DRAW[id] = newDrawing(w, h);
  insertBlock(`<figure class="chem empty" contenteditable="false" data-id="${id}" style="width:${w}px;height:${h}px;margin-left:0px"></figure>`);
  const f = ed.querySelector(`figure.chem[data-id="${id}"]`);
  buildFig(f);
  reflow();
  f.scrollIntoView({ block: 'nearest' });
  openDrawing(f, { isNew: true, wizard: kind === 'flowchart' });
}

/* resizing and the small toolbar on each area */
let RS = null;
ed.addEventListener('pointerdown', (e) => {
  const c = e.target.closest('figure.chem .crs');
  if (!c) return;
  e.preventDefault();
  e.stopPropagation();
  History.flush();
  const f = c.closest('figure');
  c.setPointerCapture(e.pointerId);
  RS = { f, sx: e.clientX, sy: e.clientY, ...figBox(f) };
});
ed.addEventListener('pointermove', (e) => {
  if (!RS) return;
  const { f } = RS;
  const w = Math.round(Math.max(60, Math.min(CW - RS.ml, RS.w + (e.clientX - RS.sx) / ZOOM)));
  const h = Math.round(Math.max(40, Math.min(CH - 20, RS.h + (e.clientY - RS.sy) / ZOOM)));
  f.style.width = w + 'px';
  f.style.height = h + 'px';
  refreshFigSVG(f);
});
ed.addEventListener('pointerup', () => {
  if (!RS) return;
  RS = null;
  reflow();
  save();
  History.record();
});
ed.addEventListener('click', (e) => {
  const f = e.target.closest('figure.chem');
  $$('img.isel', ed).forEach((i) => i.classList.remove('isel'));
  if (e.target.tagName === 'IMG' && ed.contains(e.target)) {
    e.target.classList.add('isel');
    IMG = e.target;
    updateCtxGroups();
    return;
  }
  IMG = null;
  updateCtxGroups();
  if (!f) return;
  e.preventDefault();
  if (e.target.closest('.crs')) return;
  const b = e.target.closest('.cui button');
  if (!b) return openDrawing(f);
  const c = b.dataset.c, bx = figBox(f);
  if (c === 'edit') return openDrawing(f);
  History.flush();
  if (c === 'del') {
    f.remove();
    reflow();
    save();
    History.record();
    toast('Drawing area deleted. Ctrl+Z brings it back.');
    return;
  }
  f.style.marginLeft = (c === 'al' ? 0 : c === 'ac' ? Math.round((CW - bx.w) / 2) : CW - bx.w) + 'px';
  save();
  History.record();
});

/* ---------- the ChemSketch editor window ---------- */
const Sketch = { ready: false, fig: null, pending: false };
const cdm = $('#cdm'), frame = $('#cdFrame');
function openDrawing(fig, opts = {}) {
  closeMenus();
  History.flush();
  const doc = CS.clone(drawingFor(fig));
  // the editor page is the area on the paper; keep the drawing centred if the area was resized
  const { w, h } = figBox(fig), page = figPage(doc);
  const W = Math.round(w * PX2PT), H = Math.round(h * PX2PT);
  if (page.width !== W || page.height !== H) {
    withDoc(doc, (p) => {
      const keys = new Set([...p.atoms.map((a) => 'a:' + a.id), ...p.objects.map((o) => 'o:' + o.id)]);
      CS.Doc.translate(p, keys, (W - p.width) / 2, (H - p.height) / 2);
      p.width = W;
      p.height = H;
    });
  }
  Sketch.fig = fig;
  Sketch.doc = doc;
  Sketch.opts = opts;
  cdm.hidden = false;
  document.body.style.overflow = 'hidden';
  if (!frame.getAttribute('src')) frame.src = 'sketch.html?embed=1';
  if (Sketch.ready) sendLoad(); else Sketch.pending = true;
}
function sendLoad() {
  Sketch.pending = false;
  $('#cdmWait').hidden = true;
  frame.contentWindow.postMessage({ type: 'chemsketch:load', doc: Sketch.doc, wizard: !!Sketch.opts.wizard }, '*');
  frame.focus();
}
function closeDrawing() {
  cdm.hidden = true;
  document.body.style.overflow = '';
  Sketch.fig = null;
  Sketch.doc = null;
}
window.addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow || !e.data) return;
  const m = e.data;
  if (m.type === 'chemsketch:ready') {
    Sketch.ready = true;
    if (Sketch.pending) sendLoad();
  } else if (m.type === 'chemsketch:done' && Sketch.fig) {
    const f = Sketch.fig;
    if (isSketchDoc(m.doc) && f.isConnected) {
      DRAW[f.dataset.id] = m.doc;
      // a flowchart may have made the page taller: grow the area to match (within the page)
      const page = figPage(m.doc);
      f.style.width = Math.round(Math.min(CW, page.width / PX2PT)) + 'px';
      f.style.height = Math.round(Math.min(CH - 20, Math.max(40, page.height / PX2PT))) + 'px';
      buildFig(f);
      reflowSoon(20);
      save();
      History.record();
    }
    closeDrawing();
  } else if (m.type === 'chemsketch:cancel') {
    // cancelling a drawing that was just inserted removes the empty area again
    const f = Sketch.fig;
    const discard = Sketch.opts && Sketch.opts.isNew && f && f.isConnected && isEmptyDrawing(drawingFor(f));
    closeDrawing();
    if (discard) History.undo();
  }
});
