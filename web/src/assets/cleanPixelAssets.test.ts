import { describe, expect, it } from 'vitest';
import { JAZZ_CATS } from '../features/cats/CatCompanion';
import { approvedDecorativeCatUrl, decorativeCatUrls, PIXEL_MOTIFS, VERIFIED_PIXEL_CATS } from './cleanPixelAssets';

const poses = ['sleeping', 'sitting', 'floor'] as const;

describe('additive clean pixel artwork', () => {
  it('ships three theme-neutral geometric SVG motifs', () => {
    expect(Object.values(PIXEL_MOTIFS)).toHaveLength(3);
    for (const url of Object.values(PIXEL_MOTIFS)) expect(url).toMatch(/\.svg$/);
  });
  it('preserves approved art as fallback for all eight companions and existing poses', () => {
    for (const cat of JAZZ_CATS) {
      for (const pose of poses) {
        const urls = decorativeCatUrls(cat.id, pose);
        expect(urls.at(-1)).toBe(approvedDecorativeCatUrl(cat.id, pose));
        const pixel = VERIFIED_PIXEL_CATS[pose][cat.id];
        expect(urls[0]).toBe(pixel ?? approvedDecorativeCatUrl(cat.id, pose));
      }
    }
  });
});
