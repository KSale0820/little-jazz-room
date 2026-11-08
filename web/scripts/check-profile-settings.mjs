#!/usr/bin/env node
/**
 * Profile/Settings acceptance: two phone sizes × Light/Dark × Cat Mode OFF/ON,
 * persistence across reload, approved three-cat roster, and earned selection.
 *
 * Run from web/: npm run dev -- --host 127.0.0.1 --port 5174
 * In a second shell: node scripts/check-profile-settings.mjs
 * APP_URL overrides http://127.0.0.1:5174. No network account required.
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
          if (localStorage.getItem(storageTheme) === null) localStorage.setItem(storageTheme, theme);
          if (localStorage.getItem(storageCats) === null) localStorage.setItem(storageCats, String(cats));
        }, { theme, cats, storageTheme, storageCats });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.goto(base + '/profile', { waitUntil: 'networkidle' });
        await page.locator('.profile-companion-art img').waitFor();
        assert.equal(await page.locator('.board-cat-card').count(), 3, label + ' cat count');
        assert.deepEqual(await page.locator('.board-cat-card').evaluateAll(cards => cards.map(card =>
          card.getAttribute('aria-label')?.split(',')[0])), ['Luna', 'Milo', 'Maple']);
        assert.equal(await page.locator('.board-cat-card').nth(0).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('.board-cat-card').nth(1).isDisabled(), true, 'Milo starts locked');
        assert.equal(await page.locator('.board-cat-card').nth(2).isDisabled(), true, 'Maple starts locked');
        assert.equal(await page.locator('.profile-companion-art img').isVisible(), true,
          'Essential companion stays visible with Cat Mode OFF');
        await page.screenshot({ path: path.join(output, label + '-profile.png'), fullPage: true });

        await page.getByRole('link', { name: 'Open settings' }).click();
        await page.locator('.settings-page').waitFor();
        assert.equal(new URL(page.url()).pathname, '/settings');
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.equal(await page.locator('html').getAttribute('data-cat-mode'), cats ? 'on' : 'off');
        const light = page.locator('.profile-theme-choice').nth(0);
        const dark = page.locator('.profile-theme-choice').nth(1);
        const catSwitch = page.getByRole('switch', { name: /Cat Mode/i });
        assert.equal(await light.getAttribute('aria-pressed'), String(theme === 'light'));
        assert.equal(await dark.getAttribute('aria-pressed'), String(theme === 'dark'));
        assert.equal(await catSwitch.isChecked(), cats);
        await page.screenshot({ path: path.join(output, label + '-settings.png'), fullPage: true });

        // Changing one preference must not reset the other, then both survive reload.
        await (theme === 'light' ? dark : light).click();
        const alternate = theme === 'light' ? 'dark' : 'light';
        assert.equal(await page.locator('html').getAttribute('data-theme'), alternate);
        assert.equal(await catSwitch.isChecked(), cats);
        await catSwitch.setChecked(!cats);
        await page.reload({ waitUntil: 'networkidle' });
        assert.equal(await page.locator('html').getAttribute('data-theme'), alternate);
        assert.equal(await page.locator('html').getAttribute('data-cat-mode'), cats ? 'off' : 'on');
        assert.equal(await page.evaluate(key => localStorage.getItem(key), storageTheme), alternate);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), storageCats), String(!cats));
        assert.equal(await page.getByRole('switch', { name: /Cat Mode/i }).isChecked(), !cats);

        // These local cached unlocks model prior earned milestones; they must survive
        // Cat Mode OFF and a change of theme, and selection must survive refresh.
        if (label === '390x844-light-cat-off') {
          await page.evaluate(key => localStorage.setItem(key, JSON.stringify(['luna', 'milo'])), unlockKey);
          await page.goto(base + '/profile', { waitUntil: 'networkidle' });
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
          assert.equal(await page.locator('.profile-companion-art img').isVisible(), true);
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
console.log('Profile/Settings screenshots:', output);
