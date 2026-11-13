import { describe, expect, it } from 'vitest';
import type { Exercise, PracticeSessionRecord, Routine } from '../types/content';
import { progressSessionIcon } from './progressSessionIcons';

const makeExercise = (id: string, title: string, category: string) => ({ id, title, category }) as Exercise;
const makeSession = (fields: Partial<PracticeSessionRecord> = {}): PracticeSessionRecord =>
  ({ id: 'session', finishedAt: new Date().toISOString(), durationSeconds: 1200, ...fields });
const makeRoutine = (title: string, stepIds: string[]): Routine => ({
  id: 'routine-1', title, steps: stepIds.map(exercise_id => ({ exercise_id, duration_minutes: 10 })),
  level: 'Intermediate', duration_minutes: 30, visibility: 'Private', applicable_instruments: ['Piano'],
});

describe('Recent Practice icons', () => {
  const exercises = [
    makeExercise('tones', 'Blue Hour Guide Tones', 'Harmony'),
    makeExercise('phrases', 'Four-Bar Call and Response', 'Improvisation'),
    makeExercise('warmup', 'Slow, Steady Warm-Up', 'Technique'),
  ];
  const routines = [makeRoutine('My Evening Jazz Session', ['warmup', 'tones', 'phrases'])];

  it('matches the subject of the original exercise', () => {
    expect(progressSessionIcon(makeSession({ exerciseId: 'tones' }), routines, exercises)).toBe('chord-connections');
    expect(progressSessionIcon(makeSession({ exerciseId: 'phrases' }), routines, exercises)).toBe('call-and-response');
  });
  it('shares the originating routine icon with the Routine Library', () => {
    expect(progressSessionIcon(makeSession({ routineId: 'routine-1' }), routines, exercises)).toBe('scales');
  });
  it('uses the stored title after a routine is deleted', () => {
    expect(progressSessionIcon(makeSession({ routineId: 'deleted', routineTitle: 'Blues Soloing' }), [], exercises)).toBe('soloing');
  });
  it('uses generic music for free practice and deleted exercise references', () => {
    expect(progressSessionIcon(makeSession(), routines, exercises)).toBeNull();
    expect(progressSessionIcon(makeSession({ exerciseId: 'deleted' }), routines, exercises)).toBeNull();
  });
});
