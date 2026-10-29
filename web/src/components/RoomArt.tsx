import { useMemo, useState } from 'react';
import type { ResolvedLighting } from '../lib/roomLighting';
import { roomArtUrls } from '../assets/visualManifest';

interface RoomArtProps {
  lighting: ResolvedLighting;
  className?: string;
}

/** Tries cat-free SVG first, then deprecated legacy PNG only if SVG fails to load. */
export function RoomArt({ lighting, className = 'jazz-room-photo' }: RoomArtProps) {
  const candidates = useMemo(() => roomArtUrls(lighting), [lighting]);
  const [index, setIndex] = useState(0);
  const src = candidates[Math.min(index, candidates.length - 1)];

  return (
    <img
      className={className}
      src={src}
      alt=""
      aria-hidden
      onError={() => {
        if (index < candidates.length - 1) setIndex(i => i + 1);
      }}
    />
  );
}
