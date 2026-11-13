import type { Exercise, PracticeSessionRecord, Routine } from '../types/content';
import { routineIconFor, routineShelfFor, type RoutineIconKey } from './routinePixelIcons';

/** Use exercise category only when the title doesn't already identify a more specific skill. */
function exerciseShelf(category: string): string {
  const value = category.toLowerCase();
  if (/warm.?up/.test(value)) return 'Warm-Ups';
  if (/repertoire|standard/.test(value)) return 'Standards & Repertoire';
  if (/improv|solo/.test(value)) return 'Improvisation';
  if (/ear|listen|transcri/.test(value)) return 'Ear Training';
  if (/rhythm|time|tempo/.test(value)) return 'Rhythm & Timing';
  if (/harmon|chord|comp/.test(value)) return 'Harmony & Chords';
  if (/technique|intonation|scales/.test(value)) return 'Technique';
  return 'Other Practice';
}

/** Consistent with the exact icons shown for these routines in the Routine Library. */
export function progressSessionIcon(
  session: PracticeSessionRecord, routines: Routine[], exercises: Exercise[],
): RoutineIconKey | null {
  if (session.exerciseId) {
    const exercise = exercises.find(item => item.id === session.exerciseId);
    return exercise ? routineIconFor(exercise.title, exerciseShelf(exercise.category)) : null;
  }
  if (session.routineId) {
    const routine = routines.find(item => item.id === session.routineId);
    if (!routine) return session.routineTitle ? routineIconFor(session.routineTitle, 'Other Practice') : null;
    const categories = routine.steps.map(step => exercises.find(ex => ex.id === step.exercise_id)?.category ?? '');
    return routineIconFor(routine.title, routineShelfFor(routine, categories));
  }
  return null;
}
