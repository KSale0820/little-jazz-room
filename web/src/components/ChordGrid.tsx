import type { Chart } from '../types/content';
import { chartTransposeSemitones, spellChord } from '../lib/chords';
import type { WrittenPitch } from '../types/content';
import './ChordGrid.css';

interface ChordGridProps {
  chart: Chart;
  chartKey: string;
  writtenPitch: WrittenPitch;
  selectedBar: number;
  loopRange: [number, number] | null;
  onSelectBar: (index: number) => void;
}

export function ChordGrid({
  chart,
  chartKey,
  writtenPitch,
  selectedBar,
  loopRange,
  onSelectBar,
}: ChordGridProps) {
  const trans = chartTransposeSemitones(chart, chartKey, writtenPitch);

  return (
    <div className="chord-grid" role="group" aria-label={`Chord chart: ${chart.title}`}>
      {chart.bars.map((bar, i) => {
        const items = bar.events.map(e => spellChord(e, trans));
        const looped =
          loopRange && bar.number >= loopRange[0] && bar.number <= loopRange[1];
        const label = `Measure ${bar.number}: ${items.join(' then ')}`;
        return (
          <button
            type="button"
            key={bar.number}
            className={`measure ${selectedBar === i ? 'chosen' : ''} ${looped ? 'looped' : ''}`}
            aria-label={label}
            aria-pressed={selectedBar === i}
            onClick={() => onSelectBar(i)}
          >
            <span className="measure-num">
              {bar.number}
              {bar.section ? ` · ${bar.section}` : ''}
            </span>
            <span className={`chords ${items.length > 1 ? 'two' : ''}`}>
              {items.map(c => (
                <span key={c}>{c}</span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
