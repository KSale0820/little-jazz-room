// Regression: P02 shows a readable two-bars-per-row score and real A/B/A/AABA sections.
// Free sheet stays large; Guided uses the same notation in a shorter viewport.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const url = process.env.APP_URL || 'http://127.0.0.1:5174';
const folder = join(process.cwd(), 'docs/screenshots/class-demo-p02-chart-scale');
mkdirSync(folder, { recursive: true });
const results = [];
const browser = await chromium.launch({ headless: true });
const ensure = (condition, message) => { if (!condition) throw Error(message); };
try {
  for (const [width, height] of [[390,844],[375,667]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Free Practice/ }).click();
    await page.waitForURL(u => u.pathname === '/player');
    await page.getByRole('tab', { name: 'Chart' }).click();
    ensure(await page.locator('.practice-player.practice-free').count() === 1, 'Free variant class missing');
    const measures = page.locator('.practice-chart-scroll .measure');
    ensure(await measures.count() >= 12, 'Expected at least a 12-measure chart');
    ensure(await page.locator('.practice-chart-scroll .measure-section-label').allTextContents().then(x => x.join(',')) === 'A',
      'The blues chart should show only its sourced A section, not fabricated B sections');
    const columns = await page.locator('.practice-chart-scroll .chord-grid').evaluate(el =>
      getComputedStyle(el).gridTemplateColumns.split(/\s+/).length);
    ensure(columns === 2, 'Expected two wide measures per row like approved reference');
    const geometry = await page.evaluate(() => {
      const grid = document.querySelector('.practice-chart-scroll .chord-grid');
      const measure = document.querySelector('.practice-chart-scroll .measure');
      const chords = document.querySelector('.practice-chart-scroll .chords');
      const scroll = document.querySelector('.practice-chart-scroll');
      if (!grid || !measure || !chords || !scroll) throw Error('Missing chord grid');
      return {
        gridHeight: grid.getBoundingClientRect().height,
        measureHeight: measure.getBoundingClientRect().height,
        chordFont: parseFloat(getComputedStyle(chords).fontSize),
        visibleChartHeight: scroll.getBoundingClientRect().height,
        maxChartHeight: parseFloat(getComputedStyle(scroll).maxHeight),
        overflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    ensure(geometry.gridHeight >= (height === 844 ? 285 : 245), 'Free chord grid too small: ' + JSON.stringify(geometry));
    ensure(geometry.measureHeight >= 44, 'Score rows too compressed: ' + JSON.stringify(geometry));
    ensure(geometry.chordFont >= 15, 'Chords too small: ' + JSON.stringify(geometry));
    ensure(geometry.overflow <= 1, 'Horizontal overflow: ' + geometry.overflow);
    await page.screenshot({ path: join(folder, 'P02-free-chart-large-' + width + 'x' + height + '.png'), animations: 'disabled' });
    const tools = page.locator('.practice-utility-row button');
    ensure(await tools.count() === 5, 'Reference requires five tool tiles');
    const names = await tools.allInnerTexts();
    ensure(['Mixer','Tempo/Key','Loop','Tuner','Metronome'].every((x,i) => names[i].includes(x)),
      'Tool labels differ from reference: ' + names.join(','));
    ensure(await page.locator('.practice-utility-row .practice-tool-glyph').count() === 5,
      'Expected five reference-style pictograms');
    const dockBottom = await page.locator('.practice-utility-row').evaluate(el => el.getBoundingClientRect().bottom);
    ensure(dockBottom <= height + 1, 'Tool icons are cut off on the mobile screen: bottom=' + dockBottom + ' viewport=' + height);
    await page.getByRole('combobox', { name: 'Choose practice chart' }).selectOption('rhythm-bb-32');
    const aaba = await page.locator('.practice-chart-scroll .measure-section-label').allTextContents();
    ensure(aaba.join(',') === 'A,A,B,A', 'AABA form labels did not return: ' + aaba.join(','));
    await page.screenshot({ path: join(folder, 'P02-free-AABA-chart-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await page.getByRole('combobox', { name: 'Choose practice chart' }).selectOption('blues-f-12');
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1200);
    ensure(await page.locator('[data-testid="session-elapsed"]').innerText() !== '00:00', 'Timer failed beneath enlarged grid');
    await page.locator('.practice-utility-row').getByRole('button', { name: /Tuner/ }).click();
    await page.getByRole('dialog', { name: 'Tuner within practice' }).waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();
    ensure(await page.getByRole('button', { name: 'Pause practice timer' }).isVisible(), 'Overlay reset timer');
    await page.goto(url + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await page.waitForURL(u => u.pathname === '/player');
    ensure(await page.locator('.practice-player.practice-guided').count() === 1, 'Guided variant class missing');
    const guidedHeight = await page.locator('.practice-chart-scroll').evaluate(el => el.getBoundingClientRect().height);
    ensure(guidedHeight <= (height === 844 ? 218 : 182), 'Guided chart not compact: ' + guidedHeight);
    ensure(await page.locator('.practice-utility-row button').count() === 5, 'Guided tools disappeared');
    await page.screenshot({ path: join(folder, 'P02-guided-chart-original-scale-' + width + 'x' + height + '.png'), animations: 'disabled' });
    ensure(errors.length === 0, 'Page exceptions: ' + errors.join(' | '));
    console.log('PASS readable two-bar sheet + AABA sections and matching tool glyphs at ' + width + 'x' + height + ': ' + JSON.stringify(geometry));
    results.push({ width, height, ...geometry, guidedMeasureHeight: guidedHeight, status: 'PASS' });
    await context.close();
  }
} finally { await browser.close(); }
writeFileSync(join(folder, 'chart-scale-results.json'), JSON.stringify(results, null, 2));
