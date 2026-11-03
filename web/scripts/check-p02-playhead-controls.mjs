// Browser regression and actual mobile screenshots for chart timing and P02 controls.
// Run after starting Vite: APP_URL=http://127.0.0.1:5174 node scripts/check-p02-playhead-controls.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs/screenshots/p02-playhead-controls');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const check = (ok, message) => { if (!ok) throw new Error(message); };

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.setDefaultTimeout(12000);
    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Free Practice/ }).click();
    await page.waitForURL(url => url.pathname === '/player');
    const playhead = page.getByTestId('chart-playhead');
    const activeBar = () => page.locator('.measure[aria-current="true"]');
    check(await activeBar().count() === 1, 'Exactly one playhead measure is required');
    check(await activeBar().getAttribute('aria-label') !== null, 'Playhead must have an accessible measure label');

    await page.locator('#practice-bpm').fill('120');
    await page.locator('#practice-bpm').blur();
    check(await page.locator('#practice-bpm').inputValue() === '120', 'BPM numeric entry failed');
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1075);
    check(await playhead.textContent().then(text => text.includes('Bar 1 of 12') && text.includes('Beat 3')),
      '120 BPM did not reach beat 3 of bar 1 after one second');
    check(await activeBar().locator('.chord-active').count() === 1, 'Current chord event is not identified');
    await page.waitForTimeout(1100);
    check((await playhead.textContent()).includes('Bar 2 of 12'), '4/4 at 120 BPM failed to advance after two seconds');

    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    const pausedBar = await playhead.textContent();
    await page.waitForTimeout(650);
    check(await playhead.textContent() === pausedBar, 'Playhead advanced while paused');
    await page.getByRole('button', { name: /^Measure 8:/ }).click();
    check((await playhead.textContent()).includes('Bar 8 of 12'), 'Manual bar selection did not seek');
    await page.getByRole('button', { name: 'Next measure' }).click();
    check((await playhead.textContent()).includes('Bar 9 of 12'), 'Next measure control failed');
    await page.getByRole('button', { name: 'Previous measure' }).click();

    await page.locator('#practice-loop').selectOption('5-8');
    check(await page.locator('.measure.looped').count() === 4, 'Bars 5-8 range was not visually marked');
    check((await playhead.textContent()).includes('Bar 8 of 12'), 'Changing loop unexpectedly reset an in-range playhead');
    await page.getByRole('button', { name: 'Resume practice timer' }).click();
    await page.waitForTimeout(2150);
    check((await playhead.textContent()).includes('Bar 5 of 12'), 'Loop end did not return to bar 5');
    await page.locator('#practice-bpm').fill('180');
    await page.locator('#practice-bpm').blur();
    check(await page.getByTestId('session-elapsed').innerText() !== '00:00', 'Session timer reset on tempo change');
    check(await page.locator('.measure.looped').count() === 4, 'Tempo change lost loop range');

    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    await page.locator('#practice-loop').selectOption('all');
    await page.getByRole('button', { name: /^Measure 1:/ }).click();
    check((await activeBar().locator('.chord-active').innerText()) === 'F7', 'Concert F chord not visible');
    await page.locator('#practice-key').selectOption('G');
    check((await activeBar().locator('.chord-active').innerText()) === 'G7', 'Concert key transposition failed');
    await page.locator('#practice-key').selectOption('F');
    await page.locator('#practice-pitch').selectOption('Bb');
    check((await activeBar().locator('.chord-active').innerText()) === 'G7', 'B♭ written pitch failed');
    await page.locator('#practice-pitch').selectOption('Eb');
    check((await activeBar().locator('.chord-active').innerText()) === 'D7', 'E♭ written pitch failed');
    await page.locator('#practice-pitch').selectOption('C');
    await page.screenshot({ path: join(output, 'P02-free-chart-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await page.getByRole('tab', { name: 'Player' }).click();
    check(await page.locator('#practice-key').isVisible() && await page.locator('#practice-bpm').isVisible(), 'Player view lost independent controls');
    await page.screenshot({ path: join(output, 'P02-free-player-' + width + 'x' + height + '.png'), animations: 'disabled' });

    await page.goto(base + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await page.waitForURL(url => url.pathname === '/player');
    check(await page.getByText('Guided Practice', { exact: true }).first().isVisible(), 'Guided practice missing');
    check(await page.locator('#practice-key').count() === 1 && await page.locator('#practice-loop').count() === 1, 'Guided controls missing');
    await page.screenshot({ path: join(output, 'P02-guided-chart-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await page.getByRole('tab', { name: 'Player' }).click();
    await page.screenshot({ path: join(output, 'P02-guided-player-' + width + 'x' + height + '.png'), animations: 'disabled' });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Unexpected horizontal overflow');
    check(failures.length === 0, 'Browser exceptions: ' + failures.join(' | '));
    console.log('PASS chart clock and separate controls at ' + width + 'x' + height);
    await ctx.close();
  }
} finally {
  await browser.close();
}
