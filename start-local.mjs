/**
 * Little Jazz Room: one-command local launcher (Mac, Windows, and Linux).
 * From the repository's top-level folder, run: node start-local.mjs
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const web = join(root, 'web');
const windows = process.platform === 'win32';
const npm = windows ? 'npm.cmd' : 'npm';
const npmOptions = { cwd: web, stdio: 'inherit', shell: windows };

function fail(message) {
  console.error('\nCould not start Little Jazz Room: ' + message + '\n');
  process.exit(1);
}

if (!existsSync(join(web, 'package.json'))) {
  fail('The web/ folder is missing. Run this file from the complete Little Jazz Room repository.');
}

const [major, minor] = process.versions.node.split('.').map(Number);
const supportedNode = (major === 20 && minor >= 19)
  || (major === 22 && minor >= 12)
  || major >= 24;
if (!supportedNode) {
  fail('Node.js ' + process.versions.node +
    ' is too old or unsupported. Install Node.js 24 LTS from https://nodejs.org/ and restart the terminal.');
}

const npmCheck = spawnSync(npm, ['--version'], {
  cwd: web,
  encoding: 'utf8',
  shell: windows,
  windowsHide: true,
});
if (npmCheck.error || npmCheck.status !== 0) {
  fail('npm was not found. Reinstall Node.js LTS from https://nodejs.org/, then reopen the terminal.');
}

console.log('\n🎹 Little Jazz Room');
console.log('-------------------');
console.log('Node.js ' + process.versions.node + ' detected.');

const viteBinary = join(web, 'node_modules', '.bin', windows ? 'vite.cmd' : 'vite');
if (!existsSync(viteBinary)) {
  console.log('\nFirst run: installing the app dependencies. Internet access is needed for this step.');
  const install = spawnSync(npm, ['ci'], npmOptions);
  if (install.error || install.status !== 0) {
    fail('Installation failed. Check the messages above, then see README.md > Troubleshooting.');
  }
}

console.log('\nStarting your local app. Your browser should open automatically.');
console.log('If it does not, visit the Local: address shown below (usually http://localhost:5173/).');
console.log('Keep this terminal window open. Press Ctrl+C here to stop the app.\n');

const app = spawn(npm, ['run', 'dev', '--', '--host', '127.0.0.1', '--open'], npmOptions);
app.on('error', error => fail('Could not launch npm: ' + error.message));
app.on('exit', (code, signal) => {
  if (signal) return;
  process.exitCode = code ?? 0;
});
