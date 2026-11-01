import { spawn } from 'node:child_process';
import { test, expect } from 'vitest';

/**
 * Browser QA runs on the dedicated P02 PR or by explicit local opt-in.
 * It is isolated from other agents' branches and does not alter shared CI.
 */
const enabled = process.env.GITHUB_HEAD_REF === 'class-demo-p02'
  || process.env.RUN_P02_BROWSER_QA === '1';

test.skipIf(!enabled)('P02/P06 real Chrome flows and two-size captures', async () => {
  const baseUrl = 'http://127.0.0.1:5291';
  const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5291', '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });

  try {
    let ready = false;
    for (let i = 0; i < 50; i++) {
      try {
        const response = await fetch(baseUrl);
        if (response.ok) { ready = true; break; }
      } catch { /* server still starting */ }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    expect(ready, 'Vite server did not start').toBe(true);

    const exitCode = await new Promise<number>((resolve, reject) => {
      const browserCheck = spawn('node', ['src/pages/practicePlayer.browser.mjs'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          APP_URL: baseUrl,
          PW_CHANNEL: process.env.PW_CHANNEL ?? 'chrome',
          P02_OUTPUT_LOG: process.env.P02_OUTPUT_LOG ?? '1',
        },
        stdio: 'inherit',
      });
      browserCheck.once('error', reject);
      browserCheck.once('exit', code => resolve(code ?? 1));
    });
    expect(exitCode, 'Real browser P02/P06 verification failed').toBe(0);
  } finally {
    server.kill('SIGTERM');
  }
}, 150_000);
