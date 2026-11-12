import { beforeEach, describe, expect, it, vi } from 'vitest';
import { colorForTag, readJournalTags, saveJournalTag, tagPaletteKey, uniqueJournalTags } from './journalTagPalette';

const storage = new Map<string, string>();
beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
});
describe('account-scoped journal tag colors', () => {
  it('keeps default colored options and all user-created choices across entries', () => {
    expect(colorForTag(readJournalTags('a'), 'Improvisation')).toBe('gold');
    expect(saveJournalTag('a', 'Bridge work', 'blue')).not.toBeNull();
    expect(readJournalTags('a')).toContainEqual({ name: 'Bridge work', color: 'blue' });
    expect(readJournalTags('b').some(t => t.name === 'Bridge work')).toBe(false);
    expect(storage.has(tagPaletteKey('a'))).toBe(true);
  });
  it('recolors existing tags globally without creating duplicates or changing unrelated colors', () => {
    saveJournalTag('a', 'Scales', 'rose');
    saveJournalTag('a', 'scales', 'blue');
    expect(readJournalTags('a').filter(t => t.name.toLowerCase() === 'scales')).toHaveLength(1);
    expect(colorForTag(readJournalTags('a'), 'Scales')).toBe('blue');
    expect(colorForTag(readJournalTags('a'), 'Tune')).toBe('lilac');
  });
  it('normalizes duplicate tags while preserving display order', () => {
    expect(uniqueJournalTags(['Scales', ' scales ', 'Rhythm', ''])).toEqual(['Scales', 'Rhythm']);
  });
});
