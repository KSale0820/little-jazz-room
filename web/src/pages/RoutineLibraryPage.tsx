import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Exercise, Routine } from '../types/content';
import { readPinnedPracticeRoutine, savePinnedPracticeRoutine } from '../lib/practiceHomePreferences';
import {
  countRoutineFilters, EMPTY_ROUTINE_FILTERS, matchesRoutineFilters,
  ROUTINE_DURATIONS, ROUTINE_FOCI, ROUTINE_INSTRUMENTS, ROUTINE_LEVELS, routineFocuses,
  type RoutineFilters, type RoutineFocus,
} from './routineLibraryFilters';
import './RoutineLibraryPage.css';
import './CleanPixelRoutines.css';
import './RoutinePin.css';
import './RoutinesApproved.css';

type RoutineTab = 'My Routines' | 'Community' | 'Saved';

function bookmarkKey(scope: string): string {
  return 'little-jazz-room:routine-bookmarks:v1:' + scope;
}

function readBookmarks(scope: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(bookmarkKey(scope)) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
    fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9"
    strokeLinejoin="round"><path d="M5.5 3.5h13v17L12 16l-6.5 4.5z" /></svg>;
}

function FilterIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
    <circle cx="8" cy="6" r="2" fill="var(--color-surface)" />
    <circle cx="16" cy="12" r="2" fill="var(--color-surface)" />
    <circle cx="10" cy="18" r="2" fill="var(--color-surface)" />
  </svg>;
}

function cloneFilters(filters: RoutineFilters): RoutineFilters {
  return { ...filters, focus: [...filters.focus] };
}

export function RoutineLibraryPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { repo, routines, publicRoutines, exercises, setActiveRoutineId } = useApp();
  const [tab, setTab] = useState<RoutineTab>(() =>
    params.get('tab') === 'shared' ? 'Community' :
    params.get('tab') === 'saved' ? 'Saved' : 'My Routines');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<RoutineFilters>(() => cloneFilters(EMPTY_ROUTINE_FILTERS));
  const [draftFilters, setDraftFilters] = useState<RoutineFilters>(() => cloneFilters(EMPTY_ROUTINE_FILTERS));
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const filterClose = useRef<HTMLButtonElement>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks(repo.scope));
  const [pinnedId, setPinnedId] = useState<string | null>(() => readPinnedPracticeRoutine(repo.scope));

  useEffect(() => { setBookmarks(readBookmarks(repo.scope)); }, [repo.scope]);
  useEffect(() => { setPinnedId(readPinnedPracticeRoutine(repo.scope)); }, [repo.scope]);
  useEffect(() => {
    if (!filterOpen) return;
    filterClose.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFilterOpen(false);
      if (event.key !== 'Tab') return;
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(
        '.routine-filter-sheet button:not(:disabled)',
      ));
      if (!buttons.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      filterTrigger.current?.focus();
    };
  }, [filterOpen]);

  const exerciseMap = useMemo(() => new Map(exercises.map(exercise => [exercise.id, exercise])), [exercises]);
  const linkedExercises = (routine: Routine): Exercise[] => routine.steps
    .map(step => exerciseMap.get(step.exercise_id))
    .filter((value): value is Exercise => Boolean(value));

  const available = useMemo(() => {
    if (tab === 'Community') return publicRoutines.filter(routine => routine.visibility.toLowerCase() === 'public');
    if (tab === 'Saved') {
      return [...new Map([...routines, ...publicRoutines]
        .filter(routine => bookmarks.includes(routine.id))
        .map(routine => [routine.id, routine] as const)).values()];
    }
    // Library includes both built-in presets and locally created routines, without hiding entries.
    return [...routines].sort((a, b) => Number(b.id === 'daily-warm-up') - Number(a.id === 'daily-warm-up'));
  }, [tab, routines, publicRoutines, bookmarks]);

  const shown = useMemo(() => available.filter(routine => {
    const linked = linkedExercises(routine);
    const searchable = [
      routine.title, routine.description ?? '',
      (routine as Routine & { goal?: string }).goal ?? '',
      ...linked.flatMap(ex => [ex.title, ex.category, ex.description ?? '', ex.instructions]),
      ...routine.steps.map(step => step.snapshot?.title ?? ''),
    ].join(' ').toLowerCase();
    if (!query.trim().toLowerCase().split(/\s+/).every(word => searchable.includes(word))) return false;
    return matchesRoutineFilters(routine, filters, linked);
  }), [available, query, filters, exerciseMap]);

  const toggleBookmark = (id: string) => {
    setBookmarks(previous => {
      const next = previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id];
      try { localStorage.setItem(bookmarkKey(repo.scope), JSON.stringify(next)); } catch { /* optional storage */ }
      return next;
    });
  };
  const togglePin = (id: string) => {
    const next = pinnedId === id ? null : id;
    savePinnedPracticeRoutine(repo.scope, next);
    setPinnedId(next);
  };
  const openRoutine = (id: string) => {
    setActiveRoutineId(id);
    navigate('/player?routine=' + encodeURIComponent(id));
  };
  const openFilters = () => { setDraftFilters(cloneFilters(filters)); setFilterOpen(true); };
  const applyFilters = () => { setFilters(cloneFilters(draftFilters)); setFilterOpen(false); };
  const resetAllFilters = () => { setQuery(''); setFilters(cloneFilters(EMPTY_ROUTINE_FILTERS)); };
  const toggleFocus = (focus: RoutineFocus) => setDraftFilters(current => ({
    ...current,
    focus: current.focus.includes(focus)
      ? current.focus.filter(item => item !== focus) : [...current.focus, focus],
  }));
  const setDraft = (name: 'instrument' | 'duration' | 'level', value: string) =>
    setDraftFilters(current => ({ ...current, [name]: value }));

  return (
    <section className="routine-library routine-approved" aria-label="Routine library">
      <header className="routine-approved-header">
        <div className="routine-approved-title">
          <h1>Routines</h1>
          <span className="routine-approved-flourish" aria-hidden="true">✦</span>
          <img src="/visuals/new-assets/2026-11-07-sharp-pixel/music-note-purple-sharp.png"
            className="routine-approved-note" alt="" aria-hidden="true" />
        </div>
        <button type="button" className="routine-approved-create" onClick={() => navigate('/create')}>
          <span aria-hidden="true">+</span> Create
        </button>
      </header>

      <div className="routine-approved-search-row">
        <label className="routine-search-wrap">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22"
            fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" />
          </svg>
          <span className="screen-reader-only">Search routines</span>
          <input type="search" placeholder="Search routines..." value={query}
            onChange={event => setQuery(event.target.value)} />
        </label>
        <button type="button" className="routine-approved-filter-trigger" ref={filterTrigger}
          aria-label={'Filter routines' + (countRoutineFilters(filters) ? ', ' + countRoutineFilters(filters) + ' active' : '')}
          aria-haspopup="dialog" aria-expanded={filterOpen} aria-controls="routine-filter-sheet" onClick={openFilters}>
          <FilterIcon />
          {countRoutineFilters(filters) > 0 && <span className="routine-approved-filter-count">{countRoutineFilters(filters)}</span>}
        </button>
      </div>

      <div className="routine-tabs routine-approved-tabs" role="tablist" aria-label="Browse routines">
        {(['My Routines', 'Community', 'Saved'] as const).map(value => (
          <button key={value} role="tab" type="button" aria-selected={tab === value}
            className={tab === value ? 'is-selected' : ''}
            onClick={() => setTab(value)}>
            {value === 'Saved' && <BookmarkIcon filled={tab === 'Saved'} />}
            {value}
          </button>
        ))}
      </div>

      <div className="routine-approved-results" role="status" aria-live="polite">
        {query || countRoutineFilters(filters) ? (
          <span>{shown.length} {shown.length === 1 ? 'routine' : 'routines'} found</span>
        ) : <span className="screen-reader-only">{shown.length} routines</span>}
        {countRoutineFilters(filters) > 0 && <button type="button" onClick={() => setFilters(cloneFilters(EMPTY_ROUTINE_FILTERS))}>
          Clear filters
        </button>}
      </div>

      <div className="routine-list routine-approved-list">
        {shown.map(routine => {
          const isBookmarked = bookmarks.includes(routine.id);
          const pinned = pinnedId === routine.id;
          const focuses = routineFocuses(routine, linkedExercises(routine));
          const description = focuses.slice(0, 3).join(' · ');
          return (
            <article className="routine-card" key={routine.id}>
              <button type="button" className={'routine-bookmark' + (isBookmarked ? ' is-saved' : '')}
                aria-label={(isBookmarked ? 'Remove saved ' : 'Save ') + routine.title}
                aria-pressed={isBookmarked} onClick={() => toggleBookmark(routine.id)}>
                <BookmarkIcon filled={isBookmarked} />
              </button>
              <button type="button" className="routine-card-main"
                aria-label={'Practice ' + routine.title} onClick={() => openRoutine(routine.id)}>
                <span className="routine-card-content">
                  <strong className="routine-card-title">{routine.title}</strong>
                  <span className="routine-card-desc">{description || routine.description || routine.level}</span>
                </span>
                <span className="routine-approved-duration">{routine.duration_minutes} min</span>
                <span className="routine-approved-chevron" aria-hidden="true">›</span>
              </button>
              <button type="button" className={'routine-pin' + (pinned ? ' is-pinned' : '')}
                aria-label={(pinned ? 'Unpin ' : 'Pin ') + routine.title + ' on Practice home'}
                aria-pressed={pinned} onClick={() => togglePin(routine.id)}>
                {pinned ? 'Pinned' : 'Pin'}
              </button>
            </article>
          );
        })}
        {shown.length === 0 && (
          <div className="routine-empty">
            <strong>{tab === 'Community' && publicRoutines.length === 0
              ? 'Sharing is Preview' : tab === 'Saved' && !bookmarks.length
                ? 'No saved routines yet' : 'No routines found'}</strong>
            <p>{tab === 'Community' && publicRoutines.length === 0
              ? 'Public community discovery is not available in this demo.'
              : tab === 'Saved' && !bookmarks.length
                ? 'Save a routine with its bookmark icon to find it here.'
                : 'Try another search or adjust the filters.'}</p>
            {(Boolean(query) || countRoutineFilters(filters) > 0) && <button type="button" onClick={resetAllFilters}>Clear search and filters</button>}
          </div>
        )}
      </div>

      {filterOpen && (
        <div className="routine-filter-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) setFilterOpen(false);
        }}>
          <section className="routine-filter-sheet" id="routine-filter-sheet" role="dialog"
            aria-modal="true" aria-labelledby="routine-filter-title">
            <div className="routine-filter-handle" aria-hidden="true" />
            <div className="routine-filter-heading">
              <h2 id="routine-filter-title"><FilterIcon /> Filter Routines</h2>
              <button type="button" className="routine-filter-close" ref={filterClose}
                aria-label="Close filters" onClick={() => setFilterOpen(false)}>×</button>
            </div>
            <div className="routine-filter-scroll">
              <div className="routine-filter-group" role="group" aria-labelledby="routine-focus-title">
                <h3 id="routine-focus-title">Focus</h3>
                <div className="routine-filter-chips">
                  {ROUTINE_FOCI.map(focus => (
                    <button type="button" key={focus} className={draftFilters.focus.includes(focus) ? 'is-selected' : ''}
                      aria-pressed={draftFilters.focus.includes(focus)} onClick={() => toggleFocus(focus)}>{focus}</button>
                  ))}
                </div>
              </div>
              <div className="routine-filter-group" role="group" aria-labelledby="routine-instrument-title">
                <h3 id="routine-instrument-title">Instrument</h3>
                <div className="routine-filter-chips">
                  {ROUTINE_INSTRUMENTS.map(instrument => {
                    const selected = (draftFilters.instrument || 'All') === instrument;
                    return <button type="button" key={instrument} className={selected ? 'is-selected' : ''}
                      aria-pressed={selected} onClick={() => setDraft('instrument', instrument === 'All' ? '' : instrument)}>
                      {instrument}
                    </button>;
                  })}
                </div>
              </div>
              <div className="routine-filter-group" role="group" aria-labelledby="routine-duration-title">
                <h3 id="routine-duration-title">Duration</h3>
                <div className="routine-filter-chips">
                  {ROUTINE_DURATIONS.map(duration => (
                    <button type="button" key={duration.label}
                      className={draftFilters.duration === duration.value ? 'is-selected' : ''}
                      aria-pressed={draftFilters.duration === duration.value}
                      onClick={() => setDraft('duration', duration.value)}>{duration.label}</button>
                  ))}
                </div>
              </div>
              <div className="routine-filter-group" role="group" aria-labelledby="routine-level-title">
                <h3 id="routine-level-title">Level</h3>
                <div className="routine-filter-chips">
                  {ROUTINE_LEVELS.map(level => {
                    const selected = (draftFilters.level || 'Any') === level;
                    return <button type="button" key={level} className={selected ? 'is-selected' : ''}
                      aria-pressed={selected} onClick={() => setDraft('level', level === 'Any' ? '' : level)}>
                      {level}
                    </button>;
                  })}
                </div>
              </div>
            </div>
            <div className="routine-filter-actions">
              <button type="button" className="routine-filter-clear"
                onClick={() => setDraftFilters(cloneFilters(EMPTY_ROUTINE_FILTERS))}>Clear</button>
              <button type="button" className="routine-filter-apply" onClick={applyFilters}>Apply Filters</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
