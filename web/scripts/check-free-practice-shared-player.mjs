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
    const checkChartlessTools = async selector => {
      const geometry = await page.locator(selector).evaluate(row => {
        const cells = [...row.children].map(el => el.getBoundingClientRect());
        const parent = row.getBoundingClientRect();
        return { widths: cells.map(rect => rect.width), rowWidth: parent.width,
          topDiff: Math.abs(cells[0].top - cells[1].top) };
      });
      check(geometry.widths.length === 2, 'Chartless tools must show only Metronome and Tuner');
      check(geometry.topDiff <= 1, 'Chartless tools must share the same row');
      check(geometry.widths.every(w => w >= geometry.rowWidth * .43),
        'Tuner must expand to fill its half of the row');
    };
    const checkPickerTabs = async () => {
      const geometry = await page.locator('.fp-picker-tabs').evaluate(el => {
        const outer = el.getBoundingClientRect();
        return [...el.querySelectorAll('button')].map(button => {
          const rect = button.getBoundingClientRect();
          return {
            top: rect.top - outer.top, bottom: outer.bottom - rect.bottom,
            height: rect.height,
            overflow: button.scrollHeight - button.clientHeight,
            label: button.textContent?.trim(),
          };
        });
      });
      check(geometry.length === 2, 'Add dialog needs both content tabs');
      check(geometry.every(tab => tab.height >= 40 && tab.top >= -1 && tab.bottom >= -1 && tab.overflow <= 1),
        'Chart/Track and Routine tabs are clipped or collapsed: ' + JSON.stringify(geometry));
    };
    const checkFooter = async name => {
      const footer = page.locator('.fp-session-footer');
      check(await footer.count() === 1, name + ': missing single session footer');
      const geometry = await footer.evaluate(element => {
        const cells = [...element.children].map(child => child.getBoundingClientRect());
        return {
          count: cells.length,
          minY: Math.min(...cells.map(rect => rect.top)),
          maxY: Math.max(...cells.map(rect => rect.top)),
          width: element.clientWidth,
          scrollWidth: element.scrollWidth,
          bottom: element.getBoundingClientRect().bottom,
        };
      });
      check(geometry.count === 6, name + ': expected timer, play/pause, previous, next, finish, journal');
      check(geometry.maxY - geometry.minY <= 2, name + ': session controls wrapped onto multiple lines');
      check(geometry.scrollWidth <= geometry.width + 1, name + ': footer overflows its width');
      check(await footer.getByRole('button').count() === 5, name + ': missing footer action');
    };

    await page.goto(base + '/free-practice', { waitUntil: 'networkidle' });
    await page.locator('.fp-redesign').waitFor();
    check(await page.locator('.practice-transport').count() === 0,
      'Empty Free Practice must hide playback, BPM, key, instrument and loop');
    check(await page.getByRole('button', { name: /Mixer/ }).count() === 0,
      'Empty Free Practice must hide Mixer');
    check(await page.locator('.fp-redesign img').count() === 0, 'No decorative images in empty state');
    check(await page.getByRole('button', { name: /Tuner/ }).isVisible(), 'Tuner missing in empty state');
    check(await page.getByRole('button', { name: /Metronome/ }).isVisible(), 'Metronome missing in empty state');
    check(await page.locator('.fp-simple-tools .practice-tool-glyph').count() === 2,
      'Empty-state Metronome and Tuner must use the approved player icon components');
    await checkChartlessTools('.fp-simple-tools');
    await page.locator('.fp-simple-tools .practice-demo-tool-main').click();
    const emptyMetronome = page.getByRole('dialog', { name: 'Metronome settings' });
    await emptyMetronome.waitFor();
    check(await emptyMetronome.getByRole('group', { name: 'Metronome time signature' }).isVisible(),
      'Without a chart, time signature must be selectable');
    check(await emptyMetronome.getByText(/Running independently/).count() === 0,
      'Chartless metronome should not display playback synchronization blurb');
    await emptyMetronome.getByRole('button', { name: '3/4' }).click();
    check(await emptyMetronome.getByRole('button', { name: '3/4' }).getAttribute('aria-pressed') === 'true',
      'Standalone Free Practice time signature cannot change');
    await screenshot('01a-empty-metronome');
    await emptyMetronome.getByRole('button', { name: 'Close Metronome settings' }).click();
    await page.waitForTimeout(1250);
    check((await elapsed()) === '00:00', 'Free Practice timer must NOT start automatically');
    check(await page.getByRole('button', { name: 'Start practice timer' }).count() >= 1,
      'Empty state requires a separate Start practice timer row');
    await checkFooter('empty');
    await screenshot('01-empty');

    await page.locator('.fp-start-timer').click();
    await page.waitForTimeout(1250);
    check((await elapsed()) !== '00:00', 'Start practice timer action did not begin counting');
    await page.locator('.fp-session-footer').getByRole('button', { name: 'Pause practice timer' }).click();
    const pausedTime = await elapsed();
    await page.waitForTimeout(1200);
    check((await elapsed()) === pausedTime, 'Paused session timer kept counting');
    await page.locator('.fp-session-footer').getByRole('button', { name: 'Resume practice timer' }).click();
    await screenshot('01b-empty-timer-running');

    await page.getByRole('button', { name: /Chart \/ Track/ }).click();
    await page.getByRole('dialog', { name: 'Add to Session' }).waitFor();
    await checkPickerTabs();
    await screenshot('01d-picker');
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
    await checkFooter('recording');
    await page.locator('.practice-free-session .practice-demo-tool-main').click();
    const recordedMetronome = page.getByRole('dialog', { name: 'Metronome settings' });
    await recordedMetronome.waitFor();
    check(await recordedMetronome.getByRole('group', { name: 'Metronome time signature' }).count() === 0,
      'Recorded charts should continue using the chart time signature');
    check(await recordedMetronome.getByText('from the chart').count() === 1,
      'Recorded charts should display their meter source');
    await recordedMetronome.getByRole('button', { name: 'Close Metronome settings' }).click();
    await screenshot('02-recording');

    await page.getByRole('button', { name: /\+ Add/ }).click();
    await checkPickerTabs();
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
    await checkChartlessTools('.practice-free-session.practice-no-chart .practice-demo-tools');
    await page.locator('.practice-free-session .practice-demo-tool-main').click();
    const routineMetronome = page.getByRole('dialog', { name: 'Metronome settings' });
    await routineMetronome.waitFor();
    check(await routineMetronome.getByRole('group', { name: 'Metronome time signature' }).isVisible(),
      'Routine without a chart must allow time signature selection');
    check(await routineMetronome.getByText('from the chart').count() === 0,
      'Routine without a chart should not claim a chart meter');
    check(await routineMetronome.getByText(/Running independently/).count() === 0,
      'Routine without a chart must omit playback synchronization blurb');
    await routineMetronome.getByRole('button', { name: '6/8' }).click();
    check(await routineMetronome.getByRole('button', { name: '6/8' }).getAttribute('aria-pressed') === 'true',
      'Routine-only time signature cannot change');
    await screenshot('03a-routine-metronome');
    await routineMetronome.getByRole('button', { name: 'Close Metronome settings' }).click();
    await checkFooter('routine');
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
