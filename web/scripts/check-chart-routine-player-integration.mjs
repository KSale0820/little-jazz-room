// Cross-screen acceptance: custom chart IDs, meter/events, unfinished exercise return, repeated steps.
// Run against Vite on APP_URL (default :5174). Captures evidence at both approved phone sizes.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const output = path.resolve('docs/screenshots/chart-routine-player-integration');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

async function createChart(page, title, meter = [4, 4], split = false) {
  await page.getByRole('heading', { name: 'Create Chart' }).waitFor();
  await page.getByRole('textbox', { name: 'Chart name' }).fill(title);
  if (meter[0] !== 4 || meter[1] !== 4) {
    await page.getByRole('textbox', { name: 'Time signature numerator' }).fill(String(meter[0]));
    await page.getByRole('textbox', { name: 'Time signature denominator' }).fill(String(meter[1]));
    await page.getByRole('textbox', { name: 'Chart name' }).click();
  }
  for (let n = 1; n <= 4; n++) {
    await page.getByRole('textbox', { name: 'Measure ' + n + ' chord 1' }).fill(n === 1 ? 'C7' : 'Fmaj7');
  }
  if (split) {
    await page.getByRole('textbox', { name: 'Measure 1 chord 1' }).focus();
    await page.getByRole('button', { name: 'Split Measure' }).click();
    await page.getByRole('textbox', { name: 'Measure 1 chord 2' }).fill('G7');
    await page.getByRole('button', { name: 'Add Annotation' }).click();
    await page.getByRole('textbox', { name: 'Red style note for this measure' }).fill('Light swing');
  }
  await page.getByRole('button', { name: 'Save Chart' }).click();
  await page.waitForURL(url => url.pathname === '/my-charts' || url.pathname === '/create');
  return page.evaluate(name => {
    const key = Object.keys(localStorage).find(k => k.startsWith('little-jazz-room:charts:v1:'));
    const chart = JSON.parse(localStorage.getItem(key) || '[]').find(c => c.title === name);
    if (!chart) throw Error('Chart not saved: ' + name);
    return chart;
  }, title);
}

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const size = viewport.width + 'x' + viewport.height;
    const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    // Path A: Chart -> Practice -> Finish -> Progress, including reload and missing-ID behavior.
    await page.goto(base + '/charts/new', { waitUntil: 'networkidle' });
    const chartTitle = 'Integration 6-8 ' + size;
    const chart = await createChart(page, chartTitle, [6, 8], true);
    assert.ok(chart.id.startsWith('chart-local-'));
    assert.deepEqual(chart.time_signature, [6, 8]);
    assert.equal(chart.bars[0].annotation, 'Light swing');
    assert.deepEqual(chart.bars[0].events.map(e => [e.beat, e.duration_beats]), [[1, 3], [4, 3]]);
    await page.reload({ waitUntil: 'networkidle' });
    const row = page.locator('.chart-library-card').filter({ hasText: chartTitle });
    await row.getByRole('button', { name: 'Practice' }).click();
    await page.waitForURL(url => url.pathname === '/player' && url.searchParams.get('chart') === chart.id);
    await page.getByRole('heading', { name: chartTitle }).waitFor();
    await page.getByRole('group', { name: 'Chord chart: ' + chartTitle }).waitFor();
    assert.equal(await page.locator('.practice-chart-scroll .measure').count(), 4);
    assert.equal(await page.locator('.practice-chart-scroll .measure-annotation').first().innerText(), 'Light swing');
    assert.deepEqual(await page.locator('.practice-chart-scroll .measure').first().locator('.chords span')
      .evaluateAll(nodes => nodes.map(el => [Number(el.dataset.beat), Number(el.dataset.durationBeats)])),
      [[1, 3], [4, 3]]);
    await page.screenshot({ path: path.join(output, size + '-01-custom-chart-player.png') });
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1300);
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    await page.getByRole('button', { name: 'Finish Session' }).click();
    await page.getByRole('heading', { name: 'Great practice!' }).waitFor();
    await page.getByRole('button', { name: 'Save Session', exact: true }).click();
    await page.getByRole('button', { name: /Session Saved/ }).waitFor();
    await page.screenshot({ path: path.join(output, size + '-02-chart-finish.png') });
    await page.getByRole('button', { name: 'View Progress' }).click();
    await page.waitForURL(url => url.pathname === '/progress');
    await page.getByRole('button', { name: 'Practice Again' }).waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    const sessions = await page.evaluate(() => JSON.parse(
      localStorage.getItem('little-jazz-room:practice-sessions:v1:anonymous') || '[]'));
    assert.equal(sessions.length, 1);
    assert.ok(sessions[0].durationSeconds >= 1);
    await page.screenshot({ path: path.join(output, size + '-03-progress-reload.png') });
    await page.goto(base + '/player?chart=' + encodeURIComponent(chart.id), { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: chartTitle }).waitFor();
    await page.goto(base + '/player?chart=chart-local-does-not-exist', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Chart unavailable' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: chartTitle }).count(), 0);

    // Path B: unfinished exercise -> Create Chart -> resume form -> Routine -> Practice.
    await page.goto(base + '/create', { waitUntil: 'networkidle' });
    const routineTitle = 'Repeat Study ' + size;
    const exerciseTitle = 'My Custom Chord Exercise ' + size;
    await page.locator('#routineName').fill(routineTitle);
    while (await page.locator('.builder-step-delete').count()) {
      await page.locator('.builder-step-delete').first().click();
    }
    await page.getByRole('button', { name: /Create your own exercise/i }).click();
    await page.locator('#exTitle').fill(exerciseTitle);
    await page.locator('#exMin').fill('7');
    await page.locator('#exInst').fill('Play the changes and listen to every chord.');
    await page.locator('#exLevel').selectOption('Intermediate');
    await page.getByRole('button', { name: '+ Create Chart' }).click();
    await page.waitForURL(url => url.pathname === '/charts/new' && url.searchParams.get('returnTo') === '/create');
    const linked = await createChart(page, 'Chart for ' + size);
    await page.waitForURL(url => url.pathname === '/create' && url.searchParams.get('createdChartId') === linked.id);
    assert.equal(await page.locator('#routineName').inputValue(), routineTitle);
    assert.equal(await page.locator('#exTitle').inputValue(), exerciseTitle);
    assert.equal(await page.locator('#exMin').inputValue(), '7');
    assert.equal(await page.locator('#exInst').inputValue(), 'Play the changes and listen to every chord.');
    assert.equal(await page.locator('#exLevel').inputValue(), 'Intermediate');
    assert.equal(await page.locator('#exChart').inputValue(), linked.id);
    await page.screenshot({ path: path.join(output, size + '-04-exercise-return.png') });
    await page.getByRole('button', { name: 'Save exercise' }).click();
    await page.locator('.builder-step').filter({ hasText: exerciseTitle }).first().waitFor();
    await page.getByRole('button', { name: '+ Add Existing' }).click();
    await page.getByLabel('Search by name or skill').fill(exerciseTitle);
    const match = page.locator('.builder-picker-result').filter({ hasText: exerciseTitle });
    await match.getByRole('button', { name: 'Add', exact: true }).click();
    await match.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('button', { name: 'Close exercise library' }).click();
    const durations = page.locator('.builder-step').filter({ hasText: exerciseTitle }).locator('input[type="number"]');
    assert.equal(await durations.count(), 3);
    for (const [index, minutes] of [4, 8, 12].entries()) {
      await durations.nth(index).fill(String(minutes));
    }
    await page.screenshot({ path: path.join(output, size + '-05-repeated-routine.png') });
    await page.getByRole('button', { name: /Save routine/i }).click();
    await page.waitForURL(url => url.pathname === '/routines' && url.searchParams.get('tab') === 'my');
    const saved = await page.evaluate(name => {
      const routines = JSON.parse(localStorage.getItem('little-jazz-room:local-routines:v1:anonymous') || '[]');
      return routines.find(item => item.title === name);
    }, routineTitle);
    assert.ok(saved, 'Saved routine missing');
    assert.deepEqual(saved.steps.map(s => s.duration_minutes), [4, 8, 12]);
    assert.equal(new Set(saved.steps.map(s => s.exercise_id)).size, 1);
    assert.equal(saved.duration_minutes, 24);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open ' + routineTitle + ' in player' }).click();
    await page.waitForURL(url => url.pathname === '/player');
    await page.getByRole('heading', { name: routineTitle }).waitFor();
    await page.getByRole('tab', { name: 'Chart' }).click();
    await page.getByRole('group', { name: 'Chord chart: ' + linked.title }).waitFor();
    await page.getByText('Step 1 of 3').first().waitFor();
    await page.screenshot({ path: path.join(output, size + '-06-guided-custom-chart.png') });
    await page.getByRole('button', { name: 'Next Step', exact: false }).click();
    await page.getByText('Step 2 of 3').first().waitFor();
    await page.getByRole('button', { name: 'Next Step', exact: false }).click();
    await page.getByText('Step 3 of 3').first().waitFor();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, 'Horizontal overflow ' + size + ': ' + overflow);
    assert.deepEqual(pageErrors, [], 'Page exceptions ' + size);
    await context.close();
    console.log('PASS chart/routine/player integration and reload at ' + size);
  }
} finally {
  await browser.close();
}
