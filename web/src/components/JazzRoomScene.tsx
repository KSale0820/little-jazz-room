import type { ResolvedLighting } from '../lib/roomLighting';
import type { ReactNode } from 'react';
import './JazzRoomScene.css';

const ROOM_SRC: Record<ResolvedLighting, string> = {
  sunshine: '/room/home-room-base.png',
  twilight: '/room/home-room-twilight.png',
  night: '/room/home-room-night.png',
};

export type RoomHotspot = 'piano' | 'stand' | 'notebook';

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  greeting: string;
  settingsControl: ReactNode;
  catOverlay: ReactNode;
  onHotspot: (target: RoomHotspot) => void;
}

/** Cat-free illustrated room per design lock; companion is overlaid separately. */
export function JazzRoomScene({
  lighting,
  greeting,
  settingsControl,
  catOverlay,
  onHotspot,
}: JazzRoomSceneProps) {
  return (
    <div className="jazz-room-scene home-hero" data-mode={lighting}>
      <img className="jazz-room-photo" src={ROOM_SRC[lighting]} alt="" aria-hidden />
      <div className="scene-header home-hero-header">
        <h1>My Jazz Room</h1>
        <p>{greeting}</p>
      </div>
      <div className="home-settings">{settingsControl}</div>
      <div className="room-hotspots" aria-label="Room shortcuts">
        <button type="button" className="room-hotspot piano" onClick={() => onHotspot('piano')}>
          Piano · Practice
        </button>
        <button type="button" className="room-hotspot stand" onClick={() => onHotspot('stand')}>
          Music stand · Explore
        </button>
        <button type="button" className="room-hotspot notebook" onClick={() => onHotspot('notebook')}>
          Notebook · Saved
        </button>
      </div>
      <div className="home-cat-stage">{catOverlay}</div>
    </div>
  );
}
