import type { SVGProps } from 'react';

export type ProgressIconName = 'calendar' | 'journal' | 'notes' | 'music' | 'exercise' | 'routine';

/** Tiny, intentionally spare music-studio icons. No emoji or platform-dependent rendering. */
export function ProgressIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: ProgressIconName }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  let drawing: React.ReactNode;
  switch (name) {
    case 'calendar':
      drawing = <><rect x="4" y="7" width="24" height="22" rx="2" /><path d="M9 3v8M23 3v8M4 13h24" /><path d="m10 22 4 3 7-8" strokeWidth="2.2" /></>;
      break;
    case 'journal':
      drawing = <><path d="M16 7C12 4 7 4 3 6v20c5-2 10-1 13 2V7ZM16 7c4-3 9-3 13-1v20c-5-2-10-1-13 2V7Z" /><path d="M7 12h5M7 16h5M20 12h5M20 16h5" /></>;
      break;
    case 'notes':
      drawing = <><path d="M7 3h15l4 4v21H7V3Z" /><path d="M22 3v5h4M10 13h13" /><path d="M20 16v7a2.2 2.2 0 1 1-2.2-2.2H20M14 18v6a2.2 2.2 0 1 1-2.2-2.2H14M14 18l6-2" /></>;
      break;
    case 'music':
      drawing = <><circle cx="16" cy="16" r="12" /><circle cx="16" cy="16" r="3.1" /><path d="M16 4v6M16 22v6" opacity=".3" /></>;
      break;
    case 'exercise':
      drawing = <><path d="M6 7h20M6 12h20M6 17h20M6 22h20" /><path d="m8 26 4 3 8-9" strokeWidth="2.4" /></>;
      break;
    case 'routine':
      drawing = <><rect x="4" y="4" width="24" height="24" rx="3" /><path d="M9 10h2M15 10h9M9 16h2M15 16h9M9 22h2M15 22h9" /></>;
      break;
  }
  return <svg viewBox="0 0 32 32" aria-hidden="true" {...common} {...props}>{drawing}</svg>;
}
