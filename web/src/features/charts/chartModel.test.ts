import { describe, expect, it } from 'vitest';
import {
  blankDraftBar, buildChartFromDraft, draftFromChart, formatChordSymbol, freshChartDraft, parseChartMeter,
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
  it('accepts quarter-note fractions and rejects unsupported meters', () => {
    expect(parseChartMeter('4/4')).toBe(4);
    expect(parseChartMeter(' 3 / 4 ')).toBe(3);
    expect(parseChartMeter('2/4')).toBe(2);
    expect(parseChartMeter('6/8')).toBeNull();
    expect(parseChartMeter('8/4')).toBeNull();
    expect(parseChartMeter('4')).toBeNull();
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
