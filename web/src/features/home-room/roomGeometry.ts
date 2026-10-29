/**
 * Image-space geometry for the Home room.
 *
 * Interactive zones are stored as normalized rectangles of the ORIGINAL
 * artwork (home-hero-*.png, 1440 × 800). The artwork wrapper is positioned
 * with `computeImageLayout`, and zones are rendered as percentages inside that
 * very same wrapper, so art and hotspots can never drift apart.
 */

export const ROOM_ART_WIDTH = 1440;
export const ROOM_ART_HEIGHT = 800;

export type RoomZoneId = 'piano' | 'stand' | 'notebook' | 'plants';

export type RoomZone = {
  id: RoomZoneId;
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Measured against the 1440 × 800 hero art (see docs in PR). */
export const ROOM_ZONES: readonly RoomZone[] = [
  { id: 'plants', x: 0.085, y: 0.24, w: 0.13, h: 0.47 },
  { id: 'piano', x: 0.205, y: 0.27, w: 0.345, h: 0.66 },
  { id: 'stand', x: 0.292, y: 0.405, w: 0.118, h: 0.165 },
  { id: 'notebook', x: 0.595, y: 0.42, w: 0.115, h: 0.45 },
];

export interface ImageLayout {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

/** Equivalent of `object-fit: cover` + `object-position`, as explicit numbers. */
export function computeImageLayout(
  iw: number,
  ih: number,
  cw: number,
  ch: number,
  positionX: number,
  positionY: number,
): ImageLayout {
  const scale = Math.max(cw / iw, ch / ih);
  const width = iw * scale;
  const height = ih * scale;
  return {
    scale,
    width,
    height,
    left: (cw - width) * positionX,
    top: (ch - height) * positionY,
  };
}

export type RoomMode = 'compact' | 'wide';

export interface RoomFrame {
  mode: RoomMode;
  layout: ImageLayout;
  /** Clip rectangle that zones must fall inside: the viewport (wide) or the whole pannable art (compact). */
  contentWidth: number;
  contentHeight: number;
  /** Compact only: scrollLeft that centres the piano and companion on first view. */
  initialScrollLeft: number;
}

const WIDE_BREAKPOINT = 900;
const WIDE_POSITION_X = 0.2;
/** Where the companion sits on the rug (feet at x, y; width as a fraction of the art). Compact keeps it in front of the piano so one screen holds both. */
export const CAT_ANCHOR = {
  wide: { x: 0.53, y: 0.955, w: 0.2 },
  compact: { x: 0.43, y: 0.955, w: 0.17 },
} as const;

/** Horizontal focal point (piano + companion) of the artwork, as a fraction of its width. */
export const ROOM_FOCAL_X = 0.4;

/**
 * Wide: object-fit: cover of the art in the container.
 * Compact: the art is scaled uniformly to the container height (never stretched or extended)
 * and the room pans horizontally inside its own scroller.
 */
export function computeRoomFrame(cw: number, ch: number): RoomFrame {
  if (cw >= WIDE_BREAKPOINT) {
    const layout = computeImageLayout(ROOM_ART_WIDTH, ROOM_ART_HEIGHT, cw, ch, WIDE_POSITION_X, 0.5);
    return { mode: 'wide', layout, contentWidth: cw, contentHeight: ch, initialScrollLeft: 0 };
  }
  const scale = Math.max(ch / ROOM_ART_HEIGHT, cw / ROOM_ART_WIDTH);
  const width = ROOM_ART_WIDTH * scale;
  const height = ROOM_ART_HEIGHT * scale;
  const layout: ImageLayout = { scale, width, height, left: 0, top: 0 };
  const initialScrollLeft = Math.max(0, Math.min(width - cw, ROOM_FOCAL_X * width - cw / 2));
  return { mode: 'compact', layout, contentWidth: width, contentHeight: height, initialScrollLeft };
}

/** Scroll position that centres a zone horizontally (compact layout). */
export function scrollLeftForZone(zone: RoomZone, layout: ImageLayout, cw: number): number {
  const center = (zone.x + zone.w / 2) * layout.width;
  return Math.max(0, Math.min(layout.width - cw, center - cw / 2));
}

/** Fraction of the zone's area that lies inside the container. */
export function zoneVisibleFraction(zone: RoomZone, layout: ImageLayout, cw: number, ch: number): number {
  const x0 = layout.left + zone.x * layout.width;
  const y0 = layout.top + zone.y * layout.height;
  const x1 = x0 + zone.w * layout.width;
  const y1 = y0 + zone.h * layout.height;
  const vx = Math.max(0, Math.min(x1, cw) - Math.max(x0, 0));
  const vy = Math.max(0, Math.min(y1, ch) - Math.max(y0, 0));
  const area = (x1 - x0) * (y1 - y0);
  return area > 0 ? (vx * vy) / area : 0;
}

/** Zones whose furniture is not actually on screen must not get a hotspot. */
export function visibleZones(layout: ImageLayout, cw: number, ch: number, minFraction = 0.75): RoomZone[] {
  return ROOM_ZONES.filter(z => zoneVisibleFraction(z, layout, cw, ch) >= minFraction);
}
