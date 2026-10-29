import type { ResolvedLighting } from '../lib/roomLighting';
import './JazzRoomScene.css';

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  lightingControl: React.ReactNode;
  onPiano: () => void;
  onMusicStand: () => void;
  onNotebook: () => void;
  catOverlay: React.ReactNode;
}

/** Cat-free illustrated room — same layout; palette shifts by sunshine / twilight / night. */
export function JazzRoomScene({
  lighting,
  lightingControl,
  onPiano,
  onMusicStand,
  onNotebook,
  catOverlay,
}: JazzRoomSceneProps) {
  return (
    <div className="jazz-room-scene" data-mode={lighting}>
      <svg
        className="jazz-room-art"
        viewBox="0 0 400 320"
        role="img"
        aria-label="Cozy jazz studio with piano, upright bass, saxophone, plants, and music stand. No cat is part of the scenery."
      >
        <defs>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--room-wall-top)" />
            <stop offset="100%" stopColor="var(--room-wall-bottom)" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--room-floor-a)" />
            <stop offset="100%" stopColor="var(--room-floor-b)" />
          </linearGradient>
        </defs>
        <rect width="400" height="320" fill="url(#wallGrad)" />
        <rect y="250" width="400" height="70" fill="url(#floorGrad)" />
        <rect x="30" y="40" width="120" height="180" rx="4" fill="var(--room-window)" opacity="0.35" />
        <rect x="250" y="35" width="110" height="190" rx="4" fill="var(--room-window)" opacity="0.35" />
        <g opacity="0.25" fill="var(--room-skyline)">
          <rect x="45" y="120" width="18" height="70" />
          <rect x="68" y="95" width="22" height="95" />
          <rect x="95" y="110" width="14" height="80" />
          <rect x="265" y="100" width="20" height="90" />
          <rect x="290" y="85" width="16" height="105" />
          <rect x="312" y="115" width="24" height="75" />
        </g>
        <ellipse cx="200" cy="268" rx="170" ry="22" fill="#000" opacity="0.08" />
        <rect x="18" y="155" width="95" height="58" rx="3" fill="#2a211c" />
        <rect x="22" y="150" width="88" height="12" rx="2" fill="#1a1512" />
        <rect x="28" y="162" width="72" height="38" fill="#f5f0e6" opacity="0.9" />
        <path d="M125 210 L125 120 L138 108 L148 118 L148 210 Z" fill="#5c4033" />
        <ellipse cx="136" cy="108" rx="18" ry="14" fill="#6b4a3a" />
        <rect x="300" y="175" width="8" height="75" fill="#4a3728" />
        <ellipse cx="304" cy="172" rx="22" ry="8" fill="#3d2d22" />
        <rect x="175" y="195" width="50" height="55" fill="#8b7355" rx="2" />
        <rect x="182" y="188" width="36" height="8" fill="#6e5a42" />
        <circle cx="340" cy="210" r="28" fill="#3d6b4f" opacity="0.85" />
        <rect x="332" y="210" width="16" height="40" fill="#5a4030" />
        <circle cx="55" cy="215" r="22" fill="#4a7a55" opacity="0.8" />
        <rect x="48" y="215" width="14" height="35" fill="#5a4030" />
        <rect x="220" y="130" width="6" height="90" fill="#333" />
        <path d="M226 130 Q250 125 260 145 L258 155 Q240 140 226 145 Z" fill="#c9a227" opacity="0.7" />
      </svg>
      <div className="scene-header">
        <h1>My Jazz Room</h1>
        <p>Good to see you. Let&apos;s make music.</p>
      </div>
      <div className="lighting-control">{lightingControl}</div>
      <button type="button" className="hotspot piano" onClick={onPiano} aria-label="Piano: open Practice">
        Piano → Practice
      </button>
      <button
        type="button"
        className="hotspot book"
        onClick={onMusicStand}
        aria-label="Sheet music: explore exercises"
      >
        Book → Exercises
      </button>
      <button
        type="button"
        className="hotspot notebook"
        onClick={onNotebook}
        aria-label="Notebook: saved routines"
      >
        Saved routines
      </button>
      {catOverlay}
    </div>
  );
}
