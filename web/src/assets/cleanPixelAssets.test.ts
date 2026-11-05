/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { JAZZ_CATS } from '../features/cats/CatCompanion';
import { approvedDecorativeCatUrl, decorativeCatUrls, PIXEL_MOTIFS, VERIFIED_PIXEL_CATS } from './cleanPixelAssets';

const poses = ['sleeping', 'sitting', 'floor'] as const;
const featured = ['luna', 'maple', 'milo'] as const;
const publicVisuals = join(dirname(fileURLToPath(import.meta.url)), '../../public/visuals');

describe('additive clean pixel artwork', () => {
  it('registers three theme-neutral pixel motifs', () => {
    expect(Object.values(PIXEL_MOTIFS)).toHaveLength(3);
    for (const url of Object.values(PIXEL_MOTIFS)) expect(url).toMatch(/\.svg$/);
  });

  it('uses only the three approved simplified decorative identities without changing the full roster', () => {
    expect(JAZZ_CATS).toHaveLength(8);
    for (const pose of ['sleeping', 'sitting'] as const) {
      expect(Object.keys(VERIFIED_PIXEL_CATS[pose]).sort()).toEqual([...featured].sort());
      for (const id of featured) {
        expect(VERIFIED_PIXEL_CATS[pose][id]).toBe(`/visuals/cats/clean-pixel/${id}-${pose}.png`);
      }
    }
    expect(Object.keys(VERIFIED_PIXEL_CATS.floor)).toHaveLength(0);
  });

  it('retains every original companion image as the last-resort fallback', () => {
    for (const cat of JAZZ_CATS) {
      for (const pose of poses) {
        const urls = decorativeCatUrls(cat.id, pose);
        expect(urls.at(-1)).toBe(approvedDecorativeCatUrl(cat.id, pose));
        expect(urls[0]).toBe(VERIFIED_PIXEL_CATS[pose][cat.id] ?? approvedDecorativeCatUrl(cat.id, pose));
      }
    }
  });

  it('ships six fully decodable transparent PNGs rather than broken or empty files', () => {
    for (const id of featured) {
      for (const pose of ['sleeping', 'sitting'] as const) {
        const url = VERIFIED_PIXEL_CATS[pose][id]!;
        const bytes = readFileSync(join(publicVisuals, url.replace('/visuals/', '')));
        expect(bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))).toBe(true);
        expect(bytes.toString('ascii', 12, 16)).toBe('IHDR');
        expect(bytes.readUInt32BE(16)).toBe(160);
        expect(bytes.readUInt32BE(20)).toBe(160);
        expect(bytes[25]).toBe(6); // 8-bit RGBA, transparent background
        const idat: Buffer[] = [];
        let offset = 8;
        let reachedEnd = false;
        while (offset + 12 <= bytes.length) {
          const length = bytes.readUInt32BE(offset);
          const end = offset + 12 + length;
          expect(end).toBeLessThanOrEqual(bytes.length);
          const type = bytes.toString('ascii', offset + 4, offset + 8);
          if (type === 'IDAT') idat.push(bytes.subarray(offset + 8, offset + 8 + length));
          if (type === 'IEND') { reachedEnd = true; expect(end).toBe(bytes.length); break; }
          offset = end;
        }
        expect(reachedEnd).toBe(true);
        const pixels = inflateSync(Buffer.concat(idat));
        expect(pixels.length).toBe(160 * (1 + 160 * 4));
      }
    }
  });
});
