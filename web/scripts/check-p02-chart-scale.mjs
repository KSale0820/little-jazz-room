// P02: prove every chart page renders completely, including the B and final
// A sections of AABA, and that Guided pages no longer conceal later measures.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const url = process.env.APP_URL || 'http://127.0.0.1:5174';
const folder = join(process.cwd(), 'docs/screenshots/class-demo-p02-chart-scale');
mkdirSync(folder, { recursive: true });
const results = [];
const browser = await chromium.launch({ headless: true });
const ensure = (v, msg) => { if (!v) throw Error(msg); };
const names = async locator => (await locator.allInnerTexts()).map(x => x.trim());
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
    ensure(await page.locator('.practice-player.practice-free').count() === 1, 'Free player missing');
    const nav = page.getByRole('navigation', { name: 'Chart sections and measure groups' });
    const measures = page.locator('.practice-chart-scroll .measure');
    const score = page.locator('.practice-chart-scroll');
    const geometry = async () => page.evaluate(() => {
      const box = document.querySelector('.practice-chart-scroll');
      const grid = box?.querySelector('.chord-grid');
      const chord = box?.querySelector('.chords');
      const row = box?.querySelector('.measure');
      const tools = document.querySelector('.practice-utility-row');
      if (!grid || !chord || !row || !tools) throw Error('Score or tool dock missing');
      return {
        bars: grid.querySelectorAll('.measure').length,
        columns: getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length,
        chordFont: parseFloat(getComputedStyle(chord).fontSize),
        gridHeight: grid.getBoundingClientRect().height,
        visibleHeight: box.getBoundingClientRect().height,
        overflowY: getComputedStyle(box).overflowY,
        dockBottom: tools.getBoundingClientRect().bottom,
        docOverflowX: document.documentElement.scrollWidth - innerWidth,
      };
    });
    const verify = async (expectedBars, note) => {
      const r = await geometry();
      ensure(r.bars === expectedBars, note + ': incorrect bar count ' + JSON.stringify(r));
      ensure(r.columns === 2, note + ': expected two wide measures per row');
      ensure(r.chordFont >= 15, note + ': chords unreadably small');
      ensure(r.gridHeight <= r.visibleHeight + 2, note + ': score is vertically clipped');
      ensure(r.docOverflowX <= 1, note + ': horizontal page overflow');
      ensure(r.dockBottom <= height + 1, note + ': bottom practice tools cut off');
      return r;
    };
    ensure((await names(nav.locator('button'))).join(',') === 'A,9–12', 'Blues should have two clearly reachable groups');
    ensure((await names(page.locator('.practice-chart-scroll .measure-section-label'))).join(',') === 'A',
      'Blues chart must show only sourced A, not fabricated B sections');
    const free = await verify(8,'Free F blues');
    await page.screenshot({ path: join(folder, 'P02-free-chart-large-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await nav.getByRole('button', { name: /measures 9 to 12/i }).click();
    await verify(4,'Final blues phrase');
    ensure(await page.getByRole('button', { name: /^Measure 12:/ }).count() === 1, 'Last blues measure inaccessible');
    await page.getByRole('combobox', { name: 'Choose practice chart' }).selectOption('rhythm-bb-32');
    ensure((await names(nav.locator('button'))).join(',') === 'A1,A2,B,A3','AABA form navigation missing');
    await verify(8,'AABA first A');
    await page.screenshot({ path: join(folder, 'P02-free-AABA-chart-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await nav.getByRole('button',{name: /section A2/}).click();
    ensure(await page.getByRole('button',{name:/^Measure 9:/}).count() === 1,'Second A not visible');
    await page.screenshot({ path: join(folder, 'P02-free-AABA-A2-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await nav.getByRole('button',{name: /section B,/}).click();
    ensure(await page.getByRole('button',{name:/^Measure 17:/}).count() === 1,'Bridge starts at bar 17');
    ensure((await names(page.locator('.practice-chart-scroll .measure-section-label'))).join(',') === 'B','Bridge B label missing');
    await verify(8,'AABA bridge');
    await page.screenshot({ path: join(folder, 'P02-free-AABA-B-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await nav.getByRole('button',{name: /section A3/}).click();
    ensure(await page.getByRole('button',{name:/^Measure 32:/}).count() === 1,'Final A section cut off');
    await verify(8,'AABA final A');
    await page.screenshot({ path: join(folder, 'P02-free-AABA-A3-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await nav.getByRole('button',{name: /section A1/}).click();
    await page.getByRole('button',{name:/^Measure 8:/}).click();
    await page.getByRole('button',{name:'Next measure'}).click();
    ensure(await page.getByRole('button',{name:/^Measure 9:/}).getAttribute('aria-pressed') === 'true',
      'Measure transport fails to advance from A1 to A2');
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1150);
    ensure(await page.locator('[data-testid="session-elapsed"]').innerText() !== '00:00', 'Timer not working');
    await page.locator('.practice-utility-row').getByRole('button',{name:/Tuner/}).click();
    await page.getByRole('dialog',{name:'Tuner within practice'}).waitFor();
    await page.getByRole('dialog').getByRole('button',{name:'Close tool and return to session'}).click();
    ensure(await page.getByRole('button',{name:'Pause practice timer'}).isVisible(), 'Tuner reset timer');
    await page.goto(url + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button',{name:'Open Daily Jazz Warm-Up in player'}).click();
    await page.waitForURL(u => u.pathname === '/player');
    ensure(await page.locator('.practice-player.practice-guided').count() === 1, 'Guided player missing');
    const guidedNav = page.getByRole('navigation',{name:'Chart sections and measure groups'});
    ensure((await names(guidedNav.locator('button'))).join(',') === '1–4,5–8,9–12', 'Guided page tabs missing');
    const guided = await verify(4,'Guided first four bars');
    await page.screenshot({ path: join(folder, 'P02-guided-chart-original-scale-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await guidedNav.getByRole('button',{name:/measures 9 to 12/i}).click();
    await verify(4,'Guided final four bars');
    ensure(await page.getByRole('button',{name:/^Measure 12:/}).count() === 1, 'Guided chart final bar inaccessible');
    await page.screenshot({ path: join(folder, 'P02-guided-chart-last-bars-' + width + 'x' + height + '.png'), animations: 'disabled' });
    ensure(errors.length === 0, 'Uncaught page exceptions: ' + errors.join(' | '));
    results.push({ width,height,free,guided,status:'PASS' });
    console.log('PASS P02 complete paged charts and AABA at ' + width + 'x' + height + ': ' + JSON.stringify({free,guided}));
    await context.close();
  }
} finally { await browser.close(); }
writeFileSync(join(folder,'chart-scale-results.json'),JSON.stringify(results,null,2));
