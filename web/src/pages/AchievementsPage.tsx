import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CatSprite, type VisibleCatId } from '../features/cats/CatCompanion';
import { readPreviouslySelectedCat, readSavedUnlocks, unlockedCompanions } from '../lib/companionUnlocks';
import {
  ACHIEVEMENTS, achievementProgress, deriveEarned, summarizeEvidence, unlockedRoomItems,
  type AchievementId, type RoomItemId, type PracticeEvidence,
} from '../features/achievements/achievementModel';
import {
  isItemVisible, readEarned, readRoomPreferences, saveEarned, saveRoomPreferences,
  type RoomPreferences,
} from '../features/achievements/roomStore';
import './AchievementsPage.css';

type Placement = { x: number; y: number; w: number; h?: number; z?: number };
type Category = 'Cats' | 'Furniture' | 'Plants' | 'Music' | 'Lighting';
type RoomItem = {
  id: RoomItemId;
  label: string;
  category: Category;
  slots: readonly Placement[];
  sprite?: string;
  cat?: VisibleCatId;
  pose?: 'floor' | 'sleeping';
};

/** Positions 01–08 are copied from new-decor/placements.json (1706×922).
 * Use the supplied art at its approved location, never old unlockable PNGs.
 * Cat positions remain independent of selected practice companion.
 */
const placed = (x: number, y: number, w: number, h: number, z = 3): Placement =>
  ({ x: x / 1706 * 100, y: y / 922 * 100, w: w / 1706 * 100, h: h / 922 * 100, z });

const ITEMS: readonly RoomItem[] = [
  { id: 'luna', label: 'Luna', category: 'Cats',
    slots: [{ x: 20, y: 70, w: 11, z: 4 }, { x: 33, y: 70, w: 11, z: 4 }], cat: 'luna', pose: 'sleeping' },
  { id: 'piano-plant', label: 'Piano trailing plant', category: 'Plants',
    slots: [placed(851, 306, 160, 210)], sprite: '/achievements/new-decor/05-piano-trailing-plant.png' },
  { id: 'milo', label: 'Milo', category: 'Cats',
    slots: [{ x: 37, y: 70, w: 11, z: 5 }, { x: 27, y: 75, w: 11, z: 5 }], cat: 'milo', pose: 'floor' },
  { id: 'bookshelf-plants', label: 'Bookshelf plants', category: 'Plants',
    slots: [placed(1372, 270, 249, 151)], sprite: '/achievements/new-decor/01-bookshelf-plants.png' },
  { id: 'piano-sheet-music', label: 'Piano sheet music', category: 'Music',
    slots: [placed(971, 430, 219, 98, 4)], sprite: '/achievements/new-decor/08-piano-sheet-music.png' },
  { id: 'piano-lamp', label: 'Piano lamp', category: 'Lighting',
    slots: [placed(1016, 295, 101, 117, 5)], sprite: '/achievements/new-decor/07-piano-lamp.png' },
  { id: 'maple', label: 'Maple', category: 'Cats',
    slots: [{ x: 69, y: 75, w: 11, z: 5 }, { x: 47, y: 76, w: 11, z: 5 }], cat: 'maple', pose: 'sleeping' },
  { id: 'bookshelf-books', label: 'Music books', category: 'Music',
    slots: [placed(1398, 465, 225, 100)], sprite: '/achievements/new-decor/03-bookshelf-music-books.png' },
  { id: 'bookshelf-trumpet', label: 'Trumpet', category: 'Music',
    slots: [placed(1440, 391, 163, 61)], sprite: '/achievements/new-decor/02-bookshelf-trumpet.png' },
  { id: 'bookshelf-cat', label: 'Sleeping bookshelf cat', category: 'Cats',
    slots: [placed(1405, 604, 220, 110)], sprite: '/achievements/new-decor/04-bookshelf-sleeping-cat.png' },
  { id: 'piano-busts', label: 'Jazz musician busts', category: 'Music',
    slots: [placed(1142, 298, 166, 118)], sprite: '/achievements/new-decor/06-piano-jazz-busts.png' },
];
const CATEGORIES = ['All', 'Cats', 'Plants', 'Music', 'Furniture', 'Lighting'] as const;
type CollectionCategory = typeof CATEGORIES[number];
type Achievement = typeof ACHIEVEMENTS[number];

function BackIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg>;
}

function PencilIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 15-1 5 5-1L20 8a2.3 2.3 0 0 0-4-4L5 15Z" />
    <path d="m14 6 4 4" />
  </svg>;
}

function MedalIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="9" r="5.2"/><path d="m8 14-2 7 5-2 3 2 2-7"/>
    <path d="m12 6.1.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3Z"/>
  </svg>;
}

function SofaIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 11V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5V11"/>
    <path d="M5 12c-3-2-4 0-4 2v5h22v-5c0-2-1-4-4-2v4H5v-4Z"/>
    <path d="M4 19v2m16-2v2"/>
  </svg>;
}

function EmptyCatIcon() {
  return <svg viewBox="0 0 64 60" fill="none" stroke="currentColor" strokeWidth="2.1"
    strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d="M14 19 16 5l12 9q5-1 8 0L48 5l2 14c6 6 8 13 8 22 0 9-8 13-26 13S6 50 6 41c0-9 2-16 8-22Z"/>
    <path d="M1 20 0 16m0 16-5 1M63 20l4-4m-4 16 5 1" />
  </svg>;
}

function RoomSprite({ item }: { item: RoomItem }) {
  if (item.cat) {
    return <CatSprite catId={item.cat} variant={item.pose ?? 'floor'}
      size={128} decorative className="ajr-cat-sprite" />;
  }
  return <img className="ajr-item-image" draggable={false}
    src={item.sprite} alt="" aria-hidden="true" />;
}

function ItemThumbnail({ item }: { item: RoomItem }) {
  return item.cat
    ? <CatSprite catId={item.cat} variant="closeup" size={48}
        decorative className="ajr-cat-sprite" />
    : <RoomSprite item={item} />;
}

function AchievementCard({ achievement, evidence, cats, done }: {
  achievement: Achievement;
  evidence: PracticeEvidence;
  cats: readonly VisibleCatId[];
  done: boolean;
}) {
  const item = ITEMS.find(i => i.id === achievement.reward);
  const progress = achievementProgress(achievement.id as AchievementId, evidence, cats);
  return <article className={'ajr-achievement ' + (done ? 'is-earned' : '')} key={achievement.id}>
    <div className="ajr-achievement-icon" aria-hidden="true">
      {item ? <ItemThumbnail item={item} /> : <MedalIcon />}
    </div>
    <div className="ajr-achievement-info">
      <strong>{achievement.name}</strong>
      <p>{achievement.description}</p>
    </div>
    <span className={'ajr-count ' + (done ? 'is-earned' : '')} aria-label={done ? 'Earned' : progress + ' of ' + achievement.target}>
      {done ? '✓ Earned' : progress + ' / ' + achievement.target + (achievement.kind === 'minutes' ? ' min' : '')}
    </span>
  </article>;
}

export function AchievementsPage() {
  const navigate = useNavigate();
  const { repo, sessions, catId } = useApp();
  const scope = repo.scope;
  const evidence = useMemo(() => summarizeEvidence(sessions), [sessions]);
  const unlockedCats = unlockedCompanions(
    evidence.minutes, readSavedUnlocks(scope),
    readPreviouslySelectedCat(scope) ?? (catId === 'luna' || catId === 'milo' || catId === 'maple' ? catId : null),
  );
  const earned = deriveEarned(evidence, readEarned(scope), unlockedCats);
  const unlockedIds = unlockedRoomItems(earned);
  const earnedSignature = earned.join('|');

  const [preferences, setPreferences] = useState<RoomPreferences>(() => readRoomPreferences(scope));
  const [tab, setTab] = useState<'achievements' | 'collection'>('achievements');
  const [category, setCategory] = useState<CollectionCategory>('All');
  const [editing, setEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RoomItemId | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => { saveEarned(scope, earned); }, [scope, earnedSignature]);
  useEffect(() => {
    setPreferences(readRoomPreferences(scope));
    setSelectedItem(null);
    setEditing(false);
    setSaveError(false);
  }, [scope]);

  const updatePreferences = (next: RoomPreferences) => {
    setPreferences(next);
    setSaveError(!saveRoomPreferences(scope, next));
  };
  const toggle = (id: RoomItemId) => {
    if (!unlockedIds.includes(id)) return;
    updatePreferences({
      ...preferences,
      visibility: { ...preferences.visibility, [id]: !isItemVisible(id, preferences) },
    });
  };
  const place = (id: RoomItemId, index: number) => {
    if (!unlockedIds.includes(id)) return;
    updatePreferences({
      ...preferences,
      placements: { ...preferences.placements, [id]: index },
    });
  };
  const resetArrangement = () => {
    updatePreferences({ ...preferences, visibility: { luna: false }, placements: {} });
    setSelectedItem(null);
  };
  const selected = ITEMS.find(item => item.id === selectedItem);
  const selectedAchievement = ACHIEVEMENTS.find(a => a.reward === selectedItem
    || (selectedItem === 'bookshelf-cat' && a.id === 'first-hour')
    || (selectedItem === 'piano-busts' && a.id === 'five-hours'));
  const visibleCount = ITEMS.filter(item =>
    unlockedIds.includes(item.id) && isItemVisible(item.id, preferences)).length;
  const upcoming = ACHIEVEMENTS.filter(a => !earned.includes(a.id));
  const completed = ACHIEVEMENTS.filter(a => earned.includes(a.id));

  return <section className="ajr-page" aria-label="My Little Jazz Room">
    <header className="ajr-top">
      <button type="button" className="ajr-back" onClick={() => navigate('/progress')} aria-label="Back to Progress">
        <BackIcon />
      </button>
      <strong>Achievements</strong>
      <span aria-hidden="true" />
    </header>

    <div className="ajr-intro">
      <h1><span className="ajr-title-note" aria-hidden="true">♫</span> My Little Jazz Room <span className="ajr-title-note" aria-hidden="true">♪</span></h1>
      <p>A little space that grows with your practice.</p>
    </div>

    <div className="ajr-room-frame">
      <div className="ajr-scene" role="group" aria-label="Your customizable jazz room">
        <img className="ajr-room-image" src="/achievements/empty-room-new.webp"
          alt="Cozy rainy jazz studio with an upright piano, window, rug and empty bookshelf" />
        {ITEMS.map(item => {
          if (!unlockedIds.includes(item.id) || !isItemVisible(item.id, preferences)) return null;
          const index = preferences.placements?.[item.id] === 1 ? 1 : 0;
          const slot = item.slots[index] ?? item.slots[0];
          const style: CSSProperties = {
            left: slot.x + '%', top: slot.y + '%', width: slot.w + '%',
            ...(slot.h ? { height: slot.h + '%' } : {}), zIndex: slot.z ?? 2,
          };
          return <button key={item.id} type="button"
            className={'ajr-object ' + (slot.h ? 'has-fixed-box ' : '') + (editing ? 'is-editing' : '')}
            style={style} aria-label={'Inspect ' + item.label}
            onClick={() => setSelectedItem(item.id)}>
            <RoomSprite item={item} />
          </button>;
        })}
        <button type="button" className="ajr-decorate"
          aria-pressed={editing}
          onClick={() => { setEditing(value => !value); setTab('collection'); setSelectedItem(null); }}>
          {editing ? <span aria-hidden="true">✓</span> : <PencilIcon />}
          {editing ? 'Done' : 'Decorate'}
        </button>
      </div>
    </div>

    {selected && <div className="ajr-item-detail" role="region" aria-label={selected.label + ' details'}>
      <div>
        <strong>{selected.label}</strong>
        <p>{selectedAchievement ? 'Unlocked with “' + selectedAchievement.name + '”' : 'Your starter companion, always available.'}</p>
      </div>
      <button type="button" className="ajr-item-action" onClick={() => toggle(selected.id)}>
        {isItemVisible(selected.id, preferences) ? 'Hide' : 'Show'}
      </button>
      <button type="button" className="ajr-dismiss" aria-label="Close item details" onClick={() => setSelectedItem(null)}>×</button>
    </div>}

    {earned.length === 0 ? <div className="ajr-empty">
      <span className="ajr-empty-icon"><EmptyCatIcon /></span>
      <strong>Your room is still in its beginning!</strong>
      <p>Complete practice milestones to unlock cats, plants, decorations, and more.</p>
    </div> : <div className="ajr-summary" aria-live="polite">
      <MedalIcon />
      <span><strong>{earned.length}</strong> achievements earned <span aria-hidden="true">·</span> {visibleCount} items displayed</span>
    </div>}

    <div className="ajr-tabs" role="group" aria-label="Achievements and room collection">
      <button type="button" aria-pressed={tab === 'achievements'}
        className={tab === 'achievements' ? 'selected' : ''}
        onClick={() => setTab('achievements')}><MedalIcon /> Achievements</button>
      <button type="button" aria-pressed={tab === 'collection'}
        className={tab === 'collection' ? 'selected' : ''}
        onClick={() => setTab('collection')}><SofaIcon /> My Collection</button>
    </div>

    {tab === 'achievements' ? <div className="ajr-list">
      {upcoming.length > 0 && <section aria-labelledby="ajr-upcoming-heading">
        <h2 id="ajr-upcoming-heading">Upcoming Achievements</h2>
        {upcoming.map(a => <AchievementCard key={a.id} achievement={a} evidence={evidence}
          cats={unlockedCats} done={false} />)}
      </section>}
      {completed.length > 0 && <section aria-labelledby="ajr-earned-heading">
        <h2 id="ajr-earned-heading">Earned Achievements</h2>
        {completed.map(a => <AchievementCard key={a.id} achievement={a} evidence={evidence}
          cats={unlockedCats} done />)}
      </section>}
    </div> : <section className="ajr-list" aria-labelledby="ajr-collection-heading">
      <div className="ajr-collection-heading">
        <div><h2 id="ajr-collection-heading">My Collection</h2>
          <p className="ajr-hint">Your unlocked treasures stay yours, even when hidden.</p>
        </div>
        {editing && <button type="button" className="ajr-reset" onClick={resetArrangement}>
          Reset arrangement
        </button>}
      </div>
      <div className="ajr-filters" role="group" aria-label="Collection category">
        {CATEGORIES.map(c => <button key={c} type="button" aria-pressed={category === c}
          onClick={() => setCategory(c)}>{c}</button>)}
      </div>
      {ITEMS.filter(i => category === 'All' || i.category === category).map(item => {
        const unlocked = unlockedIds.includes(item.id);
        const visible = unlocked && isItemVisible(item.id, preferences);
        const chosen = preferences.placements?.[item.id] === 1 ? 1 : 0;
        return <div className={'ajr-collection-item ' + (!unlocked ? 'locked' : '')} key={item.id}>
          <span className="ajr-collection-icon" aria-hidden="true">
            <ItemThumbnail item={item} />
          </span>
          <div className="ajr-collection-content">
            <strong>{item.label}</strong>
            <small>{unlocked ? item.category : 'Locked · ' +
              (ACHIEVEMENTS.find(a => a.reward === item.id)?.name ?? 'Starter')}</small>
            {editing && unlocked && visible && item.slots.length > 1 && <div className="ajr-placement" role="group" aria-label={item.label + ' position'}>
              {item.slots.map((_, index) => <button key={index} type="button"
                aria-pressed={chosen === index}
                onClick={() => place(item.id, index)}>
                Spot {index + 1}
              </button>)}
            </div>}
          </div>
          <button type="button" role="switch" aria-checked={visible}
            disabled={!unlocked} aria-label={'Show ' + item.label + ' in your room'}
            className={'ajr-toggle ' + (visible ? 'on' : '')} onClick={() => toggle(item.id)}>
            <span />
          </button>
        </div>;
      })}
      <label className="ajr-quiet">
        <input type="checkbox" checked={preferences.mutedCelebrations}
          onChange={event => updatePreferences({ ...preferences, mutedCelebrations: event.target.checked })} />
        Keep reward notifications quiet
      </label>
      {saveError && <p className="ajr-save-warning" role="status">
        Changes are visible here but could not be saved on this device.
      </p>}
    </section>}
  </section>;
}
