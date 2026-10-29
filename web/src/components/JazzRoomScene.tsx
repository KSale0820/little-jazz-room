import type { ResolvedLighting } from '../lib/roomLighting';
import type { ReactNode } from 'react';
import { RoomArt } from './RoomArt';
import './JazzRoomScene.css';

export type RoomHotspot = 'piano' | 'stand' | 'notebook';

const HOTSPOT_META: Record<
  RoomHotspot,
  { hint: string; label: string; className: string }
> = {
  piano:    { hint: 'Practice', label: 'Piano — open practice',                className: 'piano' },
  stand:    { hint: 'Explore',  label: 'Music stand — browse routines',        className: 'stand' },
  notebook: { hint: 'Saved',    label: 'Notebook — saved routines and goals',  className: 'notebook' },
};

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  /** Illustrated cat companion rendered over the floor area */
  catOverlay: ReactNode;
  onHotspot: (target: RoomHotspot) => void;
}

/**
 * Room art with interactive hotspots and a cat companion overlay.
 *
 * Accessibility note: the outer element is NOT aria-hidden because it contains
 * focusable hotspot buttons. Only the decorative background image is hidden.
 */
export function JazzRoomScene({ lighting, catOverlay, onHotspot }: JazzRoomSceneProps) {
  return (
    <div className="jazz-room-scene home-hero" data-mode={lighting}>
      {/* Decorative background — hidden from screen readers */}
      <RoomArt lighting={lighting} />

      {/* Interactive hotspots — must NOT be inside an aria-hidden container */}
      <nav className="room-hotspots" aria-label="Room shortcuts">
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
      </nav>

      {/* Cat companion — interactive (tap to choose cat) */}
      <div className="home-cat-stage">{catOverlay}</div>
    </div>
  );
}
