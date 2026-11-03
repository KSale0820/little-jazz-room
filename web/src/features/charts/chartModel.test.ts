import { describe, expect, it } from 'vitest';
import {
  blankDraftBar, buildChartFromDraft, chartEventDurationMs, draftFromChart, draftSections, duplicateDraftSection,
  formatChordSymbol, freshChartDraft, parseChartMeter,
  mergeDraftChord, normalizeChartKey, parseChordSymbol, renumberDraftBars,
  resizeDraftSplit, retimeDraftBars, splitDraftChord, stepChartKey, transposeDraftChords,
  validateDraftBars,
} from './chartModel';

describe('chart chord notation', () => {
  it('normalizes common major, minor, dominant and diminished jazz chords', () => {
    for (const symbol of ['Cmaj7', 'Dm7', 'G7', 'F7', 'B♭maj7', 'Bdim7', 'F♯m7♭5', 'C7alt', 'G7sus4']) {
      const parsed = parseChordSymbol(symbol);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(parseChordSymbol(parsed.normalized).ok).toBe(true);
    }
    expect(parseChordSymbol('Bbmaj7')).toEqual({ ok: true, root: 'Bb', quality: 'maj7', normalized: 'B♭maj7' });
    expect(formatChordSymbol({ root: 'F#', quality: 'm7b5' })).toBe('F♯m7♭5');
  });

  it('rejects unfamiliar notation instead of silently storing it', () => {
    const wrong = parseChordSymbol('Z#17');
    expect(wrong.ok).toBe(false);
    const unsupported = parseChordSymbol('C13');
    expect(unsupported.ok).toBe(false);
  });

  it('moves through all 12 chromatic keys and accepts enharmonic typing', () => {
    expect(stepChartKey('B', 1)).toBe('C');
    expect(stepChartKey('C', -1)).toBe('B');
    expect(normalizeChartKey('Bb')).toBe('B♭');
    expect(normalizeChartKey('F#')).toBe('F♯');
    expect(normalizeChartKey('Db')).toBe('D♭');
  });
});

describe('time signature entry', () => {
  it('accepts simple, irregular and compound signatures', () => {
    expect(parseChartMeter('4/4')).toEqual({ numerator: 4, denominator: 4 });
    expect(parseChartMeter(' 3 / 4 ')).toEqual({ numerator: 3, denominator: 4 });
    expect(parseChartMeter('6/8')).toEqual({ numerator: 6, denominator: 8 });
    expect(parseChartMeter('7/8')).toEqual({ numerator: 7, denominator: 8 });
    expect(parseChartMeter('12/8')).toEqual({ numerator: 12, denominator: 8 });
    expect(parseChartMeter('2/2')).toEqual({ numerator: 2, denominator: 2 });
    expect(parseChartMeter('5/4')).toEqual({ numerator: 5, denominator: 4 });
    expect(parseChartMeter('13/8')).toBeNull();
    expect(parseChartMeter('4/16')).toBeNull();
    expect(parseChartMeter('4')).toBeNull();
  });

  it('converts denominator note units to quarter-note BPM without flattening compound meter', () => {
    expect(chartEventDurationMs(3, { numerator: 6, denominator: 8 }, 120)).toBe(750);
    expect(chartEventDurationMs(6, { numerator: 6, denominator: 8 }, 120)).toBe(1500);
    expect(chartEventDurationMs(2, { numerator: 2, denominator: 2 }, 120)).toBe(2000);
  });

  it('retimes and saves charts across meters without corrupting chord boundaries', () => {
    const draft = freshChartDraft();
    draft.title = 'Odd Meter';
    draft.beats = 7;
    draft.beat_unit = 8;
    draft.bars = draft.bars.map((bar, index) => ({
      ...bar,
      events: [{ ...bar.events[0]!, duration_beats: 7, symbol: index % 2 ? 'G7' : 'Dm7' }],
    }));
    const split = splitDraftChord(draft.bars[0]!, draft.bars[0]!.events[0]!.id);
    draft.bars[0] = split;
    draft.bars[0]!.events[1]!.symbol = 'G7';
    const chart = buildChartFromDraft(draft, 'chart-local-odd-meter');
    expect(chart.time_signature).toEqual([7, 8]);
    expect(chart.bars[0]!.events.map(e => [e.beat, e.duration_beats])).toEqual([[1, 3], [4, 4]]);
    const reloaded = draftFromChart(chart);
    expect(reloaded.beat_unit).toBe(8);
    expect(reloaded.bars[0]!.events).toHaveLength(2);
  });
});

describe('A/B/A sections', () => {
  it('duplicates a complete A phrase after B and preserves copied chords and annotations', () => {
    const a1 = blankDraftBar(1, 4);
    const a2 = blankDraftBar(2, 4);
    const b = blankDraftBar(3, 4);
    a1.events[0]!.symbol = 'Dm7';
    a1.annotation = 'Build';
    a2.events[0]!.symbol = 'G7';
    b.section = 'B';
    b.events[0]!.symbol = 'Cmaj7';
    const result = duplicateDraftSection([a1, a2, b], 'A');
    expect(result?.bars.map(x => x.section)).toEqual(['A', null, 'B', 'A', null]);
    expect(result?.bars.map(x => x.number)).toEqual([1, 2, 3, 4, 5]);
    expect(result?.bars[3]!.annotation).toBe('Build');
    expect(result?.bars[4]!.events[0]!.symbol).toBe('G7');
    expect(result?.bars[3]!.events[0]!.id).not.toBe(a1.events[0]!.id);
    expect(draftSections(result!.bars).map(x => x.label)).toEqual(['A', 'B', 'A']);
    const repeated = duplicateDraftSection(result!.bars, 'A', 3);
    expect(repeated?.bars.length).toBe(7);
  });
});

describe('chart beat model', () => {
  it('splits a 4/4 bar without creating another measure, then merges it', () => {
    const first = { ...blankDraftBar(1, 4), events: [{ ...blankDraftBar(1, 4).events[0]!, symbol: 'Dm7' }] };
    const split = splitDraftChord(first, first.events[0]!.id);
    expect(split.number).toBe(1);
    expect(split.events.map(e => [e.beat, e.duration_beats])).toEqual([[1, 2], [3, 2]]);
    const edited = { ...split, events: split.events.map((e, i) => ({ ...e, symbol: i ? 'G7' : 'Dm7' })) };
    expect(validateDraftBars([edited], 4).errors).toEqual([]);
    const merged = mergeDraftChord(edited, edited.events[0]!.id);
    expect(merged.events).toHaveLength(1);
    expect(merged.events[0]!.duration_beats).toBe(4);
  });

  it('supports uneven 3/4 split points and more subdivisions', () => {
    const first = blankDraftBar(1, 3);
    first.events[0]!.symbol = 'Cmaj7';
    const split = splitDraftChord(first, first.events[0]!.id);
    expect(split.events.map(e => e.duration_beats)).toEqual([1, 2]);
    const adjusted = resizeDraftSplit(split, split.events[0]!.id, 2);
    expect(adjusted.events.map(e => [e.beat, e.duration_beats])).toEqual([[1, 2], [3, 1]]);
    const three = splitDraftChord(adjusted, adjusted.events[0]!.id);
    expect(three.events.map(e => [e.beat, e.duration_beats])).toEqual([[1, 1], [2, 1], [3, 1]]);
    expect(validateDraftBars([three], 3).errors).toEqual([]);
  });

  it('refuses gaps and overlaps in completed measures', () => {
    const bar = blankDraftBar(1, 4);
    bar.events[0]!.symbol = 'Cmaj7';
    bar.events[0]!.duration_beats = 3;
    expect(validateDraftBars([bar], 4).errors.length).toBeGreaterThan(0);
    bar.events[0]!.duration_beats = 4;
    expect(validateDraftBars([bar], 4).errors).toEqual([]);
  });

  it('retimes a pair of chords for 2/4 without overlapping beats', () => {
    const bar = blankDraftBar(1, 4);
    bar.events[0]!.symbol = 'Dm7';
    const split = splitDraftChord(bar, bar.events[0]!.id);
    const retimed = retimeDraftBars([split], 2);
    expect(retimed[0]!.events.map(e => [e.beat, e.duration_beats])).toEqual([[1, 1], [2, 1]]);
  });

  it('keeps red annotations with their measures after reordering', () => {
    const one = { ...blankDraftBar(1, 4), annotation: 'Swing feel' };
    const two = { ...blankDraftBar(2, 4), annotation: 'Build intensity' };
    const reordered = renumberDraftBars([two, one]);
    expect(reordered.map(bar => [bar.number, bar.annotation])).toEqual([[1, 'Build intensity'], [2, 'Swing feel']]);
  });

  it('transposes roots by interval while preserving quality, beats and annotations', () => {
    const bar = blankDraftBar(1, 4);
    bar.annotation = 'Solo here';
    bar.events[0]!.symbol = 'Dm7';
    const split = splitDraftChord(bar, bar.events[0]!.id);
    split.events[1]!.symbol = 'G7';
    const shifted = transposeDraftChords([split], 2, 'D');
    expect(shifted[0]!.events.map(e => e.symbol)).toEqual(['Em7', 'A7']);
    expect(shifted[0]!.events.map(e => [e.beat, e.duration_beats]))
      .toEqual([[1, 2], [3, 2]]);
    expect(shifted[0]!.annotation).toBe('Solo here');
  });

  it('round trips a 32-bar saved chart with style and beat metadata', () => {
    const draft = freshChartDraft();
    draft.title = 'My 32-Bar Study';
    draft.style_instruction = 'Medium swing throughout';
    draft.bars = Array.from({ length: 32 }, (_, index) => {
      const bar = blankDraftBar(index + 1, 4);
      bar.events[0]!.symbol = 'Cmaj7';
      return bar;
    });
    draft.bars[15]!.annotation = 'Two-feel';
    const chart = buildChartFromDraft(draft, 'chart-local-test');
    expect(chart.bars).toHaveLength(32);
    expect(chart.bars[15]!.annotation).toBe('Two-feel');
    expect(chart.bars[0]!.events[0]).toEqual({ beat: 1, duration_beats: 4, root: 'C', quality: 'maj7' });
    expect(draftFromChart(chart).bars[15]!.annotation).toBe('Two-feel');
  });

  it('requires valid chord content before saving a new chart', () => {
    const draft = freshChartDraft();
    draft.title = 'Incomplete study';
    expect(() => buildChartFromDraft(draft, 'chart-local-test')).toThrow(/Measure 1/);
  });
});
