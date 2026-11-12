import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Routine } from '../types/content';
import { routineIconFor, routineIconPosition } from '../lib/routinePixelIcons';
import { readRoutineBookmarks, saveRoutineBookmarks } from '../lib/routineBookmarks';
import './RoutineLibraryPage.css';

type RoutineTab = 'Library' | 'Community' | 'My Routines';
type Filters = { instrument: string; goal: string; duration: string; level: string };
type Shelf = { key: string; title: string; items: Routine[] };

const initialFilters: Filters = { instrument: '', goal: '', duration: '', level: '' };

/**
 * Related-skill shelves intentionally cross-list existing guided routines.
 * This makes smaller categories browseable without inventing new presets.
 */
const relatedSeedShelves: Record<string, readonly string[]> = {
  'rhythm-time': ['Warm-Ups'],
  'no-backing': ['Warm-Ups'],
  'first-improv': ['Technique'],
  'ii-v-i-workout': ['Technique', 'Improvisation'],
  'comping-basics': ['Technique'],
  'walking-bass': ['Rhythm & Timing'],
  'jazz-standards-starter': ['Ear Training'],
  '12bar-blues': ['Ear Training'],
  'forms-and-ballads': ['Standards & Repertoire'],
};

/**
 * Small-card labels only. Full routine titles remain unchanged in data, search,
 * player navigation and accessible button names.
 */
const compactRoutineTitles: Record<string, string> = {
  'rhythm-time': 'Rhythm Warm-Up',
  'no-backing': 'Without a Backing Track',
  'ii-v-i-workout': 'II–V–I Workout',
  'jazz-standards-starter': 'Jazz Song Forms',
  'rhythm-changes-starter': 'Rhythm Changes',
  'comping-basics': 'Comping Basics',
  'walking-bass': 'Walking Bass Basics',
  'intermediate-solo': 'Longer Jazz Solos',
  'first-minor-bossa': 'Minor Bossa Basics',
  'forms-and-ballads': 'Ballad Chords & Forms',
  'ear-training': 'Hear & Sing Notes',
};

const featuredShelfOrder: Record<string, readonly string[]> = {
  'Warm-Ups': ['daily-warm-up', 'rhythm-time', 'no-backing'],
  'Standards & Repertoire': ['12bar-blues', 'jazz-standards-starter', 'rhythm-changes-starter', 'forms-and-ballads'],
  'Technique': ['first-improv', 'ii-v-i-workout', 'comping-basics', 'walking-bass'],
  'Improvisation': ['first-improv', 'intermediate-solo', 'ii-v-i-workout'],
};

const librarySections = [
  'Warm-Ups',
  'Standards & Repertoire',
  'Technique',
  'Improvisation',
  'Harmony & Chords',
  'Rhythm & Timing',
  'Ear Training',
  'Other Practice',
] as const;

function tabFromUrl(value: string | null): RoutineTab {
  if (value === 'shared' || value === 'community') return 'Community';
  if (value === 'my' || value === 'saved') return 'My Routines';
  return 'Library';
}

function routineGoal(routine: Routine): string {
  const goal = (routine as Routine & { goal?: string }).goal?.trim();
  if (goal) return goal;
  return '';
}

function shelfForRoutine(routine: Routine, categories: string[]): string {
  const title = routine.title.toLowerCase();
  const goal = routineGoal(routine).toLowerCase();
  if (/warm.?up|scales|arpeggios|long tones/.test(title)) return 'Warm-Ups';
  if (goal === 'repertoire' || goal === 'jazz standards' ||
    /standard|song form|12.bar blues|rhythm changes|ballad/.test(title)) return 'Standards & Repertoire';
  if (goal === 'improvisation' || /improv|solo|call.and.response/.test(title)) return 'Improvisation';
  if (goal === 'ear training' || /ear training|transcri/.test(title)) return 'Ear Training';
  if (goal === 'rhythm' || goal === 'rhythm & harmony' ||
    /rhythm|swing|bossa|tempo|backing track/.test(title)) return 'Rhythm & Timing';
  if (goal === 'harmony' || /chord|voicing|comping|ii.v.i/.test(title)) return 'Harmony & Chords';
  if (goal === 'technique' || categories.includes('Technique')) return 'Technique';
  if (categories.includes('Improvisation')) return 'Improvisation';
  if (categories.includes('Repertoire')) return 'Standards & Repertoire';
  return 'Other Practice';
}

function matchesGoal(routine: Routine, section: string, filterGoal: string): boolean {
  if (!filterGoal) return true;
  const goal = routineGoal(routine);
  if (goal.toLowerCase().includes(filterGoal.toLowerCase())) return true;
  if (filterGoal === 'Standards') return section === 'Standards & Repertoire';
  if (filterGoal === 'Technique') return section === 'Technique' || section === 'Warm-Ups';
  if (filterGoal === 'Harmony') return section === 'Harmony & Chords';
  if (filterGoal === 'Rhythm') return section === 'Rhythm & Timing';
  if (filterGoal === 'Ear Training') return section === 'Ear Training';
  return section === filterGoal;
}

export function RoutineLibraryPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { repo, routines, publicRoutines, exercises, setActiveRoutineId } = useApp();
  const urlTab = params.get('tab');
  const [tab, setTab] = useState<RoutineTab>(() => tabFromUrl(urlTab));
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [focusedShelf, setFocusedShelf] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(() => readRoutineBookmarks(repo.scope));

  useEffect(() => { setBookmarks(readRoutineBookmarks(repo.scope)); }, [repo.scope]);
  useEffect(() => {
    setTab(tabFromUrl(urlTab));
    setFocusedShelf(null);
  }, [urlTab]);

  const exerciseMap = useMemo(() => new Map(exercises.map(exercise => [exercise.id, exercise])), [exercises]);
  const combinedRoutines = useMemo(() =>
    [...new Map([...routines, ...publicRoutines].map(routine => [routine.id, routine] as const)).values()],
    [routines, publicRoutines]);

  const sourceShelves = useMemo((): Shelf[] => {
    if (tab === 'My Routines') {
      return [
        { key: 'saved', title: 'Saved Routines',
          items: combinedRoutines.filter(routine => bookmarks.includes(routine.id)) },
        { key: 'created', title: 'Created by Me',
          items: routines.filter(routine => routine.is_seed === false) },
      ];
    }

    const source = tab === 'Community'
      ? publicRoutines.filter(routine => routine.visibility === 'public')
      : routines.filter(routine => routine.is_seed !== false).sort((a, b) =>
        Number(b.id === 'daily-warm-up') - Number(a.id === 'daily-warm-up'));
    const groups = new Map<string, Routine[]>(librarySections.map(title => [title, []]));
    source.forEach(routine => {
      const categories = routine.steps.map(step => exerciseMap.get(step.exercise_id)?.category ?? '');
      const primary = shelfForRoutine(routine, categories);
      groups.get(primary)?.push(routine);
      // Curate related Library shelves from real seeded content. No duplication within a shelf.
      if (tab === 'Library') {
        for (const related of relatedSeedShelves[routine.id] ?? []) {
          if (related !== primary) groups.get(related)?.push(routine);
        }
      }
    });
    return [...groups].filter(([, items]) => items.length > 0)
      .map(([title, items]) => {
        const order = featuredShelfOrder[title];
        if (tab === 'Library' && order) {
          items.sort((a, b) => {
            const rankA = order.indexOf(a.id);
            const rankB = order.indexOf(b.id);
            return (rankA < 0 ? 99 : rankA) - (rankB < 0 ? 99 : rankB);
          });
        }
        return { key: title, title, items };
      });
  }, [tab, bookmarks, combinedRoutines, routines, publicRoutines, exerciseMap]);

  const searching = Boolean(query.trim() || Object.values(filters).some(Boolean));
  const visibleShelves = useMemo(() => sourceShelves
    .map(shelf => ({
      ...shelf,
      items: shelf.items.filter(routine => {
        const linked = routine.steps.map(step => exerciseMap.get(step.exercise_id));
        const categories = linked.map(exercise => exercise?.category ?? '');
        const section = shelfForRoutine(routine, categories);
        const text = [routine.title, routine.description ?? '', routineGoal(routine),
          ...linked.flatMap(exercise => exercise
            ? [exercise.title, exercise.category, exercise.instructions] : [])].join(' ').toLowerCase();
        if (!query.trim().toLowerCase().split(/\s+/).every(word => text.includes(word))) return false;
        if (filters.instrument && !(routine.applicable_instruments ?? ['All'])
          .some(instrument => instrument === 'All' || instrument === filters.instrument)) return false;
        if (filters.level && routine.level !== filters.level) return false;
        if (filters.duration) {
          const max = Number(filters.duration);
          if (max === 15 && routine.duration_minutes > 15) return false;
          if (max === 30 && (routine.duration_minutes <= 15 || routine.duration_minutes > 30)) return false;
          if (max === 60 && routine.duration_minutes <= 30) return false;
        }
        return matchesGoal(routine, section, filters.goal);
      }),
    }))
    .filter(shelf => shelf.items.length > 0 || (tab === 'My Routines' && !searching)),
    [sourceShelves, exerciseMap, query, filters, tab, searching]);

  const focused = focusedShelf ? visibleShelves.find(shelf => shelf.key === focusedShelf) : undefined;
  const hasResults = visibleShelves.some(shelf => shelf.items.length > 0);
  const isEmptyCommunity = tab === 'Community' && !publicRoutines.some(routine => routine.visibility === 'public');

  const switchTab = (next: RoutineTab) => {
    setTab(next);
    setFocusedShelf(null);
    setQuery('');
    setFilters(initialFilters);
    setParams(next === 'Library' ? {} : { tab: next === 'Community' ? 'shared' : 'my' });
  };

  const toggleBookmark = (id: string) => {
    setBookmarks(previous => {
      const next = previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id];
      saveRoutineBookmarks(repo.scope, next);
      return next;
    });
  };

  const openRoutine = (id: string) => {
    setActiveRoutineId(id);
    navigate('/player?routine=' + encodeURIComponent(id));
  };

  const setFilter = (name: keyof Filters, value: string) => {
    setFocusedShelf(null);
    setFilters(current => ({ ...current, [name]: value }));
  };

  const renderCard = (routine: Routine) => {
    const section = shelfForRoutine(routine,
      routine.steps.map(step => exerciseMap.get(step.exercise_id)?.category ?? ''));
    const saved = bookmarks.includes(routine.id);
    const icon = routineIconFor(routine.title, section);
    return (
      <article className="routine-card" key={routine.id}>
        <button type="button" className="routine-card-main"
          onClick={() => openRoutine(routine.id)}
          aria-label={'Open ' + routine.title + ' in player'} title={routine.title}>
          <span className="routine-card-icon-slot" data-icon-key={icon}
            style={{ backgroundPosition: routineIconPosition(icon) }} aria-hidden="true" />
          <span className="routine-card-title">{compactRoutineTitles[routine.id] ?? routine.title}</span>
        </button>
        <div className="routine-card-tags" aria-label={routine.duration_minutes + ' minutes, ' + routine.level}>
          <span className="routine-card-duration">◷ {routine.duration_minutes} min</span>
          <span className={'routine-card-level' + (/intermediate|advanced/i.test(routine.level) ? ' is-intermediate' : '')}>{routine.level}</span>
        </div>
        <button type="button" className={'routine-bookmark' + (saved ? ' is-saved' : '')}
          aria-label={(saved ? 'Remove saved ' : 'Save ') + routine.title}
          aria-pressed={saved} onClick={() => toggleBookmark(routine.id)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5.5 3.5h13v17L12 16l-6.5 4.5z" />
          </svg>
        </button>
      </article>
    );
  };

  return (
    <section className="routine-library" aria-label="Routine library">
      <header className="routine-intro">
        <h1>Routines</h1>
        <p>Guided practice routines to build your skills.</p>
      </header>

      <div className="routine-tabs" role="tablist" aria-label="Routine sections">
        {(['Library', 'Community', 'My Routines'] as const).map(value => (
          <button key={value} type="button" role="tab" aria-selected={tab === value}
            className={tab === value ? 'is-selected' : ''}
            onClick={() => switchTab(value)}>{value}</button>
        ))}
      </div>

      <label className="routine-search-wrap">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"
          fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" />
        </svg>
        <span className="screen-reader-only">Search routines</span>
        <input type="search" placeholder="Search routines..." value={query}
          onChange={event => { setFocusedShelf(null); setQuery(event.target.value); }} />
      </label>

      <div className="routine-filters" aria-label="Routine filters">
        <label><span className="screen-reader-only">Instrument</span>
          <select value={filters.instrument} onChange={event => setFilter('instrument', event.target.value)}>
            <option value="">Instrument</option>
            {['Piano', 'Guitar', 'Alto Saxophone', 'Tenor Saxophone', 'Trumpet', 'Bass', 'Drums'].map(value =>
              <option key={value}>{value}</option>)}
          </select>
        </label>
        <label><span className="screen-reader-only">Practice goal</span>
          <select value={filters.goal} onChange={event => setFilter('goal', event.target.value)}>
            <option value="">Practice goal</option>
            {['Standards', 'Improvisation', 'Technique', 'Harmony', 'Rhythm', 'Ear Training'].map(value =>
              <option key={value}>{value}</option>)}
          </select>
        </label>
        <label><span className="screen-reader-only">Duration</span>
          <select value={filters.duration} onChange={event => setFilter('duration', event.target.value)}>
            <option value="">Duration</option>
            <option value="15">Up to 15 min</option>
            <option value="30">16–30 min</option>
            <option value="60">Over 30 min</option>
          </select>
        </label>
        <label><span className="screen-reader-only">Level</span>
          <select value={filters.level} onChange={event => setFilter('level', event.target.value)}>
            <option value="">Level</option>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </label>
      </div>

      {focused ? (
        <div className="routine-focused-shelf">
          <button className="routine-shelf-back" type="button" onClick={() => setFocusedShelf(null)}>
            ‹ All categories
          </button>
          <div className="routine-shelf-heading">
            <h2>{focused.title}</h2>
            <span className="routine-shelf-count">{focused.items.length} routines</span>
          </div>
          <div className="routine-focused-grid">{focused.items.map(renderCard)}</div>
        </div>
      ) : (
        <div className="routine-shelves">
          {visibleShelves.map(shelf => (
            <section className="routine-shelf" key={shelf.key} aria-label={shelf.title}>
              <div className="routine-shelf-heading">
                <h2>{shelf.title}</h2>
                {shelf.items.length > 0 && (
                  <button type="button" className="routine-see-all"
                    onClick={() => setFocusedShelf(shelf.key)}
                    aria-label={'See all ' + shelf.title + ' routines'}>
                    See all <span aria-hidden="true">›</span>
                  </button>
                )}
              </div>
              {shelf.items.length > 0 ? (
                <div className="routine-shelf-scroll" role="region"
                  aria-label={shelf.title + ' routines, scroll horizontally'} tabIndex={0}>
                  {shelf.items.map(renderCard)}
                </div>
              ) : (
                <div className="routine-shelf-empty">
                  {shelf.key === 'saved'
                    ? 'Bookmark routines from the Library or Community to keep them here.'
                    : 'Your own routines will appear here after you create one.'}
                </div>
              )}
            </section>
          ))}
          {!hasResults && (searching || tab !== 'My Routines') && (
            <div className="routine-empty">
              <strong>{isEmptyCommunity && !searching ? 'Community routines are not available yet' : 'No routines found'}</strong>
              <p>{isEmptyCommunity && !searching
                ? 'Public routine discovery is not available in the local class demo.'
                : 'Try a different search or clear your filters.'}</p>
              {searching && <button type="button" onClick={() => {
                setQuery(''); setFilters(initialFilters);
              }}>Clear filters</button>}
            </div>
          )}
        </div>
      )}

      <button type="button" className="routine-create-button" onClick={() => navigate('/create')}>
        <span aria-hidden="true">+</span> Create routine
      </button>
    </section>
  );
}
