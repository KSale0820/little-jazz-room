// Regression tests for navigation errors found in the exhaustive class-demo audit.
// Only checks live routes; does not alter approved screen layouts.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APP_URL || 'http://127.0.0.1:5174';
const out = join(process.cwd(), 'docs/screenshots/class-demo-navigation');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  for (const [width, height] of [[390, 844], [375, 667]]) {
    const context = await browser.newContext({
      viewport: { width, height }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const open = async path => { await page.goto(base + path, { waitUntil: 'networkidle' }); };
    const requireUrl = async expected => page.waitForURL(url => url.pathname === expected);

    // Free Player shortcuts must open in-session overlays; Guided also includes these approved controls.
    await open('/practice');
    await page.getByRole('button', { name: /^Free Practice/ }).click();
    await requireUrl('/player');
    const utilities = page.locator('.practice-utility-row');
    assert(await utilities.getByRole('button', { name: /Mixer/ }).isDisabled(), 'Mixer should remain a labeled preview');
    assert(await utilities.getByRole('button', { name: /Tuner/ }).isEnabled(), 'Player Tuner must be usable');
    assert(await utilities.getByRole('button', { name: /Metronome/ }).isEnabled(), 'Player Metronome must be usable');
    assert(await utilities.getByText('Preview').count() === 1, 'Only Mixer should show Preview');

    await utilities.getByRole('button', { name: /Tuner/ }).click();
    await page.getByRole('dialog', { name: 'Tuner within practice' }).waitFor();
    assert(new URL(page.url()).pathname === '/player', 'Tuner must not navigate away from Player');
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();

    await page.locator('.practice-utility-row').getByRole('button', { name: /Metronome/ }).click();
    await page.getByRole('dialog', { name: 'Metronome within practice' }).waitFor();
    assert(new URL(page.url()).pathname === '/player', 'Metronome must not navigate away from Player');
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();

    await page.screenshot({ path: join(out, 'player-shortcuts-' + width + 'x' + height + '.png') });

    await open('/routines');
    await page.getByRole('button', { name: 'Open Daily Jazz Warm-Up in player' }).click();
    await requireUrl('/player');
    assert(await page.getByText('Guided Practice').isVisible(), 'Guided mode missing');
    assert(await page.locator('.practice-utility-row').count() === 1, 'Guided practice must show approved tools');
    await page.locator('.practice-utility-row').getByRole('button', { name: /Tuner/ }).click();
    await page.getByRole('dialog', { name: 'Tuner within practice' }).waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Close tool and return to session' }).click();

    // Explore must go to the chart *library*, not a free-practice Player.
    await open('/explore');
    await page.getByRole('button', { name: 'View charts' }).click();
    await requireUrl('/charts');
    await page.getByRole('heading', { name: 'Charts' }).waitFor();
    assert((await page.locator('.demo-row').count()) > 0, 'Chart browse destination has no charts');
    await page.screenshot({ path: join(out, 'explore-charts-' + width + 'x' + height + '.png') });
    await page.locator('.demo-row').first().click();
    await requireUrl('/player');
    assert(await page.getByRole('tabpanel', { name: 'Jazz chord chart' }).isVisible(), 'Chart to Player not working');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert(overflow <= 1, 'Unexpected horizontal overflow');
    assert(errors.length === 0, 'Browser errors: ' + errors.join(' | '));
    console.log('PASS navigation fixes at ' + width + 'x' + height + ': P02 in-session Tuner and Metronome in both modes; Mixer Preview; Explore charts library -> linked player; back links');
    await context.close();
  }
} finally { await browser.close(); }
