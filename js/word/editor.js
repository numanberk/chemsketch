'use strict';
/* The word processor: formatting ribbon, tables, pictures, symbols, page breaks, pagination,
   zoom, autosave and opening files. */

/* ================= persistence ================= */
const LS = 'chemword.v1';

function sanitizeDoc(html) {
  const t = document.createElement('template');
  t.innerHTML = String(html || '');
  t.content.querySelectorAll('script,iframe,object,embed,link,meta,style,base,form,input,textarea,button,select').forEach((x) => x.remove());
  t.content.querySelectorAll('svg').forEach((s) => { if (!s.closest('figure.chem')) s.remove(); });
  t.content.querySelectorAll('*').forEach((el) => {
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith('on') ||
        ((n === 'href' || n === 'src' || n === 'xlink:href') && /^\s*javascript:/i.test(a.value)) ||
        (n === 'src' && el.tagName === 'IMG' && !/^data:image\//i.test(a.value))) el.removeAttribute(a.name);
    }
  });
  const d = document.createElement('div');
  d.appendChild(t.content);
  normalizeFonts(d);
  return d.innerHTML;
}

// Fonts: on screen and in the PDF ChemWord uses bundled, metric-compatible fonts, so the layout is
// identical everywhere. Word files name the familiar fonts (Calibri, Arial, …).
const FONTS = [
  ['Calibri', 'DocSans, Calibri, Carlito, sans-serif'],
  ['Arial', 'ChemSans, Arial, Arimo, Helvetica, sans-serif'],
  ['Times New Roman', 'ChemSerif, "Times New Roman", Tinos, Times, serif'],
  ['Cambria', 'DocSerif, Cambria, Caladea, Georgia, serif'],
  ['Courier New', 'ChemMono, "Courier New", Cousine, monospace']
];
const FONT_ALIAS = {
  docsans: 'Calibri', calibri: 'Calibri', carlito: 'Calibri', verdana: 'Calibri',
  chemsans: 'Arial', arial: 'Arial', arimo: 'Arial', helvetica: 'Arial',
  chemserif: 'Times New Roman', 'times new roman': 'Times New Roman', tinos: 'Times New Roman', times: 'Times New Roman', georgia: 'Cambria',
  docserif: 'Cambria', cambria: 'Cambria', caladea: 'Cambria',
  chemmono: 'Courier New', 'courier new': 'Courier New', cousine: 'Courier New', courier: 'Courier New'
};
function famLabel(css) {
  const first = (css || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  return FONT_ALIAS[first] || 'Calibri';
}
const famStack = (label) => (FONTS.find((f) => f[0] === label) || FONTS[0])[1];
function normalizeFonts(root) {
  root.querySelectorAll('[style]').forEach((el) => {
    if (el.style.fontFamily) el.style.fontFamily = famStack(famLabel(el.style.fontFamily));
  });
  root.querySelectorAll('font[face]').forEach((el) => el.setAttribute('face', famStack(famLabel(el.getAttribute('face')))));
}

function clearPB() {
  for (const el of ed.querySelectorAll('[data-pb]')) {
    el.style.marginTop = '';
    el.removeAttribute('data-pb');
    if (!el.getAttribute('style')) el.removeAttribute('style');
  }
}
function serialize() {
  const c = ed.cloneNode(true);
  c.querySelectorAll('[data-pb]').forEach((el) => {
    el.style.marginTop = '';
    el.removeAttribute('data-pb');
    if (!el.getAttribute('style')) el.removeAttribute('style');
  });
  c.querySelectorAll('figure.chem').forEach((f) => { f.innerHTML = ''; f.classList.remove('sel'); });
  c.querySelectorAll('.isel').forEach((x) => x.classList.remove('isel'));
  return c.innerHTML;
}
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(saveNow, 400);
}
function saveNow() {
  const used = new Set($$('figure.chem', ed).map((f) => f.dataset.id));
  for (const k in DRAW) if (!used.has(k)) delete DRAW[k];
  try {
    localStorage.setItem(LS, JSON.stringify(projectObj()));
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22) && !saveNow.warned) {
      saveNow.warned = 1;
      toast('Too large to autosave in this browser. Use File → Save project.', 5000);
    }
  }
}
function projectObj() {
  return { v: 1, html: serialize(), draws: DRAW, opts: OPTS };
}
function loadDoc(o) {
  DRAW = {};
  OPTS = { pn: false, autoChem: true };
  let html = '<p><br></p>';
  if (o && o.v === 1) {
    html = sanitizeDoc(o.html) || html;
    for (const k in o.draws || {}) DRAW[k] = o.draws[k];
    OPTS = Object.assign(OPTS, o.opts || {});
  }
  ed.innerHTML = html;
  if (!ed.firstElementChild) ed.innerHTML = '<p><br></p>';
  rebuildFigures();
  $('#optPn').checked = !!OPTS.pn;
  $('#optChem').checked = OPTS.autoChem !== false;
  reflow();
  updateStatus();
  History.reset();
}
function openProject(o, msg) {
  if (!o || o.v !== 1 || typeof o.html !== 'string') throw new Error('not a ChemWord project');
  loadDoc(o);
  saveNow();
  toast(msg || 'Opened', 4000);
}

/* ================= word processing ================= */
let SAVED = null, IMG = null;
const SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];
$('#sFont').innerHTML = FONTS.map((f) => `<option value="${f[0]}">${f[0]}</option>`).join('');
$('#sSize').innerHTML = SIZES.map((s) => `<option value="${s}">${s}</option>`).join('');
$('#sSize').value = '11';

function inEd(n) { return n && (n === ed || ed.contains(n.nodeType === 1 ? n : n.parentNode)); }
document.addEventListener('selectionchange', () => {
  const s = getSelection();
  if (s.rangeCount && inEd(s.anchorNode)) {
    SAVED = s.getRangeAt(0).cloneRange();
    syncUI();
  }
});
function restoreSel() {
  ed.focus({ preventScroll: true });
  if (SAVED && ed.contains(SAVED.startContainer)) {
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(SAVED);
  }
}
function ensureFocus() { if (document.activeElement !== ed) restoreSel(); }
function topOf(n, off) {
  if (n === ed) return ed.children[Math.max(0, off - 1)] || ed.firstElementChild;
  let x = n.nodeType === 1 ? n : n.parentElement;
  while (x && x.parentElement !== ed) x = x.parentElement;
  return x || ed.lastElementChild;
}
function topBlock() {
  const s = getSelection();
  if (!s.rangeCount || !inEd(s.anchorNode)) {
    return SAVED && ed.contains(SAVED.startContainer) ? topOf(SAVED.startContainer, SAVED.startOffset) : ed.lastElementChild;
  }
  const r = s.getRangeAt(0);
  return topOf(r.startContainer, r.startOffset);
}
function caretIn(el, end) {
  if (!el) return;
  ed.focus({ preventScroll: true });
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(!end);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
  SAVED = r.cloneRange();
}
// insert block-level HTML after the current block (replacing it when it is an empty paragraph)
function insertBlock(html, pick) {
  History.flush();
  const blk = topBlock();
  const t = document.createElement('template');
  t.innerHTML = html;
  const nodes = [...t.content.children];
  const empty = blk && blk.tagName === 'P' && !blk.textContent.trim() && !blk.querySelector('img');
  if (!blk) ed.append(...nodes);
  else {
    blk.after(...nodes);
    if (empty) blk.remove();
  }
  const last = nodes[nodes.length - 1];
  if (!last.nextElementSibling || last.tagName !== 'P') {
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    last.after(p);
  }
  caretIn(pick ? pick(nodes) : last.tagName === 'P' ? last : last.nextElementSibling, false);
  afterEdit(true);
  updateCtxGroups();
}
function exec(cmd, val) {
  if (cmd === 'undo') return History.undo();
  if (cmd === 'redo') return History.redo();
  ensureFocus();
  try { document.execCommand('styleWithCSS', false, ['foreColor', 'hiliteColor', 'backColor'].includes(cmd)); } catch (e) { /* old browsers */ }
  document.execCommand(cmd, false, val ?? null);
  afterEdit();
  syncUI();
}
// browsers sometimes nest blocks inside <p>; move them out
function fixNesting() {
  const SEL = 'p>ul,p>ol,p>p,p>table,p>h1,p>h2,p>h3,p>div,p>figure,p>hr,p>blockquote';
  if (!ed.querySelector(SEL)) return;
  const s = getSelection();
  const r = s.rangeCount ? s.getRangeAt(0) : null;
  const sv = r ? [r.startContainer, r.startOffset, r.endContainer, r.endOffset] : null;
  const BL = /^(UL|OL|P|TABLE|H1|H2|H3|DIV|FIGURE|HR|BLOCKQUOTE)$/;
  for (let guard = 0; guard < 50; guard++) {
    const b = ed.querySelector(SEL);
    if (!b) break;
    const p = b.parentElement, out = [];
    let cur = null;
    for (const n of [...p.childNodes]) {
      if (n.nodeType === 1 && BL.test(n.tagName)) { cur = null; out.push(n); continue; }
      if (n.nodeType === 3 && !n.nodeValue.trim() && !cur) continue;
      if (!cur) {
        cur = document.createElement('p');
        if (p.getAttribute('style')) cur.setAttribute('style', p.getAttribute('style'));
        out.push(cur);
      }
      cur.appendChild(n);
    }
    p.replaceWith(...out);
  }
  if (sv && ed.contains(sv[0]) && ed.contains(sv[2])) {
    try {
      const nr = document.createRange();
      nr.setStart(sv[0], sv[1]);
      nr.setEnd(sv[2], sv[3]);
      s.removeAllRanges();
      s.addRange(nr);
    } catch (e) { /* selection moved */ }
  }
}
function ensureRoot() {
  if (!ed.firstElementChild || ed.innerHTML === '<br>') {
    ed.innerHTML = '<p><br></p>';
    const r = document.createRange();
    r.setStart(ed.firstChild, 0);
    r.collapse(true);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
}
// after any change; structural changes are recorded as their own undo step right away
function afterEdit(structural) {
  fixNesting();
  ensureRoot();
  reflowSoon(30);
  save();
  updateStatus();
  if (structural) History.record(); else History.recordSoon();
}

function syncUI() {
  for (const b of $$('#rib [data-cmd][aria-pressed]')) {
    let on = false;
    try { on = document.queryCommandState(b.dataset.cmd); } catch (e) { /* ignore */ }
    b.setAttribute('aria-pressed', on);
  }
  const s = getSelection();
  if (!s.rangeCount) return;
  let n = s.focusNode;
  if (!n) return;
  if (n.nodeType !== 1) n = n.parentElement;
  if (!n || !ed.contains(n)) return;
  const cs = getComputedStyle(n);
  if (document.activeElement !== $('#sFont')) $('#sFont').value = famLabel(cs.fontFamily);
  const pt = Math.round(parseFloat(cs.fontSize) * PX2PT * 2) / 2;
  const sz = $('#sSize');
  if (document.activeElement !== sz) {
    if (!SIZES.includes(pt) && !sz.querySelector(`option[value="${pt}"]`)) {
      const o = document.createElement('option');
      o.value = pt;
      o.textContent = pt;
      sz.appendChild(o);
    }
    sz.value = pt;
  }
  const blk = n.closest('h1,h2,h3,p,li,td,th,div');
  $('#sStyle').value = blk && /^H[123]$/.test(blk.tagName) ? blk.tagName.toLowerCase() : 'p';
  updateCtxGroups();
}
function updateCtxGroups() {
  const s = getSelection();
  let n = s.rangeCount ? s.anchorNode : null;
  if (n && n.nodeType !== 1) n = n.parentElement;
  $('#gTable').hidden = !(n && ed.contains(n) && n.closest('td,th'));
  $('#gImg').hidden = !IMG;
}
$('#rib').addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
$('#rib').addEventListener('click', (e) => {
  const ins = e.target.closest('[data-ins]');
  if (ins) return insertDrawing(ins.dataset.ins);
  const b = e.target.closest('[data-cmd]');
  if (b) return exec(b.dataset.cmd);
  const t = e.target.closest('[data-t]');
  if (t) return tableOp(t.dataset.t);
  const im = e.target.closest('[data-i]');
  if (im && IMG) {
    History.flush();
    if (im.dataset.i === 'del') { IMG.remove(); IMG = null; }
    else {
      IMG.style.width = im.dataset.i + '%';
      IMG.removeAttribute('width');
      IMG.style.height = 'auto';
    }
    updateCtxGroups();
    afterEdit(true);
  }
});
$('#sStyle').onchange = (e) => exec('formatBlock', e.target.value);

// execCommand only knows HTML <font>; replace its output with styled spans
function wrapCmd(cmd, val, fixer) {
  ensureFocus();
  try { document.execCommand('styleWithCSS', false, false); } catch (x) { /* ignore */ }
  document.execCommand(cmd, false, val);
  const made = fixer();
  if (made.length) {
    const r = document.createRange();
    r.setStartBefore(made[0]);
    r.setEndAfter(made[made.length - 1]);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    SAVED = r.cloneRange();
  }
  afterEdit(true);
  syncUI();
}
$('#sFont').onchange = (e) => {
  const stack = famStack(e.target.value);
  wrapCmd('fontName', '__F__', () => {
    const out = [];
    $$('font[face="__F__"]', ed).forEach((fn) => {
      const sp = document.createElement('span');
      sp.style.fontFamily = stack;
      sp.append(...fn.childNodes);
      fn.replaceWith(sp);
      out.push(sp);
    });
    $$('span', ed).forEach((sp) => {
      if (sp.style.fontFamily.includes('__F__')) { sp.style.fontFamily = stack; out.push(sp); }
    });
    return out;
  });
};
$('#sSize').onchange = (e) => {
  const pt = e.target.value;
  wrapCmd('fontSize', '7', () => {
    const out = [];
    $$('font[size="7"]', ed).forEach((fn) => {
      const sp = document.createElement('span');
      sp.style.fontSize = pt + 'pt';
      sp.append(...fn.childNodes);
      fn.replaceWith(sp);
      out.push(sp);
    });
    $$('span', ed).forEach((sp) => {
      if (sp.style.fontSize === 'xxx-large' || sp.style.fontSize === '-webkit-xxx-large') { sp.style.fontSize = pt + 'pt'; out.push(sp); }
    });
    return out;
  });
};

/* colours */
let CF = '#c00000', CHL = '#ffff00';
$('#bColor').onclick = () => exec('foreColor', CF);
$('#bHi').onclick = () => exec('hiliteColor', CHL);
$('#bColorDd').onclick = () => $('#cF').click();
$('#bHiDd').onclick = () => $('#cH').click();
$('#cF').addEventListener('change', (e) => { CF = e.target.value; $('#cbarF').style.background = CF; exec('foreColor', CF); });
$('#cH').addEventListener('change', (e) => { CHL = e.target.value; $('#cbarH').style.background = CHL; exec('hiliteColor', CHL); });

/* menus */
function openMenu(btn, m) {
  const open = m.hidden;
  closeMenus();
  if (!open) return;
  m.hidden = false;
  const r = btn.getBoundingClientRect(), mr = m.getBoundingClientRect();
  m.style.left = Math.max(6, Math.min(window.innerWidth - mr.width - 6, r.left)) + 'px';
  m.style.top = r.bottom + 4 + 'px';
}
function closeMenus() { $$('.menu').forEach((m) => (m.hidden = true)); }
document.addEventListener('mousedown', (e) => { if (!e.target.closest('.menu,#bFile,#bLine,#bTable,#bSym')) closeMenus(); });
document.addEventListener('touchstart', (e) => { if (!e.target.closest('.menu,#bFile,#bLine,#bTable,#bSym')) closeMenus(); }, { passive: true });
$('#bFile').onclick = () => openMenu($('#bFile'), $('#mFile'));
$('#bLine').onclick = () => openMenu($('#bLine'), $('#mLine'));
$('#bTable').onclick = () => openMenu($('#bTable'), $('#mTable'));
$('#bSym').onclick = () => openMenu($('#bSym'), $('#mSym'));
$$('.menu').forEach((m) => m.addEventListener('mousedown', (e) => { if (e.target.tagName !== 'INPUT') e.preventDefault(); }));

/* line spacing */
function selBlocks() {
  ensureFocus();
  const s = getSelection();
  if (!s.rangeCount) return [];
  const r = s.getRangeAt(0), out = [];
  const top = (n) => {
    let x = n.nodeType === 1 ? n : n.parentElement;
    const li = x && x.closest('li');
    if (li && ed.contains(li)) return li;
    while (x && x.parentElement !== ed) x = x.parentElement;
    return x;
  };
  const a = top(r.startContainer), b = top(r.endContainer);
  if (!a) return [];
  if (a === b) return [a];
  let on = false;
  for (const el of $$('li,:scope>*', ed)) {
    if (el === a) on = true;
    if (on && !out.includes(el)) out.push(el);
    if (el === b) break;
  }
  return out.length ? out : [a];
}
$('#mLine').addEventListener('click', (e) => {
  const b = e.target.closest('[data-lh]');
  if (!b) return;
  closeMenus();
  History.flush();
  for (const el of selBlocks()) if (el.tagName !== 'FIGURE') el.style.lineHeight = b.dataset.lh;
  afterEdit(true);
});

/* tables */
const tg = $('#tgrid');
tg.innerHTML = Array.from({ length: 64 }, (_, i) => `<span data-r="${Math.floor(i / 8) + 1}" data-c="${(i % 8) + 1}"></span>`).join('');
tg.addEventListener('mouseover', (e) => {
  const c = e.target.closest('span');
  if (!c) return;
  const R = +c.dataset.r, C = +c.dataset.c;
  $$('span', tg).forEach((s) => s.classList.toggle('on', +s.dataset.r <= R && +s.dataset.c <= C));
  $('#tglab').textContent = `${C} × ${R} table`;
});
tg.addEventListener('click', (e) => {
  const c = e.target.closest('span');
  if (!c) return;
  closeMenus();
  const R = +c.dataset.r, C = +c.dataset.c;
  const row = '<tr>' + '<td><br></td>'.repeat(C) + '</tr>';
  insertBlock(`<table><tbody>${row.repeat(R)}</tbody></table>`, (ns) => ns[0].querySelector('td'));
});
function curCell() {
  const s = getSelection();
  let n = s.rangeCount ? s.anchorNode : null;
  if (n && n.nodeType !== 1) n = n.parentElement;
  return n && ed.contains(n) ? n.closest('td,th') : null;
}
function tableOp(op) {
  ensureFocus();
  const td = curCell();
  if (!td) return;
  History.flush();
  const tr = td.parentElement, tbl = td.closest('table'), ci = [...tr.children].indexOf(td);
  const blankRow = () => {
    const r = document.createElement('tr');
    for (let i = 0; i < tr.children.length; i++) {
      const c = document.createElement('td');
      c.innerHTML = '<br>';
      r.appendChild(c);
    }
    return r;
  };
  if (op === 'rowA') tr.before(blankRow());
  else if (op === 'rowB') tr.after(blankRow());
  else if (op === 'colL' || op === 'colR') {
    for (const r of tbl.rows) {
      const c = document.createElement('td');
      c.innerHTML = '<br>';
      const ref = r.children[ci];
      if (!ref) r.appendChild(c);
      else if (op === 'colL') ref.before(c);
      else ref.after(c);
    }
  } else if (op === 'delRow') { if (tbl.rows.length <= 1) tbl.remove(); else tr.remove(); }
  else if (op === 'delCol') {
    if (tr.children.length <= 1) tbl.remove();
    else for (const r of tbl.rows) if (r.children[ci]) r.children[ci].remove();
  } else if (op === 'delTab') tbl.remove();
  ensureRoot();
  afterEdit(true);
  updateCtxGroups();
}

/* symbols */
const SYMS = 'α β γ δ ε η θ κ λ μ ν π ρ σ τ φ χ ψ ω Δ Σ Ω ° ± × ÷ ≈ ≠ ≤ ≥ → ← ⇌ ↔ ⇒ ↑ ↓ ‡ · • ∙ ⁺ ⁻ ₁ ₂ ₃ ½ ‰ µ Å ℃ ∞ ∂ √ ∑'.split(' ');
$('#symg').innerHTML = SYMS.map((s) => `<button class="ib" data-sym="${s}">${s}</button>`).join('');
$('#symg').addEventListener('click', (e) => {
  const b = e.target.closest('[data-sym]');
  if (b) exec('insertText', b.dataset.sym);
});

/* pictures */
$('#bImg').onclick = () => $('#imgIn').click();
$('#imgIn').onchange = (e) => {
  const fl = e.target.files[0];
  e.target.value = '';
  if (!fl) return;
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const max = 1400;
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * k);
      c.height = Math.round(im.naturalHeight * k);
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(im, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/jpeg', 0.88), dw = Math.min(CW, Math.round(c.width * 0.5));
      History.flush();
      exec('insertHTML', `<img src="${url}" style="width:${dw}px;height:auto" alt="">`);
      History.record();
    };
    im.onerror = () => toast('That file is not an image I can read');
    im.src = rd.result;
  };
  rd.readAsDataURL(fl);
};

/* page breaks and keyboard */
$('#bPb').onclick = () => insertBlock('<hr class="pb"><p><br></p>');
ed.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'Enter') { e.preventDefault(); insertBlock('<hr class="pb"><p><br></p>'); }
  if (mod && e.key === '=') { e.preventDefault(); exec(e.shiftKey ? 'superscript' : 'subscript'); }
  if (mod && e.key === '+') { e.preventDefault(); exec('superscript'); }
  if (e.key === 'Tab') {
    e.preventDefault();
    const td = curCell();
    if (td) {
      const cells = $$('td,th', td.closest('table'));
      const n = cells[cells.indexOf(td) + (e.shiftKey ? -1 : 1)];
      if (n) caretIn(n, false);
    } else exec(e.shiftKey ? 'outdent' : 'indent');
  }
});
// own undo history (see history.js)
document.addEventListener('keydown', (e) => {
  if (!cdm.hidden || !(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'z' || k === 'y') {
    const t = e.target;
    if (t && t !== ed && !ed.contains(t) && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    e.preventDefault();
    if (k === 'y' || e.shiftKey) History.redo(); else History.undo();
  }
}, true);
ed.addEventListener('beforeinput', (e) => {
  if (e.inputType === 'historyUndo') { e.preventDefault(); History.undo(); }
  else if (e.inputType === 'historyRedo') { e.preventDefault(); History.redo(); }
});
ed.addEventListener('input', () => afterEdit());
ed.addEventListener('keyup', syncUI);

/* ================= pagination ================= */
// Blocks that would cross a page boundary get a top margin that moves them to the next page.
function units() {
  const out = [];
  let force = false;
  for (const el of ed.children) {
    if (el.tagName === 'HR' && el.classList.contains('pb')) { out.push({ el }); force = true; continue; }
    if (el.tagName === 'UL' || el.tagName === 'OL') {
      let first = true;
      for (const li of el.children) { out.push({ el: li, force: force && first }); first = false; }
      force = false;
      continue;
    }
    out.push({ el, keep: /^H[123]$/.test(el.tagName), force });
    force = false;
  }
  return out;
}
function reflow() {
  clearPB();
  const U = units();
  for (let it = 0; it < 200; it++) {
    const top0 = paper.getBoundingClientRect().top;
    const pos = U.map((u) => {
      const r = u.el.getBoundingClientRect();
      return { t: (r.top - top0) / ZOOM, b: (r.bottom - top0) / ZOOM };
    });
    let fixed = false;
    for (let i = 0; i < U.length; i++) {
      const { t, b } = pos[i];
      if (b - t <= 0.5 && !U[i].force) continue;
      const pg = Math.floor(t / PP), cTop = pg * PP + MT, cBot = cTop + CH;
      let target = null, j = i;
      if (t > cBot - 1) target = (pg + 1) * PP + MT;
      else if (t < cTop - 0.5) target = cTop;
      else if (U[i].force && t > cTop + 1) target = (pg + 1) * PP + MT;
      else if (b > cBot + 0.5 && t > cTop + 1 && b - t <= CH) {
        target = (pg + 1) * PP + MT;
        // keep headings with the block that follows them
        while (j > 0 && U[j - 1].keep && Math.floor(pos[j - 1].t / PP) === pg && pos[j - 1].t > cTop + 1) j--;
      }
      if (target == null) continue;
      const el = U[j].el, cur = parseFloat(getComputedStyle(el).marginTop) || 0;
      el.style.marginTop = cur + target - pos[j].t + 'px';
      el.setAttribute('data-pb', '1');
      fixed = true;
      break;
    }
    if (!fixed) break;
  }
  const top0 = paper.getBoundingClientRect().top;
  let lastB = MT;
  for (const u of U.slice(-3)) lastB = Math.max(lastB, (u.el.getBoundingClientRect().bottom - top0) / ZOOM);
  drawPages(Math.max(1, Math.floor((lastB - 1) / PP) + 1));
}
let rfT;
function reflowSoon(ms = 120) {
  clearTimeout(rfT);
  rfT = setTimeout(reflow, ms);
}
function drawPages(n) {
  NPAGES = n;
  let h = '';
  for (let i = 0; i < n; i++) h += `<div class="pg" style="top:${i * PP}px">${OPTS.pn ? `<div class="pnum">${i + 1}</div>` : ''}</div>`;
  $('#pbg').innerHTML = h;
  const H = n * PP - GAP;
  paper.style.height = H + 'px';
  ed.style.minHeight = H + 'px';
  layoutStage();
  updateStatus();
}

/* ================= zoom & status ================= */
function layoutStage() {
  const w = PW * ZOOM, h = (NPAGES * PP - GAP) * ZOOM;
  const sw = Math.max(scroller.clientWidth, w + 32);
  stage.style.width = sw + 'px';
  stage.style.height = h + 48 + 'px';
  paper.style.left = (sw - w) / 2 + 'px';
  paper.style.transform = `scale(${ZOOM})`;
  $('#zFit').textContent = Math.round(ZOOM * 100) + '%';
}
const ZS = [0.4, 0.5, 0.6, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];
function setZoom(z, cx, cy) {
  z = Math.max(0.3, Math.min(3, z));
  const r0 = paper.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
  if (cx == null) { cx = sr.left + sr.width / 2; cy = sr.top + sr.height / 3; }
  const px = (cx - r0.left) / ZOOM, py = (cy - r0.top) / ZOOM;
  ZOOM = z;
  layoutStage();
  const r1 = paper.getBoundingClientRect();
  scroller.scrollLeft += r1.left + px * z - cx;
  scroller.scrollTop += r1.top + py * z - cy;
}
const fitZoom = () => Math.min(1, (scroller.clientWidth - 24) / PW);
$('#zIn').onclick = () => setZoom(ZS.find((z) => z > ZOOM + 0.01) || 3);
$('#zOut').onclick = () => setZoom([...ZS].reverse().find((z) => z < ZOOM - 0.01) || 0.3);
$('#zFit').onclick = () => setZoom(fitZoom());
scroller.addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    setZoom(ZOOM * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
  }
}, { passive: false });
window.addEventListener('resize', layoutStage);
scroller.addEventListener('scroll', () => updateStatus(true), { passive: true });
let wcT;
function updateStatus(pageOnly) {
  const pg = Math.min(NPAGES, Math.max(1, Math.floor((scroller.scrollTop / ZOOM - 24 + scroller.clientHeight / ZOOM / 3) / PP) + 1));
  $('#stPage').textContent = `Page ${pg} of ${NPAGES}`;
  if (pageOnly) return;
  clearTimeout(wcT);
  wcT = setTimeout(() => {
    const t = (ed.innerText || '').trim();
    const n = t ? t.split(/\s+/).length : 0;
    $('#stWords').textContent = n + (n === 1 ? ' word' : ' words');
    const first = (ed.innerText || '').trim().split('\n')[0].trim();
    $('#docTitle').textContent = first ? first.slice(0, 80) : 'Document';
  }, 300);
}

/* ================= file menu & opening files ================= */
/* title bar and ribbon tabs */
$('.qa').addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
$('.qa').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cmd]');
  if (b) exec(b.dataset.cmd);
});
$('#qSave').onclick = () => saveFile(docName() + '.chemword.json', JSON.stringify(projectObj()));
$('#qPdf').onclick = () => exportPDF();
function showTab(name) {
  $$('.tabs [data-tab]').forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === name));
  $$('#rib .pane').forEach((p) => (p.hidden = p.dataset.pane !== name));
}
$$('.tabs [data-tab]').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
$('.tabs').addEventListener('mousedown', (e) => { if (e.target.closest('[data-tab]')) e.preventDefault(); });
$('#vZoomIn').onclick = () => $('#zIn').click();
$('#vZoomOut').onclick = () => $('#zOut').click();
$('#vFit').onclick = () => $('#zFit').click();
$('#v100').onclick = () => setZoom(1);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 's' && cdm.hidden) {
    e.preventDefault();
    $('#qSave').click();
  }
});

$('#mFile').addEventListener('click', (e) => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  const f = b.dataset.f;
  if (f === 'new') {
    if (!b.dataset.armed) {
      b.dataset.armed = 1;
      b.textContent = 'Click again to clear the document';
      setTimeout(() => { b.textContent = 'New blank document'; delete b.dataset.armed; }, 3500);
      return;
    }
    closeMenus();
    loadDoc(null);
    saveNow();
    toast('New blank document');
    return;
  }
  closeMenus();
  if (f === 'open') $('#fileIn').click();
  else if (f === 'save') saveFile(docName() + '.chemword.json', JSON.stringify(projectObj()));
  else if (f === 'pdf') exportPDF();
  else if (f === 'docx') exportDOCX();
  else if (f === 'chemsketch') window.open('sketch.html', '_blank');
});
$('#optPn').addEventListener('change', (e) => { OPTS.pn = e.target.checked; drawPages(NPAGES); save(); });
$('#optChem').addEventListener('change', (e) => { OPTS.autoChem = e.target.checked; save(); });

async function openAny(fl) {
  const buf = await fl.arrayBuffer();
  const sig = String.fromCharCode(...new Uint8Array(buf.slice(0, 5)));
  if (sig.startsWith('PK')) return openDocx(buf);
  if (sig.startsWith('%PDF')) {
    const txt = new TextDecoder('iso-8859-1').decode(buf);
    const i = txt.lastIndexOf('%CHEMWORD-BEGIN '), j = i < 0 ? -1 : txt.indexOf('%CHEMWORD-END', i);
    if (i < 0 || j < 0) {
      toast('This PDF has no ChemWord data (made elsewhere), so it cannot be edited. Open the .docx or project file instead.', 7000);
      return;
    }
    return openProject(JSON.parse(b64d(txt.slice(i + 16, j).trim())), 'Opened. Everything is editable, drawings included.');
  }
  return openProject(JSON.parse(new TextDecoder().decode(buf)), 'Project opened');
}
$('#fileIn').onchange = (e) => {
  const fl = e.target.files[0];
  e.target.value = '';
  if (!fl) return;
  openAny(fl).catch((x) => toast('Could not open that file: ' + ((x && x.message) || 'unknown format'), 5000));
};
