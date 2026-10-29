import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { ResolvedLighting } from '../lib/roomLighting';
import { roomArtUrls } from '../assets/visualManifest';
import { RoomArt } from './RoomArt';
import { PlantGrowthOverlay } from '../features/home-room/PlantGrowthOverlay';
import type { PlantStage } from '../features/home-room/plantGrowth';
import { computeRoomFrame, visibleZones, type RoomZoneId } from '../features/home-room/roomGeometry';
import { useElementSize } from '../features/home-room/useElementSize';
import './JazzRoomScene.css';

export type RoomHotspot = RoomZoneId;

const ZONE_META: Record<RoomZoneId, { hint: string; label: string }> = {
  plants: { hint: 'Growth', label: 'Plants — see your practice progress' },
  piano: { hint: 'Practice', label: 'Piano — open practice' },
  stand: { hint: "Today's practice", label: "Music stand — today's practice" },
  notebook: { hint: 'Saved', label: 'Bookshelf notebook — saved routines' },
};

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  plantStage: PlantStage;
  /** Companion rendered in the foreground. */
  catOverlay: ReactNode;
  /** Title chip, lighting button, speech bubble etc. */
  overlays?: ReactNode;
  notesActive?: boolean;
  onHotspot: (target: RoomHotspot) => void;
}

/**
 * Room art + hotspots share one wrapper whose rectangle is computed from the
 * artwork's real dimensions, so zones stay glued to the furniture at any size.
 */
export function JazzRoomScene({
  lighting,
  plantStage,
  catOverlay,
  overlays,
  notesActive,
  onHotspot,
}: JazzRoomSceneProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const frame = useMemo(() => computeRoomFrame(size.width, size.height), [size.width, size.height]);
  const measured = size.width > 0 && size.height > 0;
  const zones = useMemo(
    () => (measured ? visibleZones(frame.layout, size.width, frame.artHeight) : []),
    [measured, frame, size.width],
  );
  const piano = zones.find(z => z.id === 'piano');

  const style = {
    '--art-left': `${frame.layout.left}px`,
    '--art-top': `${frame.layout.top}px`,
    '--art-w': `${frame.layout.width}px`,
    '--art-h': `${frame.layout.height}px`,
    '--art-pane-h': `${frame.artHeight}px`,
    '--backdrop': `url(${roomArtUrls(lighting)[0]})`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className="jazz-room-scene"
      data-mode={lighting}
      data-layout={frame.mode}
      data-ready={measured}
      style={style}
    >
      <div className="room-backdrop" aria-hidden="true" />
      <div className="room-art-pane">
        <div className="room-art-frame">
          <div className="room-art-layer" aria-hidden="true">
            <RoomArt lighting={lighting} className="jazz-room-photo" />
            <div className="room-light room-light-window" />
            <div className="room-light room-light-lamp" />
          </div>
          <div className="room-zones" role="group" aria-label="Room objects">
            {zones.map(z => (
              <button
                key={z.id}
                type="button"
                className={`room-hotspot ${z.id}`}
                aria-label={ZONE_META[z.id].label}
                data-hint={ZONE_META[z.id].hint}
                style={{
                  left: `${z.x * 100}%`,
                  top: `${z.y * 100}%`,
                  width: `${z.w * 100}%`,
                  height: `${z.h * 100}%`,
                }}
                onClick={() => onHotspot(z.id)}
              >
                {z.id === 'plants' ? <PlantGrowthOverlay stage={plantStage} /> : null}
              </button>
            ))}
          </div>
          {notesActive && piano ? (
            <div
              className="room-notes"
              aria-hidden="true"
              style={{
                left: `${(piano.x + piano.w * 0.45) * 100}%`,
                top: `${(piano.y + piano.h * 0.2) * 100}%`,
              }}
            >
              <span>♪</span>
              <span>♫</span>
              <span>♩</span>
            </div>
          ) : null}
        </div>
        <div className="room-art-fade" aria-hidden="true" />
      </div>
      <div className="room-cat-stage">{catOverlay}</div>
      {overlays}
    </div>
  );
}
