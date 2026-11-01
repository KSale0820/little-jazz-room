import { useCallback, useEffect, useRef, useState } from 'react';
import { catCloseupUrls, catFloorUrls, catPortraitUrls, catSleepingUrls } from '../../assets/visualManifest';
import { useImageFallback } from '../../lib/useImageFallback';
import './cat-companion.css';

export const JAZZ_CATS = [
  { id: 'luna', instrument: 'Piano', name: 'Luna', coat: 'Calico', personality: 'Curious & cozy', age: 'Adult', build: 'Medium' },
  { id: 'milo', instrument: 'Tenor saxophone', name: 'Milo', coat: 'Black', personality: 'Quiet & thoughtful', age: 'Adult', build: 'Slim' },
  { id: 'maple', instrument: 'Upright bass', name: 'Maple', coat: 'Orange tabby', personality: 'Playful & energetic', age: 'Young adult', build: 'Lean' },
  { id: 'mochi', instrument: 'Drums', name: 'Mochi', coat: 'Cream', personality: 'Gentle & sleepy', age: 'Kitten', build: 'Tiny' },
  { id: 'pepper', instrument: 'Trumpet', name: 'Pepper', coat: 'Charcoal gray', personality: 'Wise & mellow', age: 'Senior', build: 'Fluffy' },
  { id: 'patches', instrument: 'Jazz guitar', name: 'Patches', coat: 'Gray-and-white', personality: 'Friendly & goofy', age: 'Adult', build: 'Chubby' },
  { id: 'chai', instrument: 'Vocals', name: 'Chai', coat: 'Siamese', personality: 'Elegant & vocal', age: 'Adult', build: 'Slender' },
  { id: 'biscuit', instrument: 'Turntables / listening', name: 'Biscuit', coat: 'Orange tabby', personality: 'Adventurous & cozy', age: 'Adult', build: 'Large' },
] as const;
export type CatId = (typeof JAZZ_CATS)[number]['id'];
const KEY = 'little-jazz-room:selected-cat:v1';
const isCatId = (value: unknown): value is CatId =>
  typeof value === 'string' && JAZZ_CATS.some(c => c.id === value);

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
    try { const cached = window.localStorage.getItem(cacheKey); if (isCatId(cached)) setCatId(cached); }
    catch { /* optional */ }
    if (repository) repository.readCat().then(id => {
      if (!active || epoch !== readEpoch.current || userSelectedAfterRead.current) return;
      if (isCatId(id)) { setCatId(id); try { localStorage.setItem(cacheKey, id); } catch { /* optional */ } }
    }).catch(() => { /* offline */ });
    return () => { active = false; };
  }, [repository, cacheKey]);

  const chooseCat = useCallback(async (next: CatId) => {
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
  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  // floor = approved full-body; sleeping = PR #8 pose; portrait = approved profile; closeup = approved face. No legacy cat images.
  const candidates = variant === 'sleeping' ? catSleepingUrls(catId)
    : variant === 'floor' ? catFloorUrls(catId)
    : variant === 'closeup' ? catCloseupUrls(catId)
    : catPortraitUrls(catId);
  const { src, onError } = useImageFallback(candidates, `${variant}:${catId}`);

  return <img className={`jazz-cat-sprite ${animated ? 'jazz-cat-animated' : ''} ${className}`} src={src}
    onError={onError}
    alt={decorative ? '' : `${cat.name}, ${cat.personality.toLowerCase()} ${cat.coat.toLowerCase()} jazz cat`}
    aria-hidden={decorative} width={size} height={size} draggable={false} />;
}

function CatChooserArt({ catId }: { catId: CatId }) {
  const { src, onError } = useImageFallback(catFloorUrls(catId), `chooser:${catId}`);
  return <img className="board-cat-art" src={src} onError={onError} alt="" aria-hidden draggable={false} />;
}

export function CatChooser({ catId, onSelect }:
  { catId: CatId; onSelect: (id: CatId) => void | Promise<void> }) {
  return (
    <section aria-labelledby="choose-cat-heading" className="jazz-cat-section board-style">
      <h2 id="choose-cat-heading">Choose your jazz cat</h2>
      <p className="jazz-cat-lede">All eight companions are free. Change any time.</p>
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
