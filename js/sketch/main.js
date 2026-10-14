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
    var host = window.parent;
    function send(msg) { host.postMessage(msg, '*'); }
    CS.Studio.build();
    CS.Studio.done = function () {
      CS.Editor.closeEditor();
      var doc = CS.clone(CS.state.doc);
      doc.figPage = CS.state.pageIdx;
      send({ type: 'chemsketch:done', doc: doc });
    };
    CS.Studio.cancel = function () {
      CS.Editor.closeEditor();
      send({ type: 'chemsketch:cancel' });
    };
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); CS.Studio.done(); }
    });
    window.addEventListener('message', function (e) {
      if (e.source !== host || !e.data || e.data.type !== 'chemsketch:load') return;
      try {
        CS.Studio.closeDrawer();
        CS.Doc.load(e.data.doc);
        CS.state.pageIdx = Math.min(e.data.doc.figPage || 0, CS.state.doc.pages.length - 1);
        var page = CS.page();
        var empty = !page.atoms.length && !page.objects.length;
        CS.Studio.setTitle(e.data.title || (e.data.wizard ? 'Flowchart' : 'Structure'));
        CS.UI.setTool(empty && !e.data.wizard ? 'bond:1:plain' : 'select');
        CS.History.reset();
        CS.emit('change');
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
