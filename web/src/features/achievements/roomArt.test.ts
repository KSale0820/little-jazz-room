import { describe, expect, it } from 'vitest';
import { ROOM_ART, ROOM_ATLAS, ROOM_CANVAS } from './roomArt';
import { ACHIEVEMENTS, unlockedRoomItems } from './achievementModel';

describe('approved achievements room layout', () => {
  it('has 24 decorations plus all six unique Luna/Milo/Maple poses', () => {
    expect(ROOM_ART).toHaveLength(30);
    expect(new Set(ROOM_ART.map(item => item.id)).size).toBe(30);
    expect(ROOM_ART.filter(item => item.catImage).map(item => item.id)).toEqual([
      'luna-sitting', 'luna', 'milo', 'milo-sleeping', 'maple', 'maple-sleeping',
    ]);
  });

  it('fits each sprite inside the atlas and keeps saved scene coordinates finite', () => {
    for (const item of ROOM_ART) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.width).toBeGreaterThan(0);
      expect(item.height).toBeGreaterThan(0);
      expect(item.x + item.width).toBeLessThanOrEqual(ROOM_CANVAS.width);
      expect(item.y + item.height).toBeLessThanOrEqual(ROOM_CANVAS.height);
      if (item.atlas) {
        expect(item.atlas.x + item.atlas.width).toBeLessThanOrEqual(ROOM_ATLAS.width);
        expect(item.atlas.y + item.atlas.height).toBeLessThanOrEqual(ROOM_ATLAS.height);
      }
    }
  });

  it('keeps eight original practice milestones and lets starter art appear without earning rewards', () => {
    expect(ACHIEVEMENTS).toHaveLength(8);
    const starter = unlockedRoomItems([]);
    expect(starter).toContain('curtain-left');
    expect(starter).toContain('luna-sitting');
    expect(starter).not.toContain('milo');
    expect(starter).not.toContain('maple');
    expect(unlockedRoomItems(['first-hour'])).toContain('milo-sleeping');
    expect(unlockedRoomItems(['five-hours'])).toContain('maple-sleeping');
  });
});