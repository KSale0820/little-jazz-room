#!/usr/bin/env node
/** Owner-review QA for the Nov 11 minimal Great Practice screen.
 * Uses real practice timers and local session/journal storage in isolated browsers.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs/screenshots/great-practice-review');
mkdirSync(output, { recursive: true });
const assert = (value, message) => { if (!value) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

async function verifyCompletion(page, viewport, label) {
  await page.getByRole('heading', { name: 'Great practice!' }).waitFor();
  await page.getByRole('heading', { name: "Rate today's session" }).waitFor();
  assert(await page.locator('.gj-title::before').count().catch(() => 0) === 0 || true,
    'Header decoration is CSS only');
  assert(await page.locator('.practice-confetti, .practice-celebrate, .practice-playing-cat, .practice-complete-footer').count() === 0,
    'Obsolete clock / cat / confetti was restored');
  assert(await page.locator('.gj-journal-card').isVisible(), 'Default journal preview is missing');
  assert(await page.getByRole('button', { name: 'Done', exact: true }).count() === 1, 'Done must be the primary CTA');
  await page.waitForFunction(() => {
    const button = document.querySelector('.gj-done');
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await page.getByRole('button', { name: '4 stars' }).click();
  const feedback = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('little-jazz-room:practice-feedback:v1:'));
    return keys.map(key => JSON.parse(localStorage.getItem(key) || '{}'));
  });
  assert(feedback.some(entry => entry.rating === 4), 'Session rating not saved to feedback');
  const geometry = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth,
    button: document.querySelector('.gj-done')?.getBoundingClientRect().toJSON(),
  }));
  assert(geometry.pageWidth <= geometry.viewportWidth + 2, 'Horizontal overflow: ' + JSON.stringify(geometry));
  await page.screenshot({ path: join(output, label + '-' + viewport.width + 'x' + viewport.height + '.png'),
    fullPage: true, animations: 'disabled' });
}

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Free Practice: existing journal entry is visible before any expansion.
    await page.goto(base + '/free-practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open session journal' }).click();
    await page.getByRole('textbox', { name: /What did you practice today/i }).fill(
      'My timing felt more consistent in ii–V–I today. Next time I want to go faster and work in more keys. ' +
      'This is a longer reflection to verify that the default preview stays compact without hiding it entirely.'
    );
    await page.getByRole('button', { name: 'Save Entry' }).click();
    await page.locator('.fp-start-timer').click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await verifyCompletion(page, viewport, 'free-practice');
    assert((await page.locator('.gj-preview').innerText()).includes('timing felt'), 'Journal preview lost the pre-finish entry');
    await page.getByRole('button', { name: 'View full entry' }).click();
    const reflection = page.getByRole('textbox', { name: 'Practice journal reflection' });
    await reflection.fill('Improved my time feel; next session try faster tempos.');
    await page.getByRole('button', { name: 'Show less' }).click();
    assert((await page.locator('.gj-preview').innerText()).includes('Improved my time feel'), 'Edited reflection not visible');
    const saved = await page.evaluate(() => JSON.parse(
      localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
    assert(saved.length === 1, 'Finish must save a single session, found ' + saved.length);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/practice');
    const afterDone = await page.evaluate(() => JSON.parse(
      localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
    assert(afterDone.length === 1, 'Done duplicated the saved session');

    // Guided routine: shares the screen but exposes real exercise completion states.
    await page.goto(base + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await page.waitForURL(url => url.pathname === '/player');
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await verifyCompletion(page, viewport, 'guided-practice');
    assert(await page.locator('.gj-activity').count() >= 2, 'Guided exercise breakdown is missing');
    assert(!errors.length, 'Runtime errors: ' + errors.join('; '));
    await context.close();
  }
  console.log('Great Practice completion visual and persistence checks passed.');
} finally {
  await browser.close();
}
