type JournalMockupIcon =
  | 'calendar' | 'list' | 'pencil' | 'lightbulb' | 'target'
  | 'check' | 'music' | 'layers';

/**
 * The outlined icons from the approved journal-entry mockup, rather than the
 * navigation icon library or emoji. Keep this one visual vocabulary across
 * the date, colored section headings, checked sessions and related links.
 */
export function JournalSectionIcon({ name, size = 22 }: { name: JournalMockupIcon; size?: number }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
    stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" data-journal-icon={name}>
    {name === 'calendar' && <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18" />
      <path d="M8 14h3v3H8z" strokeWidth="1.5" />
    </>}
    {name === 'list' && <>
      <circle cx="4.5" cy="6" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.05" fill="currentColor" stroke="none" />
      <path d="M9 6h12M9 12h12M9 18h12" />
    </>}
    {name === 'pencil' && <>
      <path d="M4 20l4.6-1 11-11a2.5 2.5 0 0 0-3.6-3.6l-11 11L4 20Z" />
      <path d="m14.7 5.7 3.6 3.6M4 20l3.8-3.8" />
    </>}
    {name === 'lightbulb' && <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6.5 6.5 0 0 0-3.7 11.8c.9.6 1.4 1.4 1.4 2.2h4.6c0-.8.5-1.6 1.4-2.2A6.5 6.5 0 0 0 12 3Z" />
      <path d="M12 6v1" strokeWidth="1.5" />
    </>}
    {name === 'target' && <>
      <circle cx="10.5" cy="13.5" r="8" />
      <circle cx="10.5" cy="13.5" r="4.5" />
      <path d="m10.5 13.5 10-10M16.5 3.5h4v4" />
    </>}
    {name === 'check' && <path d="m5 12 4.3 4.3L19 6.8" strokeWidth="2.9" />}
    {name === 'music' && <>
      <path d="M9 18V5l12-2v13M9 9l12-2" />
      <ellipse cx="5.7" cy="18.4" rx="3.3" ry="2" fill="currentColor" stroke="none" transform="rotate(-15 5.7 18.4)" />
      <ellipse cx="17.7" cy="16.4" rx="3.3" ry="2" fill="currentColor" stroke="none" transform="rotate(-15 17.7 16.4)" />
    </>}
    {name === 'layers' && <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
    </>}
  </svg>;
}
