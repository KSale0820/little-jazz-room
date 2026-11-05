/** Additive clean-theme artwork. Original approved cat assets remain untouched. */
import { VISUAL_ASSETS } from './visualManifest';
import type { CatId } from '../features/cats/CatCompanion';

/** Mirror the central manifest so strict asset packaging tests cover these files. */
export const PIXEL_MOTIFS = VISUAL_ASSETS.pixelMotifs;
/** Owner-approved, individually addressable color motifs shared by Light and Dark themes. */
export const APPROVED_PIXEL_MOTIFS = VISUAL_ASSETS.approvedPixelMotifs;

/** Decorative poses already in use. This does not authorize adding new placements. */
export type DecorativeCatPose = 'sleeping' | 'sitting' | 'floor';

/**
 * Only list individually verified pixel PNG replacements here.
 * Empty mappings deliberately show the original approved image at first.
 * Portraits, chooser images, achievements, and saved unlocks never use this mapping.
 */
export const VERIFIED_PIXEL_CATS: Record<DecorativeCatPose, Partial<Record<CatId, string>>> = {
  sleeping: {
    luna: VISUAL_ASSETS.decorativePixelCats.luna.sleeping,
    milo: VISUAL_ASSETS.decorativePixelCats.milo.sleeping,
    maple: VISUAL_ASSETS.decorativePixelCats.maple.sleeping,
  },
  sitting: {
    luna: VISUAL_ASSETS.decorativePixelCats.luna.sitting,
    milo: VISUAL_ASSETS.decorativePixelCats.milo.sitting,
    maple: VISUAL_ASSETS.decorativePixelCats.maple.sitting,
  },
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
