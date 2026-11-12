// Builder → saved local routine → shared Practice Player preset acceptance.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const folder = join(process.cwd(), 'docs/screenshots/routine-step-presets');
mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const [width, height] of [[390,844],[375,667]]) {
    const size = width + 'x' + height;
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(base + '/create', { waitUntil: 'networkidle' });
    await page.locator('#routineName').fill('Routine Presets QA ' + size);

    const steps = page.locator('.builder-step');
    assert.equal(await steps.count(), 3, 'Expected the demo routine steps');

    await steps.nth(0).locator('.builder-step-settings-toggle').click();
    await steps.nth(0).getByRole('spinbutton', { name: 'Preset BPM for Feel the Swing Beat' }).fill('83');
    await steps.nth(0).locator('.builder-step-settings-toggle').click();

    const chartStep = steps.nth(1);
    await chartStep.locator('.builder-step-settings-toggle').click();
    await chartStep.getByRole('spinbutton', { name: /Preset BPM for/ }).fill('95');
    await chartStep.getByRole('combobox', { name: /Preset key for/ }).selectOption('G');
    await chartStep.getByRole('combobox', { name: /Preset instrument for/ }).selectOption('Bb');
    await chartStep.getByRole('checkbox', { name: /Loop a section for/ }).check();
    await chartStep.getByRole('spinbutton', { name: /Preset loop end for/ }).fill('3');
    await chartStep.getByRole('checkbox', { name: /Repeat playback for/ }).check();
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1,
      'Builder preset section caused horizontal overflow');
    await page.screenshot({ path: join(folder, size + '-builder.png'), fullPage: true });

    await page.getByRole('button', { name: /Save routine/ }).click();
    await page.waitForURL(url => url.pathname === '/routines');
    const stored = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(k => k.startsWith('little-jazz-room:local-routines:v1:'));
      return JSON.parse(localStorage.getItem(key ?? '') ?? '[]');
    });
    const routine = stored.find(row => row.title === 'Routine Presets QA ' + size);
    assert.ok(routine, 'New routine did not save locally');
    assert.equal(routine.steps[0].player_settings?.reference_bpm, 83);
    assert.equal(routine.steps[1].player_settings?.reference_bpm, 95);
    assert.equal(routine.steps[1].player_settings?.chart_key, 'G');
    assert.equal(routine.steps[1].player_settings?.written_pitch, 'Bb');
    assert.equal(routine.steps[1].player_settings?.loop_enabled, true);
    assert.equal(routine.steps[1].player_settings?.loop_sections[0].endBar, 3);
    assert.equal(routine.steps[1].player_settings?.repeat, true);

    await page.goto(base + '/player?routine=' + encodeURIComponent(routine.id), { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: routine.title }).waitFor();
    await page.getByRole('button', { name: 'Metronome', exact: true }).click();
    await page.getByRole('dialog', { name: 'Metronome within practice' }).getByText('Tempo: 83 beats per minute').waitFor();
    await page.getByRole('button', { name: 'Close tool and return to session' }).click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    assert.equal(await page.locator('#practice-bpm-value').inputValue(), '95');
    assert.equal(await page.locator('#practice-concert-key').inputValue(), 'G');
    assert.equal(await page.getByRole('button', { name: 'Configure loop' }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByRole('button', { name: 'Repeat playback' }).getAttribute('aria-pressed'), 'true');
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1,
      'Player preset section caused horizontal overflow');
    await page.screenshot({ path: join(folder, size + '-player.png'), fullPage: true });

    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('heading', { name: routine.title }).count(), 1, 'Saved routine lost on reload');
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    console.log('PASS routine builder presets ' + size);
    await context.close();
  }
} finally {
  await browser.close();
}
