/**
 * Central visual asset manifest — exact public URLs and fallbacks.
 * Never crop APPROVED-VISUAL-REFERENCE.png for runtime assets.
 *
 * Approved portrait room art is registered under `room.approved` and is not
 * live. Home still uses the 1440×800 landscape heroes until hotspot geometry
 * is updated. See web/docs/APPROVED-ASSET-LIBRARY.md.
 */
import type { CatId } from '../features/cats/CatCompanion';
import type { ResolvedLighting } from '../lib/roomLighting';

export type RoomLightingAsset = ResolvedLighting;

/** Shared frame for the approved portrait room and its overlays. Not the live stage. */
export const APPROVED_ROOM_SIZE = { width: 941, height: 1672 } as const;

export const VISUAL_ASSETS = {
  decor: {
    botanicalCorner: '/decor/botanical-corner.svg',
    plant: '/decor/plant.png',
    books: '/decor/books.png',
    mug: '/decor/mug.png',
  },
  room: {
    /** Live cat-free hero room (1440×800 landscape). */
    hero: {
      sunshine: '/room/home-hero-sunshine.png',
      twilight: '/room/home-hero-twilight.png',
      night: '/room/home-hero-night.png',
    },
    /** Vector fallback if the live hero PNG fails to load. */
    vectorFallback: {
      sunshine: '/room/catfree-sunshine.svg',
      twilight: '/room/catfree-twilight.svg',
      night: '/room/catfree-night.svg',
    },
    /**
     * Approved 941×1672 portrait room. Registered for the Stitch layout.
     * Do not pass these URLs to RoomArt until zones share this frame.
     */
    approved: {
      live: false as const,
      width: APPROVED_ROOM_SIZE.width,
      height: APPROVED_ROOM_SIZE.height,
      sunshine: '/visuals/room/home-hero-sunshine.png',
      twilight: '/visuals/room/home-hero-twilight.png',
      night: '/visuals/room/home-hero-night.png',
      overlays: {
        piano: '/visuals/room/overlays/piano-active.png',
        stand: '/visuals/room/overlays/stand-active.png',
        notebook: '/visuals/room/overlays/notebook-active.png',
        plants: '/visuals/room/overlays/plants-active.png',
      },
    },
  },
  cat: {
    fullBodyFile: (id: CatId) => `/visuals/cats/full-body/${id}.png`,
    profileFile: (id: CatId) => `/visuals/cats/profiles/${id}.png`,
    closeupFile: (id: CatId) => `/visuals/cats/closeups/${id}.png`,
    /** Previous sprites. Kept on disk; live helpers do not return these. */
    legacy: {
      floorFile: (id: CatId) => `/jazz-cat-assets/${id}.png`,
      portraitFile: (id: CatId) => `/jazz-cat-assets/${id}-portrait.png`,
      spriteFile: (id: CatId) => `/jazz-cat-assets/${id}.svg`,
      iconFile: (id: CatId) => `/jazz-cat-assets/${id}-icon.png`,
      smallFile: (id: CatId) => `/jazz-cat-assets/${id}-small.png`,
      cardFile: (id: CatId) => `/jazz-cat-assets/cards/${id}-card.png`,
    },
  },
  garden: {
    stage0: '/visuals/garden/garden-stage-0.png',
    stage1: '/visuals/garden/garden-stage-1.png',
    stage2: '/visuals/garden/garden-stage-2.png',
    stage3: '/visuals/garden/garden-stage-3.png',
  },
  vignettes: {
    explore: '/visuals/vignettes/explore-vignette.png',
    create: '/visuals/vignettes/create-vignette.png',
    practice: '/visuals/vignettes/practice-vignette.png',
    profile: '/visuals/vignettes/profile-vignette.png',
  },
  approvedDecor: {
    books: '/visuals/decor/books.png',
    brassLamp: '/visuals/decor/brass-lamp.png',
    coffeeMug: '/visuals/decor/coffee-mug.png',
    hangingPlant: '/visuals/decor/hanging-plant.png',
    metronome: '/visuals/decor/metronome.png',
    plant: '/visuals/decor/plant.png',
  },
  brand: {
    mark: '/visuals/brand/brand-mark.svg',
    favicon: '/visuals/brand/favicon.svg',
    wordmark: '/visuals/brand/little-jazz-room-wordmark.svg',
  },
  icons: {
    nav: {
      home: '/visuals/icons/nav-home.svg',
      explore: '/visuals/icons/nav-explore.svg',
      create: '/visuals/icons/nav-create.svg',
      practice: '/visuals/icons/nav-practice.svg',
      profile: '/visuals/icons/nav-profile.svg',
    },
    bookmark: '/visuals/icons/icon-bookmark.svg',
    copy: '/visuals/icons/icon-copy.svg',
    edit: '/visuals/icons/icon-edit.svg',
    lighting: '/visuals/icons/icon-lighting.svg',
    loop: '/visuals/icons/icon-loop.svg',
    metronome: '/visuals/icons/icon-metronome.svg',
    pause: '/visuals/icons/icon-pause.svg',
    play: '/visuals/icons/icon-play.svg',
    save: '/visuals/icons/icon-save.svg',
    search: '/visuals/icons/icon-search.svg',
    share: '/visuals/icons/icon-share.svg',
    skip: '/visuals/icons/icon-skip.svg',
  },
  achievements: {
    firstPractice: '/visuals/achievements/achievement-first-practice.png',
    firstRoutine: '/visuals/achievements/achievement-first-routine.png',
    practiceMilestone: '/visuals/achievements/achievement-practice-milestone.png',
  },
  effects: {
    musicNotes: '/visuals/effects/music-notes-overlay.png',
    windowRain: '/visuals/effects/window-rain-overlay.png',
  },
} as const;

export function roomArtUrls(lighting: RoomLightingAsset): string[] {
  return [
    VISUAL_ASSETS.room.hero[lighting],
    VISUAL_ASSETS.room.vectorFallback[lighting],
  ];
}

export function catPortraitUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.profileFile(id)];
}

/** Explicit pixel-sprite variant only. Not a fallback for missing approved art. */
export function catSpriteUrl(id: CatId): string {
  return VISUAL_ASSETS.cat.legacy.spriteFile(id);
}

export function catPortraitUrl(id: CatId): string {
  return VISUAL_ASSETS.cat.profileFile(id);
}

export function catCloseupUrl(id: CatId): string {
  return VISUAL_ASSETS.cat.closeupFile(id);
}

/**
 * Full-body approved cat PNG.
 * Used on Home, Profile, and the chooser.
 */
export function catFloorUrl(id: CatId): string {
  return VISUAL_ASSETS.cat.fullBodyFile(id);
}
