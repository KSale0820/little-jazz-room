import type { Chart, ChartBar, ChordEvent, ChordQuality } from '../../types/content';

export const CHART_KEYS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'] as const;
/** Number of written note units in a measure. ChordEvent.beat is 1-based in these units. */
export type ChartMeter = number;
export type ChartBeatUnit = 2 | 4 | 8;
export interface ParsedChartMeter {
  numerator: number;
  denominator: ChartBeatUnit;
}

/** Accept common simple, irregular and compound meters while retaining exact note units. */
export function parseChartMeter(input: string): ParsedChartMeter | null {
  const match = input.trim().match(/^(\d{1,2})\s*\/\s*(2|4|8)$/);
  if (!match) return null;
  const numerator = Number(match[1]);
  if (numerator < 1 || numerator > 12) return null;
  return { numerator, denominator: Number(match[2]) as ChartBeatUnit };
}

/** BPM means quarter notes per minute. An event beat is the meter's denominator note. */
export function chartEventDurationMs(durationBeats: number, meter: ParsedChartMeter, quarterBpm: number): number {
  if (!Number.isFinite(quarterBpm) || quarterBpm <= 0) throw new Error('Tempo must be positive.');
  return durationBeats * 4 / meter.denominator * 60000 / quarterBpm;
}

export interface DraftChord {
  id: string;
  beat: number;
  duration_beats: number;
  symbol: string;
}

export interface DraftBar {
  id: string;
  number: number;
  /** Section marker starts a new A, B, C, or D phrase; null continues the previous one. */
  section: string | null;
  annotation: string;
  events: DraftChord[];
}

export interface ChartDraft {
  title: string;
  concert_key: string;
  beats: ChartMeter;
  beat_unit: ChartBeatUnit;
  feel: string;
  style_instruction: string;
  bars: DraftBar[];
}

const BASE_NOTES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function chartDraftId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}

export function pitchClass(note: string): number | null {
  const match = note.trim().replace(/♭/g, 'b').replace(/♯/g, '#').match(/^([A-Ga-g])([b#]?)$/);
  if (!match) return null;
  return (BASE_NOTES[match[1]!.toUpperCase()]! + (match[2] === 'b' ? -1 : match[2] === '#' ? 1 : 0) + 12) % 12;
}

export function normalizeChartKey(value: string): string | null {
  const note = value.trim().replace(/♭/g, 'b').replace(/♯/g, '#');
  const index = pitchClass(note);
  if (index === null) return null;
  const original = note.toUpperCase();
  if (original === 'C#') return 'D♭';
  if (original === 'D#') return 'E♭';
  if (original === 'GB') return 'F♯';
  if (original === 'G#') return 'A♭';
  if (original === 'A#') return 'B♭';
  return CHART_KEYS[index]!;
}

export function stepChartKey(key: string, step: number): string {
  const index = pitchClass(key) ?? 0;
  return CHART_KEYS[(index + step % 12 + 12) % 12]!;
}

export type ParsedChord =
  | { ok: true; root: string; quality: ChordQuality; normalized: string }
  | { ok: false; error: string };

export function formatChordSymbol(chord: Pick<ChordEvent, 'root' | 'quality'>): string {
  const name = chord.root.replace(/b/g, '♭').replace(/#/g, '♯');
  const suffix = chord.quality === 'major' ? '' : chord.quality === 'minor' ? 'm'
    : chord.quality === 'm7b5' ? 'm7♭5' : chord.quality === 'sus7' ? '7sus4' : chord.quality;
  return name + suffix;
}

export function parseChordSymbol(raw: string): ParsedChord {
  const value = raw.trim().replace(/\s+/g, '').replace(/♭/g, 'b').replace(/♯/g, '#');
  const match = value.match(/^([A-Ga-g])([b#]?)(.*)$/);
  if (!match) return { ok: false, error: 'Enter a chord like Dm7, G7 or B♭maj7.' };
  const root = match[1]!.toUpperCase() + (match[2] ?? '');
  const suffix = match[3] ?? '';
  const qualityMap: Record<string, ChordQuality> = {
    '': 'major', maj: 'major', major: 'major', M: 'major',
    m: 'minor', min: 'minor', minor: 'minor', '-': 'minor',
    maj7: 'maj7', Maj7: 'maj7', M7: 'maj7', 'Δ7': 'maj7', '△7': 'maj7',
    m7: 'm7', min7: 'm7', '-7': 'm7',
    '7': '7', dim7: 'dim7', o7: 'dim7', '°7': 'dim7',
    m7b5: 'm7b5', 'ø7': 'm7b5', '7alt': '7alt',
    sus7: 'sus7', '7sus': 'sus7', '7sus4': 'sus7',
  };
  const quality = qualityMap[suffix];
  if (!quality) return { ok: false, error: 'Unsupported chord. Try maj7, m7, 7, dim7, m7♭5, 7alt or 7sus4.' };
  return { ok: true, root, quality, normalized: formatChordSymbol({ root, quality }) };
}

export function blankDraftBar(number: number, beats: number): DraftBar {
  return { id: chartDraftId(), number, section: number === 1 ? 'A' : null, annotation: '', events: [
    { id: chartDraftId(), beat: 1, duration_beats: beats, symbol: '' },
  ] };
}

export function freshChartDraft(): ChartDraft {
  return { title: '', concert_key: 'C', beats: 4, beat_unit: 4, feel: 'Swing',
    style_instruction: '', bars: Array.from({ length: 4 }, (_, i) => blankDraftBar(i + 1, 4)) };
}

export function draftFromChart(chart: Chart): ChartDraft {
  const beats = chart.time_signature[0];
  const beatUnit = chart.time_signature[1];
  return {
    title: chart.title,
    concert_key: normalizeChartKey(chart.concert_key) ?? 'C',
    beats: beats >= 1 && beats <= 12 ? beats : 4,
    beat_unit: beatUnit === 2 || beatUnit === 8 ? beatUnit : 4,
    feel: chart.feel || '',
    style_instruction: chart.style_instruction ?? '',
    bars: chart.bars.map(bar => ({
      id: chartDraftId(), number: bar.number, section: bar.section, annotation: bar.annotation ?? '',
      events: bar.events.map(event => ({ ...event, id: chartDraftId(), symbol: formatChordSymbol(event) })),
    })),
  };
}

export function renumberDraftBars(bars: DraftBar[]): DraftBar[] {
  return bars.map((bar, index) => ({ ...bar, number: index + 1 }));
}

export interface DraftSection {
  label: string;
  start: number;
  end: number; // exclusive
}

/** A marker opens a phrase; the following marker closes it. Repeat markers form A–B–A. */
export function draftSections(bars: DraftBar[]): DraftSection[] {
  const sections: DraftSection[] = [];
  for (let index = 0; index < bars.length; index++) {
    const label = bars[index]!.section;
    if (!label) continue;
    if (sections.length) sections[sections.length - 1]!.end = index;
    sections.push({ label, start: index, end: bars.length });
  }
  return sections;
}

/** Append real, independent events, not repeat pointers, so the existing player stays deterministic. */
export function duplicateDraftSection(
  bars: DraftBar[], label: string, occurrenceStart?: number
): { bars: DraftBar[]; newStart: number } | null {
  const source = draftSections(bars).find(section => section.label === label
    && (occurrenceStart === undefined || section.start === occurrenceStart));
  if (!source) return null;
  const copies = bars.slice(source.start, source.end).map((bar, index) => ({
    ...bar,
    id: chartDraftId(),
    section: index === 0 ? label : null,
    events: bar.events.map(event => ({ ...event, id: chartDraftId() })),
  }));
  return { bars: renumberDraftBars([...bars, ...copies]), newStart: bars.length };
}

export function splitDraftChord(bar: DraftBar, id: string): DraftBar {
  const index = bar.events.findIndex(event => event.id === id);
  if (index < 0 || bar.events[index]!.duration_beats < 2) return bar;
  const event = bar.events[index]!;
  const first = Math.floor(event.duration_beats / 2);
  const second = event.duration_beats - first;
  const events = [...bar.events];
  events.splice(index, 1,
    { ...event, duration_beats: first },
    { ...event, id: chartDraftId(), beat: event.beat + first, duration_beats: second });
  return { ...bar, events };
}

export function mergeDraftChord(bar: DraftBar, id: string): DraftBar {
  if (bar.events.length < 2) return bar;
  const index = bar.events.findIndex(event => event.id === id);
  if (index < 0) return bar;
  const left = index === bar.events.length - 1 ? index - 1 : index;
  const events = [...bar.events];
  events.splice(left, 2, {
    ...events[left]!,
    duration_beats: events[left]!.duration_beats + events[left + 1]!.duration_beats,
  });
  return { ...bar, events };
}

export function resizeDraftSplit(bar: DraftBar, leftId: string, newLength: number): DraftBar {
  const index = bar.events.findIndex(event => event.id === leftId);
  if (index < 0 || index === bar.events.length - 1) return bar;
  const events = bar.events.map(event => ({ ...event }));
  const left = events[index]!;
  const right = events[index + 1]!;
  const total = left.duration_beats + right.duration_beats;
  if (!Number.isInteger(newLength) || newLength < 1 || newLength >= total) return bar;
  left.duration_beats = newLength;
  right.beat = left.beat + newLength;
  right.duration_beats = total - newLength;
  return { ...bar, events };
}

export function retimeDraftBars(bars: DraftBar[], beats: number): DraftBar[] {
  return bars.map(bar => {
    if (bar.events.length > beats) throw new Error('Merge chords before choosing this shorter time signature.');
    const total = bar.events.reduce((sum, event) => sum + event.duration_beats, 0);
    let remaining = beats;
    let beat = 1;
    const events = bar.events.map((event, index) => {
      const after = bar.events.length - index - 1;
      const duration = after === 0 ? remaining
        : Math.max(1, Math.min(remaining - after, Math.round(event.duration_beats / total * beats)));
      const next = { ...event, beat, duration_beats: duration };
      beat += duration;
      remaining -= duration;
      return next;
    });
    return { ...bar, events };
  });
}

export function transposeDraftChords(bars: DraftBar[], semitones: number, destinationKey: string): DraftBar[] {
  const useSharps = destinationKey.includes('♯') || destinationKey === 'E' || destinationKey === 'B';
  const names = useSharps ? SHARP_NOTES : FLAT_NOTES;
  return bars.map(bar => ({
    ...bar,
    events: bar.events.map(event => {
      const chord = parseChordSymbol(event.symbol);
      if (!chord.ok) return event;
      const note = pitchClass(chord.root)!;
      return { ...event, symbol: formatChordSymbol({
        root: names[(note + semitones % 12 + 12) % 12]!, quality: chord.quality,
      }) };
    }),
  }));
}

export function validateDraftBars(bars: DraftBar[], beats: number): { bars: ChartBar[]; errors: string[] } {
  const result: ChartBar[] = [];
  const errors: string[] = [];
  if (!bars.length) errors.push('Add at least one measure.');
  bars.forEach((bar, barIndex) => {
    let nextBeat = 1;
    const events: ChordEvent[] = [];
    bar.events.forEach((draft, index) => {
      if (!Number.isInteger(draft.beat) || !Number.isInteger(draft.duration_beats)
          || draft.beat !== nextBeat || draft.duration_beats < 1 || draft.beat + draft.duration_beats - 1 > beats) {
        errors.push('Measure ' + (barIndex + 1) + ' has invalid or overlapping beat positions.');
      }
      const parsed = parseChordSymbol(draft.symbol);
      if (!parsed.ok) errors.push('Measure ' + (barIndex + 1) + ', chord ' + (index + 1) + ': ' + parsed.error);
      else events.push({ beat: draft.beat, duration_beats: draft.duration_beats, root: parsed.root, quality: parsed.quality });
      nextBeat = draft.beat + draft.duration_beats;
    });
    if (nextBeat !== beats + 1) errors.push('Measure ' + (barIndex + 1) + ' must contain exactly ' + beats + ' beats.');
    result.push({ number: barIndex + 1, section: bar.section ?? null, events, annotation: bar.annotation.trim() || undefined });
  });
  return { bars: result, errors };
}

export function buildChartFromDraft(draft: ChartDraft, id: string, existing?: Chart): Chart {
  const title = draft.title.trim();
  if (!title) throw new Error('Give your chart a name before saving.');
  const meter = parseChartMeter(draft.beats + '/' + (draft.beat_unit ?? 4));
  if (!meter) throw new Error('Use a valid time signature from 1–12 over 2, 4, or 8.');
  const { bars, errors } = validateDraftBars(draft.bars, draft.beats);
  if (errors.length) throw new Error(errors[0]!);
  const now = new Date().toISOString();
  return {
    ...existing,
    id, title,
    concert_key: draft.concert_key,
    time_signature: [meter.numerator, meter.denominator],
    feel: draft.feel,
    form: bars.length + '-bar custom chart',
    style_instruction: draft.style_instruction.trim() || undefined,
    bars, is_custom: true,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}
