/* Boot: load fonts, build UI, restore the autosaved document (or show the lab example). */
(function (CS) {
  'use strict';

  function boot() {
    CS.Export.loadFonts().catch(function () { }).then(function () {
      CS.Editor.init(document.getElementById('canvas-wrap'));
      CS.UI.init();
      var restored = false;
      var saved = CS.store.get('chemsketch.autosave');
      if (saved) {
        try {
          var doc = JSON.parse(saved);
          var empty = doc.pages.every(function (p) { return !p.atoms.length && !p.objects.length; });
          if (!empty) { CS.Doc.load(doc); restored = true; }
        } catch (e) { restored = false; }
      }
      if (!restored) {
        var page = CS.page();
        CS.Flow.build(CS.Flow.EXAMPLE, page);
        CS.state.doc.title = 'Carbenes';
        CS.History.reset();
        CS.emit('change');
      } else {
        CS.UI.toast('Restored your last drawing (File → New to start over)');
      }
      CS.Editor.fitPage();
      var l = document.getElementById('loading');
      if (l) l.remove();
      window.addEventListener('beforeunload', function () {
        CS.store.set('chemsketch.autosave', JSON.stringify(CS.state.doc));
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.CS);
