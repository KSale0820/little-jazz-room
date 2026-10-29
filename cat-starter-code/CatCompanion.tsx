/** Little Jazz Room - drop into src/features/cats/CatCompanion.tsx.
 * Assets: copy jazz-cat-assets/*.svg to public/jazz-cat-assets/.
 * Model uses one sprite per cat across Home, Profile and chooser.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import './cat-companion.css';

export const JAZZ_CATS = [
  { id: 'luna', instrument: 'Piano', name: 'Luna', coat: 'Calico', personality: 'Curious & cozy', age: 'Adult', build: 'Medium', shape: 'medium' },
  { id: 'milo', instrument: 'Tenor saxophone', name: 'Milo', coat: 'Tuxedo', personality: 'Quiet & thoughtful', age: 'Adult', build: 'Slim', shape: 'slim' },
  { id: 'maple', instrument: 'Upright bass', name: 'Maple', coat: 'Ginger tabby', personality: 'Playful & energetic', age: 'Young adult', build: 'Lean', shape: 'young' },
  { id: 'mochi', instrument: 'Drums', name: 'Mochi', coat: 'Cream', personality: 'Gentle & sleepy', age: 'Kitten', build: 'Tiny', shape: 'kitten' },
  { id: 'pepper', instrument: 'Trumpet', name: 'Pepper', coat: 'Dark charcoal gray', personality: 'Wise & mellow', age: 'Senior', build: 'Fluffy', shape: 'senior' },
  { id: 'patches', instrument: 'Jazz guitar', name: 'Patches', coat: 'Gray and white', personality: 'Friendly & goofy', age: 'Adult', build: 'Chubby', shape: 'chubby' },
  { id: 'chai', instrument: 'Vocals', name: 'Chai', coat: 'Siamese', personality: 'Elegant & vocal', age: 'Adult', build: 'Slender', shape: 'long' },
  { id: 'biscuit', instrument: 'Turntables / listening', name: 'Biscuit', coat: 'Brown tabby', personality: 'Adventurous & cozy', age: 'Adult', build: 'Large', shape: 'large' }
] as const;
export type CatId = (typeof JAZZ_CATS)[number]['id'];
const KEY = 'little-jazz-room:selected-cat:v1';
const isCatId = (value: unknown): value is CatId =>
  typeof value === 'string' && JAZZ_CATS.some(c => c.id === value);

/** Implement with Supabase's authenticated profiles table in Phase 2. */
export interface CatPreferenceRepository {
  readCat(): Promise<string | null>;
  writeCat(catId: CatId): Promise<void>;
}

/** accountKey MUST be the authenticated Supabase user ID; 'local' for anonymous preview. */
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
    catch { /* optional device cache */ }
    if (repository) repository.readCat().then(id => {
      if (!active || epoch !== readEpoch.current || userSelectedAfterRead.current) return;
      if (isCatId(id)) { setCatId(id); try { localStorage.setItem(cacheKey, id); } catch { /* optional */ } }
    }).catch(() => { /* offline: keep this account's local choice */ });
    return () => { active = false; };
  }, [repository, cacheKey]);

  const chooseCat = useCallback(async (next: CatId) => {
    userSelectedAfterRead.current = true;
    const epoch = readEpoch.current;
    setCatId(next);
    setSaveError(null);
    try { window.localStorage.setItem(cacheKey, next); } catch { /* optional cache */ }
    if (repository) {
      try { await repository.writeCat(next); }
      catch { if (epoch === readEpoch.current) setSaveError('Saved on this device; cloud sync is unavailable.'); }
    }
  }, [repository, cacheKey]);

  return { catId, chooseCat, saveError };
}

export function CatSprite({ catId, size = 96, className = '', decorative = false, animated = false }:
  { catId: CatId; size?: number; className?: string; decorative?: boolean; animated?: boolean }) {
  const cat = JAZZ_CATS.find(c => c.id === catId)!;
  return <img className={`jazz-cat-sprite ${animated ? 'jazz-cat-animated' : ''} ${className}`} src={`/jazz-cat-assets/${catId}.svg`}
    alt={decorative ? '' : `${cat.name}, ${cat.age.toLowerCase()}, ${cat.build.toLowerCase()} ${cat.coat.toLowerCase()} jazz cat`}
    aria-hidden={decorative} width={size} height={size} draggable={false} />;
}

export function CatChooser({ catId, onSelect }:
  { catId: CatId; onSelect: (id: CatId) => void | Promise<void> }) {
  return <section aria-labelledby="choose-cat-heading" className="jazz-cat-section">
    <h2 id="choose-cat-heading">Choose your jazz cat</h2>
    <p>All eight companions are free. Change your cat any time.</p>
    <div className="jazz-cat-grid" role="group" aria-label="Jazz cat companions">
      {JAZZ_CATS.map(cat => <button type="button" key={cat.id} aria-pressed={catId === cat.id}
        onClick={() => { void onSelect(cat.id); }}>
        <CatSprite catId={cat.id} size={66} decorative />
        <strong>{cat.name}</strong><small>{cat.instrument}</small><small>{cat.age} · {cat.build}</small>
      </button>)}
    </div>
    <p className="jazz-cat-description">{JAZZ_CATS.find(c => c.id === catId)!.personality}</p>
  </section>;
}

/* Integration example (not a mounted component):
 * const {catId, chooseCat} = useCatSelection(catRepository, supabaseUserId);
 * <CatSprite catId={catId} size={120} animated /> // Home: overlay on cat-free room illustration
 * <CatSprite catId={catId} size={72} /> // Profile: avatar/progress
 * <CatChooser catId={catId} onSelect={chooseCat} /> // Profile chooser
 * Optional small scene below Practice controls is allowed; never cover the music chart or exercise rows.
 */
