// Routine-mode smoke test. Uses the same shared Player used for standalone charts.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const folder = join(process.cwd(), 'docs/screenshots/routine-player-refresh');
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const size = width + 'x' + height;
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/player?routine=daily-warm-up', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Daily Jazz Warm-Up' }).waitFor();
    assert.equal(await page.locator('.practice-routine-instruction-only').count(), 1, 'Step 1 should be instructions only');
    assert.equal(await page.locator('.practice-notation-panel').count(), 0, 'Instructions-only step rendered a fake chart');
    assert.equal(await page.locator('.practice-transport').count(), 0, 'Instructions-only step showed playback controls');
    assert.equal(await page.getByRole('button', { name: 'Session journal' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Tuner' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Metronome' }).count(), 1);
    assert.equal(await page.getByText('Mixer', { exact: true }).count(), 0);

    await page.getByRole('button', { name: 'Metronome' }).click();
    const metronome = page.getByRole('dialog', { name: 'Metronome within practice' });
    await metronome.waitFor();
    await metronome.getByText('Tempo: 70 beats per minute').waitFor();
    await metronome.getByRole('button', { name: 'Close tool and return to session' }).click();

    await page.getByRole('button', { name: 'Session journal' }).click();
    await page.getByRole('dialog', { name: 'Session journal' }).getByRole('textbox', { name: 'Session notes' }).fill('Counted the swing beats.');
    await page.getByRole('dialog', { name: 'Session journal' }).getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    await page.getByRole('button', { name: 'Mark Complete' }).click();
    assert.match(await page.locator('[role="progressbar"][aria-label="Completed routine exercises"]').getAttribute('aria-valuenow') ?? '', /^1$/);
    await page.screenshot({ path: join(folder, size + '-01-instructions.png'), fullPage: true });

    await page.getByRole('button', { name: 'Next Step' }).click();
    assert.equal(await page.locator('.practice-notation-panel .chord-grid').count(), 1, 'Step 2 must use shared chord grid');
    assert.ok(await page.locator('.practice-notation-panel .measure').count() > 0, 'Step 2 chart is empty');
    assert.equal(await page.getByRole('button', { name: 'Configure loop' }).count(), 1);
    // Switching to the chart exercise's instructions must keep essential tools accessible.
    await page.getByRole('tab', { name: 'Instructions' }).click();
    assert.equal(await page.getByRole('button', { name: 'Metronome', exact: true }).isVisible(), true, 'Metronome hidden in chart instructions');
    assert.equal(await page.getByRole('button', { name: 'Tuner', exact: true }).isVisible(), true, 'Tuner hidden in chart instructions');
    assert.equal(await page.getByRole('button', { name: 'Session journal' }).isVisible(), true, 'Journal hidden in chart instructions');
    assert.equal(await page.getByRole('button', { name: 'Finish Session', exact: true }).isVisible(), true, 'Finish hidden in chart instructions');
    await page.screenshot({ path: join(folder, size + '-02-chart-instructions.png'), fullPage: true });
    await page.getByRole('tab', { name: 'Chart' }).click();
    await page.getByRole('button', { name: 'View all routine exercises' }).click();
    await page.getByRole('dialog', { name: 'Routine exercise overview' }).waitFor();
    assert.equal(await page.locator('.practice-routine-step-list > button').count(), 3);
    await page.getByRole('button', { name: 'Close routine overview' }).click();
    await page.screenshot({ path: join(folder, size + '-02-chart.png'), fullPage: true });

    const tempo = page.locator('#practice-bpm-value');
    await tempo.fill('110');
    await tempo.blur();
    await page.getByRole('button', { name: 'Next Step' }).click();
    const saveSheet = page.getByRole('dialog', { name: 'Save modified exercise settings' });
    await saveSheet.waitFor();
    assert.match(await saveSheet.innerText(), /Save your changes/i);
    await page.screenshot({ path: join(folder, size + '-03-save-prompt.png') });
    await saveSheet.getByRole('button', { name: 'Save as New Exercise' }).click();
    assert.equal(await page.locator('.practice-routine-instruction-only').count(), 1, 'Step 3 must hide player');
    const exercises = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(key => key.startsWith('little-jazz-room:local-exercises:v1:'));
      return JSON.parse(localStorage.getItem(key ?? '') ?? '[]');
    });
    assert.ok(exercises.some(exercise => exercise.player_settings?.reference_bpm === 110), 'Custom preset exercise was not saved');
    await page.getByRole('combobox', { name: 'Exercise outcome' }).selectOption('needs-work');
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await page.getByRole('heading', { name: 'Great practice!' }).waitFor();
    assert.equal(await page.locator('#practice-notes').inputValue(), 'Counted the swing beats.');
    await page.getByRole('button', { name: 'Save Session', exact: true }).click();
    await page.getByRole('button', { name: /Session Saved/ }).waitFor();
    const feedback = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(key => key.startsWith('little-jazz-room:practice-feedback:v1:'));
      return JSON.parse(localStorage.getItem(key ?? '') ?? '{}');
    });
    assert.equal(feedback.notes, 'Counted the swing beats.');
    assert.equal(feedback.routineStepOutcomes['0'], 'complete');
    assert.equal(feedback.routineStepOutcomes['2'], 'needs-work');
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, 'Horizontal overflow');
    assert.deepEqual(errors, [], 'Unexpected browser errors: ' + errors.join(' | '));
    console.log('PASS routine shared player ' + size);
    await context.close();
  }
} finally {
  await browser.close();
}
