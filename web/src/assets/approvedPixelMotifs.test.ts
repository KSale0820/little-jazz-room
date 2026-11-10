/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APPROVED_PIXEL_MOTIFS, PIXEL_MOTIFS } from './cleanPixelAssets';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const readVisual = (url: string) => readFileSync(join(root, 'public', url.slice(1)));

describe('approved full-color pixel motifs', () => {
  it('maps 18 approved transparent sprites and retains the three original SVG theme masks', () => {
    expect(Object.keys(APPROVED_PIXEL_MOTIFS)).toHaveLength(18);
    expect(new Set(Object.values(APPROVED_PIXEL_MOTIFS)).size).toBe(18);
    expect(Object.keys(PIXEL_MOTIFS)).toHaveLength(3);
    for (const url of Object.values(PIXEL_MOTIFS)) {
      expect(url).toMatch(/\.svg$/);
      expect(readVisual(url).toString('utf8')).toMatch(/<svg[\s>]/);
    }
  });
  it('ships small indexed PNG files with transparent pixel edges', () => {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    for (const [key, url] of Object.entries(APPROVED_PIXEL_MOTIFS)) {
      expect(url).toBe('/visuals/pixel-motifs/approved/' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + '.png');
      const bytes = readVisual(url);
      expect(bytes.subarray(0, 8).equals(signature), key).toBe(true);
      expect(bytes.toString('ascii', 12, 16), key).toBe('IHDR');
      expect(bytes.readUInt32BE(16), key).toBeGreaterThanOrEqual(8);
      expect(bytes.readUInt32BE(20), key).toBeGreaterThanOrEqual(8);
      expect(bytes[25], key).toBe(3); // indexed PNG
      expect(bytes.includes(Buffer.from('tRNS')), key).toBe(true);
      expect(bytes.includes(Buffer.from('IEND')), key).toBe(true);
      expect(bytes.length, key).toBeLessThan(3000);
    }
  });
  it('registers the final polished standard-note-flags staff wave', () => {
    expect(APPROVED_PIXEL_MOTIFS.staffWave).toBe('/visuals/pixel-motifs/approved/staff-wave.png');
    expect(readVisual(APPROVED_PIXEL_MOTIFS.staffWave).readUInt32BE(16)).toBe(160);
  });
});
