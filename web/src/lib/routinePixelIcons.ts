import type { Routine } from '../types/content';

/**
 * Pixel icon atlas built from the 24 practice-skill icons approved for Little Jazz Room.
 *
 * Atlas: 6 columns x 4 rows, each cell 32 x 32 pixels.
 * Asset: /assets/routines/routine-icons-sprite.png
 * Display the background using 120 x 80 CSS pixels and image-rendering: pixelated.
 */
export const ROUTINE_ICON_KEYS = [
  'warm-ups', 'arpeggios', 'rhythm', 'scales', 'tempo', 'chords',
  'tone-and-intonation', 'ii-v-i', 'voicings', 'comping', '12-bar-blues', 'standards',
  'chord-connections', 'melody', 'improvisation', 'soloing', 'phrasing', 'call-and-response',
  'ear-training', 'listening', 'transcription', 'repetition', 'ensemble-skills', 'focused-practice',
] as const;

export type RoutineIconKey = (typeof ROUTINE_ICON_KEYS)[number];

export function routineIconPosition(key: RoutineIconKey): string {
  const index = ROUTINE_ICON_KEYS.indexOf(key);
  return `${-(index % 6) * 20}px ${-Math.floor(index / 6) * 20}px`;
}

/** Use the most specific supported skill before falling back to a shelf's broader focus. */
export function routineIconFor(title: string, shelf: string): RoutineIconKey {
  const name = title.toLowerCase().replace(/[–—]/g, '-');

  if (/warm.?up/.test(name)) return 'warm-ups';
  if (/arpeggios?/.test(name)) return 'arpeggios';
  if (/scales?/.test(name)) return 'scales';
  if (/12.?bar blues/.test(name)) return '12-bar-blues';
  if (/ii\s*[-–]\s*v\s*[-–]\s*i|three common jazz chords|2.?5.?1/.test(name)) return 'ii-v-i';
  if (/rhythm changes|standards?|song forms?|ballads?|repertoire/.test(name)) return 'standards';
  if (/walking bass|steady tempo|metronome|keep time|without a backing track/.test(name)) return 'tempo';
  if (/comping|playing chords|leave space/.test(name)) return 'comping';
  if (/guide.?tones?|chord connections?|chord movement|smooth chord/.test(name)) return 'chord-connections';
  if (/voicings?/.test(name)) return 'voicings';
  if (/chords?|harmony/.test(name)) return 'chords';
  if (/rhythm|swing|bossa/.test(name)) return 'rhythm';
  if (/intonation|long tones|tone quality/.test(name)) return 'tone-and-intonation';
  if (/call and response|call.?and.?response/.test(name)) return 'call-and-response';
  if (/phras(ing|e)/.test(name)) return 'phrasing';
  if (/improvisation|improv/.test(name)) return 'improvisation';
  if (/solo/.test(name)) return 'soloing';
  if (/melod/.test(name)) return 'melody';
  if (/transcrib/.test(name)) return 'transcription';
  if (/ear training|train your ear|sing notes/.test(name)) return 'ear-training';
  if (/listen/.test(name)) return 'listening';
  if (/repeat|repetition/.test(name)) return 'repetition';
  if (/ensemble|group practice|band practice/.test(name)) return 'ensemble-skills';
  if (/focus|goal/.test(name)) return 'focused-practice';

  switch (shelf) {
    case 'Warm-Ups': return 'warm-ups';
    case 'Standards & Repertoire': return 'standards';
    case 'Technique': return 'scales';
    case 'Improvisation': return 'improvisation';
    case 'Harmony & Chords': return 'chords';
    case 'Rhythm & Timing': return 'rhythm';
    case 'Ear Training': return 'ear-training';
    default: return 'focused-practice';
  }
}

export function routineShelfFor(routine: Routine, categories: string[]): string {
  const title = routine.title.toLowerCase();
  const goal = ((routine as Routine & { goal?: string }).goal ?? '').trim().toLowerCase();
  if (/warm.?up|scales|arpeggios|long tones/.test(title)) return 'Warm-Ups';
  if (goal === 'repertoire' || goal === 'jazz standards' ||
    /standard|song form|12.bar blues|rhythm changes|ballad/.test(title)) return 'Standards & Repertoire';
  if (goal === 'improvisation' || /improv|solo|call.and.response/.test(title)) return 'Improvisation';
  if (goal === 'ear training' || /ear training|transcri/.test(title)) return 'Ear Training';
  if (goal === 'rhythm' || goal === 'rhythm & harmony' ||
    /rhythm|swing|bossa|tempo|backing track/.test(title)) return 'Rhythm & Timing';
  if (goal === 'harmony' || /chord|voicing|comping|ii.v.i/.test(title)) return 'Harmony & Chords';
  if (goal === 'technique' || categories.includes('Technique')) return 'Technique';
  if (categories.includes('Improvisation')) return 'Improvisation';
  if (categories.includes('Repertoire')) return 'Standards & Repertoire';
  return 'Other Practice';
}

