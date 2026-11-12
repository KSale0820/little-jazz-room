import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalRepository } from '../repository/localRepository';
import { createChartRepository } from '../features/charts/chartRepository';
import { cumulativePracticeMinutes } from './companionUnlocks';
import { computeScheduledStreak } from './practiceStats';
import { readLocalList, journalKey, notesKey, type PracticeJournalEntry, type ChartNote } from './practicePlayerNotes';
import { readProfileName } from './profileName';
import { readPracticeGoal } from './practiceHomePreferences';
import {
  DEMO_SCOPE, DEMO_NAME, DEMO_CHART_ID, DEMO_ROUTINE_ID,
  seedDemoProfile, clearDemoProfile, isDemoProfileActive, setDemoProfileActive,
} from './demoProfile';

const data = new Map<string, string>();
const storage = {
  get length() { return data.size; },
  key(index: number) { return [...data.keys()][index] ?? null; },
  getItem(key: string) { return data.get(key) ?? null; },
  setItem(key: string, value: string) { data.set(key, String(value)); },
  removeItem(key: string) { data.delete(key); },
  clear() { data.clear(); },
};

describe('opt-in sample musician fixture', () => {
  beforeEach(() => {
    data.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-12T06:42:00Z'));
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { localStorage: storage });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('seeds real storage formats for stats, journal, annotations, custom content and companions', () => {
    seedDemoProfile();
    const repo = createLocalRepository(DEMO_SCOPE);
    const sessions = repo.listSessions();
    const charts = createChartRepository(DEMO_SCOPE).listCharts();
    const routine = repo.listLocalRoutines().find(item => item.id === DEMO_ROUTINE_ID);
    const exercises = repo.listLocalExercises();
    const journals = readLocalList<PracticeJournalEntry>(journalKey(DEMO_SCOPE));
    const notes = readLocalList<ChartNote>(notesKey(DEMO_SCOPE, DEMO_CHART_ID));

    expect(sessions).toHaveLength(20);
    expect(computeScheduledStreak(sessions, [])).toBe(8);
    expect(cumulativePracticeMinutes(sessions)).toBeGreaterThan(300);
    expect(journals.length).toBeGreaterThanOrEqual(10);
    expect(journals.every(item => sessions.some(session => item.sessionId === session.id))).toBe(true);
    expect(notes.length).toBeGreaterThanOrEqual(5);
    expect(charts.find(chart => chart.id === DEMO_CHART_ID)?.bars).toHaveLength(16);
    expect(routine?.steps).toHaveLength(3);
    expect(routine?.steps.every(step => exercises.some(exercise => exercise.id === step.exercise_id))).toBe(true);
    expect(exercises.find(exercise => exercise.id === 'local-ex-demo-guide-tones')?.chart_id).toBe(DEMO_CHART_ID);
    expect(readPracticeGoal(DEMO_SCOPE)).toBe(30);
    expect(readProfileName(DEMO_SCOPE)).toBe(DEMO_NAME);
  });

  it('does not duplicate sessions or erase edits when opened again', () => {
    seedDemoProfile();
    const repo = createLocalRepository(DEMO_SCOPE);
    const chartRepo = createChartRepository(DEMO_SCOPE);
    const chart = chartRepo.getChart(DEMO_CHART_ID)!;
    chartRepo.saveChart({ ...chart, title: 'Edited by tester' });
    seedDemoProfile();
    expect(repo.listSessions()).toHaveLength(20);
    expect(chartRepo.getChart(DEMO_CHART_ID)?.title).toBe('Edited by tester');
  });

  it('keeps all sample data isolated and only clears sample keys', () => {
    data.set('little-jazz-room:practice-sessions:v1:anonymous', 'real-local-sessions');
    data.set('little-jazz-room:profile-name:v1:another-user', 'real-user');
    seedDemoProfile();
    setDemoProfileActive(true);
    expect(isDemoProfileActive()).toBe(true);
    clearDemoProfile();
    expect(createLocalRepository(DEMO_SCOPE).listSessions()).toHaveLength(0);
    expect(createChartRepository(DEMO_SCOPE).listCharts()).toHaveLength(0);
    expect(data.get('little-jazz-room:practice-sessions:v1:anonymous')).toBe('real-local-sessions');
    expect(data.get('little-jazz-room:profile-name:v1:another-user')).toBe('real-user');
    expect(isDemoProfileActive()).toBe(true);
    setDemoProfileActive(false);
    expect(isDemoProfileActive()).toBe(false);
  });
});
