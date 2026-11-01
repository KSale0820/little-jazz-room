#!/usr/bin/env node
/**
 * P02/P06 owner-only browser QA. Run while Vite is serving web/:
 *   APP_URL=http://127.0.0.1:5174 node src/pages/practicePlayer.browser.mjs
 * Produces screenshots at 390x844 and 375x667 for all approved P02 states/P06.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../docs/screenshots/class-demo/p02');
const baseUrl = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) });
const viewports = [{ width: 390, height: 844 }, { width: 375, height: 667 }];

function check(value, message) {
  if (!value) throw new Error(message);
}
async function noOverflow(page, name) {
  const result = await page.evaluate(() => ({
    viewport: window.innerWidth,
    body: document.documentElement.scrollWidth,
  }));
  check(result.body <= result.viewport + 1, name + ': horizontal overflow (' + JSON.stringify(result) + ')');
}
async function capture(page, folder, name) {
  await noOverflow(page, name);
  await page.screenshot({ path: join(folder, name + '.png'), animations: 'disabled' });
  // Optional CI handoff: short base64 chunks avoid log-line limits.
  // These bytes come from the running app in Chromium, not the design mockup.
  if (process.env.P02_OUTPUT_LOG === '1') {
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 62, scale: 'css', animations: 'disabled' });
    const data = jpeg.toString('base64');
    const slug = folder.split('/').pop() + '/' + name;
    for (let i = 0; i < data.length; i += 12000) {
      console.log('P02_SCREENSHOT|' + slug + '|' + (i / 12000) + '|' + data.slice(i, i + 12000));
    }
  }
}
async function storageSessions(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
}
try {
  for (const viewport of viewports) {
    const folder = join(root, viewport.width + 'x' + viewport.height);
    mkdirSync(folder, { recursive: true });
    const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true });
    const page = await context.newPage();
    await page.goto(baseUrl + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Free Practice/ }).click();
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1250);
    check((await page.getByTestId('session-elapsed').textContent()) !== '00:00', 'Practice timer failed to start');
    await capture(page, folder, 'P02-free-chart-running');

    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    const paused = await page.getByTestId('session-elapsed').textContent();
    await page.waitForTimeout(1250);
    check(paused === (await page.getByTestId('session-elapsed').textContent()), 'Timer advanced while paused');
    await capture(page, folder, 'P02-paused-chart');

    const columnCount = await page.locator('.practice-chart-scroll .chord-grid').evaluate(el =>
      getComputedStyle(el).gridTemplateColumns.split(/\s+/).length);
    check(columnCount === 4, 'P02 chart stylesheet missing or grid not four columns');
    const measureCount = await page.locator('.practice-chart-scroll .measure').count();
    check(measureCount > 0, 'No jazz measures available');
    const chordsFit = await page.locator('.practice-chart-scroll .chords').evaluateAll(elements =>
      elements.every(element => element.scrollWidth <= element.clientWidth + 1));
    check(chordsFit, 'At least one chord label overflows its measure');
    await page.getByRole('tab', { name: 'Player' }).click();
    check(await page.getByText(/Chart Only · No Recording/).isVisible(), 'Missing honest no-recording state');
    check(await page.getByRole('button', { name: /Mixer Preview/ }).isDisabled(), 'Unavailable mixer appears functional');
    await capture(page, folder, 'P02-free-player-no-recording');

    await page.getByRole('button', { name: 'Resume practice timer' }).click();
    await page.waitForTimeout(1100);
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await page.getByRole('heading', { name: 'Great practice!' }).waitFor();
    console.log('P06_CAT_DIAG', JSON.stringify(await page.locator('.practice-playing-cat').evaluate(async img => {
      let status = 'fetch-error';
      try { status = String((await fetch(img.src)).status); } catch { /* preserve image diagnostic */ }
      return { src: img.src, width: img.naturalWidth, complete: img.complete, status };
    })));
    await capture(page, folder, 'P06-free-completion');
    await page.waitForFunction(() => {
      const cat = document.querySelector('.practice-playing-cat');
      return cat instanceof HTMLImageElement && cat.complete && cat.naturalWidth > 0;
    }, null, { timeout: 10000 });
    check(await page.locator('.practice-complete-footer').count() === 1, 'Missing selected musician on P06');
    await page.locator('.practice-playing-cat').scrollIntoViewIfNeeded();
    await capture(page, folder, 'P06-free-companion-bottom');
    await page.getByRole('textbox', { name: /Notes/ }).fill('Stayed with the changes.');
    await page.getByRole('button', { name: '4 stars' }).click();
    await page.getByRole('button', { name: 'Save Session', exact: true }).click();
    check((await storageSessions(page)).length === 1, 'First session did not persist exactly once');
    await page.getByRole('button', { name: 'View Progress' }).click();
    check((await storageSessions(page)).length === 1, 'Navigation duplicated the session');
    await page.reload({ waitUntil: 'networkidle' });
    check((await storageSessions(page)).length === 1, 'Reload lost session persistence');

    await page.goto(baseUrl + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await page.getByText('Guided Practice', { exact: true }).waitFor();
    await capture(page, folder, 'P02-guided-chart');
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1100);
    await page.getByRole('button', { name: /Next Step/ }).click();
    check(await page.getByText(/Step 2 of 3/).first().isVisible(), 'Guided step did not advance');
    await capture(page, folder, 'P02-guided-step-two');
    await page.getByRole('tab', { name: 'Player' }).click();
    await capture(page, folder, 'P02-guided-player');
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await capture(page, folder, 'P06-guided-completion');
    await page.locator('.practice-playing-cat').scrollIntoViewIfNeeded();
    await capture(page, folder, 'P06-guided-companion-bottom');
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    check((await storageSessions(page)).length === 2, 'Guided completion did not save once on exit');
    await context.close();
    console.log('PASS', viewport.width + 'x' + viewport.height, folder);
  }
} finally {
  await browser.close();
}
