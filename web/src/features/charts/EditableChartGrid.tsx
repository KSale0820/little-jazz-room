import { useState, type ReactNode, type RefObject } from 'react';
import type { DraftBar } from './chartModel';
import { parseChordSymbol } from './chartModel';

interface EditableChartGridProps {
  bars: DraftBar[];
  selectedBarId: string;
  selectedChordId: string;
  onSelect: (barId: string, chordId: string) => void;
  onChordChange: (barId: string, chordId: string, symbol: string) => void;
  selectedInputRef?: RefObject<HTMLInputElement | null>;
  editor?: ReactNode;
}

export function EditableChartGrid({
  bars, selectedBarId, selectedChordId, onSelect, onChordChange, selectedInputRef, editor,
}: EditableChartGridProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const rows = Array.from({ length: Math.ceil(bars.length / 2) }, (_, i) => bars.slice(i * 2, i * 2 + 2));
  return (
    <div className="chart-editor-grid" role="group" aria-label="Editable chord chart">
      {rows.map(row => (
        <div key={row[0]!.id} className="chart-editor-row">
          {row.map(bar => (
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
                  ref={node => { if (selectedInputRef && bar.id === selectedBarId && event.id === selectedChordId) selectedInputRef.current = node; }}
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
          {row.some(bar => bar.id === selectedBarId) && editor}
        </div>
      ))}
    </div>
  );
}
