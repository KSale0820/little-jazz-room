// Visual acceptance for the pixel Progress redesign. Captures real browser
// screenshots of the current component, not a static mockup.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const out = path.resolve('docs/screenshots/progress-redesign-qa');
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const report = [];
const now = new Date();
const weekMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
weekMonday.setDate(weekMonday.getDate() - (weekMonday.getDay() + 6) % 7);

function sampleSessions() {
  const minutes = [15, 30, 20, 45, 15, 0, 0];
  return minutes.flatMap((min, index) => {
    if (min === 0 || weekMonday.getTime() + index * 864e5 > now.getTime()) return [];
    const date = new Date(weekMonday);
    date.setDate(date.getDate() + index);
    date.setHours(18, 0, 0, 0);
    if (date > now) date.setHours(8, 0, 0, 0);
    return [{
      id: 'pgr-fixture-' + index,
      finishedAt: date.toISOString(),
      durationSeconds: min * 60,
      ...(index === 1 ? { routineId: 'daily-warm-up', routineTitle: 'Daily Jazz Warm-Up' } : {}),
    }];
  });
}

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const theme of ['light', 'dark']) {
      for (const mode of [true, false]) {
        const name = width + 'x' + height + '-' + theme + '-cat-' + (mode ? 'on' : 'off');
        const context = await browser.newContext({
          viewport: { width, height }, isMobile: true, hasTouch: true,
          deviceScaleFactor: 2, colorScheme: theme, reducedMotion: 'reduce',
        });
        await context.addInitScript(({ theme, mode, sessions }) => {
          localStorage.setItem('little-jazz-room:appearance:v1', theme);
          localStorage.setItem('little-jazz-room:decorative-cats:v1', String(mode));
          localStorage.setItem('little-jazz-room:practice-sessions:v1:anonymous', JSON.stringify(sessions));
          localStorage.setItem('little-jazz-room:selected-cat:v1', 'luna');
        }, { theme, mode, sessions: sampleSessions() });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base + '/progress', { waitUntil: 'networkidle' });
        await page.locator('.pgr-page').waitFor({ state: 'visible' });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
        });
        const result = await page.evaluate(() => {
          const get = selector => document.querySelector(selector);
          const box = selector => get(selector)?.getBoundingClientRect();
          const nav = get('nav.bottom-nav');
          const tab = [...(nav?.querySelectorAll('a') ?? [])].find(el => el.getAttribute('href') === '/progress');
          const thumb = get('.pgr-cat');
          const root = document.documentElement;
          // Scan transparent image pixels after rendering so the test catches
          // a visually floating cat even when the image element box overlaps.
          const visibleBounds = img => {
            if (!(img instanceof HTMLImageElement) || !img.naturalWidth) return null;
            const canvas = document.createElement('canvas');
            canvas.width = 100; canvas.height = 100;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, 100, 100);
            const pixels = ctx.getImageData(0, 0, 100, 100).data;
            let top = 100, bottom = -1;
            for (let y = 0; y < 100; y++) {
              for (let x = 0; x < 100; x++) {
                if (pixels[(y * 100 + x) * 4 + 3] > 48) {
                  if (y < top) top = y;
                  if (y > bottom) bottom = y;
                }
              }
            }
            if (bottom < 0) return null;
            const rect = img.getBoundingClientRect();
            return { top: rect.top + rect.height * top / 100, bottom: rect.top + rect.height * (bottom + 1) / 100 };
          };
          const catPixels = visibleBounds(get('.pgr-cat'));
          const pianoPixels = visibleBounds(get('.pgr-piano'));
          const imageStates = [...document.querySelectorAll('.pgr-page img')].map(img => ({
            src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0,
          }));
          const tabs = [...(nav?.querySelectorAll('a') ?? [])].map(el => ({
            label: el.textContent?.trim(),
            background: getComputedStyle(el).backgroundColor,
            ink: getComputedStyle(el).color,
          }));
          return {
            theme: root.dataset.theme, catMode: root.dataset.catMode,
            innerWidth, innerHeight,
            overflow: root.scrollWidth - root.clientWidth,
            title: get('.pgr-heading h1')?.textContent,
            catSrc: thumb?.getAttribute('src'),
            catBox: thumb ? [box('.pgr-cat').x, box('.pgr-cat').y, box('.pgr-cat').width, box('.pgr-cat').height] : null,
            pianoLoaded: imageStates.find(x => x.src.includes('piano-keys-wide.png'))?.loaded,
            // Positive separation means the visible cat is floating above the keyboard.
            catKeyGap: catPixels && pianoPixels ? pianoPixels.top - catPixels.bottom : null,
            streakIcons: [...document.querySelectorAll('.pgr-streak img')].map(img => ({width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height})),
            imageStates,
            navTop: nav?.getBoundingClientRect().top,
            navBottom: nav?.getBoundingClientRect().bottom,
            navCount: tabs.length,
            progressTab: tab ? { background: getComputedStyle(tab).backgroundColor, ink: getComputedStyle(tab).color, className: tab.className } : null,
            themeButtons: [...document.querySelectorAll('.pgr-theme-choices button')].map(el => ({
              name: el.getAttribute('aria-label'), pressed: el.getAttribute('aria-pressed'),
              imageLoaded: el.querySelector('img')?.naturalWidth > 0,
              cssOutlineWidth: getComputedStyle(el).outlineWidth,
            })),
            calendar: !!get('.practice-calendar-grid'),
            chartBars: document.querySelectorAll('.pgr-bar').length,
            historyCount: document.querySelectorAll('.pgr-history-list li').length,
            mainHeight: get('.pgr-page')?.getBoundingClientRect().height,
          };
        });
        assert.equal(result.title, 'Progress');
        assert.equal(result.theme, theme);
        assert.equal(result.catMode, mode ? 'on' : 'off');
        assert.ok(result.overflow <= 1, name + ' horizontal overflow: ' + result.overflow);
        assert.ok(result.navCount === 4, name + ' bottom-nav count');
        assert.ok(result.navTop >= 0 && result.navBottom <= height + 1, name + ' nav clipped');
        assert.ok(result.calendar && result.chartBars === 7, name + ' missing practice calendar or weekly bars');
        assert.ok(result.pianoLoaded && result.imageStates.every(x => x.loaded), name + ' missing image: ' + JSON.stringify(result.imageStates));
        assert.ok(result.catSrc?.endsWith('luna-' + (mode ? 'sitting' : 'sleeping') + '.png'), name + ' wrong companion pose');
        assert.deepEqual(result.themeButtons.map(x => x.pressed),
          theme === 'light' ? ['true', 'false', String(mode)] : ['false', 'true', String(mode)]);
        assert.ok(result.themeButtons.every(x => x.imageLoaded));
        assert.ok(result.themeButtons.every(x => Number.parseFloat(x.cssOutlineWidth) === 0),
          name + ' theme control has a duplicate CSS outline: ' + JSON.stringify(result.themeButtons));
        assert.deepEqual(result.streakIcons.map(icon => Math.round(icon.width)), [40, 40],
          name + ' streak and growth icons should be enlarged');
        assert.ok(result.catKeyGap !== null && result.catKeyGap <= 3,
          name + ' cat floats above piano keys by ' + result.catKeyGap + ' CSS pixels');
        assert.ok(result.catKeyGap >= -20,
          name + ' cat is sinking too deeply into the piano: ' + result.catKeyGap);
        assert.deepEqual(errors, [], name + ' JS errors');
        const screenshot = path.join(out, 'progress-' + name + '.png');
        await page.screenshot({ path: screenshot, animations: 'disabled', fullPage: false });
        const full = path.join(out, 'progress-' + name + '-full.png');
        await page.screenshot({ path: full, animations: 'disabled', fullPage: true });
        // The mobile app scrolls inside .viewport, so browser fullPage alone
        // cannot capture the weekly chart and history below the first fold.
        await page.locator('.viewport').evaluate(el => { el.scrollTop = el.scrollHeight; });
        await page.waitForTimeout(120);
        const bottom = path.join(out, 'progress-' + name + '-bottom.png');
        await page.screenshot({ path: bottom, animations: 'disabled' });
        report.push({ name, ...result, screenshot: path.basename(screenshot), full: path.basename(full), bottom: path.basename(bottom), passed: true });
        console.log('PASS visual Progress:', name, 'content height:', result.mainHeight);
        await context.close();
      }
    }
  }
  // First-time visitors should see the cat. Saved OFF wins even after reload.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, colorScheme: 'dark'
  });
  const page = await context.newPage();
  await page.goto(base + '/progress', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'on');
  await page.getByRole('button', { name: 'Cat Mode' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'off');
  await page.getByRole('button', { name: 'Light theme' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await context.close();
} finally {
  await browser.close();
}
await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
