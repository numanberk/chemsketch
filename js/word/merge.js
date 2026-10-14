'use strict';
/* Merge PDFs (File → Merge PDFs…). Add PDF files, and optionally the document that is open,
   put them in the order you want (drag the cards or use the arrows), optionally pick pages
   ("1-3, 5"), then save one combined PDF. Merging uses pdf-lib; the first-page previews use
   pdf.js running on the main thread, so it all works offline and from file://. */

const Merge = (() => {
  const PDFLIB_SRC = 'js/vendor/pdf-lib.min.js';
  const PDFJS_SRC = 'js/vendor/pdfjs.min.js', PDFJS_WORKER_SRC = 'js/vendor/pdfjs.worker.min.js';
  let items = [], sheet = null, dragFrom = -1, uid = 0;

  async function libs() {
    await loadScript(PDFLIB_SRC);
    try {
      // loading the worker as a plain script lets pdf.js run without a Web Worker (file:// safe)
      await loadScript(PDFJS_WORKER_SRC);
      await loadScript(PDFJS_SRC);
    } catch (e) { /* previews are optional */ }
  }

  // "1-3, 5, 8-" -> zero-based page indices; null when the text is invalid
  function parsePages(text, count) {
    const t = String(text || '').trim();
    if (!t || /^all$/i.test(t)) return [...Array(count).keys()];
    const out = [];
    for (const part of t.split(/[,;\s]+/).filter(Boolean)) {
      const m = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(part);
      if (!m || (!m[1] && !m[3])) return null;
      const a = m[1] ? +m[1] : 1, b = m[2] ? (m[3] ? +m[3] : count) : a;
      if (a < 1 || b > count || a > b) return null;
      for (let i = a; i <= b; i++) out.push(i - 1);
    }
    return out.length ? out : null;
  }

  async function thumbnail(bytes) {
    const lib = window.pdfjsLib;
    if (!lib) return null;
    try {
      const pdf = await lib.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
      const page = await pdf.getPage(1);
      const v = page.getViewport({ scale: 1 });
      const scale = 120 / Math.max(v.width, v.height);
      const vp = page.getViewport({ scale: scale * 2 });
      const c = document.createElement('canvas');
      c.width = Math.ceil(vp.width);
      c.height = Math.ceil(vp.height);
      const g = c.getContext('2d');
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: g, viewport: vp }).promise;
      pdf.destroy();
      return c.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  async function addBytes(name, bytes, isDoc) {
    const it = { id: ++uid, name, bytes, pages: '', count: 0, thumb: null, error: null, isDoc };
    items.push(it);
    render();
    await libs();
    try {
      const doc = await window.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
      it.count = doc.getPageCount();
    } catch (e) {
      it.error = 'Not a readable PDF';
    }
    it.thumb = await thumbnail(bytes);
    render();
  }

  async function addFiles(files) {
    for (const f of files) {
      if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { toast(f.name + ' is not a PDF'); continue; }
      await addBytes(f.name, new Uint8Array(await f.arrayBuffer()));
    }
  }

  async function addCurrentDocument() {
    if (items.some((x) => x.isDoc)) return toast('This document is already in the list');
    toast('Preparing this document…', 30000);
    $$('.isel', ed).forEach((x) => x.classList.remove('isel'));
    reflow();
    const bytes = await buildPDF();
    $('#toast').hidden = true;
    await addBytes('This document (' + docName() + ')', bytes, true);
  }

  function totalPages() {
    return items.reduce((n, it) => n + (it.count ? (parsePages(it.pages, it.count) || []).length : 0), 0);
  }

  function render() {
    if (!sheet) return;
    const list = sheet.querySelector('.mg-list');
    if (!items.length) {
      list.innerHTML = '<div class="mg-empty">Add the PDFs you want to combine (or drop them here).<br>Then drag them into the order you want.</div>';
    } else {
      list.innerHTML = items.map((it, i) => {
        const sel = it.count ? parsePages(it.pages, it.count) : null;
        const bad = it.count && it.pages.trim() && !sel;
        return `<div class="mg-item${it.error ? ' err' : ''}" draggable="true" data-i="${i}">
          <span class="mg-grip" title="Drag to reorder">⋮⋮</span>
          <span class="mg-n">${i + 1}</span>
          <div class="mg-thumb">${it.thumb ? `<img src="${it.thumb}" alt="">` : '<span>PDF</span>'}</div>
          <div class="mg-info"><div class="mg-name" title="${esc(it.name)}">${esc(it.name)}</div>
            <div class="mg-meta">${it.error ? esc(it.error) : it.count ? it.count + (it.count === 1 ? ' page' : ' pages') : 'reading…'}</div>
            ${it.count > 1 ? `<label class="mg-pages${bad ? ' bad' : ''}">Pages <input data-pages="${i}" value="${esc(it.pages)}" placeholder="all  (e.g. 1-3, 5)"></label>` : ''}</div>
          <div class="mg-btns"><button data-mv="-1" title="Move up" aria-label="Move up"${i ? '' : ' disabled'}>↑</button><button data-mv="1" title="Move down" aria-label="Move down"${i < items.length - 1 ? '' : ' disabled'}>↓</button><button data-rm title="Remove" aria-label="Remove">✕</button></div>
        </div>`;
      }).join('');
    }
    const n = totalPages();
    sheet.querySelector('.mg-total').textContent = items.length ? `${items.length} file${items.length > 1 ? 's' : ''} · ${n} page${n === 1 ? '' : 's'}` : '';
    sheet.querySelector('[data-go]').disabled = !items.some((it) => it.count) || !n;
  }

  function move(i, j) {
    if (j < 0 || j >= items.length || i === j) return;
    items.splice(j, 0, items.splice(i, 1)[0]);
    render();
  }

  async function merge() {
    const bad = items.find((it) => it.count && !parsePages(it.pages, it.count));
    if (bad) return toast('Check the pages of “' + bad.name + '” (e.g. 1-3, 5)', 4000);
    const out = await window.PDFLib.PDFDocument.create();
    for (const it of items) {
      if (!it.count) continue;
      const src = await window.PDFLib.PDFDocument.load(it.bytes, { ignoreEncryption: true });
      const pages = await out.copyPages(src, parsePages(it.pages, it.count));
      pages.forEach((p) => out.addPage(p));
    }
    out.setTitle(sheet.querySelector('.mg-file').value || 'Merged');
    out.setCreator('ChemWord');
    const bytes = await out.save();
    const name = (slug(sheet.querySelector('.mg-file').value) || 'merged') + '.pdf';
    await saveFile(name, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }

  function close() {
    if (sheet) sheet.remove();
    sheet = null;
    items = [];
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

  async function open() {
    closeMenus();
    close();
    sheet = document.createElement('div');
    sheet.className = 'sheet mg';
    sheet.innerHTML = `<div class="mg-box" role="dialog" aria-label="Merge PDFs">
      <div class="mg-head"><b>Merge PDFs</b><span class="mg-total"></span><button class="mg-x" data-close aria-label="Close">×</button></div>
      <div class="mg-add"><button class="b pri" data-add>+ Add PDFs</button><button class="b" data-doc>+ This document</button>
        <span class="hint">Order: drag the cards, or use ↑ ↓. Leave “Pages” empty to use every page.</span></div>
      <div class="mg-list"></div>
      <div class="mg-foot"><label class="mg-fname">File name <input class="mg-file" value="${esc(docName() === 'document' ? 'merged' : docName() + '-merged')}"></label>
        <span class="sp"></span><button class="b" data-close>Cancel</button><button class="b pri" data-go>Merge &amp; save PDF</button></div>
      <input type="file" class="mg-input" accept=".pdf,application/pdf" multiple hidden></div>`;
    document.body.appendChild(sheet);
    document.addEventListener('keydown', onKey, true);
    render();
    const input = sheet.querySelector('.mg-input');
    sheet.addEventListener('click', async (e) => {
      if (e.target === sheet || e.target.closest('[data-close]')) return close();
      if (e.target.closest('[data-add]')) return input.click();
      if (e.target.closest('[data-doc]')) return addCurrentDocument().catch((x) => toast('Could not add this document: ' + x.message, 5000));
      const card = e.target.closest('.mg-item'), i = card ? +card.dataset.i : -1;
      const mv = e.target.closest('[data-mv]');
      if (mv) return move(i, i + +mv.dataset.mv);
      if (e.target.closest('[data-rm]')) { items.splice(i, 1); return render(); }
      const go = e.target.closest('[data-go]');
      if (go) {
        go.disabled = true;
        go.textContent = 'Merging…';
        try { await merge(); close(); } catch (x) { toast('Merge failed: ' + x.message, 5000); go.disabled = false; go.textContent = 'Merge & save PDF'; }
      }
    });
    sheet.addEventListener('input', (e) => {
      const k = e.target.dataset.pages;
      if (k == null) return;
      items[+k].pages = e.target.value;
      const ok = !e.target.value.trim() || parsePages(e.target.value, items[+k].count);
      e.target.parentElement.classList.toggle('bad', !ok);
      const n = totalPages();
      sheet.querySelector('.mg-total').textContent = `${items.length} file${items.length > 1 ? 's' : ''} · ${n} page${n === 1 ? '' : 's'}`;
      sheet.querySelector('[data-go]').disabled = !n;
    });
    input.addEventListener('change', () => { const fs = [...input.files]; input.value = ''; addFiles(fs); });
    // drag cards to reorder; drop PDF files from the computer to add them
    const list = sheet.querySelector('.mg-list');
    list.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.mg-item');
      if (!card) return;
      dragFrom = +card.dataset.i;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(dragFrom));
    });
    list.addEventListener('dragend', () => { dragFrom = -1; $$('.mg-item', list).forEach((c) => c.classList.remove('dragging', 'over')); });
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      $$('.mg-item', list).forEach((c) => c.classList.remove('over'));
      const card = e.target.closest('.mg-item');
      if (card && dragFrom >= 0) card.classList.add('over');
    });
    list.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer && [...e.dataTransfer.files];
      if (files && files.length) return addFiles(files);
      const card = e.target.closest('.mg-item');
      if (card && dragFrom >= 0) move(dragFrom, +card.dataset.i);
      dragFrom = -1;
    });
    try { await libs(); } catch (e) { toast('Could not load the PDF tools: ' + e.message, 5000); }
  }

  return { open, parsePages, addFiles };
})();
