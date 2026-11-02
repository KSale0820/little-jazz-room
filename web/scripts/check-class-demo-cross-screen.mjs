// Cross-screen mobile screenshot and integration guard for approved class-demo layouts.
// Does not change product state, seed progress, or substitute mockup screenshots.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs/screenshots/class-demo-cross-screen');
mkdirSync(output, { recursive: true });
const screens = [
  ['H01-home', '/', '.h01-page'],
  ['T01-tracks', '/tracks', '.t01-page'],
  ['T02-charts', '/charts', '.demo-page'],
  ['P01-practice-hub', '/practice', '.p01-page'],
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
      if (name === 'H01-home') {
        check(await page.locator('.h01-hotspot').count() === 4,
          'H01 must retain four room hotspots');
        check(!(await page.getByText("Let's practice with a backing track.").count()),
          'H01 must not advertise unavailable recorded playback');
      }
      if (name === 'P01-practice-hub') {
        check(await page.locator('.p01-tool').count() === 3,
          'P01 must keep Tuner, Metronome and Resume tools');
        check(!(await page.locator('.p01-preview').count()),
          'P01 must not show obsolete microphone or metronome preview');
      }
    }

    // Capture both player modes without changing PR #19's chart implementation.
    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Free Practice/ }).click();
    await page.waitForURL(url => url.pathname === '/player');
    await page.getByRole('tab', { name: 'Chart' }).click();
    check(await page.locator('.chord-grid .measure').count() === 12,
      'P02 Free: full 12-bar chart not present');
    await verify('P02-free-chart', '.practice-player');
    await page.getByRole('tab', { name: 'Player' }).click();
    await page.getByText('Chart Only · No Recording').waitFor();
    await verify('P02-free-player', '.practice-player');

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
