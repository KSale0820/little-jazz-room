import type { Exercise, Routine } from '../types/content';

const FILTER_KEYWORDS: Record<string, string[]> = {
  Piano: ['piano', 'comping', 'voicing', 'keys', 'keyboard'],
  Guitar: ['guitar', 'chord melody', 'fret'],
  'Alto Saxophone': ['alto sax', 'alto saxophone', 'eb sax'],
  'Tenor Saxophone': ['tenor sax', 'tenor saxophone', 'tenor'],
  Trumpet: ['trumpet', 'brass'],
  Bass: ['bass', 'walking bass', 'upright'],
  Drums: ['drums', 'drum', 'ride cymbal', 'brush'],
};

function exerciseText(ex: Exercise): string {
  return `${ex.title} ${ex.instructions} ${ex.suggested_material} ${ex.category}`.toLowerCase();
}

/** Match seed/catalog exercises to Explore instrument chips. */
export function exerciseMatchesInstrument(ex: Exercise, filter: string): boolean {
  if (filter === 'All') return true;
  const keywords = FILTER_KEYWORDS[filter];
  if (!keywords) return true;
  const text = exerciseText(ex);
  return keywords.some(k => text.includes(k));
}

export function routineMatchesInstrument(
  routine: Routine,
  exerciseLookup: Record<string, Exercise | undefined>,
  filter: string
): boolean {
  if (filter === 'All') return true;
  return routine.steps.some(step => {
    const ex = exerciseLookup[step.exercise_id];
    return ex ? exerciseMatchesInstrument(ex, filter) : false;
  });
}
