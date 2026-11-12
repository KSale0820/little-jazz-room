// Class-demo-only routine player QA: no pixel integration code or screenshots.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const dir = join(process.cwd(), 'docs/screenshots/class-demo-routine-player');
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const readScoped = (prefix) => {
  const key = Object.keys(localStorage).find(name => name.startsWith(prefix));
  return JSON.parse(localStorage.getItem(key ?? '') ?? '[]');
};
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const label = viewport.width + 'x' + viewport.height;
    const ctx = await browser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(base + '/player?routine=daily-warm-up', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Daily Jazz Warm-Up' }).waitFor();
    assert.equal(await page.locator('.practice-no-chart').count(), 1, 'Opening routine step is instructions-only');
    assert.equal(await page.locator('.practice-notation-panel').count(), 0, 'Unrelated fallback chart visible');
    assert.equal(await page.locator('.practice-transport').count(), 0, 'Instructions-only playback visible');
    assert.equal(await page.getByRole('button', { name: 'Open session journal' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Finish Session', exact: true }).count(), 1);
    assert.equal(await page.locator('.practice-demo-metronome-wrap').count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Tuner' }).count(), 1);
    const started = page.getByRole('checkbox', { name: 'Started', exact: true });
    const completed = page.getByRole('checkbox', { name: 'Complete', exact: true });
    assert.equal(await started.isChecked(), false);
    assert.equal(await completed.isChecked(), false);
    await started.check();
    await page.getByText('Partial', { exact: true }).waitFor();
    assert.equal(await completed.isChecked(), false, 'Started must not imply Complete');
    await completed.check();
    assert.equal(await started.isChecked(), true, 'Complete must also check Started');
    assert.equal(await page.getByRole('progressbar', { name: 'Completed routine exercises' }).getAttribute('aria-valuenow'), '1');
    await completed.uncheck();
    assert.equal(await started.isChecked(), true, 'Unchecking Complete should leave Partial');
    await started.uncheck();
    await page.getByText('Incomplete', { exact: true }).waitFor();
    await completed.check();
    assert.equal(await page.locator('.practice-segments').count(), 0, 'Old chart/instructions tabs remain');
    assert.equal(await page.getByRole('button', { name: /All Steps/i }).count(), 0, 'Old separate All Steps button remains');
    assert.equal(await page.locator('.practice-coach-dock').count(), 0, 'Cat tips remain in routine player');
    const toolWidths = await page.locator('.practice-demo-tools').evaluate(row => {
      const tiles = [...row.children].map(child => child.getBoundingClientRect());
      return { width: row.getBoundingClientRect().width, first: tiles[0]?.width, second: tiles[1]?.width };
    });
    assert.ok(Math.abs(toolWidths.first - toolWidths.second) < 12, 'Instruction tool widths should be equal');
    assert.ok(toolWidths.first + toolWidths.second > toolWidths.width - 25, 'Instruction tools should fill full row');
    const footerOrder = await page.locator('.practice-demo-session-actions').locator('button').evaluateAll(buttons => buttons.map(b => b.getAttribute('aria-label') || b.textContent?.trim()));
    assert.deepEqual(footerOrder.slice(0,4), ['Previous routine step', 'Next routine step', '✓ Finish Session', 'Open session journal']);
    await page.screenshot({ path: join(dir, label + '-01-instructions.png'), fullPage: true });

    await page.getByRole('button', { name: 'Next routine step' }).click();
    await page.getByRole('group', { name: /Chord chart:/ }).waitFor();
    assert.equal(await page.locator('#practice-demo-bpm').inputValue(), '80', 'Step BPM preset did not initialize');
    await page.getByRole('button', { name: 'View all routine exercises' }).click();
    assert.equal(await page.locator('.routine-class-list > button').count(), 3);
    await page.getByRole('button', { name: 'Close routine overview' }).click();
    await page.getByRole('button', { name: 'View exercise instructions' }).click();
    assert.equal(await page.locator('.practice-transport').count(), 0, 'Playback controls visible while reading instructions');
    assert.equal(await page.locator('#recording-scrubber').count(), 0, 'Chart scrubber visible in instructions');
    assert.equal(await page.locator('.practice-demo-settings').count(), 0, 'Tempo/key settings visible in instructions');
    assert.equal(await page.getByRole('button', { name: 'Open session journal' }).count(), 1);
    assert.equal(await page.locator('.practice-demo-metronome-wrap').count(), 1);
    assert.equal(await page.locator('.practice-demo-tools > button').count(), 1, 'Mixer must be hidden in instructions');
    const lesson = await page.locator('.practice-lesson-panel').evaluate(el => ({
      overflow: getComputedStyle(el).overflowY, scrollHeight: el.scrollHeight, height: el.getBoundingClientRect().height,
    }));
    assert.notEqual(lesson.overflow, 'auto', 'Instructions must not be clipped within an inner scroll');
    assert.ok(lesson.height >= lesson.scrollHeight - 2, 'Full instructions must be viewable in the page scroll');
    await page.screenshot({ path: join(dir, label + '-02b-chart-instructions.png'), fullPage: true });
    await page.getByRole('button', { name: 'Return to chart' }).click();
    await page.screenshot({ path: join(dir, label + '-02-chart.png'), fullPage: true });

    await page.locator('#practice-demo-bpm').fill('110');
    await page.locator('#practice-demo-bpm').blur();
    await page.getByRole('button', { name: 'Next routine step' }).click();
    const sheet = page.getByRole('dialog', { name: 'Save modified exercise settings' });
    await sheet.waitFor();
    await sheet.getByRole('button', { name: 'Save as New Exercise' }).click();
    assert.equal(await page.locator('.practice-no-chart').count(), 1, 'Third routine step must be instructions-only');
    const newExercises = await page.evaluate(readScoped, 'little-jazz-room:local-exercises:v1:');
    assert.ok(newExercises.some(ex => ex.player_settings?.reference_bpm === 110),
      'Edited step was not saved as a separate local exercise');
    await page.getByRole('checkbox', { name: 'Started', exact: true }).check();
    await page.getByRole('button', { name: 'Finish Session', exact: true }).click();
    await page.getByText('1 of 3 exercises completed', { exact: false }).waitFor();
    await page.screenshot({ path: join(dir, label + '-03-completion.png'), fullPage: true });

    await page.goto(base + '/create', { waitUntil: 'networkidle' });
    await page.locator('#routineName').fill('Preset QA ' + label);
    const step = page.locator('.builder-step').nth(1);
    await step.locator('.builder-step-settings-toggle').click();
    await step.getByRole('spinbutton', { name: /Preset BPM for/ }).fill('95');
    await step.getByRole('combobox', { name: /Preset key for/ }).selectOption('G');
    await step.getByRole('combobox', { name: /Preset instrument for/ }).selectOption('Bb');
    await step.getByRole('checkbox', { name: /Loop a section for/ }).check();
    await step.getByRole('checkbox', { name: /Repeat playback for/ }).check();
    await page.screenshot({ path: join(dir, label + '-04-builder.png'), fullPage: true });
    await page.getByRole('button', { name: /Save routine/ }).click();
    await page.waitForURL(url => url.pathname === '/routines');
    const local = await page.evaluate(readScoped, 'little-jazz-room:local-routines:v1:');
    const routine = local.find(item => item.title === 'Preset QA ' + label);
    assert.ok(routine, 'Saved routine missing');
    assert.equal(routine.steps[1].player_settings?.reference_bpm, 95);
    assert.equal(routine.steps[1].player_settings?.chart_key, 'G');
    assert.equal(routine.steps[1].player_settings?.loop_enabled, true);
    await page.goto(base + '/player?routine=' + encodeURIComponent(routine.id), { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Next routine step' }).click();
    assert.equal(await page.locator('#practice-demo-bpm').inputValue(), '95');
    assert.equal(await page.locator('#practice-demo-key').inputValue(), 'G');
    assert.equal(await page.locator('#practice-demo-instrument').inputValue(), 'Bb');
    await page.locator('#practice-demo-bpm').fill('110');
    await page.getByRole('button', { name: 'Reset to routine preset' }).click();
    assert.equal(await page.locator('#practice-demo-bpm').inputValue(), '95');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, label + ': horizontal overflow ' + overflow);
    assert.deepEqual(errors, [], 'Browser errors in ' + label);
    console.log('PASS ' + label + ': class-demo routine player, presets, statuses, charts and saved variations');
    await ctx.close();
  }
} finally {
  await browser.close();
}
