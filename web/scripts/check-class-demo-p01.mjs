// Practice-first landing and navigation regression check; captures both account states.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs', 'screenshots', 'class-demo-p01');
mkdirSync(out, { recursive: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const state of ['empty', 'returning']) {
      const context = await browser.newContext({
        viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      if (state === 'returning') {
        await page.addInitScript(() => {
          localStorage.setItem('little-jazz-room:practice-sessions:v1:anonymous', JSON.stringify([{
            id: 'p01-returning-user',
            finishedAt: new Date().toISOString(),
            durationSeconds: 1200,
            routineId: 'daily-warm-up',
          }]));
        });
      }

      await page.goto(base + '/', { waitUntil: 'networkidle' });
      await page.waitForURL(url => url.pathname === '/practice');
      await page.locator('.p01-page').waitFor({ state: 'visible' });
      await page.evaluate(async () => {
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
        await document.fonts?.ready;
      });
      const labels = await page.locator('nav.bottom-nav a').allTextContents();
      assert(JSON.stringify(labels.map(label => label.trim())) === JSON.stringify([
        'Practice', 'Tracks', 'Routines', 'Progress'
      ]), 'Unexpected bottom tab labels/order: ' + JSON.stringify(labels));
      const hrefs = await page.locator('nav.bottom-nav a').evaluateAll(
        links => links.map(link => link.getAttribute('href'))
      );
      assert(JSON.stringify(hrefs) === JSON.stringify(['/practice', '/tracks', '/routines', '/progress']),
        'Unexpected tab destinations: ' + JSON.stringify(hrefs));
      assert(await page.getByRole('heading', { name: "Let's Practice" }).isVisible(), 'Heading missing');
      assert(await page.getByRole('button', { name: /Free Practice/ }).isVisible(), 'Free Practice missing');
      assert(await page.getByRole('button', { name: /Practice with a Track/ }).isVisible(), 'Track action missing');
      assert(await page.getByRole('button', { name: /Follow a Routine/ }).isVisible(), 'Routine action missing');
      assert(await page.getByRole('button', { name: 'Tuner' }).isVisible(), 'Tuner missing');
      assert(await page.getByRole('button', { name: 'Metronome' }).isVisible(), 'Metronome missing');
      assert((await page.getByRole('button', { name: /Continue Practice/ }).count()) === (state === 'returning' ? 1 : 0),
        'Continue Practice should appear only after a saved session');
      const goal = page.getByRole('progressbar', { name: 'Daily practice goal' });
      assert((await goal.getAttribute('aria-valuenow')) === (state === 'returning' ? '20' : '0'),
        'Progress not derived from actual sessions');

      const missingArt = await page.locator('.p01-page img').evaluateAll(
        images => images.filter(img => !img.naturalWidth).map(img => img.src)
      );
      assert(missingArt.length === 0, 'Missing approved art: ' + missingArt.join(', '));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert(overflow <= 1, 'Horizontal overflow: ' + overflow);
      const nav = await page.locator('nav.bottom-nav').boundingBox();
      assert(nav, 'Bottom navigation missing');
      const tabs = await page.locator('nav.bottom-nav a').all();
      for (const tab of tabs) {
        const box = await tab.boundingBox();
        assert(box && box.width >= 44 && box.height >= 44, 'Navigation tap target too small');
      }
      await goal.scrollIntoViewIfNeeded();
      const goalBox = await goal.boundingBox();
      assert(goalBox && goalBox.y + goalBox.height <= nav.y + 1,
        'Daily progress obscured by fixed bottom navigation');
      await page.screenshot({
        path: join(out, `P01-practice-hub-practice-first-${state}-${width}x${height}.png`),
        fullPage: false,
      });

      if (state === 'returning') {
        await page.getByRole('button', { name: /Continue Practice/ }).click();
        await page.waitForURL(url => url.pathname === '/player');
        await page.getByText('Guided Practice', { exact: true }).first().waitFor();
      } else {
        for (const [tab, path] of [
          ['Tracks', '/tracks'], ['Routines', '/routines'], ['Progress', '/progress'],
          ['Practice', '/practice'],
        ]) {
          await page.locator('nav.bottom-nav').getByRole('link', { name: tab, exact: true }).click();
          await page.waitForURL(url => url.pathname === path);
        }
        await page.getByRole('button', { name: /Practice with a Track/ }).click();
        await page.waitForURL(url => url.pathname === '/tracks');
        await page.goto(base + '/practice');
        await page.getByRole('button', { name: /Follow a Routine/ }).click();
        await page.waitForURL(url => url.pathname === '/routines');
        await page.goto(base + '/practice');
        await page.getByRole('button', { name: 'Tuner' }).click();
        await page.waitForURL(url => url.pathname === '/tuner');
        await page.goto(base + '/practice');
        await page.getByRole('button', { name: 'Metronome' }).click();
        await page.waitForURL(url => url.pathname === '/metronome');
        await page.goto(base + '/practice');
        await page.getByRole('button', { name: /Free Practice/ }).click();
        await page.waitForURL(url => url.pathname === '/player');
      }
      assert(errors.length === 0, 'Browser exceptions: ' + errors.join(' | '));
      console.log(`PASS Practice-first ${state} at ${width}x${height}: four tabs, routes, accurate progress, safe targets and screenshot`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
