/**
 * Central visual asset manifest — exact public URLs and fallbacks.
 * Never crop APPROVED-VISUAL-REFERENCE.png for runtime assets.
 *
 * H01 loads `room.h01` first, with `room.approved[lighting]` as a fallback.
 * The older landscape `room.hero` entries are retained for legacy screens.
 * See web/docs/APPROVED-ASSET-LIBRARY.md.
 */
import type { CatId } from '../features/cats/CatCompanion';
import type { ResolvedLighting } from '../lib/roomLighting';

export type RoomLightingAsset = ResolvedLighting;

/** Shared frame for the approved portrait room and its overlays. Not the live stage. */
export const APPROVED_ROOM_SIZE = { width: 941, height: 1672 } as const;

export const VISUAL_ASSETS = {
  decor: {
    plant: '/decor/plant.png',
    books: '/decor/books.png',
  },
  room: {
    /** Exact user-provided H01 room image, with no UI or cat baked in. */
    h01: '/visuals/room/h01-approved-room.jpeg',
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
    /** The user's approved October 31 class-MVP art pack. Sole source of cat illustrations. */
    sleepingFile: (id: CatId) => `/visuals/cats/sleeping/${id}.png`,
    ...{ sittingFile: (id: CatId) => `/visuals/cats/approved-class-mvp/sitting/${id}.png` },
    fullBodyFile: (id: CatId) => `/visuals/cats/approved-class-mvp/full-body/${id}.png`,
    /** Approved sitting poses. Preserve the original full-resolution PNG binaries. */
    sittingFile: (id: CatId) => `/visuals/cats/approved-class-mvp/sitting/${id}.png`,
    profileFile: (id: CatId) => `/visuals/cats/approved-class-mvp/profiles/${id}.png`,
    closeupFile: (id: CatId) => `/visuals/cats/approved-class-mvp/closeups/${id}.png`,
  },
  /** Three opt-in low-resolution decorative characters; the eight approved identity assets remain untouched. */
  decorativePixelCats: {
    luna: {
      sleeping: '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/luna-sleeping.png',
      sitting: '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/luna-sitting.png',
    },
    milo: {
      sleeping: '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/milo-sleeping.png',
      sitting: '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/milo-sitting.png',
    },
    maple: {
      sleeping: '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/maple-sleeping.png',
      sitting: '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/cats/maple-sitting.png',
    },
  },
  progress: {
    roomBackground: '/visuals/progress/g01-room-background.png',
    goalLeaves: '/visuals/progress/g01-goal-leaves.png',
    sleepCushion: '/visuals/shared-mvp/companion-surfaces/evergreen-sleep-cushion.png',
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
  /** Approved reusable class-MVP illustrations; each path is an original supplied PNG. */
  sharedMvp: {
    botanicals: {
      topLeft: '/visuals/shared-mvp/botanicals/pothos-top-left.png',
      topRight: '/visuals/shared-mvp/botanicals/pothos-top-right.png',
      shortTrail: '/visuals/shared-mvp/botanicals/pothos-short-trail.png',
    },
    practice: {
      vinyl: '/visuals/shared-mvp/practice/free-practice-vinyl.png',
      stand: '/visuals/shared-mvp/practice/guided-practice-stand.png',
    },
    covers: {
      evening: '/visuals/shared-mvp/covers/recent-evening-window.png',
      rainy: '/visuals/shared-mvp/covers/recent-rainy-studio.png',
    },
    companionSurfaces: {
      cushion: '/visuals/shared-mvp/companion-surfaces/evergreen-sleep-cushion.png',
      rug: '/visuals/shared-mvp/companion-surfaces/oatmeal-oval-rug.png',
    },
  },
  /** Approved P04/P05 transparent botanical room backgrounds. */
  tools: {
    tunerBackground: '/visuals/tools/p04-tuner-background.png',
    metronomeBackground: '/visuals/tools/p05-metronome-room-2026-11-02.webp',
    metronomeFallback: '/visuals/tools/p05-metronome-background.png',
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
  /** Minimal geometric motifs for both clean themes, tinted via CSS mask and semantic tokens. */
  pixelMotifs: {
    plant: '/visuals/pixel-motifs/plant.svg',
    leaves: '/visuals/pixel-motifs/leaves.svg',
    musicNotes: '/visuals/pixel-motifs/music-notes.svg',
  },
  /** Approved independent full-color pixel art, for sparse Light/Dark decorations. */
  streakFlame: '/visuals/new-assets/2026-11-07-sharp-pixel/approved-parts-1-2/progress/streak-flame.png',
  approvedPixelMotifs: {
    beamedNotes: '/visuals/pixel-motifs/approved/beamed-notes.png',
    centerDot: '/visuals/pixel-motifs/approved/center-dot.png',
    centerLeaf: '/visuals/pixel-motifs/approved/center-leaf.png',
    cornerLeft: '/visuals/pixel-motifs/approved/corner-left.png',
    cornerRight: '/visuals/pixel-motifs/approved/corner-right.png',
    dividerLeaf: '/visuals/pixel-motifs/approved/divider-leaf.png',
    dividerNote: '/visuals/pixel-motifs/approved/divider-note.png',
    eighthNote: '/visuals/pixel-motifs/approved/eighth-note.png',
    hangingPlant: '/visuals/pixel-motifs/approved/hanging-plant.png',
    ivyTrail: '/visuals/pixel-motifs/approved/ivy-trail.png',
    leafCluster: '/visuals/pixel-motifs/approved/leaf-cluster.png',
    plantPot: '/visuals/pixel-motifs/approved/plant-pot.png',
    planterBox: '/visuals/pixel-motifs/approved/planter-box.png',
    plusSparkle: '/visuals/pixel-motifs/approved/plus-sparkle.png',
    smallPlant: '/visuals/pixel-motifs/approved/small-plant.png',
    sparkleCluster: '/visuals/pixel-motifs/approved/sparkle-cluster.png',
    sparkle: '/visuals/pixel-motifs/approved/sparkle.png',
    staffWave: '/visuals/pixel-motifs/approved/staff-wave.png',
    trebleClef: '/visuals/pixel-motifs/approved/treble-clef.png',
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

/** No legacy cat fallbacks: an absent image is an installation error, never an excuse to show old art. */
export function catPortraitUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.profileFile(id)];
}

export function catFloorUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.fullBodyFile(id)];
}

export function catCloseupUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.closeupFile(id)];
}

/** All eight companions now have approved sleeping poses. Never fall back to legacy cats. */
export function catSleepingUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.sleepingFile(id)];
}

/** All eight approved sitting poses, with no legacy fallback. */
export function catSittingUrls(id: CatId): string[] {
  return [VISUAL_ASSETS.cat.sittingFile(id)];
}
