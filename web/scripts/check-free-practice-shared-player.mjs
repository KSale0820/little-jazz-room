// New Free Practice contract: reuse the exact chart/routine player, not a
// mock player. Run with Vite listening at APP_URL; test both compact phones.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/free-practice-shared-player');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const check = (condition, message) => { if (!condition) throw new Error(message); };

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const screenshot = async name => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(overflow <= 1, name + ': horizontal overflow ' + overflow);
      await page.screenshot({ path: join(out, name + '-' + width + 'x' + height + '.png'),
        animations: 'disabled' });
    };
    const elapsed = () => page.getByTestId('session-elapsed').innerText();

    await page.goto(base + '/free-practice', { waitUntil: 'networkidle' });
    await page.locator('.fp-redesign').waitFor();
    check(await page.locator('.practice-transport').count() === 0,
      'Empty Free Practice must hide playback, BPM, key, instrument and loop');
    check(await page.getByRole('button', { name: /Mixer/ }).count() === 0,
      'Empty Free Practice must hide Mixer');
    check(await page.locator('.fp-redesign img').count() === 0, 'No decorative images in empty state');
    check(await page.getByRole('button', { name: /Tuner/ }).isVisible(), 'Tuner missing in empty state');
    check(await page.getByRole('button', { name: /Metronome/ }).isVisible(), 'Metronome missing in empty state');
    await page.waitForTimeout(1150);
    const initial = await elapsed();
    check(initial !== '00:00', 'Free Practice must track time without playback');
    await screenshot('01-empty');

    await page.getByRole('button', { name: /Chart \/ Track/ }).click();
    await page.getByRole('dialog', { name: 'Add to Session' }).waitFor();
    const autumn = page.locator('.fp-picker-list button').filter({ hasText: 'Autumn Leaves' })
      .filter({ hasText: 'Recording' });
    await autumn.click();
    await page.locator('.practice-free-session').waitFor();
    check(await page.locator('audio').count() === 1, 'Selected recorded track must reuse shared audio element');
    check(await page.locator('.practice-chart-scroll .chord-grid').count() === 1,
      'Selected recording must show shared chord chart');
    check(await page.locator('.practice-transport').count() === 1,
      'Recorded track must show real transport and tempo/key/loop controls');
    check(await page.getByRole('button', { name: /Mixer Preview/ }).isDisabled(),
      'Only chart-based content may expose Mixer (Preview)');
    const beforeAdd = await elapsed();
    check(beforeAdd !== '00:00', 'Queue selection reset the independent session timer');
    await screenshot('02-recording');

    await page.getByRole('button', { name: /\+ Add/ }).click();
    await page.getByRole('tab', { name: 'Routine' }).click();
    await page.locator('.fp-picker-list button').filter({ hasText: 'Daily Jazz Warm-Up' }).click();
    await page.getByRole('heading', { name: 'Daily Jazz Warm-Up' }).waitFor();
    check(await page.locator('.practice-no-chart').count() === 1,
      'Routine step without assigned chart should use instructions-only state');
    check(await page.locator('.practice-transport').count() === 0,
      'Routine without assigned chart must hide playback controls');
    check(await page.getByRole('button', { name: /Mixer/ }).count() === 0,
      'Routine without chart must hide Mixer');
    check(await page.locator('.practice-lesson-scroll').count() === 1,
      'Routine must reuse the actual guided lesson component');
    check(await page.locator('.practice-coach-dock').count() === 0, 'Free Practice must omit companion illustrations');
    await screenshot('03-routine-instructions');

    await page.getByRole('button', { name: 'Previous practice item' }).click();
    await page.getByRole('heading', { name: 'Autumn Leaves' }).waitFor();
    check(await page.locator('.practice-transport').count() === 1,
      'Returning to recording must restore shared player');
    await page.getByRole('button', { name: 'Next practice item' }).click();
    await page.getByRole('heading', { name: 'Daily Jazz Warm-Up' }).waitFor();
    const afterNavigation = await elapsed();
    check(afterNavigation !== '00:00', 'Queue navigation reset session timer');
    await page.getByRole('button', { name: /Finish Session/ }).click();
    await page.getByText('Session saved', { exact: true }).waitFor();
    const state = await page.evaluate(() => ({
      sessions: JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'),
      favorites: JSON.parse(localStorage.getItem('little-jazz-room:track-favorites:v1:local') || '[]'),
      routineBookmarks: JSON.parse(localStorage.getItem('little-jazz-room:routine-bookmarks:v1:anonymous') || '[]'),
    }));
    check(state.sessions.length === 1, 'One queue must create exactly one saved practice session');
    check(state.sessions[0].durationSeconds >= 1, 'Session duration must reflect real practice');
    check(state.favorites.includes('autumn-leaves'), 'Selected track did not save to Tracks & Charts Favorites');
    check(state.routineBookmarks.includes('daily-warm-up'), 'Selected routine did not save to My Routines');
    await screenshot('04-complete');
    await page.getByRole('button', { name: 'View Progress' }).click();
    await page.reload({ waitUntil: 'networkidle' });
    const savedCount = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]').length);
    check(savedCount === 1, 'Reload duplicated or lost completed session');

    check(errors.length === 0, 'Browser errors: ' + errors.join(' | '));
    console.log('PASS Free Practice shared player at ' + width + 'x' + height);
    await context.close();
  }
} finally { await browser.close(); }
