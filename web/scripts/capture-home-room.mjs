#!/usr/bin/env node
/** Captures the interactive Home room at supported viewports. Output: OUT_DIR (default docs/screenshots/_local, git-ignored) */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.OUT_DIR ?? join(webRoot, 'docs', 'screenshots', '_local');
const base = process.env.APP_URL ?? 'http://localhost:5174';
mkdirSync(out, { recursive: true });

const viewports = [
  { name: '375x667', width: 375, height: 667, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '430x932', width: 430, height: 932, mobile: true },
  { name: '768x1024', width: 768, height: 1024, mobile: true },
  { name: '1280x900', width: 1280, height: 900, mobile: false },
];
const lighting = process.env.LIGHT ?? 'sunshine';
const seedLevel = Number(process.env.SEED ?? 0);
const suffix = process.env.SUFFIX ?? '';
const panels = (process.env.PANELS ?? 'music-stand,notebook,plants,lighting').split(',').filter(Boolean);
const panelButton = { 'music-stand': /Sheet music stand/, notebook: /Bookshelf notebook/, plants: /^Plants/, lighting: /^Room lighting$/ };

const browser = await chromium.launch();
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  });
  const page = await ctx.newPage();
  await page.addInitScript(([l, seed]) => {
    localStorage.setItem('little-jazz-room:room-lighting:v1', l);
    if (seed) {
      const sessions = Array.from({ length: seed >= 2 ? 22 : 12 }, (_, d) => ({
        id: `seed-${d}`,
        finishedAt: new Date(Date.now() - d * 86400000).toISOString(),
        durationSeconds: (d === 0 ? 20 : 25) * 60,
      }));
      localStorage.setItem('little-jazz-room:practice-sessions:v1:anonymous', JSON.stringify(sessions));
    }
  }, [lighting, seedLevel]);
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  console.log(vp.name, 'horizontal overflow:', overflow);
  await page.screenshot({ path: join(out, `home-${vp.name}${suffix}.png`) });
  if (vp.mobile) {
    const scroller = page.locator('.room-scroller');
    const left = () => scroller.evaluate(el => Math.round(el.scrollLeft));
    const start = await left();
    for (const [chip, tag] of [['Pan to the bookshelf notebook', 'pan-shelf'], ['Pan to the plants', 'pan-garden']]) {
      const btn = page.getByRole('button', { name: chip });
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(1200);
        console.log(vp.name, tag, 'scrollLeft', start, '->', await left());
        await page.screenshot({ path: join(out, `home-${vp.name}-${tag}${suffix}.png`) });
      }
    }
  }
  for (const p of panels) {
    await page.getByRole('button', { name: panelButton[p] }).click({ position: { x: 24, y: 24 } });
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(out, `home-${vp.name}-${p}${suffix}.png`) });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    if (process.env.CHECK === '1') {
      const open = () => page.getByRole('dialog').count();
      console.log(vp.name, p, 'closed by Escape:', (await open()) === 0);
      await page.getByRole('button', { name: panelButton[p] }).click({ position: { x: 24, y: 24 } });
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /^Close / }).click();
      await page.waitForTimeout(300);
      console.log(vp.name, p, 'closed by button:', (await open()) === 0);
      if (vp.mobile) {
        await page.getByRole('button', { name: panelButton[p] }).click({ position: { x: 24, y: 24 } });
        await page.waitForTimeout(300);
        await page.locator('.room-panel-backdrop').dispatchEvent('click');
        await page.waitForTimeout(300);
        console.log(vp.name, p, 'closed by backdrop:', (await open()) === 0);
      }
    }
  }
  if (process.env.CHECK === '1') {
    await page.getByRole('button', { name: /^Piano/ }).click({ position: { x: 24, y: 24 } });
    await page.waitForTimeout(600);
    console.log(vp.name, 'piano ->', new URL(page.url()).pathname);
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Bookshelf notebook/ }).click({ position: { x: 24, y: 24 } });
    const items = page.locator('.room-routine');
    const n = await items.count();
    if (n > 1) {
      const target = items.nth(n - 1);
      const title = await target.locator('strong').innerText();
      await target.evaluate(el => el.click());
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Sheet music stand/ }).click({ position: { x: 24, y: 24 } });
      console.log(vp.name, 'routine selection reflected on stand:', (await page.getByRole('dialog').innerText()).includes(title), title);
    }
  }
  await ctx.close();
}
await browser.close();
