// Capture both palettes and Cat Mode states at the two approved phone widths.
// Does not change production content, record sessions, or require a cloud account.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const output = path.resolve('docs/screenshots/clean-pixel-qa');
await mkdir(output, { recursive: true });

const routes = [
  ['Practice', '/practice', '.p01-page'],
  ['Player', '/player?mode=free', '.practice-player'],
  ['Tracks', '/tracks', '.t01-page'],
  ['Routines', '/routines', '.routine-library'],
  ['Progress', '/progress', '.g01-page'],
  ['Profile', '/profile', '.profile-page'],
  ['Tuner', '/tuner', '.tool-tuner'],
  ['Metronome', '/metronome', '.tool-metronome'],
];
const report = [];
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

function assertWithinViewport(state, label, height) {
  assert.ok(state.overflow <= 1, label + ' horizontal overflow: ' + state.overflow);
  assert.equal(state.navCount, 4, label + ' must keep four navigation tabs');
  assert.ok(state.navTop >= 0 && state.navBottom <= height + 1,
    label + ' bottom navigation clips viewport: ' + JSON.stringify(state));
}

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const theme of ['light', 'dark']) {
      for (const catMode of [false, true]) {
        const label = width + 'x' + height + '-' + theme + '-cat-' + (catMode ? 'on' : 'off');
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: 1,
          isMobile: true,
          hasTouch: true,
          reducedMotion: 'reduce',
          colorScheme: theme,
        });
        // Runs before the inline HTML bootstrap so screenshots test the first paint.
        await context.addInitScript(({ theme, catMode }) => {
          localStorage.setItem('little-jazz-room:appearance:v1', theme);
          localStorage.setItem('little-jazz-room:decorative-cats:v1', String(catMode));
        }, { theme, catMode });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        for (const [screen, url, selector] of routes) {
          await page.goto(base + url, { waitUntil: 'networkidle' });
          await page.locator(selector).first().waitFor({ state: 'visible' });
          await page.evaluate(async () => {
            await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
            await document.fonts?.ready;
          });
          const state = await page.evaluate(() => {
            const nav = document.querySelector('nav.bottom-nav');
            const rect = nav?.getBoundingClientRect();
            return {
              theme: document.documentElement.dataset.theme,
              catMode: document.documentElement.dataset.catMode,
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              navCount: nav?.querySelectorAll('a').length ?? 0,
              navTop: rect?.top ?? -1,
              navBottom: rect?.bottom ?? -1,
              catVisibility: document.querySelector('.g01-cat')
                ? getComputedStyle(document.querySelector('.g01-cat')).visibility : null,
              chartCells: document.querySelectorAll('.chord-grid .measure').length,
            };
          });
          assert.equal(state.theme, theme, screen + ' wrong palette');
          assert.equal(state.catMode, catMode ? 'on' : 'off', screen + ' wrong Cat Mode');
          assertWithinViewport(state, label + '-' + screen, height);
          if (screen === 'Progress') {
            assert.equal(state.catVisibility, catMode ? 'visible' : 'hidden',
              'Decorative Progress cat visibility does not follow Cat Mode');
          }
          if (screen === 'Player') {
            assert.ok(state.chartCells >= 12, 'Free Practice chart missing complete 12-bar grid');
          }
          if (['Practice', 'Player', 'Progress', 'Profile'].includes(screen)) {
            await page.screenshot({
              path: path.join(output, screen.toLowerCase() + '-' + label + '.png'),
              animations: 'disabled',
            });
          }
          report.push({ screen, label, ...state, status: 'PASS' });
        }
        assert.deepEqual(errors, [], label + ' browser runtime exceptions');
        await context.close();
      }
    }
  }

  // Exercise actual controls (not direct localStorage writes) and confirm reload.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, colorScheme: 'dark',
    isMobile: true, hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(base + '/profile', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark',
    'First use should honor dark system preference');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'off',
    'First use should disable decorative cats');
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await page.getByRole('checkbox', { name: /Cat Mode/ }).check();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light',
    'Explicit Light preference must survive reload');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'on',
    'Cat Mode preference must survive reload');
  assert.equal(await page.getByRole('button', { name: 'Light', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await page.getByRole('checkbox', { name: /Cat Mode/ }).uncheck();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'off');
  await context.close();
  report.push({ screen: 'Settings persistence', label: '390x844', status: 'PASS' });
} finally {
  await browser.close();
}
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
console.log('PASS clean-pixel theme matrix, mobile geometry, chart rendering and preference persistence.');
