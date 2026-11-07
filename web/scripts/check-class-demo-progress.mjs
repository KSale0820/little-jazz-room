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
      // This fixture explicitly sets Cat Mode OFF. Progress must keep Luna visible
      // in the new pixel sleeping pose. The later matrix validates all three
      // supported companions and non-destructive migration of five legacy IDs.
      await page.waitForFunction(() => {
        const img = document.querySelector('.g01-cat');
        return img instanceof HTMLImageElement &&
          img.getAttribute('src') === '/visuals/cats/clean-pixel/luna-sleeping.png' &&
          img.complete && img.naturalWidth === 160 && img.naturalHeight === 160 &&
          getComputedStyle(img).visibility === 'visible';
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
  // The live roster is restricted to the three newly approved pixel designs.
  // Progress stays visible in both modes, but switches current sleeping OFF
  // versus current sitting ON artwork without changing the selected companion.
  for (const catId of ['luna', 'milo', 'maple']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
    await context.addInitScript(id => {
      const key = 'little-jazz-room:selected-cat:v1';
      if (localStorage.getItem(key) === null) localStorage.setItem(key, id);
      if (localStorage.getItem('little-jazz-room:decorative-cats:v1') === null)
        localStorage.setItem('little-jazz-room:decorative-cats:v1', 'true');
    }, catId);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5174/progress', { waitUntil: 'networkidle' });
    await page.waitForFunction(id => {
      const sprite = document.querySelector('.g01-cat');
      return sprite instanceof HTMLImageElement &&
        sprite.getAttribute('src') === '/visuals/cats/clean-pixel/' + id + '-sitting.png' &&
        sprite.complete && sprite.naturalWidth === 160 && sprite.naturalHeight === 160 &&
        getComputedStyle(sprite).visibility === 'visible';
    }, catId);
    const onRect = await page.locator('.g01-cat').boundingBox();
    await page.screenshot({ path: join(out, 'g01-pixel-on-' + catId + '-390x844.png'), fullPage: false });
    console.log('PASS G01 new sitting companion, Cat Mode ON: ' + catId);
    // Reload must retain the saved preference, not reset Cat Mode to ON.
    await page.evaluate(() => localStorage.setItem('little-jazz-room:decorative-cats:v1', 'false'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(id => {
      const sprite = document.querySelector('.g01-cat');
      return sprite instanceof HTMLImageElement &&
        sprite.getAttribute('src') === '/visuals/cats/clean-pixel/' + id + '-sleeping.png' &&
        sprite.complete && sprite.naturalWidth === 160 && sprite.naturalHeight === 160 &&
        getComputedStyle(sprite).visibility === 'visible';
    }, catId);
    const offRect = await page.locator('.g01-cat').boundingBox();
    if (!onRect || !offRect ||
        Math.abs(onRect.x - offRect.x) > 1 || Math.abs(onRect.y - offRect.y) > 1 ||
        Math.abs(onRect.width - offRect.width) > 1 || Math.abs(onRect.height - offRect.height) > 1) {
      throw new Error('Progress pixel companion placement shifted across Cat Mode for ' + catId);
    }
    if (errors.length) throw new Error('G01 ' + catId + ' runtime errors: ' + errors.join(' | '));
    await page.screenshot({ path: join(out, 'g01-pixel-off-' + catId + '-390x844.png'), fullPage: false });
    await page.goto('http://127.0.0.1:5174/profile', { waitUntil: 'networkidle' });
    const cards = await page.locator('.board-cat-card').count();
    if (cards !== 3 || (await page.locator('.profile-companion-art img').getAttribute('src')) !==
        '/visuals/cats/clean-pixel/' + catId + '-sitting.png') {
      throw new Error('Profile did not preserve three-choice pixel roster for ' + catId);
    }
    console.log('PASS G01 new sleeping companion OFF, pixel profile and chooser: ' + catId);
    await context.close();
  }

  // Old saved companion IDs are archived, never removed from user records.
  // They deterministically display Luna until the user explicitly picks a
  // supported pixel companion. Simulate five existing offline accounts.
  for (const legacyId of ['mochi', 'pepper', 'patches', 'chai', 'biscuit']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
    await context.addInitScript(id => {
      const key = 'little-jazz-room:selected-cat:v1';
      if (localStorage.getItem(key) === null) localStorage.setItem(key, id);
      if (localStorage.getItem('little-jazz-room:decorative-cats:v1') === null)
        localStorage.setItem('little-jazz-room:decorative-cats:v1', 'true');
      const recordKey = 'little-jazz-room:practice-sessions:v1:anonymous';
      if (localStorage.getItem(recordKey) === null)
        localStorage.setItem(recordKey, '[{"id":"retained-' + id + '","durationSeconds":500,"finishedAt":"2026-11-04T12:00:00.000Z"}]');
    }, legacyId);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5174/progress', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => {
      const cat = document.querySelector('.g01-cat');
      return cat instanceof HTMLImageElement &&
        cat.getAttribute('src') === '/visuals/cats/clean-pixel/luna-sitting.png' &&
        cat.complete && cat.naturalWidth === 160;
    });
    const check = async () => page.evaluate(() => ({
      selected: localStorage.getItem('little-jazz-room:selected-cat:v1'),
      archive: localStorage.getItem('little-jazz-room:selected-cat:v1:retired-cat-id:v1'),
      sessions: JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'),
      companion: document.querySelector('.g01-companion')?.getAttribute('aria-label'),
    }));
    const first = await check();
    if (first.selected !== 'luna' || first.archive !== legacyId ||
        first.sessions[0]?.id !== 'retained-' + legacyId || !first.companion?.includes('Luna'))
      throw new Error('Legacy companion migrated destructively: ' + JSON.stringify({ legacyId, first }));
    await page.reload({ waitUntil: 'networkidle' });
    const second = await check();
    if (second.selected !== 'luna' || second.archive !== legacyId || second.sessions[0]?.id !== 'retained-' + legacyId)
      throw new Error('Legacy companion migration not persistent: ' + JSON.stringify({ legacyId, second }));
    await page.goto('http://127.0.0.1:5174/profile', { waitUntil: 'networkidle' });
    if (await page.locator('.board-cat-card').count() !== 3)
      throw new Error('Retired companions still selectable for ' + legacyId);
    const names = await page.locator('.board-cat-card').allTextContents();
    if (!names[0]?.includes('Luna') || !names[1]?.includes('Milo') || !names[2]?.includes('Maple'))
      throw new Error('Profile roster mismatch after migration: ' + JSON.stringify(names));
    console.log('PASS nondestructive retired companion migration: ' + legacyId);
    await context.close();
  }

} finally {
  await browser.close();
}
