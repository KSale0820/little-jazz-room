/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { JAZZ_CATS } from '../features/cats/CatCompanion';
import { approvedDecorativeCatUrl, decorativeCatUrls, PIXEL_MOTIFS, VERIFIED_PIXEL_CATS } from './cleanPixelAssets';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const poses = ['sleeping', 'sitting', 'floor'] as const;
const pixelIds = ['luna', 'maple', 'milo'] as const;

describe('additive clean pixel artwork', () => {
  it('registers exactly three lightweight SVG motifs', () => {
    expect(Object.values(PIXEL_MOTIFS)).toHaveLength(3);
    for (const url of Object.values(PIXEL_MOTIFS)) {
      expect(url).toMatch(/^\/visuals\/pixel-motifs\/.+\.svg$/);
      expect(readFileSync(join(root, 'public', url.slice(1)), 'utf8')).toMatch(/<svg[\s>]/);
    }
  });

  it('ships the three simplified decorative characters without restricting eight companion identities', () => {
    expect(JAZZ_CATS).toHaveLength(8);
    for (const pose of ['sleeping', 'sitting'] as const) {
      expect(Object.keys(VERIFIED_PIXEL_CATS[pose]).sort()).toEqual([...pixelIds].sort());
      for (const id of pixelIds) {
        expect(VERIFIED_PIXEL_CATS[pose][id]).toBe('/visuals/cats/clean-pixel/' + id + '-' + pose + '.png');
      }
    }
    expect(Object.keys(VERIFIED_PIXEL_CATS.floor)).toHaveLength(0);
  });

  it('has six intact 160×160 transparent RGBA PNGs whose pixel streams decompress', () => {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const id of pixelIds) for (const pose of ['sleeping', 'sitting'] as const) {
      const url = VERIFIED_PIXEL_CATS[pose][id]!;
      const file = readFileSync(join(root, 'public', url.slice(1)));
      expect(file.subarray(0, 8).equals(signature), url).toBe(true);
      expect(file.toString('ascii', 12, 16), url).toBe('IHDR');
      const width = file.readUInt32BE(16), height = file.readUInt32BE(20);
      expect([width, height], url).toEqual([160, 160]);
      expect(file[25], url).toBe(6); // PNG RGBA
      let offset = 8;
      const idat: Buffer[] = [];
      let ended = false;
      while (offset + 12 <= file.length) {
        const n = file.readUInt32BE(offset), type = file.toString('ascii', offset + 4, offset + 8);
        expect(offset + 12 + n, url).toBeLessThanOrEqual(file.length);
        if (type === 'IDAT') idat.push(file.subarray(offset + 8, offset + 8 + n));
        offset += n + 12;
        if (type === 'IEND') { ended = true; break; }
      }
      expect(ended, url).toBe(true);
      expect(offset, url).toBe(file.length);
      expect(idat.length, url).toBeGreaterThan(0);
      expect(inflateSync(Buffer.concat(idat)).length, url).toBe((160 * 4 + 1) * 160);
    }
  });

  it('always retains the approved original as fallback for all eight cats', () => {
    for (const cat of JAZZ_CATS) for (const pose of poses) {
      const urls = decorativeCatUrls(cat.id, pose);
      expect(urls.at(-1)).toBe(approvedDecorativeCatUrl(cat.id, pose));
      const pixel = VERIFIED_PIXEL_CATS[pose][cat.id];
      expect(urls[0]).toBe(pixel ?? approvedDecorativeCatUrl(cat.id, pose));
    }
  });
});
