import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type AppearanceMode = Theme | 'system';

const APPEARANCE_KEY = 'little-jazz-room:appearance:v1';
const DECORATIVE_CATS_KEY = 'little-jazz-room:decorative-cats:v1';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

interface AppearanceContextValue {
  /** Resolved palette used by the active page. */
  theme: Theme;
  /** `system` until a visitor explicitly selects Light or Dark. */
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
  /** Controls decorative screen cats only, never avatars, selection or rewards. */
  catMode: boolean;
  setCatMode: (enabled: boolean) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function readSavedMode(): AppearanceMode {
  try {
    const value = window.localStorage.getItem(APPEARANCE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function readSystemTheme(): Theme {
  try {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Cat Mode is on for new installations; an explicit saved off preference wins. */
function readDecorativeCats(): boolean {
  try {
    return window.localStorage.getItem(DECORATIVE_CATS_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [mode, setSavedMode] = useState<AppearanceMode>(readSavedMode);
  const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme);
  const [catMode, setSavedCatMode] = useState(readDecorativeCats);
  const theme: Theme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    const media = window.matchMedia(DARK_MEDIA_QUERY);
    const update = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light');
    setSystemTheme(media.matches ? 'dark' : 'light');
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // index.html applies identical values before CSS loads. Keep them in sync thereafter.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.catMode = catMode ? 'on' : 'off';
    root.style.colorScheme = theme;
  }, [theme, catMode]);

  const setMode = useCallback((next: AppearanceMode) => {
    setSavedMode(next);
    try {
      if (next === 'system') window.localStorage.removeItem(APPEARANCE_KEY);
      else window.localStorage.setItem(APPEARANCE_KEY, next);
    } catch {
      // Browser privacy settings can make persistence unavailable.
    }
  }, []);

  const setCatMode = useCallback((enabled: boolean) => {
    setSavedCatMode(enabled);
    try { window.localStorage.setItem(DECORATIVE_CATS_KEY, String(enabled)); }
    catch { /* optional */ }
  }, []);

  const value = useMemo(
    () => ({ theme, mode, setMode, catMode, setCatMode }),
    [theme, mode, setMode, catMode, setCatMode],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be called inside AppearanceProvider');
  return context;
}
