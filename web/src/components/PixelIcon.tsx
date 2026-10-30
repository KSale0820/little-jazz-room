import type { CSSProperties } from 'react';
import { VISUAL_ASSETS } from '../assets/visualManifest';

export const NAV_PIXELS = {
  home: 'M3 9h2V7h2V5h2V3h4v2h2v2h2v2h2v9h-5v-6h-4v6H3z',
  explore: 'M3 3h11v2h3v2h2v7h-2v3h-3v-2h-2v-2h-2V7H3z',
  create: 'M9 2h4v7h7v4h-7v7H9v-7H2V9h7z',
  practice: 'M13 3h2v11h-2V7H7v11H5V5h8z M4 16h3v2H4z M12 12h3v2h-3z',
  profile: 'M8 3h6v2h2v6h-2v2h-6v-2H6V5h2z M5 15h12v2h2v3H3v-3h2z',
} as const;

export type NavRoute = keyof typeof NAV_PIXELS;

/** Corrected Explore and Practice marks. Painted with currentColor via CSS mask. */
const NAV_FILES = {
  explore: VISUAL_ASSETS.icons.nav.explore,
  practice: VISUAL_ASSETS.icons.nav.practice,
} as const;

export function PixelIcon({ route }: { route: NavRoute }) {
  if (route === 'explore' || route === 'practice') {
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
