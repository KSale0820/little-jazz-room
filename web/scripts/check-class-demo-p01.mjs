import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs', 'screenshots', 'class-demo-p01');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.locator('.p01-page').waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      if (document.fonts?.ready) await document.fonts.ready;
    });
    if (!(await page.getByRole('heading', { name: "Let's Practice" }).isVisible())) throw new Error('P01 heading missing');
    if (await page.locator('.p01-path').count() !== 2) throw new Error('Expected two practice modes');
    if ((await page.locator('nav.bottom-nav a').count()) !== 4) throw new Error('Navigation tab count changed');
    const failedArtwork = await page.locator('.p01-page img').evaluateAll(images => images.filter(img => !img.naturalWidth).map(img => img.src));
    if (failedArtwork.length) throw new Error(`P01 artwork failed to load: ${failedArtwork.join(', ')}`);
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (horizontalOverflow > 1) throw new Error(`Horizontal overflow at ${width}x${height}: ${horizontalOverflow}px`);
    const nav = await page.locator('nav.bottom-nav').boundingBox();
    const viewport = await page.locator('.viewport').boundingBox();
    if (!nav || !viewport) throw new Error('Missing nav/viewport');
    await page.screenshot({ path: join(out, `P01-practice-hub-${width}x${height}.png`), fullPage: false });
    const free = page.getByRole('button', { name: /Free Practice/ });
    const guided = page.getByRole('button', { name: /Guided Practice/ });
    if (!(await free.isVisible()) || !(await guided.isVisible())) throw new Error('Practice mode buttons hidden');
    await free.click();
    await page.waitForURL(url => new URL(url).pathname === '/player');
    await page.goto(base + '/practice', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Guided Practice/ }).click();
    await page.waitForURL(url => new URL(url).pathname === '/routines');
    await page.goto(base + '/practice', { waitUntil: 'domcontentloaded' });
    await page.locator('.p01-tool-grid .p01-tool').nth(0).click();
    if (!(await page.getByText('Microphone tuning is coming soon.').isVisible())) throw new Error('Tuner preview did not open');
    await page.getByRole('button', { name: 'Dismiss tool preview' }).click();
    await page.locator('.p01-tool-grid .p01-tool').nth(1).click();
    if (!(await page.getByText('Beat controls are coming soon.').isVisible())) throw new Error('Metronome preview did not open');
    await page.getByRole('button', { name: 'Dismiss tool preview' }).click();
    if (await page.locator('.p01-tool-grid .p01-tool').count() !== 3) throw new Error('Expected three approved quick tools');
    const routine = page.locator('.p01-recent-track');
    if (await routine.count()) {
      await routine.scrollIntoViewIfNeeded();
      const routineBox = await routine.boundingBox();
      const bottom = await page.locator('nav.bottom-nav').boundingBox();
      if (!routineBox || !bottom || routineBox.y + routineBox.height > bottom.y + 1) {
        throw new Error(`Warm-up action obscured by bottom nav at ${width}x${height}`);
      }
      await routine.click();
      await page.waitForURL(url => new URL(url).pathname === '/player');
      await page.goto(base + '/practice', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /See All/ }).click();
      await page.waitForURL(url => new URL(url).pathname === '/progress');
    }
    if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`);
    console.log(`PASS P01 ${width}x${height}: visuals, images, responsive layout, routes, previews, recently played and history; screenshot saved`);
    await context.close();
  }
} finally {
  await browser.close();
}
