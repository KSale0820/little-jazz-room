import { roomArtUrls } from '../assets/visualManifest';
import type { ResolvedLighting } from '../lib/roomLighting';
import { useImageFallback } from '../lib/useImageFallback';

interface RoomArtProps {
  lighting: ResolvedLighting;
  className?: string;
}

/** Cat-free hero PNG first, vector SVG only if that image fails; resets whenever the lighting changes. */
export function RoomArt({ lighting, className = 'jazz-room-photo' }: RoomArtProps) {
  const { src, onError } = useImageFallback(roomArtUrls(lighting), `room:${lighting}`);
  return <img className={className} src={src} alt="" aria-hidden onError={onError} />;
}
