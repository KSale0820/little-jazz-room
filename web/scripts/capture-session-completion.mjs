#!/usr/bin/env node
/**
 * Real browser P06 review matrix. Start the app at APP_URL (default :5174),
 * then run: node scripts/capture-session-completion.mjs
 * Captures actual saved Free Practice sessions with Playwright's virtual clock:
 * 24 minutes (standard), 36 minutes (earned Milo after a saved 24-minute history).
 * Isolated test-only localStorage and virtual time never touch user practice data.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/session-completion-review');
mkdirSync(out, { recursive: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const theme of ['light', 'dark']) {
      for (const catMode of [false, true]) {
        for (const reward of [false, true]) {
          const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
          await context.addInitScript(({ theme, catMode, reward }) => {
            localStorage.setItem('little-jazz-room:appearance:v1', theme);
            localStorage.setItem('little-jazz-room:decorative-cats:v1', String(catMode));
            const key = 'little-jazz-room:practice-sessions:v1:anonymous';
            if (reward && !localStorage.getItem(key)) {
              localStorage.setItem(key, JSON.stringify([{
                id: 'previous-test-practice', finishedAt: new Date(Date.now() - 10000).toISOString(), durationSeconds: 1440,
              }]));
            }
          }, { theme, catMode, reward });
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          await page.goto(base + '/free-practice', { waitUntil: 'networkidle' });
          await page.getByRole('button', { name: 'Exercise', exact: true }).click();
          await page.getByRole('button', { name: '+ Scales' }).click();
          await page.getByRole('checkbox', { name: 'Completed Scales' }).check();
          await page.clock.install();
          await page.getByRole('button', { name: 'Start practice timer' }).click();
          await page.clock.fastForward((reward ? 36 : 24) * 60 * 1000);
          await page.getByRole('button', { name: 'Finish Session' }).click();
          await page.getByRole('heading', { name: /Session Complete!|Great practice!/i }).waitFor();
          await page.getByRole('button', { name: 'View Progress' }).waitFor({ timeout: 15000 });
          assert(await page.getByText(/Scales/).count() > 0, 'Completed activity missing');
          assert((await page.locator('.sc-duration strong').innerText()).trim() === (reward ? '36 min' : '24 min'), 'Actual clock duration missing');
          assert(await page.locator('.sc-unlock').count() === Number(reward), 'Incorrect reward state');
          assert((await page.locator('.sc-hero-cat').count() > 0) === catMode, 'Decorative Cat Mode mismatch');
          if (reward) assert(await page.locator('.sc-unlock-art img').count() === 1, 'Earned Milo not shown');
          assert(await page.evaluate(() => document.documentElement.dataset.theme) === theme, 'Wrong theme');
          await page.waitForFunction(() => [...document.querySelectorAll('.sc-page img')]
            .every(image => image.complete && image.naturalWidth > 0), null, { timeout: 12000 });
          assert(!await page.locator('.bottom-nav').isVisible(), 'Completion must hide the standard tab bar');
          const geometry = await page.evaluate(() => {
            const main = document.querySelector('.sc-primary')?.getBoundingClientRect();
            const secondary = document.querySelector('.sc-secondary')?.getBoundingClientRect();
            const hero = document.querySelector('.sc-hero-art')?.getBoundingClientRect();
            return { mainBottom: main?.bottom ?? Infinity, secondaryBottom: secondary?.bottom ?? Infinity,
              heroTop: hero?.top ?? -1, viewport: innerHeight };
          });
          assert(geometry.secondaryBottom <= geometry.viewport - 5,
            'Action buttons must remain inside the visible phone viewport: ' + JSON.stringify(geometry));
          assert(geometry.heroTop >= 0, 'Hero artwork must not be clipped: ' + JSON.stringify(geometry));
          assert(!await page.locator('.toast-message').isVisible(), 'Redundant save toast must not cover the completion');
          if (catMode && !reward) assert(await page.locator('.sc-sleep-zzz').count() === 1,
            'Approved sleep decoration missing');
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert(overflow <= 1, 'Horizontal overflow ' + overflow);
          const slug = [reward ? 'earned-milo' : 'standard', theme, catMode ? 'cat-on' : 'cat-off', width + 'x' + height].join('-');
          await page.screenshot({ path: join(out, slug + '.png'), fullPage: true, animations: 'disabled' });
          const before = await page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
          const newlySavedId = before.find(s => s.id !== 'previous-test-practice')?.id;
          assert(before.length === (reward ? 2 : 1), 'Session did not save exactly once');
          assert(before.some(s => s.id === newlySavedId && s.durationSeconds >= (reward ? 2160 : 1440)), 'Saved session clock duration was not persisted');
          await page.getByRole('button', { name: 'View Progress' }).click();
          await page.waitForURL(url => url.pathname === '/progress');
          await page.reload({ waitUntil: 'networkidle' });
          const after = await page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
          assert(after.length === before.length && after.some(s => s.id === newlySavedId), 'Completion-to-Progress persistence failed');
          assert(errors.length === 0, 'Browser errors: ' + errors.join(' | '));
          console.log('PASS', slug);
          await context.close();
        }
      }
    }
  }
} finally {
  await browser.close();
}
