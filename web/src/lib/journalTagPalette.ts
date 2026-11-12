import { persistLocalList, readLocalList } from './practicePlayerNotes';

export type JournalTagColor = 'sage' | 'lilac' | 'gold' | 'blue' | 'rose';
export interface JournalTagDefinition { name: string; color: JournalTagColor }
export const JOURNAL_TAG_COLORS: JournalTagColor[] = ['sage', 'lilac', 'gold', 'blue', 'rose'];
export const JOURNAL_DEFAULT_TAGS: JournalTagDefinition[] = [
  { name: 'Scales', color: 'sage' },
  { name: 'Tune', color: 'lilac' },
  { name: 'Improvisation', color: 'gold' },
  { name: 'Technique', color: 'blue' },
  { name: 'Rhythm', color: 'rose' },
  { name: 'Tone', color: 'rose' },
  { name: 'Comping', color: 'lilac' },
  { name: 'Ear Training', color: 'gold' },
  { name: 'Intonation', color: 'blue' },
  { name: 'Repertoire', color: 'sage' },
];
const isColor = (value: unknown): value is JournalTagColor => JOURNAL_TAG_COLORS.includes(value as JournalTagColor);
export const tagPaletteKey = (scope: string) => 'little-jazz-room:practice-tag-palette:v1:' + scope;
export function uniqueJournalTags(tags: string[]): string[] {
  const found = new Set<string>();
  return tags.filter(tag => {
    const key = tag.trim().toLocaleLowerCase();
    if (!key || found.has(key)) return false;
    found.add(key);
    return true;
  }).map(tag => tag.trim());
}
export function readJournalTags(scope: string): JournalTagDefinition[] {
  const raw = readLocalList<JournalTagDefinition>(tagPaletteKey(scope));
  const combined = [...JOURNAL_DEFAULT_TAGS, ...raw];
  const tags: JournalTagDefinition[] = [];
  for (const candidate of combined) {
    if (!candidate || typeof candidate.name !== 'string' || !isColor(candidate.color)) continue;
    const name = candidate.name.trim().slice(0, 36);
    if (!name) continue;
    const existing = tags.findIndex(t => t.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing >= 0) tags[existing] = { name: tags[existing].name, color: candidate.color };
    else tags.push({ name, color: candidate.color });
  }
  return tags;
}
export function colorForTag(tags: JournalTagDefinition[], name: string): JournalTagColor {
  return tags.find(t => t.name.toLocaleLowerCase() === name.toLocaleLowerCase())?.color ?? 'sage';
}
export function saveJournalTag(scope: string, name: string, color: JournalTagColor): JournalTagDefinition[] | null {
  const trimmed = name.trim().slice(0, 36);
  if (!trimmed || !isColor(color)) return null;
  const existing = readJournalTags(scope);
  const found = existing.find(t => t.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  const next = [...existing.filter(t => t !== found), { name: found?.name ?? trimmed, color }];
  return persistLocalList(tagPaletteKey(scope), next) ? next : null;
}
