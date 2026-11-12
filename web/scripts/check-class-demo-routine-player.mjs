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
    assert.equal(await page.locator('.practice-lesson-heading').count(), 0, 'Repeated exercise heading visible inside lesson');
    assert.equal(await page.locator('.routine-step-progress-label').innerText(), '1. Feel the Swing Beat');
    assert.equal(await page.locator('.routine-step-segment').count(), 3, 'The progress bar must have one segment per exercise');
    assert.equal(await page.locator('.routine-step-progress-chevron').count(), 1, 'Progress bar dropdown arrow missing');
    assert.equal(await page.locator('.practice-title-group > p').count(), 0, 'Repeated step label present beneath routine title');
    assert.equal(await page.locator('.practice-lesson-terms dt').filter({ hasText: 'Terminology' }).count(), 0,
      'Generic Terminology subheading is redundant with Helpful terms');
    assert.equal(await page.getByRole('button', { name: 'Open session journal' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Finish Session', exact: true }).count(), 1);
    assert.equal(await page.locator('.practice-demo-metronome-wrap').count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Tuner' }).count(), 1);
    const started = page.getByRole('checkbox', { name: 'Started', exact: true });
    const completed = page.getByRole('checkbox', { name: 'Complete', exact: true });
    assert.equal(await started.isChecked(), false);
    assert.equal(await completed.isChecked(), false);
    await started.check();
    assert.equal((await page.locator('.routine-compact-state').innerText()).trim(), 'Partial');
    assert.equal(await completed.isChecked(), false, 'Started must not imply Complete');
    await completed.check();
    assert.equal(await started.isChecked(), true, 'Complete must also check Started');
    assert.equal(await page.getByRole('progressbar', { name: 'Completed routine exercises' }).getAttribute('aria-valuenow'), '1');
    await completed.uncheck();
    assert.equal(await started.isChecked(), true, 'Unchecking Complete should leave Partial');
    await started.uncheck();
    assert.equal((await page.locator('.routine-compact-state').innerText()).trim(), 'Incomplete');
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
    const navLabels = await page.locator('.routine-dock-top .routine-session-navigation button')
      .evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')));
    assert.deepEqual(navLabels, ['Previous routine step','Next routine step']);
    const footerOrder = await page.locator('.routine-dock-bottom .practice-demo-session-actions button')
      .evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label') || button.textContent?.trim()));
    assert.deepEqual(footerOrder, ['✓ Finish Session', 'Open session journal']);
    const dockLayout = await page.locator('.routine-session-dock').evaluate(dock => {
      const bounds = selector => dock.querySelector(selector)?.getBoundingClientRect();
      const top = bounds('.routine-dock-top'), bottom = bounds('.routine-dock-bottom');
      const started = bounds('.routine-compact-checks'), nav = bounds('.routine-session-navigation');
      const timer = bounds('.practice-time-badge'), finish = bounds('.practice-finish-action');
      const journal = bounds('.practice-demo-journal'), outer = dock.getBoundingClientRect();
      return {
        outer: { left: outer.left, right: outer.right },
        top: { top: top.top, bottom: top.bottom },
        bottom: { top: bottom.top, bottom: bottom.bottom },
        started: { top: started.top, bottom: started.bottom, right: started.right },
        nav: { top: nav.top, bottom: nav.bottom, left: nav.left, right: nav.right },
        lowerTops: [timer.top,finish.top,journal.top],
        lowerRights: [timer.right,finish.right,journal.right],
        lowerLefts: [timer.left,finish.left,journal.left],
        green: getComputedStyle(top).backgroundColor,
      };
    });
    assert.ok(dockLayout.top.bottom <= dockLayout.bottom.top + 2, 'Status and navigation must sit above Finish Session');
    assert.ok(Math.abs(dockLayout.started.top - dockLayout.nav.top) < 9, 'Started/Complete and arrows must share one upper row');
    assert.ok(dockLayout.started.right <= dockLayout.nav.left + 4, 'Status controls must not overlap navigation');
    assert.ok(dockLayout.lowerTops.every(value => Math.abs(value - dockLayout.lowerTops[0]) < 6),
      'Timer, Finish and journal must share the lower row: '+JSON.stringify(dockLayout));
    assert.ok(dockLayout.lowerLefts.every(x => x >= dockLayout.outer.left - 2) &&
      dockLayout.lowerRights.every(x => x <= dockLayout.outer.right + 2), 'Controls must not overflow the connected dock');
    assert.ok(dockLayout.green !== 'rgba(0, 0, 0, 0)', 'Upper status row should have the light green background');
    const positions = await page.locator('.routine-session-dock').evaluate(dock => {
      const tools = document.querySelector('.practice-demo-tools')?.getBoundingClientRect();
      return { dockTop: dock.getBoundingClientRect().top, toolsBottom: tools?.bottom };
    });
    assert.ok(positions.dockTop >= positions.toolsBottom - 4, 'Combined footer should follow the tool row');
    await page.screenshot({ path: join(dir, label + '-01-instructions.png'), fullPage: true });

    await page.getByRole('button', { name: 'Next routine step' }).click();
    assert.equal(await page.locator('.routine-step-progress-label').innerText(), '2. Play the Notes of Each Chord');
    assert.equal(await page.locator('.practice-notation-panel').count(), 0, 'Routine should open instructions first');
    assert.equal(await page.locator('.routine-lesson-inline-chords').count(), 3, 'Steps 1–3 should contain linked chord snippets');
    const inline = await page.locator('.routine-lesson-inline-chords').allTextContents();
    assert.match(inline[0], /Dm7/, 'First instruction must show Dm7');
    assert.match(inline[1], /G7/, 'Second instruction must show G7');
    assert.match(inline[2], /Cmaj7/, 'Third instruction must show Cmaj7');
    const seeChart = page.getByRole('button', { name: 'See chart' });
    const chartLinkPlacement = await seeChart.evaluate(el => {
      const parent = el.closest('.practice-lesson-card').getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      return { top: rect.top - parent.top, right: parent.right - rect.right };
    });
    assert.ok(chartLinkPlacement.top < 55 && chartLinkPlacement.right < 35, 'See Chart should sit at the lesson upper-right corner');
    await seeChart.click();
    await page.getByRole('group', { name: /Chord chart:/ }).first().waitFor();
    assert.equal(await page.locator('.practice-demo-loop').count(), 0,
      'Unavailable Loop should be hidden by default');
    assert.equal(await page.getByRole('button', { name: 'Mixer' }).count(), 0,
      'Unavailable Mixer should be hidden by default');
    assert.equal(await page.locator('.practice-demo-tools > button').count(), 1,
      'Only Tuner should appear beside Metronome until unavailable tools are enabled');
    await page.getByRole('button', { name: 'Show unavailable tools' }).click();
    assert.equal(await page.locator('.practice-demo-loop').count(), 1,
      'Show unavailable tools should reveal the disabled loop');
    assert.equal(await page.locator('.practice-demo-tools > button').count(), 2,
      'Show unavailable tools should reveal the disabled Mixer');
    await page.getByRole('button', { name: 'Hide unavailable tools' }).click();
    assert.equal(await page.locator('.practice-demo-loop').count(), 0);
    assert.equal(await page.locator('.practice-demo-tools > button').count(), 1);
    assert.equal(await page.locator('#player-chart').count(), 0, 'Routine users must not be able to choose a different chart');
    assert.equal(await page.locator('.routine-chart-fixed-title').innerText(), 'ii–V–I in C');
    assert.deepEqual(await page.locator('.routine-step-sheet-number').allTextContents(), ['1','2','3']);
    assert.equal(await page.locator('.routine-step-sheet .measure').count(), 4, 'All four chart bars must remain in the full sheet');
    await page.getByRole('button', { name: 'View all routine exercises' }).click();
    assert.equal(await page.locator('.routine-class-list > button').count(), 3);
    await page.getByRole('button', { name: 'Close routine overview' }).click();
    await page.getByRole('button', { name: 'Back to instructions' }).click();
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
    await page.getByRole('button', { name: 'See chart' }).click();
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
    await page.getByRole('button', { name: 'See chart' }).click();
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
