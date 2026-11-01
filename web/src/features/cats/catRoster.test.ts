import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JAZZ_CATS } from './CatCompanion';
import { VISUAL_ASSETS } from '../../assets/visualManifest';

const repoRoot = resolve(__dirname, '../../../..');
const publicDir = resolve(__dirname, '../../../public');
const approvedDir = resolve(publicDir, 'visuals/cats/approved-class-mvp');
const variants = ['full-body', 'profiles', 'closeups'] as const;
const readJson = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;

const EXPECTED = [
  ['luna', 'Piano'],
  ['milo', 'Tenor saxophone'],
  ['maple', 'Upright bass'],
  ['mochi', 'Drums'],
  ['pepper', 'Trumpet'],
  ['patches', 'Jazz guitar'],
  ['chai', 'Vocals'],
  ['biscuit', 'Turntables / listening'],
];

describe('approved class MVP cat roster', () => {
  it('keeps the eight approved identities and instruments', () => {
    expect(JAZZ_CATS.map(c => [c.id, c.instrument])).toEqual(EXPECTED);
  });

  it('matches the original instrument role table', () => {
    const roles = readJson<{ id: string; instrument: string }[]>(resolve(repoRoot, 'CAT-JAZZ-IDENTITIES.json'));
    expect(roles.map(r => [r.id, r.instrument])).toEqual(JAZZ_CATS.map(c => [c.id, c.instrument]));
  });

  it('has all 24 new approved PNG binaries with valid PNG headers', () => {
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const variant of variants) {
      for (const cat of JAZZ_CATS) {
        const file = resolve(approvedDir, variant, `${cat.id}.png`);
        expect(existsSync(file), file).toBe(true);
        const bytes = readFileSync(file);
        expect(bytes.subarray(0, 8).equals(pngSignature), file).toBe(true);
        expect(bytes.readUInt32BE(16), file).toBeGreaterThan(0);
        expect(bytes.readUInt32BE(20), file).toBeGreaterThan(0);
      }
    }
  });

  it('uses exclusively the new artwork paths', () => {
    for (const cat of JAZZ_CATS) {
      expect(VISUAL_ASSETS.cat.fullBodyFile(cat.id)).toBe(`/visuals/cats/approved-class-mvp/full-body/${cat.id}.png`);
      expect(VISUAL_ASSETS.cat.profileFile(cat.id)).toBe(`/visuals/cats/approved-class-mvp/profiles/${cat.id}.png`);
      expect(VISUAL_ASSETS.cat.closeupFile(cat.id)).toBe(`/visuals/cats/approved-class-mvp/closeups/${cat.id}.png`);
    }
    expect(existsSync(resolve(publicDir, 'jazz-cat-assets'))).toBe(false);
    for (const variant of variants) {
      expect(existsSync(resolve(publicDir, 'visuals/cats', variant))).toBe(false);
    }
  });
});
