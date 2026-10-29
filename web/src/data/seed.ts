import raw from './jazz-seed-content.json';
import type { SeedContent } from '../types/content';

export const seedContent = raw as unknown as SeedContent;

export const seedExercises = seedContent.exercises;
export const seedCharts = seedContent.charts;
export const seedRoutines = seedContent.routines.map(r => {
  const raw = r as (typeof seedContent.routines)[number] & { difficulty?: string; level?: string };
  return {
    ...raw,
    level: raw.level ?? raw.difficulty ?? 'Beginner',
    visibility: raw.visibility ?? 'public',
  };
});
export const seedPaths = seedContent.paths;
export const seedInstruments = seedContent.instruments;

export const chartsById = Object.fromEntries(seedCharts.map(c => [c.id, c])) as Record<
  string,
  (typeof seedCharts)[number]
>;

export const exercisesById = Object.fromEntries(seedExercises.map(e => [e.id, e])) as Record<
  string,
  (typeof seedExercises)[number]
>;

export const routinesById = Object.fromEntries(seedRoutines.map(r => [r.id, r])) as Record<
  string,
  (typeof seedRoutines)[number]
>;
