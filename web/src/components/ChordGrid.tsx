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
  /** Hide formal-section A/B labels in the practice Player while preserving measure numbers. */
  showSectionLabels?: boolean;
  /** Show two measures per row, with supplied form letters in a left gutter. */
  practiceSheet?: boolean;
}

export function ChordGrid({
  chart,
  chartKey,
  writtenPitch,
  selectedBar,
  loopRange,
  onSelectBar,
  showSectionLabels = true,
  practiceSheet = false,
}: ChordGridProps) {
  const trans = chartTransposeSemitones(chart, chartKey, writtenPitch);

  return (
    <div className={`chord-grid${practiceSheet ? " practice-sheet" : ""}`} role="group" aria-label={`Chord chart: ${chart.title}`}>
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
            {showSectionLabels && practiceSheet && bar.section && (
              <span className="measure-section-label" aria-label={`Section ${bar.section}`}>{bar.section}</span>
            )}
            <span className="measure-num">
              {bar.number}
              {showSectionLabels && !practiceSheet && bar.section ? ` · ${bar.section}` : ''}
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
