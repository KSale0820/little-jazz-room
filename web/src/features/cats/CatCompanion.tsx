import { useCallback, useEffect, useRef, useState } from 'react';
import { VERIFIED_PIXEL_CATS } from '../../assets/cleanPixelAssets';
import { useImageFallback } from '../../lib/useImageFallback';
import './cat-companion.css';

export const ALL_JAZZ_CATS = [
  { id: 'luna', instrument: 'Piano', name: 'Luna', coat: 'Calico', personality: 'Curious & cozy', age: 'Adult', build: 'Medium' },
  { id: 'milo', instrument: 'Tenor saxophone', name: 'Milo', coat: 'Black', personality: 'Quiet & thoughtful', age: 'Adult', build: 'Slim' },
  { id: 'maple', instrument: 'Upright bass', name: 'Maple', coat: 'Orange tabby', personality: 'Playful & energetic', age: 'Young adult', build: 'Lean' },
  { id: 'mochi', instrument: 'Drums', name: 'Mochi', coat: 'Cream', personality: 'Gentle & sleepy', age: 'Kitten', build: 'Tiny' },
  { id: 'pepper', instrument: 'Trumpet', name: 'Pepper', coat: 'Charcoal gray', personality: 'Wise & mellow', age: 'Senior', build: 'Fluffy' },
  { id: 'patches', instrument: 'Jazz guitar', name: 'Patches', coat: 'Gray-and-white', personality: 'Friendly & goofy', age: 'Adult', build: 'Chubby' },
  { id: 'chai', instrument: 'Vocals', name: 'Chai', coat: 'Siamese', personality: 'Elegant & vocal', age: 'Adult', build: 'Slender' },
  { id: 'biscuit', instrument: 'Turntables / listening', name: 'Biscuit', coat: 'Orange tabby', personality: 'Adventurous & cozy', age: 'Adult', build: 'Large' },
] as const;
/** Eight legacy identities are retained for compatibility with old selections and records.
 * Only the three owner-approved new pixel characters may appear in the live chooser.
 * Never delete or rewrite historic practice/reward data to implement a visual roster change. */
export type CatId = (typeof ALL_JAZZ_CATS)[number]['id'];
export const VISIBLE_CAT_IDS = ['luna', 'milo', 'maple'] as const;
export type VisibleCatId = typeof VISIBLE_CAT_IDS[number];
export const JAZZ_CATS = ALL_JAZZ_CATS.filter(
  (cat): cat is Extract<(typeof ALL_JAZZ_CATS)[number], { id: VisibleCatId }> =>
    VISIBLE_CAT_IDS.some(id => id === cat.id),
);
const KEY = 'little-jazz-room:selected-cat:v1';
const isCatId = (value: unknown): value is CatId =>
  typeof value === 'string' && ALL_JAZZ_CATS.some(c => c.id === value);
export const isVisibleCatId = (value: unknown): value is VisibleCatId =>
  typeof value === 'string' && VISIBLE_CAT_IDS.some(id => id === value);

/** Preserve old IDs non-destructively, but never render retired character artwork.
 * The scoped backup lets a future roster change recover the previous preference. */
export function resolveVisibleSelection(
  value: unknown,
  cacheKey: string,
  storage: Pick<Storage, 'getItem' | 'setItem'> = window.localStorage,
): VisibleCatId | null {
  if (!isCatId(value)) return null;
  if (isVisibleCatId(value)) return value;
  try {
    const archiveKey = cacheKey + ':retired-cat-id:v1';
    if (!storage.getItem(archiveKey)) storage.setItem(archiveKey, value);
  } catch { /* storage optional */ }
  return 'luna';
}

export interface CatPreferenceRepository {
  readCat(): Promise<string | null>;
  writeCat(catId: CatId): Promise<void>;
}

export function useCatSelection(repository?: CatPreferenceRepository, accountKey = 'local') {
  const [catId, setCatId] = useState<CatId>('luna');
  const [saveError, setSaveError] = useState<string | null>(null);
  const userSelectedAfterRead = useRef(false);
  const readEpoch = useRef(0);
  const cacheKey = accountKey === 'local' ? KEY : `${KEY}:${accountKey}`;

  useEffect(() => {
    let active = true;
    const epoch = ++readEpoch.current;
    userSelectedAfterRead.current = false;
    setSaveError(null);
    setCatId('luna');
    try {
      const cached = window.localStorage.getItem(cacheKey);
      const visible = resolveVisibleSelection(cached, cacheKey);
      if (visible) {
        setCatId(visible);
        if (cached !== visible) window.localStorage.setItem(cacheKey, visible);
      }
    } catch { /* optional */ }
    if (repository) repository.readCat().then(id => {
      if (!active || epoch !== readEpoch.current || userSelectedAfterRead.current) return;
      const visible = resolveVisibleSelection(id, cacheKey);
      if (!visible) return;
      let next: VisibleCatId = visible;
      // Do not overwrite a newer locally selected supported cat with an old
      // account-synced ID. Archive the cloud's old ID without mutating it.
      if (!isVisibleCatId(id)) {
        try {
          const cached = window.localStorage.getItem(cacheKey);
          if (isVisibleCatId(cached)) next = cached;
        } catch { /* optional */ }
      }
      setCatId(next);
      try { window.localStorage.setItem(cacheKey, next); } catch { /* optional */ }
    }).catch(() => { /* offline */ });
    return () => { active = false; };
  }, [repository, cacheKey]);

  const chooseCat = useCallback(async (next: CatId) => {
    if (!isVisibleCatId(next)) return;
    userSelectedAfterRead.current = true;
    const epoch = readEpoch.current;
    setCatId(next);
    setSaveError(null);
    try { window.localStorage.setItem(cacheKey, next); } catch { /* optional */ }
    if (repository) {
      try { await repository.writeCat(next); }
      catch { if (epoch === readEpoch.current) setSaveError('Saved on this device; cloud sync is unavailable.'); }
    }
  }, [repository, cacheKey]);

  return { catId, chooseCat, saveError };
}

export function CatSprite({ catId, size = 96, className = '', decorative = false, animated = false, variant = 'portrait' }:
  { catId: CatId; size?: number; className?: string; decorative?: boolean; animated?: boolean; variant?: 'portrait' | 'floor' | 'closeup' | 'sleeping' }) {
  const visibleId: VisibleCatId = isVisibleCatId(catId) ? catId : 'luna';
  const cat = JAZZ_CATS.find(c => c.id === visibleId)!;
  // All visible variants use the new pixel designs. Portrait/chooser/floor/
  // closeup intentionally reuse the existing approved 160px sitting treatment
  // until a separately verified face portrait exists; never revive October art.
  const candidates = variant === 'sleeping'
    ? [VERIFIED_PIXEL_CATS.sleeping[visibleId]!, VERIFIED_PIXEL_CATS.sitting[visibleId]!]
    : [VERIFIED_PIXEL_CATS.sitting[visibleId]!, VERIFIED_PIXEL_CATS.sleeping[visibleId]!];
  const { src, onError } = useImageFallback(candidates, `pixel:${variant}:${visibleId}`);

  return <img className={`jazz-cat-sprite ${animated ? 'jazz-cat-animated' : ''} ${className}`} src={src}
    onError={onError}
    alt={decorative ? '' : `${cat.name}, ${cat.personality.toLowerCase()} ${cat.coat.toLowerCase()} jazz cat`}
    aria-hidden={decorative} style={{ imageRendering: 'pixelated' }}
    width={size} height={size} draggable={false} />;
}

function CatChooserArt({ catId }: { catId: CatId }) {
  const visibleId: VisibleCatId = isVisibleCatId(catId) ? catId : 'luna';
  const { src, onError } = useImageFallback(
    [VERIFIED_PIXEL_CATS.sitting[visibleId]!, VERIFIED_PIXEL_CATS.sleeping[visibleId]!],
    `chooser-pixel:${visibleId}`,
  );
  return <img className="board-cat-art" src={src} onError={onError} alt="" aria-hidden draggable={false} />;
}

export function CatChooser({ catId, onSelect }:
  { catId: CatId; onSelect: (id: CatId) => void | Promise<void> }) {
  return (
    <section aria-labelledby="choose-cat-heading" className="jazz-cat-section board-style">
      <h2 id="choose-cat-heading">Choose your jazz cat</h2>
      <p className="jazz-cat-lede">Meet Luna, Milo and Maple. Change any time.</p>
      <div className="jazz-cat-grid board-cards" role="group" aria-label="Jazz cat companions">
        {JAZZ_CATS.map(cat => (
          <button
            type="button"
            key={cat.id}
            className="board-cat-card"
            aria-pressed={catId === cat.id}
            aria-label={`${cat.name}, ${cat.instrument}, ${cat.personality}`}
            onClick={() => { void onSelect(cat.id); }}
          >
            <CatChooserArt catId={cat.id} />
            <div className="board-cat-meta">
              <strong>{cat.name}</strong>
              <span className="board-cat-instrument">{cat.instrument}</span>
              <span className="board-cat-personality">{cat.personality}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
