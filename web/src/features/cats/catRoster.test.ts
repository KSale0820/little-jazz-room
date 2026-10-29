import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JAZZ_CATS } from './CatCompanion';

const repoRoot = resolve(__dirname, '../../../..');
const publicDir = resolve(__dirname, '../../../public/jazz-cat-assets');
const readJson = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;

interface ManifestCat {
  id: string;
  name: string;
  coat: string;
  age: string;
  build: string;
  character: string;
  instrument: string;
}

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

describe('cat roster', () => {
  it('keeps the eight approved identities and instruments', () => {
    expect(JAZZ_CATS.map(c => [c.id, c.instrument])).toEqual(EXPECTED);
  });

  it('matches the asset manifest (public/jazz-cat-assets/cats.json)', () => {
    const manifest = readJson<ManifestCat[]>(resolve(publicDir, 'cats.json'));
    expect(manifest.map(m => m.id)).toEqual(JAZZ_CATS.map(c => c.id));
    for (const cat of JAZZ_CATS) {
      const m = manifest.find(x => x.id === cat.id)!;
      expect({ name: m.name, coat: m.coat, age: m.age, build: m.build, personality: m.character, instrument: m.instrument }).toEqual({
        name: cat.name,
        coat: cat.coat,
        age: cat.age,
        build: cat.build,
        personality: cat.personality,
        instrument: cat.instrument,
      });
    }
  });

  it('matches the role table (CAT-JAZZ-IDENTITIES.json)', () => {
    const roles = readJson<{ id: string; instrument: string }[]>(resolve(repoRoot, 'CAT-JAZZ-IDENTITIES.json'));
    expect(roles.map(r => [r.id, r.instrument])).toEqual(JAZZ_CATS.map(c => [c.id, c.instrument]));
  });

  it('has portrait, full-body and svg art installed for every cat', () => {
    for (const cat of JAZZ_CATS) {
      for (const file of [`${cat.id}-portrait.png`, `${cat.id}.png`, `${cat.id}.svg`]) {
        expect(existsSync(resolve(publicDir, file)), file).toBe(true);
      }
    }
  });
});
