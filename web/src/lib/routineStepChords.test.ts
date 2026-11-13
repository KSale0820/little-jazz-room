import { describe, expect, it } from 'vitest';
import type { Chart } from '../types/content';
import { lessonChordRange, routineStepChartSections } from './routineStepChords';
import { normalizeGuidedLesson } from './guidedLesson';
import { seedExercises, seedCharts } from '../data/seed';

const chart = seedCharts.find(c => c.id === 'ii-v-i-c') as Chart;
const exercise = seedExercises.find(ex => ex.id === 'seventh-arpeggios')!;

describe('instruction-linked chart ranges', () => {
  it('maps lesson steps 1, 2, and 3 to the actual Dm7, G7, and Cmaj7 chart bars', () => {
    const lesson = normalizeGuidedLesson(exercise, exercise);
    expect(lesson.stepChordRanges).toEqual([[1,1],[2,2],[3,4],null]);
    expect(lessonChordRange(lesson, chart, 0)).toEqual([1,1]);
    expect(lessonChordRange(lesson, chart, 1)).toEqual([2,2]);
    expect(lessonChordRange(lesson, chart, 2)).toEqual([3,4]);
    expect(lessonChordRange(lesson, chart, 3)).toBeNull();
    expect(routineStepChartSections(lesson, chart)).toEqual([
      { stepNumber: 1, startBar: 1, endBar: 1 },
      { stepNumber: 2, startBar: 2, endBar: 2 },
      { stepNumber: 3, startBar: 3, endBar: 4 },
    ]);
    expect(chart.bars[0]?.events[0]?.root).toBe('D');
    expect(chart.bars[1]?.events[0]?.root).toBe('G');
    expect(chart.bars[2]?.events[0]?.root).toBe('C');
  });

  it('does not invent step numbers for unrelated, partial, or reordered charts', () => {
    const lesson = normalizeGuidedLesson(exercise, exercise);
    const longChart = seedCharts.find(c => c.id === 'blues-f-12') as Chart;
    expect(routineStepChartSections(lesson, longChart)).toEqual([]);
    expect(routineStepChartSections({ stepChordRanges: [[1,1],[3,4]] }, chart)).toEqual([]);
    expect(routineStepChartSections({ stepChordRanges: [[1,3],[2,4]] }, chart)).toEqual([]);
    expect(routineStepChartSections({ stepChordRanges: [[1,1]] }, chart)).toEqual([]);
  });

  it('preserves seeded step mapping when an older snapshot still has the same instructions', () => {
    const oldSnapshot = { title: exercise.title, instructions: exercise.instructions,
      lesson: { ...exercise.lesson, stepChordRanges: undefined } };
    const lesson = normalizeGuidedLesson(exercise, exercise, oldSnapshot);
    expect(lesson.stepChordRanges).toEqual([[1,1],[2,2],[3,4],null]);
    const differentSteps = { ...oldSnapshot, lesson: { ...oldSnapshot.lesson, steps: ['Unrelated custom content'] } };
    expect(normalizeGuidedLesson(exercise, exercise, differentSteps).stepChordRanges).toBeUndefined();
  });
});
