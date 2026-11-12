import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { expect, it } from 'vitest';

async function waitForServer(url: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch { /* Starting Vite. */ }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error('Tracks QA server did not start');
}

function saveScreenshot(name: string, image: Buffer) {
  const folder = join(process.cwd(), 'docs', 'screenshots', 'tracks-shelves-qa');
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, name + '.jpg'), image);
}

// Opt-in because it starts a browser; run with RUN_TRACKS_BROWSER_QA=1 npm test -- tracksShelves.browser.test.ts.
it.skipIf(process.env.RUN_TRACKS_BROWSER_QA !== '1')(
  'browses track shelves, filters, bookmarks, and chart player on mobile',
  async () => {
    const chrome = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium']
      .find(path => existsSync(path));
    const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5188', '--strictPort'], {
      cwd: process.cwd(), stdio: 'ignore',
    });
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
      await waitForServer('http://127.0.0.1:5188/tracks');
      browser = await chromium.launch({
        headless: true,
        ...(chrome ? { executablePath: chrome } : {}),
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      });
      for (const [width, height] of [[390, 844], [375, 667]]) {
        const context = await browser.newContext({ viewport: { width: width!, height: height! }, deviceScaleFactor: 1 });
        const page = await context.newPage();
        await page.goto('http://127.0.0.1:5188/tracks');
        await page.getByRole('heading', { name: 'Tracks', exact: true }).waitFor();
        await expect.poll(async () => page.getByRole('tab').count()).toBe(3);
        await expect.poll(async () => page.locator('.t01-shelf').count()).toBeGreaterThan(2);
        await expect.poll(async () => page.locator('.t01-track-card').count()).toBeGreaterThan(4);
        // Mockup contract: compact cards, not a single oversized tile occupying a row.
        const card = await page.locator('.t01-shelf .t01-track-card').first().boundingBox();
        expect(card).not.toBeNull();
        expect(card!.width).toBeLessThan(150);
        expect(card!.height).toBeLessThanOrEqual(100);
        const shelfCards = page.getByRole('region', { name: /Blues & Changes, scroll horizontally/ })
          .locator('.t01-track-card');
        const first = await shelfCards.nth(0).boundingBox();
        const second = await shelfCards.nth(1).boundingBox();
        expect(first && second).toBeTruthy();
        // Snap-scrolling rows should preserve the same left inset as the heading.
        expect(first!.x).toBeGreaterThanOrEqual(width <= 375 ? 13 : 17);
        expect(first!.x).toBeLessThanOrEqual(width <= 375 ? 17 : 21);
        expect(second!.x).toBeLessThan(width - 28); // The next card is visible without scrolling.
        saveScreenshot('library-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 75 }));

        await page.getByRole('button', { name: 'See all Standards tracks and charts' }).click();
        await expect.poll(async () => page.locator('.t01-focused-grid .t01-track-card').count()).toBeGreaterThan(0);
        await page.getByRole('button', { name: /All categories/ }).click();

        await page.getByRole('button', { name: 'Filter by Style' }).click();
        await page.getByRole('dialog', { name: 'Filter tracks & charts' }).waitFor();
        await page.getByRole('group', { name: 'Style' }).getByRole('button', { name: 'Swing', exact: true }).click();
        await page.getByRole('button', { name: 'Apply filters' }).click();
        await expect.poll(async () => page.getByRole('button', { name: /Filter by Style/ }).textContent())
          .toContain('Swing');

        await page.getByRole('button', { name: 'Filter by Style' }).click();
        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.getByRole('button', { name: 'Apply filters' }).click();

        await page.getByRole('button', { name: 'Save Autumn Leaves to favorites' }).click();
        await page.getByRole('tab', { name: 'My Tracks' }).click();
        await expect.poll(async () => page.getByText('Autumn Leaves').count()).toBeGreaterThan(0);
        saveScreenshot('my-tracks-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 75 }));
        await page.reload();
        await page.getByRole('tab', { name: 'My Tracks' }).waitFor();
        await expect.poll(async () => page.getByText('Autumn Leaves').count()).toBeGreaterThan(0);

        await page.getByRole('tab', { name: 'Community' }).click();
        await page.getByText('Community tracks aren’t available yet').waitFor();
        saveScreenshot('community-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 75 }));

        await page.getByRole('tab', { name: 'Library' }).click();
        await page.getByRole('button', { name: 'Open After-Hours Blues chart' }).click();
        await page.waitForURL('**/player?chart=*');
        await context.close();
      }
    } finally {
      await browser?.close();
      server.kill('SIGTERM');
    }
  }, 90000,
);
