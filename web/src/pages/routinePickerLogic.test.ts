import { afterEach, describe, expect, it, vi } from 'vitest';
import { seedExercises, seedRoutines } from '../data/seed';
import { createLocalRepository, mergeExercises, mergeRoutines, routineDurationFromSteps } from '../repository/localRepository';
import type { Exercise, LocalRoutine, Routine } from '../types/content';
import { appendBuilderExercise, previewRoutineImport, searchCatalogExercises, searchCatalogRoutines, snapshotExerciseId } from './routinePickerLogic';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
}

afterEach(() => vi.unstubAllGlobals());

describe('beginner routine text and stable seed references', () => {
  it('gives each beginner exercise a concrete goal and sequenced directions', () => {
    for (const exercise of seedExercises.filter(item => item.level === 'Beginner')) {
      expect(exercise.instructions).toContain('1.');
      expect(exercise.instructions).toContain('2.');
      expect(exercise.instructions).toContain('Goal:');
    }
    const guideTones = seedExercises.find(item => item.id === 'thirds-sevenths');
    expect(guideTones?.title).toBe('Practice the Important Notes in Each Chord');
    expect(guideTones?.instructions).toContain('F and C');
    expect(guideTones?.instructions).toContain('B and F');
    expect(guideTones?.instructions).toContain('E and B');
    expect(seedExercises.find(item => item.id === 'seventh-arpeggios')?.instructions).toContain('arpeggio');
  });

  it('retains all IDs and does not assign intermediate exercises to beginner presets', () => {
    const byId = new Map(seedExercises.map(exercise => [exercise.id, exercise]));
    expect(seedExercises).toHaveLength(27);
    expect(seedRoutines).toHaveLength(14);
    expect(seedRoutines.find(routine => routine.id === 'daily-warm-up')?.steps.length).toBe(3);
    for (const routine of seedRoutines) {
      expect(routine.description?.length).toBeGreaterThan(12);
      for (const step of routine.steps) {
        expect(byId.has(step.exercise_id)).toBe(true);
        if (routine.level === 'Beginner') expect(byId.get(step.exercise_id)?.level).toBe('Beginner');
      }
    }
    expect(byId.has('one-chorus')).toBe(true);
    expect(byId.get('one-chorus')?.level).toBe('Intermediate');
  });
});

describe('searchable exercise and routine picker', () => {
  it('finds exercises by title, jargon keywords, notes and category', () => {
    expect(searchCatalogExercises(seedExercises, 'important notes')[0]?.id).toBe('thirds-sevenths');
    expect(searchCatalogExercises(seedExercises, 'guide tones').some(ex => ex.id === 'thirds-sevenths')).toBe(true);
    expect(searchCatalogExercises(seedExercises, 'F blues scale').some(ex => ex.id === 'blues-scale')).toBe(true);
    expect(searchCatalogExercises(seedExercises, 'swing', 'Beginner', 'Rhythm').some(ex => ex.id === 'swing-2-4')).toBe(true);
    expect(searchCatalogExercises(seedExercises, 'swing', 'Advanced', 'Rhythm')).toHaveLength(0);
    expect(searchCatalogExercises(seedExercises, 'nothing-near-this')).toHaveLength(0);
  });

  it('finds preset, user-owned and accessible public routines without private routines from other users', () => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    const mine = createLocalRepository('member-a');
    const another = createLocalRepository('member-b');
    const makeRoutine = (id: string, visibility = 'private'): LocalRoutine => ({
      id, title: id + ' custom blues', description: 'blues chords and rhythm',
      level: 'Beginner', visibility, is_seed: false, duration_minutes: 5,
      steps: [{ exercise_id: 'blues-scale', duration_minutes: 5 }], applicable_instruments: ['All']
    });
    mine.saveLocalRoutine(makeRoutine('my-song'));
    another.saveLocalRoutine(makeRoutine('other-private'));
    const publicShared: Routine = makeRoutine('shared-song', 'public');
    const accessible = [...mergeRoutines(seedRoutines, mine.listLocalRoutines()), publicShared];
    const found = searchCatalogRoutines(accessible, seedExercises, 'blues');
    expect(found.some(routine => routine.id === 'my-song')).toBe(true);
    expect(found.some(routine => routine.id === 'shared-song')).toBe(true);
    expect(found.some(routine => routine.id === 'other-private')).toBe(false);
    expect(searchCatalogRoutines(accessible, seedExercises, 'warm up').some(r => r.id === 'daily-warm-up')).toBe(true);
    expect(searchCatalogRoutines(accessible, seedExercises, 'blues', 'Beginner', 'Improvisation')
      .some(r => r.id === 'first-improv')).toBe(true);
  });

  it('adds repeat occurrences independently with suggested durations', () => {
    const ex = seedExercises.find(item => item.id === 'blues-scale')!;
    const initial = [{ exerciseId: 'swing-2-4', minutes: 7 }];
    const added = appendBuilderExercise(initial, ex);
    expect(added).toEqual([...initial, { exerciseId: ex.id, minutes: ex.duration_minutes }]);
    expect(appendBuilderExercise(added, ex)).toEqual([...added, { exerciseId: ex.id, minutes: ex.duration_minutes }]);
    expect(initial).toHaveLength(1);
  });

  it('imports the original step order and durations without modifying the preset', () => {
    const source = seedRoutines.find(routine => routine.id === 'daily-warm-up')!;
    const snapshot = JSON.stringify(source);
    const result = previewRoutineImport(source, [], seedExercises);
    expect(result.additions.map(step => step.exerciseId)).toEqual(source.steps.map(step => step.exercise_id));
    expect(result.additions.map(step => step.minutes)).toEqual(source.steps.map(step => step.duration_minutes));
    expect(result.additions).toHaveLength(3);
    const changed = [...result.additions.map(step => ({ exerciseId: step.exerciseId, minutes: step.minutes }))];
    changed[0] = { ...changed[0]!, minutes: 8 };
    changed.reverse();
    changed.pop();
    expect(JSON.stringify(source)).toBe(snapshot);
    expect(source.steps[0]?.duration_minutes).toBe(3);
  });

  it('keeps repeated steps and safely materializes private snapshots without nesting routines', () => {
    const shared: Routine = {
      id: 'public-abc', title: 'Shared Routine', level: 'Beginner',
      duration_minutes: 7, visibility: 'public', applicable_instruments: ['All'],
      steps: [
        { exercise_id: 'swing-2-4', duration_minutes: 3 },
        { exercise_id: 'not-accessible', duration_minutes: 4, snapshot: { title: 'Sing the note',
          instructions: 'Sing a C and play it.', chart_id: null } }
      ]
    };
    const result = previewRoutineImport(shared, [{ exerciseId: 'swing-2-4', minutes: 9 }], seedExercises);
    expect(result.duplicates).toBe(0);
    expect(result.additions).toEqual([
      { exerciseId: 'swing-2-4', minutes: 3, source: shared.steps[0] },
      { exerciseId: snapshotExerciseId('public-abc', 1), minutes: 4, source: shared.steps[1] },
    ]);
    expect(result.unavailable).toBe(0);
    expect(previewRoutineImport(shared, [{ exerciseId: snapshotExerciseId('public-abc', 1), minutes: 4 },
      { exerciseId: 'swing-2-4', minutes: 9 }], seedExercises).additions).toHaveLength(2);
    const noSnapshot: Routine = { ...shared, steps: [{ exercise_id: 'unknown', duration_minutes: 2 }] };
    expect(previewRoutineImport(noSnapshot, [], seedExercises).unavailable).toBe(1);
  });

  it('persists imported steps, time edits and reordering per account', () => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    const repoA = createLocalRepository('member-a');
    const repoB = createLocalRepository('member-b');
    const source = seedRoutines.find(routine => routine.id === 'daily-warm-up')!;
    const imported = previewRoutineImport(source, [], seedExercises).additions;
    const reordered = imported.map(step => ({ exercise_id: step.exerciseId, duration_minutes: step.minutes }));
    reordered[1] = { ...reordered[1]!, duration_minutes: 8 };
    reordered.reverse();
    reordered.pop();
    const saved: LocalRoutine = {
      id: 'local-rt-import', is_seed: false, title: 'My Jazz Practice', description: 'Adjusted steps',
      visibility: 'private', level: 'Beginner', applicable_instruments: ['All'],
      steps: reordered, duration_minutes: routineDurationFromSteps(reordered)
    };
    repoA.saveLocalRoutine(saved);
    expect(createLocalRepository('member-a').listLocalRoutines()[0]?.steps).toEqual(reordered);
    expect(createLocalRepository('member-a').listLocalRoutines()[0]?.duration_minutes)
      .toBe(reordered.reduce((sum, step) => sum + step.duration_minutes, 0));
    expect(repoB.listLocalRoutines()).toHaveLength(0);
    const localExercise: Exercise = seedExercises[0]!;
    repoA.saveLocalExercise({ ...localExercise, id: 'local-only', is_seed: false });
    expect(mergeExercises(seedExercises, repoB.listLocalExercises()).some(e => e.id === 'local-only')).toBe(false);
  });
});
