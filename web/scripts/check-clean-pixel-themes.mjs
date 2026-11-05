// Capture both palettes and Cat Mode states at the two approved phone widths.
// Does not change production content, record sessions, or require a cloud account.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const output = path.resolve('docs/screenshots/clean-pixel-qa');
await mkdir(output, { recursive: true });

const routes = [
  ['Practice', '/practice', '.p01-page'],
  ['Player', '/player?mode=free', '.practice-player'],
  ['Tracks', '/tracks', '.t01-page'],
  ['Routines', '/routines', '.routine-library'],
  ['Progress', '/progress', '.g01-page'],
  ['Profile', '/profile', '.profile-page'],
  ['Tuner', '/tuner', '.tool-tuner'],
  ['Metronome', '/metronome', '.tool-metronome'],
];
function contrastRatio(a, b) {
  const parse = value => {
    // Chromium serializes color-mix() as CSS Color 4 color(srgb ...).
    // Those channels are already normalized, unlike legacy rgb(0..255).
    const isNormalized = value.startsWith('color(srgb ');
    const values = value.match(/-?(?:\d*\.)?\d+/g)?.slice(0, 3).map(Number);
    assert.equal(values?.length, 3, 'Unparseable CSS color: ' + value);
    return values.map(channel => {
      const normalized = isNormalized ? channel : channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
  };
  const luminance = value => {
    const c = parse(value);
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const aa = luminance(a);
  const bb = luminance(b);
  return (Math.max(aa, bb) + 0.05) / (Math.min(aa, bb) + 0.05);
}

const report = [];
const catLayoutFootprints = new Map();
const progressSpriteSources = new Map();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

function assertWithinViewport(state, label, height) {
  assert.ok(state.overflow <= 1, label + ' horizontal overflow: ' + state.overflow);
  assert.equal(state.navCount, 4, label + ' must keep four navigation tabs');
  assert.ok(state.navTop >= 0 && state.navBottom <= height + 1,
    label + ' bottom navigation clips viewport: ' + JSON.stringify(state));
}

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const theme of ['light', 'dark']) {
      for (const catMode of [false, true]) {
        const label = width + 'x' + height + '-' + theme + '-cat-' + (catMode ? 'on' : 'off');
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: 1,
          isMobile: true,
          hasTouch: true,
          reducedMotion: 'reduce',
          colorScheme: theme,
        });
        // Runs before the inline HTML bootstrap so screenshots test the first paint.
        await context.addInitScript(({ theme, catMode }) => {
          localStorage.setItem('little-jazz-room:appearance:v1', theme);
          localStorage.setItem('little-jazz-room:decorative-cats:v1', String(catMode));
        }, { theme, catMode });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        for (const [screen, url, selector] of routes) {
          await page.goto(base + url, { waitUntil: 'networkidle' });
          await page.locator(selector).first().waitFor({ state: 'visible' });
          await page.evaluate(async () => {
            await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
            await document.fonts?.ready;
          });
          const state = await page.evaluate(() => {
            const nav = document.querySelector('nav.bottom-nav');
            const rect = nav?.getBoundingClientRect();
            return {
              theme: document.documentElement.dataset.theme,
              catMode: document.documentElement.dataset.catMode,
              overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
              navCount: nav?.querySelectorAll('a').length ?? 0,
              navTop: rect?.top ?? -1,
              navBottom: rect?.bottom ?? -1,
              catVisibility: (() => {
                const cat = document.querySelector('.g01-cat, .tool-scene-cat');
                return cat ? getComputedStyle(cat).visibility : null;
              })(),
              catFootprint: (() => {
                const cat = document.querySelector('.g01-cat, .tool-scene-cat');
                if (!cat) return null;
                const { x, y, width, height } = cat.getBoundingClientRect();
                return [x, y, width, height].map(value => Math.round(value * 10) / 10);
              })(),
              profileAvatarVisibility: (() => {
                const avatar = document.querySelector('.profile-companion-art .jazz-cat-sprite');
                return avatar ? getComputedStyle(avatar).visibility : null;
              })(),
              chartCells: document.querySelectorAll('.chord-grid .measure').length,
              progressCatSrc: document.querySelector('.g01-cat')?.getAttribute('src') ?? null,
              screenBackground: (() => {
                const root = document.querySelector('.p01-page, .g01-page');
                return root ? getComputedStyle(root).backgroundColor : null;
              })(),
              chartPaperBackground: (() => {
                const measure = document.querySelector('.practice-chart-scroll .measure:not(.chosen):not(.looped)');
                return measure ? getComputedStyle(measure).backgroundColor : null;
              })(),
              tunerReferenceBackground: (() => {
                const reference = document.querySelector('.tuner-reference');
                return reference ? getComputedStyle(reference).backgroundColor : null;
              })(),
              tunerReferenceInk: (() => {
                const label = document.querySelector('.tuner-reference strong');
                return label ? getComputedStyle(label).color : null;
              })(),
            };
          });
          assert.equal(state.theme, theme, screen + ' wrong palette');
          assert.equal(state.catMode, catMode ? 'on' : 'off', screen + ' wrong Cat Mode');
          assertWithinViewport(state, label + '-' + screen, height);
          if (['Progress', 'Tuner', 'Metronome'].includes(screen)) {
            assert.equal(state.catVisibility, screen === 'Progress' || catMode ? 'visible' : 'hidden',
              screen + ' selected companion visibility violates Cat Mode rules');
            if (screen === 'Progress') {
              assert.ok(state.progressCatSrc, 'Progress companion must load in both modes');
              const spriteKey = [width, height, theme].join('-');
              if (!catMode) {
                assert.ok(state.progressCatSrc.includes('/visuals/cats/sleeping/'),
                  'Cat Mode OFF should use approved standard sleeping art');
                progressSpriteSources.set(spriteKey, state.progressCatSrc);
              } else {
                assert.notEqual(state.progressCatSrc, progressSpriteSources.get(spriteKey),
                  'Cat Mode ON must switch the default Luna companion to its verified pixel sprite');
                assert.ok(state.progressCatSrc.includes('/visuals/cats/clean-pixel/luna-sleeping.png'),
                  'Cat Mode ON must use Luna pixel sleeping variant in the known default fixture');
              }
            }
            assert.ok(state.catFootprint && state.catFootprint[2] > 0 && state.catFootprint[3] > 0,
              screen + ' cat footprint is missing');
            const footprintKey = [width, height, theme, screen].join('-');
            if (!catMode) catLayoutFootprints.set(footprintKey, state.catFootprint);
            else assert.deepEqual(state.catFootprint, catLayoutFootprints.get(footprintKey),
              screen + ' must not shift or resize its cat placement when Cat Mode changes');
          }
          if (screen === 'Profile') {
            assert.equal(state.profileAvatarVisibility, 'visible',
              'Profile companion avatar must remain visible independently of Cat Mode');
          }
          const expectedBackground = theme === 'dark' ? 'rgb(27, 23, 39)' : 'rgb(255, 248, 236)';
          if (['Practice', 'Progress'].includes(screen)) {
            assert.equal(state.screenBackground, expectedBackground,
              screen + ' retains the old room/ivory background instead of the active theme');
          }
          if (screen === 'Player') {
            assert.ok(state.chartCells >= 12, 'Free Practice chart missing complete 12-bar grid');
            assert.equal(state.chartPaperBackground,
              theme === 'dark' ? 'rgb(33, 26, 47)' : 'rgb(255, 254, 250)',
              'Player notation surface must match the active chart-paper palette');
          }
          if (screen === 'Tuner') {
            assert.ok(state.tunerReferenceBackground && state.tunerReferenceInk,
              'Tuner reference card / text missing');
            assert.ok(contrastRatio(state.tunerReferenceInk, state.tunerReferenceBackground) >= 4.5,
              'Tuner reference pitch lacks 4.5:1 contrast: ' +
              JSON.stringify({ theme, ink: state.tunerReferenceInk, fill: state.tunerReferenceBackground }));
            // Light/Dark permit subtle pixel-art tinted surfaces, not a forced exact color.
            const cardContrastToWhite = contrastRatio('rgb(255, 255, 255)', state.tunerReferenceBackground);
            if (theme === 'dark') assert.ok(cardContrastToWhite >= 7,
              'Dark Tuner reverted to a pale reference card');
            else assert.ok(cardContrastToWhite <= 1.6,
              'Light Tuner reference card is unexpectedly dark');
          }
          if (screen === 'Player') {
            // Read actual rendered chords under synthetic selection states, not just root variables.
            // Preserve the original classes immediately; no app data or playback changes.
            const notation = await page.evaluate(() => {
              const measure = document.querySelector('.practice-chart-scroll .measure');
              if (!measure) return null;
              const original = measure.className;
              const read = className => {
                measure.classList.remove('chosen', 'looped', 'playhead');
                if (className) measure.classList.add(...className.split(' '));
                const chord = measure.querySelector('.chords span, .chords') ?? measure;
                const measureStyle = getComputedStyle(measure);
                return {
                  fill: measureStyle.backgroundColor,
                  ink: getComputedStyle(chord).color,
                  outline: measureStyle.outline,
                  shadow: measureStyle.boxShadow,
                };
              };
              const states = {
                normal: read(''),
                selected: read('chosen'),
                loop: read('looped'),
                playhead: read('playhead'),
                both: read('chosen playhead'),
              };
              measure.className = original;
              return states;
            });
            assert.ok(notation, 'Player chart measure missing');
            assert.ok(contrastRatio(notation.normal.ink, notation.normal.fill) >= 4.5,
              'Normal chord notation below 4.5:1 in ' + label);
            assert.ok(contrastRatio(notation.selected.ink, notation.selected.fill) >= 4.5,
              'Selected chord below 4.5:1 in ' + label + ': ' + JSON.stringify(notation.selected));
            assert.notEqual(notation.selected.fill, notation.loop.fill,
              'Selected measure and loop range must have different fills in ' + label);
            assert.notEqual(notation.selected.shadow + notation.selected.outline,
              notation.both.shadow + notation.both.outline,
              'Active selected measure needs a separate visible playhead indicator in ' + label);
          }

          if (['Practice', 'Player', 'Progress', 'Profile', 'Tuner', 'Metronome'].includes(screen)) {
            await page.screenshot({
              path: path.join(output, screen.toLowerCase() + '-' + label + '.png'),
              animations: 'disabled',
            });
          }
          report.push({ screen, label, ...state, status: 'PASS' });
        }
        assert.deepEqual(errors, [], label + ' browser runtime exceptions');
        await context.close();
      }
    }
  }

  // Exercise actual controls (not direct localStorage writes) and confirm reload.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, colorScheme: 'dark',
    isMobile: true, hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(base + '/profile', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark',
    'First use should honor dark system preference');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'off',
    'First use should disable decorative cats');
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await page.getByRole('checkbox', { name: /Cat Mode/ }).check();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light',
    'Explicit Light preference must survive reload');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'on',
    'Cat Mode preference must survive reload');
  assert.equal(await page.getByRole('button', { name: 'Light', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await page.getByRole('checkbox', { name: /Cat Mode/ }).uncheck();
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'off');
  await context.close();
  report.push({ screen: 'Settings persistence', label: '390x844', status: 'PASS' });
} finally {
  await browser.close();
}
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
console.log('PASS clean-pixel theme matrix, mobile geometry, chart rendering and preference persistence.');
