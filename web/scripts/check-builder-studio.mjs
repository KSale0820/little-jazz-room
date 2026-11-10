// Builder Studio visual regression and functional smoke.
// Runs locally in GitHub Actions. It neither deploys nor changes remote data.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const app = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const output = path.resolve('docs/screenshots/builder-studio-qa');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

const scenarios = [
  { width: 390, height: 844, theme: 'light', meter: '4/4' },
  { width: 390, height: 844, theme: 'dark', meter: '6/8' },
  { width: 375, height: 667, theme: 'light', meter: '3/4' },
  { width: 375, height: 667, theme: 'dark', meter: '6/8' },
];

function localList(prefix) {
  return JSON.parse(localStorage.getItem(Object.keys(localStorage)
    .find(key => key.startsWith(prefix)) ?? '') || '[]');
}

async function checkViewport(page, label) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, label + ' horizontal overflow: ' + overflow);
}

try {
  for (const { width, height, theme, meter } of scenarios) {
    const label = width + 'x' + height + '-' + theme + '-cat-off';
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true,
      deviceScaleFactor: 1, colorScheme: theme, reducedMotion: 'reduce',
    });
    await context.addInitScript((theme) => {
      localStorage.setItem('little-jazz-room:appearance:v1', theme);
      localStorage.setItem('little-jazz-room:decorative-cats:v1', 'false');
    }, theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const shot = async name => {
      await page.evaluate(async () => { await document.fonts?.ready; });
      await checkViewport(page, label + '-' + name);
      await page.screenshot({
        path: path.join(output, label + '-' + name + '.png'),
        fullPage: true, animations: 'disabled',
      });
    };

    const chartName = 'Studio ' + meter + ' ' + label;
    await page.goto(app + '/charts/new', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
    assert.equal(await page.locator('html').getAttribute('data-cat-mode'), 'off');
    await page.getByRole('textbox', { name: 'Chart name' }).fill(chartName);
    if (meter !== '4/4') {
      const [top, bottom] = meter.split('/');
      await page.getByRole('textbox', { name: 'Time signature numerator' }).fill(top);
      await page.getByRole('textbox', { name: 'Time signature denominator' }).fill(bottom);
      await page.getByRole('textbox', { name: 'Chart name' }).click();
    }
    for (const [index, symbol] of ['Dm7', 'G7', 'Cmaj7', 'F7'].entries()) {
      await page.getByRole('textbox', { name: 'Measure ' + (index + 1) + ' chord 1' }).fill(symbol);
    }
    await shot('chart-create');
    assert.equal(await page.locator('.chart-editor-row').first().locator('.chart-editor-measure').count(), 4,
      label + ' chart grid must show four measures per row');
    assert.equal(await page.locator('.builder-studio-title-icon').count(), 0,
      label + ' must not show decorative chart icon in header');
    const chartHeadingDecor = await page.locator('.chart-builder-chart-heading')
      .evaluate(node => ({ before: getComputedStyle(node, '::before').content, after: getComputedStyle(node, '::after').content }));
    assert.ok(['none', 'normal'].includes(chartHeadingDecor.before) && ['none', 'normal'].includes(chartHeadingDecor.after),
      label + ' unexpected note inserted by chart heading container: ' + JSON.stringify(chartHeadingDecor));
    const notationGeometry = await page.locator('.chart-editor-row').first().locator('.chart-editor-measure')
      .first().evaluate(node => {
        const chord = node.querySelector('.chart-editor-chord input');
        return {
          measureHeight: node.getBoundingClientRect().height,
          chordFontPx: Number.parseFloat(getComputedStyle(chord).fontSize),
          chordTargetHeight: chord.getBoundingClientRect().height,
        };
      });
    assert.ok(notationGeometry.measureHeight <= 82, label + ' chord measure still too tall: ' + JSON.stringify(notationGeometry));
    assert.ok(notationGeometry.chordFontPx >= 18, label + ' chord notation too small: ' + JSON.stringify(notationGeometry));
    assert.ok(notationGeometry.chordTargetHeight >= 44, label + ' chord editing target under 44px');
    await page.getByRole('textbox', { name: 'Measure 2 chord 1' }).focus();
    const selectedAppearance = await page.locator('.chart-editor-measure.is-selected').first().evaluate(node => {
      const input = node.querySelector('.chart-editor-chord input.is-selected');
      const cell = getComputedStyle(node);
      const field = getComputedStyle(input);
      return {
        cellShadow: cell.boxShadow,
        chordBackground: field.backgroundColor,
        chordBorder: field.borderTopColor,
        chordShadow: field.boxShadow,
        chordOutline: field.outlineStyle,
      };
    });
    assert.notEqual(selectedAppearance.cellShadow, 'none', label + ' missing primary measure highlight');
    assert.equal(selectedAppearance.chordBackground, 'rgba(0, 0, 0, 0)',
      label + ' selected chord should not have a second background highlight: ' + JSON.stringify(selectedAppearance));
    assert.equal(selectedAppearance.chordBorder, 'rgba(0, 0, 0, 0)',
      label + ' selected chord should not have a second border highlight: ' + JSON.stringify(selectedAppearance));
    assert.equal(selectedAppearance.chordShadow, 'none',
      label + ' selected chord should not have an additional box shadow');
    assert.equal(selectedAppearance.chordOutline, 'none',
      label + ' selected chord should not have an additional outline');
    await page.getByRole('button', { name: 'Add Annotation' }).click();
    await page.getByRole('textbox', { name: 'Red style note for this measure' }).fill('Play lightly');
    await shot('chart-selection');
    const editingControls = await page.locator('.chart-builder-toolbar button').count();
    assert.equal(editingControls, 9, label + ' lost measure editor actions');
    const taps = await page.locator('.chart-builder-toolbar button').evaluateAll(buttons =>
      buttons.every(button => button.getBoundingClientRect().height >= 44));
    assert.ok(taps, label + ' measure toolbar controls below 44px');

    await page.getByRole('button', { name: 'Save Chart' }).click();
    await page.getByRole('heading', { name: 'My Charts', exact: true }).waitFor();
    await shot('chart-library');
    assert.equal(await page.locator('.builder-library-heading-icon').count(), 0,
      label + ' must not show decorative chart icon in library header');
    const libraryDecor = await page.locator('.chart-library-page .chart-builder-header')
      .evaluate(node => getComputedStyle(node, '::after').content);
    assert.ok(['none', 'normal'].includes(libraryDecor),
      label + ' library header still injects a decorative plant: ' + libraryDecor);
    const saved = (await page.evaluate(localList, 'little-jazz-room:charts:v1:'))
      .find(chart => chart.title === chartName);
    assert.ok(saved?.id, label + ' chart not saved');
    assert.deepEqual(saved.time_signature, meter.split('/').map(Number));
    assert.equal(saved.bars[1].annotation, 'Play lightly');
    await page.reload({ waitUntil: 'networkidle' });
    const savedCard = page.locator('.chart-library-card').filter({ hasText: chartName });
    await savedCard.locator('summary', { hasText: '•••' }).click();
    await savedCard.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByRole('heading', { name: 'Edit Chart' }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Chart name' }).inputValue(), chartName);
    await shot('chart-edit-populated');
    await page.getByRole('textbox', { name: 'Measure 1 chord 1' }).fill('Am7');
    await page.getByRole('button', { name: 'Save Chart' }).click();
    const revised = (await page.evaluate(localList, 'little-jazz-room:charts:v1:'))
      .find(chart => chart.title === chartName);
    assert.equal(revised.id, saved.id, label + ' changed chart identity on edit');

    await page.goto(app + '/create', { waitUntil: 'networkidle' });
    const routineDecor = await page.locator('.routine-builder .builder-heading')
      .evaluate(node => getComputedStyle(node, '::after').content);
    assert.ok(['none', 'normal'].includes(routineDecor),
      label + ' Create Routine heading still injects a treble clef: ' + routineDecor);
    await page.getByRole('button', { name: /Create your own exercise/ }).click();
    const exerciseName = 'Studio Exercise ' + label;
    await page.locator('#exTitle').fill(exerciseName);
    await page.locator('#exCat').selectOption('Harmony');
    await page.locator('#exLevel').selectOption('Intermediate');
    await page.locator('#exMin').fill('8');
    await page.locator('#exInst').fill('Play the ii–V–I progression slowly, then repeat in time.');
    await page.locator('#exChartSearch').fill(chartName);
    await page.locator('#exChart').selectOption(saved.id);
    assert.ok((await page.locator('.builder-exercise-linked-card').innerText()).includes(chartName));
    assert.ok((await page.locator('.builder-exercise-preview').innerText()).includes(exerciseName));
    assert.equal(await page.locator('.builder-custom-form .jazz-cat-sprite').count(), 0);
    await shot('exercise-create-linked-selection');
    await page.getByRole('button', { name: 'Save exercise' }).click();
    const exercise = (await page.evaluate(localList, 'little-jazz-room:local-exercises:v1:'))
      .find(item => item.title === exerciseName);
    assert.equal(exercise?.chart_id, saved.id, label + ' exercise lost linked chart');

    // The existing exercise edit route contract uses React Router location.state.
    // Exercise creation occurs inline with the routine builder; no new route is introduced.
    await page.evaluate(id => {
      history.replaceState({ ...history.state, usr: { editExerciseId: id } }, '', '/create');
    }, exercise.id);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Edit exercise' }).waitFor();
    assert.equal(await page.locator('#exTitle').inputValue(), exerciseName);
    await shot('exercise-edit-populated');
    assert.deepEqual(errors, [], label + ' uncaught browser errors');
    console.log('PASS ' + label + ': ' + meter + ' chart create/edit, chart selection, exercise create/edit');
    await context.close();
  }
} finally {
  await browser.close();
}
