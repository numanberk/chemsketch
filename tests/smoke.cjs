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
  await frame.waitForFunction(() => window.CS && CS.page && document.querySelector('[data-embed="done"]'), null, { timeout: 20000 });
  await page.waitForTimeout(500);
  await frame.evaluate(() => CS.UI.importText('CC(=O)Oc1ccccc1C(=O)O'));
  await frame.click('[data-embed="done"]');
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
  await frame.click('[data-embed="done"]');
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
