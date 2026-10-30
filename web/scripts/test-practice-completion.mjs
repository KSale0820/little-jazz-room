import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Requires a dev build configured with a Supabase URL/publishable key; cloud
// requests are intercepted and never reach the configured project.
const browser = await chromium.launch({ headless: true, channel: process.env.PW_CHANNEL ?? 'msedge' });
const base = process.env.APP_URL ?? 'http://127.0.0.1:5175';
const sessionKey = 'little-jazz-room:practice-sessions:v1:anonymous';
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.clock.install();
  await page.goto(`${base}/practice`);
  await page.getByRole('button', { name: 'Start or pause timer' }).click();
  await page.clock.runFor(2000);
  await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await page.getByRole('button', { name: 'Start or pause timer' }).click();
  await page.clock.runFor(3000);
  // A quota failure must keep the paused completion available for retry.
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (key, value) {
      if (key.includes('practice-sessions')) throw new Error('Test quota failure');
      return original.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Could not save session' }).waitFor();
  assert.equal(new URL(page.url()).pathname, '/practice');
  assert.equal(await page.getByRole('button', { name: 'Start or pause timer' }).isDisabled(), true);
  await page.evaluate(() => window.restoreStorage());
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.waitForURL(`${base}/profile`);
  const localRows = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), sessionKey);
  assert.equal(localRows.length, 1);
  assert.equal(localRows[0].durationSeconds, 5);
  assert.equal(localRows[0].routineId, 'daily-warm-up');
  assert.ok(localRows[0].routineTitle);
  await page.reload();
  assert.equal(await page.locator('.profile-stat strong').first().textContent(), '1');
  await context.close();
  console.log('PASS: local elapsed steps → storage failure → retry → profile → reload');

  const cloudContext = await browser.newContext();
  const cloudPage = await cloudContext.newPage();
  const owner = '11111111-1111-4111-8111-111111111111';
  const cloudRoutineId = '22222222-2222-4222-8222-222222222222';
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'test@example.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`;
  const rows = new Map();
  const requests = [];
  let failSync = false;
  let holdNext = false;
  let heldReceived;
  let releaseHeld;
  const heldRequest = new Promise(resolve => { heldReceived = resolve; });
  const heldResponse = new Promise(resolve => { releaseHeld = resolve; });
  let releaseFirst;
  let firstReceived;
  const firstRequest = new Promise(resolve => { firstReceived = resolve; });
  const releaseResponse = new Promise(resolve => { releaseFirst = resolve; });
  const cloudRoutine = {
    id: cloudRoutineId, owner_id: owner, title: 'Cloud practice routine', description: '',
    level: 'Beginner', duration_minutes: 5, visibility: 'private', applicable_instruments: ['All'],
    routine_steps: [{ sort_order: 0, seed_exercise_id: 'swing-2-4', source_exercise_id: null,
      snapshot_title: 'Swing', snapshot_instructions: 'Play slowly.', snapshot_duration_minutes: 5, snapshot_chart_id: null }],
  };
  await cloudPage.route('**/auth/v1/**', route => route.fulfill({ json: { access_token: token, refresh_token: 'test', token_type: 'bearer', expires_in: 3600, user } }));
  await cloudPage.route('**/rest/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/practice_sessions')) {
      if (request.method() === 'POST') {
        const row = request.postDataJSON();
        requests.push(row);
        assert.match(request.headers().prefer, /resolution=ignore-duplicates/);
        assert.equal(url.searchParams.get('on_conflict'), 'id');
        // Simulate a committed insert whose response is lost.
        if (!rows.has(row.id)) rows.set(row.id, row);
        if (holdNext) {
          holdNext = false;
          heldReceived();
          await heldResponse;
        }
        if (requests.length === 1) {
          firstReceived();
          await releaseResponse;
          return route.fulfill({ status: 503, json: { message: 'Lost response after commit' } });
        }
        failSync = true;
        return route.fulfill({ status: 201, body: '' });
      }
      return route.fulfill({ json: [...rows.values()] });
    }
    if (url.pathname.endsWith('/user_exercises') && failSync) return route.fulfill({ status: 500, json: { message: 'Unrelated sync failure' } });
    if (url.pathname.endsWith('/user_routines')) return route.fulfill({ json: url.searchParams.has('owner_id') ? [cloudRoutine] : [] });
    return route.fulfill({ json: [] });
  });
  await cloudPage.goto(`${base}/signin`);
  assert.equal(await cloudPage.locator('#email').count(), 1, 'Cloud regression needs a configured Supabase build');
  await cloudPage.locator('#email').fill(user.email);
  await cloudPage.locator('#password').fill('test-password');
  await cloudPage.getByRole('button', { name: 'Sign in', exact: true }).click();
  await cloudPage.waitForURL(`${base}/`);
  await cloudPage.goto(`${base}/practice`);
  // Dispatch two synchronous clicks to test the ref guard before React renders.
  await cloudPage.getByRole('button', { name: 'Finish', exact: true }).evaluate(button => { button.click(); button.click(); });
  await firstRequest;
  assert.equal(requests.length, 1);
  assert.equal(await cloudPage.getByRole('button', { name: 'Finish', exact: true }).isDisabled(), true);
  releaseFirst();
  await cloudPage.getByRole('status').filter({ hasText: 'Could not save session' }).waitFor();
  await cloudPage.getByRole('button', { name: 'Finish', exact: true }).click();
  await cloudPage.waitForURL(`${base}/profile`);
  assert.deepEqual(requests[1], requests[0]);
  assert.equal(rows.size, 1);
  assert.equal(requests[0].routine_id, null);
  assert.equal(requests[0].routine_ref, 'daily-warm-up');
  assert.ok(requests[0].routine_title);
  assert.equal(await cloudPage.locator('.profile-stat strong').first().textContent(), '1');
  failSync = false;
  await cloudPage.reload();
  await cloudPage.waitForFunction(() => document.querySelector('.profile-stat strong')?.textContent === '1');
  console.log('PASS: seed routine → duplicate Finish guard → lost response → same-record retry → immediate/reloaded history');

  // Cover actual cloud UUIDs and signed-in device-local routines too.
  await cloudPage.evaluate(({ owner }) => localStorage.setItem(`little-jazz-room:local-routines:v1:${owner}`, JSON.stringify([{
    id: 'local-rt-regression', title: 'Device practice routine', description: '', level: 'Beginner',
    duration_minutes: 5, visibility: 'private', is_seed: false, applicable_instruments: ['All'],
    steps: [{ exercise_id: 'swing-2-4', duration_minutes: 5 }],
  }])), { owner });
  for (const [title, expectedId, foreignKey] of [
    ['Cloud practice routine', cloudRoutineId, cloudRoutineId],
    ['Device practice routine', 'local-rt-regression', null],
  ]) {
    failSync = false;
    await cloudPage.goto(`${base}/explore`);
    await cloudPage.getByRole('button').filter({ hasText: title }).click();
    await cloudPage.getByRole('button', { name: 'Finish', exact: true }).click();
    await cloudPage.waitForURL(`${base}/profile`);
    assert.equal(requests.at(-1).routine_id, foreignKey);
    assert.equal(requests.at(-1).routine_ref, expectedId);
    assert.equal(requests.at(-1).routine_title, title);
  }
  assert.equal(rows.size, 3);
  console.log('PASS: cloud UUID and signed-in local routines preserve references and save history');
  failSync = false;
  await cloudPage.goto(`${base}/practice`);
  holdNext = true;
  await cloudPage.getByRole('button', { name: 'Finish', exact: true }).click();
  await heldRequest;
  await cloudPage.getByRole('link', { name: 'Explore', exact: true }).first().click();
  await cloudPage.waitForURL(`${base}/explore`);
  const acknowledgement = cloudPage.waitForResponse(response => response.url().includes('/practice_sessions') && response.request().method() === 'POST');
  releaseHeld();
  await acknowledgement;
  await cloudPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(new URL(cloudPage.url()).pathname, '/explore');
  console.log('PASS: late completion does not navigate after leaving Practice');
  await cloudContext.close();
} finally {
  await browser.close();
}
