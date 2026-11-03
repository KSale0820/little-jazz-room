import raw from './jazz-seed-content.json';
import type { SeedContent } from '../types/content';
import { orderedBeginnerLessons, withBeginnerLesson, withBeginnerRoutineCopy } from './beginnerLessonContent';

const seedContent = raw as unknown as SeedContent;

export const seedExercises = seedContent.exercises.map(withBeginnerLesson);
export const seedCharts = seedContent.charts;
export const seedRoutines = seedContent.routines.map(r => {
  const raw = r as (typeof seedContent.routines)[number] & { difficulty?: string; level?: string };
  return {
    ...raw,
    level: raw.level ?? raw.difficulty ?? 'Beginner',
    visibility: raw.visibility ?? 'public',
  };
}).map(withBeginnerRoutineCopy);

/** Beginner-first order for a teaching path; every seeded ID stays unchanged. */
export const beginnerLearningSequence = orderedBeginnerLessons(seedExercises);
export const seedPaths = seedContent.paths;

export const chartsById = Object.fromEntries(seedCharts.map(c => [c.id, c])) as Record<
  string,
  (typeof seedCharts)[number]
>;

export const exercisesById = Object.fromEntries(seedExercises.map(e => [e.id, e])) as Record<
  string,
  (typeof seedExercises)[number]
>;
