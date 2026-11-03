import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const [sourceDirectory = '.', variant = 'after', specifiedPort = '5191'] = process.argv.slice(2);
if (!['before', 'after'].includes(variant)) throw new Error('Expected before or after variant');
const web = resolve(sourceDirectory);
const port = Number(specifiedPort);
const url = 'http://127.0.0.1:' + port;
const output = join(process.cwd(), 'docs/screenshots/routine-search-qa', variant);
mkdirSync(output, { recursive: true });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const res = await fetch(url + '/create');
      if (res.ok) return;
    } catch { /* Vite is starting */ }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('Vite did not start for ' + variant);
}

const vite = join(web, 'node_modules/vite/bin/vite.js');
if (!existsSync(vite)) throw new Error('Missing Vite executable at ' + vite);
const server = spawn(process.execPath,
  [vite, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: web, stdio: 'ignore' }
);
let browser;
try {
  await waitForServer();
  const chrome = ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium']
    .find(file => existsSync(file));
  browser = await chromium.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}),
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const suffix = width + 'x' + height + '.png';
    await page.goto(url + '/routines');
    await page.getByRole('heading', { name: 'Practice routines' }).waitFor();
    await page.locator('.routine-card').first().waitFor();
    await page.screenshot({ path: join(output, 'R01-' + suffix), fullPage: false });
    await page.goto(url + '/create');
    await page.getByRole('heading', { name: 'Create routine' }).waitFor();
    await page.screenshot({ path: join(output, 'R03-' + suffix), fullPage: false });
    if (variant === 'after') {
      await page.getByRole('button', { name: '+ Add Existing' }).click();
      await page.getByRole('dialog', { name: 'Add exercises to your routine' }).waitFor();
      await page.screenshot({ path: join(output, 'R03-picker-exercises-' + suffix) });
      await page.getByRole('tab', { name: 'Routines' }).click();
      await page.getByRole('button', { name: 'View steps' }).first().click();
      await page.screenshot({ path: join(output, 'R03-picker-routines-' + suffix) });
      await page.getByRole('button', { name: 'Close exercise library' }).click();
      await page.getByRole('button', { name: '+ Add Existing' }).click();
      await page.getByRole('tab', { name: 'Routines' }).click();
      await page.getByRole('button', { name: 'View steps' }).first().click();
      const count = await page.locator('.builder-picker-confirm li').count();
      if (count < 2) throw new Error('Routine import preview did not include its steps');
      const add = page.getByRole('button', { name: /^Add \d+ steps?$/ });
      await add.click();
      await page.locator('.builder-step').first().waitFor();
      if (await page.locator('.builder-step').count() < 4)
        throw new Error('Routine import did not insert steps');
      await page.screenshot({ path: join(output, 'R03-imported-' + suffix) });
    }
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (documentWidth > width + 1) throw new Error(variant + ' has horizontal overflow at ' + suffix);
    console.log('Captured ' + variant + ' R01/R03 at ' + suffix);
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
