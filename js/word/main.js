'use strict';
/* Boot: load the bundled fonts (document fonts + ChemSketch fonts), then restore the autosaved document. */

(async function boot() {
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* old browsers */ }
  try {
    await Promise.all([CS.Export.loadFontData(window.CS_DOC_FONT_DATA), CS.Export.loadFonts()]);
  } catch (e) { /* fall back to system fonts */ }
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { stored = null; }
  ZOOM = fitZoom();
  loadDoc(stored);
  requestAnimationFrame(() => {
    ZOOM = fitZoom();
    layoutStage();
    reflow();
  });
  // load the drawing editor in the background so the first drawing opens instantly
  setTimeout(() => { if (!frame.getAttribute('src')) frame.src = 'sketch.html?embed=1'; }, 1500);
})();
