import type { SyntheticEvent } from 'react';
import { useAppearance } from '../../context/AppearanceContext';
import { VERIFIED_PIXEL_CATS, type DecorativeCatPose } from '../../assets/cleanPixelAssets';
import { useImageFallback } from '../../lib/useImageFallback';
import { isVisibleCatId, type CatId, type VisibleCatId } from './CatCompanion';
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
  const visibleId: VisibleCatId = isVisibleCatId(catId) ? catId : 'luna';
  // Only the three newly verified pixel designs are eligible for display.
  // When one pose fails to decode, the other new pose is the safe fallback,
  // never an outdated portrait/sleeping cat from the October asset archive.
  const pose = variant === 'sitting' ? 'sitting' : 'sleeping';
  const alternate = pose === 'sitting' ? 'sleeping' : 'sitting';
  const pixelUrl = VERIFIED_PIXEL_CATS[pose][visibleId]!;
  const { src, onError: advanceFallback } = useImageFallback(
    [pixelUrl, VERIFIED_PIXEL_CATS[alternate][visibleId]!],
    `pixel-decor:${variant}:${visibleId}`,
  );

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
        imageRendering: 'pixelated',
      }}
    />
  );
}
