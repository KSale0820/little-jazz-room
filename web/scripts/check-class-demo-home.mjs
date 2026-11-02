// Former H01 landing QA, retained as the root-redirect/navigation regression
// check. H01 assets and implementation remain in the repo but are not routable.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5174';
const outDir = join(process.cwd(), 'docs/screenshots/class-demo');
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const expectedTabs = [
  ['Practice', '/practice'],
  ['Tracks', '/tracks'],
  ['Routines', '/routines'],
  ['Progress', '/progress'],
];

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseUrl + '/', { waitUntil: 'networkidle' });
    await page.waitForURL(url => url.pathname === '/practice');
    await page.locator('.p01-page').waitFor({ state: 'visible' });
    assert((await page.locator('.h01-page').count()) === 0, 'H01 should not load at root');
    const nav = page.locator('nav.bottom-nav a');
    assert(await nav.count() === 4, 'Four bottom tabs required');
    const actualTabs = await nav.evaluateAll(
      links => links.map(link => [link.textContent?.trim(), link.getAttribute('href')])
    );
    assert(JSON.stringify(actualTabs) === JSON.stringify(expectedTabs),
      'Incorrect practice-first navigation: ' + JSON.stringify(actualTabs));
    const practiceTab = page.locator('nav.bottom-nav a[href="/practice"]');
    const active = await practiceTab.evaluate(link => ({
      current: link.classList.contains('current'),
      icon: getComputedStyle(link.querySelector('.pix')).maskImage,
    }));
    assert(active.current && active.icon.includes('/visuals/icons/nav-practice.svg'),
      'Practice tab should use its approved active pixel icon');
    const artPreserved = await page.evaluate(async () => {
      const response = await fetch('/visuals/room/h01-approved-room.jpeg');
      return response.ok && response.headers.get('content-type')?.startsWith('image/');
    });
    assert(artPreserved, 'Approved H01 room asset must remain available');

    await page.evaluate(() => document.fonts?.ready);
    await page.screenshot({
      path: join(outDir, `practice-first-root-${width}x${height}.png`),
      fullPage: false,
    });
    for (const [label, path] of expectedTabs.slice(1)) {
      await page.locator('nav.bottom-nav').getByRole('link', { name: label, exact: true }).click();
      await page.waitForURL(url => url.pathname === path);
    }
    await page.locator('nav.bottom-nav').getByRole('link', { name: 'Practice' }).click();
    await page.waitForURL(url => url.pathname === '/practice');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 1, 'Horizontal overflow: ' + overflow);
    assert(errors.length === 0, 'Browser errors: ' + errors.join(' | '));
    console.log(`PASS practice-first root, tab order, approved icon, retained room asset at ${width}x${height}`);
    await context.close();
  }
} finally {
  await browser.close();
}
