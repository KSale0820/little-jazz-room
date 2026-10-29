import type { ResolvedLighting } from '../lib/roomLighting';
import type { ReactNode } from 'react';
import { RoomArt } from './RoomArt';
import './JazzRoomScene.css';

export type RoomHotspot = 'piano' | 'stand' | 'notebook';

const HOTSPOT_META: Record<
  RoomHotspot,
  { hint: string; label: string; className: string }
> = {
  piano: { hint: 'Practice', label: 'Piano — open practice', className: 'piano' },
  stand: { hint: 'Explore', label: 'Music stand — browse routines', className: 'stand' },
  notebook: { hint: 'Saved', label: 'Notebook — saved routines and progress', className: 'notebook' },
};

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  greeting: string;
  settingsControl: ReactNode;
  catOverlay: ReactNode;
  onHotspot: (target: RoomHotspot) => void;
}

/** Cat-free room art with one companion overlay and invisible hotspots (hints on hover/focus). */
export function JazzRoomScene({
  lighting,
  greeting,
  settingsControl,
  catOverlay,
  onHotspot,
}: JazzRoomSceneProps) {
  return (
    <div className="jazz-room-scene home-hero botanical-frame" data-mode={lighting}>
      <RoomArt lighting={lighting} />
      <div className="scene-header home-hero-header">
        <h1>My Jazz Room</h1>
        <p>{greeting}</p>
      </div>
      <div className="home-settings">{settingsControl}</div>
      <div className="room-hotspots" aria-label="Room shortcuts">
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
