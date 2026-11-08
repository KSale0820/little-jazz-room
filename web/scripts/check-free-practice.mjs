// End-to-end Free Practice smoke test at both supported iPhone sizes.
// Run with Vite serving http://127.0.0.1:5174 (or APP_URL).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs/screenshots/free-practice');
mkdirSync(output, { recursive: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Free Practice/ }).click();
    await page.waitForURL(url => url.pathname === '/free-practice');
    await page.getByRole('heading', { name: 'Free Practice' }).waitFor();
    assert(await page.locator('.chord-grid').count() === 0, 'Free Practice must not auto-select a random chart');
    assert((await page.getByRole('timer').innerText()).trim() === '00:00', 'Timer should start at zero');
    await page.screenshot({ path: join(output, 'empty-' + width + 'x' + height + '.png') });

    await page.getByRole('button', { name: 'Exercise', exact: true }).click();
    await page.getByRole('button', { name: '+ Scales' }).click();
    assert(await page.locator('.fp-queue-item').count() === 1, 'Technique was not added');
    await page.getByRole('button', { name: 'Chart', exact: true }).click();
    await page.locator('.fp-picker-results button').first().click();
    assert(await page.locator('.fp-queue-item').count() === 2, 'Chart was not added');
    await page.locator('.fp-queue-title').last().click();
    await page.locator('.fp-chart .chord-grid').waitFor();
    await page.getByRole('checkbox', { name: 'Completed Scales' }).check();

    await page.getByRole('button', { name: 'Backing Track', exact: true }).click();
    await page.locator('.fp-picker-results button').first().click();
    const audioSrc = await page.locator('.fp-audio audio').getAttribute('src');
    assert(audioSrc?.includes('/audio/backing-tracks/autumn-leaves.m4a'), 'Expected a real cataloged backing track');
    const playable = await page.request.get(base + audioSrc);
    assert(playable.status() === 200, 'Cataloged backing-track media file must exist');
    await page.screenshot({ path: join(output, 'with-items-' + width + 'x' + height + '.png') });

    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1350);
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    assert(await page.getByRole('timer').innerText() !== '00:00', 'Practice timer did not advance');
    await page.getByRole('button', { name: 'Finish Session' }).click();
    await page.getByRole('heading', { name: 'Practice complete' }).waitFor();
    const records = await page.evaluate(() => {
      const key = 'little-jazz-room:practice-sessions:v1:anonymous';
      return JSON.parse(localStorage.getItem(key) || '[]');
    });
    assert(records.length === 1 && records[0].durationSeconds >= 1, 'Expected one actual persisted session');
    assert(!records[0].routineId, 'Free practice must not become a guided routine');
    await page.getByRole('button', { name: 'View Progress' }).click();
    await page.waitForURL(url => url.pathname === '/progress');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Practice Again' }).click();
    await page.waitForURL(url => url.pathname === '/free-practice');
    assert(await page.locator('.chord-grid').count() === 0, 'Free practice replay inserted an unrelated chart');
    await page.goto(base + '/player?mode=free', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Free Practice' }).waitFor();
    assert(await page.locator('.chord-grid').count() === 0, 'Legacy free-mode link inserted a chart');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 1, 'Unexpected horizontal overflow: ' + overflow);
    assert(errors.length === 0, 'Browser errors: ' + errors.join(' | '));
    console.log('PASS Free Practice ' + width + 'x' + height + ': no random chart, timer, queue, real audio, unique save, Progress/reload/replay');
    await context.close();
  }
} finally {
  await browser.close();
}
