/**
 * Central visual asset manifest — exact public URLs and fallbacks.
 * Never crop APPROVED-VISUAL-REFERENCE.png for runtime assets.
 */
import type { CatId } from '../features/cats/CatCompanion';
import type { ResolvedLighting } from '../lib/roomLighting';

export type RoomLightingAsset = ResolvedLighting;

export const VISUAL_ASSETS = {
  decor: {
    plant: '/decor/plant.png',
    books: '/decor/books.png',
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
    floorFile: (id: CatId) => `/jazz-cat-assets/${id}.png`,
  },
} as const;

export function roomArtUrls(lighting: RoomLightingAsset): string[] {
  return [
    VISUAL_ASSETS.room.hero[lighting],
    VISUAL_ASSETS.room.vectorFallback[lighting],
  ];
}

/** Ordered candidates for the head/bust portrait: PNG first, then the SVG wrapper. */
export function catPortraitUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.portraitFile(id), VISUAL_ASSETS.cat.spriteFile(id)];
}

/** Full-body illustrated PNG used on Home, Profile and the chooser; SVG wrapper as fallback. */
export function catFloorUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.floorFile(id), VISUAL_ASSETS.cat.spriteFile(id)];
}
