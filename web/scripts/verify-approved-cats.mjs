import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const cats = ['luna', 'milo', 'maple', 'mochi', 'pepper', 'patches', 'chai', 'biscuit'];
const variants = ['full-body', 'profiles', 'closeups'];
const root = join(process.cwd(), 'public', 'visuals', 'cats', 'approved-class-mvp');
const failures = [];
for (const variant of variants) {
  for (const cat of cats) {
    const file = join(root, variant, cat + '.png');
    if (!existsSync(file)) {
      failures.push('Missing: ' + file);
      continue;
    }
    const bytes = readFileSync(file);
    const pngSignature = Buffer.from([137,80,78,71,13,10,26,10]);
    if (!bytes.subarray(0,8).equals(pngSignature)) {
      failures.push('Not a PNG: ' + file);
      continue;
    }
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    if (width < 500 || height < 500) failures.push('Unexpected dimensions: ' + file);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Approved class-MVP cat assets: all 24 files present and validated.');
}
