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
    for (const theme of ['light', 'dark']) {
      for (const catMode of [false, true]) {
    const shot = width + 'x' + height + '-' + theme + '-cat-' + (catMode ? 'on' : 'off');
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      colorScheme: theme, reducedMotion: 'reduce',
    });
    await context.addInitScript(({ theme, catMode }) => {
      localStorage.setItem('little-jazz-room:appearance:v1', theme);
      localStorage.setItem('little-jazz-room:decorative-cats:v1', String(catMode));
    }, { theme, catMode });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Free Practice/ }).click();
    await page.waitForURL(url => url.pathname === '/free-practice');
    await page.getByRole('heading', { name: 'Free Practice' }).waitFor();
    assert(await page.locator('.chord-grid').count() === 0, 'Free Practice must not auto-select a random chart');
    assert(await page.locator('.fp-intro').isVisible(), 'Free Practice should begin with the approved intro');
    assert(await page.locator('.fp-intro-cat').count() === Number(catMode), 'Intro cat must disappear without an empty placeholder when Cat Mode OFF');
    const art = await page.locator('.fp-intro-art img, .fp-intro-start img').evaluateAll(images =>
      images.map(img => ({ src: img.getAttribute('src'), loaded: img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0 })));
    assert(art.every(item => item.loaded), 'Approved pixel assets must load: ' + JSON.stringify(art));
    await page.screenshot({ path: join(output, 'intro-' + shot + '.png'), fullPage: true });

    await page.getByRole('button', { name: 'Start Practice', exact: true }).click();
    assert((await page.locator('.fp-target-picker strong').innerText()).trim() === '25:00', 'Default practice target should be 25:00');
    await page.getByRole('button', { name: 'Decrease time goal by 5 minutes' }).click();
    assert((await page.locator('.fp-target-picker strong').innerText()).trim() === '20:00', 'Time target decrement did not work');
    await page.getByRole('button', { name: 'Increase time goal by 5 minutes' }).click();
    assert((await page.locator('.fp-target-picker strong').innerText()).trim() === '25:00', 'Time target increment did not work');
    await page.screenshot({ path: join(output, 'setup-' + shot + '.png'), fullPage: true });

    await page.getByRole('button', { name: 'Exercise', exact: true }).click();
    await page.locator('.fp-picker').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, 'exercise-picker-' + shot + '.png'), fullPage: true });
    await page.getByRole('button', { name: '+ Scales' }).click();
    assert(await page.locator('.fp-queue-item').count() === 1, 'Technique was not added');
    await page.getByRole('button', { name: 'Goal', exact: true }).click();
    await page.getByRole('textbox', { name: 'Custom practice goal' }).fill('Smooth ii-V-I changes');
    await page.getByRole('button', { name: 'Add Goal' }).click();
    assert(await page.locator('.fp-queue-item').count() === 2, 'Personal goal was not added');
    await page.getByRole('button', { name: 'Chart', exact: true }).click();
    await page.screenshot({ path: join(output, 'chart-picker-' + shot + '.png'), fullPage: true });
    await page.locator('.fp-picker-results button').first().click();
    assert(await page.locator('.fp-queue-item').count() === 3, 'Chart was not added');
    await page.locator('.fp-queue-title').last().click();
    await page.locator('.fp-chart .chord-grid').waitFor();
    await page.getByRole('checkbox', { name: 'Completed Scales' }).check();

    await page.getByRole('button', { name: 'Routine', exact: true }).click();
    await page.screenshot({ path: join(output, 'routine-picker-' + shot + '.png'), fullPage: true });
    await page.getByRole('button', { name: 'Backing Track', exact: true }).click();
    await page.screenshot({ path: join(output, 'track-picker-' + shot + '.png'), fullPage: true });
    await page.locator('.fp-picker-results button').first().click();
    const audioSrc = await page.locator('.fp-audio audio').getAttribute('src');
    assert(audioSrc?.includes('/audio/backing-tracks/autumn-leaves.m4a'), 'Expected a real cataloged backing track');
    const playable = await page.request.get(base + audioSrc);
    assert(playable.status() === 200, 'Cataloged backing-track media file must exist');
    await page.locator('.fp-queue').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, 'with-items-' + shot + '.png'), fullPage: true });

    await page.getByRole('button', { name: 'Start practice timer' }).click();
    assert(await page.locator('.fp-chart').count() === 0, 'Starting the clock should collapse details so timer and actions remain easy to find');
    assert(await page.locator('.fp-condensed .fp-activity-glyph').count() === 3, 'Active view should render a compact icon-led summary');
    const layout = await page.evaluate(() => {
      const queue = document.querySelector('.fp-queue')?.getBoundingClientRect();
      const controls = document.querySelector('.fp-session-actions')?.getBoundingClientRect();
      return { summaryBottom: queue?.bottom ?? Infinity, controlsTop: controls?.top ?? -1 };
    });
    assert(layout.summaryBottom <= layout.controlsTop + 1, 'Session list overlaps Pause/Finish on ' + shot + ': ' + JSON.stringify(layout));
    await page.waitForTimeout(1350);
    await page.locator('.fp-timer').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(output, 'active-' + shot + '.png'), fullPage: true });
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    await page.screenshot({ path: join(output, 'paused-' + shot + '.png'), fullPage: true });
    assert(await page.getByRole('timer').innerText() !== '00:00', 'Practice timer did not advance');
    await page.getByRole('button', { name: 'Finish Session' }).click();
    await page.getByText('Session Saved ✓').waitFor();
    assert(await page.locator('.fp-completion-card h1').isVisible(), 'Completion headline should be visible after saving');
    const actionReach = await page.evaluate(() => {
      const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
      const action = document.querySelector('.fp-completion-actions button:last-child')?.getBoundingClientRect();
      return { navTop: nav?.top ?? 0, actionBottom: action?.bottom ?? Infinity };
    });
    assert(actionReach.actionBottom <= actionReach.navTop + 1, 'Completion actions clip under the bottom navigation: ' + JSON.stringify(actionReach));
    await page.screenshot({ path: join(output, 'completed-' + shot + '.png'), fullPage: true });
    const records = await page.evaluate(() => {
      const key = 'little-jazz-room:practice-sessions:v1:anonymous';
      return JSON.parse(localStorage.getItem(key) || '[]');
    });
    assert(records.length === 1 && records[0].durationSeconds >= 1, 'Expected one actual persisted session');
    assert(!records[0].routineId, 'Free practice must not become a guided routine');
    await page.getByRole('button', { name: /View Saved Session/ }).click();
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
    if (width === 390 && theme === 'light' && catMode) {
      // Real timer state after 12m34s of virtual elapsed time, matching the owner's
      // approved illustrative ring without putting a fake duration in production.
      const reference = await context.newPage();
      await reference.goto(base + '/free-practice', { waitUntil: 'networkidle' });
      await reference.getByRole('button', { name: 'Start Practice', exact: true }).click();
      await reference.getByRole('button', { name: 'Goal', exact: true }).click();
      await reference.getByRole('textbox', { name: 'Custom practice goal' }).fill('Work on ii-V-I');
      await reference.getByRole('button', { name: 'Add Goal' }).click();
      await reference.getByRole('button', { name: 'Chart', exact: true }).click();
      await reference.locator('.fp-picker-results button').first().click();
      await reference.getByRole('button', { name: 'Exercise', exact: true }).click();
      await reference.locator('.fp-picker-results button').first().click();
      await reference.clock.install();
      await reference.getByRole('button', { name: 'Start practice timer' }).click();
      await reference.clock.fastForward(754000);
      assert((await reference.getByRole('timer').innerText()).trim() === '12:34',
        'Reference capture should reflect real elapsed timer behavior');
      await reference.screenshot({ path: join(output, 'reference-timer-12m34s-' + shot + '.png'), fullPage: true });
      await reference.close();
    }
    console.log('PASS Free Practice ' + shot + ': no random chart, timer, queue, real audio, unique save, Progress/reload/replay');
    await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
