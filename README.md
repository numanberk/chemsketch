# ChemWord

A free, browser-based word processor for chemistry, in the style of Microsoft Word, with a
ChemDraw-style structure editor and a lab-flowchart maker built in. It exports vector PDF and
Word (.docx).

Open `index.html` in Chrome, Edge, Firefox or Safari. There is no installation or build step, and
everything works offline except PubChem name lookups. To host it, serve the folder from any static
server or enable GitHub Pages on this repository.

## Using it

- **Write** as in Word, using the **Home** tab: styles, fonts, bold/italic/underline, sub- and
  superscript, colours, alignment, lists, indents and line spacing.
- **Insert → Structure** opens the drawing window at the cursor. The palette on the left has
  elements, bonds, rings, charges, arrows and glassware; formula and molecular weight show at the
  bottom. Press **Done** to put the drawing in the document, and click it later to edit it again.
- **Insert → Flowchart** opens the flowchart wizard. For each step, click the picture to choose a
  setup, describe the step and adjust its labels; the result is placed in the document.
- **Chemical formulas** are formatted as you type: CaCl2 → CaCl₂ and Na+ → Na⁺. One Ctrl+Z reverts
  a word, the **Formulas** button formats existing text, and **View → Format formulas while typing**
  turns it off.
- **Insert** also has tables, pictures, symbols (α, °, ⇌, …) and page breaks.
- **Undo/redo** covers everything, including inserting and deleting drawings.
- **Export PDF** (title bar, or **File**) produces a vector PDF with embedded fonts: sharp,
  selectable text and vector drawings. **File → Export as Word** saves a .docx with drawings as SVG,
  plus PNG for older Word versions.
- **Reopening saves:** PDF and .docx exports carry the project inside them, so opening one makes
  everything editable again. Use the folder button in the title bar, **Ctrl+O**, **File → Open**,
  or drag the file onto the page. This includes files saved by the first ChemWord version. **File → Save project** writes a `.json` file, and the document also
  autosaves in the browser.

The drawing editor also runs on its own at `sketch.html` (**File → Open ChemSketch**), with
multiple pages and its own PDF/SVG/PNG/MOL export.

### Drawing editor (ChemSketch) features

#### Structure drawing
- Single, double, triple, wedge, hashed, hollow wedge, wavy, bold and dashed bonds, plus a partial/aromatic double bond.
- Click a bond to cycle single → double → triple. Click a double bond to move its second line (auto / left / centre / right).
- Chain tool: drag out a zig-zag carbon chain; it shows the atom count while you drag.
- 3–8 membered rings, benzene and a cyclohexane chair. Click a bond to fuse a ring, or click an atom for a spiro ring.
- ChemDraw-style hover shortcuts:
  - Over an atom: `N` `O` `S` `P` `F` `H` `I`, `L` (Cl), `B` (Br), `M` (Me), `+`/`-` for charge, `.` for a radical.
  - Over a bond: `1` `2` `3`, `W` (wedge), `H` (hash), `Y` (wavy), `B` (bold), `D` (dashed).
- Labels and groups: double-click an atom and type `OMe`, `CO2Et`, `NHBoc`, `Ph` and so on. Labels flip automatically (`MeO`, `HO`, `EtO2C`) when the bond comes from the right.
- Automatic implicit hydrogens, charges (optionally circled), radicals and lone pairs.
- Valence errors are boxed in red on screen. The box is not exported.
- Periodic table and abbreviation picker.
- Clean up structure (2D layout), and R/S stereo labels (CIP).
- Insert from SMILES, MOL file import/export, copy as SMILES. You can paste SMILES or MOL text straight onto the canvas.
- Name → Structure and Structure → Name, looked up on PubChem (needs internet).
- Analysis panel: formula, MW, exact mass, m/z, elemental analysis, cLogP, cLogS, TPSA, H-bond donors/acceptors, rotatable bonds and stereocentres. One click inserts the formula and MW as text.
- About 100 templates: rings, heteroaromatics, amino acids, sugars and nucleobases, solvents and reagents, common drugs.
- Drawing styles: Default, ACS Document 1996, RSC/Wiley and Presentation. Changing the style can rescale existing drawings.

#### Arrows, text and shapes
- Reaction, equilibrium (equal or unequal), resonance, retrosynthetic, dashed and no-reaction arrows.
- Curved electron-pushing arrows with full or half (fishhook) heads; drag the middle handle to bend them.
- Rich text with automatic formula formatting: `NaHCO3` → NaHCO₃ and `Na+` → Na⁺. Manual markup also works: `H_2O`, `x^{2-}`.
- Rectangles, rounded rectangles, ellipses, [ ] ( ) { } brackets with labels, p-orbitals and images.

#### Lab procedure flowcharts
- **Flowchart wizard** (Insert → Flowchart in the document, or the Flowchart menu in the drawing editor). List your steps, choose a ready-made apparatus setup for each one, and type the captions and labels. It lays out numbered boxes in 1–3 columns with elbow arrows between them. Inside a document the flowchart is one figure that grows to fit; in the standalone editor it can have a title, an author line and several pages.
- Glassware library: round-bottom, two- and three-neck flasks; Erlenmeyer, filter flask and beaker; reflux condenser and distillation head; addition, separatory, glass and Büchner funnels; water/ice bath, heating mantle, stirrer hot plate, cork ring, Bunsen burner and stir bar; ring stand and clamp; test tube, vial, graduated cylinder, thermometer, pipette and syringe; watch glass, Petri dish, crystals, TLC plate, mortar & pestle; rotary evaporator and a simple distillation setup.
- Ready-made setups with labels: flask on hot plate, reflux in water bath, addition funnel + reflux, adding liquid from a tube, separatory-funnel extraction, wash & dry, rotary evaporation, simple distillation, vacuum and gravity filtration, recrystallisation, ice bath, reflux with heating mantle, TLC chamber.
- Adjustable properties: liquid levels (including two-phase funnels), liquid colour, stir bars, solids, ice, mirror and rotation.
- Step boxes move together with everything drawn inside them. Connectors re-route automatically when boxes move.
- **Add next step** and **Re-arrange steps & arrows** tidy a flowchart you have edited by hand.

#### Editing and files
- Undo/redo, copy/cut/paste, duplicate (Alt-drag also copies), group/ungroup, bring to front / send to back.
- Flip, rotate (rotation handle with 15° snapping), scale, align and distribute, arrow-key nudging, and an optional grid with snapping.
- Multiple pages (A4, Letter, A5, A3, Legal; portrait or landscape).
- **Export PDF:** all pages or the current one, whole page or cropped to the drawing. Text stays selectable, and Turkish and other accented characters (ğ, ş, ü…) come out correctly.
- Export SVG (fonts embedded), PNG (150/300/600 dpi, optional transparent background) and MOL.
- Save and open projects as `.chemsketch.json`. Your work is also autosaved in the browser.

Press **Help → Keyboard shortcuts** inside the app for the full list.

## Project layout

```
index.html            ChemWord (the default app)
sketch.html           ChemSketch drawing editor (standalone, or embedded in ChemWord with ?embed=1)
css/word.css          ChemWord styles
css/sketch.css        ChemSketch styles
js/word/              ChemWord: util, history (undo), drawings (embedding ChemSketch), editor,
                      formulas, pdf (vector export), docx (Word export/import), main
js/sketch/            ChemSketch: core, richtext, chem, apparatus, render, document, templates,
                      editor, export, flowchart, ui, main
js/vendor/            jsPDF, svg2pdf.js, OpenChemLib, JSZip, mammoth, bundled fonts
fonts/                font licences
```

See `CLAUDE.md` for how the pieces fit together and how to test changes.

## Third-party components

- [OpenChemLib JS](https://github.com/cheminfo/openchemlib-js) (BSD-3-Clause): SMILES/MOL parsing, 2D coordinates, properties, CIP.
- [jsPDF](https://github.com/parallax/jsPDF) and [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) (MIT): PDF export.
- [JSZip](https://github.com/Stuk/jszip) (MIT) and [mammoth](https://github.com/mwilliamson/mammoth.js) (BSD-2-Clause): Word export and import in ChemWord.
- Fonts, subset and renamed:
  - Liberation Sans / Serif / Mono → ChemSans / ChemSerif / ChemMono;
  - Carlito → DocSans;
  - Caladea → DocSerif.

  All are under the SIL Open Font License 1.1 (see `fonts/OFL.txt`). ChemSymbols is a subset of DejaVu Sans (Bitstream Vera licence, see `fonts/BITSTREAM-VERA.txt`).
