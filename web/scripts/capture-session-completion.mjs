#!/usr/bin/env node
/**
 * Real browser P06 review matrix. Start the app at APP_URL (default :5174),
 * then run: node scripts/capture-session-completion.mjs
 * Captures actual saved Free Practice sessions and a true Milo threshold crossing
 * using isolated test-only localStorage, never production/user practice data.
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
                id: 'previous-test-practice', finishedAt: new Date(Date.now() - 10000).toISOString(), durationSeconds: 3599,
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
          await page.getByRole('button', { name: 'Start practice timer' }).click();
          await page.waitForTimeout(1450);
          await page.getByRole('button', { name: 'Finish Session' }).click();
          await page.getByRole('heading', { name: /Session Complete!|Great practice!/i }).waitFor();
          await page.getByRole('button', { name: 'View Progress' }).waitFor({ timeout: 15000 });
          assert(await page.getByText(/Scales/).count() > 0, 'Completed activity missing');
          assert((await page.locator('.sc-duration strong').innerText()).trim() !== '0:00', 'Actual duration missing');
          assert(await page.locator('.sc-unlock').count() === Number(reward), 'Incorrect reward state');
          assert((await page.locator('.sc-hero-cat').count() > 0) === catMode, 'Decorative Cat Mode mismatch');
          if (reward) assert(await page.locator('.sc-earned-cats img').count() === 1, 'Earned Milo not shown');
          assert(await page.evaluate(() => document.documentElement.dataset.theme) === theme, 'Wrong theme');
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          assert(overflow <= 1, 'Horizontal overflow ' + overflow);
          const slug = [reward ? 'earned-milo' : 'standard', theme, catMode ? 'cat-on' : 'cat-off', width + 'x' + height].join('-');
          await page.screenshot({ path: join(out, slug + '.png'), fullPage: true, animations: 'disabled' });
          const before = await page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
          const newlySavedId = before.find(s => s.id !== 'previous-test-practice')?.id;
          assert(before.length === (reward ? 2 : 1), 'Session did not save exactly once');
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
