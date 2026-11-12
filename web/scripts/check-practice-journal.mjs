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
      assert.ok(await page.locator('.pj-day[aria-label*="practice recorded"]').count() > 0, 'seeded sessions must show markers');
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/calendar-' + viewport.width + '.png', fullPage: true });

      // Calendar date selection remains inline, with date-specific cards underneath.
      const initialSelected = await page.locator('.pj-day.selected').getAttribute('aria-label');
      assert.ok(initialSelected);
      const otherDay = page.locator('.pj-day:not(.selected)').first();
      await otherDay.click();
      assert.equal(await page.locator('.pj-detail').count(), 0, 'date click must not open journal sheet');
      assert.equal(await page.locator('.pj-day-overview').count(), 0, 'do not navigate to a separate overview');
      assert.equal(await page.locator('.pj-calendar-panel').count(), 1);
      await page.locator('.pj-day[aria-label="' + initialSelected + '"]').click();
      await page.getByRole('button', { name: 'View practice sheet' }).waitFor();
      assert.equal(await page.getByRole('button', { name: '+ Add journal entry' }).count(), 0, 'existing entry must not offer Add');
      await page.getByRole('button', { name: 'Edit journal entry' }).last().waitFor();
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/overview-' + viewport.width + '.png', fullPage: true });
      await page.getByRole('button', { name: 'View practice sheet' }).click();
      await page.getByRole('heading', { name: 'What I practiced' }).waitFor();
      assert.equal(await page.locator('.pj-detail').count(), 1);
      assert.ok(await page.locator('.pj-detail-practiced').count() > 0);
      assert.ok(await page.locator('.pj-measure-link').count() > 0, 'dated chart notes must be under What I practiced');
      assert.ok(await page.locator('.pj-session-reflection').count() > 0, 'reflection belongs under its session');
      assert.ok(await page.locator('.pj-detail-section h2 svg').count() === 4, 'mockup section icons present');
      assert.equal(await page.locator('.pj-observation-label').count(), 0, 'no duplicated note title');
      assert.equal(await page.getByRole('button', { name: 'Edit note' }).count(), 0, 'only top pencil edits notes');
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/day-' + viewport.width + '.png', fullPage: true });
      await page.getByRole('button', { name: 'Back to Practice Journal' }).click();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Calendar');
      assert.equal(await page.locator('.pj-calendar-panel').count(), 1);
      const storedBefore = await page.evaluate(() => {
        const key = Object.keys(localStorage).find(k => k.includes('practice-journals:v1:'));
        return key ? { key, ids: JSON.parse(localStorage.getItem(key) || '[]').map(e => e.id) } : null;
      });
      assert.ok(storedBefore, 'demo stored journal entries');
      await page.getByRole('button', { name: 'Edit journal entry' }).last().click();
      await page.getByLabel('Title').fill('Updated daily entry');
      await page.getByRole('button', { name: 'Save changes' }).click();
      const storedAfter = await page.evaluate(key =>
        JSON.parse(localStorage.getItem(key) || '[]').map(e => e.id), storedBefore.key);
      assert.deepEqual([...storedAfter].sort(), [...storedBefore.ids].sort(), 'editing does not replace or duplicate records');
      await page.getByRole('button', { name: 'Back to Practice Journal' }).click();
      assert.equal(await page.getByRole('button', { name: '+ Add journal entry' }).count(), 0);

      await page.getByRole('button', { name: 'Journal', exact: true }).click();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Journal');
      assert.ok(await page.locator('.pj-row').count() >= 10, 'sample journal entries load');
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/journal-' + viewport.width + '.png', fullPage: true });
      await page.locator('.pj-row').first().click();
      await page.getByRole('button', { name: 'Edit journal entry' }).waitFor();
      assert.equal(await page.locator('textarea').count(), 0, 'entries open in read-only mode');
      await page.getByRole('button', { name: 'Edit journal entry' }).click();
      await page.getByRole('button', { name: '+ Scales' }).click();
      await page.getByRole('button', { name: 'Change color for Scales' }).click();
      await page.getByRole('button', { name: 'Set Scales color to rose' }).click();
      await page.locator('.pj-icon-picker summary').click();
      await page.getByRole('button', { name: 'Select Rhythm icon' }).click();
      assert.equal(await page.locator('.pj-icon-picker-grid button[aria-pressed="true"]').count(), 1);
      await page.getByLabel('Custom tag').fill('Bridge');
      await page.getByRole('button', { name: 'New tag color blue' }).click();
      await page.getByRole('button', { name: '+ Add', exact: true }).click();
      assert.ok(await page.locator('.pj-tag-selected.pj-blue').filter({ hasText: 'Bridge' }).count() === 1);
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/tags-' + viewport.width + '.png', fullPage: true });
      await page.getByRole('button', { name: 'Save changes' }).click();
      assert.ok(await page.locator('.pj-detail-chips .pj-blue').filter({ hasText: 'Bridge' }).count() === 1);
      await page.getByRole('button', { name: 'Back to Practice Journal' }).click();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Journal', 'back must not jump to Progress');
      await page.getByLabel('Filter by tag').selectOption('Bridge');
      assert.ok(await page.locator('.pj-row').count() > 0, 'the newly created tag is searchable');
      await page.getByLabel('Filter by tag').selectOption('');

      await page.getByRole('button', { name: 'Notes', exact: true }).click();
      assert.equal(await page.locator('.pj-tabs button.active').textContent(), 'Notes');
      assert.ok(await page.locator('.pj-row').count() >= 10);
      await page.getByRole('button', { name: '+ New note' }).click();
      await page.getByLabel('Title').fill('QA: rhythmic phrase idea');
      await page.getByLabel('Notes & observations').fill('Practice the two-bar phrase over the bridge.');
      await page.getByRole('button', { name: '+ Bridge' }).click();
      await page.getByRole('button', { name: 'Save changes' }).click();
      await page.getByText('Practice the two-bar phrase over the bridge.').waitFor();
      await page.screenshot({ path: 'docs/screenshots/practice-journal-qa/notes-' + viewport.width + '.png', fullPage: true });
      await page.reload();
      await page.getByText('Practice the two-bar phrase over the bridge.').waitFor();
      assert.equal(await page.getByRole('button', { name: 'Edit note' }).count(), 0);
      await page.getByRole('button', { name: 'Edit journal entry' }).click();
      assert.equal(await page.getByLabel('Notes & observations').inputValue(), 'Practice the two-bar phrase over the bridge.');
      await page.getByLabel('Notes & observations').fill('Updated phrase with more space.');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await page.getByText('Updated phrase with more space.').waitFor();
      await page.getByRole('button', { name: 'Back to Practice Journal' }).click();
      await page.getByLabel('Search practice journal').fill('no-match-query-98411');
      assert.ok(await page.getByText('No notes found.').count() > 0);
      await page.getByLabel('Search practice journal').fill('rhythmic phrase idea');
      await page.getByText('QA: rhythmic phrase idea').waitFor();
      await page.locator('.pj-row').first().click();
      assert.equal(await page.locator('textarea').count(), 0);

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
