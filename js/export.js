/* Export: vector PDF (jsPDF + svg2pdf with embedded fonts), SVG, PNG, MOL/SMILES, project JSON. */
(function (CS) {
  'use strict';

  var FONT_FILES = [
    ['ChemSans', 'normal'], ['ChemSans', 'bold'], ['ChemSans', 'italic'], ['ChemSans', 'bolditalic'],
    ['ChemSerif', 'normal'], ['ChemSerif', 'bold'], ['ChemSerif', 'italic'], ['ChemSerif', 'bolditalic']
  ];

  // Load the bundled fonts into the document so canvas measuring and on-screen text match the PDF.
  function loadFonts() {
    var data = window.CS_FONT_DATA;
    if (!data || !window.FontFace) return Promise.resolve();
    var jobs = FONT_FILES.map(function (f) {
      var b64 = data[f[0] + '|' + f[1]];
      if (!b64) return null;
      var bin = atob(b64), buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      var face = new FontFace(f[0], buf.buffer, {
        weight: /bold/.test(f[1]) ? '700' : '400', style: /italic/.test(f[1]) ? 'italic' : 'normal'
      });
      return face.load().then(function (ff) { document.fonts.add(ff); });
    }).filter(Boolean);
    return Promise.all(jobs).then(function () { CS.Text.clearCache(); });
  }

  function fontFaceCSS(svgText) {
    var data = window.CS_FONT_DATA;
    if (!data) return '';
    var css = '';
    FONT_FILES.forEach(function (f) {
      if (svgText.indexOf(f[0]) < 0) return;
      css += '@font-face{font-family:"' + f[0] + '";font-weight:' + (/bold/.test(f[1]) ? 700 : 400) + ';font-style:' + (/italic/.test(f[1]) ? 'italic' : 'normal') +
        ';src:url(data:font/ttf;base64,' + data[f[0] + '|' + f[1]] + ') format("truetype");}';
    });
    return css;
  }

  function contentBBox(page) {
    var list = [];
    page.atoms.forEach(function (a) { list.push({ x: a.x - 8, y: a.y - 8, w: 16, h: 16 }); });
    page.objects.forEach(function (o) { var b = CS.R.objBBox(o); if (b) list.push(b); });
    return CS.bboxUnion(list);
  }

  // Build a standalone SVG string of a page. opts: crop (bool), margin, embedFonts, background
  function pageSVG(page, opts) {
    opts = opts || {};
    var body = CS.R.renderPage(page, { noCache: page !== CS.page(), cip: opts.cip });
    var x = 0, y = 0, w = page.width, h = page.height;
    if (opts.crop) {
      var bb = contentBBox(page) || { x: 0, y: 0, w: 10, h: 10 }, m = opts.margin == null ? 8 : opts.margin;
      x = bb.x - m; y = bb.y - m; w = bb.w + 2 * m; h = bb.h + 2 * m;
    }
    var bg = opts.background === false ? '' : '<rect x="' + CS.n(x) + '" y="' + CS.n(y) + '" width="' + CS.n(w) + '" height="' + CS.n(h) + '" fill="' + (opts.background || '#fff') + '"/>';
    var style = opts.embedFonts ? '<defs><style>' + fontFaceCSS(body) + '</style></defs>' : '';
    return {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="' + CS.n(w) + 'pt" height="' + CS.n(h) +
        'pt" viewBox="' + [CS.n(x), CS.n(y), CS.n(w), CS.n(h)].join(' ') + '">' + style + bg + body + '</svg>',
      x: x, y: y, w: w, h: h
    };
  }

  function registerPdfFonts(pdf) {
    var data = window.CS_FONT_DATA;
    if (!data) return;
    FONT_FILES.forEach(function (f) {
      var name = f[0] + '-' + f[1] + '.ttf';
      pdf.addFileToVFS(name, data[f[0] + '|' + f[1]]);
      pdf.addFont(name, f[0], f[1]);
    });
  }

  // pages: array of pages; opts: crop, filename
  function exportPDF(pages, opts) {
    opts = opts || {};
    var J = window.jspdf && window.jspdf.jsPDF;
    if (!J || !(window.svg2pdf && window.svg2pdf.svg2pdf)) return Promise.reject(new Error('PDF libraries failed to load'));
    var host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;width:10px;height:10px;overflow:hidden;';
    document.body.appendChild(host);
    var pdf = null;
    var chain = Promise.resolve();
    pages.forEach(function (page, i) {
      chain = chain.then(function () {
        var r = pageSVG(page, { crop: opts.crop, margin: opts.margin, background: false });
        var orient = r.w > r.h ? 'landscape' : 'portrait';
        if (!pdf) {
          pdf = new J({ unit: 'pt', format: [r.w, r.h], orientation: orient, compress: true });
          registerPdfFonts(pdf);
          pdf.setProperties({ title: CS.state.doc.title || 'ChemSketch drawing', creator: 'ChemSketch', author: opts.author || '' });
        } else pdf.addPage([r.w, r.h], orient);
        host.innerHTML = r.svg;
        var el = host.firstChild;
        return window.svg2pdf.svg2pdf(el, pdf, { x: 0, y: 0, width: r.w, height: r.h });
      });
    });
    return chain.then(function () {
      host.remove();
      return pdf.output('blob');
    }, function (e) { host.remove(); throw e; });
  }

  function svgToCanvas(svgText, w, h, scale) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = Math.round(w * scale); c.height = Math.round(h * scale);
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c);
      };
      img.onerror = function (e) { URL.revokeObjectURL(url); reject(new Error('Could not rasterise drawing')); };
      img.src = url;
    });
  }

  function exportPNG(page, opts) {
    opts = opts || {};
    var r = pageSVG(page, { crop: opts.crop, embedFonts: true, background: opts.transparent ? false : '#fff' });
    var scale = (opts.dpi || 300) / 72;
    return svgToCanvas(r.svg, r.w, r.h, scale).then(function (c) {
      return new Promise(function (res) { c.toBlob(res, 'image/png'); });
    });
  }

  CS.Export = {
    loadFonts: loadFonts,
    pageSVG: pageSVG,
    contentBBox: contentBBox,
    exportPDF: exportPDF,
    exportPNG: exportPNG,
    svgToCanvas: svgToCanvas
  };
})(window.CS);
