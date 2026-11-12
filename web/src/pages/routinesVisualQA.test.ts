import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { expect, it } from 'vitest';

async function waitForServer(url: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error('Routine browser test server did not start');
}

function recordImage(label: string, data: Buffer) {
  const folder = join(process.cwd(), 'docs', 'screenshots', 'routine-search-qa', 'after');
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, label + '.jpg'), data);
}


// Opt in to the slower browser journey; the PR screenshot workflow runs separately.
it.skipIf(process.env.RUN_ROUTINE_BROWSER_QA !== '1')('visually captures R01/R03 and completes the class-demo routine journey', async () => {
  const chrome = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium']
    .find(path => existsSync(path));
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5187', '--strictPort'], {
    cwd: process.cwd(), stdio: 'ignore',
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    await waitForServer('http://127.0.0.1:5187/routines');
    browser = await chromium.launch({
      headless: true,
      ...(chrome ? { executablePath: chrome } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    for (const [width, height] of [[390, 844], [375, 667]]) {
      const context = await browser.newContext({ viewport: { width: width!, height: height! }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5187/routines');
      await page.getByRole('heading', { name: 'Routines', exact: true }).waitFor();
      await expect.poll(async () => page.getByRole('tab').count()).toBe(3);
      await expect.poll(async () => page.locator('.routine-card-icon-slot').count()).toBe(14);
      await expect.poll(async () => page.locator('.routine-shelf').count()).toBeGreaterThan(3);
      await page.locator('.routine-card').first().waitFor();
      recordImage('R01-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));
      if (width === 390) {
        await page.locator('.viewport').evaluate(element => { element.scrollTop = element.scrollHeight; });
        recordImage('R01-bottom-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));
        await page.getByRole('button', { name: 'See all Standards & Repertoire routines' }).click();
        await expect.poll(async () => page.locator('.routine-focused-grid .routine-card').count()).toBeGreaterThan(0);
        await page.getByRole('button', { name: /All categories/ }).click();
        await page.getByRole('tab', { name: 'Community' }).click();
        await expect.poll(async () => page.getByRole('tab', { name: 'Community' }).getAttribute('aria-selected')).toBe('true');
        await page.getByRole('tab', { name: 'Library' }).click();
        await expect.poll(async () => page.locator('.routine-shelf').count()).toBeGreaterThan(0);
      }
      await page.goto('http://127.0.0.1:5187/create');
      await page.getByRole('heading', { name: 'Create routine' }).waitFor();
      await page.locator('.builder-step').first().waitFor();
      recordImage('R03-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));
      if (width === 390) {
        await page.locator('.viewport').evaluate(element => { element.scrollTop = element.scrollHeight; });
        recordImage('R03-bottom-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));
      }

      await page.getByRole('button', { name: '+ Add Existing' }).click();
      await page.getByRole('dialog', { name: 'Add exercises to your routine' }).waitFor();
      recordImage('R03-picker-exercises-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));
      await page.getByRole('tab', { name: 'Routines' }).click();
      await page.getByRole('button', { name: 'View steps' }).first().click();
      recordImage('R03-picker-routines-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));
      await page.getByRole('button', { name: 'Close exercise library' }).click();
      await page.getByLabel('Routine title').fill('Demo Practice ' + width);
      await page.getByLabel('Duration for Feel the Swing Beat in minutes').fill('7');
      await page.getByRole('button', { name: 'Move Practice the Important Notes in Each Chord up' }).click();
      await page.getByRole('button', { name: /Save routine/ }).click();
      await page.waitForURL('**/routines?tab=my');
      await expect.poll(async () => page.getByText('Demo Practice ' + width).count()).toBeGreaterThan(0);
      await page.getByRole('button', { name: 'Open Demo Practice ' + width + ' in player' }).click();
      await page.waitForURL('**/player');
      await page.reload();
      await page.goto('http://127.0.0.1:5187/routines?tab=my');
      await expect.poll(async () => page.getByRole('button', { name: 'Open Demo Practice ' + width + ' in player' }).count()).toBe(1);
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill('SIGTERM');
  }
}, 90000);
