/**
 * P04/P05 coordinated-tool visual QA. Test real DOM/audio controls at both
 * approved mobile sizes; never substitute a static mockup for a screenshot.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const origin = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const screenshots = join(process.cwd(), 'docs', 'screenshots', 'polished-tools-pair');
mkdirSync(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function createContext(width, height, theme, catMode, denyMic = false) {
  const context = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 1,
    colorScheme: theme, isMobile: true, hasTouch: true, reducedMotion: 'reduce',
  });
  await context.addInitScript(({ theme, catMode, denyMic }) => {
    localStorage.setItem('little-jazz-room:appearance:v1', theme);
    localStorage.setItem('little-jazz-room:decorative-cats:v1', String(catMode));
    if (denyMic && navigator.mediaDevices) {
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        configurable: true,
        value: async () => { throw new DOMException('Denied for test', 'NotAllowedError'); },
      });
    }
  }, { theme, catMode, denyMic });
  return context;
}

async function visit(page, route, heading) {
  await page.goto(origin + route, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: heading, exact: true }).waitFor();
  await page.evaluate(async () => {
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
    await document.fonts.ready;
  });
  const pageErrors = await page.locator('img').evaluateAll(images =>
    images.filter(image => !image.naturalWidth && getComputedStyle(image).visibility !== 'hidden')
      .map(image => image.getAttribute('src')));
  assert.deepEqual(pageErrors, [], heading + ' has missing visible images');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    heading + ' has horizontal overflow');
  assert.equal(await page.locator('nav.bottom-nav a').count(), 4, heading + ' lost main navigation');
}

async function assertApprovedAssetsAndAlignment(page, label) {
  const visual = await page.evaluate(() => {
    const rect = selector => {
      const e = document.querySelector(selector);
      if (!e) return null;
      const b = e.getBoundingClientRect();
      return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,cx:(b.left+b.right)/2,cy:(b.top+b.bottom)/2};
    };
    const images = [...document.querySelectorAll('.jazz-tool-footer img')].map(e => e.getAttribute('src'));
    return {
      heading: rect('.jazz-tool-header h1'),
      header: rect('.jazz-tool-header'),
      main: rect('.jazz-tool-main'),
      card: rect('.jazz-tool-main > .jazz-tuner-card, .jazz-tool-main > .jazz-metronome-card'),
      footer: rect('.jazz-tool-footer'),
      images,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });
  assert.ok(visual.header && visual.main && visual.card && visual.footer, label + ' missing layout region');
  assert.ok(Math.abs(visual.heading.cx - visual.viewportWidth / 2) < 5,
    label + ' heading not centered: ' + JSON.stringify(visual));
  assert.ok(Math.abs(visual.card.cx - visual.viewportWidth / 2) < 5,
    label + ' control card not centered: ' + JSON.stringify(visual));
  assert.ok(visual.header.bottom <= visual.card.top + 2 &&
    visual.card.bottom <= visual.footer.top + 2,
    label + ' tools overlap heading or companion art: ' + JSON.stringify(visual));
  // The main group consumes the flexible center region; artwork has its own
  // footer. Do not allow the previous 200px+ blank gap beneath the controls.
  const mainTarget = (visual.header.bottom + visual.footer.top) / 2;
  assert.ok(Math.abs(visual.main.cy - mainTarget) < 14,
    label + ' control stack is not vertically balanced: ' + JSON.stringify(visual));
  assert.ok(visual.images.every(s =>
      s?.startsWith('/visuals/cats/clean-pixel/') ||
      s === '/visuals/pixel-motifs/approved/plant-pot.png'),
    label + ' includes an unapproved substitute image: ' + JSON.stringify(visual.images));
  assert.ok(visual.images.length === 2,
    label + ' should use exactly one verified cat and one approved plant');
}

async function capture(page, name) {
  await page.screenshot({ path: join(screenshots, name + '.png'), animations: 'disabled', fullPage: false });
}

async function reachable(page, roleName) {
  const button = page.getByRole('button', { name: roleName });
  await button.scrollIntoViewIfNeeded();
  assert.ok(await button.isVisible(), roleName + ' cannot be reached');
  const bb = await button.boundingBox();
  const navLocator = page.locator('nav.bottom-nav');
  const nav = await navLocator.boundingBox();
  const bottomEdge = await navLocator.isVisible() ? nav?.y : page.viewportSize()?.height;
  assert.ok(bb && bottomEdge !== undefined && bb.y >= 0 && bb.y + bb.height <= bottomEdge + 2,
    roleName + ' is obscured or outside the phone viewport');
}

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const theme of ['light', 'dark']) {
      for (const catMode of [false, true]) {
        const suffix = [width + 'x' + height, theme, catMode ? 'cat-on' : 'cat-off'].join('-');
        const context = await createContext(width, height, theme, catMode);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));

        await visit(page, '/tuner', 'Tuner');
        assert.equal(await page.locator('.tool-tuner .tool-scene-cat').evaluate(element =>
          getComputedStyle(element).visibility), catMode ? 'visible' : 'hidden');
        assert.equal(await page.locator('.tuner-reading strong').textContent(), '—',
          'Idle tuner cannot fabricate pitch');
        await assertApprovedAssetsAndAlignment(page, 'tuner ' + suffix);
        await capture(page, 'tuner-idle-' + suffix);
        await reachable(page, 'Enable microphone');
        await page.getByRole('button', { name: 'Tuner help' }).click();
        await reachable(page, 'Play A 440 hertz tone');
        assert.ok(await page.getByText(/one sustained note/).isVisible());
        await page.getByRole('button', { name: 'Tuner help' }).click();

        await visit(page, '/metronome', 'Metronome');
        assert.equal(await page.locator('.tool-metronome .tool-scene-cat').evaluate(element =>
          getComputedStyle(element).visibility), catMode ? 'visible' : 'hidden');
        assert.equal(await page.locator('.metronome-bpm strong').textContent(), '120');
        await assertApprovedAssetsAndAlignment(page, 'metronome ' + suffix);
        await capture(page, 'metronome-idle-' + suffix);
        await page.getByRole('button', { name: 'Increase tempo by 1 BPM' }).click();
        assert.equal(await page.locator('.metronome-bpm strong').textContent(), '121');
        await page.locator('.jazz-signature-toggle').click();
        await page.getByRole('button', { name: '6/8' }).click();
        assert.equal(await page.locator('.metronome-beats button').count(), 6);
        await reachable(page, 'Start metronome');
        await page.getByRole('button', { name: 'Start metronome' }).click();
        await page.getByRole('button', { name: 'Stop metronome' }).waitFor();
        await page.waitForTimeout(280);
        await capture(page, 'metronome-running-' + suffix);
        await page.getByRole('button', { name: 'Stop metronome' }).click();
        assert.equal(await page.getByRole('button', { name: 'Start metronome' }).count(), 1);
        await page.getByRole('button', { name: 'Tap Tempo' }).click();
        await page.waitForTimeout(330);
        await page.getByRole('button', { name: 'Tap Tempo' }).click();
        assert.ok(await page.getByText('Tempo set from your taps').isVisible());
        await page.getByRole('button', { name: 'Metronome settings' }).click();
        await reachable(page, 'Toggle count-in between one and two measures');
        await page.getByRole('button', { name: 'Close metronome options' }).click();
        assert.deepEqual(errors, [], 'Page errors: ' + suffix);
        await context.close();
      }
      const deniedContext = await createContext(width, height, theme, false, true);
      const deniedPage = await deniedContext.newPage();
      await visit(deniedPage, '/tuner', 'Tuner');
      await deniedPage.getByRole('button', { name: 'Enable microphone' }).click();
      await deniedPage.getByText(/Microphone access was denied/).waitFor();
      await capture(deniedPage, 'tuner-permission-denied-' + width + 'x' + height + '-' + theme);
      await deniedContext.close();
    }
  }

  // Inject a real oscillating audio signal into the existing getUserMedia path.
  // The browser must calculate A4, deviation and in-tune itself.
  const live = await createContext(390, 844, 'light', false);
  await live.addInitScript(() => {
    if (!navigator.mediaDevices) return;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true, value: async () => {
        const sourceAudio = new AudioContext();
        await sourceAudio.resume();
        const oscillator = sourceAudio.createOscillator();
        const gain = sourceAudio.createGain();
        const destination = sourceAudio.createMediaStreamDestination();
        oscillator.frequency.value = 440;
        oscillator.connect(gain);
        gain.gain.value = .3;
        gain.connect(destination);
        oscillator.start();
        window.__testOscillator = { sourceAudio, oscillator };
        return destination.stream;
      },
    });
  });
  const livePage = await live.newPage();
  await visit(livePage, '/tuner', 'Tuner');
  await livePage.getByRole('button', { name: 'Enable microphone' }).click();
  await livePage.waitForFunction(() =>
    document.querySelector('.tuner-reading strong')?.textContent === 'A4', null, { timeout: 15000 });
  const deviation = await livePage.locator('.tuner-gauge').getAttribute('aria-label');
  assert.match(deviation, /Deviation/, 'Live tuning needle did not receive measured cents');
  await capture(livePage, 'tuner-live-A440-390x844-light-cat-off');
  await livePage.getByRole('button', { name: 'Stop microphone' }).click();
  await livePage.evaluate(() => {
    window.__testOscillator.oscillator.stop();
    return window.__testOscillator.sourceAudio.close();
  });
  await live.close();
  console.log('PASS: tool screenshots, real active states, permission denial, theme/cat matrix, mobile reachability');
} finally {
  await browser.close();
}
