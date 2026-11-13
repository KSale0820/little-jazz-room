import { ROUTINE_ICON_KEYS, routineIconFor, routineIconPosition, type RoutineIconKey } from '../lib/routinePixelIcons';

/** Journal entries reuse the approved 24-icon routine sprite, not a separate asset library. */
export const journalIconLabel = (key: RoutineIconKey) =>
  key === 'ii-v-i' ? 'ii–V–I' : key.replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export function journalIconKey(iconKey: RoutineIconKey | undefined, title: string, tags: string[] = []): RoutineIconKey {
  return iconKey && ROUTINE_ICON_KEYS.includes(iconKey)
    ? iconKey : routineIconFor([title, ...tags].join(' '), '');
}

export function JournalRoutineIcon({ iconKey, title, tags, className = '' }: {
  iconKey?: RoutineIconKey;
  title: string;
  tags?: string[];
  className?: string;
}) {
  const key = journalIconKey(iconKey, title, tags);
  return <span className={'pj-routine-icon-frame ' + className} aria-hidden="true">
    <span className="pj-routine-icon-sprite" data-icon-key={key} style={{ backgroundPosition: routineIconPosition(key) }} />
  </span>;
}
