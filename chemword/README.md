# ChemWord

A Word-style document editor with ChemSketch drawings built in. Open `chemword/index.html` in a
browser (it also opens from ChemSketch's **File** menu). It works offline, with no build step.

- **Drawings:** click **Drawing**, then drag a box on the page. Clicking the box opens the full
  ChemSketch editor in that area: templates, SMILES, name → structure, analysis, glassware and
  flowcharts. Drawings keep their natural size and shrink only if the area is too small.
- **Chemical formulas:** formulas are formatted as you type (CaCl2 → CaCl₂, Na+ → Na⁺; one Ctrl+Z
  reverts it). The **Formulas** button formats a selection or the whole document. Switch automatic
  formatting off under **File → Format formulas while typing**.
- **Undo/redo** covers everything, including inserting, deleting and redrawing drawing areas, tables
  and pictures.
- **Export PDF:** a vector PDF with embedded fonts. Text is sharp, selectable and searchable, and
  drawings stay vector graphics.
- **Export Word (.docx):** drawings are embedded as SVG (sharp in Word 2016 and later) with a PNG
  fallback.
- **Reopening exports:** PDF and .docx exports contain the ChemWord project, so **File → Open**
  makes everything editable again.
- **Saving:** the document autosaves in the browser. **File → Save project** writes a `.json` backup.

Documents made with the first ChemWord version open normally; their drawings are converted to
ChemSketch drawings automatically.

## How it fits together

| File | Purpose |
| --- | --- |
| `index.html`, `app.css` | page markup and styles |
| `src/util.js` | helpers, page geometry, saving files |
| `src/history.js` | undo/redo snapshots |
| `src/drawings.js` | drawing areas, rendering with the ChemSketch engine, the editor frame, conversion of old drawings |
| `src/editor.js` | word processing, pagination, zoom, opening files |
| `src/formulas.js` | chemical formula formatting |
| `src/pdf.js` | vector PDF export |
| `src/docx.js` | Word export and import |
| `src/main.js` | start-up |

The chemistry engine, fonts and libraries (jsPDF, svg2pdf.js, JSZip, mammoth) come from the
repository's `js/` folder, so ChemWord must stay next to ChemSketch.

**Fonts:** the screen and the PDF use the same bundled fonts, so the layout matches exactly.
These are DocSans (Carlito, metric-compatible with Calibri), ChemSans / ChemSerif (Liberation,
compatible with Arial / Times New Roman), DocSerif (Caladea, compatible with Cambria), ChemMono
(Liberation Mono, compatible with Courier New) and ChemSymbols (DejaVu Sans, for arrows and
symbols). Word files name the usual fonts (Calibri, Arial, …).
