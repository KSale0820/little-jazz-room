import { describe, expect, it } from 'vitest';
import { seedCharts, seedExercises } from './seed';
import tracks from './standard-tracks.json';
import { spellChord } from '../lib/chords';

describe('standard chart catalog', () => {
  it('links all eight standards to complete playable forms', () => {
    expect(tracks.map(t => t.title)).toEqual(['Autumn Leaves', 'Blue Bossa', 'Song for My Father', 'Sandu', 'All the Things You Are', 'How High the Moon', 'Ornithology', 'Oleo']);
    const lengths = [32, 16, 24, 12, 36, 32, 32, 32];
    tracks.forEach((track, index) => {
      const chart = seedCharts.find(c => c.id === track.chartId)!;
      expect(chart.bars).toHaveLength(lengths[index]!);
      expect(chart.source_url).toMatch(/^https:/);
      chart.bars.forEach((bar, i) => {
        expect(bar.number).toBe(i + 1);
        expect(bar.events.reduce((n, e) => n + e.duration_beats, 0)).toBe(4);
        let beat = 1;
        bar.events.forEach(e => {
          expect(e.beat).toBe(beat);
          expect(e.root).toMatch(/^[A-G][b#]?$/);
          expect(spellChord(e, 0)).not.toContain('undefined');
          beat += e.duration_beats;
        });
      });
    });
  });
  it('keeps existing exercise chart references valid', () => {
    seedExercises.filter(e => e.chart_id).forEach(e => expect(seedCharts.some(c => c.id === e.chart_id)).toBe(true));
  });
  it('renders extended and suspended chord qualities', () => {
    const chord = { root: 'C', quality: 'sus7' as const, beat: 1, duration_beats: 4 };
    expect(spellChord(chord, 0)).toBe('C7sus4');
    expect(spellChord({ ...chord, quality: '7b9' }, 2)).toBe('D7♭9');
    expect(spellChord({ ...chord, quality: 'mMaj7' }, 0)).toBe('Cm(maj7)');
  });
});
