import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = join(process.cwd(), 'docs/screenshots/class-demo/progress');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const state of ['empty', 'completed']) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: true, deviceScaleFactor: 2 });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(state => {
        localStorage.setItem('little-jazz-room:selected-cat:v1', 'luna');
        if (state === 'completed') {
          const now = new Date();
          const sessions = [0, 1, 2].map((offset, i) => {
            const date = new Date(now);
            date.setDate(now.getDate() - offset);
            return { id: 'g01-qa-' + i, routineId: 'daily-warm-up', exerciseId: null, startedAt: new Date(date.getTime() - 1200000).toISOString(), finishedAt: date.toISOString(), durationSeconds: 1200 };
          });
          localStorage.setItem('little-jazz-room:practice-sessions:v1:anonymous', JSON.stringify(sessions));
        }
      }, state);
      await page.goto('http://127.0.0.1:5174/progress', { waitUntil: 'networkidle' });
      await page.locator('.g01-page').waitFor({ state: 'visible' });
      await page.evaluate(async () => {
        await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
        await document.fonts?.ready;
      });
      // Assert the two approved illustration binaries were installed and rendered.
      const artwork = await page.evaluate(async () => {
        const response = await fetch('/visuals/progress/g01-room-background.png');
        const background = response.ok ? await createImageBitmap(await response.blob()) : null;
        const leaf = document.querySelector('.g01-goal-plant');
        const panel = document.querySelector('.g01-companion');
        return {
          backgroundStatus: response.status,
          backgroundWidth: background?.width ?? 0,
          backgroundHeight: background?.height ?? 0,
          cssBackground: panel ? getComputedStyle(panel).backgroundImage : '',
          leafWidth: leaf?.naturalWidth ?? 0,
          leafHeight: leaf?.naturalHeight ?? 0,
          leafVisible: leaf ? getComputedStyle(leaf).display !== 'none' : false,
        };
      });
      if (artwork.backgroundWidth !== 1200 || artwork.backgroundHeight !== 690 ||
          !artwork.cssBackground.includes('g01-room-background.png') ||
          artwork.leafWidth !== 300 || artwork.leafHeight !== 300 || !artwork.leafVisible) {
        throw new Error('Approved G01 illustration assets failed browser verification: ' + JSON.stringify(artwork));
      }
      console.log('PASS approved G01 room and goal leaves at ' + width + 'x' + height + ': ' + JSON.stringify(artwork));
      // G01 must use the approved sleeping pose of the currently selected companion.
      await page.waitForFunction(() => {
        const img = document.querySelector('.g01-cat');
        return img instanceof HTMLImageElement &&
          img.getAttribute('src') === '/visuals/cats/sleeping/luna.png' &&
          img.complete && img.naturalWidth === 128 && img.naturalHeight === 128;
      });
      if (!(await page.locator('.g01-cat').isVisible())) throw new Error('Selected sleeping cat not visible on G01');
      const heading = await page.locator('.g01-header h1').innerText();
      if (heading !== 'Progress') throw new Error('G01 heading missing');
      const expected = state === 'completed' ? 'Practice Again' : 'Start Practicing';
      await page.getByRole('button', { name: expected }).waitFor({ state: 'visible' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) throw new Error('G01 horizontal overflow: ' + overflow);
      if (errors.length) throw new Error(errors.join(' | '));
      const path = join(out, 'g01-' + state + '-' + width + 'x' + height + '.png');
      await page.screenshot({ path, fullPage: false });
      await page.screenshot({ path: join(out, 'g01-' + state + '-full-' + width + 'x' + height + '.png'), fullPage: true });
      console.log('Captured ' + path);
      if (state === 'completed') {
        await page.reload({ waitUntil: 'networkidle' });
        const stat = await page.locator('.g01-stats').innerText();
        if (!stat.includes('60')) throw new Error('Saved session totals did not persist');
        await page.getByRole('button', { name: 'See all' }).click();
        await page.screenshot({ path: join(out, 'g01-history-' + width + 'x' + height + '.png'), fullPage: true });
        await page.getByRole('button', { name: 'Practice Again' }).click();
        await page.waitForURL(url => new URL(url).pathname === '/player');
      }
      await context.close();
    }
  }
  // Every approved companion must resolve to its own sleeping sprite on Progress.
  for (const catId of ['luna', 'milo', 'maple', 'mochi', 'pepper', 'patches', 'chai', 'biscuit']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
    await context.addInitScript(id => localStorage.setItem('little-jazz-room:selected-cat:v1', id), catId);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5174/progress', { waitUntil: 'networkidle' });
    await page.waitForFunction(id => {
      const sprite = document.querySelector('.g01-cat');
      return sprite instanceof HTMLImageElement &&
        sprite.getAttribute('src') === '/visuals/cats/sleeping/' + id + '.png' &&
        sprite.complete && sprite.naturalWidth === 128 && sprite.naturalHeight === 128;
    }, catId);
    await page.evaluate(async () => document.fonts?.ready);
    if (errors.length) throw new Error('G01 cat ' + catId + ': ' + errors.join(' | '));
    await page.screenshot({ path: join(out, 'g01-cat-' + catId + '-390x844.png'), fullPage: false });
    console.log('PASS G01 selected sleeping companion: ' + catId);
    await context.close();
  }
} finally {
  await browser.close();
}
