import type { SyntheticEvent } from 'react';
import { useAppearance } from '../../context/AppearanceContext';
import { decorativeCatUrls, VERIFIED_PIXEL_CATS, type DecorativeCatPose } from '../../assets/cleanPixelAssets';
import { useImageFallback } from '../../lib/useImageFallback';
import type { CatId } from './CatCompanion';
import './decorative-cat.css';

/**
 * Scene-only companion artwork. Only use at current decorative placements.
 * Agent 1 owns persisted Cat Mode via AppearanceContext.
 * Does not alter portraits, chooser, reward, or unlock artwork.
 */
export function DecorativeCat({ catId, variant = 'sleeping', size = 96, className = '', onLoad, onError }: {
  catId: CatId;
  variant?: DecorativeCatPose;
  size?: number;
  className?: string;
  /** Optional integration callbacks for existing image-ready wrappers (Home). */
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: SyntheticEvent<HTMLImageElement>) => void;
}) {
  const { catMode } = useAppearance();
  const pixelUrl = VERIFIED_PIXEL_CATS[variant][catId];
  const { src, onError: advanceFallback } = useImageFallback(decorativeCatUrls(catId, variant), `pixel-decor:${variant}:${catId}`);

  return (
    <img
      className={`jazz-cat-sprite pixel-decorative-cat ${className}`.trim()}
      src={src}
      onLoad={onLoad}
      onError={event => { advanceFallback(); onError?.(event); }}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      data-decorative-cat="true"
      data-cat-mode={catMode ? 'on' : 'off'}
      style={{
        visibility: catMode ? 'visible' : 'hidden',
        // The approved 128×128 sleeping PNGs are already pixel sprites.
        imageRendering: variant === 'sleeping' || (pixelUrl && src === pixelUrl) ? 'pixelated' : 'auto',
      }}
    />
  );
}
