import type { ResolvedLighting } from '../lib/roomLighting';
import type { ReactNode } from 'react';
import { RoomArt } from './RoomArt';
import './JazzRoomScene.css';

export type RoomHotspot = 'piano' | 'stand' | 'notebook';

const HOTSPOT_META: Record<
  RoomHotspot,
  { hint: string; label: string; className: string }
> = {
  piano:    { hint: 'Practice', label: 'Piano — open practice',                     className: 'piano' },
  stand:    { hint: 'Explore',  label: 'Music stand — browse routines',              className: 'stand' },
  notebook: { hint: 'Saved',    label: 'Notebook — saved routines and progress',     className: 'notebook' },
};

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  /** Cat companion rendered over the floor area */
  catOverlay: ReactNode;
  onHotspot: (target: RoomHotspot) => void;
}

/**
 * Pure room art + cat + interactive hotspots.
 * Title and controls live in the card below — not inside this image.
 */
export function JazzRoomScene({ lighting, catOverlay, onHotspot }: JazzRoomSceneProps) {
  return (
    <div className="jazz-room-scene home-hero" data-mode={lighting} aria-hidden="true">
      <RoomArt lighting={lighting} />
      <div className="room-hotspots" role="region" aria-label="Room shortcuts" aria-hidden="false">
        {(Object.keys(HOTSPOT_META) as RoomHotspot[]).map(key => {
          const meta = HOTSPOT_META[key];
          return (
            <button
              key={key}
              type="button"
              className={`room-hotspot ${meta.className}`}
              aria-label={meta.label}
              data-hint={meta.hint}
              onClick={() => onHotspot(key)}
            />
          );
        })}
      </div>
      <div className="home-cat-stage">{catOverlay}</div>
    </div>
  );
}
