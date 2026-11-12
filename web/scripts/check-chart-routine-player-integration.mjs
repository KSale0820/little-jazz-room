// Cross-feature acceptance: actual Chart → Player → Progress and Chart → Exercise → Routine → Player.
// Writes only browser-local test data; runs at both approved mobile viewport sizes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const out = path.resolve('docs/screenshots/chart-routine-player-integration');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

const localList = (prefix) => JSON.parse(
  localStorage.getItem(Object.keys(localStorage).find(key => key.startsWith(prefix)) ?? '') || '[]'
);
const checks = async (page, size) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 1, size + ': horizontal overflow ' + overflow + 'px');
};

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const size = viewport.width + 'x' + viewport.height;
    const context = await browser.newContext({
      viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // 1: Save a custom 6/8 chart with two events, an annotation, and a Unicode key.
    const freeChartTitle = 'Integrated Six Eight ' + size;
    await page.goto(base + '/charts/new', { waitUntil: 'networkidle' });
    await page.getByRole('textbox', { name: 'Chart name' }).fill(freeChartTitle);
    await page.getByRole('textbox', { name: 'Key', exact: true }).fill('Bb');
    await page.getByRole('textbox', { name: 'Time signature numerator' }).click();
    await page.getByRole('textbox', { name: 'Time signature numerator' }).fill('6');
    await page.getByRole('textbox', { name: 'Time signature denominator' }).fill('8');
    await page.getByRole('textbox', { name: 'Chart name' }).click();
    await page.getByRole('textbox', { name: 'Style instruction for the whole chart (optional)' })
      .fill('Play gently throughout');
    for (const [index, chord] of ['Dm7', 'G7', 'Cmaj7', 'F7'].entries()) {
      await page.getByRole('textbox', { name: 'Measure ' + (index + 1) + ' chord 1' }).fill(chord);
    }
    await page.getByRole('textbox', { name: 'Measure 1 chord 1' }).focus();
    await page.getByRole('button', { name: 'Split Measure' }).click();
    await page.getByRole('textbox', { name: 'Measure 1 chord 2' }).fill('G7');
    await page.getByRole('button', { name: 'Add Annotation' }).click();
    await page.getByRole('textbox', { name: 'Red style note for this measure' }).fill('Swing feel');
    await page.screenshot({ path: path.join(out, size + '-01-chart-builder.png'), fullPage: true });
    await page.getByRole('button', { name: 'Save Chart' }).click();
    await page.getByRole('heading', { name: 'My Charts', exact: true }).waitFor();
    const freeChart = await page.evaluate(localList, 'little-jazz-room:charts:v1:');
    const savedChart = freeChart.find(item => item.title === freeChartTitle);
    assert.ok(savedChart?.id?.startsWith('chart-local-'), 'Chart must have stable local ID');
    assert.deepEqual(savedChart.time_signature, [6, 8], '6/8 meter lost');
    assert.equal(savedChart.bars[0].events.length, 2);
    assert.deepEqual(savedChart.bars[0].events.map(event => event.duration_beats), [3, 3]);
    assert.equal(savedChart.bars[0].annotation, 'Swing feel');
    assert.equal(savedChart.style_instruction, 'Play gently throughout');
    await page.reload({ waitUntil: 'networkidle' });
    const freeCard = page.locator('.chart-library-card').filter({ hasText: freeChartTitle });
    await freeCard.getByRole('button', { name: 'Practice', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/player' && url.searchParams.get('chart') === savedChart.id);
    // The current shared player has no legacy #player-chart selector.
    // Verify the actual rendered chart's measures, title, and annotation instead.
    assert.equal(await page.locator('.practice-chart-scroll .measure').count(), savedChart.bars.length);
    await page.getByRole('heading', { name: freeChartTitle }).waitFor();
    await page.getByText('Swing feel', { exact: true }).waitFor();
    await page.getByText('Play gently throughout', { exact: true }).waitFor();
    assert.equal(await page.locator('.measure').first().locator('[data-duration-beats]').count(), 2);
    await checks(page, size);
    await page.screenshot({ path: path.join(out, size + '-02-custom-chart-player.png'), fullPage: true });
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1450);
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await page.getByRole('heading', { name: 'Great practice!' }).waitFor();
    await page.getByRole('button', { name: 'Save Session', exact: true }).click();
    await page.getByRole('button', { name: /Session Saved/ }).waitFor();
    await page.screenshot({ path: path.join(out, size + '-03-finish.png'), fullPage: true });
    await page.getByRole('button', { name: 'View Progress' }).click();
    await page.waitForURL(url => url.pathname === '/progress');
    await page.reload({ waitUntil: 'networkidle' });
    const sessions = await page.evaluate(localList, 'little-jazz-room:practice-sessions:v1:');
    assert.equal(sessions.length, 1, 'Session must survive reload without duplication');
    assert.ok(sessions[0].durationSeconds >= 1);
    await checks(page, size);
    await page.screenshot({ path: path.join(out, size + '-04-progress.png'), fullPage: true });

    // 2: From a partially completed exercise, create a 3/4 chart and return with all draft fields.
    const routineTitle = 'Integrated Routine ' + size;
    const exerciseTitle = 'Integrated Chart Exercise ' + size;
    const linkedChartTitle = 'Integrated Three Four ' + size;
    await page.goto(base + '/create', { waitUntil: 'networkidle' });
    await page.locator('#routineName').fill(routineTitle);
    await page.locator('#desc').fill('Keep this unfinished routine intact.');
    await page.locator('#builderInstrument').selectOption('Guitar');
    await page.locator('#builderGoal').selectOption('Harmony');
    await page.getByRole('button', { name: /Create your own exercise/ }).click();
    await page.locator('#exTitle').fill(exerciseTitle);
    await page.locator('#exMin').fill('6');
    await page.locator('#exInst').fill('Practice the chords slowly in order.');
    await page.screenshot({ path: path.join(out, size + '-05-exercise-draft.png'), fullPage: true });
    await page.getByRole('button', { name: '+ Create Chart' }).click();
    await page.waitForURL(url => url.pathname === '/charts/new' && url.searchParams.get('returnTo') === '/create');
    await page.getByRole('textbox', { name: 'Chart name' }).fill(linkedChartTitle);
    await page.getByRole('textbox', { name: 'Time signature numerator' }).fill('3');
    await page.getByRole('textbox', { name: 'Chart name' }).click();
    for (const [index, chord] of ['Cmaj7', 'Am7', 'Dm7', 'G7'].entries()) {
      await page.getByRole('textbox', { name: 'Measure ' + (index + 1) + ' chord 1' }).fill(chord);
    }
    await page.getByRole('button', { name: 'Save Chart' }).click();
    await page.waitForURL(url => url.pathname === '/create' && !!url.searchParams.get('createdChartId'));
    const linkedChartId = new URL(page.url()).searchParams.get('createdChartId');
    assert.ok(linkedChartId?.startsWith('chart-local-'));
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#routineName').inputValue(), routineTitle);
    assert.equal(await page.locator('#desc').inputValue(), 'Keep this unfinished routine intact.');
    assert.equal(await page.locator('#builderInstrument').inputValue(), 'Guitar');
    assert.equal(await page.locator('#builderGoal').inputValue(), 'Harmony');
    assert.equal(await page.locator('#exTitle').inputValue(), exerciseTitle);
    assert.equal(await page.locator('#exMin').inputValue(), '6');
    assert.equal(await page.locator('#exInst').inputValue(), 'Practice the chords slowly in order.');
    assert.equal(await page.locator('#exChart').inputValue(), linkedChartId);
    await page.screenshot({ path: path.join(out, size + '-06-chart-linked-exercise.png'), fullPage: true });

    await page.getByRole('button', { name: 'Save exercise' }).click();
    const savedExercises = await page.evaluate(localList, 'little-jazz-room:local-exercises:v1:');
    const savedExercise = savedExercises.find(exercise => exercise.title === exerciseTitle);
    assert.equal(savedExercise?.chart_id, linkedChartId);
    // Remove three demo steps, retaining the newly created exercise.
    while ((await page.locator('.builder-step').count()) > 1) {
      await page.locator('.builder-step-delete').first().click();
    }
    await page.getByRole('button', { name: '+ Add Existing' }).click();
    await page.locator('#builderPickerSearch').fill(exerciseTitle);
    await page.locator('.builder-picker-result').filter({ hasText: exerciseTitle })
      .getByRole('button', { name: 'Add', exact: true }).click();
    // Adding an existing exercise must close the picker and reset its search.
    await page.locator('.builder-picker-dialog').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: '+ Add Existing' }).click();
    assert.equal(await page.locator('#builderPickerSearch').inputValue(), '');
    await page.getByRole('button', { name: 'Close exercise library' }).click();
    assert.equal(await page.locator('.builder-step').count(), 2);
    await page.locator('.builder-step input[type="number"]').nth(0).fill('2');
    await page.locator('.builder-step input[type="number"]').nth(1).fill('7');
    await page.getByRole('button', { name: 'Move ' + exerciseTitle + ' up' }).last().click();
    await page.screenshot({ path: path.join(out, size + '-07-repeated-steps.png'), fullPage: true });
    await page.getByRole('button', { name: /Save routine/ }).click();
    await page.waitForURL(url => url.pathname === '/routines');
    await page.reload({ waitUntil: 'networkidle' });
    const savedRoutines = await page.evaluate(localList, 'little-jazz-room:local-routines:v1:');
    const savedRoutine = savedRoutines.find(routine => routine.title === routineTitle);
    assert.ok(savedRoutine, 'Routine must persist after reload');
    assert.deepEqual(savedRoutine.steps.map(step => step.exercise_id),
      [savedExercise.id, savedExercise.id], 'Repeated steps must retain both IDs');
    assert.deepEqual(savedRoutine.steps.map(step => step.duration_minutes),
      [7, 2], 'Per-occurrence durations must survive reordering and reload');
    await page.getByRole('button', { name: 'Practice ' + routineTitle }).click();
    await page.waitForURL(url => url.pathname === '/player' && url.searchParams.get('routine') === savedRoutine.id);
    await page.getByRole('heading', { name: routineTitle }).waitFor();
    await page.getByRole('tab', { name: 'Chart' }).click();
    assert.equal(await page.locator('.practice-chart-scroll .measure').count(), 4,
      'Expected the four-measure custom chart in routine step');
    await page.screenshot({ path: path.join(out, size + '-08-routine-player.png'), fullPage: true });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: routineTitle }).waitFor();
    await page.getByRole('tab', { name: 'Chart' }).click();
    assert.equal(await page.locator('.practice-chart-scroll .measure').count(), 4,
      'Expected the four-measure custom chart in routine step');
    await checks(page, size);

    await page.goto(base + '/player?chart=chart-local-missing-' + size, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Chart unavailable' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: freeChartTitle }).count(), 0);
    assert.deepEqual(errors, [], size + ': unexpected browser errors');
    console.log('PASS ' + size + ': 6/8 chart → practice → finish → progress, 3/4 chart → exercise → repeat routine → player, reload');
    await context.close();
  }
} finally {
  await browser.close();
}
