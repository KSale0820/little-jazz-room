import { existsSync } from 'node:fs';
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
  const base64 = data.toString('base64');
  const segments = base64.match(/.{1,6000}/g) ?? [];
  segments.forEach((segment, i) => console.log('LJR_SCREEN ' + label + ' ' + i + '/' + segments.length + ' ' + segment));
}

// Only capture on the class-demo CI runner. All routine repository unit tests run everywhere.
it.skipIf(!process.env.CI)('visually captures R01/R03 and completes the class-demo routine journey', async () => {
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
      await page.getByRole('heading', { name: 'Practice routines' }).waitFor();
      await page.locator('.routine-card').first().waitFor();
      recordImage('R01-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));
      await page.goto('http://127.0.0.1:5187/create');
      await page.getByRole('heading', { name: 'Create routine' }).waitFor();
      await page.locator('.builder-step').first().waitFor();
      recordImage('R03-' + width + 'x' + height, await page.screenshot({ type: 'jpeg', quality: 68 }));

      await page.getByLabel('Routine title').fill('Demo Practice ' + width);
      await page.getByLabel('Duration for Swing on Two and Four in minutes').fill('7');
      await page.getByRole('button', { name: 'Move Guide Tones Through ii–V–I up' }).click();
      await page.getByRole('button', { name: 'Save routine', exact: true }).click();
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
