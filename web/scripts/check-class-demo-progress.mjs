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
      const heading = await page.locator('.g01-header h1').innerText();
      if (heading !== 'Progress') throw new Error('G01 heading missing');
      const expected = state === 'completed' ? 'Practice Again' : 'Start Practicing';
      await page.getByRole('button', { name: expected }).waitFor({ state: 'visible' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) throw new Error('G01 horizontal overflow: ' + overflow);
      if (errors.length) throw new Error(errors.join(' | '));
      const path = join(out, 'g01-' + state + '-' + width + 'x' + height + '.png');
      await page.screenshot({ path, fullPage: false });
      console.log('Captured ' + path);
      if (state === 'completed') {
        await page.reload({ waitUntil: 'networkidle' });
        const stat = await page.locator('.g01-stats').innerText();
        if (!stat.includes('60')) throw new Error('Saved session totals did not persist');
        await page.getByRole('button', { name: 'See all' }).click();
        await page.screenshot({ path: join(out, 'g01-history-' + width + 'x' + height + '.png'), fullPage: true });
        await page.getByRole('button', { name: 'Practice Again' }).click();
        await page.waitForURL(/\\/player$/);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
