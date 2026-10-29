import { describe, expect, it } from 'vitest';
import {
  ROOM_ART_HEIGHT,
  ROOM_ART_WIDTH,
  ROOM_ZONES,
  computeImageLayout,
  computeRoomFrame,
  scrollLeftForZone,
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
    [375, 450],
    [390, 540],
    [390, 400],
    [1000, 780],
  ])('every zone is reachable at %i x %i', (cw, ch) => {
    const frame = computeRoomFrame(cw, ch);
    const ids = visibleZones(frame.layout, frame.contentWidth, frame.contentHeight).map(z => z.id).sort();
    expect(ids).toEqual(['notebook', 'piano', 'plants', 'stand']);
  });

  it('never stretches the art on phones and keeps the piano on screen at first view', () => {
    const frame = computeRoomFrame(390, 540);
    expect(frame.layout.width / frame.layout.height).toBeCloseTo(ROOM_ART_WIDTH / ROOM_ART_HEIGHT);
    expect(frame.layout.height).toBeCloseTo(540);
    const piano = ROOM_ZONES.find(z => z.id === 'piano')!;
    const x0 = piano.x * frame.layout.width - frame.initialScrollLeft;
    const x1 = (piano.x + piano.w) * frame.layout.width - frame.initialScrollLeft;
    expect(x0).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThanOrEqual(390);
  });

  it('scrolls to centre a zone and clamps at the edges', () => {
    const frame = computeRoomFrame(390, 540);
    const notebook = ROOM_ZONES.find(z => z.id === 'notebook')!;
    const left = scrollLeftForZone(notebook, frame.layout, 390);
    expect(left).toBeLessThanOrEqual(frame.layout.width - 390);
    expect(left).toBeGreaterThan(frame.initialScrollLeft);
    const plants = ROOM_ZONES.find(z => z.id === 'plants')!;
    expect(scrollLeftForZone(plants, frame.layout, 390)).toBeGreaterThanOrEqual(0);
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
    expect(computeRoomFrame(390, 540).mode).toBe('compact');
    expect(computeRoomFrame(1000, 800).mode).toBe('wide');
  });
});
