import type { CSSProperties } from 'react';
import { VISUAL_ASSETS } from '../assets/visualManifest';

const NAV_PIXELS = {
  home: 'M3 9h2V7h2V5h2V3h4v2h2v2h2v2h2v9h-5v-6h-4v6H3z',
  tracks: 'M11 2a9 9 0 1 0 .01 0z M11 8a3 3 0 1 1 -.01 6 3 3 0 0 1 .01-6z',
  progress: 'M3 18h4v-6H3z M9 18h4V8H9z M15 18h4V4h-4z',
  explore: 'M3 3h11v2h3v2h2v7h-2v3h-3v-2h-2v-2h-2V7H3z',
  create: 'M9 2h4v7h7v4h-7v7H9v-7H2V9h7z',
  practice: 'M14 2v12.1A4 4 0 1 0 17 18V6l4-1V2z M14 5l7-2v2l-7 2z',
  profile: 'M8 3h6v2h2v6h-2v2h-6v-2H6V5h2z M5 15h12v2h2v3H3v-3h2z',
} as const;

export type NavRoute = keyof typeof NAV_PIXELS;

/** Corrected Explore and Practice marks. Painted with currentColor via CSS mask. */
const NAV_FILES = {
  explore: VISUAL_ASSETS.icons.nav.explore,
} as const;

export function PixelIcon({ route }: { route: NavRoute }) {
  if (route === 'explore') {
    return (
      <span
        className="pix pix-mask"
        style={{ '--pix-mask': `url("${NAV_FILES[route]}")` } as CSSProperties}
        aria-hidden
      />
    );
  }
  return (
    <svg className="pix" viewBox="0 0 22 22" aria-hidden>
      <path d={NAV_PIXELS[route]} />
    </svg>
  );
}
