'use strict';
/* ChemWord shared helpers: DOM shortcuts, toasts, page geometry, saving files, encoding. */

// A4 page at 96 dpi (px). MT = top/bottom margin, CW/CH = content box, PP = page pitch on the desk.
const PW = 794, PH = 1123, GAP = 28, PP = PH + GAP, MT = 96, CH = PH - 192, CW = 602;
const PX2PT = 0.75;
let ZOOM = 1, NPAGES = 1;
let DRAW = {}, OPTS = { pn: false, autoChem: true };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ed = $('#doc'), paper = $('#paper'), stage = $('#stage'), scroller = $('#scroller');

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.hidden = true), ms);
}

const slug = (s) =>
  String(s || 'document').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'document';

function docName() {
  for (const el of ed.children) {
    const t = (el.innerText || '').trim();
    if (t) return slug(t.split('\n')[0]);
  }
  return 'document';
}

// Scripts are bundled in ../js/vendor and loaded on first use, so everything works offline.
function loadScript(src) {
  return new Promise((res, rej) => {
    if ($(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('could not load ' + src.split('/').pop()));
    document.head.appendChild(s);
  });
}

/* ---------- saving files ---------- */
// When ChemWord runs inside a host that offers a downloads capability (e.g. a Claude artifact), use it.
let _dl = null;
async function dlCap() {
  if (_dl) return _dl;
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const d = await window.claude.use('downloads');
      if (d) _dl = d;
    }
  } catch (e) { /* not available */ }
  return _dl;
}
dlCap();
const FRAMED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const MIME = {
  pdf: 'application/pdf', json: 'application/json', png: 'image/png', svg: 'image/svg+xml',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
function toBlob(name, data) {
  if (data instanceof Blob) return data;
  const ext = name.split('.').pop().toLowerCase();
  return new Blob([data], { type: MIME[ext] || 'application/octet-stream' });
}
function anchorSave(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}
async function saveFile(name, data) {
  const blob = toBlob(name, data);
  const dl = await dlCap();
  if (dl) {
    try {
      await dl.save({ filename: name, data: blob });
      toast('Saved ' + name);
      return;
    } catch (e) {
      const c = e && e.code;
      if (c === 'declined') return toast('Save cancelled');
      if (c === 'rate_limited') return toast('A save prompt is already open. Finish it first.');
      if (c === 'too_large') return toast('That file is too large to save here.', 5000);
    }
  }
  if (!FRAMED) {
    anchorSave(name, blob);
    toast('Downloaded ' + name);
    return;
  }
  noSaveSheet(name, blob);
}
function noSaveSheet(name, blob) {
  const url = URL.createObjectURL(blob);
  const d = document.createElement('div');
  d.className = 'sheet';
  d.innerHTML = `<div><b>This window may block downloads</b>
    <p class="hint" style="white-space:normal;margin:0">ChemWord is running inside another page that may not allow saving files. Try the link below, or open ChemWord directly in your browser and export from there.</p>
    <div style="display:grid;gap:8px"><a class="b pri" href="${url}" download="${esc(name)}" style="text-decoration:none">Download ${esc(name)}</a><button class="b">Close</button></div></div>`;
  d.querySelector('button').onclick = () => { d.remove(); URL.revokeObjectURL(url); };
  d.onclick = (e) => { if (e.target === d) d.remove(); };
  document.body.appendChild(d);
}

/* ---------- encoding ---------- */
const b64e = (s) => {
  const u = new TextEncoder().encode(s);
  let o = '';
  for (let i = 0; i < u.length; i += 8192) o += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
  return btoa(o);
};
const b64d = (b) => {
  const bin = atob(b);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(u);
};
// Fingerprint (FNV-style) used to detect whether a .docx was edited in Word after export.
function hashBytes(buf) {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let h1 = 0x811c9dc5, h2 = 0x01000193 ^ u.length;
  for (let i = 0; i < u.length; i++) {
    h1 = Math.imul(h1 ^ u[i], 16777619);
    h2 = Math.imul(h2 ^ u[i], 2246822519) ^ (h2 >>> 13);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0') + u.length.toString(16);
}

function choose(title, text, opts) {
  const d = document.createElement('div');
  d.className = 'sheet';
  d.innerHTML = `<div><b>${esc(title)}</b><p class="hint" style="white-space:normal;margin:0">${esc(text)}</p><div style="display:grid;gap:8px">${opts
    .map((o, i) => `<button class="b${i ? '' : ' pri'}" data-i="${i}" style="height:auto;padding:10px 12px;text-align:left;justify-content:flex-start;white-space:normal"><span><b>${esc(o[0])}</b><br><span style="font-weight:400">${esc(o[1])}</span></span></button>`)
    .join('')}<button class="b" data-i="x">Cancel</button></div></div>`;
  d.addEventListener('click', (e) => {
    const b = e.target.closest('[data-i]');
    if (!b && e.target !== d) return;
    d.remove();
    if (b && b.dataset.i !== 'x') opts[+b.dataset.i][2]();
  });
  document.body.appendChild(d);
}
