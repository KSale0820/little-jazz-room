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
export function DecorativeCat({ catId, variant = 'sleeping', size = 96, className = '' }: {
  catId: CatId;
  variant?: DecorativeCatPose;
  size?: number;
  className?: string;
}) {
  const { catMode } = useAppearance();
  const pixelUrl = VERIFIED_PIXEL_CATS[variant][catId];
  const { src, onError } = useImageFallback(decorativeCatUrls(catId, variant), `pixel-decor:${variant}:${catId}`);

  return (
    <img
      className={`jazz-cat-sprite pixel-decorative-cat ${className}`.trim()}
      src={src}
      onError={onError}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      data-decorative-cat="true"
      data-cat-mode={catMode ? 'on' : 'off'}
      style={{
        visibility: catMode ? 'visible' : 'hidden',
        imageRendering: pixelUrl && src === pixelUrl ? 'pixelated' : 'auto',
      }}
    />
  );
}
