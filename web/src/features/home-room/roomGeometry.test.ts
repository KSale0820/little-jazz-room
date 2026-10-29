import { describe, expect, it } from 'vitest';
import {
  ROOM_ART_HEIGHT,
  ROOM_ART_WIDTH,
  ROOM_ZONES,
  computeImageLayout,
  computeRoomFrame,
  visibleZones,
  zoneVisibleFraction,
} from './roomGeometry';

describe('computeImageLayout', () => {
  it('matches object-fit: cover with centered position', () => {
    const l = computeImageLayout(1440, 800, 1000, 800, 0.5, 0.5);
    expect(l.scale).toBeCloseTo(1);
    expect(l.width).toBeCloseTo(1440);
    expect(l.left).toBeCloseTo(-220);
    expect(l.top).toBeCloseTo(0);
  });

  it('keeps the art aspect ratio', () => {
    const l = computeImageLayout(1440, 800, 390, 338, 0.2, 0);
    expect(l.width / l.height).toBeCloseTo(ROOM_ART_WIDTH / ROOM_ART_HEIGHT);
  });
});

describe('zones', () => {
  it('are normalized and inside the art', () => {
    for (const z of ROOM_ZONES) {
      expect(z.x).toBeGreaterThanOrEqual(0);
      expect(z.y).toBeGreaterThanOrEqual(0);
      expect(z.x + z.w).toBeLessThanOrEqual(1);
      expect(z.y + z.h).toBeLessThanOrEqual(1);
    }
  });

  it.each([
    [375, 560],
    [390, 640],
    [430, 700],
    [768, 900],
    [1000, 800],
  ])('every zone is visible at %i x %i', (cw, ch) => {
    const frame = computeRoomFrame(cw, ch);
    const ids = visibleZones(frame.layout, cw, frame.artHeight).map(z => z.id).sort();
    expect(ids).toEqual(['notebook', 'piano', 'plants', 'stand']);
  });

  it('drops zones that are cropped out', () => {
    const l = computeImageLayout(1440, 800, 300, 800, 0, 0);
    const notebook = ROOM_ZONES.find(z => z.id === 'notebook')!;
    expect(zoneVisibleFraction(notebook, l, 300, 800)).toBe(0);
    expect(visibleZones(l, 300, 800).some(z => z.id === 'notebook')).toBe(false);
  });
});

describe('computeRoomFrame', () => {
  it('uses a compact composition under 900px and the wide one above', () => {
    expect(computeRoomFrame(390, 700).mode).toBe('compact');
    expect(computeRoomFrame(1000, 800).mode).toBe('wide');
  });
});
