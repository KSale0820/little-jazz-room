import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = join(process.cwd(), 'docs', 'screenshots', 'class-demo-tools');
mkdirSync(output, { recursive: true });
// Reject a stale, missing, or accidentally recompressed background, not just a 200 response.
for (const [file, expected] of [
  ['p05-metronome-room-2026-11-02.webp', '65d614f02c7665c64e0a05557efe48a24f180780425700db634e4025c788213f'],
]) {
  let actual;
  try {
    const bytes = readFileSync(join(process.cwd(), 'public', 'visuals', 'tools', file));
    actual = createHash('sha256').update(bytes).digest('hex');
  } catch {
    throw new Error('Approved P04/P05 binary asset is not committed to class-demo-tools: ' + file);
  }
  if (actual !== expected) throw new Error('Unexpected P04/P05 image contents: ' + file);
}

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
    const assertApprovedBackground = async (selector, expectedHeight) => {
      const picture = page.locator(selector);
      const result = await picture.evaluate(img => {
        const el = img;
        const style = getComputedStyle(el);
        const bounds = el.getBoundingClientRect();
        return {
          width: el.naturalWidth, height: el.naturalHeight,
          opacity: Number(style.opacity), top: bounds.top, bottom: bounds.bottom,
          boundingWidth: bounds.width, cssBottom: parseFloat(style.bottom),
          pageBottom: el.closest('.tool-page')?.getBoundingClientRect().bottom,
        };
      });
      if (result.width !== 1170 || result.height !== expectedHeight ||
          result.opacity < 0.99 || result.boundingWidth < width - 2) {
        throw new Error('Approved illustration missing or incorrectly positioned: ' +
          selector + ' at ' + width + 'x' + height + ': ' + JSON.stringify(result));
      }
      const navBox = await page.locator('nav.bottom-nav').boundingBox();
      const viewportBox = await page.locator('.viewport').boundingBox();
      const shortViewport = height <= 720;
      const usesNewMetronomeRoom = await page.locator('.tool-metronome').count() > 0 &&
        await page.locator('.tool-metronome').evaluate(element => element.classList.contains('tool-has-new-room'));
      // The approved P04 screenshots at 390×844 and 375×667 show the room art
      // clipped by the scroll viewport above the fixed navigation. The page's
      // content can extend below that viewport, so an image's raw bounding-box
      // bottom is NOT its visible floor position and must not equal nav.y.
      // Keep the intended CSS floor offset and require the VISIBLE artwork to
      // terminate at the navigation boundary, without changing the art or CSS.
      const floorOffset = shortViewport
        ? (selector.includes('metronome') ? (usesNewMetronomeRoom ? 0 : 40) : 35) : 0;
      const expectedCssBottom = -floorOffset;
      const viewportBottom = viewportBox ? viewportBox.y + viewportBox.height : NaN;
      const visibleBottom = Math.min(result.bottom, viewportBottom);
      if (!navBox || !viewportBox ||
          Math.abs(result.cssBottom - expectedCssBottom) > 1 ||
          Math.abs(result.bottom - ((result.pageBottom ?? NaN) + floorOffset)) > 2 ||
          result.top >= viewportBottom ||
          Math.abs(visibleBottom - navBox.y) > 6) {
        throw new Error('Approved room illustration is not aligned with the visible viewport floor: ' +
          selector + ' ' + JSON.stringify({ artwork: result, nav: navBox,
            viewport: viewportBox, expectedCssBottom, visibleBottom, width, height }));
      }
    };
    const waitArtwork = async () => page.evaluate(async () => {
      await Promise.all([...document.images].map(img => img.decode().catch(() => undefined)));
      if (document.fonts?.ready) await document.fonts.ready;
    });

    await page.goto(base + '/practice', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Tuner', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/tuner');
    await page.getByRole('heading', { name: 'Tuner' }).waitFor();
    await waitArtwork();
    await assertNoOverflow();
    if (!(await page.getByText('No pitch detected').isVisible())) throw new Error('Tuner fabricated idle pitch');
    // The redesigned P04 is intentionally clean: no room, cat, vines,
    // illustrations or background image, unlike P05 Metronome.
    const tunerSurface = await page.locator('.tool-tuner').evaluate(element => {
      const css = getComputedStyle(element);
      return { backgroundImage: css.backgroundImage, backgroundColor: css.backgroundColor,
        horizontalOverflow: element.scrollWidth - element.clientWidth };
    });
    if (await page.locator('.tool-tuner img').count() ||
      tunerSurface.backgroundImage !== 'none' || tunerSurface.horizontalOverflow > 1) {
      throw new Error('Clean tuner contains decorative imagery or overflows: ' + JSON.stringify(tunerSurface));
    }
    if (!await page.locator('.tool-tuner .tuner-main-card').isVisible()) {
      throw new Error('Clean tuner is missing the central tuning card');
    }
    const tuningModes = page.locator('.tool-tuner .tuner-modes button');
    if (await tuningModes.count() !== 3 ||
        !await page.getByRole('button', { name: 'Chromatic', exact: true }).isVisible()) {
      throw new Error('Clean tuner segmented tuning selector is clipped');
    }
    const tunerControls = await page.locator('.tool-tuner .tuner-mic').first().boundingBox();
    const tunerCard = await page.locator('.tool-tuner .tuner-main-card').boundingBox();
    if (!tunerControls || !tunerCard || tunerControls.y + tunerControls.height > tunerCard.y + 1) {
      throw new Error('Enable microphone must be clearly visible above the tuning card');
    }
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
    await page.getByRole('button', { name: 'Metronome', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/metronome');
    await page.getByRole('heading', { name: 'Metronome' }).waitFor();
    await waitArtwork();
    await assertNoOverflow();
    const missingMetronomeArt = await page.locator('.tool-metronome img').evaluateAll(
      images => images.filter(img => !img.naturalWidth).map(img => img.src));
    if (missingMetronomeArt.length) throw new Error('Missing metronome art: ' + missingMetronomeArt.join(', '));
    await assertApprovedBackground('.tool-metronome .tool-bottom-art', 1637);
    if (await page.locator('.tool-metronome .tool-bottom-art').getAttribute('src')
      !== '/visuals/tools/p05-metronome-room-2026-11-02.webp') {
      throw new Error('The replacement P05 room artwork is not loaded');
    }
    const direction = await page.locator('.tool-metronome-scene .tool-scene-cat')
      .evaluate(img => getComputedStyle(img).transform);
    if (direction !== 'matrix(-1, 0, 0, 1, 0, 0)') {
      throw new Error('The sitting companion must face inward toward the Play control');
    }
    const toolNav = await page.locator('nav.bottom-nav').boundingBox();
    const playButton = await page.getByRole('button', { name: 'Start metronome' }).boundingBox();
    const catImage = await page.locator('.tool-metronome .tool-scene-cat').boundingBox();
    if (!toolNav || !playButton || !catImage || playButton.y + playButton.height > toolNav.y + 1 || catImage.y + catImage.height > toolNav.y + 1) {
      throw new Error('Metronome CTA or cat scene clipped by navigation at ' + width + 'x' + height);
    }
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
    console.log('PASS clean P04/P05 ' + width + 'x' + height + ': routes, clean tuner layout, P05 artwork, microphone, reference tone, Web Audio clicks, pause, meter and tempo. Screenshots saved.');
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
  // Inject an actual 440 Hz / guitar E2 / bass E1 audio waveform into the
  // browser microphone path. This validates analyser -> pitch -> UI, not
  // permission alone, while avoiding any fabricated tuner reading.
  const pitched = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await pitched.addInitScript(() => {
    const media = navigator.mediaDevices;
    if (!media) return;
    Object.defineProperty(media, 'getUserMedia', {
      configurable: true,
      value: async () => {
        const context = new AudioContext();
        await context.resume();
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        const gain = context.createGain();
        gain.gain.value = 0.55;
        const destination = context.createMediaStreamDestination();
        oscillator.connect(gain);
        gain.connect(destination);
        oscillator.start();
        window.__pitchAudioFixture = { context, oscillator };
        return destination.stream;
      },
    });
  });
  const pitchedPage = await pitched.newPage();
  await pitchedPage.goto(base + '/tuner', { waitUntil: 'networkidle' });
  await pitchedPage.getByRole('button', { name: 'Enable microphone' }).click();
  await pitchedPage.waitForFunction(() => document.querySelector('.tuner-reading strong')?.textContent === 'A4', { timeout: 12000 });
  const readHz = async () => Number((await pitchedPage.locator('.tuner-reading > span').innerText()).split(' ')[0]);
  const a440 = await readHz();
  if (Math.abs(a440 - 440) > 5) throw new Error('Actual audio pitch pipeline failed A440: ' + a440 + ' Hz');
  const deviation = await pitchedPage.locator('.tuner-gauge').getAttribute('aria-label');
  if (!deviation?.includes('Deviation')) throw new Error('Pitch needle did not receive live cents reading');
  await pitchedPage.getByRole('button', { name: 'Guitar', exact: true }).click();
  await pitchedPage.evaluate(() => {
    window.__pitchAudioFixture.oscillator.frequency.setValueAtTime(82.4069, window.__pitchAudioFixture.context.currentTime);
  });
  await pitchedPage.waitForFunction(() => document.querySelector('.tuner-reading strong')?.textContent === 'E2', { timeout: 12000 });
  const guitarHz = await readHz();
  if (Math.abs(guitarHz - 82.4069) > 3) throw new Error('Actual audio pitch pipeline failed guitar E2: ' + guitarHz + ' Hz');
  await pitchedPage.getByRole('button', { name: 'Bass', exact: true }).click();
  await pitchedPage.evaluate(() => {
    window.__pitchAudioFixture.oscillator.frequency.setValueAtTime(41.2034, window.__pitchAudioFixture.context.currentTime);
  });
  await pitchedPage.waitForFunction(() => document.querySelector('.tuner-reading strong')?.textContent === 'E1', { timeout: 12000 });
  const bassHz = await readHz();
  if (Math.abs(bassHz - 41.2034) > 3) throw new Error('Actual audio pitch pipeline failed bass E1: ' + bassHz + ' Hz');
  await pitchedPage.getByRole('button', { name: 'Stop microphone' }).click();
  if (!(await pitchedPage.getByText('No pitch detected').isVisible())) throw new Error('Tuner displayed stale pitch after stopping audio');
  await pitchedPage.evaluate(() => {
    window.__pitchAudioFixture.oscillator.stop();
    return window.__pitchAudioFixture.context.close();
  });
  await pitched.close();
  console.log('PASS P04 live Web Audio pitch pipeline: A440, guitar E2, bass E1, cents needle, stop/silence');
} finally {
  await browser.close();
}
