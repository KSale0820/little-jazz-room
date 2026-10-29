/**
 * Central visual asset manifest — exact public URLs and fallbacks.
 * Replace primary files in /public when final cat-free room art and portraits ship.
 * Never crop APPROVED-VISUAL-REFERENCE.png for runtime assets.
 */
import type { CatId } from '../features/cats/CatCompanion';
import type { ResolvedLighting } from '../lib/roomLighting';

export type RoomLightingAsset = ResolvedLighting;

export const VISUAL_ASSETS = {
  decor: {
    botanicalCorner: '/decor/botanical-corner.svg',
  },
  room: {
    /** Cat-free illustrated room (SVG). Legacy PNGs in /room/ are deprecated collage crops. */
    catFree: {
      sunshine: '/room/catfree-sunshine.svg',
      twilight: '/room/catfree-twilight.svg',
      night: '/room/catfree-night.svg',
    },
    /** Deprecated — may contain baked-in cats or tight crops; listed only as last-resort fallback. */
    legacyPhoto: {
      sunshine: '/room/home-room-base.png',
      twilight: '/room/home-room-twilight.png',
      night: '/room/home-room-night.png',
    },
  },
  cat: {
    portraitFile: (id: CatId) => `/jazz-cat-assets/${id}-portrait.png`,
    spriteFile: (id: CatId) => `/jazz-cat-assets/${id}.svg`,
    cardFile: (id: CatId) => `/jazz-cat-assets/cards/${id}-card.png`,
  },
} as const;

export function roomArtUrls(lighting: RoomLightingAsset): string[] {
  const primary = VISUAL_ASSETS.room.catFree[lighting];
  const legacy = VISUAL_ASSETS.room.legacyPhoto[lighting];
  return [primary, legacy];
}

export function catPortraitUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.portraitFile(id), VISUAL_ASSETS.cat.spriteFile(id)];
}

export function catSpriteUrl(id: CatId): string {
  return VISUAL_ASSETS.cat.spriteFile(id);
}
