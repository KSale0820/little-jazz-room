import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Routine } from '../types/content';
import './RoutineLibraryPage.css';

type RoutineTab = 'Presets' | 'My Routines' | 'Shared';
type Filters = { instrument: string; goal: string; duration: string; level: string };

const initialFilters: Filters = { instrument: '', goal: '', duration: '', level: '' };

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

function routineCategory(routine: Routine, exerciseCategories: string[]): string {
  const title = routine.title.toLowerCase();
  if (title.includes('blues') || title.includes('standard') || title.includes('song')) return 'Standards';
  if (title.includes('improv') || title.includes('solo')) return 'Improvisation';
  if (title.includes('warm') || title.includes('time') || title.includes('swing')) return 'Technique';
  if (exerciseCategories.includes('Repertoire')) return 'Standards';
  if (exerciseCategories.includes('Improvisation')) return 'Improvisation';
  return 'Technique';
}

export function RoutineLibraryPage() {
  const navigate = useNavigate();
  const { repo, routines, publicRoutines, exercises, setActiveRoutineId } = useApp();
  const [tab, setTab] = useState<RoutineTab>('Presets');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks(repo.scope));

  useEffect(() => setBookmarks(readBookmarks(repo.scope)), [repo.scope]);

  const exerciseMap = useMemo(() => new Map(exercises.map(exercise => [exercise.id, exercise])), [exercises]);

  const available = useMemo(() => {
    if (tab === 'Shared') return publicRoutines.filter(routine => routine.visibility === 'public');
    if (tab === 'My Routines') {
      return routines.filter(routine => routine.is_seed === false || bookmarks.includes(routine.id));
    }
    // Daily Jazz Warm-Up stays first for the class walkthrough; every preset remains reachable.
    return routines.filter(routine => routine.is_seed !== false).sort((a, b) =>
      Number(b.id === 'daily-warm-up') - Number(a.id === 'daily-warm-up')
    );
  }, [tab, routines, publicRoutines, bookmarks]);

  const shown = useMemo(() => available.filter(routine => {
    const linked = routine.steps.map(step => exerciseMap.get(step.exercise_id));
    const searchable = [routine.title, routine.description ?? '', ...linked.map(ex => ex?.title ?? '')]
      .join(' ').toLowerCase();
    if (!searchable.includes(query.trim().toLowerCase())) return false;
    if (filters.instrument && !routine.applicable_instruments.some(i => i === 'All' || i === filters.instrument)) return false;
    if (filters.level && routine.level !== filters.level) return false;
    if (filters.duration) {
      const max = Number(filters.duration);
      if (max === 30 && (routine.duration_minutes <= 15 || routine.duration_minutes > 30)) return false;
      if (max === 60 && routine.duration_minutes <= 30) return false;
      if (max === 15 && routine.duration_minutes > 15) return false;
    }
    if (filters.goal && routineCategory(routine, linked.map(ex => ex?.category ?? '')) !== filters.goal) return false;
    return true;
  }), [available, query, filters, exerciseMap]);

  const toggleBookmark = (id: string) => {
    setBookmarks(previous => {
      const next = previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id];
      try { localStorage.setItem(bookmarkKey(repo.scope), JSON.stringify(next)); } catch { /* optional storage */ }
      return next;
    });
  };

  const openRoutine = (id: string) => {
    setActiveRoutineId(id);
    navigate('/player');
  };

  const setFilter = (name: keyof Filters, value: string) =>
    setFilters(current => ({ ...current, [name]: value }));

  return (
    <section className="routine-library" aria-label="Routine library">
      <header className="routine-topbar">
        <button type="button" className="routine-back" onClick={() => navigate('/practice')} aria-label="Back to Practice">
          <span aria-hidden="true">‹</span> Back
        </button>
        <span>Practice routines</span>
        <span aria-hidden="true" className="routine-topbar-space" />
      </header>

      <div className="routine-intro">
        <p className="routine-eyebrow">Your practice, your pace</p>
        <h1>Practice routines</h1>
        <p>A little structure for the music you love.</p>
      </div>

      <div className="routine-tabs" role="tablist" aria-label="Routine sections">
        {(['Presets', 'My Routines', 'Shared'] as const).map(value => (
          <button key={value} type="button" role="tab" aria-selected={tab === value}
            className={tab === value ? 'is-selected' : ''}
            onClick={() => setTab(value)}>{value}</button>
        ))}
      </div>

      <label className="routine-search-wrap">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
        <span className="screen-reader-only">Search routines</span>
        <input type="search" placeholder="Search routines..." value={query} onChange={event => setQuery(event.target.value)} />
      </label>

      <div className="routine-filters" aria-label="Routine filters">
        <label><span className="screen-reader-only">Instrument</span>
          <select value={filters.instrument} onChange={e => setFilter('instrument', e.target.value)}>
            <option value="">Instrument</option>
            {['Piano', 'Guitar', 'Alto Saxophone', 'Tenor Saxophone', 'Trumpet', 'Bass', 'Drums'].map(value =>
              <option key={value}>{value}</option>)}
          </select>
        </label>
        <label><span className="screen-reader-only">Goal</span>
          <select value={filters.goal} onChange={e => setFilter('goal', e.target.value)}>
            <option value="">Goal</option><option>Standards</option><option>Improvisation</option><option>Technique</option>
          </select>
        </label>
        <label><span className="screen-reader-only">Duration</span>
          <select value={filters.duration} onChange={e => setFilter('duration', e.target.value)}>
            <option value="">Duration</option><option value="15">Up to 15 min</option>
            <option value="30">16–30 min</option><option value="60">Over 30 min</option>
          </select>
        </label>
        <label><span className="screen-reader-only">Level</span>
          <select value={filters.level} onChange={e => setFilter('level', e.target.value)}>
            <option value="">Level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </label>
      </div>

      <div className="routine-list-header">
        <h2>{tab === 'Presets' ? 'Start with a preset' : tab === 'Shared' ? 'Shared routines' : 'Your routines'}</h2>
        <span>{shown.length} {shown.length === 1 ? 'routine' : 'routines'}</span>
      </div>

      <div className="routine-list">
        {shown.map((routine, index) => {
          const category = routineCategory(routine, routine.steps.map(step => exerciseMap.get(step.exercise_id)?.category ?? ''));
          const isBookmarked = bookmarks.includes(routine.id);
          return (
            <article className="routine-card" key={routine.id}>
              <button className="routine-card-main" type="button" onClick={() => openRoutine(routine.id)}
                aria-label={'Open ' + routine.title + ' in player'}>
                <span className={'routine-card-art art-' + (index % 3)} aria-hidden="true">
                  {category === 'Improvisation' ? 'Ⅲ' : category === 'Standards' ? '♫' : '✳'}
                </span>
                <span className="routine-card-content">
                  <span className="routine-card-title">{routine.title}</span>
                  <span className="routine-card-desc">{routine.description || routine.steps.length + ' steps to build your playing.'}</span>
                  <span className="routine-card-tags">
                    <span>◷ {routine.duration_minutes} min</span>
                    <span>{routine.level}</span>
                    <span className="routine-tag-goal">{category}</span>
                  </span>
                </span>
              </button>
              <button type="button" className={'routine-bookmark' + (isBookmarked ? ' is-saved' : '')}
                aria-label={(isBookmarked ? 'Remove saved ' : 'Save ') + routine.title}
                aria-pressed={isBookmarked} onClick={() => toggleBookmark(routine.id)}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill={isBookmarked ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5.5 3.5h13v17L12 16l-6.5 4.5z"/></svg>
              </button>
            </article>
          );
        })}
        {shown.length === 0 && (
          <div className="routine-empty">
            <strong>{tab === 'Shared' && publicRoutines.length === 0 ? 'Sharing is Preview' : 'No routines found'}</strong>
            <p>{tab === 'Shared' && publicRoutines.length === 0
              ? 'Public community discovery is not available in the local class demo.'
              : tab === 'My Routines' && available.length === 0
                ? 'Create a routine or bookmark a preset to see it here.'
                : 'Try clearing your search or filters.'}</p>
            {(query || Object.values(filters).some(Boolean)) && <button type="button" onClick={() => {
              setQuery(''); setFilters(initialFilters);
            }}>Clear filters</button>}
          </div>
        )}
      </div>

      <button type="button" className="routine-create-button" onClick={() => navigate('/create')}>
        <span aria-hidden="true">＋</span> Create routine
      </button>
      <p className="routine-tip"><span aria-hidden="true">ⓘ</span>
        Tap a routine to practice its steps. Bookmark a preset or make your own.
      </p>
    </section>
  );
}
