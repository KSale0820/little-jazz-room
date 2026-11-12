import { describe, expect, it } from 'vitest';
import { seedRoutines } from '../data/seed';
import { ROUTINE_ICON_KEYS, routineIconFor, routineIconPosition } from './routinePixelIcons';

describe('approved routine pixel icon atlas', () => {
  it('contains each of the 24 distinct approved skills', () => {
    expect(ROUTINE_ICON_KEYS).toHaveLength(24);
    expect(new Set(ROUTINE_ICON_KEYS).size).toBe(24);
    expect(routineIconPosition('warm-ups')).toBe('0px 0px');
    expect(routineIconPosition('focused-practice')).toBe('-100px -60px');
  });

  it('matches the core guided routines to their intended music skill', () => {
    expect(routineIconFor('Daily Jazz Warm-Up', 'Warm-Ups')).toBe('warm-ups');
    expect(routineIconFor('Learn a 12-Bar Blues', 'Standards & Repertoire')).toBe('12-bar-blues');
    expect(routineIconFor('Connect Three Common Jazz Chords', 'Harmony & Chords')).toBe('ii-v-i');
    expect(routineIconFor('Leave Space When Playing Chords', 'Harmony & Chords')).toBe('comping');
    expect(routineIconFor('Train Your Ear: Hear and Sing Notes', 'Ear Training')).toBe('ear-training');
    expect(routineIconFor('Get Comfortable with Jazz Song Forms', 'Standards & Repertoire')).toBe('standards');
  });

  it('maps every seeded routine to an icon in the uploaded sprite', () => {
    for (const routine of seedRoutines) {
      expect(ROUTINE_ICON_KEYS).toContain(routineIconFor(routine.title, 'Other Practice'));
    }
    expect(routineIconFor('My completely new routine', 'Other Practice')).toBe('focused-practice');
  });
});
