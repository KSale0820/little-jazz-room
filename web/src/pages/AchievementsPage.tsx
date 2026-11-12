import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CatSprite, type VisibleCatId } from '../features/cats/CatCompanion';
import { readPreviouslySelectedCat, readSavedUnlocks, unlockedCompanions } from '../lib/companionUnlocks';
import { plantGrowth } from '../features/home-room/plantGrowth';
import {
  ACHIEVEMENTS, achievementProgress, deriveEarned, summarizeEvidence, unlockedRoomItems,
  type RoomItemId,
} from '../features/achievements/achievementModel';
import {
  isItemVisible, readEarned, readRoomPreferences, saveEarned, saveRoomPreferences,
  type RoomPreferences,
} from '../features/achievements/roomStore';
import './AchievementsPage.css';

type RoomItem = {
  id: RoomItemId;
  label: string;
  category: 'Cats' | 'Furniture' | 'Plants' | 'Music' | 'Lighting';
  x: number; y: number; w: number;
  sprite?: string; fallback?: string;
  cat?: VisibleCatId; pose?: 'floor' | 'sleeping';
};

const ITEMS: readonly RoomItem[] = [
  { id: 'luna', label: 'Luna', category: 'Cats', x: 21, y: 66, w: 13, cat: 'luna', pose: 'sleeping' },
  { id: 'armchair', label: 'Cozy armchair', category: 'Furniture', x: 32, y: 46, w: 17, sprite: '/achievements/armchair.png', fallback: '/achievements/armchair.svg' },
  { id: 'milo', label: 'Milo', category: 'Cats', x: 65, y: 34, w: 12, cat: 'milo', pose: 'floor' },
  { id: 'plant', label: 'First houseplant', category: 'Plants', x: 8, y: 55, w: 10, sprite: '/visuals/decor/plant.png' },
  { id: 'music-stand', label: 'Music stand', category: 'Music', x: 45, y: 49, w: 9, sprite: '/achievements/music-stand.svg' },
  { id: 'lamp', label: 'Warm little lamp', category: 'Lighting', x: 82, y: 27, w: 8, sprite: '/visuals/decor/brass-lamp.png' },
  { id: 'maple', label: 'Maple', category: 'Cats', x: 53, y: 71, w: 13, cat: 'maple', pose: 'sleeping' },
  { id: 'books', label: 'Music books', category: 'Music', x: 84, y: 37, w: 10, sprite: '/visuals/decor/books.png' },
  { id: 'records', label: 'Record player', category: 'Music', x: 79, y: 69, w: 12, sprite: '/achievements/record-player.svg' },
] as const;

const CATEGORIES = ['All', 'Cats', 'Furniture', 'Plants', 'Music', 'Lighting'] as const;
type CollectionCategory = typeof CATEGORIES[number];

function RoomSprite({ item, plantStage }: { item: RoomItem; plantStage: number }) {
  const imagePath = item.id === 'plant'
    ? '/achievements/plant-stage-' + plantStage + '.png'
    : item.sprite ?? '';
  const [src, setSrc] = useState(imagePath);
  useEffect(() => { setSrc(imagePath); }, [imagePath]);
  if (item.cat) {
    return <CatSprite catId={item.cat} variant={item.pose ?? 'floor'} size={128} decorative className="ajr-cat-sprite" />;
  }
  return <img className="ajr-item-image" draggable={false} src={src}
    onError={() => { if (item.fallback && src !== item.fallback) setSrc(item.fallback); }} alt="" aria-hidden="true" />;
}

export function AchievementsPage() {
  const navigate = useNavigate();
  const { repo, sessions, catId } = useApp();
  const scope = repo.scope;
  const catAccount = repo.scope;
  const evidence = useMemo(() => summarizeEvidence(sessions), [sessions]);
  const plantStage = evidence.minutes >= 600 ? 4 : plantGrowth(evidence.minutes).stage;
  const unlockedCats = unlockedCompanions(
    evidence.minutes,
    readSavedUnlocks(catAccount),
    readPreviouslySelectedCat(catAccount) ?? (catId === 'luna' || catId === 'milo' || catId === 'maple' ? catId : null),
  );
  const earned = deriveEarned(evidence, readEarned(scope), unlockedCats);
  const unlockedIds = unlockedRoomItems(earned);
  const earnedSignature = earned.join('|');

  const [preferences, setPreferences] = useState<RoomPreferences>(() => readRoomPreferences(scope));
  const [tab, setTab] = useState<'achievements' | 'collection'>('achievements');
  const [category, setCategory] = useState<CollectionCategory>('All');
  const [editing, setEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RoomItemId | null>(null);
  const [imageSrc, setImageSrc] = useState('/achievements/room-base.png');
  const [saveError, setSaveError] = useState(false);

  useEffect(() => { saveEarned(scope, earned); }, [scope, earnedSignature]);
  useEffect(() => {
    setPreferences(readRoomPreferences(scope));
    setSelectedItem(null);
    setSaveError(false);
  }, [scope]);
  const updatePreferences = (next: RoomPreferences) => {
    setPreferences(next);
    setSaveError(!saveRoomPreferences(scope, next));
  };
  const toggle = (id: RoomItemId) => {
    if (!unlockedIds.includes(id)) return;
    updatePreferences({ ...preferences, visibility: { ...preferences.visibility, [id]: !isItemVisible(id, preferences) } });
  };
  const selected = ITEMS.find(item => item.id === selectedItem);
  const selectedAchievement = ACHIEVEMENTS.find(a => a.reward === selectedItem);
  const visibleCount = ITEMS.filter(item => unlockedIds.includes(item.id) && isItemVisible(item.id, preferences)).length;

  return (
    <section className="ajr-page" aria-label="My Little Jazz Room">
      <header className="ajr-top">
        <button type="button" className="ajr-back" onClick={() => navigate('/progress')} aria-label="Back to Progress">‹</button>
        <strong>Achievements</strong>
        <span aria-hidden="true" />
      </header>
      <div className="ajr-intro">
        <h1><span aria-hidden="true">♫</span> My Little Jazz Room <span aria-hidden="true">♪</span></h1>
        <p>A little space that grows with your practice.</p>
      </div>

      <div className="ajr-room-frame">
        <div className="ajr-scene" role="group" aria-label="Your customizable jazz room">
          <img className="ajr-room-image" src={imageSrc} onError={() => {
            if (imageSrc !== '/visuals/room/h01-approved-room.jpeg') setImageSrc('/visuals/room/h01-approved-room.jpeg');
          }} alt="Cozy empty jazz room with a rainy window, upright piano, bookshelf and rug" />
          {ITEMS.map(item => {
            if (!unlockedIds.includes(item.id) || !isItemVisible(item.id, preferences)) return null;
            const style = { left: item.x + '%', top: item.y + '%', width: item.w + '%' } as CSSProperties;
            return <button key={item.id} type="button" className={'ajr-object ' + (editing ? 'is-editing' : '')}
              style={style} aria-label={'Inspect ' + item.label}
              onClick={() => setSelectedItem(item.id)}>
              <RoomSprite item={item} plantStage={plantStage} />
            </button>;
          })}
          <button type="button" className="ajr-decorate" onClick={() => {
            setEditing(value => !value);
            setTab('collection');
          }}>{editing ? '✓ Done' : '✎ Decorate'}</button>
        </div>
      </div>

      {selected ? (
        <div className="ajr-item-detail" role="region" aria-label={selected.label + ' details'}>
          <div>
            <strong>{selected.label}</strong>
            <p>{selectedAchievement ? 'Unlocked with “' + selectedAchievement.name + '”' : 'Your starter companion, always available.'}</p>
          </div>
          <button type="button" onClick={() => toggle(selected.id)}>
            {isItemVisible(selected.id, preferences) ? 'Hide' : 'Show'}
          </button>
          <button type="button" className="ajr-dismiss" aria-label="Close item details" onClick={() => setSelectedItem(null)}>×</button>
        </div>
      ) : null}

      {earned.length === 0 ? (
        <div className="ajr-empty">
          <span className="ajr-empty-icon" aria-hidden="true">♧</span>
          <strong>Your room is still in its beginning!</strong>
          <p>Complete practice milestones to unlock cats, plants, decorations, and more.</p>
        </div>
      ) : (
        <div className="ajr-summary" aria-live="polite">
          <span aria-hidden="true">✦</span>
          <span>{earned.length} achievements earned · {visibleCount} items displayed</span>
        </div>
      )}

      <div className="ajr-tabs" role="group" aria-label="Achievement page sections">
        <button type="button" aria-pressed={tab === 'achievements'} className={tab === 'achievements' ? 'selected' : ''} onClick={() => setTab('achievements')}>✧ Achievements</button>
        <button type="button" aria-pressed={tab === 'collection'} className={tab === 'collection' ? 'selected' : ''} onClick={() => setTab('collection')}>▣ My Collection</button>
      </div>

      {tab === 'achievements' ? (
        <section className="ajr-list" aria-labelledby="ajr-achievements-heading">
          <h2 id="ajr-achievements-heading">Practice Milestones</h2>
          {ACHIEVEMENTS.map(a => {
            const done = earned.includes(a.id);
            const progress = achievementProgress(a.id, evidence, unlockedCats);
            return <div className="ajr-achievement" key={a.id}>
              <div className={'ajr-achievement-icon ' + (done ? 'earned' : '')} aria-hidden="true">{done ? '★' : '✧'}</div>
              <div className="ajr-achievement-info"><strong>{a.name}</strong><p>{a.description}</p><small>Unlocks: {ITEMS.find(i => i.id === a.reward)?.label}</small></div>
              <span className="ajr-count">{done ? '✓ Earned' : progress + ' / ' + a.target + (a.kind === 'minutes' ? ' min' : '')}</span>
            </div>;
          })}
        </section>
      ) : (
        <section className="ajr-list" aria-labelledby="ajr-collection-heading">
          <h2 id="ajr-collection-heading">Your Collection</h2>
          <p className="ajr-hint">Turn unlocked items on or off. Everything stays yours.</p>
          <div className="ajr-filters" role="group" aria-label="Collection category">
            {CATEGORIES.map(c => <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}
          </div>
          {ITEMS.filter(i => category === 'All' || i.category === category).map(item => {
            const unlocked = unlockedIds.includes(item.id);
            const visible = unlocked && isItemVisible(item.id, preferences);
            return <div className={'ajr-collection-item ' + (!unlocked ? 'locked' : '')} key={item.id}>
              <span className="ajr-collection-icon" aria-hidden="true">{item.cat ? '🐈' : item.category === 'Plants' ? '✿' : item.category === 'Music' ? '♫' : '▤'}</span>
              <div><strong>{item.label}</strong><small>{unlocked ? item.category : 'Locked · ' + (ACHIEVEMENTS.find(a => a.reward === item.id)?.name ?? 'Starter')}</small></div>
              <button type="button" role="switch" aria-checked={visible} disabled={!unlocked}
                aria-label={'Show ' + item.label + ' in your room'} className={'ajr-toggle ' + (visible ? 'on' : '')}
                onClick={() => toggle(item.id)}><span /></button>
            </div>;
          })}
          <label className="ajr-quiet"><input type="checkbox" checked={preferences.mutedCelebrations}
            onChange={event => updatePreferences({ ...preferences, mutedCelebrations: event.target.checked })} />
            Keep reward notifications quiet
          </label>
          {saveError ? <p className="ajr-save-warning" role="status">Changes are visible here but could not be saved on this device.</p> : null}
        </section>
      )}
    </section>
  );
}
