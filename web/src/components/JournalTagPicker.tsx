import { useState } from 'react';
import { colorForTag, JOURNAL_TAG_COLORS, type JournalTagColor, type JournalTagDefinition, uniqueJournalTags } from '../lib/journalTagPalette';

interface Props {
  selected: string[];
  definitions: JournalTagDefinition[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onSetColor: (name: string, color: JournalTagColor) => boolean;
}
export function JournalTagPicker({ selected, definitions, onAdd, onRemove, onSetColor }: Props) {
  const [paletteFor, setPaletteFor] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState<JournalTagColor>('sage');
  const all = uniqueJournalTags([...definitions.map(d => d.name), ...selected]);
  const choices = all.filter(t => !selected.some(s => s.toLowerCase() === t.toLowerCase()));
  const createCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const existing = all.find(t => t.toLowerCase() === name.toLowerCase());
    const canonical = existing ?? name;
    if (onSetColor(canonical, customColor)) {
      onAdd(canonical);
      setCustomName('');
      setPaletteFor(null);
    }
  };
  return <section className="pj-edit-card pj-tint-sage pj-tag-manager" aria-label="Practice tags">
    <h2>Tags</h2>
    {selected.length > 0 && <div className="pj-tag-selected-list" aria-label="Selected tags">
      {selected.map(t => <div className={'pj-tag-selected pj-' + colorForTag(definitions,t)} key={t}>
        <button type="button" className="pj-tag-name" aria-label={'Change color for ' + t} title="Change tag color"
          onClick={() => setPaletteFor(v => v === t ? null : t)}>{t}</button>
        <button type="button" className="pj-tag-x" aria-label={'Remove ' + t} onClick={() => onRemove(t)}>×</button>
      </div>)}
    </div>}
    <div className="pj-tag-suggestions" aria-label="Available tags">
      {choices.map(t => <span className={'pj-tag-option pj-' + colorForTag(definitions,t)} key={t}>
        <button type="button" className="pj-tag-add" onClick={() => onAdd(t)}>+ {t}</button>
        <button type="button" className="pj-tag-color" onClick={() => setPaletteFor(v => v === t ? null : t)}
          aria-label={'Change color for ' + t} title={'Change color for ' + t}>◉</button>
      </span>)}
    </div>
    {paletteFor && <fieldset className="pj-tag-palette">
      <legend>Color for {paletteFor}</legend>
      <div>{JOURNAL_TAG_COLORS.map(color => <button type="button" key={color}
        className={'pj-swatch pj-' + color + (colorForTag(definitions,paletteFor) === color ? ' active' : '')}
        aria-label={'Set ' + paletteFor + ' color to ' + color}
        aria-pressed={colorForTag(definitions,paletteFor) === color}
        onClick={() => { if (onSetColor(paletteFor,color)) setPaletteFor(null); }} />)}</div>
    </fieldset>}
    <form className="pj-add-tag" onSubmit={e => { e.preventDefault(); createCustom(); }}>
      <label htmlFor="pj-new-tag-name">Create a tag</label>
      <div className="pj-custom-tag-row">
        <input id="pj-new-tag-name" aria-label="Custom tag" placeholder="Name your tag…" value={customName} maxLength={36}
          onChange={e => setCustomName(e.target.value)} />
        <button type="submit" disabled={!customName.trim()}>+ Add</button>
      </div>
      <div className="pj-custom-colors" role="group" aria-label="New tag color">
        {JOURNAL_TAG_COLORS.map(color => <button key={color} type="button"
          className={'pj-swatch pj-' + color + (customColor === color ? ' active' : '')}
          aria-label={'New tag color ' + color} aria-pressed={customColor === color} onClick={() => setCustomColor(color)} />)}
      </div>
    </form>
  </section>;
}
