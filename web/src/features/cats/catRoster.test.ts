import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JAZZ_CATS } from './CatCompanion';
import { VISUAL_ASSETS, isRedesignedCat } from '../../assets/visualManifest';

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

  it('has valid new pixel sprites for three cats and original art for the other five', () => {
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const cat of JAZZ_CATS) {
      if (isRedesignedCat(cat.id)) {
        for (const pose of ['sitting', 'sleeping']) {
          const file = resolve(publicDir, 'visuals/cats/clean-pixel', `${cat.id}-${pose}.png`);
          expect(existsSync(file), file).toBe(true);
          const bytes = readFileSync(file);
          expect(bytes.subarray(0, 8).equals(pngSignature), file).toBe(true);
          expect(bytes.readUInt32BE(16), file).toBe(1254);
          expect(bytes.readUInt32BE(20), file).toBe(1254);
        }
        for (const variant of [...variants, 'sitting'])
          expect(existsSync(resolve(approvedDir, variant, `${cat.id}.png`))).toBe(false);
        expect(existsSync(resolve(publicDir, 'visuals/cats/sleeping', `${cat.id}.png`))).toBe(false);
      } else {
        for (const variant of [...variants, 'sitting']) {
          const file = resolve(approvedDir, variant, `${cat.id}.png`);
          expect(existsSync(file), file).toBe(true);
          const bytes = readFileSync(file);
          expect(bytes.subarray(0, 8).equals(pngSignature), file).toBe(true);
          expect(bytes.readUInt32BE(16), file).toBeGreaterThan(0);
          expect(bytes.readUInt32BE(20), file).toBeGreaterThan(0);
        }
      }
    }
  });

  it('resolves the replacement art without old artwork fallbacks', () => {
    for (const cat of JAZZ_CATS) {
      if (isRedesignedCat(cat.id)) {
        const sitting = `/visuals/cats/clean-pixel/${cat.id}-sitting.png`;
        expect(VISUAL_ASSETS.cat.fullBodyFile(cat.id)).toBe(sitting);
        expect(VISUAL_ASSETS.cat.profileFile(cat.id)).toBe(sitting);
        expect(VISUAL_ASSETS.cat.closeupFile(cat.id)).toBe(sitting);
        expect(VISUAL_ASSETS.cat.sittingFile(cat.id)).toBe(sitting);
        expect(VISUAL_ASSETS.cat.sleepingFile(cat.id)).toBe(`/visuals/cats/clean-pixel/${cat.id}-sleeping.png`);
      } else {
        expect(VISUAL_ASSETS.cat.fullBodyFile(cat.id)).toBe(`/visuals/cats/approved-class-mvp/full-body/${cat.id}.png`);
        expect(VISUAL_ASSETS.cat.profileFile(cat.id)).toBe(`/visuals/cats/approved-class-mvp/profiles/${cat.id}.png`);
        expect(VISUAL_ASSETS.cat.closeupFile(cat.id)).toBe(`/visuals/cats/approved-class-mvp/closeups/${cat.id}.png`);
      }
    }
    expect(existsSync(resolve(publicDir, 'jazz-cat-assets'))).toBe(false);
    for (const variant of variants)
      expect(existsSync(resolve(publicDir, 'visuals/cats', variant))).toBe(false);
  });

});
