import { describe, expect, it } from 'vitest';
import type { Exercise, Routine } from '../types/content';
import {
  countRoutineFilters, EMPTY_ROUTINE_FILTERS, matchesRoutineFilters, routineFocuses,
} from './routineLibraryFilters';

const routine: Routine = {
  id: 'r1', title: 'Daily Jazz Warm-Up', description: 'Scales and swing rhythm',
  level: 'Beginner', duration_minutes: 20, visibility: 'private',
  steps: [], applicable_instruments: ['Alto Saxophone'],
};
const exercise = { title: 'Pitch center', category: 'Intonation', instructions: 'Play long tones' } as Exercise;

describe('Routine library filters', () => {
  it('finds musician-oriented focuses from real routine and exercise text', () => {
    const focuses = routineFocuses(routine, [exercise]);
    expect(focuses).toContain('Warm-Up');
    expect(focuses).toContain('Intonation');
    expect(focuses).toContain('Rhythm');
    expect(focuses).toContain('Technique');
  });

  it('matches one of the selected focuses and the other selected dimensions', () => {
    const filters = { focus: ['Intonation', 'Repertoire'] as Array<'Intonation' | 'Repertoire'>,
      instrument: 'Sax', duration: '20', level: 'Beginner' };
    expect(matchesRoutineFilters(routine, filters, [exercise])).toBe(true);
    expect(matchesRoutineFilters(routine, { ...filters, instrument: 'Piano' }, [exercise])).toBe(false);
    expect(matchesRoutineFilters(routine, { ...filters, duration: '10' }, [exercise])).toBe(false);
    expect(matchesRoutineFilters(routine, { ...filters, level: 'Advanced' }, [exercise])).toBe(false);
    expect(matchesRoutineFilters(routine, { ...filters, focus: ['Repertoire'] }, [exercise])).toBe(false);
  });

  it('supports instruments marked All and inclusive duration bands', () => {
    const universal = { ...routine, applicable_instruments: ['All'], duration_minutes: 30 };
    expect(matchesRoutineFilters(universal, { ...EMPTY_ROUTINE_FILTERS, instrument: 'Drums', duration: '30' }, [])).toBe(true);
    expect(matchesRoutineFilters(universal, { ...EMPTY_ROUTINE_FILTERS, duration: '46' }, [])).toBe(false);
    expect(countRoutineFilters(EMPTY_ROUTINE_FILTERS)).toBe(0);
    expect(countRoutineFilters({ ...EMPTY_ROUTINE_FILTERS, focus: ['Rhythm'], level: 'Beginner' })).toBe(2);
  });
});
