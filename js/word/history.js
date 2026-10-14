'use strict';
/* Undo / redo for the whole document.
   The browser's built-in undo cannot see changes made directly to the DOM (inserting or deleting
   drawing areas, tables, pictures, finishing a drawing), so ChemWord keeps its own history of
   snapshots: the document HTML, the drawings and the caret position. Typing is grouped into
   one step per pause; structural changes are recorded immediately. */

const History = (() => {
  const LIMIT = 200;
  let stack = [], idx = -1, timer = null;

  function caretOffset() {
    const s = getSelection();
    if (!s.rangeCount || !ed.contains(s.anchorNode)) return null;
    const r = document.createRange();
    r.setStart(ed, 0);
    try { r.setEnd(s.anchorNode, s.anchorOffset); } catch (e) { return null; }
    return r.toString().length;
  }
  function setCaretOffset(off) {
    if (off == null) return;
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    let n, left = off;
    while ((n = w.nextNode())) {
      if (left <= n.length) {
        const r = document.createRange();
        r.setStart(n, left);
        r.collapse(true);
        const s = getSelection();
        s.removeAllRanges();
        s.addRange(r);
        return;
      }
      left -= n.length;
    }
  }

  function snapshot() {
    return { html: serialize(), draws: JSON.stringify(DRAW), caret: caretOffset() };
  }
  function updateButtons() {
    $$('[data-cmd="undo"]').forEach((u) => (u.disabled = idx <= 0));
    $$('[data-cmd="redo"]').forEach((r) => (r.disabled = idx >= stack.length - 1));
  }

  // record the current state as a new step (no-op when nothing changed)
  function record() {
    clearTimeout(timer);
    timer = null;
    const s = snapshot();
    const top = stack[idx];
    if (top && top.html === s.html && top.draws === s.draws) { top.caret = s.caret; return; }
    stack = stack.slice(0, idx + 1);
    stack.push(s);
    if (stack.length > LIMIT) stack.shift();
    idx = stack.length - 1;
    updateButtons();
  }
  // typing: group keystrokes until the user pauses
  function recordSoon() {
    clearTimeout(timer);
    timer = setTimeout(record, 600);
  }
  // call before a structural change so that pending typing becomes its own undo step
  function flush() { if (timer) record(); }

  function apply(s) {
    DRAW = {};
    const draws = JSON.parse(s.draws);
    for (const k in draws) DRAW[k] = draws[k];
    ed.innerHTML = s.html;
    rebuildFigures();
    ed.focus({ preventScroll: true });
    setCaretOffset(s.caret);
    reflow();
    save();
    updateStatus();
    updateButtons();
  }
  function undo() {
    flush();
    if (idx <= 0) return toast('Nothing to undo');
    idx--;
    apply(stack[idx]);
  }
  function redo() {
    if (idx >= stack.length - 1) return toast('Nothing to redo');
    idx++;
    apply(stack[idx]);
  }
  function reset() {
    clearTimeout(timer);
    timer = null;
    stack = [snapshot()];
    idx = 0;
    updateButtons();
  }

  return { record, recordSoon, flush, undo, redo, reset };
})();
