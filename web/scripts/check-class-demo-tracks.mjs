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
    await page.goto(baseUrl + '/tracks', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Tracks', exact: true }).waitFor();
    await page.evaluate(() => document.fonts?.ready);
    if (await page.locator('nav.bottom-nav a').count() !== 4) throw new Error('T01 should have four nav tabs');
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) throw new Error('T01 page overflow ' + overflow + 'px');
    if (await page.locator('.t01-track-card').count() !== 4) throw new Error('Four approved T01 previews missing');
    for (const title of ['After-Hours Blues', 'Moonlit Changes', 'Blue Staircase', 'Sunday Walk']) {
      if (await page.locator('.t01-card-title').filter({ hasText: title }).count() !== 1) throw new Error('Missing ' + title);
    }

    const file = join(outDir, 't01-tracks-' + width + 'x' + height + '.png');
    const screenshot = await page.screenshot({ path: file, fullPage: false });
    const data = screenshot.toString('base64');
    console.log('T01_CAPTURE_START:' + width + 'x' + height);
    for (let i = 0; i < data.length; i += 8000) console.log('T01_CAPTURE_DATA:' + width + 'x' + height + ':' + data.slice(i, i + 8000));
    console.log('T01_CAPTURE_END:' + width + 'x' + height);

    const favorite = page.getByRole('button', { name: 'Add After-Hours Blues to favorites' });
    await favorite.click();
    await page.getByRole('button', { name: 'Favorites', exact: true }).click();
    if (await page.locator('.t01-track-card').count() !== 1) throw new Error('Favorite filter failed');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Favorites', exact: true }).click();
    if (await page.locator('.t01-track-card').count() !== 1) throw new Error('Favorite persistence failed');

    await page.getByRole('button', { name: 'Recent', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search tracks' }).fill('neo-soul waltz');
    if (await page.getByRole('heading', { name: 'No tracks found' }).count() !== 1) throw new Error('Search empty state failed');
    await page.screenshot({ path: join(outDir, 't01-empty-' + width + 'x' + height + '.png'), fullPage: false });
    await page.getByRole('button', { name: 'Clear search', exact: true }).first().click();
    if (await page.locator('.t01-track-card').count() !== 4) throw new Error('Clear search failed');

    await page.getByRole('button', { name: 'Instrument', exact: false }).click();
    if (!await page.getByRole('dialog', { name: 'Filter tracks' }).isVisible()) throw new Error('Filter sheet did not open');
    await page.getByRole('dialog').getByRole('button', { name: 'Drums' }).click();
    await page.getByRole('button', { name: 'Apply filters' }).click();
    if (await page.locator('.t01-track-card').count() !== 2) throw new Error('Instrument filter failed');
    await page.getByRole('button', { name: 'Filters', exact: false }).click();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('button', { name: 'Apply filters' }).click();
    if (await page.locator('.t01-track-card').count() !== 4) throw new Error('Filter reset failed');

    await page.getByRole('button', { name: 'Practice After-Hours Blues with its linked chart' }).click();
    if (!new URL(page.url()).pathname.endsWith('/player')) throw new Error('Shared player navigation failed');
    if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
    console.log('PASS T01 ' + width + 'x' + height + ': 4 track cards, favorites persisted, search, filters, shared player, no overflow');
    await context.close();
  }
} finally {
  await browser.close();
}
