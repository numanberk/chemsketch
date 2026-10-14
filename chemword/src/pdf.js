'use strict';
/* Vector PDF export. The browser has already laid out every page; this reads the position of each
   word, line, border and picture and writes it into the PDF with the same (embedded) fonts, so the
   PDF matches the screen, text is sharp and selectable, and drawings stay vector graphics.
   The project is appended to the file so it can be reopened and edited in ChemWord. */

// CSS family (first entry) -> embedded PDF font
const PDF_FONT = {
  docsans: 'DocSans', calibri: 'DocSans', carlito: 'DocSans',
  chemsans: 'ChemSans', arial: 'ChemSans', arimo: 'ChemSans', helvetica: 'ChemSans',
  chemserif: 'ChemSerif', 'times new roman': 'ChemSerif', tinos: 'ChemSerif', times: 'ChemSerif',
  docserif: 'DocSerif', cambria: 'DocSerif', caladea: 'DocSerif', georgia: 'DocSerif',
  chemmono: 'ChemMono', 'courier new': 'ChemMono', cousine: 'ChemMono', courier: 'ChemMono'
};
const FALLBACK_FONTS = ['ChemSans', 'ChemSerif', 'DocSans', 'DocSerif', 'ChemSymbols'];

let busy = false;

function cssColor(c) {
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(c || '');
  if (!m || (m[4] != null && +m[4] === 0)) return null;
  return [+m[1], +m[2], +m[3]];
}

async function exportPDF() {
  if (busy) return;
  busy = true;
  toast('Preparing the PDF…', 30000);
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    $$('.isel', ed).forEach((x) => x.classList.remove('isel'));
    reflow();
    const bytes = await buildPDF();
    // append the project after %%EOF (PDF readers ignore it) and repeat the xref pointer
    const tail = new TextDecoder('iso-8859-1').decode(bytes.slice(-200));
    const sx = (tail.match(/startxref\s+(\d+)\s+%%EOF\s*$/) || [])[1];
    const extra = new TextEncoder().encode('\n%CHEMWORD-BEGIN ' + b64e(JSON.stringify(projectObj())) + '\n%CHEMWORD-END\n' + (sx ? 'startxref\n' + sx + '\n%%EOF\n' : ''));
    const out = new Uint8Array(bytes.length + extra.length);
    out.set(bytes);
    out.set(extra, bytes.length);
    await saveFile(docName() + '.pdf', out.buffer);
  } catch (e) {
    console.error(e);
    toast('PDF export failed: ' + e.message, 5000);
  } finally {
    busy = false;
  }
}

async function buildPDF() {
  const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });
  CS.Export.registerPdfFonts(pdf, window.CS_FONT_DATA);
  CS.Export.registerPdfFonts(pdf, window.CS_DOC_FONT_DATA);
  pdf.setProperties({ title: docName(), creator: 'ChemWord' });
  for (let i = 1; i < NPAGES; i++) pdf.addPage('a4', 'portrait');

  const P = paper.getBoundingClientRect();
  // client rect -> {page, x, y, w, h} in pt on that page
  const place = (r, refY) => {
    const x = (r.left - P.left) / ZOOM, y = (r.top - P.top) / ZOOM;
    const page = Math.max(0, Math.min(NPAGES - 1, Math.floor(((refY == null ? y : refY) + 1) / PP)));
    return { page, x: x * PX2PT, y: (y - page * PP) * PX2PT, w: (r.width / ZOOM) * PX2PT, h: (r.height / ZOOM) * PX2PT };
  };
  let curPage = -1;
  const onPage = (n) => { if (n !== curPage) { pdf.setPage(n + 1); curPage = n; } };

  const skip = (el) => el.closest('figure.chem') || el.closest('hr.pb');
  const all = [...ed.querySelectorAll('*')].filter((el) => !skip(el));

  // 1. backgrounds (cell shading, highlighted text)
  for (const el of all) {
    const bg = cssColor(getComputedStyle(el).backgroundColor);
    if (!bg) continue;
    for (const r of el.getClientRects()) {
      const b = place(r);
      onPage(b.page);
      pdf.setFillColor(...bg);
      pdf.rect(b.x, b.y, b.w, b.h, 'F');
    }
  }

  // 2. pictures
  for (const img of $$('img', ed)) {
    if (!/^data:image\/(png|jpe?g)/i.test(img.src)) continue;
    const b = place(img.getBoundingClientRect());
    onPage(b.page);
    pdf.addImage(img.src, /png/i.test(img.src.slice(0, 20)) ? 'PNG' : 'JPEG', b.x, b.y, b.w, b.h);
  }

  // 3. drawings (vector, via svg2pdf)
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-12000px;top:0;width:10px;height:10px;overflow:hidden';
  document.body.appendChild(host);
  try {
    for (const f of $$('figure.chem', ed)) {
      const d = drawingFor(f);
      if (isEmptyDrawing(d)) continue;
      const { w, h } = figBox(f);
      const b = place(f.getBoundingClientRect());
      onPage(b.page);
      host.innerHTML = figureSVG(d, w, h).svg;
      await window.svg2pdf.svg2pdf(host.firstChild, pdf, { x: b.x, y: b.y, width: w * PX2PT, height: h * PX2PT });
    }
  } finally {
    host.remove();
  }

  // 4. borders (tables, rules)
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'inline') continue;
    const b = place(el.getBoundingClientRect());
    const sides = [
      ['Top', b.x, b.y, b.x + b.w, b.y], ['Bottom', b.x, b.y + b.h, b.x + b.w, b.y + b.h],
      ['Left', b.x, b.y, b.x, b.y + b.h], ['Right', b.x + b.w, b.y, b.x + b.w, b.y + b.h]
    ];
    for (const [s, x1, y1, x2, y2] of sides) {
      const wpx = parseFloat(cs['border' + s + 'Width']);
      if (!wpx || cs['border' + s + 'Style'] === 'none' || cs['border' + s + 'Style'] === 'hidden') continue;
      const col = cssColor(cs['border' + s + 'Color']);
      if (!col) continue;
      onPage(b.page);
      pdf.setDrawColor(...col);
      pdf.setLineWidth(wpx * PX2PT);
      pdf.line(x1, y1, x2, y2);
    }
  }

  // 5. list bullets and numbers
  for (const li of $$('li', ed)) {
    const list = li.parentElement;
    const first = firstLineRect(li);
    if (!first) continue;
    const cs = getComputedStyle(li);
    let marker;
    if (list.tagName === 'OL') {
      const items = [...list.children].filter((x) => x.tagName === 'LI');
      marker = (parseInt(list.getAttribute('start'), 10) || 1) + items.indexOf(li) + '.';
    } else {
      let depth = 0;
      for (let p = list.parentElement; p && p !== ed; p = p.parentElement) if (p.tagName === 'UL' || p.tagName === 'OL') depth++;
      marker = ['•', '◦', '▪'][depth % 3];
    }
    const sizePx = parseFloat(cs.fontSize);
    const font = list.tagName === 'OL' ? pdfFont(cs) : { name: 'ChemSans', style: 'normal' };
    const b = place(first.rect, first.y);
    const liLeft = place(li.getBoundingClientRect()).x;
    onPage(b.page);
    pdf.setFont(font.name, font.style);
    pdf.setFontSize(sizePx * PX2PT);
    pdf.setTextColor(...(cssColor(cs.color) || [0, 0, 0]));
    const mw = pdf.getTextWidth(marker);
    pdf.text(marker, liLeft - 6 * PX2PT - mw, b.y + first.ascent * PX2PT);
  }

  // 6. text, word by word, at the browser's positions
  const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!el || skip(el) || !/\S/.test(node.data)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    drawTextNode(pdf, node, cs, place, onPage);
  }

  // 7. page numbers
  if (OPTS.pn) {
    pdf.setFont('DocSans', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    for (let i = 0; i < NPAGES; i++) {
      onPage(i);
      pdf.text(String(i + 1), (PW * PX2PT) / 2, (PH - 50) * PX2PT, { align: 'center' });
    }
  }
  return new Uint8Array(pdf.output('arraybuffer'));
}

function pdfFont(cs) {
  const first = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase();
  const bold = parseInt(cs.fontWeight, 10) >= 600 || cs.fontWeight === 'bold';
  const italic = cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';
  return { name: PDF_FONT[first] || 'DocSans', style: bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal' };
}

// distance from the top of a text box to its baseline, for the font actually used on screen
const _mctx = document.createElement('canvas').getContext('2d');
const _asc = new Map();
function ascentPx(cs) {
  const key = cs.fontStyle + cs.fontWeight + cs.fontSize + cs.fontFamily;
  if (!_asc.has(key)) {
    _mctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = _mctx.measureText('Hg');
    _asc.set(key, m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.9);
  }
  return _asc.get(key);
}

function firstLineRect(li) {
  const w = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (!/\S/.test(n.data) || n.parentElement.closest('li') !== li) continue; // skip nested lists
    const r = document.createRange();
    r.selectNodeContents(n);
    const rect = r.getClientRects()[0];
    if (rect) return { rect, y: (rect.top - paper.getBoundingClientRect().top) / ZOOM, ascent: ascentPx(getComputedStyle(n.parentElement)) };
  }
  return null;
}

// does the embedded font have a glyph for this character?
const _cmaps = new Map();
function hasGlyph(pdf, name, style, ch) {
  const key = name + style;
  if (!_cmaps.has(key)) {
    pdf.setFont(name, style);
    const f = pdf.getFont();
    const map = f && f.metadata && f.metadata.cmap && f.metadata.cmap.unicode && f.metadata.cmap.unicode.codeMap;
    _cmaps.set(key, map || null);
  }
  const map = _cmaps.get(key);
  return !map || map[ch.codePointAt(0)] > 0;
}

function decorations(el) {
  const out = { u: false, s: false };
  for (let e = el; e && e !== ed; e = e.parentElement) {
    const d = getComputedStyle(e).textDecorationLine || '';
    if (/underline/.test(d)) out.u = true;
    if (/line-through/.test(d)) out.s = true;
    if (/^(P|LI|TD|TH|H[1-6]|DIV)$/.test(e.tagName)) break;
  }
  return out;
}

function drawTextNode(pdf, node, cs, place, onPage) {
  const font = pdfFont(cs), sizePx = parseFloat(cs.fontSize), sizePt = sizePx * PX2PT;
  const color = cssColor(cs.color) || [0, 0, 0];
  const asc = ascentPx(cs);
  const P = paper.getBoundingClientRect();
  const range = document.createRange();
  const re = /\S+/g;
  let m;
  pdf.setFontSize(sizePt);
  pdf.setTextColor(...color);
  while ((m = re.exec(node.data))) {
    // split the word where the main font lacks a glyph (e.g. arrows) and use a fallback font there
    const word = m[0];
    const segs = [];
    let i = 0;
    for (const ch of word) {
      let f = font.name, st = font.style;
      if (!hasGlyph(pdf, f, st, ch)) {
        const alt = FALLBACK_FONTS.find((n) => hasGlyph(pdf, n, 'normal', ch));
        if (alt) { f = alt; st = 'normal'; }
      }
      const last = segs[segs.length - 1];
      if (last && last.f === f && last.st === st) last.t += ch;
      else segs.push({ f, st, t: ch, start: m.index + i });
      i += ch.length;
    }
    for (const sg of segs) {
      range.setStart(node, sg.start);
      range.setEnd(node, sg.start + sg.t.length);
      const rects = range.getClientRects();
      if (!rects.length) continue;
      const r = rects[0];
      const top = (r.top - P.top) / ZOOM;
      const b = place(r, top + asc);
      onPage(b.page);
      pdf.setFont(sg.f, sg.st);
      pdf.setFontSize(sizePt);
      pdf.setTextColor(...color);
      if (rects.length === 1) pdf.text(sg.t, b.x, b.y + asc * PX2PT);
      else {
        // the word wraps inside itself (very long word): place each character
        let k = 0;
        for (const ch of sg.t) {
          range.setStart(node, sg.start + k);
          range.setEnd(node, sg.start + k + ch.length);
          const cr = range.getClientRects()[0];
          if (cr) {
            const cb = place(cr, (cr.top - P.top) / ZOOM + asc);
            onPage(cb.page);
            pdf.text(ch, cb.x, cb.y + asc * PX2PT);
          }
          k += ch.length;
        }
      }
    }
  }
  // underline / strike-through over whole line fragments of this text node
  const deco = decorations(node.parentElement);
  if (deco.u || deco.s) {
    range.selectNodeContents(node);
    pdf.setDrawColor(...color);
    pdf.setLineWidth(Math.max(0.4, sizePt * 0.06));
    for (const r of range.getClientRects()) {
      const top = (r.top - P.top) / ZOOM;
      const b = place(r, top + asc);
      onPage(b.page);
      const base = b.y + asc * PX2PT;
      if (deco.u) pdf.line(b.x, base + sizePt * 0.12, b.x + b.w, base + sizePt * 0.12);
      if (deco.s) pdf.line(b.x, base - sizePt * 0.28, b.x + b.w, base - sizePt * 0.28);
    }
  }
}
