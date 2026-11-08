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
    // Pin the Git blob identities of the newly approved PR #84 files. This is
    // deliberately separate from the archived six original PNG checks.
    const approvedGitBlobSha1: Record<string, string> = {
      'luna-sitting': '93afff480a61f949964eddb8b1431281c38e066d',
      'luna-sleeping': '338f59050c8d994c77d39583107c1a4b08ff5121',
      'maple-sitting': '85b72fb887ef3bfed302b987584f6cd092b47f4e',
      'maple-sleeping': '4305cf15d2b644bec580820550f27b551c1cbfe8',
      'milo-sitting': '240c2d325cfcc20d835a6a878e74e5da1323cbaf',
      'milo-sleeping': '63183eee8d37937378ac06c5e83fd1a8382e02d5',
    };
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const id of pixelIds) for (const pose of ['sleeping', 'sitting'] as const) {
      const url = VERIFIED_PIXEL_CATS[pose][id]!;
      const file = readFileSync(join(root, 'public', url.slice(1)));
      expect(file.subarray(0, 8).equals(signature), url).toBe(true);
      expect(file.toString('ascii', 12, 16), url).toBe('IHDR');
      const width = file.readUInt32BE(16), height = file.readUInt32BE(20);
      expect([width, height], url).toEqual([1254, 1254]);
      expect(createHash('sha1').update(`blob ${file.length}\0`).update(file).digest('hex'), url).toBe(approvedGitBlobSha1[`${id}-${pose}`]);
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
