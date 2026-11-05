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
        // Validate ordinary Progress session/history with Cat Mode OFF. The selected
        // companion remains visible and uses its original approved sleeping asset.
        // The identity matrix below separately checks Cat Mode ON and OFF.
        localStorage.setItem('little-jazz-room:decorative-cats:v1', 'false');
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
      // Legacy illustration files remain packaged for compatibility, but clean themes must not render them.
      const artwork = await page.evaluate(async () => {
        const response = await fetch('/visuals/progress/g01-room-background.png');
        const background = response.ok ? await createImageBitmap(await response.blob()) : null;
        const leaf = document.querySelector('.g01-goal-plant');
        const cushion = document.querySelector('.g01-cat-cushion');
        const panel = document.querySelector('.g01-companion');
        return {
          backgroundStatus: response.status,
          backgroundWidth: background?.width ?? 0,
          backgroundHeight: background?.height ?? 0,
          cssBackground: panel ? getComputedStyle(panel).backgroundImage : '',
          leafWidth: leaf?.naturalWidth ?? 0,
          leafHeight: leaf?.naturalHeight ?? 0,
          leafVisible: leaf ? getComputedStyle(leaf).display !== 'none' && getComputedStyle(leaf).visibility !== 'hidden' : false,
          cushionSrc: cushion?.getAttribute('src') ?? '',
          cushionWidth: cushion?.naturalWidth ?? 0,
          cushionHeight: cushion?.naturalHeight ?? 0,
          cushionVisible: cushion ? getComputedStyle(cushion).display !== 'none' && getComputedStyle(cushion).visibility !== 'hidden' : false,
        };
      });
      if (artwork.backgroundWidth !== 1200 || artwork.backgroundHeight !== 690 ||
          artwork.cssBackground.includes('g01-room-background.png') ||
          artwork.leafWidth !== 300 || artwork.leafHeight !== 300 || artwork.leafVisible ||
          !artwork.cushionSrc.endsWith('/visuals/shared-mvp/companion-surfaces/evergreen-sleep-cushion.png') ||
          artwork.cushionWidth !== 1024 || artwork.cushionHeight !== 512 || artwork.cushionVisible) {
        throw new Error('G01 clean backdrop or original asset packaging mismatch: ' + JSON.stringify(artwork));
      }
      console.log('PASS G01 clean backdrop, hidden large illustrations and original asset packaging at ' + width + 'x' + height);
      // Progress always displays the selected companion. Luna has a verified
      // low-resolution replacement when Cat Mode is ON (160px, not 128px).
      await page.waitForFunction(() => {
        const img = document.querySelector('.g01-cat');
        return img instanceof HTMLImageElement &&
          img.getAttribute('src') === '/visuals/cats/clean-pixel/luna-sleeping.png' &&
          img.complete && img.naturalWidth === 160 && img.naturalHeight === 160;
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
        // The G01 weekly total must reset on Monday. The fixture spans three
        // calendar days, which do not necessarily belong to the same week.
        const expectedWeekMinutes = await page.evaluate(() => {
          const now = new Date();
          const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
          const sessions = JSON.parse(localStorage.getItem(
            'little-jazz-room:practice-sessions:v1:anonymous') || '[]');
          return Math.round(sessions.filter(session =>
            new Date(session.finishedAt) >= monday)
            .reduce((total, session) => total + session.durationSeconds, 0) / 60);
        });
        const actualWeekMinutes = Number(await page.locator('.g01-stat').nth(1).locator('strong').innerText());
        if (actualWeekMinutes !== expectedWeekMinutes) throw new Error(
          'Saved session weekly total did not persist: expected ' +
          expectedWeekMinutes + ', got ' + actualWeekMinutes);
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
    await context.addInitScript(id => {
      localStorage.setItem('little-jazz-room:selected-cat:v1', id);
      localStorage.setItem('little-jazz-room:decorative-cats:v1', 'true');
    }, catId);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5174/progress', { waitUntil: 'networkidle' });
    await page.waitForFunction(id => {
      const sprite = document.querySelector('.g01-cat');
      const pixelVerified = ['luna', 'milo', 'maple'].includes(id);
      const expected = pixelVerified ? '/visuals/cats/clean-pixel/' + id + '-sleeping.png'
        : '/visuals/cats/sleeping/' + id + '.png';
      const dimension = pixelVerified ? 160 : 128;
      return sprite instanceof HTMLImageElement &&
        sprite.getAttribute('src') === expected &&
        sprite.complete && sprite.naturalWidth === dimension && sprite.naturalHeight === dimension;
    }, catId);
    await page.evaluate(async () => document.fonts?.ready);
    if (errors.length) throw new Error('G01 cat ' + catId + ': ' + errors.join(' | '));
    await page.screenshot({ path: join(out, 'g01-cat-' + catId + '-390x844.png'), fullPage: false });
    console.log('PASS G01 selected sleeping companion, Cat Mode ON: ' + catId);
    // In OFF mode Progress must STILL display this exact selected identity,
    // switching to its original approved sleeping asset without moving layout.
    await page.evaluate(() => localStorage.setItem('little-jazz-room:decorative-cats:v1', 'false'));
    const onRect = await page.locator('.g01-cat').boundingBox();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(id => {
      const sprite = document.querySelector('.g01-cat');
      return sprite instanceof HTMLImageElement &&
        sprite.getAttribute('src') === '/visuals/cats/sleeping/' + id + '.png' &&
        sprite.complete && sprite.naturalWidth === 128 && sprite.naturalHeight === 128 &&
        getComputedStyle(sprite).visibility === 'visible';
    }, catId);
    const offRect = await page.locator('.g01-cat').boundingBox();
    if (!onRect || !offRect ||
        Math.abs(onRect.x - offRect.x) > 1 || Math.abs(onRect.y - offRect.y) > 1 ||
        Math.abs(onRect.width - offRect.width) > 1 || Math.abs(onRect.height - offRect.height) > 1) {
      throw new Error('Progress companion placement shifted when changing Cat Mode for ' + catId);
    }
    console.log('PASS G01 selected sleeping companion, Cat Mode OFF: ' + catId);
    await context.close();
  }
} finally {
  await browser.close();
}
