# ChemSketch

A free, browser-based alternative to ChemDraw for drawing chemical structures, reactions and
mechanisms, and for building **illustrated lab-procedure flowcharts** (numbered step boxes with
glassware drawings, labels and arrows). It exports a **vector PDF** with embedded fonts.

No installation and no build step. Open `index.html` in Chrome, Edge, Firefox or Safari and it
runs, offline too. To host it, serve the folder from any static server or enable GitHub Pages
on this repository.

## Features

### Structure drawing
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

### Arrows, text and shapes
- Reaction, equilibrium (equal or unequal), resonance, retrosynthetic, dashed and no-reaction arrows.
- Curved electron-pushing arrows with full or half (fishhook) heads; drag the middle handle to bend them.
- Rich text with automatic formula formatting: `NaHCO3` → NaHCO₃ and `Na+` → Na⁺. Manual markup also works: `H_2O`, `x^{2-}`.
- Rectangles, rounded rectangles, ellipses, [ ] ( ) { } brackets with labels, p-orbitals and images.

### Lab procedure flowcharts
- **Flowchart wizard** (Flowchart menu, or the button in the top bar). List your steps, choose a ready-made apparatus setup for each one, and type the captions and labels. It lays out a numbered, two-column (or 1/3-column) figure with a title, author line and elbow arrows between boxes. It splits onto more pages when needed.
- **Flowchart → Open lab example (Carbenes)** recreates the dichlorocarbene pre-lab figure.
- Glassware library: round-bottom, two- and three-neck flasks; Erlenmeyer, filter flask and beaker; reflux condenser and distillation head; addition, separatory, glass and Büchner funnels; water/ice bath, heating mantle, stirrer hot plate, cork ring, Bunsen burner and stir bar; ring stand and clamp; test tube, vial, graduated cylinder, thermometer, pipette and syringe; watch glass, Petri dish, crystals, TLC plate, mortar & pestle; rotary evaporator and a simple distillation setup.
- Ready-made setups with labels: flask on hot plate, reflux in water bath, addition funnel + reflux, adding liquid from a tube, separatory-funnel extraction, wash & dry, rotary evaporation, simple distillation, vacuum and gravity filtration, recrystallisation, ice bath, reflux with heating mantle, TLC chamber.
- Adjustable properties: liquid levels (including two-phase funnels), liquid colour, stir bars, solids, ice, mirror and rotation.
- Step boxes move together with everything drawn inside them. Connectors re-route automatically when boxes move.
- **Add next step** and **Re-arrange steps & arrows** tidy a flowchart you have edited by hand.

### Editing and files
- Undo/redo, copy/cut/paste, duplicate (Alt-drag also copies), group/ungroup, bring to front / send to back.
- Flip, rotate (rotation handle with 15° snapping), scale, align and distribute, arrow-key nudging, and an optional grid with snapping.
- Multiple pages (A4, Letter, A5, A3, Legal; portrait or landscape).
- **Export PDF:** all pages or the current one, whole page or cropped to the drawing. Text stays selectable, and Turkish and other accented characters (ğ, ş, ü…) come out correctly.
- Export SVG (fonts embedded), PNG (150/300/600 dpi, optional transparent background) and MOL.
- Save and open projects as `.chemsketch.json`. Your work is also autosaved in the browser.

Press **Help → Keyboard shortcuts** inside the app for the full list.

## Project layout

```
index.html          app shell
css/app.css         styles
js/core.js          helpers & geometry
js/richtext.js      sub/superscript text layout
js/chem.js          elements, valences, formula/mass, OpenChemLib bridge
js/render.js        SVG rendering of structures, arrows, shapes, flowchart parts
js/apparatus.js     glassware drawings and ready-made setups
js/document.js      document model, undo history, transforms
js/editor.js        canvas interaction and tools
js/templates.js     structure templates
js/flowchart.js     flowchart layout + wizard
js/export.js        PDF / SVG / PNG export
js/ui.js            menus, palette, panels, dialogs
js/vendor/          jsPDF, svg2pdf.js, OpenChemLib, bundled fonts
```

## Third-party components

- [OpenChemLib JS](https://github.com/cheminfo/openchemlib-js) (BSD-3-Clause): SMILES/MOL parsing, 2D coordinates, properties, CIP.
- [jsPDF](https://github.com/parallax/jsPDF) and [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) (MIT): PDF export.
- Liberation Sans / Liberation Serif, subset and renamed ChemSans / ChemSerif (SIL Open Font License 1.1, see `fonts/OFL.txt`).
