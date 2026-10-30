import type { Exercise, Routine } from '../types/content';

const ALL_INSTRUMENTS_TOKEN = 'All';

const VALID_FILTERS = new Set([
  'All',
  'Piano',
  'Guitar',
  'Alto Saxophone',
  'Tenor Saxophone',
  'Trumpet',
  'Bass',
  'Drums',
]);

function normalizeApplicableInstruments(list: string[] | undefined): string[] {
  if (!list || list.length === 0) return [ALL_INSTRUMENTS_TOKEN];
  return list;
}

function matchesApplicableInstruments(applicable: string[] | undefined, filter: string): boolean {
  if (filter === 'All') return true;
  const apps = normalizeApplicableInstruments(applicable);
  if (apps.includes(ALL_INSTRUMENTS_TOKEN)) return true;
  return apps.includes(filter);
}

export function exerciseMatchesInstrument(ex: Exercise, filter: string): boolean {
  if (!VALID_FILTERS.has(filter)) return true;
  return matchesApplicableInstruments(ex.applicable_instruments, filter);
}

export function routineMatchesInstrument(routine: Routine, filter: string): boolean {
  if (!VALID_FILTERS.has(filter)) return true;
  return matchesApplicableInstruments(routine.applicable_instruments, filter);
}
