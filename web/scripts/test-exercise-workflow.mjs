import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Run against npm run dev; no credentials or production writes required.
const browser = await chromium.launch({ headless: true, channel: process.env.PW_CHANNEL ?? 'msedge' });
try {
  const page = await browser.newPage();
  const base = process.env.APP_URL ?? 'http://127.0.0.1:5174';
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}/create`);
  await page.getByRole('button', { name: '+ Add Exercise', exact: true }).click();
  await page.locator('#exTitle').fill('Workflow exercise');
  await page.locator('#exInst').fill('Play chord tones slowly.');
  await page.locator('#exMin').fill('3');
  await page.locator('#exChart').selectOption('blues-f-12');
  await page.getByRole('button', { name: 'Save exercise', exact: true }).click();
  const readExercises = () => page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:local-exercises:v1:anonymous') ?? '[]'));
  const [created] = await readExercises();
  assert.equal(created.title, 'Workflow exercise');
  await page.goto(`${base}/explore`);
  await page.getByRole('tab', { name: 'Exercises', exact: true }).click();
  await page.getByRole('button').filter({ hasText: 'Workflow exercise' }).click();
  assert.equal(await page.locator('#exTitle').inputValue(), 'Workflow exercise');
  assert.equal(await page.locator('#exChart').inputValue(), 'blues-f-12');
  await page.locator('#exTitle').fill('Edited workflow exercise');
  await page.locator('#exMin').fill('0');
  await page.getByRole('button', { name: 'Save exercise', exact: true }).click();
  assert.equal((await readExercises())[0].title, 'Workflow exercise');
  await page.locator('#exMin').fill('4');
  await page.getByRole('button', { name: 'Save exercise', exact: true }).click();
  const edited = await readExercises();
  assert.equal(edited.length, 1);
  assert.equal(edited[0].id, created.id);
  assert.equal(edited[0].title, 'Edited workflow exercise');
  await page.reload();
  assert.equal((await readExercises())[0].duration_minutes, 4);
  await page.locator('#routineName').fill('Workflow routine');
  await page.getByRole('button', { name: 'Save routine locally', exact: true }).click();
  const steps = await page.evaluate(() => JSON.parse(localStorage.getItem('little-jazz-room:local-routines:v1:anonymous'))[0].steps);
  assert.equal(steps.filter(s => s.exercise_id === created.id).length, 1);
  await page.goto(`${base}/explore`);
  await page.getByRole('button').filter({ hasText: 'Workflow routine' }).click();
  for (let i = 0; i < steps.length - 1; i++) await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await page.getByRole('tab', { name: 'Player', exact: true }).click();
  assert.equal(await page.getByRole('heading', { name: 'Edited workflow exercise', exact: true }).count(), 1);
  assert.equal(await page.getByText('Play chord tones slowly.', { exact: true }).count(), 1);
  console.log('PASS: create → discover → edit → validate → reload → routine → practice');

  // Exercise the signed-in path through mocked Supabase HTTP responses.
  // The configured project is never contacted by this isolated browser context.
  const cloudPage = await browser.newPage();
  const userId = '11111111-1111-4111-8111-111111111111';
  const cloudId = '22222222-2222-4222-8222-222222222222';
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'test@example.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`;
  let cloudExercises = [];
  let failSave = true;
  await cloudPage.route('**/auth/v1/**', route => route.fulfill({ json: { access_token: token, refresh_token: 'test', token_type: 'bearer', expires_in: 3600, user } }));
  await cloudPage.route('**/rest/v1/**', async route => {
    const request = route.request();
    if (request.url().includes('/user_exercises') && request.method() === 'POST') {
      if (failSave) return route.fulfill({ status: 500, json: { message: 'Simulated save failure' } });
      const row = { ...request.postDataJSON(), id: cloudId };
      cloudExercises = [row];
      return route.fulfill({ json: row });
    }
    return route.fulfill({ json: request.url().includes('/user_exercises') ? cloudExercises : [] });
  });
  await cloudPage.goto(`${base}/signin`);
  // Cloud scenario requires the existing configured development build.
  if (await cloudPage.locator('#email').count()) {
    await cloudPage.locator('#email').fill(user.email);
    await cloudPage.locator('#password').fill('test-password');
    await cloudPage.getByRole('button', { name: 'Sign in', exact: true }).click();
    await cloudPage.waitForURL(`${base}/`);
    await cloudPage.goto(`${base}/create`);
    await cloudPage.getByRole('button', { name: '+ Add Exercise', exact: true }).click();
    await cloudPage.locator('#exTitle').fill('Cloud exercise');
    await cloudPage.locator('#exInst').fill('Cloud instructions');
    await cloudPage.getByRole('button', { name: 'Save exercise', exact: true }).click();
    await cloudPage.getByText('Could not save exercise.', { exact: true }).waitFor();
    assert.equal(await cloudPage.locator('#exerciseRows').getByText('Cloud exercise', { exact: true }).count(), 0);
    failSave = false;
    await cloudPage.getByRole('button', { name: 'Save exercise', exact: true }).click();
    await cloudPage.locator('#exerciseRows').getByText('Cloud exercise', { exact: true }).waitFor();
    const draft = await cloudPage.evaluate(id => JSON.parse(localStorage.getItem(`little-jazz-room:create-draft:v1:${id}`)), userId);
    assert.equal(draft.stepExerciseIds.at(-1), cloudId);
    await cloudPage.goto(`${base}/explore`);
    await cloudPage.getByRole('tab', { name: 'Exercises', exact: true }).click();
    await cloudPage.getByRole('button').filter({ hasText: 'Cloud exercise' }).click();
    assert.equal(await cloudPage.locator('#exTitle').inputValue(), 'Cloud exercise');
    await cloudPage.locator('#exTitle').fill('Edited cloud exercise');
    await cloudPage.getByRole('button', { name: 'Save exercise', exact: true }).click();
    await cloudPage.locator('#exerciseRows').getByText('Edited cloud exercise', { exact: true }).waitFor();
    assert.equal(cloudExercises[0].id, cloudId);
    console.log('PASS: mocked cloud failure → retry → server ID → discover → edit');
  } else {
    console.log('SKIP: mocked cloud scenario requires Supabase URL/publishable key configuration');
  }
} finally {
  await browser.close();
}
