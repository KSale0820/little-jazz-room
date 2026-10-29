/**
 * Central visual asset manifest — exact public URLs and fallbacks.
 * Never crop APPROVED-VISUAL-REFERENCE.png for runtime assets.
 */
import type { CatId } from '../features/cats/CatCompanion';
import type { ResolvedLighting } from '../lib/roomLighting';

export type RoomLightingAsset = ResolvedLighting;

export const VISUAL_ASSETS = {
  decor: {
    botanicalCorner: '/decor/botanical-corner.svg',
    plant: '/decor/plant.png',
    books: '/decor/books.png',
    mug: '/decor/mug.png',
  },
  room: {
    /** Cat-free hero room (installed individual scene art). */
    hero: {
      sunshine: '/room/home-hero-sunshine.png',
      twilight: '/room/home-hero-twilight.png',
      night: '/room/home-hero-night.png',
    },
    /** Vector fallback if hero PNG fails to load. */
    vectorFallback: {
      sunshine: '/room/catfree-sunshine.svg',
      twilight: '/room/catfree-twilight.svg',
      night: '/room/catfree-night.svg',
    },
  },
  cat: {
    portraitFile: (id: CatId) => `/jazz-cat-assets/${id}-portrait.png`,
    spriteFile: (id: CatId) => `/jazz-cat-assets/${id}.svg`,
    iconFile: (id: CatId) => `/jazz-cat-assets/${id}-icon.png`,
    smallFile: (id: CatId) => `/jazz-cat-assets/${id}-small.png`,
    cardFile: (id: CatId) => `/jazz-cat-assets/cards/${id}-card.png`,
  },
} as const;

export function roomArtUrls(lighting: RoomLightingAsset): string[] {
  return [
    VISUAL_ASSETS.room.hero[lighting],
    VISUAL_ASSETS.room.vectorFallback[lighting],
  ];
}

export function catPortraitUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.portraitFile(id), VISUAL_ASSETS.cat.spriteFile(id)];
}

export function catSpriteUrl(id: CatId): string {
  return VISUAL_ASSETS.cat.spriteFile(id);
}

export function catPortraitUrl(id: CatId): string {
  return VISUAL_ASSETS.cat.portraitFile(id);
}

/**
 * Full-body illustrated cat PNG (not the pixel-art SVG sprite).
 * Use this on Home and wherever an illustrated floor-sitting cat is needed.
 */
export function catFloorUrl(id: CatId): string {
  return `/jazz-cat-assets/${id}.png`;
}
