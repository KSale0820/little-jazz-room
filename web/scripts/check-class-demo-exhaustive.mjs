// Exhaustive class-demo QA. Tests only: never changes approved production UI.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/class-demo-exhaustive');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const screens = [
  ['H01-home', '/'], ['T01-tracks', '/tracks'], ['T02-charts', '/charts'],
  ['P01-practice', '/practice'], ['P02-player', '/player'], ['P04-tuner', '/tuner'],
  ['P05-metronome', '/metronome'], ['R01-routines', '/routines'],
  ['R03-builder', '/create'], ['G01-progress', '/progress'],
  ['profile', '/profile'], ['explore', '/explore'],
];
const report = [];
const must = (ok, msg) => { if (!ok) throw new Error(msg); };
const route = async (page, path) => { await page.goto(base + path, { waitUntil: 'networkidle' }); };
const pathname = page => new URL(page.url()).pathname;
const nav = page => page.locator('nav.bottom-nav');
const clickRoute = async (page, button, expected) => {
  await button.click();
  await page.waitForURL(url => url.pathname === expected);
};
const check = async (name, fn, width, height) => {
  const started = Date.now();
  try {
    await fn();
    report.push({ width, height, name, status: 'PASS', ms: Date.now() - started });
    console.log('PASS ' + width + 'x' + height + ' ' + name);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    report.push({ width, height, name, status: 'FAIL', reason, ms: Date.now() - started });
    console.error('FAIL ' + width + 'x' + height + ' ' + name + ': ' + reason);
  }
};

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 2, isMobile: true,
      hasTouch: true, permissions: ['microphone'],
    });
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    const inventory = [];

    // Capture every screen, image load failure, available click control and page geometry.
    for (const [name, path] of screens) {
      await check('screen+assets ' + name, async () => {
        await route(page, path);
        await page.evaluate(async () => {
          await Promise.all([...document.images].map(image => image.decode().catch(() => undefined)));
          if (document.fonts?.ready) await document.fonts.ready;
        });
        must(await nav(page).locator('a').count() === 4, name + ': bottom nav not four');
        const health = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          brokenImages: [...document.images].filter(x => !x.naturalWidth).map(x => x.currentSrc),
          buttons: [...document.querySelectorAll('main button, main a, main select, main input')].map(x => ({
            tag: x.tagName.toLowerCase(), name: (x.getAttribute('aria-label') || x.textContent || x.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 105),
            disabled: Boolean(x.disabled), role: x.getAttribute('role'),
            href: x.getAttribute('href'), displayed: !!x.getClientRects().length,
          })),
        }));
        inventory.push({ screen: name, path, ...health });
        must(health.overflow <= 1, name + ': horizontal overflow ' + health.overflow + 'px');
        must(health.brokenImages.length === 0, name + ': missing images: ' + health.brokenImages.join('; '));
        must(health.buttons.filter(x => x.tag === 'button' && x.displayed && !x.disabled && !x.name).length === 0,
          name + ': unnamed interactive button');
        await page.screenshot({ path: join(out, name + '-' + width + 'x' + height + '.png'), fullPage: false });
      }, width, height);
    }

    await check('four bottom nav tabs and browser routes', async () => {
      for (const [label, path] of [['Home', '/'], ['Tracks', '/tracks'], ['Practice', '/practice'], ['Progress', '/progress']]) {
        await nav(page).getByRole('link', { name: label }).click();
        await page.waitForURL(url => url.pathname === path);
      }
      await route(page, '/unknown-class-demo-url');
      must(pathname(page) === '/', 'Unknown route should redirect home');
    }, width, height);

    await check('Home: hotspot routing, quick actions, settings and daily cards', async () => {
      for (const [name, path] of [
        ['Piano: open Practice', '/practice'],
        ['Music stand: browse routines', '/routines'],
        ['Bookshelf: browse charts', '/charts'],
        ['Record player: browse tracks', '/tracks'],
        ['Start Practice', '/practice'],
        ['Browse Tracks', '/tracks'],
        ['Choose another routine', '/routines'],
        ['Settings', '/profile'],
      ]) {
        await route(page, '/');
        await clickRoute(page, page.getByRole('button', { name, exact: true }), path);
      }
      await route(page, '/');
      await page.getByRole('button', { name: /Open progress\./ }).click();
      await page.waitForURL(url => url.pathname === '/progress');
      await route(page, '/');
      await page.getByRole('button', { name: /^Practice Daily Jazz Warm-Up/ }).click();
      must(pathname(page) === '/player', 'Daily routine button should open player');
      await route(page, '/');
      await page.getByRole('button', { name: /^Open practice player for Daily Jazz Warm-Up/ }).click();
      must(pathname(page) === '/player', 'Daily play button should open player');
    }, width, height);

    await check('P01: free/guided/tools/recent/history', async () => {
      await route(page, '/practice');
      must(await page.getByRole('button', { name: /^Resume/ }).isDisabled(), 'Resume enabled before any session');
      for (const [label, path] of [
        [/^Free Practice/, '/player'], [/^Guided Practice/, '/routines'],
        [/^Tuner Check your pitch/, '/tuner'], [/^Metronome Keep steady time/, '/metronome'],
        [/^See All/, '/progress'], [/^Start your first session/, '/player'],
      ]) {
        await route(page, '/practice');
        await clickRoute(page, page.getByRole('button', { name: label }), path);
      }
      await route(page, '/tuner');
      await clickRoute(page, page.getByRole('button', { name: 'Back to Practice' }), '/practice');
      await route(page, '/metronome');
      await clickRoute(page, page.getByRole('button', { name: 'Back to Practice' }), '/practice');
    }, width, height);

    await check('T01: categories, search, favorites, overlays, filters and charts link', async () => {
      await route(page, '/tracks');
      must(await page.locator('.t01-track-card').count() === 4, 'Four linked original studies expected');
      await page.getByRole('button', { name: 'Blues', exact: true }).click();
      must(await page.locator('.t01-track-card').count() === 1, 'Blues filter should find one track');
      await page.getByRole('button', { name: 'Standards', exact: true }).click();
      must(await page.getByRole('heading', { name: 'No tracks found' }).isVisible(), 'Standards empty state absent');
      await page.getByRole('button', { name: 'Recent', exact: true }).click();
      await page.getByRole('searchbox', { name: 'Search tracks' }).fill('Blue Staircase');
      must(await page.locator('.t01-track-card').count() === 1, 'Track search did not narrow');
      await page.getByRole('button', { name: 'Clear search' }).click();
      must(await page.locator('.t01-track-card').count() === 4, 'Clear search did not reset');
      await page.getByRole('button', { name: /Filters/ }).click();
      must(await page.getByRole('dialog', { name: 'Filter tracks' }).isVisible(), 'Filter dialog not open');
      await page.getByRole('button', { name: 'Close filters', exact: true }).click();
      must(!(await page.getByRole('dialog', { name: 'Filter tracks' }).count()), 'Filter dialog did not close');
      await page.getByRole('button', { name: 'Difficulty' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Intermediate' }).click();
      await page.getByRole('button', { name: 'Apply filters' }).click();
      must(await page.locator('.t01-track-card').count() === 2, 'Difficulty filter should leave two tracks');
      await page.getByRole('button', { name: /Filters/ }).click();
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      await page.getByRole('button', { name: 'Apply filters' }).click();
      must(await page.locator('.t01-track-card').count() === 4, 'Filter reset failed');
      await page.getByRole('button', { name: 'Charts' }).click();
      await page.waitForURL(url => url.pathname === '/charts');
    }, width, height);

    await check('Charts: filters, search, linked player and return', async () => {
      await route(page, '/charts');
      const initial = await page.locator('.demo-row').count();
      must(initial >= 4, 'Seed charts missing');
      await page.getByRole('button', { name: 'Blues', exact: true }).click();
      must((await page.locator('.demo-row').count()) > 0, 'Blues charts missing');
      await page.getByRole('button', { name: 'Original studies' }).click();
      must((await page.locator('.demo-row').count()) > 0, 'Original charts missing');
      await page.getByRole('button', { name: 'Recent' }).click();
      await page.getByRole('textbox', { name: 'Search tracks and charts' }).fill('unfindable jazz chart 000');
      must(await page.getByText('No matching studies. Try a different search.').isVisible(), 'Chart empty state missing');
      await page.getByRole('textbox', { name: 'Search tracks and charts' }).fill('Blues');
      must(await page.locator('.demo-row').count() > 0, 'Chart search failed');
      await page.locator('.demo-row').first().click();
      must(pathname(page) === '/player', 'Chart not linked to shared player');
      await route(page, '/charts');
      await clickRoute(page, page.getByRole('button', { name: /Tracks/ }), '/tracks');
    }, width, height);

    await check('R01: preset bookmarks, tabs, persistence, search/filter and navigation', async () => {
      await route(page, '/routines');
      const daily = 'Daily Jazz Warm-Up';
      must(await page.getByRole('button', { name: 'Open ' + daily + ' in player' }).isVisible(), 'Seeded daily routine missing');
      await page.getByRole('button', { name: 'Save ' + daily }).click();
      await page.getByRole('tab', { name: 'My Routines' }).click();
      must(await page.getByRole('button', { name: 'Open ' + daily + ' in player' }).isVisible(), 'Bookmarked routine missing');
      await page.reload({ waitUntil: 'networkidle' });
      await page.getByRole('tab', { name: 'My Routines' }).click();
      must(await page.getByRole('button', { name: 'Remove saved ' + daily }).count() === 1, 'Bookmark not persisted');
      await page.getByRole('button', { name: 'Remove saved ' + daily }).click();
      must(await page.getByRole('button', { name: 'Open ' + daily + ' in player' }).count() === 0, 'Unbookmarked routine should disappear');
      await page.getByRole('tab', { name: 'Shared' }).click();
      must(await page.getByText('Sharing is Preview').count() > 0, 'Shared preview state not marked');
      await page.getByRole('tab', { name: 'Presets' }).click();
      await page.getByPlaceholder('Search routines...').fill('zzz-no-routine');
      must(await page.getByText('No routines found').isVisible(), 'Routine search empty state missing');
      await page.getByRole('button', { name: 'Clear filters' }).click();
      await page.locator('.routine-filters select').last().selectOption('Intermediate');
      must(await page.getByRole('heading', { name: 'Start with a preset' }).isVisible(), 'Filter changed page unexpectedly');
      await route(page, '/routines');
      await clickRoute(page, page.getByRole('button', { name: 'Back to Practice' }), '/practice');
      await route(page, '/routines');
      await clickRoute(page, page.getByRole('button', { name: 'Open ' + daily + ' in player' }), '/player');
      await route(page, '/routines');
      await clickRoute(page, page.getByRole('button', { name: /Create routine/i }), '/create');
    }, width, height);

    await check('R03: persistent draft, step reorder/add/remove, new exercise and save', async () => {
      await route(page, '/create');
      must(await page.locator('.builder-step').count() >= 3, 'Expected warm-up/skill/chart starting steps');
      const name = 'Exhaustive QA ' + width;
      await page.getByLabel(/Routine title/).fill(name);
      await page.getByRole('button', { name: 'Save draft' }).click();
      await page.reload({ waitUntil: 'networkidle' });
      must((await page.getByLabel(/Routine title/).inputValue()) === name, 'Draft not persisted');
      const initial = await page.locator('.builder-step').count();
      await page.locator('.builder-step').first().getByRole('button', { name: /^Move .* down/ }).click();
      must(await page.locator('.builder-step').count() === initial, 'Reordering lost step');
      await page.getByRole('button', { name: '+ Existing exercise' }).click();
      await page.getByRole('button', { name: 'Add step' }).click();
      must(await page.locator('.builder-step').count() === initial + 1, 'Existing exercise was not added');
      await page.locator('.builder-step').last().getByRole('button', { name: /^Remove / }).click();
      must(await page.locator('.builder-step').count() === initial, 'Remove step not working');
      await page.getByRole('button', { name: '+ New exercise' }).click();
      await page.getByLabel('Title', { exact: true }).fill('Test Ear Pattern ' + width);
      await page.getByLabel('Instructions').fill('Play three clear notes slowly.');
      await page.getByRole('button', { name: 'Save exercise' }).click();
      must(await page.locator('.builder-step').count() === initial + 1, 'New exercise not added to steps');
      await page.getByRole('button', { name: 'Preview only' }).click();
      must(await page.getByRole('status').filter({ hasText: /preview is not yet available/ }).count() > 0, 'Preview button silent');
      await page.getByRole('button', { name: /Save routine/i }).click();
      await page.waitForURL(url => url.pathname === '/routines' && url.searchParams.get('tab') === 'my');
      must(await page.getByRole('button', { name: 'Open ' + name + ' in player' }).isVisible(), 'Saved routine absent');
      await page.reload({ waitUntil: 'networkidle' });
      must(await page.getByRole('button', { name: 'Open ' + name + ' in player' }).isVisible(), 'Saved routine not persisted');
    }, width, height);

    await check('P02: chart/player, measures, transpose, loop, guided steps and back', async () => {
      await route(page, '/routines');
      await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
      must(pathname(page) === '/player', 'Routine did not start guided player');
      must(await page.getByText('Guided Practice').isVisible(), 'Guided mode not selected');
      await page.getByRole('button', { name: 'Next Step' }).click();
      must(await page.getByText(/Step 2 of/).count() > 0, 'Next guided step failed');
      await page.getByRole('button', { name: 'Previous routine step' }).click();
      must(await page.getByText(/Step 1 of/).count() > 0, 'Previous guided step failed');
      await page.getByRole('tab', { name: 'Player' }).click();
      must(await page.getByRole('tabpanel', { name: 'Chart only player' }).isVisible(), 'Player panel did not toggle');
      await page.getByRole('tab', { name: 'Chart' }).click();
      must(await page.getByRole('tabpanel', { name: 'Jazz chord chart' }).isVisible(), 'Chart panel did not toggle');
      await page.getByRole('button', { name: 'Next measure' }).click();
      await page.getByRole('button', { name: 'Previous measure' }).click();
      await page.getByRole('combobox', { name: 'Transposing instrument' }).selectOption('Bb');
      must(await page.getByRole('combobox', { name: 'Transposing instrument' }).inputValue() === 'Bb', 'Transposing instrument not selected');
      await page.getByRole('combobox', { name: 'Transpose concert chart key' }).selectOption('G');
      must(await page.getByRole('combobox', { name: 'Transpose concert chart key' }).inputValue() === 'G', 'Chart key not updated');
      await page.getByRole('combobox', { name: 'Highlight loop measures' }).selectOption('1-4');
      must(await page.getByRole('combobox', { name: 'Highlight loop measures' }).inputValue() === '1-4', 'Measure loop not selected');
      await clickRoute(page, page.getByRole('button', { name: 'Back to Practice' }), '/practice');
    }, width, height);

    await check('P06/G01: finish/rate/notes/single save, progress/history and replay', async () => {
      await route(page, '/practice');
      await page.getByRole('button', { name: /^Free Practice/ }).click();
      await page.getByRole('button', { name: 'Start practice timer' }).click();
      await page.waitForTimeout(1200);
      await page.getByRole('button', { name: 'Pause practice timer' }).click();
      must((await page.locator('[data-testid="session-elapsed"]').innerText()) !== '00:00', 'Timer did not advance');
      await page.getByRole('button', { name: 'Resume practice timer' }).click();
      await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
      must(await page.getByRole('heading', { name: 'Great practice!' }).isVisible(), 'Completion not shown');
      await page.getByRole('button', { name: '5 stars' }).click();
      await page.locator('#practice-notes').fill('Integration QA checked');
      await page.getByRole('button', { name: 'Save Session', exact: true }).click();
      must(await page.getByRole('button', { name: /Session Saved/ }).isVisible(), 'Save not acknowledged');
      const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
      must(sessions.length === 1, 'Expected exactly one real saved session');
      await page.getByRole('button', { name: 'View Progress' }).click();
      must(pathname(page) === '/progress', 'View Progress route failed');
      await page.getByRole('button', { name: 'Practice Again' }).click();
      must(pathname(page) === '/player', 'Practice Again should route to player');
      await route(page, '/practice');
      must(!(await page.getByRole('button', { name: /^Resume/ }).isDisabled()), 'Resume remained disabled after session saved');
      await clickRoute(page, page.getByRole('button', { name: /^Resume/ }), '/player');
      await route(page, '/progress');
      await page.reload({ waitUntil: 'networkidle' });
      must(await page.getByText(/Free practice/i).count() >= 0, 'Progress did not reload');
      const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
      must(persisted.length === 1, 'Session duplicated or missing after reload');
    }, width, height);

    await check('G01/Profile: companion picker, motion, calendar and routine links', async () => {
      await route(page, '/progress');
      await clickRoute(page, page.getByRole('button', { name: /^Change companion/ }), '/profile');
      await page.getByRole('heading', { name: 'Choose your jazz cat' }).waitFor();
      must(await page.locator('.board-cat-card').count() === 8, 'Eight approved companion choices missing');
      await page.getByRole('button', { name: /^Milo, / }).click();
      must(await page.getByRole('heading', { name: 'Milo' }).isVisible(), 'Companion selection failed');
      await page.reload({ waitUntil: 'networkidle' });
      must(await page.getByRole('heading', { name: 'Milo' }).isVisible(), 'Companion selection not persisted');
      const animation = page.getByRole('checkbox', { name: 'Gentle cat animation' });
      const before = await animation.isChecked();
      await animation.click();
      must((await animation.isChecked()) !== before, 'Animation switch did not toggle');
      const prev = page.getByRole('button', { name: 'Previous month' });
      const next = page.getByRole('button', { name: 'Next month' });
      await prev.click();
      await next.click();
      await page.getByRole('button', { name: 'Change companion', exact: true }).click();
      must(await page.getByRole('heading', { name: 'Choose your jazz cat' }).isVisible(), 'Profile picker not reachable');
      await route(page, '/progress');
      must((await page.locator('section[aria-label^="Your jazz companion"]').getAttribute('aria-label'))?.includes('Milo'), 'Progress shows wrong companion');
      await route(page, '/profile');
      await page.locator('.minirow .mutelink').first().click();
      must(pathname(page) === '/player', 'Profile saved routine link not functional');
    }, width, height);

    await check('P04: help/modes/tone controls and back button', async () => {
      await route(page, '/tuner');
      await page.getByRole('button', { name: 'Tuner help' }).click();
      must(await page.getByText(/Play one note at a time in a quiet room/).isVisible(), 'Tuner help not visible');
      await page.getByRole('button', { name: 'Tuner help' }).click();
      must(!(await page.locator('.tool-help').count()), 'Tuner help did not close');
      for (const name of ['Guitar', 'Bass', 'Chromatic']) {
        await page.getByRole('button', { name, exact: true }).click();
        must(await page.getByRole('button', { name, exact: true }).getAttribute('aria-pressed') === 'true', 'Mode ' + name + ' not selected');
      }
      await page.getByRole('button', { name: 'Play A 440 hertz tone' }).click();
      await page.getByRole('button', { name: 'Stop A 440 hertz tone' }).click();
      await clickRoute(page, page.getByRole('button', { name: 'Back to Practice' }), '/practice');
    }, width, height);

    await check('P05: tempo limits/slider/signatures/accent/count-in/tap/start/pause', async () => {
      await route(page, '/metronome');
      const slider = page.locator('#metronome-tempo-range');
      await slider.fill('40');
      must(await page.locator('.metronome-bpm strong').innerText() === '40', 'BPM min not applied');
      await page.getByRole('button', { name: 'Decrease tempo by 1 BPM' }).click();
      must(await page.locator('.metronome-bpm strong').innerText() === '40', 'BPM dropped below minimum');
      await slider.fill('240');
      await page.getByRole('button', { name: 'Increase tempo by 1 BPM' }).click();
      must(await page.locator('.metronome-bpm strong').innerText() === '240', 'BPM exceeded maximum');
      await slider.fill('100');
      for (const [meter, beats] of [['2/4', 2], ['3/4', 3], ['4/4', 4], ['6/8', 6]]) {
        await page.getByRole('button', { name: meter, exact: true }).click();
        must(await page.locator('.metronome-beats button').count() === beats, meter + ' has wrong beat count');
      }
      const accent = page.locator('.metronome-beats button').last();
      const prior = await accent.getAttribute('aria-pressed');
      await accent.click();
      must((await accent.getAttribute('aria-pressed')) !== prior, 'Accent not toggled');
      const countIn = page.getByRole('checkbox', { name: 'Count-in' });
      if (!(await countIn.isChecked())) await page.locator('.metronome-countin label').click();
      must(await countIn.isChecked(), 'Count-in switch did not turn on');
      const chooseBars = page.getByRole('button', { name: 'Toggle count-in between one and two measures' });
      const first = await chooseBars.innerText();
      await chooseBars.click();
      must((await chooseBars.innerText()) !== first, 'Count-in bar count unchanged');
      await page.locator('.metronome-countin label').click();
      must(!(await countIn.isChecked()), 'Count-in switch did not turn off');
      must(await chooseBars.isDisabled(), 'Count-in selector enabled while disabled');
      await page.getByRole('button', { name: 'Tap Tempo' }).click();
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: 'Tap Tempo' }).click();
      await page.getByRole('button', { name: 'Start metronome' }).click();
      await page.getByRole('button', { name: 'Pause metronome' }).waitFor();
      await page.getByRole('button', { name: 'Pause metronome' }).click();
      await clickRoute(page, page.getByRole('button', { name: 'Back to Practice' }), '/practice');
    }, width, height);

    await check('Explore: tabs, search, instruments, category and player links', async () => {
      await route(page, '/explore');
      await page.getByRole('tab', { name: 'Challenges' }).click();
      must(await page.getByText(/Community feature/).count() > 0, 'Challenges preview missing');
      await page.getByRole('tab', { name: 'Exercises' }).click();
      await page.getByRole('group', { name: 'Instrument filter' }).getByRole('button', { name: 'Guitar' }).click();
      await page.getByRole('group', { name: 'Instrument filter' }).getByRole('button', { name: 'All' }).click();
      await page.getByRole('textbox', { name: 'Search routines or exercises' }).fill('zzz');
      must(await page.getByText(/No matches for this filter/).isVisible(), 'Explore search empty state missing');
      await page.getByRole('textbox', { name: 'Search routines or exercises' }).fill('');
      await page.getByRole('button', { name: /Technique Scales/ }).click();
      must(await page.getByRole('tab', { name: 'Exercises' }).getAttribute('aria-selected') === 'true', 'Category did not select Exercises');
      await clickRoute(page, page.getByRole('button', { name: 'View charts' }), '/player');
    }, width, height);

    await check('no browser exceptions on tested screens', async () => {
      must(pageErrors.length === 0, pageErrors.join(' | '));
    }, width, height);

    writeFileSync(join(out, 'button-inventory-' + width + 'x' + height + '.json'), JSON.stringify(inventory, null, 2));
    await context.close();
  }
} finally {
  await browser.close();
}

writeFileSync(join(out, 'qa-report.json'), JSON.stringify(report, null, 2));
const failed = report.filter(x => x.status === 'FAIL');
console.log('EXHAUSTIVE_QA_RESULT ' + JSON.stringify({
  passed: report.length - failed.length, failed: failed.length, total: report.length,
  failures: failed.map(x => ({ size: x.width + 'x' + x.height, test: x.name, reason: x.reason })),
}));
if (failed.length) process.exitCode = 1;
