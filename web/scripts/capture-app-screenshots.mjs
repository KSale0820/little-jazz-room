#!/usr/bin/env node
/**
 * Capture all main app screens for design review handoff.
 * Output: web/docs/screenshots/current-app/{mobile,desktop}/
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(webRoot, 'docs', 'screenshots', 'current-app');
const baseUrl = process.env.APP_URL ?? 'http://localhost:5174';

const routes = [
  { slug: '01-home', path: '/' },
  { slug: '02-explore', path: '/explore' },
  { slug: '03-create', path: '/create' },
  { slug: '04-practice', path: '/practice' },
  { slug: '05-profile', path: '/profile' },
  { slug: '06-signin', path: '/signin' },
];

const viewports = [
  { folder: 'mobile', width: 390, height: 844, isMobile: true },
  { folder: 'desktop', width: 1280, height: 900, isMobile: false },
];

mkdirSync(join(outRoot, 'mobile'), { recursive: true });
mkdirSync(join(outRoot, 'desktop'), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  channel: process.env.PW_CHANNEL ?? 'msedge',
});

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.isMobile ? 2 : 1,
    isMobile: vp.isMobile,
  });
  const page = await context.newPage();
  // Seed localStorage so the room always renders in sunshine mode during captures
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(() => {
    localStorage.setItem('little-jazz-room:room-lighting:v1', 'sunshine');
  });
  for (const route of routes) {
    const url = `${baseUrl}${route.path}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(600);
    const file = join(outRoot, vp.folder, `${route.slug}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log('saved', file);
  }
  await context.close();
}

await browser.close();
console.log('Done.', outRoot);
