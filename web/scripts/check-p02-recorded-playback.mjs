import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const directory = 'docs/screenshots/p02-recorded-audio';
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const { width, height } of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    const faults = [];
    page.on('pageerror', error => faults.push(error.message));
    const size = width + 'x' + height;

    await page.goto(base + '/player?recording=autumn-leaves', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Autumn Leaves (Video Chart)' }).waitFor();
    assert.equal(await page.getByRole('tab', { name: 'Chart' }).getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('.chord-grid .measure').count(), 35, 'video chart has 32 form bars and 3 tag bars');
    assert.equal(await page.locator('#player-chart').inputValue(), 'autumn-leaves-gm-video-35');
    const bar27 = await page.locator('.chord-grid .measure').nth(26).getAttribute('aria-label');
    assert(bar27?.includes('Gm7 then C7'), 'bar 27 must display both video chords');
    const bar29 = await page.locator('.chord-grid .measure').nth(28).getAttribute('aria-label');
    assert(bar29?.includes('Eb7'), 'video uses E-flat dominant 7, not major 7');
    assert(!bar29?.includes('maj7'), 'video bar 29 has no major 7');
    await page.screenshot({ path: directory + '/' + size + '-autumn-video-chart.png', fullPage: true });
    await page.getByRole('tab', { name: 'Player' }).click();
    await page.getByRole('slider', { name: 'Seek recording' }).waitFor();
    await page.screenshot({ path: directory + '/' + size + '-autumn-recorded-player.png', fullPage: true });
    const audioAsset = await page.request.get(base + '/audio/backing-tracks/autumn-leaves.m4a');
    assert(audioAsset.ok(), 'real uploaded M4A must be served');
    assert.equal((await audioAsset.body()).byteLength, 3971609, 'recording bytes must be complete');
    const mediaSupport = await page.locator('audio').evaluate(element => ({
      codec: element.canPlayType('audio/mp4; codecs="mp4a.40.2"'),
      duration: element.duration,
    }));
    if (mediaSupport.codec) {
      await page.locator('audio').evaluate(async element => {
        if (element.readyState >= 1) return;
        await new Promise((resolve, reject) => {
          element.addEventListener('loadedmetadata', resolve, { once: true });
          element.addEventListener('error', () => reject(Error('Supported AAC playback failed')), { once: true });
          setTimeout(() => reject(Error('Audio metadata timeout')), 6000);
        });
      });
      await page.getByRole('button', { name: 'Play recording and start practice timer' }).click();
      await page.waitForTimeout(450);
      assert(await page.locator('audio').evaluate(el => !el.paused), 'audio must actually play');
      await page.getByRole('button', { name: 'Pause recording and practice timer' }).click();
      assert(await page.locator('audio').evaluate(el => el.paused), 'audio must pause');
      await page.getByRole('slider', { name: 'Seek recording' }).fill('8');
      const pos = await page.locator('audio').evaluate(el => el.currentTime);
      assert(Math.abs(pos - 8) < 1.5, 'seek must update media clock');
      await page.getByRole('button', { name: 'Restart recording' }).first().click();
      assert((await page.locator('audio').evaluate(el => el.currentTime)) < 1.5, 'restart must seek to zero');
    } else {
      console.warn('AAC codec unsupported in bundled Chromium: audio bytes/UI verified; physical iPhone Safari playback remains required');
      assert(!Number.isFinite(mediaSupport.duration) || mediaSupport.duration >= 0);
    }
    // Chromium images can be checked without AAC decoding by notifying React
    // of the current media clock time, which remains the sole chart authority.
    await page.getByRole('tab', { name: 'Chart' }).click();
    const simulateAudioAt = async seconds => {
      await page.locator('audio').evaluate((el, t) => {
        Object.defineProperty(el, 'currentTime', { configurable: true, value: t, writable: true });
        el.dispatchEvent(new Event('timeupdate'));
      }, seconds);
    };
    await simulateAudioAt(5.75 + 32 * 240 / 170);
    await page.waitForFunction(() => document.querySelector('.measure[aria-current="true"]')?.getAttribute('aria-label')?.startsWith('Measure 1:'));
    await simulateAudioAt(5.75 + 158 * 240 / 170);
    await page.waitForFunction(() => document.querySelector('.measure[aria-current="true"]')?.getAttribute('aria-label')?.startsWith('Measure 33:'));
    await page.screenshot({ path: directory + '/' + size + '-autumn-tag-highlight.png', fullPage: true });
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await page.getByRole('heading', { name: 'Great practice!' }).waitFor();

    await page.goto(base + '/player?chart=blues-f-12', { waitUntil: 'networkidle' });
    await page.getByRole('tabpanel', { name: 'Jazz chord chart' }).waitFor();
    assert((await page.locator('.chord-grid .measure').count()) >= 12, 'approved chart grid must render');
    await page.screenshot({ path: directory + '/' + size + '-approved-chord-grid.png', fullPage: true });
    await page.getByRole('tab', { name: 'Player' }).click();
    await page.getByText('Chart Only · No Recording').waitFor();
    await page.screenshot({ path: directory + '/' + size + '-approved-player.png', fullPage: true });
    assert.deepEqual(faults, [], 'no browser exceptions');
    await context.close();
  }
} finally { await browser.close(); }
