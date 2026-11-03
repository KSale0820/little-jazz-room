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

/** Internal chart beats are denominator-note units; BPM is always quarter notes. */
export function rawChartBeat(clock: MusicalClock, nowMs: number, bpm: number, chart?: Chart): number {
  const unitsPerQuarter = (chart?.time_signature[1] ?? 4) / 4;
  return clock.chartBeat + (
    clock.startedAtMs === null ? 0 : Math.max(0, nowMs - clock.startedAtMs) * bpm * unitsPerQuarter / 60000
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
  const chartBeat = wrapChartBeat(rawChartBeat(clock, nowMs, bpm, chart), chart, range);
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

/** A finite chart-reading sequence. Each range is played `plays` times. */
export interface LoopSection {
  startBar: number;
  endBar: number;
  plays: number;
}

export interface SequencePlayhead extends Playhead {
  ended: boolean;
  sectionIndex: number | null;
  pass: number;
  sequenceBeat: number;
}

/** Total duration of one complete repeat program, measured in chart beats. */
export function sequenceDuration(chart: Chart, sections: LoopSection[] | null): number {
  const beats = beatsPerMeasure(chart);
  if (!sections?.length) return chart.bars.length * beats;
  return sections.reduce((total, section) => total +
    (section.endBar - section.startBar + 1) * beats * section.plays, 0);
}

/**
 * A chart follower has a monotonic sequence clock distinct from notated bar
 * positions. This lets bars 1–4 play 3x, then bars 9–12 play 2x, without
 * resetting the timer or losing beat fractions between passes.
 *
 * No sections = one full-chart pass, NOT the previous infinite full-chart loop.
 * repeatPlan can explicitly repeat an entire custom sequence indefinitely.
 */
export function locateSequencePlayhead(
  chart: Chart,
  clock: MusicalClock,
  nowMs: number,
  bpm: number,
  sections: LoopSection[] | null,
  repeatPlan = false,
): SequencePlayhead {
  const perBar = beatsPerMeasure(chart);
  const duration = sequenceDuration(chart, sections);
  const raw = Math.max(0, rawChartBeat(clock, nowMs, bpm, chart));
  const ended = duration <= 0 || (!repeatPlan && raw >= duration);
  // Clamp just inside the final beat so the last bar stays highlighted.
  let position = duration <= 0 ? 0 : repeatPlan && sections?.length
    ? raw % duration : Math.min(raw, Math.max(0, duration - 0.00001));
  let chartBeat = position;
  let sectionIndex: number | null = null;
  let pass = 1;

  if (sections?.length) {
    for (let index = 0; index < sections.length; index++) {
      const part = sections[index];
      const span = (part.endBar - part.startBar + 1) * perBar;
      const length = span * part.plays;
      if (position < length || index === sections.length - 1) {
        sectionIndex = index;
        pass = Math.min(part.plays, Math.floor(position / span) + 1);
        chartBeat = (part.startBar - 1) * perBar + position % span;
        break;
      }
      position -= length;
    }
  }

  const barIndex = Math.max(0, Math.min(chart.bars.length - 1, Math.floor(chartBeat / perBar)));
  const beatInBar = chartBeat - barIndex * perBar;
  const events = chart.bars[barIndex]?.events ?? [];
  let eventIndex: number | null = null;
  for (let i = 0; i < events.length; i++) {
    if (beatInBar + 1 >= events[i].beat && beatInBar + 1 < events[i].beat + events[i].duration_beats) eventIndex = i;
  }
  return { chartBeat, barIndex, beatInBar, eventIndex, ended, sectionIndex, pass, sequenceBeat: raw };
}

/** Seek the first occurrence of a bar in a multi-section practice program. */
export function sequenceBeatForBar(chart: Chart, sections: LoopSection[] | null, barIndex: number): number | null {
  const beats = beatsPerMeasure(chart);
  if (!sections?.length) return barIndex * beats;
  let position = 0;
  for (const section of sections) {
    if (barIndex + 1 >= section.startBar && barIndex + 1 <= section.endBar) {
      return position + (barIndex + 1 - section.startBar) * beats;
    }
    position += (section.endBar - section.startBar + 1) * beats * section.plays;
  }
  return null;
}
