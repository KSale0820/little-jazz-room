/**
 * End-to-end tuner capture check using Chromium's real getUserMedia pipeline.
 * A deterministic 440 Hz WAV is supplied as the fake microphone; no pitch
 * result is mocked, and the actual React tuner must detect A4.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = 'http://127.0.0.1:5192';
const scratch = mkdtempSync(join(tmpdir(), 'ljr-tuner-mic-'));
const wavPath = join(scratch, 'a440.wav');
const sampleRate = 48000;
const seconds = 3;
const frames = sampleRate * seconds;
const wav = Buffer.alloc(44 + frames * 2);
wav.write('RIFF', 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); // PCM
wav.writeUInt16LE(1, 22); // mono
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(frames * 2, 40);
for (let n = 0; n < frames; n++) {
  wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * n / sampleRate) * 12000), 44 + n * 2);
}
writeFileSync(wavPath, wav);

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5192', '--strictPort'], {
  cwd: process.cwd(), stdio: 'ignore',
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 70; attempt++) {
    try {
      const response = await fetch(origin + '/tuner');
      if (response.ok) { ready = true; break; }
    } catch { /* server startup */ }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  if (!ready) throw new Error('Vite test server did not start');

  browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--use-file-for-fake-audio-capture=' + wavPath,
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
  });
  const context = await browser.newContext({ permissions: ['microphone'], viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(origin + '/tuner');
  await page.getByRole('button', { name: /Enable microphone/ }).click();
  await page.getByRole('button', { name: /Stop microphone/ }).waitFor({ timeout: 12000 });
  await page.getByText('A4', { exact: true }).first().waitFor({ timeout: 15000 });
  const frequency = await page.locator('.tuner-reading span').textContent();
  const measured = Number.parseFloat(frequency ?? '');
  if (!Number.isFinite(measured) || Math.abs(measured - 440) > 4) {
    throw new Error('Expected A440 microphone input, got ' + frequency);
  }
  // The same actual microphone stream must drive the Voice mode graph.
  await page.getByRole('button', { name: 'Voice' }).click();
  await page.getByRole('region', { name: 'Live pitch graph' }).waitFor();
  await page.locator('.tuner-trail-plot polyline[points]:not([points=""])').first()
    .waitFor({ timeout: 12000 });
  const plotted = await page.locator('.tuner-trail-plot polyline').first().getAttribute('points');
  if (!plotted || plotted.split(' ').length < 2) {
    throw new Error('Voice pitch graph did not receive enough live microphone samples');
  }
  for (const [width, height] of [[390, 844], [375, 667]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole('region', { name: 'Live pitch graph' }).scrollIntoViewIfNeeded();
    // The status row must not resize as audio readings change.
    const statusWithNote = await page.locator('.tuner-status').evaluate(element => element.getBoundingClientRect().height);
    await page.screenshot({ path: `tuner-voice-${width}x${height}.png` });
    const overflowing = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (overflowing) throw new Error('Voice tuner overflows horizontal viewport at ' + width);
    await page.getByRole('button', { name: 'Chromatic' }).click();
    const modeTextFits = await page.getByRole('button', { name: 'Chromatic' }).evaluate(button =>
      button.scrollWidth <= button.clientWidth + 1);
    if (!modeTextFits) throw new Error('Chromatic tab is cropped at ' + width);
    const statusAfterSwitch = await page.locator('.tuner-status').evaluate(element => element.getBoundingClientRect().height);
    if (statusWithNote !== statusAfterSwitch || statusAfterSwitch > 40) {
      throw new Error('Status changed height at ' + width + ': ' + statusWithNote + ' -> ' + statusAfterSwitch);
    }
    await page.getByRole('button', { name: 'Voice' }).click();
    const spokenOption = await page.getByRole('button', { name: /Spoken notes/ }).count();
    if (spokenOption) throw new Error('Spoken notes toggle should be absent');
  }
  if (errors.length) throw new Error('Page errors: ' + errors.join('; '));
  console.log('PASS: real browser microphone detected A4 at ' + frequency +
    ' and drew ' + plotted.split(' ').length + ' live graph points');
  await page.getByRole('button', { name: /Stop microphone/ }).click();
  await context.close();
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  rmSync(scratch, { recursive: true, force: true });
}
