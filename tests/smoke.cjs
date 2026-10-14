// Smoke test: drives ChemWord and ChemSketch in headless Chromium and fails on any page error.
// Run: npm install && npm test   (set CHROMIUM_PATH to use an already installed Chromium)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const root = path.resolve(__dirname, '..');
const url = (f) => 'file://' + path.join(root, f);
const problems = [];
function check(cond, msg) {
  console.log((cond ? 'ok   ' : 'FAIL ') + msg);
  if (!cond) problems.push(msg);
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const watch = (p, name) => {
    p.on('pageerror', (e) => problems.push(`${name}: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error') problems.push(`${name} console: ${m.text()}`); });
  };
  watch(page, 'ChemWord');

  // ---- ChemWord: typing, formulas, undo
  await page.goto(url('index.html'));
  await page.waitForTimeout(1500);
  await page.click('#doc');
  await page.keyboard.type('We used CaCl2 and Na+ ions.');
  const html = await page.evaluate(() => document.querySelector('#doc').innerHTML);
  check(/CaCl<sub>2<\/sub>/.test(html) && /Na<sup>\+<\/sup>/.test(html), 'formulas are formatted while typing');

  // ---- ChemWord: Insert → Structure round trip through the embedded ChemSketch
  await page.click('.tabs [data-tab="insert"]');
  await page.click('.pane[data-pane="insert"] [data-ins="structure"]');
  const frame = await (await page.$('#cdFrame')).contentFrame();
  await frame.waitForFunction(() => window.CS && CS.page && document.querySelector('[data-st="done"]'), null, { timeout: 20000 });
  await page.waitForTimeout(500);
  await frame.evaluate(() => CS.UI.importText('CC(=O)Oc1ccccc1C(=O)O'));
  await frame.click('[data-st="done"]');
  await page.waitForTimeout(400);
  check(await page.evaluate(() => {
    const f = document.querySelector('figure.chem');
    return !!f && !f.classList.contains('empty') && figPage(drawingFor(f)).atoms.length === 13;
  }), 'structure drawn in ChemSketch lands in the document');

  // ---- delete + undo
  await page.evaluate(() => document.querySelector('figure.chem [data-c=del]').click());
  await page.keyboard.press('Control+z');
  check(await page.evaluate(() => document.querySelectorAll('figure.chem').length) === 1, 'deleting a drawing can be undone');

  // ---- Insert → Flowchart (wizard)
  await page.click('.pane[data-pane="insert"] [data-ins="flowchart"]');
  await frame.waitForSelector('.modal .wizard', { timeout: 5000 });
  await frame.click('.modal-foot button.primary');
  await page.waitForTimeout(300);
  await frame.click('[data-st="done"]');
  await page.waitForTimeout(400);
  check(await page.evaluate(() => [...document.querySelectorAll('figure.chem')].some((f) => figPage(drawingFor(f)).objects.some((o) => o.type === 'step'))), 'flowchart wizard result lands in the document');

  // ---- exports
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chemword-'));
  const [pdf] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#qPdf')]);
  await pdf.saveAs(path.join(tmp, 'doc.pdf'));
  const pdfText = fs.readFileSync(path.join(tmp, 'doc.pdf'), 'latin1');
  check(pdfText.startsWith('%PDF') && pdfText.includes('%CHEMWORD-BEGIN') && /FontFile2/.test(pdfText), 'vector PDF export with embedded fonts and project');
  const [docx] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.evaluate(() => exportDOCX())]);
  await docx.saveAs(path.join(tmp, 'doc.docx'));
  check(fs.readFileSync(path.join(tmp, 'doc.docx')).slice(0, 2).toString() === 'PK', 'Word export');

  // ---- opening a save from the first ChemWord version (old drawing format)
  const old = {
    v: 1, opts: { pn: false },
    html: '<p>Old save</p><figure class="chem" data-id="cold" style="width:400px;height:120px;margin-left:0px"></figure><p><br></p>',
    draws: { cold: {
      n: 9,
      atoms: [{ id: 'k1', x: 0, y: 0, t: 'C' }, { id: 'k2', x: 26, y: 15, t: 'C' }, { id: 'k3', x: 52, y: 0, t: 'O', charge: 0, lp: 0, rad: 0 }],
      bonds: [{ id: 'k4', a: 'k1', b: 'k2', order: 1, style: 'plain' }, { id: 'k5', a: 'k2', b: 'k3', order: 2, style: 'plain' }],
      arrows: [{ id: 'k6', kind: 'curve2', x1: 0, y1: -20, x2: 52, y2: -20, cx: 26, cy: -50 }, { id: 'k7', kind: 'rxn', x1: 80, y1: 0, x2: 150, y2: 0 }],
      texts: [{ id: 'k8', x: 115, y: -15, text: 'H2O', size: 0.8, align: 'center' }]
    } }
  };
  fs.writeFileSync(path.join(tmp, 'old.json'), JSON.stringify(old));
  await page.evaluate(() => loadDoc(null));
  await page.setInputFiles('#fileIn', path.join(tmp, 'old.json'));
  await page.waitForTimeout(800);
  check(await page.evaluate(() => {
    const f = document.querySelector('figure.chem');
    const p = f && figPage(drawingFor(f));
    return !!p && p.atoms.length === 3 && p.objects.some((o) => o.type === 'arrow' && o.cx != null) && !f.classList.contains('empty');
  }), 'old ChemWord save opens with its drawings converted');

  // ---- the drawing window looks like ChemWord's (studio layout)
  await page.click('figure.chem');
  await frame.waitForFunction(() => document.querySelector('.st-top') && CS.page().atoms.length === 3, null, { timeout: 10000 });
  check(await frame.evaluate(() => !!document.querySelector('.st-status .chip')), 'drawing window shows formula chips');
  await frame.click('[data-st="cancel"]');

  // ---- ChemSketch standalone
  const sketch = await ctx.newPage();
  watch(sketch, 'ChemSketch');
  await sketch.goto(url('sketch.html'));
  await sketch.waitForTimeout(1500);
  check(await sketch.evaluate(() => CS.page().atoms.length + CS.page().objects.length) === 0, 'ChemSketch starts with a blank page');
  await sketch.evaluate(() => CS.UI.importText('c1ccccc1O'));
  check(await sketch.evaluate(() => CS.Chem.analysis(CS.page(), CS.page().atoms.map((a) => a.id)).formula) === 'C6H6O', 'SMILES import and formula');
  const n = await sketch.evaluate(async () => (await CS.Export.exportPDF(CS.state.doc.pages, {})).size);
  check(n > 1000, 'ChemSketch PDF export');

  await browser.close();
  if (problems.length) {
    console.error('\n' + problems.length + ' problem(s):\n' + problems.join('\n'));
    process.exit(1);
  }
  console.log('\nall good');
})().catch((e) => { console.error(e); process.exit(1); });
