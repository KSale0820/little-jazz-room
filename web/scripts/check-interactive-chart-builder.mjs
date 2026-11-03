import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const baseUrl = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const out = path.resolve('docs/screenshots/interactive-chart-builder');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }]) {
    const size = viewport.width + 'x' + viewport.height;
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(baseUrl + '/charts/new', { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Create Chart' }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Key', exact: true }).count(), 1);
    assert.equal(await page.getByRole('textbox', { name: 'Time signature numerator' }).inputValue(), '4');
    assert.equal(await page.getByRole('textbox', { name: 'Time signature denominator' }).inputValue(), '4');
    assert.equal(await page.locator('.chart-builder-key-scroll').count(), 0);
    await page.getByRole('textbox', { name: 'Key', exact: true }).fill('Bb');
    await page.getByRole('textbox', { name: 'Time signature numerator' }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Key', exact: true }).inputValue(), 'B♭');
    await page.getByRole('button', { name: 'Raise key one semitone' }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Key', exact: true }).inputValue(), 'B');
    await page.getByRole('textbox', { name: 'Time signature numerator' }).fill('6');
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Time signature denominator');
    await page.getByRole('textbox', { name: 'Time signature denominator' }).fill('8');
    await page.getByRole('textbox', { name: 'Chart name' }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Time signature numerator' }).inputValue(), '6');
    assert.equal(await page.getByRole('textbox', { name: 'Time signature denominator' }).inputValue(), '8');
    // This demo returns to 4/4 for the two-beat split acceptance check.
    await page.getByRole('textbox', { name: 'Time signature numerator' }).fill('4');
    await page.getByRole('textbox', { name: 'Time signature denominator' }).fill('4');
    await page.getByRole('textbox', { name: 'Chart name' }).click();
    await page.getByLabel('Feel (optional)').selectOption('Other');
    await page.getByRole('textbox', { name: 'Describe your feel' }).fill('Slow funk');
    await page.screenshot({ path: path.join(out, size + '-01-empty.png'), fullPage: true });

    await page.getByRole('textbox', { name: 'Chart name' }).fill('My First ii–V–I');
    for (const [index, chord] of ['Dm7', 'G7', 'Cmaj7', 'Cmaj7'].entries()) {
      await page.getByRole('textbox', { name: 'Measure ' + (index + 1) + ' chord 1' }).fill(chord);
    }
    await page.getByRole('textbox', { name: 'Measure 1 chord 1' }).focus();
    const selectedInput = page.getByRole('textbox', { name: 'Measure 1 chord 1' });
    await selectedInput.fill('Bm7');
    await selectedInput.evaluate(input => input.setSelectionRange(1, 1));
    await page.getByRole('button', { name: 'Insert flat symbol' }).click();
    assert.equal(await selectedInput.inputValue(), 'B♭m7');
    await selectedInput.fill('Dm7');
    const nearBar = await page.locator('.chart-editor-row').first().locator('.chart-builder-selection').count();
    assert.equal(nearBar, 1, 'Selected bar tools should be directly beneath its chart row');
    assert.equal(await page.locator('.chart-builder-toolbar button').count(), 9);
    assert.equal(await page.locator('.chart-builder-toolbar').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 9);
    await page.getByLabel('Section starts here').selectOption('A');
    await page.screenshot({ path: path.join(out, size + '-02-complete.png'), fullPage: true });

    await page.getByRole('button', { name: 'Split Measure' }).click();
    await page.getByRole('textbox', { name: 'Measure 1 chord 2' }).fill('G7');
    await page.screenshot({ path: path.join(out, size + '-03-split.png'), fullPage: true });
    await page.getByRole('button', { name: 'Add Annotation' }).click();
    await page.getByRole('textbox', { name: 'Red style note for this measure' }).fill('Swing feel');
    await page.screenshot({ path: path.join(out, size + '-04-annotation.png'), fullPage: true });

    // Start section B on measure 3, then append another A section to make A–B–A.
    await page.getByRole('textbox', { name: 'Measure 3 chord 1' }).focus();
    await page.getByLabel('Section starts here').selectOption('B');
    await page.getByRole('textbox', { name: 'Measure 1 chord 1' }).focus();
    await page.getByRole('button', { name: 'Copy section A' }).click();
    await page.getByRole('textbox', { name: 'Measure 5 chord 1' }).waitFor();
    await page.screenshot({ path: path.join(out, size + '-05-aba.png'), fullPage: true });
    await page.getByRole('button', { name: 'Save Chart' }).click();
    await page.getByRole('heading', { name: 'My Charts', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'My First ii–V–I' }).waitFor();
    const id = await page.evaluate(() => {
      const key = Object.keys(localStorage).find(value => value.startsWith('little-jazz-room:charts:v1:'));
      const charts = JSON.parse(localStorage.getItem(key) ?? '[]');
      assert.ok(charts.length > 0);
      return charts[0].id;
    }).catch(async () => {
      return await page.evaluate(() => {
        const key = Object.keys(localStorage).find(value => value.startsWith('little-jazz-room:charts:v1:'));
        const charts = JSON.parse(localStorage.getItem(key) ?? '[]');
        if (!charts.length) throw new Error('Saved charts were not persisted');
        const chart = charts[0];
        if (chart.feel !== 'Slow funk') throw new Error('Custom feel not preserved');
        if (chart.bars.length !== 6 || chart.bars[2].section !== 'B' || chart.bars[4].section !== 'A')
          throw new Error('A-B-A section duplication did not persist');
        if (chart.bars[0].events.length !== 2 || chart.bars[0].events[1].beat !== 3
            || chart.bars[0].annotation !== 'Swing feel') throw new Error('Saved chart beat events/annotation incorrect');
        return chart.id;
      });
    });
    assert.ok(id.startsWith('chart-local-'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'My First ii–V–I' }).waitFor();
    await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await page.getByRole('textbox', { name: 'Measure 1 chord 2' }).waitFor();
    await page.getByRole('textbox', { name: 'Chart name' }).fill('My Revised ii–V–I');
    await page.getByRole('button', { name: 'Save Chart' }).click();
    await page.getByRole('heading', { name: 'My Revised ii–V–I' }).waitFor();
    const documentOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(documentOverflow, false, 'Unexpected horizontal overflow at ' + size);
    assert.deepEqual(errors, [], 'Unexpected browser errors at ' + size);
    await context.close();
  }
  console.log('Chart editor screenshots and functional browser checks passed: 390×844, 375×667.');
} finally {
  await browser.close();
}
