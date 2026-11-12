import { strict as assert } from 'node:assert';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true });
const sizes = [{ width: 390, height: 844 }, { width: 375, height: 667 }];
await mkdir('docs/screenshots/practice-journal-qa', { recursive: true });

try {
  for (const viewport of sizes) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.goto(base + '/demo');
      await page.getByRole('heading', { name: 'Progress', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Calendar', exact: true }).click();
      await page.getByRole('heading', { name: 'Practice Journal' }).waitFor();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Calendar');
      assert.ok(await page.locator('.pj-day[aria-label*="practice recorded"]').count() > 0, 'seeded sessions must show calendar markers');
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/calendar-' + viewport.width + '.png', fullPage: true });

      await page.getByRole('button', { name: 'Journal', exact: true }).click();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Journal');
      assert.ok(await page.locator('.pj-row').count() >= 10, 'sample journal entries should load from storage');
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/journal-' + viewport.width + '.png', fullPage: true });

      await page.getByRole('button', { name: 'Notes', exact: true }).click();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Notes');
      assert.ok(await page.locator('.pj-row').count() >= 10, 'sample chart annotations should appear');
      await page.getByRole('button', { name: '+ New note' }).click();
      await page.getByLabel('Title').fill('QA: rhythmic phrase idea');
      await page.getByLabel('Notes & observations').fill('Practice the two-bar phrase over the bridge.');
      await page.getByRole('button', { name: '+ Scales' }).click();
      await page.getByPlaceholder('Add your own tag').fill('Bridge');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('button', { name: 'Save changes' }).click();
      await page.getByText('QA: rhythmic phrase idea').waitFor();
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/notes-' + viewport.width + '.png', fullPage: true });

      await page.reload();
      await page.getByText('QA: rhythmic phrase idea').waitFor();
      await page.getByRole('button', { name: 'QA: rhythmic phrase idea' }).click();
      assert.equal(await page.getByLabel('Notes & observations').inputValue(), 'Practice the two-bar phrase over the bridge.');
      assert.ok(await page.getByText('Bridge', { exact: true }).count() >= 1, 'custom tag persisted');
      await page.getByRole('button', { name: 'Save changes' }).click();

      await page.getByLabel('Search practice journal').fill('no-match-query-98411');
      assert.ok(await page.getByText('No notes found.').count() > 0);
      await page.getByLabel('Search practice journal').fill('rhythmic phrase idea');
      await page.getByText('QA: rhythmic phrase idea').waitFor();

      await page.goto(base + '/progress/calendar');
      await page.getByRole('heading', { name: 'Practice Journal' }).waitFor();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Calendar');
      await page.goto(base + '/progress/journal');
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Journal');
      await page.goto(base + '/progress/notes');
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Notes');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), true, 'no horizontal overflow');
      console.log('Practice Journal QA passed at', viewport.width, 'x', viewport.height);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
