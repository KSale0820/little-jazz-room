import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.APP_URL ?? 'http://127.0.0.1:5176';
const browser = await chromium.launch({ headless: true, channel: process.env.PW_CHANNEL ?? 'msedge' });
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const userFor = id => ({ id, aud: 'authenticated', role: 'authenticated', email: `${id === A ? 'a' : 'b'}@example.com`, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() });
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const sessionFor = id => ({ access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`, refresh_token: `test-${id}`, token_type: 'bearer', expires_in: 3600, user: userFor(id) });
const routineFor = owner => ({ id: owner === A ? '33333333-3333-4333-8333-333333333333' : '44444444-4444-4444-8444-444444444444', owner_id: owner, title: owner === A ? 'A private routine' : 'B private routine', description: '', level: 'Beginner', duration_minutes: 5, visibility: 'private', applicable_instruments: ['All'], routine_steps: [] });
let releaseA;
let releaseB;
let receivedA;
let receivedB;
const heldA = new Promise(resolve => { releaseA = resolve; });
const heldB = new Promise(resolve => { releaseB = resolve; });
const requestA = new Promise(resolve => { receivedA = resolve; });
const requestB = new Promise(resolve => { receivedB = resolve; });
let aReads = 0;
let failLogout = true;
let failLogin = true;
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/auth/v1/**', route => {
    const request = route.request();
    if (request.url().includes('/logout')) return route.fulfill(failLogout ? { status: 500, json: { message: 'Logout unavailable' } } : { status: 204, body: '' });
    if (request.url().includes('/token')) {
      if (failLogin) return route.fulfill({ status: 400, json: { error: 'invalid_grant', error_description: 'Test invalid credentials' } });
      const body = request.postDataJSON();
      return route.fulfill({ json: sessionFor(body.email?.startsWith('b@') || body.refresh_token === `test-${B}` ? B : A) });
    }
    return route.fulfill({ json: userFor(A) });
  });
  await page.route('**/rest/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const owner = url.searchParams.get('owner_id')?.slice(3);
    if (url.pathname.endsWith('/profiles')) {
      if (request.method() === 'POST') return route.fulfill({ status: 201, body: '' });
      const cat_id = url.searchParams.get('id') === `eq.${B}` ? 'chai' : 'milo';
      return route.fulfill({ json: request.method() === 'PATCH' ? { cat_id } : [{ cat_id }] });
    }
    if (url.pathname.endsWith('/user_exercises')) {
      if (request.method() === 'POST') return route.fulfill({ json: request.postDataJSON() });
      if (owner === B) return route.fulfill({ status: 500, json: { message: 'Exercise sync unavailable' } });
      if (owner === A && ++aReads === 2) {
        receivedA();
        await heldA;
      }
      return route.fulfill({ json: owner === A ? [{ id: '55555555-5555-4555-8555-555555555555', owner_id: A, title: 'A private exercise', category: 'Technique', level: 'Beginner', duration_minutes: 5, instructions: 'A instructions', suggested_material: '', applicable_instruments: ['All'], suggested_bpm: null, chart_id: null, visibility: 'private' }] : [] });
    }
    if (url.pathname.endsWith('/user_routines')) {
      if (owner === B) { receivedB(); await heldB; }
      return route.fulfill({ json: owner ? [routineFor(owner)] : [] });
    }
    if (url.pathname.endsWith('/practice_sessions')) {
      return route.fulfill({ json: Array.from({ length: owner === B ? 2 : 1 }, (_, i) => ({ id: `session-${owner}-${i}`, duration_seconds: 60, routine_id: null, exercise_ref: null, finished_at: new Date().toISOString() })) });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto(`${base}/signin`);
  await page.locator('#email').fill('a@example.com');
  await page.locator('#password').fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByText('Test invalid credentials', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Sign in', exact: true }).isEnabled(), true);
  failLogin = false;
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`${base}/`);
  await page.getByRole('link', { name: 'Explore', exact: true }).first().click();
  await page.getByRole('heading', { name: 'A private routine', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Create', exact: true }).first().click();
  await page.locator('#routineName').fill('A private draft');
  await page.getByRole('button', { name: '+ Add Exercise', exact: true }).click();
  await page.locator('#exTitle').fill('A saved exercise');
  await page.locator('#exInst').fill('A private instructions');
  await page.getByRole('button', { name: 'Save exercise', exact: true }).click();
  await requestA;
  await page.getByRole('button', { name: '+ Add Exercise', exact: true }).click();
  await page.locator('#exTitle').fill('A unsaved form');
  // Simulate an account change delivered by Supabase (e.g. from another tab)
  // without reloading or navigating away from the active form.
  await page.evaluate(async ({ B }) => {
    localStorage.setItem(`little-jazz-room:create-draft:v1:${B}`, JSON.stringify({ title: 'B private draft', description: '', visibility: 'Private', stepExerciseIds: ['swing-2-4'] }));
    const { getSupabaseClient } = await import('/src/lib/supabase/client.ts');
    const { error } = await getSupabaseClient().auth.signInWithPassword({ email: 'b@example.com', password: 'test-password' });
    if (error) throw error;
  }, { B });
  await requestB;
  assert.equal(await page.locator('#routineName').inputValue(), 'B private draft');
  assert.equal(await page.locator('#exTitle').count(), 0);
  assert.equal(await page.getByText('A saved exercise', { exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Profile', exact: true }).first().click();
  await page.waitForFunction(() => document.querySelector('.profile-stat strong')?.textContent === '2');
  await page.getByRole('button', { name: 'Chai, Vocals, Elegant & vocal', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Chai, Vocals, Elegant & vocal', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByText('A private routine', { exact: true }).count(), 0);
  const aResponse = page.waitForResponse(response => response.url().includes('/user_exercises') && response.url().includes(A));
  releaseA();
  await aResponse;
  releaseB();
  await page.getByRole('link', { name: 'Explore', exact: true }).first().click();
  await page.getByRole('heading', { name: 'B private routine', exact: true }).waitFor();
  assert.equal(await page.getByText('A private routine', { exact: true }).count(), 0);
  await page.getByRole('tab', { name: 'Exercises', exact: true }).click();
  assert.equal(await page.getByText('A private exercise', { exact: true }).count(), 0);
  assert.equal(await page.getByText('A saved exercise', { exact: true }).count(), 0);
  console.log('PASS: A → B without reload resets drafts/forms/cat/history and ignores delayed A data; failed B exercises and delayed routines do not block sessions');

  await page.reload();
  await page.getByRole('link', { name: 'Profile', exact: true }).first().click();
  await page.waitForFunction(() => document.querySelector('.profile-stat strong')?.textContent === '2');
  await page.getByRole('button', { name: 'Sign out', exact: true }).first().click();
  await page.getByRole('status').filter({ hasText: 'Could not sign out' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Sign out', exact: true }).first().isEnabled(), true);
  failLogout = false;
  await page.getByRole('button', { name: 'Sign out', exact: true }).first().click();
  await page.waitForFunction(() => document.querySelector('.profile-stat strong')?.textContent === '0');
  assert.equal(await page.getByText('B private routine', { exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Create', exact: true }).first().click();
  assert.equal(await page.locator('#routineName').inputValue(), 'My First Jazz Routine');
  const drafts = await page.evaluate(({ A, B }) => [A, B].map(id => JSON.parse(localStorage.getItem(`little-jazz-room:create-draft:v1:${id}`)).title), { A, B });
  assert.deepEqual(drafts, ['A private draft', 'B private draft']);
  assert.deepEqual(errors, []);
  console.log('PASS: session reload → sign-out failure/retry → anonymous state; private drafts stay scoped; no page errors');
} finally {
  await browser.close();
}
