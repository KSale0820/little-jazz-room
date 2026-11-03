import { useState } from 'react';
import type { DraftBar } from './chartModel';
import { parseChordSymbol } from './chartModel';

interface EditableChartGridProps {
  bars: DraftBar[];
  selectedBarId: string;
  selectedChordId: string;
  onSelect: (barId: string, chordId: string) => void;
  onChordChange: (barId: string, chordId: string, symbol: string) => void;
}

export function EditableChartGrid({
  bars, selectedBarId, selectedChordId, onSelect, onChordChange,
}: EditableChartGridProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <div className="chart-editor-grid" role="group" aria-label="Editable chord chart">
      {bars.map(bar => (
        <div key={bar.id} className={'chart-editor-measure' + (bar.id === selectedBarId ? ' is-selected' : '')}
          onClick={() => onSelect(bar.id, bar.events[0]?.id ?? '')}>
          <div className="chart-editor-measure-top">
            <span className="chart-editor-measure-number">Measure {bar.number}</span>
            {bar.annotation && <span className="chart-editor-annotation">{bar.annotation}</span>}
          </div>
          <div className="chart-editor-chords">
            {bar.events.map((event, index) => (
              <div className="chart-editor-chord" key={event.id}>
                <input
                  type="text"
                  aria-label={'Measure ' + bar.number + ' chord ' + (index + 1)}
                  aria-invalid={Boolean(errors[event.id])}
                  value={event.symbol}
                  placeholder="Chord"
                  spellCheck={false}
                  autoComplete="off"
                  className={event.id === selectedChordId && bar.id === selectedBarId ? 'is-selected' : ''}
                  onClick={e => e.stopPropagation()}
                  onFocus={() => onSelect(bar.id, event.id)}
                  onChange={e => {
                    onChordChange(bar.id, event.id, e.target.value);
                    if (errors[event.id]) setErrors(old => ({ ...old, [event.id]: '' }));
                  }}
                  onBlur={() => {
                    if (!event.symbol.trim()) return;
                    const parsed = parseChordSymbol(event.symbol);
                    if (parsed.ok) onChordChange(bar.id, event.id, parsed.normalized);
                    else setErrors(old => ({ ...old, [event.id]: parsed.error }));
                  }}
                />
                {bar.events.length > 1 && <small>{event.duration_beats} {event.duration_beats === 1 ? 'beat' : 'beats'}</small>}
                {errors[event.id] && <span role="alert" className="chart-editor-chord-error">{errors[event.id]}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
