import { describe, expect, it } from 'vitest';
import { ROOM_ART, ROOM_ATLAS, ROOM_CANVAS, shouldRenderRoomItem, ROOM_CAT_ITEMS } from './roomArt';
import { ACHIEVEMENTS, unlockedRoomItems } from './achievementModel';
import { readRoomPreferences } from './roomStore';

describe('approved achievements room layout', () => {
  it('uses short display names and an unnamed structural shelf', () => {
    expect(ROOM_ART.find(item => item.id === 'wall-shelves')?.label).toBe('');
    expect(ROOM_ART.find(item => item.id === 'piano-lamp')?.spriteImage)
      .toBe('/achievements/piano-lamp-no-halo.png');
    for (const item of ROOM_ART.filter(item => item.id !== 'wall-shelves')) {
      expect(item.label).toBeTruthy();
      expect(item.label).not.toMatch(/^\\d|\\bshadow\\b|\\bexact location\\b|\\(clean pixel\\)/i);
    }
  });

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
    expect(starter).not.toContain('curtain-left');
    expect(starter).not.toContain('curtain-right');
    expect(starter).not.toContain('couch');
    expect(unlockedRoomItems(['three-days'])).toContain('curtain-left');
    expect(unlockedRoomItems(['first-notes'])).toContain('couch');
    expect(starter).toContain('luna-sitting');
    expect(starter).toContain('luna');
    expect(ROOM_ART.find(item => item.id === 'luna-sitting')?.y).toBe(387);
    expect(starter).not.toContain('milo');
    expect(starter).not.toContain('maple');
    expect(unlockedRoomItems(['first-hour'])).toContain('milo-sleeping');
    expect(unlockedRoomItems(['five-hours'])).toContain('maple-sleeping');
  });
  it('shows no more than one cat pose per companion, including full preview', () => {
    const preferences = readRoomPreferences('test', null);
    const unlocked = unlockedRoomItems(['first-hour', 'five-hours']);
    for (const cat of ['luna', 'milo', 'maple'] as const) {
      const poses = ROOM_CAT_ITEMS[cat];
      expect([poses.sitting, poses.sleeping]
        .filter(id => shouldRenderRoomItem(id, unlocked, preferences))).toHaveLength(1);
      expect([poses.sitting, poses.sleeping]
        .filter(id => shouldRenderRoomItem(id, unlocked, preferences, true))).toHaveLength(1);
    }
    preferences.catPoses = { luna: 'sleeping', milo: 'sleeping', maple: 'sleeping' };
    for (const cat of ['luna', 'milo', 'maple'] as const) {
      const poses = ROOM_CAT_ITEMS[cat];
      expect(shouldRenderRoomItem(poses.sitting, unlocked, preferences, true)).toBe(false);
      expect(shouldRenderRoomItem(poses.sleeping, unlocked, preferences, true)).toBe(true);
    }
    expect(shouldRenderRoomItem('couch', unlockedRoomItems([]), preferences)).toBe(false);
    expect(shouldRenderRoomItem('couch', unlockedRoomItems([]), preferences, true)).toBe(true);
  });

});