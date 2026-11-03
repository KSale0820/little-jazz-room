import type { Chart } from '../types/content';

/** Anchor musical beats to a monotonic clock; interval callbacks only repaint. */
export interface MusicalClock {
  chartBeat: number;
  startedAtMs: number | null;
}

export interface Playhead {
  chartBeat: number;
  barIndex: number;
  beatInBar: number;
  eventIndex: number | null;
}

export function beatsPerMeasure(chart: Chart): number {
  // ChordEvent.beat and duration_beats are measured in notated meter beats.
  return chart.time_signature[0];
}

export function rawChartBeat(clock: MusicalClock, nowMs: number, bpm: number): number {
  return clock.chartBeat + (
    clock.startedAtMs === null ? 0 : Math.max(0, nowMs - clock.startedAtMs) * bpm / 60000
  );
}

export function loopBounds(chart: Chart, range: [number, number] | null): [number, number] {
  const beats = beatsPerMeasure(chart);
  const bars = chart.bars.length;
  if (!range || range[0] < 1 || range[1] > bars || range[0] > range[1]) {
    return [0, bars * beats];
  }
  return [(range[0] - 1) * beats, range[1] * beats];
}

export function wrapChartBeat(beat: number, chart: Chart, range: [number, number] | null): number {
  const [start, end] = loopBounds(chart, range);
  const length = end - start;
  if (length <= 0) return 0;
  if (beat < start) return start;
  return start + ((beat - start) % length);
}

export function locatePlayhead(
  chart: Chart,
  clock: MusicalClock,
  nowMs: number,
  bpm: number,
  range: [number, number] | null,
): Playhead {
  const chartBeat = wrapChartBeat(rawChartBeat(clock, nowMs, bpm), chart, range);
  const perBar = beatsPerMeasure(chart);
  const barIndex = Math.min(chart.bars.length - 1, Math.floor(chartBeat / perBar));
  const beatInBar = chartBeat - barIndex * perBar;
  const events = chart.bars[barIndex]?.events ?? [];
  // Chord events may start midway through a bar and last less than a bar.
  // Prefer the event that actually occupies this beat, not the first chord.
  let eventIndex: number | null = null;
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (beatInBar + 1 >= event.beat && beatInBar + 1 < event.beat + event.duration_beats) {
      eventIndex = i;
    }
  }
  return { chartBeat, barIndex: Math.max(0, barIndex), beatInBar, eventIndex };
}

/** Re-anchor when pausing, resuming, or changing tempo; never discard fractional beats. */
export function anchorAt(
  chart: Chart,
  clock: MusicalClock,
  nowMs: number,
  bpm: number,
  range: [number, number] | null,
  playing: boolean,
): MusicalClock {
  return {
    chartBeat: locatePlayhead(chart, clock, nowMs, bpm, range).chartBeat,
    startedAtMs: playing ? nowMs : null,
  };
}

export function seekMeasure(index: number, chart: Chart, playing: boolean, nowMs: number): MusicalClock {
  const safe = Math.max(0, Math.min(index, chart.bars.length - 1));
  return { chartBeat: safe * beatsPerMeasure(chart), startedAtMs: playing ? nowMs : null };
}
