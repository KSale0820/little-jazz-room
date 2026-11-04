// Deterministic media-clock acceptance. This does NOT verify AAC decoding or audible playback.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const directory = 'docs/screenshots/p02-recorded-audio';
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
    await context.addInitScript(() => {
      const state = new WeakMap();
      const get = el => { if (!state.has(el)) state.set(el, { time: 0, paused: true }); return state.get(el); };
      Object.defineProperties(HTMLMediaElement.prototype, {
        currentTime: { configurable: true, get() { return get(this).time; }, set(t) { get(this).time = t; this.dispatchEvent(new Event('seeked')); } },
        duration: { configurable: true, get() { return 245; } },
        paused: { configurable: true, get() { return get(this).paused; } },
        play: { configurable: true, value() { get(this).paused = false; this.dispatchEvent(new Event('play')); return Promise.resolve(); } },
        pause: { configurable: true, value() { if (!get(this).paused) { get(this).paused = true; this.dispatchEvent(new Event('pause')); } } },
      });
      window.mediaAt = t => {
        const audio = document.querySelector('audio');
        if (t >= audio.duration && audio.loop) audio.currentTime = 0;
        else if (t >= audio.duration) { audio.currentTime = audio.duration; audio.pause(); audio.dispatchEvent(new Event('ended')); }
        else audio.currentTime = t;
        audio.dispatchEvent(new Event('timeupdate'));
      };
    });
    const page = await context.newPage();
    const faults = []; page.on('pageerror', e => faults.push(e.message));
    const size = viewport.width + 'x' + viewport.height;
    await page.goto(base + '/player?recording=autumn-leaves', { waitUntil: 'networkidle' });
    await page.locator('audio').evaluate(el => el.dispatchEvent(new Event('loadedmetadata')));
    await page.clock.install();
    assert.equal(await page.locator('.measure').count(), 35);
    assert.equal(await page.getByRole('tab', { name: 'Player', exact: true }).count(), 0);
    assert.equal(await page.locator('.practice-art-panel').count(), 0);
    assert.equal(await page.getByRole('slider').count(), 1);
    assert.equal(await page.getByRole('progressbar').count(), 0);
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(bodyWidth <= viewport.width, 'No horizontal overflow');
    const asset = await page.request.get(base + '/audio/backing-tracks/autumn-leaves.m4a');
    assert.equal((await asset.body()).byteLength, 3971609, 'Original AAC asset intact');
    const bar = () => page.locator('.measure[aria-current="true"]').getAttribute('aria-label');
    const seek = async t => { await page.getByRole('slider').evaluate((el, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(value)); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, t); await page.clock.runFor(60); };
    const pos = () => page.locator('audio').evaluate(el => el.currentTime);
    await seek(5.75 + 26 * 240 / 170 + 3 * 60 / 170);
    assert((await bar()).startsWith('Measure 27:'));
    assert.equal(await page.locator('.measure[aria-current="true"] .chord-active').innerText(), 'C7');
    await page.getByRole('button', { name: 'Back 10 seconds', exact: true }).click();
    const skipped = await pos();
    assert(Math.abs(skipped - (5.75 + 26 * 240 / 170 + 3 * 60 / 170 - 10)) < .1);
    await page.getByRole('button', { name: 'Forward 10 seconds', exact: true }).click();
    assert(Math.abs(await pos() - skipped - 10) < .01);
    await seek(0);
    await page.locator('.measure').nth(4).click();
    assert(Math.abs(await pos() - (5.75 + 4 * 240 / 170)) < .01, 'Measure tap seeks audio');
    const sliderBox = await page.getByRole('slider').boundingBox();
    await page.mouse.move(sliderBox.x + sliderBox.width * .2, sliderBox.y + sliderBox.height / 2);
    await page.mouse.down(); await page.mouse.move(sliderBox.x + sliderBox.width * .6, sliderBox.y + sliderBox.height / 2, { steps: 8 }); await page.mouse.up();
    assert(await pos() > 130 && await pos() < 165, 'Dragging seeks recording');
    await seek(2); await page.getByRole('button', { name: 'Back 10 seconds', exact: true }).click(); assert.equal(await pos(), 0);
    await seek(243); await page.getByRole('button', { name: 'Forward 10 seconds', exact: true }).click(); assert.equal(await pos(), 245);
    await seek(0);
    await page.getByRole('button', { name: 'Play recording', exact: true }).click();
    assert.equal(await page.locator('audio').evaluate(el => el.paused), false);
    await page.clock.runFor(2200);
    assert.equal(await page.getByTestId('session-elapsed').innerText(), '00:02');
    await seek(100);
    assert.equal(await page.getByTestId('session-elapsed').innerText(), '00:02', 'Seek never changes practice duration');
    await page.getByRole('button', { name: 'Hide practice time' }).click(); await page.clock.runFor(2000);
    await page.getByRole('button', { name: 'Show practice time' }).click();
    assert.equal(await page.getByTestId('session-elapsed').innerText(), '00:04');
    await page.getByRole('button', { name: 'Pause recording', exact: true }).click();
    await page.clock.runFor(2000); assert.equal(await page.getByTestId('session-elapsed').innerText(), '00:04');
    await page.getByRole('button', { name: 'Repeat recording' }).click();
    assert.equal(await page.locator('audio').evaluate(el => el.loop), true);
    await page.getByRole('button', { name: 'Play recording', exact: true }).click();
    await page.evaluate(() => window.mediaAt(245)); await page.clock.runFor(60);
    assert.equal(await pos(), 0); assert((await bar()).startsWith('Measure 1:'));
    for (const chorus of [1, 2, 3, 4]) {
      await page.evaluate(t => window.mediaAt(t), 5.75 + chorus * 32 * 240 / 170 + .01);
      await page.clock.runFor(60); assert((await bar()).startsWith('Measure 1:'));
    }
    await page.evaluate(t => window.mediaAt(t), 5.75 + 158 * 240 / 170 + .01);
    await page.clock.runFor(60); assert((await bar()).startsWith('Measure 33:'));
    assert.equal(await page.getByLabel('Original recording BPM').inputValue(), '170');
    assert(await page.getByLabel('Original recording BPM').getAttribute('readonly') !== null);
    const original = await page.locator('.measure').first().innerText();
    await page.getByLabel('Transpose concert chart key').selectOption('A');
    assert.notEqual(await page.locator('.measure').first().innerText(), original);
    await page.getByLabel('Transposing instrument').selectOption('Bb');
    assert.equal(await page.locator('audio').evaluate(el => el.playbackRate), 1);
    await page.getByLabel('Transpose concert chart key').selectOption('G');
    await page.getByLabel('Transposing instrument').selectOption('C');
    await page.getByRole('button', { name: 'Repeat recording' }).click();
    await page.evaluate(() => window.mediaAt(245)); await page.clock.runFor(60);
    assert.equal(await page.locator('audio').evaluate(el => el.paused), true);
    const atEnd = await page.getByTestId('session-elapsed').innerText();
    await page.clock.runFor(1100); assert.equal(await page.getByTestId('session-elapsed').innerText(), atEnd);
    await page.getByRole('button', { name: 'Play recording', exact: true }).click();
    await seek(8); await page.getByRole('button', { name: 'Pause recording', exact: true }).click();
    await page.screenshot({ path: `${directory}/${size}-unified.png`, fullPage: true });
    for (const button of await page.locator('.practice-utility-row button, .practice-control-row button').all()) {
      await button.scrollIntoViewIfNeeded(); const box = await button.boundingBox(); assert(box.x >= 0 && box.x + box.width <= viewport.width + 1);
    }
    const practiced = await page.getByTestId('session-elapsed').innerText();
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await page.getByRole('button', { name: 'Save Session', exact: true }).click();
    await page.getByRole('button', { name: 'View Progress' }).click(); await page.reload({ waitUntil: 'networkidle' });
    const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
    assert.equal(sessions.length, 1); assert.equal(sessions[0].durationSeconds, Number(practiced.split(':')[0]) * 60 + Number(practiced.split(':')[1]));
    await page.goto(base + '/player?chart=blues-f-12', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('audio').count(), 0); assert.equal(await page.getByRole('slider').count(), 0);
    await page.getByRole('button', { name: 'Start practice timer' }).click(); await page.clock.runFor(1100);
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    await page.screenshot({ path: `${directory}/${size}-chart-only.png`, fullPage: true });
    // Catalog fixture exercises the existing no-linked-chart component, not a guessed chart.
    await page.route('**/recordingCatalog.ts', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace('chartId: "autumn-leaves-gm-video-35"', 'chartId: null');
      await route.fulfill({ response, body });
    });
    await page.goto(base + '/player?recording=autumn-leaves', { waitUntil: 'networkidle' });
    await page.getByText('No chart linked', { exact: true }).waitFor();
    assert.equal(await page.locator('.measure').count(), 0);
    assert.equal(await page.getByRole('slider').count(), 1);
    await page.locator('audio').evaluate(el => el.dispatchEvent(new Event('loadedmetadata')));
    await page.getByRole('button', { name: 'Play recording', exact: true }).click();
    await page.clock.runFor(1100);
    await page.getByRole('button', { name: 'Hide practice time' }).click(); await page.clock.runFor(1100);
    await page.getByRole('button', { name: 'Show practice time' }).click();
    assert.equal(await page.getByTestId('session-elapsed').innerText(), '00:02');
    await page.screenshot({ path: `${directory}/${size}-no-chart.png`, fullPage: true });
    assert.deepEqual(faults, []);
    console.log(`PASS ${size}: mocked media clock, seeking, skips, repeat, five choruses/tag, separate timer, hide/resume, settings, save/reload, no overflow`);
    await context.close();
  }
} finally { await browser.close(); }
