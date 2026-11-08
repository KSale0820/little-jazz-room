#!/usr/bin/env node
/**
 * Approved unified Profile Settings acceptance matrix.
 * Verifies Light/Dark x decorative Cat Mode OFF/ON, real unlock thresholds,
 * cached earned-companion selection, mobile dimensions, and /profile alias.
 *
 * Run from web/: npm run dev -- --host 127.0.0.1 --port 5174
 * In a second shell: node scripts/check-profile-settings.mjs
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const output = path.resolve('docs/screenshots/profile-settings-qa');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const storageTheme = 'little-jazz-room:appearance:v1';
const storageCats = 'little-jazz-room:decorative-cats:v1';
const unlockKey = 'little-jazz-room:unlocked-companions:v1:local';

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const theme of ['light', 'dark']) {
      for (const cats of [false, true]) {
        const label = `${width}x${height}-${theme}-cat-${cats ? 'on' : 'off'}`;
        const context = await browser.newContext({
          viewport: { width, height }, deviceScaleFactor: 1,
          isMobile: true, hasTouch: true, reducedMotion: 'reduce',
        });
        await context.addInitScript(({ theme, cats, storageTheme, storageCats }) => {
          localStorage.setItem(storageTheme, theme);
          localStorage.setItem(storageCats, String(cats));
        }, { theme, cats, storageTheme, storageCats });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.goto(base + '/settings', { waitUntil: 'networkidle' });
        await page.locator('.profile-companion-art img').waitFor();
        assert.equal(await page.getByRole('heading', { name: 'Profile Settings' }).count(), 1);
        assert.equal(await page.locator('.board-cat-card').count(), 3, label + ' companion count');
        assert.deepEqual(await page.locator('.board-cat-card').evaluateAll(cards => cards.map(card =>
          card.getAttribute('aria-label')?.split(',')[0])), ['Luna', 'Milo', 'Maple']);
        assert.equal(await page.locator('.board-cat-card').nth(0).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('.board-cat-card').nth(1).isDisabled(), true, 'Milo starts locked');
        assert.equal(await page.locator('.board-cat-card').nth(2).isDisabled(), true, 'Maple starts locked');
        assert.equal(await page.getByRole('progressbar').count(), 2, 'locked companion progress is visible');
        assert.equal(await page.getByRole('progressbar', { name: 'Milo unlock progress' }).getAttribute('aria-valuemax'), '60');
        assert.equal(await page.getByRole('progressbar', { name: 'Maple unlock progress' }).getAttribute('aria-valuemax'), '300');
        assert.equal(await page.locator('.profile-companion-art img').isVisible(), true,
          'Essential avatar remains visible with Cat Mode OFF');
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.equal(await page.locator('html').getAttribute('data-cat-mode'), cats ? 'on' : 'off');
        assert.equal(await page.getByRole('button', { name: 'Light', exact: true }).count(), 0,
          'The approved Profile Settings design does not expose theme controls');
        assert.equal(await page.getByRole('link', { name: /Practice History/ }).count(), 1,
          'Saved practice link remains reachable');
        await page.screenshot({ path: path.join(output, label + '-settings.png'), fullPage: true });

        // Both old Profile and new Settings links should render one identical surface.
        await page.goto(base + '/profile', { waitUntil: 'networkidle' });
        assert.equal(await page.getByRole('heading', { name: 'Profile Settings' }).count(), 1);
        await page.screenshot({ path: path.join(output, label + '-profile-alias.png'), fullPage: true });

        if (label === '390x844-light-cat-off') {
          // The persisted earned unlocks are retained even without session history.
          await page.evaluate(key => localStorage.setItem(key, JSON.stringify(['luna', 'milo'])), unlockKey);
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(await page.locator('.board-cat-card').nth(1).isEnabled(), true);
          assert.equal(await page.locator('.board-cat-card').nth(2).isDisabled(), true);
          await page.locator('.board-cat-card').nth(1).click();
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(await page.locator('.board-cat-card').nth(1).getAttribute('aria-pressed'), 'true',
            'Milo selection persists');
          await page.evaluate(key => localStorage.setItem(key, JSON.stringify(['luna', 'milo', 'maple'])), unlockKey);
          await page.reload({ waitUntil: 'networkidle' });
          await page.locator('.board-cat-card').nth(2).click();
          await page.reload({ waitUntil: 'networkidle' });
          assert.equal(await page.locator('.board-cat-card').nth(2).getAttribute('aria-pressed'), 'true',
            'Maple selection persists');
          assert.ok((await page.locator('.profile-companion-art img').getAttribute('src'))?.includes('maple-sitting'));
          await page.screenshot({ path: path.join(output, label + '-maple-selected.png'), fullPage: true });
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflow <= 1, label + ' horizontal page overflow: ' + overflow);
        assert.deepEqual(errors, [], label + ' browser errors');
        await context.close();
        console.log('PASS', label);
      }
    }
  }
} finally {
  await browser.close();
}
console.log('Profile Settings screenshots:', output);
