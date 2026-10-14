'use strict';
/* Word (.docx) export and import. Drawings are embedded as SVG (sharp in Word 2016 and later)
   with a PNG fallback for older readers. The ChemWord project is stored inside the .docx so it
   can be reopened with drawings still editable. */

const JSZIP_SRC = 'js/vendor/jszip.min.js', MAMMOTH_SRC = 'js/vendor/mammoth.browser.min.js';
const XE = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const _cc = document.createElement('canvas').getContext('2d');
function hexOf(c) {
  if (!c || c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c)) return null;
  _cc.fillStyle = '#000000';
  _cc.fillStyle = c;
  const v = _cc.fillStyle;
  if (v[0] === '#') return v.slice(1).toUpperCase();
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if (!m || (m[4] != null && +m[4] === 0)) return null;
  return [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
}
const BLOCK = /^(P|DIV|H[1-6]|UL|OL|LI|TABLE|BLOCKQUOTE|HR|FIGURE|PRE|TBODY|THEAD|TR)$/;

function svgToPNG(svg, w, h) {
  return CS.Export.svgToCanvas(svg, w, h, 1).then((c) => new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG failed'))), 'image/png')));
}

async function exportDOCX() {
  if (busy) return;
  busy = true;
  toast('Preparing the Word file…', 30000);
  try {
    await loadScript(JSZIP_SRC);
    clearPB();
    const media = [];
    let nImg = 0, nDoc = 0;
    const nums = [];

    // one inline picture; svg (optional) is the sharp version, png the fallback
    async function imgRun(pngP, wpx, hpx, svgText) {
      const png = await pngP;
      nImg++;
      const id = 'rIdImg' + nImg;
      media.push({ name: `image${nImg}.png`, blob: png, id });
      let ext = '';
      if (svgText) {
        const sid = 'rIdSvg' + nImg;
        media.push({ name: `image${nImg}.svg`, blob: new Blob([svgText], { type: 'image/svg+xml' }), id: sid });
        ext = `<a:extLst><a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}"><asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="${sid}"/></a:ext></a:extLst>`;
      }
      nDoc++;
      const cx = Math.round(wpx * 9525), cy = Math.round(hpx * 9525);
      return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${nDoc}" name="Picture ${nDoc}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${nDoc}" name="image${nImg}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}">${ext}</a:blip><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    }
    function pngFromImg(el) {
      return new Promise((res) => {
        const c = document.createElement('canvas');
        c.width = el.naturalWidth || el.width;
        c.height = el.naturalHeight || el.height;
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(el, 0, 0);
        c.toBlob((b) => res(b), 'image/png');
      });
    }
    function rpr(st) {
      let s = '';
      if (st.font) s += `<w:rFonts w:ascii="${XE(st.font)}" w:hAnsi="${XE(st.font)}" w:cs="${XE(st.font)}"/>`;
      if (st.b) s += '<w:b/>';
      if (st.i) s += '<w:i/>';
      if (st.s) s += '<w:strike/>';
      if (st.color) s += `<w:color w:val="${st.color}"/>`;
      if (st.sz) s += `<w:sz w:val="${st.sz}"/><w:szCs w:val="${st.sz}"/>`;
      if (st.u) s += '<w:u w:val="single"/>';
      if (st.hl) s += `<w:shd w:val="clear" w:color="auto" w:fill="${st.hl}"/>`;
      if (st.va) s += `<w:vertAlign w:val="${st.va}"/>`;
      return s ? `<w:rPr>${s}</w:rPr>` : '';
    }
    function inlineStyle(el, st) {
      st = { ...st };
      const t = el.tagName, cs = el.style;
      if (t === 'B' || t === 'STRONG') st.b = 1;
      if (t === 'I' || t === 'EM') st.i = 1;
      if (t === 'U') st.u = 1;
      if (t === 'S' || t === 'STRIKE' || t === 'DEL') st.s = 1;
      if (t === 'SUB') st.va = 'subscript';
      if (t === 'SUP') st.va = 'superscript';
      if (t === 'FONT') {
        if (el.getAttribute('face')) st.font = famLabel(el.getAttribute('face'));
        if (el.getAttribute('color')) st.color = hexOf(el.getAttribute('color'));
        const z = +el.getAttribute('size');
        if (z) st.sz = [0, 16, 20, 24, 28, 36, 48, 72][z];
      }
      if (cs) {
        if (/bold|[6-9]00/.test(cs.fontWeight)) st.b = 1;
        else if (cs.fontWeight === 'normal' || cs.fontWeight === '400') st.b = 0;
        if (cs.fontStyle === 'italic') st.i = 1;
        const td = (cs.textDecoration || '') + ' ' + (cs.textDecorationLine || '');
        if (/underline/.test(td)) st.u = 1;
        if (/line-through/.test(td)) st.s = 1;
        if (cs.color) st.color = hexOf(cs.color) || st.color;
        if (cs.backgroundColor) { const h = hexOf(cs.backgroundColor); if (h) st.hl = h; }
        if (cs.fontFamily) st.font = famLabel(cs.fontFamily);
        if (cs.fontSize) {
          const m = cs.fontSize.match(/([\d.]+)(pt|px)/);
          if (m) st.sz = Math.round((m[2] === 'pt' ? +m[1] : +m[1] * PX2PT) * 2);
        }
        if (cs.verticalAlign === 'sub') st.va = 'subscript';
        if (cs.verticalAlign === 'super') st.va = 'superscript';
      }
      return st;
    }
    async function runs(nodes, st) {
      let out = '';
      for (const n of nodes) {
        if (n.nodeType === 3) {
          const t = n.nodeValue.replace(/[\r\n\t]+/g, ' ');
          if (t) out += `<w:r>${rpr(st)}<w:t xml:space="preserve">${XE(t)}</w:t></w:r>`;
          continue;
        }
        if (n.nodeType !== 1) continue;
        const t = n.tagName;
        if (t === 'BR') { if (n.nextSibling || n.parentElement.lastChild !== n) out += '<w:r><w:br/></w:r>'; continue; }
        if (t === 'IMG') {
          if (n.complete && n.naturalWidth) out += await imgRun(pngFromImg(n), n.offsetWidth || n.naturalWidth, n.offsetHeight || n.naturalHeight);
          continue;
        }
        if (t === 'FIGURE' || t === 'SVG' || n.classList.contains('cui')) continue;
        out += await runs(n.childNodes, inlineStyle(n, st));
      }
      return out;
    }
    function ppr(o) {
      let s = '';
      if (o.style) s += `<w:pStyle w:val="${o.style}"/>`;
      if (o.num) s += `<w:numPr><w:ilvl w:val="${o.num.lvl}"/><w:numId w:val="${o.num.id}"/></w:numPr>`;
      if (o.bdr) s += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr>';
      if (o.line || o.after != null) s += `<w:spacing${o.after != null ? ` w:after="${o.after}"` : ''}${o.line ? ` w:line="${Math.round(240 * o.line)}" w:lineRule="auto"` : ''}/>`;
      if (o.ind) s += `<w:ind w:left="${o.ind}"/>`;
      if (o.jc) s += `<w:jc w:val="${o.jc}"/>`;
      return s ? `<w:pPr>${s}</w:pPr>` : '';
    }
    function paraOpts(el, base) {
      const o = { ...base }, cs = el.style;
      const ta = cs.textAlign || el.getAttribute('align');
      if (ta) o.jc = { left: 'left', center: 'center', right: 'right', justify: 'both', start: 'left', end: 'right' }[ta] || o.jc;
      if (cs.lineHeight && !/px|pt/.test(cs.lineHeight) && +cs.lineHeight) o.line = +cs.lineHeight;
      const ml = parseFloat(cs.marginLeft) || 0, pl = parseFloat(cs.paddingLeft) || 0;
      if (el.tagName !== 'FIGURE' && (ml || pl)) o.ind = (o.ind || 0) + Math.round((ml + pl) * 15);
      if (/^H[1-3]$/.test(el.tagName)) o.style = 'Heading' + el.tagName[1];
      return o;
    }
    const P = (o, r) => `<w:p>${ppr(o)}${r}</w:p>`;
    async function flow(nodes, base, st) {
      let out = '', pend = [];
      const flush = async () => {
        if (!pend.length) return;
        const r = await runs(pend, st);
        if (r || pend.some((n) => n.nodeType === 1 && n.tagName === 'BR')) out += P(base, r);
        pend = [];
      };
      for (const n of nodes) {
        if (n.nodeType === 1 && BLOCK.test(n.tagName)) { await flush(); out += await block(n, base, st); }
        else if (n.nodeType === 3 && !n.nodeValue.trim() && !pend.length) continue;
        else pend.push(n);
      }
      await flush();
      return out;
    }
    async function block(el, base, st) {
      const t = el.tagName;
      if (t === 'HR') return el.classList.contains('pb') ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : P({ ...base, bdr: 1 }, '');
      if (t === 'FIGURE' && el.classList.contains('chem')) {
        const { w, h, ml } = figBox(el);
        const d = drawingFor(el);
        const png = svgToPNG(figureSVG(d, w, h, { embedFonts: true, background: true }).svg, w * 3.125, h * 3.125);
        return P({ ...base, ind: (base.ind || 0) + Math.round(ml * 15) }, await imgRun(png, w, h, figureSVG(d, w, h).svg));
      }
      if (t === 'UL' || t === 'OL') {
        const lvl = base.num ? base.num.lvl + 1 : 0;
        let id;
        if (t === 'UL') id = 1;
        else { id = 3 + nums.length; nums.push(id); }
        if (base.num && t === 'OL' && base.num.id !== 1) id = base.num.id;
        let out = '';
        for (const li of el.children) {
          if (li.tagName !== 'LI') { out += await block(li, base, st); continue; }
          const o = { ...paraOpts(li, { ...base, ind: undefined }), num: { lvl: Math.min(8, lvl), id } };
          delete o.ind;
          const inl = [], sub = [];
          for (const n of li.childNodes) {
            if (n.nodeType === 1 && (n.tagName === 'UL' || n.tagName === 'OL')) sub.push(n);
            else inl.push(n);
          }
          const hasBlock = inl.some((n) => n.nodeType === 1 && BLOCK.test(n.tagName));
          out += hasBlock ? await flow(inl, o, st) : P(o, await runs(inl, st));
          for (const s of sub) out += await block(s, { ...base, num: { lvl, id } }, st);
        }
        return out;
      }
      if (t === 'TABLE') {
        const rows = [...el.rows];
        const cols = Math.max(1, ...rows.map((r) => [...r.cells].reduce((a, c) => a + (c.colSpan || 1), 0)));
        const gw = Math.floor(9026 / cols);
        let x = `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
          .map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('')}</w:tblBorders><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid>${('<w:gridCol w:w="' + gw + '"/>').repeat(cols)}</w:tblGrid>`;
        for (const r of rows) {
          x += '<w:tr>';
          for (const c of r.cells) {
            const sp = c.colSpan || 1;
            let inner = await flow([...c.childNodes], { after: 0 }, inlineStyle(c, st));
            if (!inner) inner = '<w:p/>';
            x += `<w:tc><w:tcPr><w:tcW w:w="${gw * sp}" w:type="dxa"/>${sp > 1 ? `<w:gridSpan w:val="${sp}"/>` : ''}</w:tcPr>${inner}</w:tc>`;
          }
          x += '</w:tr>';
        }
        return x + '</w:tbl>';
      }
      if (t === 'TBODY' || t === 'THEAD' || t === 'TR') return flow([...el.childNodes], base, st);
      if (t === 'BLOCKQUOTE') {
        const o = { ...base, ind: (base.ind || 0) + Math.round((parseFloat(el.style.marginLeft) || 40) * 15) };
        return flow([...el.childNodes], o, st);
      }
      const o = paraOpts(el, { ...base, style: undefined, num: base.num });
      const st2 = inlineStyle(el, st);
      const kids = [...el.childNodes];
      if (kids.some((n) => n.nodeType === 1 && BLOCK.test(n.tagName))) return flow(kids, o, st2);
      return P(o, await runs(kids, st2));
    }

    const body = await flow([...ed.childNodes], {}, {});
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
    const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    const doc = `${H}<w:document ${NS}><w:body>${body}<w:p/><w:sectPr>${OPTS.pn ? '<w:footerReference w:type="default" r:id="rIdFtr"/>' : ''}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const hd = (id, sz, col, bef) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="heading ${id.slice(-1)}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="${bef}" w:after="80"/><w:outlineLvl w:val="${+id.slice(-1) - 1}"/></w:pPr><w:rPr><w:color w:val="${col}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr></w:style>`;
    const styles = `${H}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${hd('Heading1', 32, '2F5496', 240)}${hd('Heading2', 26, '2F5496', 200)}${hd('Heading3', 24, '1F3763', 160)}
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style></w:styles>`;
    const lvls = (fmt) => Array.from({ length: 9 }, (_, l) => {
      const bullet = ['•', 'o', '▪'][l % 3];
      return `<w:lvl w:ilvl="${l}"><w:start w:val="1"/><w:numFmt w:val="${fmt === 'bullet' ? 'bullet' : ['decimal', 'lowerLetter', 'lowerRoman'][l % 3]}"/><w:lvlText w:val="${fmt === 'bullet' ? bullet : '%' + (l + 1) + '.'}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (l + 1)}" w:hanging="360"/></w:pPr>${fmt === 'bullet' && l % 3 !== 1 ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr>' : ''}</w:lvl>`;
    }).join('');
    const numbering = `${H}<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${lvls('bullet')}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${lvls('decimal')}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>${nums
      .map((id) => `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('')}</w:numbering>`;
    const footer = `${H}<w:ftr ${NS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
    const RT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const drels = `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="${RT}/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="${RT}/numbering" Target="numbering.xml"/>${OPTS.pn ? `<Relationship Id="rIdFtr" Type="${RT}/footer" Target="footer1.xml"/>` : ''}${media
      .map((m) => `<Relationship Id="${m.id}" Type="${RT}/image" Target="media/${m.name}"/>`).join('')}</Relationships>`;
    const ct = `${H}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="svg" ContentType="image/svg+xml"/><Default Extension="json" ContentType="application/json"/><Default Extension="txt" ContentType="text/plain"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>${OPTS.pn ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ''}</Types>`;
    const zip = new window.JSZip();
    zip.file('[Content_Types].xml', ct);
    zip.file('_rels/.rels', `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.file('word/document.xml', doc);
    zip.file('chemword/project.json', JSON.stringify(projectObj()));
    zip.file('chemword/docxml.hash.txt', hashBytes(new TextEncoder().encode(doc)));
    zip.file('word/styles.xml', styles);
    zip.file('word/numbering.xml', numbering);
    zip.file('word/_rels/document.xml.rels', drels);
    if (OPTS.pn) zip.file('word/footer1.xml', footer);
    for (const m of media) zip.file('word/media/' + m.name, m.blob);
    const blob = await zip.generateAsync({ type: 'blob', mimeType: MIME.docx });
    reflow();
    await saveFile(docName() + '.docx', blob);
  } catch (e) {
    reflow();
    toast('Word export failed: ' + e.message, 5000);
  } finally {
    busy = false;
  }
}

/* ---------- opening .docx files ---------- */
async function importWord(buf) {
  await loadScript(MAMMOTH_SRC);
  const r = await window.mammoth.convertToHtml({ arrayBuffer: buf });
  openProject({ v: 1, html: sanitizeDoc(r.value) || '<p><br></p>', draws: {}, opts: { pn: false } },
    'Opened the Word file. Drawings in it are now pictures; use Insert → Structure to draw new ones.');
}
async function openDocx(buf) {
  await loadScript(JSZIP_SRC);
  const zip = await window.JSZip.loadAsync(buf);
  const pj = zip.file('chemword/project.json');
  if (!pj) {
    if (!zip.file('word/document.xml')) throw new Error('not a Word file');
    return importWord(buf);
  }
  const o = JSON.parse(await pj.async('string'));
  // older exports named the fingerprint file docxml.sha256.txt
  const st = zip.file('chemword/docxml.hash.txt') || zip.file('chemword/docxml.sha256.txt'), dx = zip.file('word/document.xml');
  const edited = !!(st && dx) && hashBytes(await dx.async('uint8array')) !== (await st.async('string')).trim();
  if (!edited) return openProject(o, 'Opened. Everything is editable, drawings included.');
  return choose('This Word file was changed outside ChemWord', 'Pick which version to open.', [
    ['Open the ChemWord version', 'Drawings stay editable. Changes made in Word are not included.', () => openProject(o, 'Opened the ChemWord version.')],
    ['Open the Word version', 'Keeps the changes made in Word. Drawings become pictures.', () => importWord(buf).catch((e) => toast('Could not open: ' + e.message, 5000))]
  ]);
}
