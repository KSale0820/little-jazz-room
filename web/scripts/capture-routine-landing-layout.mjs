import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const host = 'http://127.0.0.1:5199';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5199', '--strictPort'], {
  cwd: process.cwd(), stdio: 'ignore',
});
let browser;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const rect = ({ x, y, width, height, left, right, top, bottom }) =>
  ({ x, y, width, height, left, right, top, bottom });

try {
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(host + '/routines')).ok) break;
    } catch { /* not started */ }
    await new Promise(resolve => setTimeout(resolve, 250));
    if (i === 59) throw new Error('Vite did not start');
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const [width, height] of [[430, 844], [390, 844], [375, 667]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(host + '/routines');
    await page.getByRole('heading', { name: 'Routines', exact: true }).waitFor();
    const result = await page.evaluate(() => {
      const box = selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const cards = [...document.querySelectorAll('.routine-shelf-scroll .routine-card')].slice(0, 5)
        .map(element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width, height: r.height }; });
      const secondShelf = document.querySelectorAll('.routine-shelf-scroll')[1];
      const secondCards = [...(secondShelf?.querySelectorAll('.routine-card') ?? [])].slice(0, 3).map(element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width, height: r.height };
      });
      const filters = [...document.querySelectorAll('.routine-filters select')].map(element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width, height: r.height };
      });
      return {
        viewport: box('.viewport'), nav: box('.bottom-nav'), page: box('.routine-library'),
        title: box('.routine-intro h1'), firstShelf: box('.routine-shelf'),
        firstCard: cards[0], secondCards, filters,
        shelfCount: document.querySelectorAll('.routine-shelf').length,
        spriteSize: getComputedStyle(document.querySelector('.routine-card-icon-slot')).backgroundSize,
        documentScrollWidth: document.documentElement.scrollWidth,
      };
    });
    console.log('LAYOUT_' + width + '=' + JSON.stringify(result));
    assert(result.filters.length === 4, 'all four filters must exist');
    assert(result.filters[3].right <= width - 8, 'last filter is clipped at ' + width);
    assert(result.firstCard.width <= 140 && result.firstCard.height <= 100, 'cards are still too large');
    assert(result.secondCards.length >= 3, 'Standards shelf needs at least three seeded routines');
    assert(result.secondCards[2].right <= width + 3, 'third card should be visible before scrolling at ' + width);
    assert(result.viewport.bottom <= result.nav.top + 2, 'scroll area runs underneath navigation');
    assert(result.spriteSize === '120px 80px', 'pixel icons sized incorrectly');
    assert(result.documentScrollWidth <= width + 1, 'document horizontal overflow');
    if (width === 430) {
      const image = await page.screenshot({ type: 'png' });
      const b64 = image.toString('base64');
      console.log('SCREENSHOT_BEGIN');
      for (let i = 0; i < b64.length; i += 2000) console.log('SCREENSHOT_PART:' + b64.slice(i, i + 2000));
      console.log('SCREENSHOT_END');
    }
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
