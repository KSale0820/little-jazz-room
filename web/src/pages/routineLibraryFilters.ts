import type { Exercise, Routine } from '../types/content';

export const ROUTINE_FOCI = [
  'Warm-Up', 'Intonation', 'Rhythm', 'Improvisation',
  'Ear Training', 'Technique', 'Harmony', 'Repertoire',
] as const;
export type RoutineFocus = typeof ROUTINE_FOCI[number];

export const ROUTINE_INSTRUMENTS = [
  'All', 'Sax', 'Trumpet', 'Trombone', 'Piano', 'Guitar', 'Bass', 'Drums', 'Voice',
] as const;
export const ROUTINE_DURATIONS = [
  { value: '', label: 'Any' },
  { value: '10', label: '≤ 10 min' },
  { value: '20', label: '11–20 min' },
  { value: '30', label: '21–30 min' },
  { value: '45', label: '31–45 min' },
  { value: '46', label: '≥ 46 min' },
] as const;
export const ROUTINE_LEVELS = ['Any', 'Beginner', 'Intermediate', 'Advanced'] as const;

export interface RoutineFilters {
  focus: RoutineFocus[];
  instrument: string;
  duration: string;
  level: string;
}

export const EMPTY_ROUTINE_FILTERS: RoutineFilters = {
  focus: [], instrument: '', duration: '', level: '',
};

export const countRoutineFilters = (filters: RoutineFilters) =>
  filters.focus.length + Number(Boolean(filters.instrument)) +
  Number(Boolean(filters.duration)) + Number(Boolean(filters.level));

/** Classify focuses from routine metadata and the named exercise categories/titles.
 * Full exercise instructions often mention unrelated skills; searching them yields false matches. */
export function routineFocuses(routine: Routine, linkedExercises: Exercise[]): RoutineFocus[] {
  const goal = (routine as Routine & { goal?: string }).goal ?? '';
  const text = [
    goal, routine.title, routine.description ?? '',
    ...linkedExercises.flatMap(exercise =>
      [exercise.category, exercise.title, exercise.description ?? '']),
  ].join(' ').toLowerCase();

  const found = new Set<RoutineFocus>();
  const match = (pattern: RegExp, focus: RoutineFocus) => {
    if (pattern.test(text)) found.add(focus);
  };
  match(/\bwarm[- ]?up\b|long[- ]?tones?|breathing|lip slur/, 'Warm-Up');
  match(/intonation|in[- ]?tune|tuning|pitch accuracy|pitch center/, 'Intonation');
  match(/rhythm|swing|time feel|time keeping|metronome|syncopat|subdivision|groove/, 'Rhythm');
  match(/improv|solo(?:ing)?|call.and.response|blues phrase|licks?|bebop line/, 'Improvisation');
  match(/ear training|aural|interval recognition|transcrib|listen(?:ing)? exercises?|sing back/, 'Ear Training');
  match(/technique|scales?|arpeggio|articulat|fingering|dexterity|long[- ]?tones?/, 'Technique');
  match(/harmon|voicing|chord|ii[-–— ]?v[-–— ]?i|guide tones?|comping/, 'Harmony');
  match(/repertoire|standard|melod(?:y|ies)|song|tune|chart|form study/, 'Repertoire');

  if (!found.size) found.add('Technique');
  return ROUTINE_FOCI.filter(focus => found.has(focus));
}

function matchesInstrument(instruments: string[], requested: string): boolean {
  if (!requested || requested === 'All') return true;
  if (!instruments.length || instruments.some(value => value.toLowerCase() === 'all')) return true;
  return instruments.some(value => {
    const name = value.toLowerCase();
    if (requested === 'Sax') return name.includes('sax');
    if (requested === 'Voice') return name === 'voice' || name.includes('vocal') || name.includes('sing');
    return name === requested.toLowerCase() || name.includes(requested.toLowerCase() + ' ');
  });
}

function matchesDuration(minutes: number, duration: string): boolean {
  switch (duration) {
    case '10': return minutes <= 10;
    case '20': return minutes >= 11 && minutes <= 20;
    case '30': return minutes >= 21 && minutes <= 30;
    case '45': return minutes >= 31 && minutes <= 45;
    case '46': return minutes >= 46;
    default: return true;
  }
}

export function matchesRoutineFilters(routine: Routine, filters: RoutineFilters, exercises: Exercise[]): boolean {
  if (filters.focus.length && !filters.focus.some(focus => routineFocuses(routine, exercises).includes(focus))) return false;
  if (!matchesInstrument(routine.applicable_instruments ?? [], filters.instrument)) return false;
  if (!matchesDuration(routine.duration_minutes, filters.duration)) return false;
  if (filters.level && routine.level.toLowerCase() !== filters.level.toLowerCase()) return false;
  return true;
}
