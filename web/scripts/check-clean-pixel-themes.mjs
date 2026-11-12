// Capture both palettes and Cat Mode states at the two approved phone widths.
// Does not change production content, record sessions, or require a cloud account.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const output = path.resolve('docs/screenshots/clean-pixel-qa');
const approvedCatPrefix = '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/';
await mkdir(output, { recursive: true });

const routes = [
  ['Practice', '/practice', '.p01-page'],
  ['Free Practice', '/free-practice', '.fp-page'],
  ['Player', '/player?chart=blues-f-12', '.practice-player'],
  ['Tracks', '/tracks', '.t01-page'],
  ['Routines', '/routines', '.routine-library'],
  ['Progress', '/progress', '.pgr-page'],
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
                const cat = document.querySelector('.pgr-cat, .tool-scene-cat');
                return cat ? getComputedStyle(cat).visibility : null;
              })(),
              catFootprint: (() => {
                const cat = document.querySelector('.pgr-cat, .tool-scene-cat');
                if (!cat) return null;
                const { x, y, width, height } = cat.getBoundingClientRect();
                return [x, y, width, height].map(value => Math.round(value * 10) / 10);
              })(),
              profileAvatarVisibility: (() => {
                const avatar = document.querySelector('.profile-companion-art .jazz-cat-sprite');
                return avatar ? getComputedStyle(avatar).visibility : null;
              })(),
              chartCells: document.querySelectorAll('.chord-grid .measure').length,
              progressCatSrc: document.querySelector('.pgr-cat')?.getAttribute('src') ?? null,
              profileAvatarSrc: document.querySelector('.profile-companion-art .jazz-cat-sprite')?.getAttribute('src') ?? null,
              profileChooserIds: [...document.querySelectorAll('.board-cat-card')].map(button =>
                button.getAttribute('aria-label')?.split(',')[0] ?? ''),
              visibleCompanionAssetSources: [...document.querySelectorAll('img.jazz-cat-sprite, img.board-cat-art')].map(
                img => img.getAttribute('src') ?? ''),

              screenBackground: (() => {
                const root = document.querySelector('.p01-page, .pgr-page');
                return root ? getComputedStyle(root).backgroundColor : null;
              })(),
              practiceSurface: (() => {
                const root = document.querySelector('.p01-page.p01-suave');
                return root ? getComputedStyle(root).backgroundImage : null;
              })(),
              practiceHeadingInk: (() => {
                const heading = document.querySelector('.p01-suave-header h1');
                return heading ? getComputedStyle(heading).color : null;
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
          assert.ok(state.visibleCompanionAssetSources.every(src =>
            src.startsWith(approvedCatPrefix)),
            screen + ' revived outdated October companion art: ' +
            JSON.stringify(state.visibleCompanionAssetSources));
          if (['Progress', 'Tuner', 'Metronome'].includes(screen)) {
            assert.equal(state.catVisibility, screen === 'Progress' || catMode ? 'visible' : 'hidden',
              screen + ' selected companion visibility violates Cat Mode rules');
            if (screen === 'Progress') {
              assert.ok(state.progressCatSrc, 'Progress companion must load in both modes');
              const spriteKey = [width, height, theme].join('-');
              if (!catMode) {
                assert.ok(state.progressCatSrc.endsWith(approvedCatPrefix + 'luna-sleeping.png'),
                  'Cat Mode OFF must use the new Luna pixel sleeping design, not retired art');
                progressSpriteSources.set(spriteKey, state.progressCatSrc);
              } else {
                assert.notEqual(state.progressCatSrc, progressSpriteSources.get(spriteKey),
                  'Cat Mode ON must switch the default Luna companion to its verified pixel sprite');
                assert.ok(state.progressCatSrc.endsWith(approvedCatPrefix + 'luna-sitting.png'),
                  'Cat Mode ON must use the new Luna sitting pixel variant');
              }
            }
            assert.ok(state.catFootprint && state.catFootprint[2] > 0 && state.catFootprint[3] > 0,
              screen + ' cat footprint is missing');
            const footprintKey = [width, height, theme, screen].join('-');
            if (!catMode) catLayoutFootprints.set(footprintKey, state.catFootprint);
            else if (screen === 'Progress') {
              const off = catLayoutFootprints.get(footprintKey);
              const on = state.catFootprint;
              // Sleeping art has extra transparent space beneath the paws. The
              // Progress-specific 12px offset seats both poses on piano keys.
              // Preserve the x position and sprite footprint, while accepting
              // that intentional vertical shift. Pixel-level contact is tested
              // separately in check-progress-redesign.mjs.
              assert.ok(off && Math.abs(off[0] - on[0]) <= 1 &&
                Math.abs(off[2] - on[2]) <= 1 && Math.abs(off[3] - on[3]) <= 1 &&
                Math.abs(off[1] - on[1]) <= 16,
                'Progress companion changed geometry beyond pose alignment');
            } else assert.deepEqual(state.catFootprint, catLayoutFootprints.get(footprintKey),
              screen + ' must not shift or resize its cat placement when Cat Mode changes');
          }
          if (screen === 'Profile') {
            assert.equal(state.profileAvatarVisibility, 'visible',
              'Profile companion avatar must remain visible independently of Cat Mode');
            assert.ok(state.profileAvatarSrc.endsWith(approvedCatPrefix + 'luna-sitting.png'),
              'Profile avatar must use the owner-approved new pixel art, regardless of Cat Mode');
            assert.deepEqual(state.profileChooserIds, ['Luna', 'Milo', 'Maple'],
              'Profile must offer only the three currently approved pixel companions');
          }
          const expectedBackground = theme === 'dark' ? 'rgb(16, 17, 19)' : 'rgb(255, 248, 236)';
          if (screen === 'Progress') {
            assert.equal(state.screenBackground, expectedBackground,
              'Progress retains the old room/ivory background instead of the active theme');
          }
          if (screen === 'Practice') {
            assert.ok(state.practiceSurface?.includes('gradient'), 'Practice gradient did not render');
            const backdrop = theme === 'dark' ? 'rgb(32, 29, 41)' : 'rgb(255, 248, 236)';
            assert.ok(state.practiceHeadingInk && contrastRatio(state.practiceHeadingInk, backdrop) >= 4.5,
              'Practice heading lacks contrast against the ' + theme + ' surface');
            if (theme === 'dark') {
              assert.ok(state.practiceSurface.includes('32, 29, 41'),
                'Practice dark mode backdrop was lost');
            }
          }
          if (screen === 'Player') {
            assert.ok(state.chartCells >= 12, 'Chart-linked Player missing complete 12-bar grid');
            assert.equal(state.chartPaperBackground,
              theme === 'dark' ? 'rgb(23, 25, 29)' : 'rgb(255, 254, 250)',
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
            // A previous color filter turned Play into an opaque white disk and
            // made Repeat / skip arrows illegible on Midnight Jazz.
            // Inspect the actual mask, size and contrast at both mobile widths.
            const controls = await page.evaluate(() => {
              const icon = document.querySelector('.practice-timer-button .practice-play-pixel');
              const play = document.querySelector('.practice-timer-button');
              const labelNames = ['Configure loop', 'Repeat playback',
                'Increase reference BPM', 'Decrease reference BPM', 'Raise concert key one semitone',
                'Lower concert key one semitone', 'Metronome', 'Tuner', 'Finish Session'];
              const buttonNames = [...document.querySelectorAll('.practice-player button')]
                .map(el => el.getAttribute('aria-label') || el.textContent?.trim() || '');
              const style = icon && getComputedStyle(icon);
              const playStyle = play && getComputedStyle(play);
              const rect = icon?.getBoundingClientRect();
              return {
                mask: style?.maskImage || style?.webkitMaskImage || '',
                ink: style?.color || '',
                bg: playStyle?.backgroundColor || '',
                width: rect?.width || 0,
                height: rect?.height || 0,
                missing: labelNames.filter(label => !buttonNames.some(name => name.includes(label))),
                missingSelects: ['Transpose concert chart key', 'Transposing instrument'].filter(label =>
                  !document.querySelector(`select[aria-label="${label}"]`)),
              };
            });
            assert.ok(controls.mask.includes('/practice-player/svg/play.svg'),
              'Play must use the transparent pixel silhouette (not the original opaque PNG): ' + label);
            assert.ok(controls.width >= 20 && controls.height >= 20,
              'Play glyph is missing or collapsed in ' + label);
            assert.ok(contrastRatio(controls.ink, controls.bg) >= 3,
              'Play glyph contrast below 3:1 in ' + label + ': ' + JSON.stringify(controls));
            assert.deepEqual(controls.missing, [], 'Practice Player lost visible functional controls in ' + label);
            assert.deepEqual(controls.missingSelects, [], 'Practice Player lost musical settings in ' + label);
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

          if (['Practice', 'Free Practice', 'Player', 'Tracks', 'Progress', 'Profile', 'Tuner', 'Metronome'].includes(screen)) {
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

  // Compare the implemented player against the approved Autumn Leaves reference
  // using the real seeded 35-bar chart, not placeholder/mockup chord data.
  for (const [width, height] of [[390, 844], [375, 667]]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true });
      await context.addInitScript(theme => localStorage.setItem('little-jazz-room:appearance:v1', theme), theme);
      const page = await context.newPage();
      await page.goto(base + '/player?chart=autumn-leaves-gm-video-35', { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: 'Autumn Leaves' }).waitFor();
      assert.equal(await page.locator('.practice-chart-scroll .measure').count(), 35,
        'Autumn Leaves must preserve all 35 real chord measures');
      const boxes = await page.evaluate(() => {
        const box = selector => {
          const element = document.querySelector(selector);
          const rect = element?.getBoundingClientRect();
          return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom } : null;
        };
        return {
          chart: box('.practice-chart-scroll'),
          seek: box('.practice-chart-seek, .practice-recording-seek'),
          transport: box('.practice-control-row'),
          tempo: box('.practice-player-pills'),
          utilities: box('.practice-utility-row'),
          timer: box('.practice-session-row .practice-time-badge'),
          finish: box('.practice-finish-action'),
          nav: box('nav.bottom-nav'),
          navDisplay: (() => { const nav = document.querySelector('nav.bottom-nav'); return nav ? getComputedStyle(nav).display : 'absent'; })(),
          fullChartVisible: (() => {
            const chart = document.querySelector('.practice-chart-scroll');
            const lastMeasure = chart?.querySelector('.chord-grid .measure:last-child');
            if (!chart || !lastMeasure) return false;
            return lastMeasure.getBoundingClientRect().bottom <= chart.getBoundingClientRect().bottom - 1;
          })(),
        };
      });
      // Musical notation remains horizontal and readable at the same measure
      // height. The red section badges always have white text. Tag/End must
      // remain wholly inside their cells, even on short phones.
      const notation = await page.evaluate(() => {
        const chart = document.querySelector('.practice-chart-scroll');
        const measure = chart?.querySelector('.chord-grid .measure');
        const two = chart?.querySelector('.chords.two');
        const chords = two ? [...two.children] : [];
        const first = chords[0]?.getBoundingClientRect();
        const second = chords[1]?.getBoundingClientRect();
        const section = chart?.querySelector('.measure-section-label');
        const labels = [...(chart?.querySelectorAll('.measure-annotation') ?? [])].map(el => {
          const outer = el.closest('.measure')?.getBoundingClientRect();
          const inside = el.getBoundingClientRect();
          return { name: el.textContent, visible: !!outer && inside.top >= outer.top + 2 &&
            inside.bottom <= outer.bottom - 2 };
        });
        const font = el => el ? Number.parseFloat(getComputedStyle(el).fontSize) : 0;
        return {
          measureHeight: measure?.getBoundingClientRect().height ?? 0,
          twoHorizontal: !!first && !!second && Math.abs(first.y - second.y) <= 3 &&
            second.x > first.x + 3,
          sectionInk: section && getComputedStyle(section).color,
          labels,
          fonts: {
            chord: font(measure?.querySelector('.chords:not(.two) span')),
            dual: font(chords[0]),
            skip: font(document.querySelector('.practice-measure-btn span')),
            loop: font(document.querySelector('.practice-loop-control')),
            repeat: font(document.querySelector('.practice-repeat-control span')),
            tool: font(document.querySelector('.practice-utility-row button span')),
            finish: font(document.querySelector('.practice-finish-action')),
          },
        };
      });
      assert.ok(notation.measureHeight <= 48 && notation.measureHeight >= 30,
        'Score measure height must remain compact: ' + JSON.stringify({ theme, width, height, notation }));
      assert.ok(notation.twoHorizontal, 'Two-chord measures must read left-to-right: ' +
        JSON.stringify({ theme, width, height, notation }));
      assert.equal(notation.sectionInk, 'rgb(255, 255, 255)',
        'Section A/B/C/Tag text must be white: ' + JSON.stringify({ theme, width, height, notation }));
      assert.ok(notation.labels.every(x => x.visible),
        'Tag/End/other annotations must fit inside each measure: ' + JSON.stringify({ theme, width, height, notation }));
      assert.ok(notation.fonts.chord >= 14 && notation.fonts.dual >= 11 &&
        notation.fonts.skip >= 12 && notation.fonts.loop >= 14 &&
        notation.fonts.repeat >= 12 && notation.fonts.tool >= 12 &&
        notation.fonts.finish >= 14,
        'Increase type sizes despite compact controls: ' + JSON.stringify({ theme, width, height, notation }));
      assert.ok(boxes.chart && boxes.finish && boxes.nav && boxes.transport && boxes.timer,
        'Missing Practice Player elements: ' + JSON.stringify({ theme, width, height, boxes }));
      assert.ok(boxes.chart.height >= (height >= 800 ? 280 : 145),
        'Chart should receive most spare vertical space: ' + JSON.stringify({ theme, width, height, boxes }));
      if (height >= 800) {
        assert.ok(boxes.fullChartVisible,
          'All 35 measures should fit in tall-phone chart without scrolling: ' +
          JSON.stringify({ theme, width, height, boxes }));
      }
      assert.ok(boxes.transport.y >= boxes.chart.bottom - 1,
        'Transport must follow chart and seek: ' + JSON.stringify({ theme, width, height, boxes }));
      assert.ok(boxes.transport.height <= 49 && boxes.utilities.height <= 48 && boxes.finish.height <= 45,
        'Controls need compact footprints: ' + JSON.stringify({ theme, width, height, boxes }));
      assert.ok(Math.abs(boxes.timer.y - boxes.finish.y) <= 15,
        'Time practiced and compact Finish should share the bottom row: ' + JSON.stringify({ theme, width, height, boxes }));
      assert.equal(boxes.navDisplay, 'none',
        'Bottom navigation must be hidden during player mode: ' + JSON.stringify({ theme, width, height, boxes }));
      if (height >= 800) {
        assert.ok(boxes.finish.bottom <= height + 1,
          'Finish Session must be visible within the full-height player: ' + JSON.stringify({ theme, width, height, boxes }));
      } else {
        await page.locator('.practice-finish-action').scrollIntoViewIfNeeded();
        assert.ok(await page.locator('.practice-finish-action').isVisible(),
          'Finish Session must remain scroll-reachable on shorter screens: ' + JSON.stringify({ theme, width, height, boxes }));
      }
      await page.screenshot({
        path: path.join(output, 'player-autumn-leaves-' + width + 'x' + height + '-' + theme + '.png'),
        animations: 'disabled',
      });
      await context.close();
      report.push({ screen: 'Autumn Leaves Practice Player', label: width + 'x' + height + '-' + theme,
        ...boxes, status: 'PASS' });
    }
  }

  // Unified Profile Settings does not expose theme controls. Its underlying
  // appearance preferences still persist across reload and device changes.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, colorScheme: 'dark',
    isMobile: true, hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(base + '/settings', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'on',
    'Keep the current default decorative Cat Mode behavior');
  assert.equal(await page.getByRole('heading', { name: 'Profile Settings' }).count(), 1);
  await page.evaluate(() => {
    localStorage.setItem('little-jazz-room:appearance:v1', 'light');
    localStorage.setItem('little-jazz-room:decorative-cats:v1', 'false');
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'off');
  await page.evaluate(() => {
    localStorage.setItem('little-jazz-room:appearance:v1', 'dark');
    localStorage.setItem('little-jazz-room:decorative-cats:v1', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'on');
  await context.close();
  report.push({ screen: 'Appearance bootstrap persistence', label: '390x844', status: 'PASS' });
} finally {
  await browser.close();
}
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
console.log('PASS clean-pixel theme matrix, mobile geometry, chart rendering and preference persistence.');
