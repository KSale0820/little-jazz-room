import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const directory = 'docs/screenshots/p02-recorded-audio';
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const { width, height } of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const faults = [];
    page.on('pageerror', error => faults.push(error.message));
    const size = width + 'x' + height;

    await page.goto(base + '/player?recording=autumn-leaves', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Autumn Leaves' }).waitFor();
    assert.equal(await page.getByRole('tab', { name: 'Player' }).getAttribute('aria-selected'), 'true');
    await page.screenshot({ path: directory + '/' + size + '-audio-player-opening.png', fullPage: true });
    await page.getByRole('tab', { name: 'Chart' }).click();
    await page.getByText('No chart linked', { exact: true }).waitFor();
    assert.equal(await page.locator('.chord-grid').count(), 0, 'unlinked audio cannot show a seeded chart');
    await page.screenshot({ path: directory + '/' + size + '-audio-no-linked-chart.png', fullPage: true });

    await page.getByRole('tab', { name: 'Player' }).click();
    await page.getByRole('slider', { name: 'Seek recording' }).waitFor();
    await page.screenshot({ path: directory + '/' + size + '-audio-player.png', fullPage: true });
    const media = await page.locator('audio').evaluate(async element => {
      if (element.readyState >= 1) return { duration: element.duration, ready: true };
      return await new Promise(resolve => {
        element.addEventListener('loadedmetadata', () => resolve({ duration: element.duration, ready: true }), { once: true });
        element.addEventListener('error', () => resolve({ duration: 0, ready: false }), { once: true });
        setTimeout(() => resolve({ duration: 0, ready: false }), 6000);
      });
    });
    assert(media.ready && media.duration > 0, 'real uploaded recording metadata must load');
    await page.getByRole('button', { name: 'Play recording and start practice timer' }).click();
    await page.waitForTimeout(450);
    assert(await page.locator('audio').evaluate(el => !el.paused), 'audio must actually play');
    await page.getByRole('button', { name: 'Pause recording and practice timer' }).click();
    assert(await page.locator('audio').evaluate(el => el.paused), 'audio must pause');
    await page.getByRole('slider', { name: 'Seek recording' }).fill('8');
    const pos = await page.locator('audio').evaluate(el => el.currentTime);
    assert(Math.abs(pos - 8) < 1.5, 'seek must update media clock');
    await page.getByRole('button', { name: 'Restart recording' }).first().click();
    assert((await page.locator('audio').evaluate(el => el.currentTime)) < 1.5, 'restart must seek to zero');
    await page.getByRole('button', { name: 'Finish Session' }).click();
    await page.getByRole('heading', { name: 'Great practice!' }).waitFor();

    await page.goto(base + '/player?chart=blues-f-12', { waitUntil: 'networkidle' });
    await page.getByRole('tabpanel', { name: 'Jazz chord chart' }).waitFor();
    assert((await page.locator('.chord-grid .measure').count()) >= 12, 'approved chart grid must render');
    await page.screenshot({ path: directory + '/' + size + '-approved-chord-grid.png', fullPage: true });
    await page.getByRole('tab', { name: 'Player' }).click();
    await page.getByText('Chart Only · No Recording').waitFor();
    await page.screenshot({ path: directory + '/' + size + '-approved-player.png', fullPage: true });
    assert.deepEqual(faults, [], 'no browser exceptions');
    await context.close();
  }
} finally { await browser.close(); }
