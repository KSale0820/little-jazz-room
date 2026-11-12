// Focused clean Tuner regression: standalone route and the same component
// mounted in a Free Practice overlay at two compact phone sizes.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/clean-tuner');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const check = (ok, message) => { if (!ok) throw Error(message); };

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, permissions: ['microphone'],
    });
    const page = await context.newPage();
    page.setDefaultTimeout(18000);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const checkClean = async (name, selector) => {
      const tuner = page.locator(selector);
      await tuner.waitFor({ state: 'visible' });
      check(await tuner.locator('img').count() === 0, name + ': unexpected illustration');
      check(await tuner.locator('.tuner-main-card').isVisible(),
        name + ': live pitch card is missing');
      const styles = await tuner.evaluate(element => ({
        background: getComputedStyle(element).backgroundImage,
        overflow: element.scrollWidth - element.clientWidth,
      }));
      check(styles.background === 'none' && styles.overflow <= 1,
        name + ': decorative background or horizontal overflow: ' + JSON.stringify(styles));
      const labels = await tuner.locator('.tuner-modes button').evaluateAll(buttons =>
        buttons.map(button => ({
          text: button.textContent?.trim(),
          available: button.clientWidth,
          required: button.scrollWidth,
        })));
      check(labels.length === 3 && labels.every(item => item.available >= item.required - 1),
        name + ': tuning mode labels clipped ' + JSON.stringify(labels));
      check(await tuner.locator('.tuner-reading strong').innerText() === '—',
        name + ': idle pitch must not be fabricated');
      check(await tuner.locator('.tuner-gauge svg').count() === 1,
        name + ': pitch deviation gauge not retained');
      check(await tuner.getByRole('button', { name: 'Enable microphone' }).isVisible(),
        name + ': microphone action missing');
      check(await tuner.getByRole('button', { name: 'Play A 440 hertz tone' }).isVisible(),
        name + ': reference pitch action missing');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(overflow <= 1, name + ': viewport overflow ' + overflow);
    };

    await page.goto(base + '/tuner', { waitUntil: 'networkidle' });
    await checkClean('standalone', '.viewport > .tool-tuner');
    await page.screenshot({ path: join(out, '01-standalone-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await page.getByRole('button', { name: 'Tuner help' }).click();
    check(await page.locator('.tool-tuner .tool-help').isVisible(), 'Tuner help disappeared');
    await page.getByRole('button', { name: 'Tuner help' }).click();
    await page.getByRole('button', { name: 'Guitar', exact: true }).click();
    check(await page.getByRole('button', { name: 'Guitar', exact: true }).getAttribute('aria-pressed') === 'true',
      'Guitar mode did not select');
    await page.getByRole('button', { name: 'Bass', exact: true }).click();
    await page.getByRole('button', { name: 'Chromatic', exact: true }).click();
    await page.getByRole('button', { name: 'Enable microphone' }).click();
    await page.getByRole('button', { name: 'Stop microphone' }).waitFor();
    await page.getByRole('button', { name: 'Stop microphone' }).click();
    await page.getByRole('button', { name: 'Play A 440 hertz tone' }).click();
    await page.getByRole('button', { name: 'Stop A 440 hertz tone' }).waitFor();
    await page.getByRole('button', { name: 'Stop A 440 hertz tone' }).click();
    await page.getByRole('button', { name: 'Show pitch graph' }).click();
    await page.getByRole('region', { name: 'Live pitch graph' }).waitFor();
    await page.locator('.tuner-trail-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(out, '02-graph-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await page.getByRole('button', { name: 'Hide pitch graph' }).click();

    await page.goto(base + '/free-practice', { waitUntil: 'networkidle' });
    await page.locator('.fp-redesign .practice-demo-tools').getByRole('button', { name: 'Tuner' }).click();
    const dialog = page.getByRole('dialog', { name: 'Tuner within practice' });
    await dialog.waitFor({ state: 'visible' });
    check(new URL(page.url()).pathname === '/free-practice', 'Embedded Tuner navigated away from Free Practice');
    await checkClean('embedded', '.practice-tool-overlay .tool-tuner');
    await page.screenshot({ path: join(out, '03-free-practice-overlay-' + width + 'x' + height + '.png'),
      animations: 'disabled' });
    await dialog.getByRole('button', { name: 'Close tool and return to session' }).click();
    check(await dialog.count() === 0, 'Embedded Tuner did not close');
    check(await page.locator('.fp-redesign').isVisible(), 'Free Practice did not restore on Tuner close');
    check(errors.length === 0, 'Page errors: ' + errors.join(' | '));
    console.log('PASS clean Tuner '+ width +'x'+ height +': standalone, microphone, A440 reference, graph, Free Practice overlay');
    await context.close();
  }
} finally {
  await browser.close();
}
