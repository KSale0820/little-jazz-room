import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5174';
const outDir = join(process.cwd(), 'docs/screenshots/class-demo');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`${baseUrl}/tracks`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Tracks', exact: true }).waitFor();
    await page.evaluate(() => document.fonts?.ready);
    if (await page.locator('nav.bottom-nav a').count() !== 4) {
      throw new Error('T01 should have four bottom navigation tabs');
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) throw new Error(`T01 horizontal overflow: ${overflow}px`);
    const n = await page.locator('.demo-row').count();
    if (!n) throw new Error('T01 should render at least one seeded track');
    if (errors.length) throw new Error(`T01 browser errors: ${errors.join(' | ')}`);

    const file = join(outDir, `t01-tracks-${width}x${height}.png`);
    const screenshot = await page.screenshot({ path: file, fullPage: false });
    // Emit the actual browser capture for automated visual inspection
    // alongside the CI artifact, without changing app code or artwork.
    const data = screenshot.toString('base64');
    console.log(`T01_CAPTURE_START:${width}x${height}`);
    for (let i = 0; i < data.length; i += 8000) {
      console.log(`T01_CAPTURE_DATA:${width}x${height}:${data.slice(i, i + 8000)}`);
    }
    console.log(`T01_CAPTURE_END:${width}x${height}`);
    console.log(`PASS T01 ${width}x${height}: ${n} tracks, four tabs, no overflow; ${file}`);
    await context.close();
  }
} finally {
  await browser.close();
}
