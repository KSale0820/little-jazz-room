import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs', 'screenshots', 'class-demo-tools');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, hasTouch: true, isMobile: true,
      deviceScaleFactor: 2, permissions: ['microphone'],
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const assertNoOverflow = async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (overflow > 1) throw new Error('Horizontal overflow: ' + overflow + 'px at ' + width + 'x' + height);
      if (await page.locator('nav.bottom-nav a').count() !== 4) throw new Error('Bottom nav changed');
    };
    const waitArtwork = async () => page.evaluate(async () => {
      await Promise.all([...document.images].map(img => img.decode().catch(() => undefined)));
      if (document.fonts?.ready) await document.fonts.ready;
    });

    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Tuner Check your pitch/ }).click();
    await page.waitForURL(url => url.pathname === '/tuner');
    await page.getByRole('heading', { name: 'Tuner' }).waitFor();
    await waitArtwork();
    await assertNoOverflow();
    if (!(await page.getByText('No pitch detected').isVisible())) throw new Error('Tuner fabricated idle pitch');
    const missingTunerArt = await page.locator('.tool-tuner img').evaluateAll(
      images => images.filter(img => !img.naturalWidth).map(img => img.src));
    if (missingTunerArt.length) throw new Error('Missing tuner art: ' + missingTunerArt.join(', '));
    await page.screenshot({ path: join(output, 'P04-tuner-' + width + 'x' + height + '.png'), fullPage: false });
    console.log('SCREENSHOT_PREVIEW_P04_' + width + 'x' + height + ':' + (await page.screenshot({ type: 'jpeg', quality: 62 })).toString('base64'));
    await page.getByRole('button', { name: 'Enable microphone' }).click();
    await page.getByRole('button', { name: 'Stop microphone' }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Stop microphone' }).click();
    if (!(await page.getByText('No pitch detected').isVisible())) throw new Error('Stopping mic did not clear reading');
    await page.getByRole('button', { name: 'Play A 440 hertz tone' }).click();
    await page.getByRole('button', { name: 'Stop A 440 hertz tone' }).waitFor();
    await page.getByRole('button', { name: 'Stop A 440 hertz tone' }).click();
    await page.getByRole('button', { name: 'Guitar', exact: true }).click();
    if (!(await page.getByRole('button', { name: 'Guitar', exact: true }).getAttribute('aria-pressed'))?.includes('true')) {
      throw new Error('Guitar mode not selected');
    }
    await page.getByRole('button', { name: 'Bass', exact: true }).click();
    if ((await page.getByRole('button', { name: 'Bass', exact: true }).getAttribute('aria-pressed')) !== 'true') {
      throw new Error('Bass mode not selected');
    }

    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Metronome Keep steady time/ }).click();
    await page.waitForURL(url => url.pathname === '/metronome');
    await page.getByRole('heading', { name: 'Metronome' }).waitFor();
    await waitArtwork();
    await assertNoOverflow();
    const missingMetronomeArt = await page.locator('.tool-metronome img').evaluateAll(
      images => images.filter(img => !img.naturalWidth).map(img => img.src));
    if (missingMetronomeArt.length) throw new Error('Missing metronome art: ' + missingMetronomeArt.join(', '));
    await page.screenshot({ path: join(output, 'P05-metronome-' + width + 'x' + height + '.png'), fullPage: false });
    console.log('SCREENSHOT_PREVIEW_P05_' + width + 'x' + height + ':' + (await page.screenshot({ type: 'jpeg', quality: 62 })).toString('base64'));
    await page.getByRole('button', { name: 'Increase tempo by 1 BPM' }).click();
    if (!(await page.locator('.metronome-bpm').getByText('101').isVisible())) throw new Error('Plus button did not change BPM');
    await page.getByRole('button', { name: 'Decrease tempo by 1 BPM' }).click();
    await page.getByRole('button', { name: '6/8' }).click();
    if (await page.locator('.metronome-beats button').count() !== 6) throw new Error('6/8 subdivisions missing');
    await page.evaluate(() => {
      window.__toolQAStarts = 0;
      const prototype = OscillatorNode.prototype;
      const original = prototype.start;
      prototype.start = function (...args) {
        window.__toolQAStarts++;
        return original.apply(this, args);
      };
    });
    await page.getByRole('button', { name: 'Start metronome' }).click();
    await page.getByRole('button', { name: 'Pause metronome' }).waitFor();
    await page.waitForTimeout(720);
    const scheduledClicks = await page.evaluate(() => window.__toolQAStarts);
    if (scheduledClicks < 2) throw new Error('Web Audio clicks not scheduled: ' + scheduledClicks);
    await page.getByRole('button', { name: 'Pause metronome' }).click();
    const afterPause = await page.evaluate(() => window.__toolQAStarts);
    await page.waitForTimeout(350);
    if ((await page.evaluate(() => window.__toolQAStarts)) !== afterPause) throw new Error('Click scheduling continued after pause');
    if (errors.length) throw new Error('Browser console errors: ' + errors.join(' | '));
    console.log('PASS P04/P05 ' + width + 'x' + height + ': routes, image loads, responsive layout, microphone, reference tone, Web Audio click scheduling, pause, meter and tempo. Screenshots saved.');
    await context.close();
  }

  // Isolate permission-denied behavior in a separate browser context.
  const denied = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await denied.addInitScript(() => {
    const audio = navigator.mediaDevices;
    if (audio) Object.defineProperty(audio, 'getUserMedia', {
      configurable: true,
      value: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); },
    });
  });
  const deniedPage = await denied.newPage();
  await deniedPage.goto(base + '/tuner');
  await deniedPage.getByRole('button', { name: 'Enable microphone' }).click();
  await deniedPage.getByText(/Microphone access was denied/).waitFor({ timeout: 15000 });
  await denied.close();
  console.log('PASS P04 denied-microphone state');
} finally {
  await browser.close();
}
