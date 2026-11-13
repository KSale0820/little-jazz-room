type SectionIconName = 'calendar' | 'list' | 'pencil' | 'lightbulb' | 'target';

/** Clean outlined symbols from the approved practice-journal mockup. */
export function JournalSectionIcon({ name }: { name: SectionIconName }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'calendar' && <><rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18M7 14h3v3H7z" /></>}
    {name === 'list' && <><circle cx="4" cy="6" r=".9" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r=".9" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r=".9" fill="currentColor" stroke="none" />
      <path d="M9 6h12M9 12h12M9 18h12" /></>}
    {name === 'pencil' && <><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z" />
      <path d="m15 5 4 4" /></>}
    {name === 'lightbulb' && <><path d="M9 18h6M10 22h4M15.1 14a6 6 0 1 0-6.2 0c.7.5 1.1 1.2 1.1 2v2h4v-2c0-.8.4-1.5 1.1-2Z" /></>}
    {name === 'target' && <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /></>}
  </svg>;
}
