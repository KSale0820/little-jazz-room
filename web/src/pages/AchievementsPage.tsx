import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { VisibleCatId } from '../features/cats/CatCompanion';
import { readPreviouslySelectedCat, readSavedUnlocks, unlockedCompanions } from '../lib/companionUnlocks';
import {
  ACHIEVEMENTS, BONUS_ROOM_REWARDS, EXTRA_ROOM_REWARDS,
  achievementProgress, deriveEarned, summarizeEvidence, unlockedRoomItems,
  type AchievementId, type RoomItemId, type PracticeEvidence,
} from '../features/achievements/achievementModel';
import {
  isItemVisible, readEarned, readRoomPreferences, saveEarned, saveRoomPreferences,
  type RoomCatName, type RoomCatPose, type RoomPreferences,
} from '../features/achievements/roomStore';
import { ROOM_ART, ROOM_ATLAS, ROOM_CANVAS, ROOM_CAT_ITEMS,
  catNameForRoomItem, catPoseItem, shouldRenderRoomItem, type RoomArtItem,
} from '../features/achievements/roomArt';
import './AchievementsPage.css';

type Placement = { x: number; y: number; w: number; h?: number; z?: number };
type RoomItem = RoomArtItem & { slots: readonly Placement[] };
const ITEMS: readonly RoomItem[] = ROOM_ART.map((item, index) => ({
  ...item,
  slots: [{
    x: item.x / ROOM_CANVAS.width * 100,
    y: item.y / ROOM_CANVAS.height * 100,
    w: item.width / ROOM_CANVAS.width * 100,
    h: item.height / ROOM_CANVAS.height * 100,
    z: index + 2,
  }],
}));
/* The collection lists each cat once, while the room renders the selected pose only. */
const COLLECTION_ITEMS = ITEMS.filter(item =>
  item.id !== 'wall-shelves' && item.id !== 'luna-sitting' &&
  item.id !== 'milo-sleeping' && item.id !== 'maple-sleeping');
const CAT_DISPLAY_NAMES: Record<RoomCatName, string> = { luna: 'Luna', milo: 'Milo', maple: 'Maple' };

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

/** CSS atlas uses relative background dimensions, so every sprite tracks room resizing exactly. */
function RoomSprite({ item }: { item: RoomItem }) {
  if (item.catImage || item.spriteImage) return <img className="ajr-item-image ajr-layer-image" draggable={false}
    src={item.catImage ?? item.spriteImage} loading="lazy" alt="" aria-hidden="true" />;
  const crop = item.atlas;
  if (!crop) return null;
  const x = ROOM_ATLAS.width === crop.width ? 0 : crop.x / (ROOM_ATLAS.width - crop.width) * 100;
  const y = ROOM_ATLAS.height === crop.height ? 0 : crop.y / (ROOM_ATLAS.height - crop.height) * 100;
  return <span aria-hidden="true" className="ajr-item-image ajr-atlas-sprite" style={{
    backgroundImage: `url(${ROOM_ATLAS.url})`,
    backgroundSize: `${ROOM_ATLAS.width / crop.width * 100}% ${ROOM_ATLAS.height / crop.height * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
  }} />;
}

function ItemThumbnail({ item }: { item: RoomItem }) {
  return <RoomSprite item={item} />;
}

function sourceAchievement(id: RoomItemId) {
  const extra = EXTRA_ROOM_REWARDS.find(entry => entry.reward === id);
  const bonus = BONUS_ROOM_REWARDS.find(entry => entry.reward === id);
  return ACHIEVEMENTS.find(a => a.reward === id || a.id === extra?.after || a.id === bonus?.after);
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
  const [previewAll, setPreviewAll] = useState(false);
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
    const cat = catNameForRoomItem(id);
    const primary = cat ? ROOM_CAT_ITEMS[cat].main : id;
    if (!unlockedIds.includes(primary)) return;
    updatePreferences({
      ...preferences,
      visibility: { ...preferences.visibility, [primary]: !isItemVisible(primary, preferences) },
    });
  };
  const setCatPose = (cat: RoomCatName, pose: RoomCatPose) => {
    if (!unlockedIds.includes(ROOM_CAT_ITEMS[cat].main)) return;
    updatePreferences({
      ...preferences,
      catPoses: { ...preferences.catPoses, [cat]: pose },
    });
    setSelectedItem(catPoseItem(cat, pose));
  };
  const place = (id: RoomItemId, index: number) => {
    if (!unlockedIds.includes(id)) return;
    updatePreferences({
      ...preferences,
      placements: { ...preferences.placements, [id]: index },
    });
  };
  const resetArrangement = () => {
    updatePreferences({ ...preferences, visibility: {}, placements: {}, catPoses: {} });
    setSelectedItem(null);
  };
  const selected = ITEMS.find(item => item.id === selectedItem);
  const selectedCat = selectedItem ? catNameForRoomItem(selectedItem) : null;
  const selectedPrimary = selectedCat ? ROOM_CAT_ITEMS[selectedCat].main : selectedItem;
  const selectedUnlocked = selectedPrimary != null && unlockedIds.includes(selectedPrimary);
  const selectedAchievement = selectedPrimary ? sourceAchievement(selectedPrimary) : undefined;
  const visibleCount = ITEMS.filter(item =>
    shouldRenderRoomItem(item.id, unlockedIds, preferences)).length;
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
          if (!shouldRenderRoomItem(item.id, unlockedIds, preferences, previewAll)) return null;
          const index = preferences.placements?.[item.id] === 1 ? 1 : 0;
          const slot = item.slots[index] ?? item.slots[0];
          const style: CSSProperties = {
            left: slot.x + '%', top: slot.y + '%', width: slot.w + '%',
            ...(slot.h ? { height: slot.h + '%' } : {}), zIndex: slot.z ?? 2,
            transform: `rotate(${item.rotation}deg)`,
          };
          return <div key={item.id} className="ajr-room-layer" style={style}>
            {item.id === 'wall-shelves'
              ? <span className="ajr-structural-art" aria-hidden="true"><RoomSprite item={item} /></span>
              : <button type="button"
                className={'ajr-object has-fixed-box ' +
                  (item.id === 'piano-lamp' ? 'is-lamp ' : '') + (editing ? 'is-editing' : '')}
                aria-label={'Inspect ' + item.label}
                onClick={() => setSelectedItem(item.id)}>
                <RoomSprite item={item} />
              </button>}
          </div>;
        })}
        <button type="button" className="ajr-decorate"
          aria-pressed={editing}
          onClick={() => { setEditing(value => !value); setTab('collection'); setSelectedItem(null); }}>
          {editing ? <span aria-hidden="true">✓</span> : <PencilIcon />}
          {editing ? 'Done' : 'Decorate'}
        </button>
      </div>
    </div>

    <div className="ajr-preview-controls">
      <button type="button" className="ajr-preview-toggle" aria-pressed={previewAll}
        onClick={() => { setPreviewAll(value => !value); setSelectedItem(null); }}>
        {previewAll ? 'View earned room' : 'Preview fully furnished room'}
      </button>
      {previewAll && <small>Preview only. Decorations are not unlocked until you earn them.</small>}
    </div>

    {selected && <div className="ajr-item-detail" role="region" aria-label={selected.label + ' details'}>
      <div>
        <strong>{selectedCat ? CAT_DISPLAY_NAMES[selectedCat] : selected.label}</strong>
        <p>{selectedAchievement ? 'Unlocks with “' + selectedAchievement.name + '”' : 'Starter room decoration.'}</p>
        {selectedCat && selectedUnlocked && <div className="ajr-cat-poses" role="group"
          aria-label={'Choose ' + CAT_DISPLAY_NAMES[selectedCat] + ' pose'}>
          {(['sitting', 'sleeping'] as const).map(pose => <button key={pose} type="button"
            aria-pressed={(preferences.catPoses?.[selectedCat] ?? 'sitting') === pose}
            onClick={() => setCatPose(selectedCat, pose)}>
            {pose === 'sitting' ? 'Sitting' : 'Sleeping'}
          </button>)}
        </div>}
      </div>
      {selectedUnlocked && selectedPrimary && <button type="button" className="ajr-item-action" onClick={() => toggle(selectedPrimary)}>
        {isItemVisible(selectedPrimary, preferences) ? 'Hide' : 'Show'}
      </button>}
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
      {COLLECTION_ITEMS.filter(i => category === 'All' || i.category === category).map(item => {
        const cat = catNameForRoomItem(item.id);
        const primary = cat ? ROOM_CAT_ITEMS[cat].main : item.id;
        const pose = cat ? preferences.catPoses?.[cat] ?? 'sitting' : null;
        const displayed = cat ? ITEMS.find(i => i.id === catPoseItem(cat, pose!)) ?? item : item;
        const unlocked = unlockedIds.includes(primary);
        const visible = unlocked && isItemVisible(primary, preferences);
        const chosen = preferences.placements?.[primary] === 1 ? 1 : 0;
        const label = cat ? CAT_DISPLAY_NAMES[cat] : item.label;
        return <div className={'ajr-collection-item ' + (!unlocked ? 'locked' : '')} key={primary}>
          <span className="ajr-collection-icon" aria-hidden="true">
            <ItemThumbnail item={displayed} />
          </span>
          <div className="ajr-collection-content">
            <strong>{label}</strong>
            <small>{unlocked ? item.category : 'Locked · ' +
              (sourceAchievement(primary)?.name ?? 'Starter')}</small>
            {cat && unlocked && <div className="ajr-cat-poses" role="group" aria-label={'Choose ' + label + ' pose'}>
              {(['sitting', 'sleeping'] as const).map(option => <button type="button" key={option}
                aria-pressed={pose === option} onClick={() => setCatPose(cat, option)}>
                {option === 'sitting' ? 'Sitting' : 'Sleeping'}
              </button>)}
            </div>}
            {editing && unlocked && visible && item.slots.length > 1 && <div className="ajr-placement" role="group" aria-label={label + ' position'}>
              {item.slots.map((_, index) => <button key={index} type="button"
                aria-pressed={chosen === index}
                onClick={() => place(primary, index)}>
                Spot {index + 1}
              </button>)}
            </div>}
          </div>
          <button type="button" role="switch" aria-checked={visible}
            disabled={!unlocked} aria-label={'Show ' + label + ' in your room'}
            className={'ajr-toggle ' + (visible ? 'on' : '')} onClick={() => toggle(primary)}>
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
