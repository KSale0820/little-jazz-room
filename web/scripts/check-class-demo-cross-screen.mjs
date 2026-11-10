// Cross-screen mobile screenshot and integration guard for approved class-demo layouts.
// Does not change product state, seed progress, or substitute mockup screenshots.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs/screenshots/class-demo-cross-screen');
mkdirSync(output, { recursive: true });
const screens = [
  ['P01-practice-root', '/', '.p01-page'],
  ['T01-tracks', '/tracks', '.t01-page'],
  ['T02-charts-redirect', '/charts', '.t01-page'],
  ['P01-practice-direct', '/practice', '.p01-page'],
  ['R01-routine-library', '/routines', '.routine-library'],
  ['R03-routine-builder', '/create', '.routine-builder'],
  ['G01-progress-empty', '/progress', '.g01-page'],
  ['P04-tuner', '/tuner', '.tool-tuner'],
  ['P05-metronome', '/metronome', '.tool-metronome'],
];
const sizes = [[390, 844], [375, 667]];
const reports = [];
const browser = await chromium.launch({ headless: true });

function check(condition, message) {
  if (!condition) throw Error(message);
}

try {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const verify = async (name, selector) => {
      await page.locator(selector).waitFor({ state: 'visible' });
      await page.evaluate(async () => {
        await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
        await document.fonts?.ready;
      });
      const state = await page.evaluate(() => {
        const nav = document.querySelector('.bottom-nav');
        const navRect = nav?.getBoundingClientRect();
        const brokenImages = [...document.images]
          .filter(img => img.complete && img.naturalWidth === 0)
          .map(img => img.getAttribute('src'));
        return {
          width: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          navCount: nav?.querySelectorAll('a').length ?? 0,
          navBottom: navRect?.bottom ?? 0,
          navTop: navRect?.top ?? 0,
          brokenImages,
        };
      });
      check(state.navCount === 4, name + ': bottom nav must have exactly four tabs');
      check(state.width - state.clientWidth <= 1, name + ': horizontal overflow ' + JSON.stringify(state));
      check(state.navTop >= 0 && state.navBottom <= height + 1, name + ': clipped bottom navigation');
      check(state.brokenImages.length === 0, name + ': missing approved images ' + state.brokenImages.join(', '));
      check(errors.length === 0, name + ': JavaScript errors ' + errors.join(' | '));
      await page.screenshot({
        path: join(output, name + '-' + width + 'x' + height + '.png'),
        animations: 'disabled',
      });
      reports.push({ screen: name, width, height, ...state, status: 'PASS' });
    };

    for (const [name, path, selector] of screens) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await verify(name, selector);
      if (name.startsWith('P01-')) {
        check(new URL(page.url()).pathname === '/practice',
          'Practice-first root/direct navigation must resolve to /practice');
        check(await page.locator('.p01-tool').count() === 2,
          'P01 must expose Tuner and Metronome as quick tools');
        check(await page.locator('.p01-action').count() === 3,
          'P01 must show Free, Track, and Routine actions');
        check(!(await page.locator('.p01-preview').count()),
          'P01 must not show obsolete microphone or metronome preview');
      }
    }

    // Free Practice now begins as an independent timer, not a seeded chart.
    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Free Practice/ }).click();
    await page.waitForURL(url => url.pathname === '/free-practice');
    await verify('P02-free-timer', '.fp-page');
    check(await page.locator('.chord-grid .measure').count() === 0,
      'Free Practice must not auto-load an unrelated chart');

    await page.goto(base + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await page.waitForURL(url => url.pathname === '/player');
    await page.getByRole('tab', { name: 'Chart' }).click();
    check(await page.locator('.chord-grid .measure').count() === 12,
      'P02 Guided: full chart not present');
    await verify('P02-guided-chart', '.practice-player');

    await context.close();
    console.log('PASS cross-screen mobile captures and structural checks at ' + width + 'x' + height);
  }
} finally {
  await browser.close();
}
writeFileSync(join(output, 'cross-screen-report.json'), JSON.stringify(reports, null, 2));
