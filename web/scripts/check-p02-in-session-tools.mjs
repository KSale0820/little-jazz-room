// In-session P02 tool overlays must not navigate, unmount or pause the shared Player.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/class-demo-p02-overlays');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const check = (ok, message) => { if (!ok) throw new Error(message); };
const seconds = s => s.trim().split(':').map(Number).reduce((acc, x) => acc * 60 + x, 0);

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const ctx = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      permissions: ['microphone'],
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const clock = page.locator('[data-testid="session-elapsed"]');
    const openFree = async () => {
      await page.goto(base + '/practice', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /^Free Practice/ }).click();
      await page.waitForURL(url => url.pathname === '/player');
    };
    const noOverflow = async () => {
      const offset = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(offset <= 1, 'Unexpected horizontal overflow: ' + offset);
    };

    await openFree();
    check(await page.getByText('Free Practice', { exact: true }).isVisible(), 'P02 Free mode not selected');
    check(await page.locator('.practice-utility-row').count() === 1, 'Free mode must display tool shortcuts');
    check(await page.locator('.practice-utility-row button').count() === 5, 'Approved layout requires five tool buttons');
    check(await page.getByRole('button', { name: /Mixer Preview/ }).isDisabled(), 'Mixer must remain Preview');
    await page.locator('.practice-utility-row').getByRole('button', { name: 'Tempo/Key' }).click();
    await page.getByRole('dialog', { name: 'Tempo and key settings' }).waitFor();
    await page.getByRole('dialog').getByRole('combobox', { name: 'Transpose concert chart key' }).selectOption('G');
    await page.getByRole('dialog').getByRole('button', { name: 'Close settings and return to session' }).click();
    const loop = page.locator('.practice-utility-row').getByRole('button', { name: 'Loop' });
    await loop.click();
    check(await loop.getAttribute('aria-pressed') === 'true', 'Loop tile did not enable chart highlight');
    await loop.click();
    check(await loop.getAttribute('aria-pressed') === 'false', 'Loop tile did not disable chart highlight');
    await page.screenshot({ path: join(out, 'P02-free-chart-' + width + 'x' + height + '.png') });
    await page.getByRole('tab', { name: 'Player' }).click();
    await page.screenshot({ path: join(out, 'P02-free-player-' + width + 'x' + height + '.png') });
    await page.getByRole('tab', { name: 'Chart' }).click();

    // The practice timer runs while the tuner is mounted as an in-session modal.
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1150);
    const beforeTuner = seconds(await clock.textContent());
    await page.locator('.practice-utility-row').getByRole('button', { name: /Tuner/ }).click();
    await page.getByRole('dialog', { name: 'Tuner within practice' }).waitFor();
    check(new URL(page.url()).pathname === '/player', 'Tuner changed the Player route');
    check(await page.locator('.practice-player').count() === 1, 'Player unmounted beneath Tuner');
    check(await page.getByRole('dialog').getByText('No pitch detected').isVisible(), 'Embedded Tuner did not initialize');
    await page.screenshot({ path: join(out, 'P02-tuner-overlay-' + width + 'x' + height + '.png') });
    await page.evaluate(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (...args) => {
        const stream = await original(...args);
        window.__overlayMicStream = stream;
        return stream;
      };
    });
    await page.getByRole('dialog').getByRole('button', { name: 'Enable microphone' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Stop microphone' }).waitFor();
    await page.waitForTimeout(1200);
    const duringTuner = seconds(await clock.textContent());
    check(duringTuner > beforeTuner, 'Tuner overlay paused or reset practice timer');
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();
    check(await page.getByRole('dialog').count() === 0, 'Tuner modal did not close');
    check(await page.evaluate(() => [...window.__overlayMicStream.getTracks()].every(track => track.readyState === 'ended')),
      'Microphone stream not released on overlay dismissal');
    check(new URL(page.url()).pathname === '/player', 'Tuner close did not return to Player');
    check(await page.getByRole('button', { name: 'Pause practice timer' }).isVisible(), 'Tuner close paused timer');
    const afterTuner = seconds(await clock.textContent());
    check(afterTuner >= duringTuner, 'Timer lost time after Tuner close');

    // Metronome audio is active only within the overlay; practice timer continues.
    await page.evaluate(() => {
      window.__overlayClickCount = 0;
      const oldStart = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (...args) {
        window.__overlayClickCount++;
        return oldStart.apply(this, args);
      };
    });
    await page.locator('.practice-utility-row').getByRole('button', { name: /Metronome/ }).click();
    await page.getByRole('dialog', { name: 'Metronome within practice' }).waitFor();
    await page.screenshot({ path: join(out, 'P02-metronome-overlay-' + width + 'x' + height + '.png') });
    check(new URL(page.url()).pathname === '/player', 'Metronome changed the Player route');
    await page.getByRole('dialog').getByRole('button', { name: 'Increase tempo by 1 BPM' }).click();
    check(await page.locator('.metronome-bpm strong').innerText() === '101', 'Embedded metronome BPM control failed');
    await page.getByRole('dialog').getByRole('button', { name: 'Start metronome' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Pause metronome' }).waitFor();
    await page.waitForTimeout(700);
    check((await page.evaluate(() => window.__overlayClickCount)) >= 2, 'Embedded metronome did not schedule audio');
    const duringMetronome = seconds(await clock.textContent());
    check(duringMetronome > duringTuner, 'Metronome overlay paused or reset session');
    await page.keyboard.press('Escape');
    check(await page.getByRole('dialog').count() === 0, 'Escape did not dismiss metronome');
    const stopped = await page.evaluate(() => window.__overlayClickCount);
    await page.waitForTimeout(400);
    check((await page.evaluate(() => window.__overlayClickCount)) === stopped, 'Metronome clicks continued after overlay dismissal');
    check(await page.getByRole('button', { name: 'Pause practice timer' }).isVisible(), 'Timer did not resume as active after tool');
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    const paused = seconds(await clock.textContent());
    await page.locator('.practice-utility-row').getByRole('button', { name: /Tuner/ }).click();
    await page.waitForTimeout(750);
    check(seconds(await clock.textContent()) === paused, 'Opening Tuner resumed an intentionally paused session');
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();
    check(await page.getByRole('button', { name: 'Resume practice timer' }).isVisible(), 'Paused state was lost');
    await page.screenshot({ path: join(out, 'P02-paused-chart-' + width + 'x' + height + '.png') });

    // Approved UI has the same five working tool tiles in Guided Practice.
    await page.goto(base + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await page.waitForURL(url => url.pathname === '/player');
    await page.getByText('Guided Practice', { exact: true }).waitFor();
    check(await page.locator('.practice-utility-row').count() === 1, 'Guided mode missing approved tools');
    check(await page.locator('.practice-utility-row button').count() === 5, 'Guided must display five approved tools');
    await page.locator('.practice-utility-row').getByRole('button', { name: 'Tempo/Key' }).click();
    await page.getByRole('dialog', { name: 'Tempo and key settings' }).waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Close settings and return to session' }).click();
    await page.locator('.practice-utility-row').getByRole('button', { name: /Tuner/ }).click();
    await page.getByRole('dialog', { name: 'Tuner within practice' }).waitFor();
    check(new URL(page.url()).pathname === '/player', 'Guided Tuner changed route');
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();
    await page.screenshot({ path: join(out, 'P02-guided-chart-' + width + 'x' + height + '.png') });
    await page.getByRole('tab', { name: 'Player' }).click();
    check(await page.locator('.practice-utility-row').count() === 1, 'Guided Player panel missing tools');
    await page.locator('.practice-utility-row').getByRole('button', { name: /Metronome/ }).click();
    await page.getByRole('dialog', { name: 'Metronome within practice' }).waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();
    await page.screenshot({ path: join(out, 'P02-guided-player-' + width + 'x' + height + '.png') });
    await page.getByRole('button', { name: 'Next Step' }).click();
    check(await page.getByText(/Step 2 of/).count() > 0, 'Guided step navigation regressed');

    // Dedicated quick-tool pages remain independent and still navigate back to the hub.
    await page.goto(base + '/tuner', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Back to Practice' }).click();
    await page.waitForURL(url => url.pathname === '/practice');
    await page.goto(base + '/metronome', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Back to Practice' }).click();
    await page.waitForURL(url => url.pathname === '/practice');
    await noOverflow();
    check(errors.length === 0, 'Browser errors: ' + errors.join(' | '));
    console.log('PASS P02 in-session overlays ' + width + 'x' + height + ': free-only, real mic and metronome, session clock persists, audio cleans up, guided tool overlays, dedicated routes intact');
    await ctx.close();
  }
} finally { await browser.close(); }
