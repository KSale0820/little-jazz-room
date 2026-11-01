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
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('.h01-room-image').waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
      if (document.fonts?.ready) await document.fonts.ready;
    });
    const room = await page.locator('.h01-room-image').evaluate(el => ({ width: el.naturalWidth, height: el.naturalHeight }));
    const approvedPhoto = room.width === 1122 && room.height === 1402;
    const pendingFallback = room.width === 941 && room.height === 1672;
    if (!approvedPhoto && !pendingFallback) throw new Error(`Home room failed to load at ${width}x${height}`);
    console.log(`H01 room source: ${approvedPhoto ? 'user-approved photograph' : 'temporary older room; new photo not installed'}`);
    // Default local companion is Luna; her PR #8 sleeping pose must render.
    const cat = await page.locator('.h01-sleeping-sprite').evaluate(el => ({ width: el.naturalWidth, height: el.naturalHeight }));
    if (cat.width !== 128 || cat.height !== 128) {
      throw new Error(`Approved Luna sleeping cat failed to load at ${width}x${height}`);
    }
    // User-added Biscuit must resolve to the new sleeping PNG, not full-body art.
    await page.evaluate(() => localStorage.setItem('little-jazz-room:selected-cat:v1', 'biscuit'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    const biscuit = await page.locator('.h01-sleeping-sprite').evaluate(el => ({
      src: el.getAttribute('src'), width: el.naturalWidth, height: el.naturalHeight,
    }));
    if (!biscuit.src?.endsWith('/visuals/cats/sleeping/biscuit.png') || biscuit.width !== 128 || biscuit.height !== 128) {
      throw new Error(`Biscuit sleeping sprite failed to load at ${width}x${height}: ${JSON.stringify(biscuit)}`);
    }
    const nav = page.locator('nav.bottom-nav a');
    if (await nav.count() !== 4) throw new Error('Expected exactly four navigation tabs');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) throw new Error(`Horizontal page overflow: ${overflow}px`);
    const authVisible = await page.locator('.mobile-auth-bar').isVisible();
    if (authVisible) throw new Error('Team sign-in bar overlaps Home artwork');
    const sceneViewport = await page.locator('.viewport').boundingBox();
    const bottomNav = await page.locator('nav.bottom-nav').boundingBox();
    if (!sceneViewport || !bottomNav || sceneViewport.y + sceneViewport.height > bottomNav.y + 1) {
      throw new Error(`H01 viewport overlaps fixed nav at ${width}x${height}`);
    }
    const screenshotPath = join(outDir, `home-${width}x${height}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await page.locator('.h01-stats-card').scrollIntoViewIfNeeded();
    const stats = await page.locator('.h01-stats-card').boundingBox();
    const navAfterScroll = await page.locator('nav.bottom-nav').boundingBox();
    if (!stats || !navAfterScroll || stats.y + stats.height > navAfterScroll.y + 1) {
      throw new Error(`Progress card inaccessible above navigation at ${width}x${height}`);
    }
    await page.screenshot({ path: join(outDir, `home-${width}x${height}-stats-visible.png`), fullPage: false });
    await page.evaluate(() => document.querySelector('.viewport')?.scrollTo(0, 0));
    for (const {label,path} of checks) {
      await page.getByRole('button', { name: label }).click();
      await page.waitForURL(new RegExp(`${path.replace('/', '\\/')}$`));
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    }
    console.log(`PASS H01 ${width}x${height}: room loaded, navigation, four hotspots, no overflow; screenshot ${screenshotPath}`);
    if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
    await context.close();
  }
} finally {
  await browser.close();
}
