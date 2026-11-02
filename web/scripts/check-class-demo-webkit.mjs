// Safari-engine (WebKit) smoke QA for the mobile class demo; no physical microphone or speaker claims.
import { webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/class-demo-webkit');
mkdirSync(out, { recursive: true });
const views = [[390, 844], [375, 667]];
const paths = ['/', '/tracks', '/charts', '/practice', '/player', '/tuner', '/metronome', '/routines', '/create', '/progress', '/profile', '/explore'];
const report = [];
const must = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await webkit.launch({ headless: true });
try {
  for (const [width, height] of views) {
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const test = async (name, fn) => {
      try {
        await fn();
        report.push({ width, height, name, status: 'PASS' });
        console.log('PASS WebKit ' + width + 'x' + height + ' ' + name);
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        report.push({ width, height, name, status: 'FAIL', reason });
        console.error('FAIL WebKit ' + width + 'x' + height + ' ' + name + ': ' + reason);
      }
    };
    const go = async path => page.goto(base + path, { waitUntil: 'networkidle' });
    for (const path of paths) {
      await test('render ' + path, async () => {
        await go(path);
        await page.evaluate(async () => {
          await Promise.all([...document.images].map(x => x.decode().catch(() => undefined)));
          if (document.fonts?.ready) await document.fonts.ready;
        });
        const health = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src),
        }));
        must(health.overflow <= 1, 'Horizontal overflow ' + health.overflow);
        must(health.broken.length === 0, 'Broken images ' + health.broken.join(', '));
        must(await page.locator('nav.bottom-nav a').count() === 4, 'Four tabs missing');
        if (['/','/tracks','/practice','/player','/tuner','/metronome','/progress'].includes(path)) {
          await page.screenshot({
            path: join(out, (path === '/' ? 'home' : path.slice(1)) + '-' + width + 'x' + height + '.png'),
            fullPage: false,
          });
        }
      });
    }
    await test('navigation + hotspot taps', async () => {
      await go('/');
      await page.getByRole('button', { name: 'Piano: open Practice' }).click();
      must(new URL(page.url()).pathname === '/practice', 'Practice hotspot failed');
      await page.locator('nav.bottom-nav').getByRole('link', { name: 'Tracks' }).click();
      must(new URL(page.url()).pathname === '/tracks', 'Tracks nav failed');
      await page.getByRole('button', { name: 'Charts' }).click();
      must(new URL(page.url()).pathname === '/charts', 'Charts nav failed');
    });
    await test('P01 tool links + back controls', async () => {
      await go('/practice');
      await page.getByRole('button', { name: /Tuner Check your pitch/ }).click();
      must(new URL(page.url()).pathname === '/tuner', 'Tuner link failed');
      await page.getByRole('button', { name: 'Tuner help' }).click();
      must(await page.locator('.tool-help').isVisible(), 'Tuner help did not show');
      await page.getByRole('button', { name: 'Back to Practice' }).click();
      await page.getByRole('button', { name: /Metronome Keep steady time/ }).click();
      must(new URL(page.url()).pathname === '/metronome', 'Metronome link failed');
      await page.getByRole('button', { name: 'Increase tempo by 1 BPM' }).click();
      must(await page.locator('.metronome-bpm strong').innerText() === '101', 'WebKit metronome BPM button failed');
    });
    await test('R01 presets + P02 tabs + routine builder', async () => {
      await go('/routines');
      await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
      await page.getByRole('tab', { name: 'Player' }).click();
      must(await page.getByRole('tabpanel', { name: 'Chart only player' }).isVisible(), 'Player toggle failed');
      await page.getByRole('tab', { name: 'Chart' }).click();
      must(await page.getByRole('tabpanel', { name: 'Jazz chord chart' }).isVisible(), 'Chart toggle failed');
      await go('/create');
      await page.getByLabel(/Routine title/).fill('WebKit draft ' + width);
      await page.getByRole('button', { name: 'Save draft' }).click();
      await page.reload({ waitUntil: 'networkidle' });
      must((await page.getByLabel(/Routine title/).inputValue()) === 'WebKit draft ' + width, 'Draft persistence failed');
    });
    await test('WebKit no JavaScript exceptions', async () => {
      must(errors.length === 0, errors.join(' | '));
    });
    await context.close();
  }
} finally { await browser.close(); }
writeFileSync(join(out, 'webkit-report.json'), JSON.stringify(report, null, 2));
const failures = report.filter(r => r.status === 'FAIL');
console.log('WEBKIT_QA_RESULT ' + JSON.stringify({ total: report.length, passed: report.length - failures.length, failed: failures.length, failures }));
if (failures.length) process.exitCode = 1;
