/* Boot: load fonts, build UI, restore the autosaved document (or start blank).
   In embed mode (?embed=1) ChemSketch is the drawing window of ChemWord: it receives a drawing
   through postMessage and sends it back when the user presses Done. */
(function (CS) {
  'use strict';

  function standalone() {
    var restored = false;
    var saved = CS.store.get('chemsketch.autosave');
    if (saved) {
      try {
        var doc = JSON.parse(saved);
        var empty = doc.pages.every(function (p) { return !p.atoms.length && !p.objects.length; });
        if (!empty) { CS.Doc.load(doc); restored = true; }
      } catch (e) { restored = false; }
    }
    if (restored) {
      CS.UI.toast('Restored your last drawing (File → New to start over)');
    }
    CS.Editor.fitPage();
    window.addEventListener('beforeunload', function () {
      CS.store.set('chemsketch.autosave', JSON.stringify(CS.state.doc));
    });
  }

  function embedded() {
    document.body.classList.add('embed');
    var host = window.parent;
    function send(msg) { host.postMessage(msg, '*'); }
    var quick = document.querySelector('.quick');
    quick.innerHTML = '<span class="embed-note">Drawing for your document — the page is the area it fills</span>' +
      '<button data-embed="cancel" title="Close without changes (Esc twice)">Cancel</button>' +
      '<button data-embed="done" class="primary" title="Put the drawing into the document (Ctrl+Enter)">Done</button>';
    function done() {
      CS.Editor.closeEditor();
      var doc = CS.clone(CS.state.doc);
      doc.figPage = CS.state.pageIdx;
      send({ type: 'chemsketch:done', doc: doc });
    }
    quick.addEventListener('click', function (e) {
      var b = e.target.closest('[data-embed]');
      if (!b) return;
      if (b.getAttribute('data-embed') === 'done') done();
      else send({ type: 'chemsketch:cancel' });
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); done(); }
    });
    window.addEventListener('message', function (e) {
      if (e.source !== host || !e.data || e.data.type !== 'chemsketch:load') return;
      try {
        CS.Doc.load(e.data.doc);
        CS.state.pageIdx = Math.min(e.data.doc.figPage || 0, CS.state.doc.pages.length - 1);
        CS.UI.setTool('select');
        CS.UI.setTool('bond:1:plain');
        CS.emit('change');
        CS.History.reset();
        CS.Editor.fitPage();
        if (e.data.wizard) CS.Flow.openWizard();
      } catch (err) {
        CS.UI.toast('Could not open this drawing: ' + err.message, true);
      }
    });
    CS.Doc.load(CS.Doc.newDoc());
    CS.Editor.fitPage();
    send({ type: 'chemsketch:ready' });
  }

  function boot() {
    CS.Export.loadFonts().catch(function () { }).then(function () {
      CS.Editor.init(document.getElementById('canvas-wrap'));
      CS.UI.init();
      if (CS.embed) embedded(); else standalone();
      var l = document.getElementById('loading');
      if (l) l.remove();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.CS);
