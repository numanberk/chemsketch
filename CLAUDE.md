# CLAUDE.md

Guidance for Claude (and other contributors) working in this repository.

## Git workflow (owner's standing instruction)

- **Commit and push directly to `main`.** Do not create feature branches or pull requests unless the
  owner asks for one. Before pushing: `git pull --ff-only origin main`, then `git push origin main`.
- Run `npm test` (see Testing) before pushing; push only when it passes.
- Write clear commit messages describing what changed and why.

## What this is

A static web app with no build step and no server. Open `index.html` and it runs, including from
`file://` and offline (only PubChem name lookups need the internet).

- **ChemWord** (`index.html`, the default app): a Microsoft-Word-style editor. It has a title bar,
  ribbon tabs (File, Home, Insert, View) and A4 pages, and exports vector PDF and .docx. Insert →
  Structure / Flowchart put drawings in the document.
- **ChemSketch** (`sketch.html`): the ChemDraw-style drawing editor, which includes structures,
  arrows, glassware, the flowchart wizard and its own exports. It runs standalone, or inside
  ChemWord via `sketch.html?embed=1` in an iframe.

Keep the apps free of demo or example content. Both start blank.

## Code layout and conventions

```
index.html, css/word.css, js/word/*.js      ChemWord
sketch.html, css/sketch.css, js/sketch/*.js ChemSketch
js/vendor/                                  third-party libraries and bundled fonts (do not edit by hand)
tests/smoke.cjs                             end-to-end smoke test (Playwright)
```

- **Classic `<script>` tags only.** No ES modules, bundlers or CDNs, because `file://` must keep
  working. The script order in the HTML files matters. Any new dependency goes into `js/vendor/`
  (minified build, source-map comment stripped) and its licence goes in the README.
- **ChemSketch** (`js/sketch/`) is ES5-style IIFEs on the global `CS` namespace:
  - `CS.Text`: rich text layout, measured with canvas.
  - `CS.Chem`: elements, valence, formula/mass, and the OpenChemLib bridge (`window.OCL`).
  - `CS.Apparatus`: glassware drawings and presets.
  - `CS.R`: SVG rendering and bounding boxes.
  - `CS.Doc`, `CS.state`, `CS.History`, `CS.commit()`: the model, the current state and undo.
  - `CS.Editor`: canvas tools. `CS.UI`: menus and panels. `CS.Flow`: the flowchart wizard and layout.
  - `CS.Export`: PDF/SVG/PNG export and font helpers.
  - `CS.Studio` (`studio.js`): the compact drawing-window layout used when embedded (`?embed=1`).
    It mirrors the original ChemWord drawing window and adds a right-hand drawer for templates,
    glassware and properties:
    - top bar: Done, title, fit note, undo, zoom, PNG/SVG, Cancel;
    - a three-column tool palette;
    - a dotted canvas with the document area as a dashed guide;
    - a bottom bar with formula chips and actions for the selection.

    Keep this window simple: new features go in the drawer or the bottom bar, not in more chrome.

  Coordinates are in **pt**. Every finished edit calls `CS.commit()`, which records undo,
  autosaves and re-renders.
- **ChemWord** (`js/word/`) is modern JS, with top-level `const`/`function` shared across files
  in load order: util → history → drawings → editor → formulas → pdf → docx → main. Layout is in
  CSS **px** (A4 = 794 × 1123 px; `PX2PT = 0.75`).
  - Structural changes (inserting or removing blocks, drawings, tables, pictures) must call
    `History.flush()` before the change and `History.record()` after it, or call `afterEdit(true)`.
    Typing uses `History.recordSoon()`.
- **Drawings in ChemWord:** each `<figure class="chem" data-id>` has a ChemSketch document in
  `DRAW[id]`, a one-page doc whose page is the figure size in pt. `figureSVG()` renders it with
  the ChemSketch engine, which ChemWord also loads.
  - The editor iframe protocol (`postMessage`):
    - ChemWord → frame: `chemsketch:load {doc, wizard, title}`.
    - frame → ChemWord: `chemsketch:ready`, `chemsketch:done {doc}`, `chemsketch:cancel`.
  - `migrateDrawing()` converts drawings saved by the first ChemWord version (atoms with `t`, arrows
    with `kind`; curved arrows keep their exact control point as `cx`/`cy`). Keep it, along with
    reading `chemword/docxml.sha256.txt` in old .docx files, so old saves (.docx, .pdf, .json) still
    open. The smoke test covers this.
- **Fonts are bundled** in `js/vendor/fonts.js` and `docfonts.js` as base64 TTF subsets, loaded with
  `FontFace` and embedded in PDFs. Screen and PDF use the same fonts, so layout matches exactly.
  - ChemSans/ChemSerif/ChemMono come from Liberation, DocSans from Carlito, DocSerif from Caladea
    and ChemSymbols from DejaVu.
  - Renamed subsets are required by the OFL/Vera licences. To change coverage, re-subset with
    `fontTools` (`pyftsubset`-style, renaming the family) and regenerate the JS files.
- **PDF export:**
  - ChemSketch uses jsPDF + svg2pdf on its own SVG.
  - ChemWord (`js/word/pdf.js`) walks the laid-out DOM: word positions come from `Range` rects,
    plus backgrounds, borders, list markers and images. Figures go through svg2pdf. Fonts fall back
    per glyph when one is missing.
  - The ChemWord project JSON is appended after `%%EOF` (and stored in .docx files), so exports
    can be reopened.

## Testing

```
npm install            # installs Playwright (dev only; the app itself has no dependencies)
npm test               # tests/smoke.cjs: typing + formulas, structure and flowchart round trips,
                       # undo, PDF/.docx export, standalone ChemSketch
```

- If Playwright's own browser download is unavailable, point it at an installed Chromium:
  `CHROMIUM_PATH=/path/to/chromium npm test`. In the Claude Code cloud environment that is
  `/opt/pw-browsers/chromium`.
- For a quick syntax check: `for f in js/sketch/*.js js/word/*.js; do node --check $f; done`.
- For visual changes, take screenshots with Playwright and look at them. Rasterise exported PDFs
  with `pdftoppm` to check them.
