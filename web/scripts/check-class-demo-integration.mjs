// Controller-only E2E check: approved screens are read-only. No seeded sessions.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs/screenshots/class-demo-integration');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });

const assert = (condition, message) => { if (!condition) throw new Error(message); };

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const title = 'Class Demo Integration ' + width;

    await page.goto(base + '/', { waitUntil: 'networkidle' });
    assert(await page.locator('nav.bottom-nav a').count() === 4, 'Expected four approved navigation tabs');
    await page.getByRole('button', { name: 'Choose another routine' }).click();
    await page.waitForURL(url => url.pathname === '/routines');
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).waitFor();

    await page.getByRole('button', { name: /Create routine/i }).click();
    await page.waitForURL(url => url.pathname === '/create');
    await page.getByLabel(/Routine title/).fill(title);
    assert(await page.locator('.builder-step').count() >= 3,
      'Builder did not load warm-up, skill and chart steps');
    await page.screenshot({ path: join(output, 'routine-builder-' + width + 'x' + height + '.png') });
    await page.getByRole('button', { name: /Save routine/i }).click();
    await page.waitForURL(url => url.pathname === '/routines' && url.searchParams.get('tab') === 'my');
    await page.getByRole('button', { name: 'Open ' + title + ' in player' }).waitFor();
    await page.screenshot({ path: join(output, 'my-routines-' + width + 'x' + height + '.png') });

    await page.getByRole('button', { name: 'Open ' + title + ' in player' }).click();
    await page.waitForURL(url => url.pathname === '/player');
    await page.getByRole('heading', { name: title }).waitFor();
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1350);
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    const elapsed = await page.locator('[data-testid="session-elapsed"]').innerText();
    assert(elapsed !== '00:00' && elapsed !== '0:00', 'Practice timer failed to accumulate real time: ' + elapsed);
    await page.getByRole('button', { name: 'Resume practice timer' }).click();
    await page.waitForTimeout(350);
    await page.locator('.practice-more').click();
    await page.getByRole('heading', { name: 'Great practice!' }).waitFor();
    await page.getByRole('button', { name: '4 stars' }).click();
    await page.getByRole('button', { name: 'Save Session', exact: true }).click();
    await page.getByRole('button', { name: /Session Saved/ }).waitFor();

    const saved = await page.evaluate(() => ({
      sessions: JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'),
      feedbackKeys: Object.keys(localStorage).filter(key => key.startsWith('little-jazz-room:practice-feedback:v1:')),
    }));
    assert(saved.sessions.length === 1, 'Expected exactly one real saved session; found ' + saved.sessions.length);
    assert(saved.sessions[0].durationSeconds >= 1, 'Saved duration must reflect timer');
    assert(saved.feedbackKeys.length === 1, 'Expected one saved local feedback record');
    await page.screenshot({ path: join(output, 'completed-' + width + 'x' + height + '.png') });

    await page.getByRole('button', { name: 'View Progress' }).click();
    await page.waitForURL(url => url.pathname === '/progress');
    await page.getByRole('button', { name: 'Practice Again' }).waitFor();
    await page.screenshot({ path: join(output, 'progress-' + width + 'x' + height + '.png') });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Practice Again' }).waitFor();
    const afterReload = await page.evaluate(() => JSON.parse(
      localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
    assert(afterReload.length === 1 && afterReload[0].id === saved.sessions[0].id,
      'Session did not persist uniquely after reload');

    await page.goto(base + '/routines?tab=my', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open ' + title + ' in player' }).waitFor();

    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Browse Tracks' }).click();
    await page.waitForURL(url => url.pathname === '/tracks');
    await page.getByRole('button', { name: 'Practice After-Hours Blues with its linked chart' }).click();
    await page.waitForURL(url => url.pathname === '/player' && url.searchParams.get('chart') === 'blues-f-12');
    await page.getByText('Chart Only', { exact: true }).waitFor();
    assert(await page.locator('.practice-chart-scroll').isVisible(), 'Linked jazz chord chart missing');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 1, 'Unexpected horizontal page overflow: ' + overflow + 'px');
    assert(errors.length === 0, 'Browser exceptions: ' + errors.join(' | '));
    console.log('PASS integrated local demo at ' + width + 'x' + height
      + ': Home, seeded routine, custom builder, saved routine, timer, rate, single-save, Progress/reload, tracks/chart');
    await context.close();
  }
} finally {
  await browser.close();
}
