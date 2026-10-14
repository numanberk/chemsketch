'use strict';
/* Chemical formulas in the document text: NaHCO3 → NaHCO₃, Ca2+ → Ca²⁺, (CH3)3N → (CH₃)₃N.
   Words are formatted as you type (after a space, punctuation or Enter; one Ctrl+Z reverts it),
   and the "Formulas" button formats the selection or the whole document. */

const Formulas = (() => {
  const ABBR = new Set(['Me', 'Et', 'Pr', 'Bu', 'Ph', 'Bn', 'Bz', 'Ac', 'Ts', 'Ms', 'Tf', 'Boc', 'TMS', 'Cy', 'Ar']);
  const isSym = (t) => CS.Chem.isElement(t) || ABBR.has(t);
  // look like formulas but are not: SN1/SN2 mechanisms, COVID19, UV254, NMR…
  const NOT_FORMULA = /^(SN[12]|COVID\d*|UV\d*|NMR\d*|HPLC\d*|GC\d*|IR\d*)$/;

  // Split a word into formula parts, or return null when it is not a formula.
  function parse(word) {
    if (!/^[A-Z(\[][A-Za-z0-9()[\]]*[+\-−]?$/.test(word) || NOT_FORMULA.test(word)) return null;
    let core = word, charge = '';
    if (/[+\-−]$/.test(core)) {
      charge = core.slice(-1);
      core = core.slice(0, -1);
      // Ca2+ / Fe3+: the digit is the charge; SO42-: the last of two digits is; NH4+: it is a subscript
      if (/^[A-Z][a-z]?\d$/.test(core) || /[A-Za-z)\]]\d\d$/.test(core)) {
        charge = core.slice(-1) + charge;
        core = core.slice(0, -1);
      }
    }
    const toks = core.match(/[A-Z][a-z]*|\d+|[()[\]]/g) || [];
    if (toks.join('') !== core) return null;
    let syms = 0, first = null;
    for (const t of toks) {
      if (/^[A-Z]/.test(t)) {
        if (!isSym(t)) return null;
        syms++;
        if (!first) first = t;
      }
    }
    if (!syms) return null;
    const hasSub = /[A-Za-z)\]]\d/.test(core);
    if (!hasSub && !charge) return null;
    // "C1", "C2"… are atom numbers and "S1" a supporting-info label, not formulas
    if (syms === 1 && !charge && /^(C|S)\d+$/.test(core)) return null;
    // a bare charge needs an element right before it ("Na+", "Cl-"), not e.g. "A-"
    const parts = [];
    let prev = '';
    for (const t of toks) {
      if (/^\d+$/.test(t) && /[A-Za-z)\]]$/.test(prev)) parts.push({ t, k: 'sub' });
      else parts.push({ t, k: 'n' });
      prev = t;
    }
    if (charge) parts.push({ t: charge.replace('-', '−'), k: 'sup' });
    return parts;
  }

  function insideScript(node) {
    const el = node.nodeType === 1 ? node : node.parentElement;
    return !!(el && el.closest('sub,sup,figure,table.nofmt'));
  }

  // replace text [start, end) of a text node with formatted formula nodes; returns the node after it
  function replaceRange(node, start, end, parts) {
    const after = node.splitText(end);
    const mid = node.splitText(start);
    const frag = document.createDocumentFragment();
    let buf = '';
    const flush = () => { if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ''; } };
    for (const p of parts) {
      if (p.k === 'n') { buf += p.t; continue; }
      flush();
      const el = document.createElement(p.k);
      el.textContent = p.t;
      frag.appendChild(el);
    }
    flush();
    mid.replaceWith(frag);
    return after;
  }

  // format the word that ends right before `offset` in a text node
  function formatWordAt(node, offset) {
    if (insideScript(node)) return null;
    const before = node.data.slice(0, offset);
    const m = /[A-Za-z0-9()[\]+\-−]+$/.exec(before);
    if (!m) return null;
    // the word must start here (not continue from a previous inline element)
    if (m.index === 0 && node.previousSibling && /\S$/.test(node.previousSibling.textContent || '')) return null;
    const parts = parse(m[0]);
    if (!parts || !parts.some((p) => p.k !== 'n')) return null;
    return replaceRange(node, m.index, offset, parts);
  }

  // called while typing: the character that ended the word was just inserted before the caret
  function onTyped(e) {
    if (OPTS.autoChem === false || e.inputType !== 'insertText' || !e.data || !/^[\s.,;:!?)\]]$/.test(e.data)) return;
    const s = getSelection();
    if (!s.isCollapsed || !s.anchorNode || s.anchorNode.nodeType !== 3) return;
    const node = s.anchorNode, caret = s.anchorOffset;
    const wordEnd = caret - e.data.length;
    if (wordEnd <= 0) return;
    if (!parse((/[A-Za-z0-9()[\]+\-−]+$/.exec(node.data.slice(0, wordEnd)) || [''])[0])) return;
    History.record(); // the plain text first, so Ctrl+Z restores it
    const after = formatWordAt(node, wordEnd);
    if (!after) return;
    const r = document.createRange();
    r.setStart(after, Math.min(after.length, e.data.length));
    r.collapse(true);
    s.removeAllRanges();
    s.addRange(r);
    History.record();
    save();
  }

  // Enter also ends a word
  function onKey(e) {
    if (OPTS.autoChem === false || e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey) return;
    const s = getSelection();
    if (!s.isCollapsed || !s.anchorNode || s.anchorNode.nodeType !== 3) return;
    const node = s.anchorNode, caret = s.anchorOffset;
    if (caret !== node.length && /\S/.test(node.data.charAt(caret))) return;
    if (!parse((/[A-Za-z0-9()[\]+\-−]+$/.exec(node.data.slice(0, caret)) || [''])[0])) return;
    History.record();
    const after = formatWordAt(node, caret);
    if (!after) return;
    const r = document.createRange();
    r.setStart(after, 0);
    r.collapse(true);
    s.removeAllRanges();
    s.addRange(r);
  }

  // format every formula in the selection (or the whole document)
  function formatAll() {
    const s = getSelection();
    const range = s.rangeCount && !s.isCollapsed && ed.contains(s.anchorNode) ? s.getRangeAt(0) : null;
    History.flush();
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = w.nextNode())) if (!insideScript(n) && (!range || range.intersectsNode(n))) nodes.push(n);
    let count = 0;
    for (const node of nodes) {
      let cur = node;
      const re = /[A-Za-z0-9()[\]]+(?:\d*[+\-−](?=[\s.,;:!?)]|$))?/g;
      let m, found = [];
      while ((m = re.exec(cur.data))) {
        const pre = cur.data.charAt(m.index - 1);
        if (m.index > 0 && /[A-Za-z0-9]/.test(pre)) continue;
        const parts = parse(m[0]);
        if (parts && parts.some((p) => p.k !== 'n')) found.push([m.index, m.index + m[0].length, parts]);
      }
      // replace from the end so earlier offsets stay valid
      for (let i = found.length - 1; i >= 0; i--) {
        replaceRange(cur, found[i][0], found[i][1], found[i][2]);
        count++;
      }
    }
    if (!count) return toast(range ? 'No formulas found in the selection' : 'No formulas found');
    ed.normalize();
    afterEdit(true);
    toast(`Formatted ${count} formula${count > 1 ? 's' : ''}. Ctrl+Z undoes it.`);
  }

  ed.addEventListener('input', onTyped);
  ed.addEventListener('keydown', onKey);
  $('#bFormula').onclick = formatAll;

  return { parse, formatAll };
})();
