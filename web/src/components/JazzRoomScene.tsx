import type { ResolvedLighting } from '../lib/roomLighting';
import './JazzRoomScene.css';

const ROOM_SRC: Record<ResolvedLighting, string> = {
  sunshine: '/room/home-room-base.png',
  twilight: '/room/home-room-twilight.png',
  night: '/room/home-room-night.png',
};

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  lightingControl: React.ReactNode;
  catOverlay: React.ReactNode;
}

/** Static illustrated room from revised-cat-board-1 (cat added as separate overlay). */
export function JazzRoomScene({ lighting, lightingControl, catOverlay }: JazzRoomSceneProps) {
  return (
    <div className="jazz-room-scene" data-mode={lighting}>
      <img
        className="jazz-room-photo"
        src={ROOM_SRC[lighting]}
        alt=""
        aria-hidden
      />
      <div className="scene-header">
        <h1>My Jazz Room</h1>
        <p>Good to see you. Let&apos;s make music.</p>
      </div>
      <div className="lighting-control">{lightingControl}</div>
      {catOverlay}
    </div>
  );
}
