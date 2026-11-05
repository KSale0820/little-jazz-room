/** Additive clean-theme artwork. Original approved cat assets remain untouched. */
import { VISUAL_ASSETS } from './visualManifest';
import type { CatId } from '../features/cats/CatCompanion';

export const PIXEL_MOTIFS = {
  plant: '/visuals/pixel-motifs/plant.svg',
  leaves: '/visuals/pixel-motifs/leaves.svg',
  musicNotes: '/visuals/pixel-motifs/music-notes.svg',
} as const;

/** Decorative poses already in use. This does not authorize adding new placements. */
export type DecorativeCatPose = 'sleeping' | 'sitting' | 'floor';

/**
 * Only list individually verified pixel PNG replacements here.
 * Empty mappings deliberately show the original approved image at first.
 * Portraits, chooser images, achievements, and saved unlocks never use this mapping.
 */
export const VERIFIED_PIXEL_CATS: Record<DecorativeCatPose, Partial<Record<CatId, string>>> = {
  sleeping: {},
  sitting: {},
  floor: {},
};

export function approvedDecorativeCatUrl(catId: CatId, pose: DecorativeCatPose): string {
  switch (pose) {
    case 'sleeping': return VISUAL_ASSETS.cat.sleepingFile(catId);
    case 'sitting': return VISUAL_ASSETS.cat.sittingFile(catId);
    case 'floor': return VISUAL_ASSETS.cat.fullBodyFile(catId);
  }
}

/** Verified replacement first, approved image as nonpixel fallback. */
export function decorativeCatUrls(catId: CatId, pose: DecorativeCatPose): string[] {
  const approved = approvedDecorativeCatUrl(catId, pose);
  const pixel = VERIFIED_PIXEL_CATS[pose][catId];
  return pixel && pixel !== approved ? [pixel, approved] : [approved];
}
