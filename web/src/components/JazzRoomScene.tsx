import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { ResolvedLighting } from '../lib/roomLighting';
import { RoomArt } from './RoomArt';
import { PlantGrowthOverlay } from '../features/home-room/PlantGrowthOverlay';
import type { PlantStage } from '../features/home-room/plantGrowth';
import {
  CAT_ANCHOR,
  ROOM_ZONES,
  computeRoomFrame,
  scrollLeftForZone,
  visibleZones,
  type RoomZoneId,
} from '../features/home-room/roomGeometry';
import { useElementSize } from '../features/home-room/useElementSize';
import './JazzRoomScene.css';

export type RoomHotspot = RoomZoneId;

const ZONE_META: Record<RoomZoneId, { hint: string; label: string }> = {
  plants: { hint: 'Garden', label: 'Plants — see your practice progress' },
  piano: { hint: 'Practice', label: 'Piano — open practice' },
  stand: { hint: "Today's practice", label: "Sheet music stand — today's practice" },
  notebook: { hint: 'Saved routines', label: 'Bookshelf notebook — saved routines' },
};

const PAN_EDGE = 28;

interface JazzRoomSceneProps {
  lighting: ResolvedLighting;
  plantStage: PlantStage;
  /** Companion, rendered inside the room so it shares the art's scale and lighting. */
  catOverlay: ReactNode;
  overlays?: ReactNode;
  notesActive?: boolean;
  onHotspot: (target: RoomHotspot) => void;
}

/**
 * Art, hotspots and companion share one wrapper whose rectangle is computed from the
 * artwork's real dimensions. On phones the wrapper is wider than the screen and pans.
 */
export function JazzRoomScene({ lighting, plantStage, catOverlay, overlays, notesActive, onHotspot }: JazzRoomSceneProps) {
  const [ref, size] = useElementSize<HTMLDivElement>();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const frame = useMemo(() => computeRoomFrame(size.width, size.height), [size.width, size.height]);
  const measured = size.width > 0 && size.height > 0;
  const compact = frame.mode === 'compact';
  const zones = useMemo(
    () => (measured ? visibleZones(frame.layout, frame.contentWidth, frame.contentHeight) : []),
    [measured, frame],
  );
  const piano = zones.find(z => z.id === 'piano');
  const maxScroll = Math.max(0, frame.layout.width - size.width);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || !measured) return;
    el.scrollLeft = compact ? frame.initialScrollLeft : 0;
    setScrollLeft(el.scrollLeft);
  }, [measured, compact, frame.initialScrollLeft]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrollLeft(el.scrollLeft);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const panTo = useCallback(
    (id: RoomZoneId) => {
      const zone = ROOM_ZONES.find(z => z.id === id);
      if (!zone) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scrollerRef.current?.scrollTo({ left: scrollLeftForZone(zone, frame.layout, size.width), behavior: reduce ? 'auto' : 'smooth' });
    },
    [frame.layout, size.width],
  );

  const anchor = CAT_ANCHOR[frame.mode];
  const style = {
    '--art-left': `${frame.layout.left}px`,
    '--art-top': `${frame.layout.top}px`,
    '--art-w': `${frame.layout.width}px`,
    '--art-h': `${frame.layout.height}px`,
    '--cat-x': `${anchor.x * 100}%`,
    '--cat-y': `${anchor.y * 100}%`,
    '--cat-w': `${anchor.w * 100}%`,
  } as CSSProperties;

  return (
    <div ref={ref} className="jazz-room-scene" data-mode={lighting} data-layout={frame.mode} data-ready={measured} style={style}>
      <div ref={scrollerRef} className="room-scroller">
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
                style={{ left: `${z.x * 100}%`, top: `${z.y * 100}%`, width: `${z.w * 100}%`, height: `${z.h * 100}%` }}
                onClick={() => onHotspot(z.id)}
              >
                {z.id === 'plants' ? <PlantGrowthOverlay stage={plantStage} /> : null}
              </button>
            ))}
          </div>
          <div className="room-cat">{catOverlay}</div>
          {notesActive && piano ? (
            <div
              className="room-notes"
              aria-hidden="true"
              style={{ left: `${(piano.x + piano.w * 0.45) * 100}%`, top: `${(piano.y + piano.h * 0.2) * 100}%` }}
            >
              <span>♪</span>
              <span>♫</span>
              <span>♩</span>
            </div>
          ) : null}
        </div>
      </div>
      {compact && scrollLeft > PAN_EDGE ? (
        <button type="button" className="room-pan room-pan-left" onClick={() => panTo('plants')} aria-label="Pan to the plants">
          <span aria-hidden="true">‹</span> Garden
        </button>
      ) : null}
      {compact && scrollLeft < maxScroll - PAN_EDGE ? (
        <button type="button" className="room-pan room-pan-right" onClick={() => panTo('notebook')} aria-label="Pan to the bookshelf notebook">
          Shelf <span aria-hidden="true">›</span>
        </button>
      ) : null}
      {overlays}
    </div>
  );
}
