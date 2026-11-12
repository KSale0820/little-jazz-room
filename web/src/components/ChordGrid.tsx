import type { Chart } from '../types/content';
import { chartTransposeSemitones, spellChord } from '../lib/chords';
import type { WrittenPitch } from '../types/content';
import './ChordGrid.css';
import { chartAnnotationDisplay } from '../lib/practicePlayerNotes';

interface ChordGridProps {
  chart: Chart;
  chartKey: string;
  writtenPitch: WrittenPitch;
  selectedBar: number;
  /** Current beat-aware measure, independently styled from the range highlight. */
  activeBar?: number;
  activeEventIndex?: number | null;
  loopRange: [number, number] | null;
  onSelectBar: (index: number) => void;
  /** Hide formal-section A/B labels in the practice Player while preserving measure numbers. */
  showSectionLabels?: boolean;
  /** Show two measures per row, with supplied form letters in a left gutter. */
  practiceSheet?: boolean;
  /** Zero-based [start, end) slice displayed on a mobile chart page. */
  displayRange?: [number, number];
  /** Number each measure in the upper-right when toggled in the Player. */
  showMeasureNumbers?: boolean;
  /** Per-account user annotations; never overwrite the chart's existing source instructions. */
  userAnnotations?: Record<number, string>;
}

export function ChordGrid({
  chart,
  chartKey,
  writtenPitch,
  selectedBar,
  activeBar,
  activeEventIndex,
  loopRange,
  onSelectBar,
  showSectionLabels = true,
  practiceSheet = false,
  displayRange,
  showMeasureNumbers = true,
  userAnnotations = {},
}: ChordGridProps) {
  const trans = chartTransposeSemitones(chart, chartKey, writtenPitch);
  const visibleBars = displayRange ? chart.bars.slice(displayRange[0], displayRange[1]) : chart.bars;

  return (
    <div className={`chord-grid${practiceSheet ? " practice-sheet" : ""}`} role="group" aria-label={`Chord chart: ${chart.title}`}>
      {visibleBars.map((bar, i) => {
        const chartIndex = (displayRange?.[0] ?? 0) + i;
        const items = bar.events.map(e => spellChord(e, trans));
        const looped =
          loopRange && bar.number >= loopRange[0] && bar.number <= loopRange[1];
        const userNote = userAnnotations[bar.number]?.trim() ?? '';
        const userBubble = Boolean(userNote) && chartAnnotationDisplay(userNote) === 'bubble';
        const label = `Measure ${bar.number}: ${items.join(' then ')}${userNote ? '. Annotation: ' + userNote : ''}`;
        return (
          <button
            type="button"
            key={bar.number}
            className={`measure ${selectedBar === chartIndex ? 'chosen' : ''} ${activeBar === chartIndex ? 'playhead' : ''} ${looped ? 'looped' : ''}`}
            aria-label={label}
            aria-pressed={selectedBar === chartIndex}
            aria-current={activeBar === chartIndex ? 'true' : undefined}
            onClick={() => onSelectBar(chartIndex)}
          >
            {showSectionLabels && practiceSheet && bar.section && (
              <span className="measure-section-label" aria-label={`Section ${bar.section}`}>{bar.section}</span>
            )}
            {showMeasureNumbers && <span className="measure-num">
              {bar.number}
              {showSectionLabels && !practiceSheet && bar.section ? ` · ${bar.section}` : ''}
            </span>}
            {bar.annotation && <span className="measure-annotation">{bar.annotation}</span>}
            {userNote && <span className={userBubble ? 'measure-user-annotation practice-chart-note-bubble' : 'measure-user-annotation'}
              title={userNote} aria-label={userBubble ? 'Long note: ' + userNote : undefined}>
              {userBubble ? '▤' : userNote}
            </span>}
            <span className={`chords ${items.length > 1 ? 'two' : ''}`}>
              {items.map((c, eventIndex) => {
                const event = bar.events[eventIndex];
                return (
                  <span key={eventIndex} className={activeBar === chartIndex && activeEventIndex === eventIndex ? 'chord-active' : undefined} data-beat={event.beat} data-duration-beats={event.duration_beats}
                    title={`Beats ${event.beat}–${event.beat + event.duration_beats - 1}`}>{c}</span>
                );
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
