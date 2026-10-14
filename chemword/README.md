# ChemWord

A blank, Word-style document editor with a built-in ChemDraw-style structure editor.
Single self-contained HTML page (`index.html`): open it in a browser, no build step needed.

- Select an area on the page to turn it into a drawing, then draw structures, mechanisms and arrows in the full editor.
- Export to Word (.docx) or PDF. Exports embed the project, so they can be reopened and edited again via File > Open.
- Autosaves to the browser; File > Save project writes a `.json` backup.

## Source layout

`src/w-head.html` (markup + CSS), `src/core.js` (chemistry engine and renderer),
`src/w-app.js` (document editor, export/import), `src/w-cd.js` (drawing window).
`index.html` is these four parts concatenated; `build.sh` shows the order.
