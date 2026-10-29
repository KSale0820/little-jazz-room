import type { Chart, ChordEvent, WrittenPitch } from '../types/content';

const CHROMA = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
const BASE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function pitchClass(root: string): number {
  const m = root.match(/^([A-G])([b#]?)$/);
  if (!m) return 0;
  const alter = m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0;
  return (BASE[m[1]]! + alter + 12) % 12;
}

export function spellChord(event: ChordEvent, semitones: number): string {
  let root = event.root;
  if (semitones % 12) {
    root = CHROMA[(pitchClass(root) + semitones + 120) % 12]!;
  }
  const quality = event.quality.replace('m7b5', 'm7♭5');
  return root.replace('b', '♭') + quality;
}

const WRITTEN_OFFSET: Record<WrittenPitch, number> = { C: 0, Bb: 2, Eb: 9 };

export function chartTransposeSemitones(
  chart: Chart,
  chartKey: string,
  writtenPitch: WrittenPitch
): number {
  const keyTrans = (pitchClass(chartKey) - pitchClass(chart.concert_key) + 120) % 12;
  return keyTrans + WRITTEN_OFFSET[writtenPitch];
}

export function formatChartMeta(chart: Chart): string {
  return `${chart.feel} · ${chart.time_signature.join('/')}`;
}
