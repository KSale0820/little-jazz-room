import { describe, expect, it } from 'vitest';
import rawSeed from './jazz-seed-content.json';
import { beginnerLearningSequence, seedCharts, seedExercises, seedRoutines } from './seed';
import { getStructuredLesson, withBeginnerLesson, withBeginnerRoutineCopy } from './beginnerLessonContent';
import type { Exercise, Routine } from '../types/content';

const originalExerciseIds = rawSeed.exercises.map(exercise => exercise.id);
const originalRoutineIds = rawSeed.routines.map(routine => routine.id);
const originalChartIds = rawSeed.charts.map(chart => chart.id);

describe('structured lessons for every seeded Beginner exercise', () => {
  it('keeps the same seeded exercise, routine, and chart identifiers', () => {
    expect(seedExercises.map(exercise => exercise.id)).toEqual(originalExerciseIds);
    expect(seedRoutines.map(routine => routine.id)).toEqual(originalRoutineIds);
    expect(seedCharts.map(chart => chart.id)).toEqual(originalChartIds);
  });

  it('provides a goal, sequenced steps, listening cue, success check and cat prompts', () => {
    const beginners = seedExercises.filter(exercise => exercise.level === 'Beginner');
    expect(beginners).toHaveLength(18);
    for (const exercise of beginners) {
      const lesson = getStructuredLesson(exercise);
      expect(lesson, exercise.id).not.toBeNull();
      expect(exercise.description?.length, exercise.id).toBeGreaterThan(10);
      expect(lesson!.goal.length, exercise.id).toBeGreaterThan(20);
      expect(lesson!.steps.length, exercise.id).toBeGreaterThanOrEqual(3);
      for (const step of lesson!.steps) expect(step.length, exercise.id).toBeGreaterThan(20);
      expect(lesson!.listenFor.length, exercise.id).toBeGreaterThan(20);
      expect(lesson!.success.length, exercise.id).toBeGreaterThan(20);
      expect(lesson!.terminologyHelp?.length, exercise.id).toBeGreaterThan(20);
      expect(lesson!.catPrompts.length, exercise.id).toBeGreaterThanOrEqual(1);
      for (const prompt of lesson!.catPrompts) {
        expect(prompt.trim().length, exercise.id).toBeGreaterThan(10);
        expect(prompt.length, exercise.id).toBeLessThanOrEqual(90);
      }
      expect(exercise.instructions, exercise.id).toContain('Goal:');
      expect(exercise.instructions, exercise.id).toContain('1. ');
      expect(exercise.instructions, exercise.id).toContain('2. ');
      expect(exercise.instructions, exercise.id).toContain('Listen for:');
      expect(exercise.instructions, exercise.id).toContain('Ready to move on when:');
    }
  });

  it('retains helpful note-name detail in the chord and scale lessons', () => {
    const byId = Object.fromEntries(seedExercises.map(exercise => [exercise.id, exercise]));
    expect(byId['thirds-sevenths']?.title).toBe('Practice the Important Notes in Each Chord');
    expect(byId['thirds-sevenths']?.instructions).toContain('F and C for Dm7');
    expect(byId['thirds-sevenths']?.instructions).toContain('B and F for G7');
    expect(byId['thirds-sevenths']?.instructions).toContain('E and B for Cmaj7');
    expect(byId['seventh-arpeggios']?.title).toBe('Play the Notes of Each Chord');
    expect(byId['seventh-arpeggios']?.instructions).toContain('D–F–A–C');
    expect(byId['blues-scale']?.instructions).toContain('F, A♭, B♭, B, C, E♭, F');
  });

  it('provides a coherent learning path from pulse to chords to improvisation', () => {
    expect(beginnerLearningSequence).toHaveLength(18);
    expect(beginnerLearningSequence.map(exercise => exercise.id).slice(0, 10)).toEqual([
      'swing-2-4', 'listen-form', 'blues-form', 'chord-roots', 'seventh-arpeggios',
      'thirds-sevenths', 'blues-scale', 'question-answer', 'chord-tone-solo', 'free-play'
    ]);
    expect(new Set(beginnerLearningSequence.map(exercise => exercise.lesson!.learningOrder)).size).toBe(18);
  });

  it('keeps old unstructured/cloud exercise content available', () => {
    const example = { ...seedExercises[0]! } as Exercise;
    delete example.lesson;
    expect(getStructuredLesson(example)).toBeNull();
    const before = example.instructions;
    const after = withBeginnerLesson({ ...example, id: 'custom-user-lesson', is_seed: false });
    expect(after.instructions).toBe(before);
    const intermediate = seedExercises.find(exercise => exercise.id === 'rhythm-variation')!;
    expect(intermediate.level).toBe('Intermediate');
    expect(getStructuredLesson(intermediate)).toBeNull();
    expect(withBeginnerLesson(intermediate)).toBe(intermediate);
  });
});

describe('routine compatibility and beginner progression', () => {
  it('provides descriptions for presets while preserving their IDs, totals and step references', () => {
    const exerciseIds = new Set(seedExercises.map(exercise => exercise.id));
    const chartIds = new Set(seedCharts.map(chart => chart.id));
    for (const exercise of seedExercises) {
      if (exercise.chart_id) expect(chartIds.has(exercise.chart_id), exercise.id).toBe(true);
    }
    for (const routine of seedRoutines) {
      expect(routine.description?.length, routine.id).toBeGreaterThan(20);
      expect(routine.steps.length, routine.id).toBeGreaterThan(0);
      expect(routine.steps.reduce((sum, step) => sum + step.duration_minutes, 0), routine.id)
        .toBe(routine.duration_minutes);
      for (const step of routine.steps) expect(exerciseIds.has(step.exercise_id), routine.id).toBe(true);
    }
    expect(seedRoutines.find(routine => routine.id === 'daily-warm-up')?.steps.length).toBe(3);
  });

  it('avoids intermediate prerequisites in beginner presets', () => {
    const exerciseMap = new Map(seedExercises.map(exercise => [exercise.id, exercise]));
    for (const routine of seedRoutines.filter(routine => routine.level === 'Beginner')) {
      for (const step of routine.steps) {
        expect(exerciseMap.get(step.exercise_id)?.level, routine.id + '/' + step.exercise_id).toBe('Beginner');
      }
    }
    expect(seedRoutines.find(routine => routine.id === 'rhythm-time')?.steps.some(
      step => step.exercise_id === 'rhythm-variation'
    )).toBe(false);
    expect(seedRoutines.find(routine => routine.id === '12bar-blues')?.steps.some(
      step => step.exercise_id === 'one-chorus'
    )).toBe(false);
    expect(seedExercises.find(exercise => exercise.id === 'one-chorus')?.level).toBe('Intermediate');
  });

  it('sequences the walking bass and bossa lessons from easier to harder steps', () => {
    expect(seedRoutines.find(routine => routine.id === 'walking-bass')?.steps.map(
      step => step.exercise_id
    )).toEqual(['blues-form', 'chord-roots', 'walking-bass', 'free-play']);
    expect(seedRoutines.find(routine => routine.id === 'first-minor-bossa')?.steps.map(
      step => step.exercise_id
    )).toEqual(['chord-roots', 'thirds-sevenths', 'bossa-minor']);
  });

  it('does not mutate raw routine source objects or alter unrelated steps', () => {
    const before: Routine = {
      id: 'other', title: 'Original', description: 'Unaffected', level: 'Intermediate',
      is_seed: true, visibility: 'public', applicable_instruments: ['All'],
      duration_minutes: 3, steps: [{ exercise_id: 'listen-form', duration_minutes: 3 }]
    };
    const unchanged = withBeginnerRoutineCopy(before);
    expect(unchanged).toBe(before);
    const source = seedRoutines.find(routine => routine.id === 'daily-warm-up')!;
    const copy = withBeginnerRoutineCopy(source);
    expect(copy.steps).toEqual(source.steps);
    expect(copy.id).toBe(source.id);
  });
});
