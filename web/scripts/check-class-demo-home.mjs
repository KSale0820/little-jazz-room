import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const baseUrl = process.env.APP_URL || 'http://127.0.0.1:5174';
const outDir = join(process.cwd(), 'docs/screenshots/class-demo');
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [
  { label: 'Piano: open Practice', path: '/practice' },
  { label: 'Music stand: browse routines', path: '/routines' },
  { label: 'Bookshelf: browse charts', path: '/charts' },
  { label: 'Record player: browse tracks', path: '/tracks' },
];
try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, deviceScaleFactor: 2 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('little-jazz-room:room-lighting:v1', 'twilight'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.h01-room-image').waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
      if (document.fonts?.ready) await document.fonts.ready;
    });
    const loaded = await page.locator('.h01-room-image').evaluate(el => el instanceof HTMLImageElement && el.naturalWidth === 941 && el.naturalHeight === 1672);
    if (!loaded) throw new Error(`Approved portrait room failed to load at ${width}x${height}`);
    const nav = page.locator('nav.bottom-nav a');
    if (await nav.count() !== 4) throw new Error('Expected exactly four navigation tabs');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) throw new Error(`Horizontal page overflow: ${overflow}px`);
    const authVisible = await page.locator('.mobile-auth-bar').isVisible();
    if (authVisible) throw new Error('Team sign-in bar overlaps Home artwork');
    for (const {label,path} of checks) {
      await page.getByRole('button', { name: label }).click();
      await page.waitForURL(new RegExp(`${path.replace('/', '\\/')}$`));
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
    }
    const screenshotPath = join(outDir, `home-${width}x${height}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`PASS H01 ${width}x${height}: room loaded, navigation, four hotspots, no overflow; screenshot ${screenshotPath}`);
    if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
    await context.close();
  }
} finally {
  await browser.close();
}
