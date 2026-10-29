import type { ResolvedLighting } from '../lib/roomLighting';
import type { ReactNode } from 'react';
import './JazzRoomScene.css';

const HERO_SRC: Record<ResolvedLighting, string> = {
  sunshine: '/room/home-hero-sunshine.png',
  twilight: '/room/home-hero-twilight.png',
  night: '/room/home-hero-night.png',
};

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  greeting: string;
  settingsControl: ReactNode;
  catOverlay: ReactNode;
}

/** Full-bleed illustrated home hero from approved Home mock. */
export function JazzRoomScene({ lighting, greeting, settingsControl, catOverlay }: JazzRoomSceneProps) {
  return (
    <div className="jazz-room-scene home-hero" data-mode={lighting}>
      <img className="jazz-room-photo" src={HERO_SRC[lighting]} alt="" aria-hidden />
      <div className="scene-header home-hero-header">
        <h1>My Jazz Room</h1>
        <p>{greeting}</p>
      </div>
      <div className="home-settings">{settingsControl}</div>
      <div className="home-cat-stage">{catOverlay}</div>
    </div>
  );
}
