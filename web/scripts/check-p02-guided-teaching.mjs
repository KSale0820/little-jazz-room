// Guided Instructions/Chart/Player walkthrough, scroll safety, cat coach and
// screenshots at both approved mobile sizes. Run with a local Vite server.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/p02-guided-teaching');
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const check = (value, message) => { if (!value) throw Error(message); };
const seconds = value => value.trim().split(':').map(Number).reduce((n, v) => n * 60 + v, 0);

try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(12000);

    await page.goto(base + '/routines', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await page.waitForURL(url => url.pathname === '/player');
    const view = name => page.getByRole('tab', { name, exact: true });
    check(await view('Instructions').getAttribute('aria-selected') === 'true', 'Guided did not default to Instructions');
    check(await view('Chart').count() === 1 && await view('Player').count() === 1, 'Missing guided views');
    const lesson = page.getByRole('region', { name: 'Guided lesson instructions' });
    check(await lesson.isVisible(), 'Instructions card missing');
    for (const heading of ['Your goal', 'Try it step by step', 'What to listen for', 'You’re ready to move on when…']) {
      check(await lesson.getByRole('heading', { name: heading }).count() === 1, 'Missing heading: ' + heading);
    }
    check(await lesson.locator('ol li').count() > 0, 'Instructions must render the legacy exercise steps');
    check((await lesson.locator('ol').innerText()).toLowerCase().includes('metronome'), 'Legacy instruction details were lost');
    check(await page.locator('.practice-cat-coach img').count() === 1, 'Selected approved cat artwork missing');
    check(await page.locator('.practice-coach-bubble p').innerText() !== '', 'Cat coach guidance missing');
    check(await page.locator('.practice-coach-bubble p').innerText() !== await lesson.locator('ol').innerText(), 'Cat coach replaced the lesson text');

    const layout = async () => page.evaluate(() => {
      const box = selector => {
        const node = document.querySelector(selector);
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height };
      };
      const scroll = document.querySelector('.practice-lesson-scroll');
      return {
        lesson: box('.practice-lesson-scroll'),
        steps: box('.practice-step-controls'),
        timer: box('.practice-clock'),
        play: box('.practice-timer-button'),
        navDisplay: getComputedStyle(document.querySelector('.bottom-nav')).display,
        overflow: document.documentElement.scrollWidth - innerWidth,
        scrollHeight: scroll?.scrollHeight,
        clientHeight: scroll?.clientHeight,
      };
    });
    let sizes = await layout();
    check(sizes.lesson && sizes.lesson.height > 100, 'Instructions reading area is too small');
    check(sizes.play.top >= 0 && sizes.play.bottom <= height + 1, 'Play button not visible at ' + width + 'x' + height);
    check(sizes.steps.top >= 0 && sizes.steps.bottom <= height + 1, 'Step navigation not visible');
    check(sizes.timer.top >= 0 && sizes.timer.bottom <= height + 1, 'Session timer not visible');
    check(sizes.navDisplay === 'none', 'Bottom navigation covers guided instructions');
    check(sizes.overflow <= 1, 'Horizontal overflow on Instructions');

    await page.screenshot({ path: join(out, 'P02-guided-instructions-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await lesson.locator('.practice-cat-coach').scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(out, 'P02-guided-cat-coach-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await page.getByRole('button', { name: 'Another tip' }).click();
    check((await page.locator('.practice-coach-bubble p').innerText()).includes('Listen'),
      'Cat coach did not advance to another short tip');

    // A long incoming structured lesson must scroll INSIDE the reading region
    // while transport stays onscreen; no need to change seed data for this test.
    await page.evaluate(() => {
      const list = document.querySelector('.practice-lesson-steps ol');
      for (let i = 0; i < 35; i++) {
        const li = document.createElement('li');
        li.textContent = 'Practice the phrase slowly ' + (i + 1);
        list.appendChild(li);
      }
    });
    sizes = await layout();
    check(sizes.scrollHeight > sizes.clientHeight, 'Long lesson is not scrollable');
    await lesson.evaluate(node => { node.scrollTop = node.scrollHeight; });
    check(await lesson.evaluate(node => node.scrollTop > 10), 'Unable to scroll to long lesson ending');
    sizes = await layout();
    check(sizes.play.bottom <= height + 1 && sizes.steps.bottom <= height + 1, 'Long lesson hid the transport');

    await view('Chart').click();
    check(await page.getByRole('tabpanel', { name: 'Jazz chord chart' }).isVisible(), 'Chart view missing');
    check(await page.locator('.measure').count() === 12, 'Chart was changed by teaching layout');
    check(await page.locator('.practice-guided-head strong').innerText() === 'Swing on Two and Four', 'Chart instructional summary missing');
    await page.screenshot({ path: join(out, 'P02-guided-chart-' + width + 'x' + height + '.png'), animations: 'disabled' });

    await page.getByRole('button', { name: 'Start practice timer' }).click();
    await page.waitForTimeout(1150);
    const before = seconds(await page.getByTestId('session-elapsed').innerText());
    check(before > 0, 'Timer did not start');
    await view('Player').click();
    check(await page.getByRole('tabpanel', { name: 'Chart only player' }).isVisible(), 'Player view missing');
    const dock = await page.locator('.practice-utility-row').boundingBox();
    check(dock && dock.y + dock.height <= height + 1, 'Guided Player tool dock is clipped at ' + width + 'x' + height);
    await page.screenshot({ path: join(out, 'P02-guided-player-' + width + 'x' + height + '.png'), animations: 'disabled' });
    await view('Instructions').click();
    check(await page.getByRole('region', { name: 'Guided lesson instructions' }).isVisible(), 'Instructions lost after switching tabs');
    check(seconds(await page.getByTestId('session-elapsed').innerText()) >= before, 'Tab change reset timer');
    await page.getByRole('button', { name: 'Pause practice timer' }).click();
    const paused = await page.getByTestId('session-elapsed').innerText();
    await page.waitForTimeout(650);
    check(await page.getByTestId('session-elapsed').innerText() === paused, 'Pause failed on Instructions');
    await page.getByRole('button', { name: 'Next Step' }).click();
    check(await view('Instructions').getAttribute('aria-selected') === 'true', 'Next exercise did not open its instructions');
    check(await page.getByRole('region', { name: 'Guided lesson instructions' }).isVisible(), 'Next lesson instructions missing');
    check(errors.length === 0, 'Browser runtime errors: ' + errors.join(' | '));
    console.log('PASS guided teaching at ' + width + 'x' + height + ': content, cat, scroll, view switch and transport');
    await ctx.close();
  }
} finally {
  await browser.close();
}
