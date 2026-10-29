export type RoomLightingMode = 'auto' | 'sunshine' | 'twilight' | 'night';
export type ResolvedLighting = 'sunshine' | 'twilight' | 'night';

const STORAGE_KEY = 'little-jazz-room:room-lighting:v1';

export function resolveLighting(mode: RoomLightingMode, now = new Date()): ResolvedLighting {
  if (mode !== 'auto') return mode;
  const h = now.getHours();
  if (h < 6 || h >= 20) return 'night';
  if (h >= 17) return 'twilight';
  return 'sunshine';
}

export function readLightingPreference(): RoomLightingMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'auto' || v === 'sunshine' || v === 'twilight' || v === 'night') return v;
  } catch {
    /* optional */
  }
  return 'auto';
}

export function writeLightingPreference(mode: RoomLightingMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* optional */
  }
}
