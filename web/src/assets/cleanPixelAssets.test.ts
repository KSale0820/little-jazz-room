/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { ALL_JAZZ_CATS, JAZZ_CATS } from '../features/cats/CatCompanion';
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

  it('ships three current pixel characters while archiving eight original identities', () => {
    expect(JAZZ_CATS).toHaveLength(3);
    expect(ALL_JAZZ_CATS).toHaveLength(8);
    for (const pose of ['sleeping', 'sitting'] as const) {
      expect(Object.keys(VERIFIED_PIXEL_CATS[pose]).sort()).toEqual([...pixelIds].sort());
      for (const id of pixelIds) {
        expect(VERIFIED_PIXEL_CATS[pose][id]).toBe('/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/' + id + '-' + pose + '.png');
      }
    }
    expect(Object.keys(VERIFIED_PIXEL_CATS.floor)).toHaveLength(0);
  });

  it('has the six exact owner-supplied 1254×1254 transparent RGBA artworks', () => {
    const approvedSha256: Record<string, string> = {
      'milo-sitting': 'f97e0a424efb16a9ee92dc46331d1b834c31b08d6f19ae2fd269f62d01f9c01e',
      'milo-sleeping': '689238c8cedd3f0a7ed8fa4ed18083082fe529609cd61aa0143cf98c403c5b2b',
      'maple-sitting': '2dcbef909a81f37d6186f6095c040bbe01d7d38f2dc24ec6f8a1112b2fdc5d88',
      'maple-sleeping': 'ba0ef7f735185dc245a2ad9103b831d217073445a9eccd9be0e32714f7083e11',
      'luna-sitting': 'a6b6e39ce96b8697a781b9004be4db29d97a2f65a47c3cf29367bfc12e02bb9f',
      'luna-sleeping': 'ac6045ca7cc2c403de5b08f33df5de87cd42a477da748cf18d3ea5378e056a4c',
    };
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const id of pixelIds) for (const pose of ['sleeping', 'sitting'] as const) {
      const url = VERIFIED_PIXEL_CATS[pose][id]!;
      const file = readFileSync(join(root, 'public', url.slice(1)));
      expect(file.subarray(0, 8).equals(signature), url).toBe(true);
      expect(file.toString('ascii', 12, 16), url).toBe('IHDR');
      const width = file.readUInt32BE(16), height = file.readUInt32BE(20);
      expect([width, height], url).toEqual([1254, 1254]);
      expect(createHash('sha256').update(file).digest('hex'), url).toBe(approvedSha256[`${id}-${pose}`]);
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
      expect(inflateSync(Buffer.concat(idat)).length, url).toBe((1254 * 4 + 1) * 1254);
    }
  });

  it('retains original legacy paths in archival asset helpers without rendering them', () => {
    for (const cat of ALL_JAZZ_CATS) for (const pose of poses) {
      const urls = decorativeCatUrls(cat.id, pose);
      expect(urls.at(-1)).toBe(approvedDecorativeCatUrl(cat.id, pose));
      const pixel = VERIFIED_PIXEL_CATS[pose][cat.id];
      expect(urls[0]).toBe(pixel ?? approvedDecorativeCatUrl(cat.id, pose));
    }
  });
});
